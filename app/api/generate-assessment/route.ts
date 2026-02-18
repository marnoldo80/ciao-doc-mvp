import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { callGemini } from '@/lib/gemini';

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

    // Recupera dati paziente + therapist_user_id
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

    // Recupera TUTTE le sedute
    const { data: sessionNotes } = await supabase
      .from('session_notes')
      .select('notes, ai_summary, session_date, themes')
      .eq('patient_id', patientId)
      .order('session_date', { ascending: true });

    if (!sessionNotes || sessionNotes.length === 0) {
      return NextResponse.json({
        error: 'Nessuna seduta disponibile. Registra almeno 1-2 sedute prima di generare la valutazione.'
      }, { status: 400 });
    }

    // Recupera risultati questionari
    const { data: questionnaireResults } = await supabase
      .from('questionnaire_results')
      .select('type, total, severity, created_at')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
      .limit(30);

    // Costruisci contesto completo
    let context = `PAZIENTE: ${patient?.display_name || 'Non specificato'}\n\n`;

    if (patient?.issues) {
      context += `PROBLEMATICHE INIZIALI:\n${patient.issues}\n\n`;
    }

    if (patient?.goals) {
      context += `OBIETTIVI DICHIARATI:\n${patient.goals}\n\n`;
    }

    // Aggiungi risultati questionari se disponibili
    if (questionnaireResults && questionnaireResults.length > 0) {
      // Prendi il risultato più recente per ogni tipo
      const latestByType = new Map<string, typeof questionnaireResults[0]>();
      for (const r of questionnaireResults) {
        if (!latestByType.has(r.type)) latestByType.set(r.type, r);
      }
      context += `RISULTATI QUESTIONARI CLINICI (più recenti):\n`;
      for (const [, r] of latestByType) {
        const date = new Date(r.created_at).toLocaleDateString('it-IT');
        context += `• ${r.type}: punteggio ${r.total}${r.severity ? ` → ${r.severity}` : ''} (${date})\n`;
      }
      context += '\n';
    }

    context += `SEDUTE REGISTRATE (${sessionNotes.length} totali):\n\n`;

    sessionNotes.forEach((note, i) => {
      context += `--- SEDUTA ${i + 1} (${new Date(note.session_date).toLocaleDateString('it-IT')}) ---\n`;

      if (note.ai_summary) {
        context += `Riassunto IA:\n${note.ai_summary}\n\n`;
      }

      if (note.notes) {
        context += `Note:\n${note.notes}\n\n`;
      }

      if (note.themes && Array.isArray(note.themes) && note.themes.length > 0) {
        context += `Temi: ${note.themes.join(', ')}\n\n`;
      }
    });

    // System prompt con orientamento teorico
    const orientationSection = therapeuticOrientation
      ? `\nORIENTAMENTO TERAPEUTICO DEL CLINICO: ${therapeuticOrientation}
Usa il framework teorico e il linguaggio clinico tipico di questo approccio nella formulazione del caso. La formulazione_caso deve riflettere la concettualizzazione propria di questo orientamento.\n`
      : '\nUsa un approccio clinico eclettico e integrato.\n';

    const systemPrompt = `Sei uno psicoterapeuta clinico esperto. Sulla base delle sedute registrate${questionnaireResults && questionnaireResults.length > 0 ? ' e dei risultati dei questionari somministrati' : ''}, genera una valutazione clinica strutturata.
${orientationSection}
IMPORTANTE: Devi rispondere ESCLUSIVAMENTE con un oggetto JSON valido, senza testo aggiuntivo prima o dopo.

Formato JSON richiesto:
{
  "anamnesi": "testo qui",
  "valutazione_psicodiagnostica": "testo qui",
  "formulazione_caso": "testo qui"
}

CONTENUTO:
- anamnesi: Sintesi anamnestica del paziente (storia personale, familiare, eventi significativi emersi - 200-300 parole)
- valutazione_psicodiagnostica: Valutazione diagnostica con ipotesi diagnostiche DSM-5/ICD-11, sintomatologia, funzionamento globale. Se disponibili, integra i punteggi dei questionari per supportare le ipotesi diagnostiche (200-300 parole)
- formulazione_caso: Formulazione del caso con fattori predisponenti/precipitanti/perpetuanti, pattern relazionali, meccanismi di mantenimento. Usa il framework dell'orientamento teorico del clinico (200-300 parole)

REGOLE:
- Usa linguaggio clinico professionale
- Basati SOLO sui dati delle sedute e dei questionari disponibili
- NON inventare informazioni non presenti
- Se i dati sono parziali, formula ipotesi cliniche provvisorie esplicitando l'incertezza
- Rispondi SOLO con JSON, nient'altro`;

    let aiResponse = await callGemini({
      systemPrompt,
      userPrompt: context,
      temperature: 0.4,
      maxTokens: 2500,
    });

    // Pulisci markdown se presente
    aiResponse = aiResponse.trim();
    if (aiResponse.startsWith('```json')) {
      aiResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }
    if (aiResponse.startsWith('```')) {
      aiResponse = aiResponse.replace(/```\n?/g, '');
    }

    try {
      const assessment = JSON.parse(aiResponse.trim());
      return NextResponse.json({ assessment });
    } catch (parseError) {
      console.error('Errore parsing JSON:', aiResponse);
      return NextResponse.json({
        error: 'Formato risposta IA non valido',
        rawResponse: aiResponse.substring(0, 500)
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Errore generazione valutazione:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
