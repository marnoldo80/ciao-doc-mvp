import { renderToBuffer } from '@react-pdf/renderer';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import React from 'react';

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica', color: '#1e293b', backgroundColor: '#ffffff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  title: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: '#1e293b' },
  subtitle: { fontSize: 11, color: '#64748b', marginTop: 4 },
  metaRight: { textAlign: 'right' },
  metaLabel: { color: '#64748b', fontSize: 9 },
  metaValue: { fontFamily: 'Helvetica-Bold', fontSize: 10 },
  metaValueRed: { fontFamily: 'Helvetica-Bold', fontSize: 10, color: '#dc2626' },
  sectionBox: { backgroundColor: '#f8fafc', borderRadius: 6, padding: 12, marginBottom: 16 },
  sectionTitle: { fontFamily: 'Helvetica-Bold', fontSize: 10, marginBottom: 6, color: '#475569' },
  row2col: { flexDirection: 'row', gap: 16 },
  col: { flex: 1 },
  label: { color: '#64748b', fontSize: 9, marginBottom: 2 },
  value: { fontSize: 10, color: '#1e293b' },
  valueBold: { fontFamily: 'Helvetica-Bold', fontSize: 10, color: '#1e293b' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f1f5f9', padding: '6 8', borderRadius: 4, marginBottom: 2 },
  tableHeaderText: { fontFamily: 'Helvetica-Bold', fontSize: 9, color: '#64748b' },
  tableRow: { flexDirection: 'row', padding: '5 8', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  tableCell: { fontSize: 9, color: '#374151' },
  col1: { width: '18%' },
  col2: { width: '44%' },
  col3: { width: '18%' },
  col4: { width: '20%', textAlign: 'right' },
  totalsBox: { marginTop: 12, alignItems: 'flex-end' },
  totalsInner: { width: 220 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  totalLabel: { fontSize: 9, color: '#374151' },
  totalValue: { fontSize: 9, color: '#374151' },
  totalFinalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderTopWidth: 1.5, borderTopColor: '#1e293b', marginTop: 4 },
  totalFinalLabel: { fontFamily: 'Helvetica-Bold', fontSize: 11, color: '#1e293b' },
  totalFinalValue: { fontFamily: 'Helvetica-Bold', fontSize: 11, color: '#1e293b' },
  ibanBox: { backgroundColor: '#eff6ff', borderRadius: 6, padding: 10, marginTop: 16 },
  ibanTitle: { fontFamily: 'Helvetica-Bold', fontSize: 9, color: '#1d4ed8', marginBottom: 4 },
  ibanText: { fontSize: 9, color: '#374151', marginBottom: 2 },
  footer: { marginTop: 24, borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 10 },
  footerText: { fontSize: 8, color: '#94a3b8', textAlign: 'center' },
  exemptText: { fontSize: 8, color: '#64748b', marginTop: 8 },
  notesBox: { marginTop: 12 },
  notesText: { fontSize: 9, color: '#64748b', fontStyle: 'italic' },
});

export type InvoicePdfData = {
  invoice_number: string;
  created_at: string;
  due_date: string;
  period_start: string;
  period_end: string;
  subtotal: number;
  enpap_amount: number;
  enpap_rate: number;
  bollo_amount: number;
  total_amount: number;
  notes?: string;
  patient_name: string;
  patient_fiscal_code?: string;
  patient_address?: string;
  patient_email?: string;
  therapist: {
    full_name: string;
    address?: string;
    city?: string;
    postal_code?: string;
    province?: string;
    vat_number?: string;
    registration_number?: string;
    iban?: string;
  } | null;
  items: {
    date: string;
    description: string;
    session_type: string;
    amount: number;
  }[];
};

const sessionTypeLabel: Record<string, string> = {
  individual: 'Individuale',
  couple: 'Coppia',
  family: 'Famiglia',
};

function fmt(date: string) {
  return new Date(date).toLocaleDateString('it-IT');
}

