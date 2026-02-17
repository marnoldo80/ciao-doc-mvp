'use client';
import PatientQuestionnaireForm, { PatientQuestionnaireConfig } from '@/components/PatientQuestionnaireForm';

const config: PatientQuestionnaireConfig = {
  type: 'cannabis',
  titolo: 'Test abuso di cannabis',
  sottotitolo: 'CUDIT-R · Cannabis Use Disorders Identification Test Revised',
  emoji: '🌿',
  istruzioni: 'Nell\'ultimo anno, con quale frequenza hai usato cannabis?',
  maxScore: 32,
  opzioniDefault: [
    { label: 'Mai (0)', valore: 0 },
    { label: 'Meno di una volta al mese (1)', valore: 1 },
    { label: 'Mensilmente (2)', valore: 2 },
    { label: 'Settimanalmente (3)', valore: 3 },
    { label: 'Ogni giorno o quasi (4)', valore: 4 },
  ],
  domande: [
    { testo: 'Con quale frequenza usi la cannabis?' },
    { testo: 'Quante ore al giorno sei "fatto/a" quando usi cannabis?' },
    { testo: 'Con quale frequenza hai avuto la sensazione di non riuscire a smettere quando hai iniziato?' },
    { testo: 'Con quale frequenza nell\'ultimo anno non hai fatto ciò che ci si aspettava da te a causa del tuo uso di cannabis?' },
    { testo: 'Con quale frequenza nell\'ultimo anno hai avuto un problema di memoria o concentrazione a causa dell\'uso di cannabis?' },
    { testo: 'Con quale frequenza hai cercato aiuto per la tua dipendenza da cannabis?' },
    { testo: 'Con quale frequenza hai avuto problemi con familiari o amici a causa del tuo uso di cannabis?' },
    { testo: 'Con quale frequenza negli ultimi 6 mesi hai avuto problemi legali a causa della cannabis?' },
  ],
  calcolaSeverita: (total) => {
    if (total >= 13) return 'Probabile disturbo da uso di cannabis';
    if (total >= 8) return 'Uso problematico – monitorare';
    return 'Uso non problematico';
  },
};

export default function Page() {
  return <PatientQuestionnaireForm config={config} />;
}
