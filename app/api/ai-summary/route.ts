import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { callGemini } from '@/lib/gemini';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { transcript, patientId } = await request.json();

    if (!transcript) {
      return NextResponse.json({ error: 'Nessuna trascrizione fornita' }, { status: 400 });
    }

    // Recupera orientamento terapeutico se disponibile
    let therapeuticOrientation = '';
    if (patientId) {
      const { data: patient } = await supabase
        .from('patients')
        .select('therapist_user_id')
        .eq('id', patientId)
        .single();

      if (patient?.therapist_user_id) {
        const { data: therapist } = await supabase
          .from('therapists')
          .select('therapeutic_orientation')
          .eq('user_id', patient.therapist_user_id)
          .single();
        therapeuticOrientation = therapist?.therapeutic_orientation || '';
      }
    }

    const orientationNote = therapeuticOrientation
      ? `\nL'approccio del clinico è: ${therapeuticOrientation}. Nelle TECNICHE UTILIZZATE, identifica interventi coerenti con questo orientamento.\n`
      : '';

    const systemPrompt = `Sei un assistente clinico per psicologi. Analizza la trascrizione della seduta e genera un riassunto strutturato in italiano con queste sezioni:
${orientationNote}
## TEMI PRINCIPALI
- Lista dei temi emersi nella seduta

## EMOZIONI PREVALENTI
- Emozioni espresse o riferite dal paziente

## PROGRESSI
- Miglioramenti, cambiamenti o insight notati

## TECNICHE UTILIZZATE
- Interventi terapeutici applicati durante la seduta

## PUNTI SALIENTI
- I 3-5 elementi più importanti emersi da ricordare per il follow-up

## HOMEWORK/COMPITI
- Esercizi o obiettivi da assegnare al paziente per la prossima settimana

## NOTE CLINICHE
- Osservazioni importanti per il follow-up e la continuità terapeutica

Sii conciso ma completo. Usa linguaggio clinico professionale.`;

    const summary = await callGemini({
      systemPrompt,
      userPrompt: `Trascrizione seduta:\n\n${transcript}`,
      temperature: 0.3,
      maxTokens: 2000,
    });

    return NextResponse.json({ summary });

  } catch (error: any) {
    console.error('Errore riassunto IA:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