function InvoiceDocument({ data }: { data: InvoicePdfData }) {
  const th = data.therapist;
  return (
    React.createElement(Document, null,
      React.createElement(Page, { size: 'A4', style: styles.page },
        // Header
        React.createElement(View, { style: styles.header },
          React.createElement(View, null,
            React.createElement(Text, { style: styles.title }, 'FATTURA'),
            React.createElement(Text, { style: styles.subtitle }, `Nr. ${data.invoice_number}`),
          ),
          React.createElement(View, { style: styles.metaRight },
            React.createElement(Text, { style: styles.metaLabel }, 'Data'),
            React.createElement(Text, { style: styles.metaValue }, fmt(data.created_at)),
            React.createElement(Text, { style: { ...styles.metaLabel, marginTop: 6 } }, 'Scadenza'),
            React.createElement(Text, { style: styles.metaValueRed }, fmt(data.due_date)),
          ),
        ),

        // Emittente + Pagamento
        React.createElement(View, { style: styles.sectionBox },
          React.createElement(View, { style: styles.row2col },
            React.createElement(View, { style: styles.col },
              React.createElement(Text, { style: styles.sectionTitle }, 'Emittente'),
              React.createElement(Text, { style: styles.valueBold }, th?.full_name || ''),
              React.createElement(Text, { style: styles.value }, 'Psicologo e Psicoterapeuta'),
              React.createElement(Text, { style: styles.value }, th?.address || ''),
              React.createElement(Text, { style: styles.value }, `${th?.city || ''} ${th?.postal_code || ''} (${th?.province || ''})`),
              React.createElement(Text, { style: styles.value }, `P.IVA: ${th?.vat_number || ''}`),
              React.createElement(Text, { style: styles.value }, `Iscr. Ordine n. ${th?.registration_number || ''}`),
            ),
            React.createElement(View, { style: styles.col },
              React.createElement(Text, { style: styles.sectionTitle }, 'Modalità pagamento'),
              React.createElement(Text, { style: styles.value }, 'Bonifico Bancario'),
              React.createElement(Text, { style: { ...styles.value, marginTop: 4 } }, `IBAN: ${th?.iban || ''}`),
              React.createElement(Text, { style: styles.value }, `Intestatario: ${th?.full_name || ''}`),
            ),
          ),
        ),

        // Cliente + Periodo
        React.createElement(View, { style: { ...styles.row2col, marginBottom: 16 } },
          React.createElement(View, { style: { ...styles.col, ...styles.sectionBox } },
            React.createElement(Text, { style: styles.sectionTitle }, 'Fatturato a'),
            React.createElement(Text, { style: styles.valueBold }, data.patient_name),
            data.patient_fiscal_code ? React.createElement(Text, { style: styles.value }, `CF: ${data.patient_fiscal_code}`) : null,
            data.patient_address ? React.createElement(Text, { style: styles.value }, data.patient_address) : null,
            data.patient_email ? React.createElement(Text, { style: styles.value }, data.patient_email) : null,
          ),
          React.createElement(View, { style: { ...styles.col, ...styles.sectionBox } },
            React.createElement(Text, { style: styles.sectionTitle }, 'Periodo di fatturazione'),
            React.createElement(Text, { style: styles.value }, `Dal ${fmt(data.period_start)}`),
            React.createElement(Text, { style: styles.value }, `Al ${fmt(data.period_end)}`),
          ),
        ),

        // Tabella sessioni
        React.createElement(View, { style: styles.tableHeader },
          React.createElement(Text, { style: { ...styles.tableHeaderText, ...styles.col1 } }, 'Data'),
          React.createElement(Text, { style: { ...styles.tableHeaderText, ...styles.col2 } }, 'Descrizione'),
          React.createElement(Text, { style: { ...styles.tableHeaderText, ...styles.col3 } }, 'Tipo'),
          React.createElement(Text, { style: { ...styles.tableHeaderText, ...styles.col4 } }, 'Importo'),
        ),
        ...data.items.map((item, i) =>
          React.createElement(View, { key: i, style: styles.tableRow },
            React.createElement(Text, { style: { ...styles.tableCell, ...styles.col1 } }, fmt(item.date)),
            React.createElement(Text, { style: { ...styles.tableCell, ...styles.col2 } }, item.description || 'Seduta psicologica'),
            React.createElement(Text, { style: { ...styles.tableCell, ...styles.col3 } }, sessionTypeLabel[item.session_type] || item.session_type),
            React.createElement(Text, { style: { ...styles.tableCell, ...styles.col4 } }, `€${Number(item.amount).toFixed(2)}`),
          )
        ),

        // Totali
        React.createElement(View, { style: styles.totalsBox },
          React.createElement(View, { style: styles.totalsInner },
            React.createElement(View, { style: styles.totalRow },
              React.createElement(Text, { style: styles.totalLabel }, 'Totale imponibile'),
              React.createElement(Text, { style: styles.totalValue }, `€${data.subtotal.toFixed(2)}`),
            ),
            React.createElement(View, { style: styles.totalRow },
              React.createElement(Text, { style: styles.totalLabel }, `ENPAP (${data.enpap_rate}%)`),
              React.createElement(Text, { style: styles.totalValue }, `€${data.enpap_amount.toFixed(2)}`),
            ),
            React.createElement(View, { style: styles.totalRow },
              React.createElement(Text, { style: styles.totalLabel }, 'Bollo'),
              React.createElement(Text, { style: styles.totalValue }, `€${data.bollo_amount.toFixed(2)}`),
            ),
            React.createElement(View, { style: styles.totalFinalRow },
              React.createElement(Text, { style: styles.totalFinalLabel }, 'TOTALE A VERSARE'),
              React.createElement(Text, { style: styles.totalFinalValue }, `€${data.total_amount.toFixed(2)}`),
            ),
          ),
        ),

        // IBAN box
        th?.iban ? React.createElement(View, { style: styles.ibanBox },
          React.createElement(Text, { style: styles.ibanTitle }, '💳 Pagamento tramite bonifico'),
          React.createElement(Text, { style: styles.ibanText }, `IBAN: ${th.iban}`),
          React.createElement(Text, { style: styles.ibanText }, `Intestatario: ${th.full_name}`),
          React.createElement(Text, { style: styles.ibanText }, `Entro il: ${fmt(data.due_date)}`),
        ) : null,

        // Note
        data.notes ? React.createElement(View, { style: styles.notesBox },
          React.createElement(Text, { style: styles.notesText }, `Note: ${data.notes}`),
        ) : null,

        // Esenzione IVA
        React.createElement(Text, { style: styles.exemptText },
          'Esente da IVA art.10 n° 18 d.p.r. 633/72 e succ. mod.'
        ),

        // Footer
        React.createElement(View, { style: styles.footer },
          React.createElement(Text, { style: styles.footerText }, 'CiaoDoc – Piattaforma per la salute mentale'),
        ),
      )
    )
  );
}

export async function generateInvoicePdfBuffer(data: InvoicePdfData): Promise<Buffer> {
  const doc = React.createElement(InvoiceDocument, { data });
  const buffer = await renderToBuffer(doc as any);
  return Buffer.from(buffer);
}
