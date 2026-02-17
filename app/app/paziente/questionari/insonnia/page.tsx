'use client';
import PatientQuestionnaireForm, { PatientQuestionnaireConfig } from '@/components/PatientQuestionnaireForm';

const config: PatientQuestionnaireConfig = {
  type: 'insonnia',
  titolo: 'Test insonnia',
  sottotitolo: 'ISI · Insomnia Severity Index',
  emoji: '🌙',
  istruzioni: 'Per le ultime 2 settimane, valuta la gravità dei tuoi problemi di insonnia.',
  maxScore: 28,
  opzioniDefault: [
    { label: 'Nessuno (0)', valore: 0 },
    { label: 'Lieve (1)', valore: 1 },
    { label: 'Moderato (2)', valore: 2 },
    { label: 'Grave (3)', valore: 3 },
    { label: 'Molto grave (4)', valore: 4 },
  ],
  domande: [
    { testo: 'Difficoltà ad addormentarsi (gravità del problema)' },
    { testo: 'Difficoltà a restare addormentato/a (gravità del problema)' },
    { testo: 'Problemi di risvegli precoci (gravità del problema)' },
    { testo: 'Quanto sei soddisfatto/a del tuo attuale schema di sonno?' },
    { testo: 'Quanto la tua difficoltà di sonno interferisce con il funzionamento diurno?' },
    { testo: 'Quanto è evidente per gli altri che la tua qualità di vita è diminuita a causa del tuo problema di sonno?' },
    { testo: 'Quanto sei preoccupato/a del tuo attuale problema di sonno?' },
  ],
  calcolaSeverita: (total) => {
    if (total >= 22) return 'Insonnia clinica grave';
    if (total >= 15) return 'Insonnia clinica moderata';
    if (total >= 8) return 'Insonnia subclinica';
    return 'Assenza di insonnia';
  },
};

export default function Page() {
  return <PatientQuestionnaireForm config={config} />;
}
