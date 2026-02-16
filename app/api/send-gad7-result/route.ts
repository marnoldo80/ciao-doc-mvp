import { NextResponse } from "next/server";
import sgMail from '@sendgrid/mail';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const to: string | undefined = body.to || body.toEmail;
    const toName: string = body.toName || "Paziente";
    const patientName: string = body.patientName || "";
    const total: number | undefined = body.total;
    const severity: string | undefined = body.severity;
    const date: string = body.date || new Date().toLocaleString();

    if (!to || total === undefined || !severity) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
    const from = process.env.SENDGRID_FROM || "noreply@ciao-doc.it";

    const subject = "Risultati GAD-7";
    const html = `
      <p>Ciao ${toName},</p>
      <p>${patientName ? `Risultati per <b>${patientName}</b>` : "Risultati del tuo questionario"} GAD-7:</p>
      <ul>
        <li><b>Totale:</b> ${total} / 21</li>
        <li><b>Gravità:</b> ${severity}</li>
        <li><b>Data:</b> ${date}</li>
      </ul>
      <p>Grazie.</p>
    `;

    const { data, error } = await sgMail.send({ from, to, subject, html });
    if (error) return NextResponse.json({ error: error.message || "Send failed" }, { status: 500 });

    return NextResponse.json({ ok: true, id: data?.id ?? null });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Error" }, { status: 500 });
  }
}
