import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateInvoicePdfBuffer, InvoicePdfData } from '@/lib/generateInvoicePdf';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'ID fattura richiesto' }, { status: 400 });
    }

    // Carica fattura
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(`
        *,
        patients!invoices_patient_id_fkey (
          display_name, email, fiscal_code, address, city, postal_code, province
        ),
        invoice_items (
          session_date, description, session_type, rate, amount
        )
      `)
      .eq('id', id)
      .single();

    if (error || !invoice) {
      return NextResponse.json({ error: 'Fattura non trovata' }, { status: 404 });
    }

    // Carica terapeuta
    const { data: therapist } = await supabase
      .from('therapists')
      .select('full_name, address, city, postal_code, province, vat_number, registration_number, iban')
      .eq('user_id', invoice.therapist_user_id)
      .single();

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
      patient_name: invoice.patients?.display_name || 'Paziente',
      patient_email: invoice.patients?.email || '',
      patient_fiscal_code: invoice.patients?.fiscal_code || '',
      patient_address: [
        invoice.patients?.address,
        invoice.patients?.city,
        invoice.patients?.postal_code,
        invoice.patients?.province ? `(${invoice.patients.province})` : ''
      ].filter(Boolean).join(' '),
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

    const pdfBuffer = await generateInvoicePdfBuffer(pdfData);
    const filename = `Fattura_${invoice.invoice_number}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(pdfBuffer.length),
      },
    });

  } catch (error: any) {
    console.error('Errore generazione PDF:', error);
    return NextResponse.json({ error: 'Errore generazione PDF: ' + error.message }, { status: 500 });
  }
}
