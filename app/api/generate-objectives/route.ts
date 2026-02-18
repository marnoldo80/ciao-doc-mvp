import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { callGemini } from '@/lib/gemini';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
);

export async function POST(request: NextRequest) {
  try {
    // lastSessionOnly=true → usa solo l'ultima seduta (chiamato dalla pagina seduta post-trascrizione)
    const { patientId, lastSessionOnly = false, transcriptText } = await request.json();

    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID mancante' }, { status: 400 });
    }

    // Recupera informazioni paziente + therapist_user_id
    const { data: patient } = await supabase
      .from('patients')
      .select('display_name, issues, goals, therapist_user_id')
      .eq('id', patientId)
      .single();

    if (!patient) {
      return NextResponse.json({ error: 'Paziente non trovato' }, { status: 404 });
    }

    // Recupera orientamento terapeutico del terapeuta
    let therapeuticOrientation = '';
    if (patient?.therapist_user_id) {
      const { data: therapist } = await supabase
        .from('therapists')
        .select('therapeutic_orientation')
        .eq('user_id', patient.therapist_user_id)
        .single();
      therapeuticOrientation = therapist?.therapeutic_orientation || '';
    }

    // Recupera sedute: solo ultima o tutte, in base al parametro
    let sessionNotes: any[] = [];
    if (lastSessionOnly) {
      // Se è stata passata una trascrizione live, usala direttamente
      if (transcriptText) {
        sessionNotes = [{ notes: transcriptText, ai_summary: null, session_date: new Date().toISOString() }];
      } else {
        // Altrimenti prendi l'ultima seduta salvata
        const { data } = await supabase
          .from('session_notes')
          .select('notes, ai_summary, session_date')
          .eq('patient_id', patientId)
          .order('session_date', { ascending: false })
          .limit(1);
        sessionNotes = data || [];
      }
    } else {
      // Tutte le sedute (per il pulsante "Genera da sedute" nella scheda paziente)
      const { data } = await supabase
        .from('session_notes')
        .select('notes, ai_summary, session_date')
        .eq('patient_id', patientId)
        .order('session_date', { ascending: true });
      sessionNotes = data || [];
    }

    if (!sessionNotes || sessionNotes.length === 0) {
      return NextResponse.json({ error: 'Nessuna seduta trovata per questo paziente' }, { status: 400 });
    }

    // Recupera piano terapeutico per contesto (solo se non lastSessionOnly)
    let plan: any = null;
    if (!lastSessionOnly) {
      const { data } = await supabase
        .from('therapy_plan')
        .select('anamnesi, valutazione_psicodiagnostica, formulazione_caso')
        .eq('patient_id', patientId)
        .maybeSingle();
      plan = data;
    }

    // Recupera risultati questionari
    const { data: questionnaireResults } = await supabase
      .from('questionnaire_results')
      .select('type, total, severity, created_at')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
      .limit(20);

    // Costruisci contesto
    let context = `PAZIENTE: ${patient.display_name}\n\n`;

    if (patient?.issues) {
      context += `PROBLEMATICHE: ${patient.issues}\n\n`;
    }

    if (plan?.anamnesi) {
      context += `ANAMNESI:\n${plan.anamnesi}\n\n`;
    }
    if (plan?.valutazione_psicodiagnostica) {
      context += `VALUTAZIONE PSICODIAGNOSTICA:\n${plan.valutazione_psicodiagnostica}\n\n`;
    }
    if (plan?.formulazione_caso) {
      context += `FORMULAZIONE DEL CASO:\n${plan.formulazione_caso}\n\n`;
    }

    // Aggiungi risultati questionari se disponibili
    if (questionnaireResults && questionnaireResults.length > 0) {
      const latestByType = new Map<string, typeof questionnaireResults[0]>();
      for (const r of questionnaireResults) {
        if (!latestByType.has(r.type)) latestByType.set(r.type, r);
      }
      context += `RISULTATI QUESTIONARI CLINICI:\n`;
      for (const [, r] of latestByType) {
        const date = new Date(r.created_at).toLocaleDateString('it-IT');
        context += `• ${r.type}: punteggio ${r.total}${r.severity ? ` → ${r.severity}` : ''} (${date})\n`;
      }
      context += '\n';
    }

    if (lastSessionOnly) {
      context += `CONTENUTO DELLA SEDUTA (da analizzare):\n`;
      const note = sessionNotes[0];
      const sessionDate = new Date(note.session_date).toLocaleDateString('it-IT');
      context += `Seduta del ${sessionDate}:\n`;
      if (note.ai_summary) {
        context += note.ai_summary + '\n';
      } else if (note.notes) {
        context += note.notes + '\n';
      }
    } else {
      context += `TUTTE LE SEDUTE TERAPEUTICHE (${sessionNotes.length} sedute):\n`;
      sessionNotes.forEach((note, i) => {
        const sessionDate = new Date(note.session_date).toLocaleDateString('it-IT');
        context += `\nSeduta ${i + 1} (${sessionDate}):\n`;
        if (note.ai_summary) {
          context += note.ai_summary + '\n';
        } else if (note.notes) {
          context += note.notes + '\n';
        }
      });
    }

    // System prompt con orientamento
    const orientationSection = therapeuticOrientation
      ? `\nORIENTAMENTO TERAPEUTICO DEL CLINICO: ${therapeuticOrientation}
Genera obiettivi ed esercizi coerenti con questo approccio. Usa tecniche, terminologia e framework tipici di questo orientamento.\n`
      : '\nUsa un approccio eclettico evidence-based.\n';

    const sessionScope = lastSessionOnly
      ? 'Analizza il contenuto di questa singola seduta e genera obiettivi ed esercizi specifici per il prossimo periodo, basati su quanto emerso.'
      : 'Analizza il percorso terapeutico completo e genera obiettivi ed esercizi che tengano conto della progressione del paziente.';

    const systemPrompt = `Sei uno psicoterapeuta clinico esperto. ${sessionScope}
${orientationSection}
Genera suggerimenti in formato JSON con questa struttura esatta:
{
  "obiettivi_generali": ["obiettivo generale 1", "obiettivo generale 2", "obiettivo generale 3"],
  "obiettivi_specifici": ["obiettivo specifico 1", "obiettivo specifico 2", "obiettivo specifico 3", "obiettivo specifico 4"],
  "esercizi": ["esercizio pratico 1", "esercizio pratico 2", "esercizio pratico 3", "esercizio pratico 4"]
}

ISTRUZIONI:
- Obiettivi generali: ampi, strategici, orientati al cambiamento complessivo
- Obiettivi specifici: concreti, misurabili, SMART, collegati ai contenuti emersi
- Esercizi: pratici, graduali, coerenti con l'orientamento teorico del clinico
- Se ci sono risultati di questionari, usali per prioritizzare (punteggi elevati = maggiore urgenza)
- Basati SOLO sui dati disponibili, non inventare
- Fornisci comunque suggerimenti utili anche se i dati sono parziali

Rispondi SOLO con il JSON, senza altro testo.`;

    const aiResponse = await callGemini({
      systemPrompt,
      userPrompt: context,
      temperature: 0.3,
      maxTokens: 2000,
    });

    try {
      let cleanResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      cleanResponse = cleanResponse.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');

      const objectives = JSON.parse(cleanResponse);

      if (!objectives.obiettivi_generali || !objectives.obiettivi_specifici || !objectives.esercizi) {
        throw new Error('Struttura JSON non valida - campi mancanti');
      }

      return NextResponse.json({
        obiettivi_generali: objectives.obiettivi_generali || [],
        obiettivi_specifici: objectives.obiettivi_specifici || [],
        esercizi: objectives.esercizi || [],
        sessions_analyzed: sessionNotes.length,
        patient_name: patient.display_name,
        last_session_only: lastSessionOnly,
      });
    } catch (parseError) {
      console.error('Errore parsing JSON IA:', parseError);
      return NextResponse.json({
        obiettivi_generali: ['Obiettivo generale da definire manualmente'],
        obiettivi_specifici: ['Obiettivo specifico da definire manualmente'],
        esercizi: ['Esercizio da definire manualmente'],
        sessions_analyzed: sessionNotes.length,
        patient_name: patient.display_name,
        error_info: 'Risposta IA non parsabile, forniti placeholder'
      });
    }

  } catch (error: any) {
    console.error('Errore generazione obiettivi:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
