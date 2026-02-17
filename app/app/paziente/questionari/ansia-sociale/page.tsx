'use client';
import PatientQuestionnaireForm, { PatientQuestionnaireConfig } from '@/components/PatientQuestionnaireForm';

const config: PatientQuestionnaireConfig = {
  type: 'ansia-sociale',
  titolo: 'Test ansia sociale',
  sottotitolo: 'SPIN · Social Phobia Inventory',
  emoji: '👥',
  istruzioni: 'Indica quanto ognuna delle seguenti affermazioni ti ha disturbato nell\'ultima settimana.',
  maxScore: 68,
  opzioniDefault: [
    { label: 'Per niente (0)', valore: 0 },
    { label: 'Un po\' (1)', valore: 1 },
    { label: 'Abbastanza (2)', valore: 2 },
    { label: 'Molto (3)', valore: 3 },
    { label: 'Moltissimo (4)', valore: 4 },
  ],
  domande: [
    { testo: 'Ho paura delle persone in posizione di autorità' },
    { testo: 'Mi sento a disagio quando sono in presenza di qualcuno del sesso opposto' },
    { testo: 'Arrossisco in presenza di persone che non conosco' },
    { testo: 'Evito di parlare con qualcuno per paura di essere imbarazzato/a' },
    { testo: 'Avere riunioni con persone non familiari mi fa paura' },
    { testo: 'Fare qualcosa mentre qualcuno mi guarda mi spaventa' },
    { testo: 'Mi imbarazzo se sudo in pubblico' },
    { testo: 'Evito di andare a feste' },
    { testo: 'Evito attività in cui sono al centro dell\'attenzione' },
    { testo: 'Parlare con persone sconosciute mi spaventa' },
    { testo: 'Evito discorsi' },
    { testo: 'Farei qualsiasi cosa per evitare di essere criticato/a' },
    { testo: 'Battiti cardiaci accelerati quando sono in mezzo ad altre persone mi disturbano' },
    { testo: 'Ho paura di fare qualcosa di imbarazzante o stupido' },
    { testo: 'Sudare in presenza di altre persone mi mette a disagio' },
    { testo: 'Non posso fare cose quando mi sento osservato/a' },
    { testo: 'Parlare con l\'autorità mi fa sentire imbarazzato/a e goffo/a' },
  ],
  calcolaSeverita: (total) => {
    if (total >= 55) return 'Grave';
    if (total >= 40) return 'Moderata-grave';
    if (total >= 21) return 'Moderata';
    if (total >= 1) return 'Lieve';
    return 'Minima';
  },
};

export default function Page() {
  return <PatientQuestionnaireForm config={config} />;
}
