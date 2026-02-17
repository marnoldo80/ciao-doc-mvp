import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
);

export async function POST(request: NextRequest) {
  try {
    const { patientId } = await request.json();

    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID mancante' }, { status: 400 });
    }

    // Recupera dati paziente
    const { data: patient } = await supabase
      .from('patients')
      .select('display_name, issues, goals, therapist_user_id')
      .eq('id', patientId)
      .single();

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

    const { data: plan } = await supabase
      .from('therapy_plan')
      .select('anamnesi, valutazione_psicodiagnostica, formulazione_caso')
      .eq('patient_id', patientId)
      .maybeSingle();

    const { data: sessionNotes } = await supabase
      .from('session_notes')
      .select('notes, ai_summary, session_date')
      .eq('patient_id', patientId)
      .order('session_date', { ascending: false })
      .limit(5);

    // Recupera risultati questionari (più recenti per tipo)
    const { data: questionnaireResults } = await supabase
      .from('questionnaire_results')
      .select('type, total, severity, created_at')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
      .limit(20);

    // ✅ CONTROLLO: Verifica se c'è abbastanza contesto clinico
    const hasMinimalContext =
      (patient?.issues && patient.issues.trim().length > 0) ||
      (patient?.goals && patient.goals.trim().length > 0) ||
      (plan?.anamnesi && plan.anamnesi.trim().length > 0) ||
      (plan?.valutazione_psicodiagnostica && plan.valutazione_psicodiagnostica.trim().length > 0) ||
      (plan?.formulazione_caso && plan.formulazione_caso.trim().length > 0) ||
      (sessionNotes && sessionNotes.length > 0 && sessionNotes.some(note =>
        (note.notes && note.notes.trim().length > 0) ||
        (note.ai_summary && note.ai_summary.trim().length > 0)
      )) ||
      (questionnaireResults && questionnaireResults.length > 0);

    if (!hasMinimalContext) {
      return NextResponse.json({
        error: 'Dati clinici insufficienti per generare suggerimenti appropriati. Compila almeno uno dei seguenti campi prima di richiedere suggerimenti IA:\n\n• Problematiche iniziali del paziente\n• Obiettivi terapeutici dichiarati\n• Anamnesi\n• Valutazione psicodiagnostica\n• Note di almeno una seduta'
      }, { status: 400 });
    }

    // Costruisci contesto per IA
    let context = `PAZIENTE: ${patient?.display_name || 'Non specificato'}\n\n`;

    if (patient?.issues && patient.issues.trim().length > 0) {
      context += `PROBLEMATICHE INIZIALI:\n${patient.issues}\n\n`;
    }

    if (patient?.goals && patient.goals.trim().length > 0) {
      context += `OBIETTIVI DICHIARATI:\n${patient.goals}\n\n`;
    }

    if (plan?.anamnesi && plan.anamnesi.trim().length > 0) {
      context += `ANAMNESI:\n${plan.anamnesi}\n\n`;
    }

    if (plan?.valutazione_psicodiagnostica && plan.valutazione_psicodiagnostica.trim().length > 0) {
      context += `VALUTAZIONE PSICODIAGNOSTICA:\n${plan.valutazione_psicodiagnostica}\n\n`;
    }

    if (plan?.formulazione_caso && plan.formulazione_caso.trim().length > 0) {
      context += `FORMULAZIONE DEL CASO:\n${plan.formulazione_caso}\n\n`;
    }

    // Aggiungi risultati questionari se disponibili
    if (questionnaireResults && questionnaireResults.length > 0) {
      // Prendi il risultato più recente per ogni tipo
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

    if (sessionNotes && sessionNotes.length > 0) {
      const validNotes = sessionNotes.filter(note =>
        (note.notes && note.notes.trim().length > 0) ||
        (note.ai_summary && note.ai_summary.trim().length > 0)
      );

      if (validNotes.length > 0) {
        context += `SEDUTE PRECEDENTI (ultime ${validNotes.length}):\n`;
        validNotes.forEach((note, i) => {
          context += `\nSeduta ${i + 1} (${new Date(note.session_date).toLocaleDateString('it-IT')}):\n`;
          if (note.ai_summary && note.ai_summary.trim().length > 0) {
            context += note.ai_summary + '\n';
          } else if (note.notes && note.notes.trim().length > 0) {
            context += note.notes.substring(0, 500) + '...\n';
          }
        });
      }
    }

    // Costruisci system prompt con orientamento teorico
    const orientationSection = therapeuticOrientation
      ? `\nORIENTAMENTO TERAPEUTICO DEL CLINICO: ${therapeuticOrientation}
Adatta tecniche, obiettivi ed esercizi coerentemente con questo approccio. Se l'orientamento è CBT, privilegia ristrutturazione cognitiva, registri pensieri, esposizione graduale. Se è ACT, privilegia defusione cognitiva, valori, accettazione. Se è psicodinamico, privilegia insight, dinamiche relazionali, elaborazione. Se è sistemico-relazionale, considera il contesto familiare e relazionale. Adattati all'orientamento specificato.\n`
      : '\nNon è specificato un orientamento teorico: usa un approccio eclettico evidence-based.\n';

    const systemPrompt = `Sei uno psicoterapeuta esperto. Sulla base delle informazioni cliniche fornite, suggerisci un piano terapeutico strutturato ed evidence-based.
${orientationSection}
Genera suggerimenti in formato JSON con questa struttura esatta:
{
  "obiettivi_generali": ["obiettivo 1", "obiettivo 2", "obiettivo 3"],
  "obiettivi_specifici": ["obiettivo specifico 1", "obiettivo specifico 2", "obiettivo specifico 3"],
  "esercizi": ["esercizio 1", "esercizio 2", "esercizio 3"],
  "note": "Breve spiegazione del razionale clinico (max 200 parole)"
}

LINEE GUIDA:
- Obiettivi generali: ampi, orientati al cambiamento globale
- Obiettivi specifici: misurabili, concreti, SMART
- Esercizi: pratici, graduali, coerenti con l'orientamento del clinico
- Se ci sono risultati di questionari clinici, tienine conto nella prioritizzazione (es. punteggi alti di depressione → priorità agli interventi sull'umore)
- Basati SOLO sui dati disponibili, non inventare informazioni
- Se i dati sono parziali, fornisci comunque suggerimenti utili basandoti su quello che è disponibile

Rispondi SOLO con il JSON, senza altro testo.`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: context }
        ],
        temperature: 0.5,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Errore Groq:', errorText);
      return NextResponse.json({ error: 'Errore generazione suggerimenti' }, { status: 500 });
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || '';

    try {
      let clean = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const suggestions = JSON.parse(clean);
      return NextResponse.json({ suggestions });
    } catch (parseError) {
      console.error('Errore parsing JSON IA:', aiResponse);
      return NextResponse.json({ error: 'Formato risposta IA non valido' }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Errore suggerimenti piano:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
