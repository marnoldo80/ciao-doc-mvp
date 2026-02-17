'use client';
import QuestionnaireForm, { QuestionnaireConfig } from '@/components/QuestionnaireForm';

const config: QuestionnaireConfig = {
  type: 'orientamento-psicoterapeutico',
  titolo: 'Test orientamento psicoterapeutico',
  sottotitolo: 'Questionario di orientamento terapeutico',
  emoji: '🧭',
  istruzioni: 'Indica quanto sei d\'accordo con le seguenti affermazioni sulla tua visione di te stesso/a e della vita.',
  maxScore: 40,
  opzioniDefault: [
    { label: 'Per niente (0)', valore: 0 },
    { label: 'Un po\' (1)', valore: 1 },
    { label: 'Abbastanza (2)', valore: 2 },
    { label: 'Molto (3)', valore: 3 },
    { label: 'Moltissimo (4)', valore: 4 },
  ],
  domande: [
    { testo: 'Credo che i miei problemi attuali siano fortemente legati a esperienze passate, specialmente dell\'infanzia' },
    { testo: 'Spesso mi chiedo il perché dei miei comportamenti e delle mie reazioni emotive' },
    { testo: 'Trovo utile cambiare il modo in cui penso alle situazioni per sentirmi meglio' },
    { testo: 'Mi interessa capire come le mie relazioni influenzano il mio benessere' },
    { testo: 'Credo che fare esercizi pratici (come diari, compiti) mi aiuti a stare meglio' },
    { testo: 'Sento che le mie emozioni sono spesso incomprensibili anche a me stesso/a' },
    { testo: 'Credo che il corpo e le emozioni siano strettamente connessi' },
    { testo: 'Preferisco parlare liberamente di ciò che mi passa per la mente senza uno schema fisso' },
    { testo: 'Cerco di trovare significato e scopo nella vita anche nei momenti difficili' },
    { testo: 'Preferisco avere obiettivi chiari e strategie concrete per affrontare i problemi' },
  ],
  calcolaSeverita: (total) => {
    if (total >= 30) return 'Orientamento psicodinamico-relazionale';
    if (total >= 20) return 'Orientamento cognitivo-comportamentale';
    if (total >= 10) return 'Orientamento umanistico-esistenziale';
    return 'Profilo misto – da approfondire in seduta';
  },
};

export default function Page() {
  return <QuestionnaireForm config={config} />;
}
