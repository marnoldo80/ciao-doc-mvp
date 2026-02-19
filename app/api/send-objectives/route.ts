import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
);

export async function POST(req: Request) {
  try {
    const { patientId, obiettivi_generali, obiettivi_specifici, esercizi } = await req.json();

    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID mancante' }, { status: 400 });
    }

    // Recupera email e nome paziente
    const { data: patient, error: patientErr } = await supabase
      .from('patients')
      .select('email, display_name')
      .eq('id', patientId)
      .single();

    if (patientErr || !patient?.email) {
      return NextResponse.json({ error: 'Paziente non trovato o email mancante' }, { status: 400 });
    }

    const toName = patient.display_name || 'Paziente';

    // Costruisce il corpo email
    let html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 24px; border-radius: 12px;">
        <h2 style="color: #1e293b; margin-bottom: 8px;">📋 Il tuo piano terapeutico</h2>
        <p style="color: #64748b;">Ciao <strong>${toName}</strong>, il tuo terapeuta ha condiviso con te i seguenti obiettivi ed esercizi.</p>
    `;

    if (obiettivi_generali?.length > 0) {
      html += `
        <div style="background: white; border-left: 4px solid #7aa2ff; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <h3 style="color: #1e293b; margin: 0 0 12px 0;">🎯 Obiettivi Generali</h3>
          <ul style="margin: 0; padding-left: 20px; color: #334155;">
            ${obiettivi_generali.map((o: string) => `<li style="margin-bottom: 8px;">${o}</li>`).join('')}
          </ul>
        </div>
      `;
    }

    if (obiettivi_specifici?.length > 0) {
      html += `
        <div style="background: white; border-left: 4px solid #9333ea; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <h3 style="color: #1e293b; margin: 0 0 12px 0;">🎯 Obiettivi Specifici</h3>
          <ul style="margin: 0; padding-left: 20px; color: #334155;">
            ${obiettivi_specifici.map((o: string) => `<li style="margin-bottom: 8px;">${o}</li>`).join('')}
          </ul>
        </div>
      `;
    }

    if (esercizi?.length > 0) {
      html += `
        <div style="background: white; border-left: 4px solid #22c55e; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <h3 style="color: #1e293b; margin: 0 0 12px 0;">💪 Esercizi</h3>
          <ul style="margin: 0; padding-left: 20px; color: #334155;">
            ${esercizi.map((e: string) => `<li style="margin-bottom: 8px;">${e}</li>`).join('')}
          </ul>
        </div>
      `;
    }

    html += `
        <p style="color: #94a3b8; font-size: 13px; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
          Questo messaggio è stato inviato dal tuo terapeuta tramite Therap-IA.
        </p>
      </div>
    `;

    await sgMail.send({
      from: process.env.SENDGRID_FROM!,
      to: patient.email,
      subject: '📋 Il tuo piano terapeutico aggiornato',
      html,
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('Errore send-objectives:', e);
    return NextResponse.json({ error: e?.message || 'Errore invio' }, { status: 500 });
  }
}
