'use client';
import PatientQuestionnaireForm, { PatientQuestionnaireConfig } from '@/components/PatientQuestionnaireForm';

const config: PatientQuestionnaireConfig = {
  type: 'ansia',
  titolo: 'Test ansia',
  sottotitolo: 'GAD-7 · Generalized Anxiety Disorder Scale',
  emoji: '😰',
  istruzioni: 'Nelle ultime 2 settimane, con quale frequenza sei stato/a infastidito/a dai seguenti problemi?',
  maxScore: 21,
  opzioniDefault: [
    { label: 'Mai (0)', valore: 0 },
    { label: 'Diversi giorni (1)', valore: 1 },
    { label: 'Più della metà dei giorni (2)', valore: 2 },
    { label: 'Quasi ogni giorno (3)', valore: 3 },
  ],
  domande: [
    { testo: 'Sentirsi nervoso/a, ansioso/a o molto teso/a' },
    { testo: 'Non essere in grado di fermare o controllare le preoccupazioni' },
    { testo: 'Preoccuparsi troppo di cose diverse' },
    { testo: 'Difficoltà a rilassarsi' },
    { testo: 'Essere così irrequieto/a da non riuscire a stare fermo/a' },
    { testo: 'Diventare facilmente infastidito/a o irritabile' },
    { testo: 'Sentirsi spaventato/a come se stesse per accadere qualcosa di terribile' },
  ],
  calcolaSeverita: (total) => {
    if (total >= 15) return 'Ansia grave';
    if (total >= 10) return 'Ansia moderata';
    if (total >= 5) return 'Ansia lieve';
    return 'Ansia minima';
  },
};

export default function Page() {
  return <PatientQuestionnaireForm config={config} />;
}
