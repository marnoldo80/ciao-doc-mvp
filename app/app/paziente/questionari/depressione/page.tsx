'use client';
import PatientQuestionnaireForm, { PatientQuestionnaireConfig } from '@/components/PatientQuestionnaireForm';

const config: PatientQuestionnaireConfig = {
  type: 'depressione',
  titolo: 'Test depressione',
  sottotitolo: 'PHQ-9 · Patient Health Questionnaire',
  emoji: '🌧️',
  istruzioni: 'Nelle ultime 2 settimane, con quale frequenza hai avuto i seguenti problemi?',
  maxScore: 27,
  opzioniDefault: [
    { label: 'Mai (0)', valore: 0 },
    { label: 'Diversi giorni (1)', valore: 1 },
    { label: 'Più della metà dei giorni (2)', valore: 2 },
    { label: 'Quasi ogni giorno (3)', valore: 3 },
  ],
  domande: [
    { testo: 'Poco interesse o piacere nel fare le cose' },
    { testo: 'Sentirsi giù, depresso/a o senza speranza' },
    { testo: 'Difficoltà ad addormentarsi, a restare sveglio/a, o dormire troppo' },
    { testo: 'Sentirsi stanco/a o avere poca energia' },
    { testo: 'Scarso appetito o mangiare troppo' },
    { testo: 'Sentirsi un fallimento o di aver deluso se stessi o la famiglia' },
    { testo: 'Difficoltà a concentrarsi sulle cose, come leggere il giornale o guardare la TV' },
    { testo: 'Muoversi o parlare così lentamente che gli altri potrebbero notarlo, oppure essere così agitato/a da muoversi più del solito' },
    { testo: 'Avere pensieri che sarebbe meglio essere morti, o di ferirsi in qualche modo' },
  ],
  calcolaSeverita: (total) => {
    if (total >= 20) return 'Depressione grave';
    if (total >= 15) return 'Depressione moderatamente grave';
    if (total >= 10) return 'Depressione moderata';
    if (total >= 5) return 'Depressione lieve';
    return 'Minima';
  },
};

export default function Page() {
  return <PatientQuestionnaireForm config={config} />;
}
