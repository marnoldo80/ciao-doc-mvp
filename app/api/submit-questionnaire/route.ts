import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Usa service role per permettere al paziente di salvare senza autenticazione
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
);

export async function POST(request: NextRequest) {
  try {
    const { patientId, type, answers, total, severity } = await request.json();

    if (!patientId || !type || !answers || total === undefined) {
      return NextResponse.json({ error: 'Dati mancanti' }, { status: 400 });
    }

    // Recupera il therapist_user_id dal paziente
    const { data: patientData, error: patientError } = await supabaseAdmin
      .from('patients')
      .select('therapist_user_id')
      .eq('id', patientId)
      .single();

    if (patientError || !patientData) {
      return NextResponse.json({ error: 'Paziente non trovato' }, { status: 404 });
    }

    // Salva il risultato
    const { error: insertError } = await supabaseAdmin
      .from('questionnaire_results')
      .insert({
        patient_id: patientId,
        therapist_user_id: patientData.therapist_user_id,
        type,
        answers,
        total,
        severity,
      });

    if (insertError) {
      throw new Error(insertError.message);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Errore submit questionario:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
