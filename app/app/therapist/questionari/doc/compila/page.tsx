'use client';
import QuestionnaireForm, { QuestionnaireConfig } from '@/components/QuestionnaireForm';

const config: QuestionnaireConfig = {
  type: 'doc',
  titolo: 'Test DOC',
  sottotitolo: 'OCI-R · Obsessive-Compulsive Inventory Revised',
  emoji: '🔄',
  istruzioni: 'Indica quanto le seguenti esperienze ti hanno disturbato nell\'ultimo mese.',
  maxScore: 72,
  opzioniDefault: [
    { label: 'Per niente (0)', valore: 0 },
    { label: 'Un po\' (1)', valore: 1 },
    { label: 'Abbastanza (2)', valore: 2 },
    { label: 'Molto (3)', valore: 3 },
    { label: 'Moltissimo (4)', valore: 4 },
  ],
  domande: [
    { testo: 'Ho conservato così tante cose da essere d\'intralcio' },
    { testo: 'Controllo le cose più volte del necessario' },
    { testo: 'Raccolgo oggetti che non mi servono' },
    { testo: 'Mi disturba quando gli oggetti non sono ordinati o simmetrici' },
    { testo: 'Mi sento obbligato/a a seguire una certa routine nei miei movimenti' },
    { testo: 'Ho pensieri sgradevoli che appaiono in mente contro la mia volontà' },
    { testo: 'Mi preoccupo di non avere detto le cose in modo corretto' },
    { testo: 'Controllo più volte di non aver causato danni agli altri' },
    { testo: 'Lavo o mi pulisco eccessivamente' },
    { testo: 'Provo difficoltà a controllare i miei stessi pensieri' },
    { testo: 'Raccolgo oggetti inutili' },
    { testo: 'Controllo più volte di non essermi fatto del male' },
    { testo: 'Sono turbato/a da pensieri sacrileghi o osceni che entrano in mente' },
    { testo: 'Evito di buttare le cose perché ho paura di aver bisogno di loro' },
    { testo: 'Mi agito se gli oggetti non sono messi nel posto "giusto"' },
    { testo: 'Sento il bisogno di ripetere certi numeri' },
    { testo: 'A volte devo lavarmi o pulire solo perché mi "sembra necessario"' },
    { testo: 'Mi sento turbato/a da immagini spiacevoli o disgustose' },
  ],
  calcolaSeverita: (total) => {
    if (total >= 40) return 'Grave';
    if (total >= 28) return 'Moderata';
    if (total >= 21) return 'Lieve';
    return 'Subclinica / assenza';
  },
};

export default function Page() {
  return <QuestionnaireForm config={config} />;
}
