'use client';
import QuestionnaireForm, { QuestionnaireConfig } from '@/components/QuestionnaireForm';

const config: QuestionnaireConfig = {
  type: 'depressione-post-partum',
  titolo: 'Test depressione post-partum',
  sottotitolo: 'EPDS · Edinburgh Postnatal Depression Scale',
  emoji: '👶',
  istruzioni: 'Nelle ultime 7 giorni, indica quanto delle seguenti situazioni ti hanno riguardato.',
  maxScore: 30,
  opzioniDefault: [
    { label: 'No, mai (0)', valore: 0 },
    { label: 'No, non spesso (1)', valore: 1 },
    { label: 'Sì, talvolta (2)', valore: 2 },
    { label: 'Sì, molto spesso (3)', valore: 3 },
  ],
  domande: [
    { testo: 'Ho saputo ridere e vedere il lato positivo delle cose' },
    { testo: 'Ho guardato al futuro con piacere' },
    { testo: 'Mi sono incolpata inutilmente quando le cose sono andate storte' },
    { testo: 'Mi sono sentita in ansia o preoccupata senza motivo' },
    { testo: 'Mi sono sentita spaventata o piena di panico senza motivo' },
    { testo: 'Le cose mi hanno sopraffatta' },
    { testo: 'Sono stata così infelice da avere difficoltà a dormire' },
    { testo: 'Mi sono sentita triste o infelice' },
    { testo: 'Sono stata così infelice che ho pianto' },
    { testo: 'Ho avuto pensieri di farmi del male' },
  ],
  calcolaSeverita: (total) => {
    if (total >= 13) return 'Possibile depressione post-partum – valutare urgentemente';
    if (total >= 10) return 'Rischio moderato – monitorare attentamente';
    return 'Basso rischio';
  },
};

export default function Page() {
  return <QuestionnaireForm config={config} />;
}
