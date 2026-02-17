import { NextRequest, NextResponse } from 'next/server';

const QUESTIONNAIRE_INFO: Record<string, { label: string; path: string }> = {
  'ansia': { label: 'Test ansia (GAD-7)', path: 'gad7' },
  'ansia-sociale': { label: 'Test ansia sociale', path: 'ansia-sociale' },
  'adhd': { label: 'Test ADHD', path: 'adhd' },
  'alessitimia': { label: 'Test alessitimia', path: 'alessitimia' },
  'autismo': { label: 'Test autismo', path: 'autismo' },
  'autostima': { label: 'Test autostima', path: 'autostima' },
  'burnout': { label: 'Test burnout', path: 'burnout' },
  'depressione': { label: 'Test depressione (PHQ-9)', path: 'depressione' },
  'depressione-post-partum': { label: 'Test depressione post-partum', path: 'depressione-post-partum' },
  'dca': { label: 'Test DCA', path: 'dca' },
  'doc': { label: 'Test DOC', path: 'doc' },
  'insonnia': { label: 'Test insonnia', path: 'insonnia' },
  'ipocondria': { label: 'Test ipocondria', path: 'ipocondria' },
  'borderline': { label: 'Test disturbo borderline', path: 'borderline' },
  'cannabis': { label: 'Test abuso di cannabis', path: 'cannabis' },
  'dipendenza-lavoro': { label: 'Test dipendenza da lavoro', path: 'dipendenza-lavoro' },
  'dipendenza-internet': { label: 'Test dipendenza da internet', path: 'dipendenza-internet' },
  'ptsd': { label: 'Test PTSD', path: 'ptsd' },
  'dismorfofobia': { label: 'Test dismorfofobia', path: 'dismorfofobia' },
  'emetofobia': { label: 'Test emetofobia', path: 'emetofobia' },
  'binge-eating': { label: 'Test binge eating', path: 'binge-eating' },
  'orientamento-psicoterapeutico': { label: 'Test orientamento psicoterapeutico', path: 'orientamento-psicoterapeutico' },
};

export async function POST(request: NextRequest) {
  try {
    const { patientId, email, patientName, questionnaireType } = await request.json();

    if (!patientId || !email || !questionnaireType) {
      return NextResponse.json({ error: 'Dati mancanti' }, { status: 400 });
    }

    const info = QUESTIONNAIRE_INFO[questionnaireType];
    if (!info) {
      return NextResponse.json({ error: 'Tipo questionario non valido' }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL
      || (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://ciao-doc.it');
    const compilaUrl = `${baseUrl}/app/paziente/questionari/${info.path}?patientId=${patientId}`;

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email }],
          subject: `${info.label} – Questionario da compilare`,
        }],
        from: {
          email: process.env.SENDGRID_FROM || 'noreply@ciao-doc.it',
          name: 'CiaoDoc',
        },
        content: [{
          type: 'text/html',
          value: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 32px; border-radius: 12px;">
              <h1 style="color: #1e293b; font-size: 24px; margin-bottom: 8px;">Questionario psicologico</h1>
              <p style="color: #64748b; margin-bottom: 24px;">Gentile ${patientName || 'paziente'},</p>
              <p style="color: #374151; line-height: 1.6; margin-bottom: 24px;">
                Il tuo terapeuta ti ha inviato un questionario da compilare prima della prossima seduta.<br/>
                Il questionario richiede circa <strong>5-10 minuti</strong>.
              </p>
              <div style="background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 18px; font-weight: 600; color: #1e293b;">📋 ${info.label}</p>
              </div>
              <a href="${compilaUrl}"
                 style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 600; font-size: 16px;">
                Compila il questionario →
              </a>
              <p style="color: #94a3b8; font-size: 12px; margin-top: 32px;">
                Se il pulsante non funziona, copia questo link nel browser:<br/>
                <a href="${compilaUrl}" style="color: #6366f1;">${compilaUrl}</a>
              </p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
              <p style="color: #94a3b8; font-size: 12px;">CiaoDoc – Piattaforma per la salute mentale</p>
            </div>
          `,
        }],
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`SendGrid error: ${response.status} – ${errBody}`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Errore invio email questionario:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
