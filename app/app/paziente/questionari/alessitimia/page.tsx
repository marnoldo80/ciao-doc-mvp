'use client';
import PatientQuestionnaireForm, { PatientQuestionnaireConfig } from '@/components/PatientQuestionnaireForm';

const config: PatientQuestionnaireConfig = {
  type: 'alessitimia',
  titolo: 'Test alessitimia',
  sottotitolo: 'TAS-20 · Toronto Alexithymia Scale',
  emoji: '🎭',
  istruzioni: 'Indica quanto sei d\'accordo con ogni affermazione.',
  maxScore: 100,
  opzioniDefault: [
    { label: 'Per niente d\'accordo (1)', valore: 1 },
    { label: 'In disaccordo (2)', valore: 2 },
    { label: 'Né sì né no (3)', valore: 3 },
    { label: 'D\'accordo (4)', valore: 4 },
    { label: 'Molto d\'accordo (5)', valore: 5 },
  ],
  domande: [
    { testo: 'Spesso sono confuso/a su quali emozioni sto provando' },
    { testo: 'Ho difficoltà a trovare le parole giuste per le mie sensazioni' },
    { testo: 'Ho sensazioni fisiche che anche i medici non riescono a capire' },
    { testo: 'Riesco facilmente a descrivere i miei sentimenti (inverso)' },
    { testo: 'Preferisco analizzare i problemi piuttosto che semplicemente descriverli' },
    { testo: 'Quando sono turbato/a, non so se sono triste, spaventato/a o arrabbiato/a' },
    { testo: 'Sono spesso sconcertato/a dalle sensazioni nel mio corpo' },
    { testo: 'Preferisco semplicemente lasciar accadere le cose piuttosto che capire perché' },
    { testo: 'Ho sentimenti che non riesco bene a identificare' },
    { testo: 'Essere consapevole delle emozioni è fondamentale (inverso)' },
    { testo: 'Trovo difficile descrivere come mi sento verso le persone' },
    { testo: 'Le persone mi dicono di descrivere di più i miei sentimenti' },
    { testo: 'Non so cosa sta succedendo dentro di me' },
    { testo: 'Spesso non so perché sono arrabbiato/a' },
    { testo: 'Preferisco parlare con le persone delle loro attività quotidiane piuttosto che dei loro sentimenti' },
    { testo: 'Preferisco guardare spettacoli leggeri piuttosto che drammi psicologici' },
    { testo: 'È difficile per me rivelare i miei sentimenti intimi anche alle persone più vicine' },
    { testo: 'Posso sentirmi vicino/a a qualcuno anche nei momenti di silenzio (inverso)' },
    { testo: 'Trovo utile esaminare i miei sentimenti per risolvere i problemi personali (inverso)' },
    { testo: 'Cercare significati nascosti nei film o nei libri mi disturba' },
  ],
  calcolaSeverita: (total) => {
    if (total >= 61) return 'Alessitimia presente';
    if (total >= 52) return 'Possibile alessitimia';
    return 'Assenza di alessitimia';
  },
};

export default function Page() {
  return <PatientQuestionnaireForm config={config} />;
}
