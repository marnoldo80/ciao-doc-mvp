import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateInvoicePdfBuffer, InvoicePdfData } from '@/lib/generateInvoicePdf';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { invoiceId } = await request.json();

    if (!invoiceId) {
      return NextResponse.json({ error: 'ID fattura mancante' }, { status: 400 });
    }

    // Carica dati fattura + paziente + terapeuta
    const { data: invoice, error: invError } = await supabase
      .from('invoices')
      .select(`
        *,
        patients!invoices_patient_id_fkey (
          display_name,
          email
        ),
        invoice_items (
          session_date,
          description,
          session_type,
          amount
        )
      `)
      .eq('id', invoiceId)
      .single();

    if (invError || !invoice) {
      return NextResponse.json({ error: 'Fattura non trovata' }, { status: 404 });
    }

    const patientEmail = invoice.patients?.email;
    const patientName = invoice.patients?.display_name || 'Paziente';

    if (!patientEmail) {
      return NextResponse.json({ error: 'Email paziente mancante' }, { status: 400 });
    }

    // Carica dati terapeuta
    const { data: therapist } = await supabase
      .from('therapists')
      .select('full_name, address, city, postal_code, province, vat_number, registration_number, iban')
      .eq('user_id', invoice.therapist_user_id)
      .single();

    const therapistName = therapist?.full_name || 'Il tuo terapeuta';
    const iban = therapist?.iban || '';

    // Costruisci tabella sessioni per email
    const sessionRows = (invoice.invoice_items || []).map((item: any) => {
      const date = new Date(item.session_date).toLocaleDateString('it-IT');
      const typeMap: Record<string, string> = { individual: 'Individuale', couple: 'Coppia', family: 'Famiglia' };
      const tipo = typeMap[item.session_type] || item.session_type;
      return `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${date}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${item.description || 'Seduta psicologica'}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${tipo}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right;">€${parseFloat(item.amount).toFixed(2)}</td>
      </tr>`;
    }).join('');

    const subtotal = parseFloat(invoice.subtotal || 0).toFixed(2);
    const enpap = parseFloat(invoice.enpap_amount || 0).toFixed(2);
    const bollo = parseFloat(invoice.bollo_amount || 2).toFixed(2);
    const total = parseFloat(invoice.total_amount || 0).toFixed(2);
    const dueDate = new Date(invoice.due_date).toLocaleDateString('it-IT');
    const periodStart = new Date(invoice.period_start).toLocaleDateString('it-IT');
    const periodEnd = new Date(invoice.period_end).toLocaleDateString('it-IT');

    const htmlBody = `
      <div style="font-family:Arial,sans-serif;max-width:650px;margin:0 auto;background:#f9fafb;padding:32px;border-radius:12px;">
        <h1 style="color:#1e293b;font-size:22px;margin-bottom:4px;">📄 Fattura ${invoice.invoice_number}</h1>
        <p style="color:#64748b;margin-bottom:24px;">da ${therapistName}</p>

        <p style="color:#374151;line-height:1.6;margin-bottom:8px;">Gentile ${patientName},</p>
        <p style="color:#374151;line-height:1.6;margin-bottom:24px;">
          Ti inviamo la fattura per le sedute del periodo <strong>${periodStart} – ${periodEnd}</strong>.
        </p>

        <div style="background:white;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin-bottom:24px;">
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="background:#f1f5f9;">
                <th style="padding:10px 12px;text-align:left;font-size:13px;color:#64748b;">Data</th>
                <th style="padding:10px 12px;text-align:left;font-size:13px;color:#64748b;">Descrizione</th>
                <th style="padding:10px 12px;text-align:left;font-size:13px;color:#64748b;">Tipo</th>
                <th style="padding:10px 12px;text-align:right;font-size:13px;color:#64748b;">Importo</th>
              </tr>
            </thead>
            <tbody>
              ${sessionRows}
            </tbody>
          </table>
        </div>

        <div style="background:white;border:1px solid #e2e8f0;border-radius:10px;padding:16px;margin-bottom:24px;">
          <div style="display:flex;justify-content:space-between;padding:6px 0;color:#374151;">
            <span>Imponibile</span><span>€${subtotal}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:6px 0;color:#374151;">
            <span>ENPAP (${invoice.enpap_rate || 2}%)</span><span>€${enpap}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:6px 0;color:#374151;">
            <span>Bollo</span><span>€${bollo}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:10px 0;border-top:2px solid #e2e8f0;font-weight:700;font-size:16px;color:#1e293b;">
            <span>TOTALE</span><span>€${total}</span>
          </div>
        </div>

        ${iban ? `
        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:16px;margin-bottom:24px;">
          <p style="margin:0;font-weight:600;color:#1e40af;margin-bottom:6px;">💳 Modalità di pagamento</p>
          <p style="margin:0;color:#374151;">Bonifico bancario entro il <strong>${dueDate}</strong></p>
          <p style="margin:0;color:#374151;">IBAN: <strong>${iban}</strong></p>
          <p style="margin:0;color:#374151;">Intestatario: <strong>${therapistName}</strong></p>
        </div>` : `
        <p style="color:#374151;margin-bottom:24px;">Scadenza pagamento: <strong>${dueDate}</strong></p>
        `}

        ${invoice.notes ? `<p style="color:#64748b;font-size:13px;margin-bottom:16px;"><em>Note: ${invoice.notes}</em></p>` : ''}

        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
        <p style="color:#94a3b8;font-size:12px;">CiaoDoc – Piattaforma per la salute mentale</p>
      </div>
    `;

    // Genera PDF allegato
    const pdfData: InvoicePdfData = {
      invoice_number: invoice.invoice_number,
      created_at: invoice.created_at,
      due_date: invoice.due_date,
      period_start: invoice.period_start,
      period_end: invoice.period_end,
      subtotal: parseFloat(invoice.subtotal || 0),
      enpap_amount: parseFloat(invoice.enpap_amount || 0),
      enpap_rate: invoice.enpap_rate || 2,
      bollo_amount: parseFloat(invoice.bollo_amount || 2),
      total_amount: parseFloat(invoice.total_amount || 0),
      notes: invoice.notes || '',
      patient_name: patientName,
      patient_email: patientEmail,
      patient_fiscal_code: invoice.patients?.fiscal_code || '',
      patient_address: '',
      therapist: therapist ? {
        full_name: therapist.full_name || '',
        address: therapist.address || '',
        city: therapist.city || '',
        postal_code: therapist.postal_code || '',
        province: therapist.province || '',
        vat_number: therapist.vat_number || '',
        registration_number: therapist.registration_number || '',
        iban: therapist.iban || '',
      } : null,
      items: (invoice.invoice_items || []).map((item: any) => ({
        date: item.session_date,
        description: item.description || 'Seduta psicologica',
        session_type: item.session_type,
        amount: parseFloat(item.amount),
      })),
    };

    const pdfUint8 = await generateInvoicePdfBuffer(pdfData);
    const pdfBase64 = Buffer.from(pdfUint8).toString('base64');
    const pdfFilename = `Fattura_${invoice.invoice_number}.pdf`;

    const sgResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: patientEmail }], subject: `Fattura ${invoice.invoice_number} – ${therapistName}` }],
        from: { email: process.env.SENDGRID_FROM || 'noreply@ciao-doc.it', name: 'CiaoDoc' },
        content: [{ type: 'text/html', value: htmlBody }],
        attachments: [{
          content: pdfBase64,
          filename: pdfFilename,
          type: 'application/pdf',
          disposition: 'attachment',
        }],
      }),
    });

    if (!sgResponse.ok) {
      const errBody = await sgResponse.text();
      throw new Error(`SendGrid error: ${sgResponse.status} – ${errBody}`);
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Errore invio fattura email:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
