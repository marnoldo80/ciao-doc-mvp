'use client';
import QuestionnaireForm, { QuestionnaireConfig } from '@/components/QuestionnaireForm';

const config: QuestionnaireConfig = {
  type: 'emetofobia',
  titolo: 'Test emetofobia',
  sottotitolo: 'SPOVI · Specific Phobia of Vomiting Inventory',
  emoji: '🤢',
  istruzioni: 'Nell\'ultima settimana, in che misura le seguenti affermazioni descrivono il modo in cui ti sei sentito/a?',
  maxScore: 40,
  opzioniDefault: [
    { label: 'Per niente (0)', valore: 0 },
    { label: 'Leggermente (1)', valore: 1 },
    { label: 'Moderatamente (2)', valore: 2 },
    { label: 'Fortemente (3)', valore: 3 },
    { label: 'Estremamente (4)', valore: 4 },
  ],
  domande: [
    { testo: 'Ho evitato situazioni in cui potevo vomitare o sentirmi male' },
    { testo: 'Ho evitato posti frequentati da bambini piccoli (per paura di contagio)' },
    { testo: 'Ho controllato se stavo per vomitare' },
    { testo: 'Mi sono sentito/a ansioso/a riguardo al vomitare' },
    { testo: 'Ho fatto cose specifiche per non vomitare' },
    { testo: 'Ho evitato alcuni cibi per paura di essere malato/a' },
    { testo: 'Mi sono sentito/a in ansia nello stare vicino a qualcuno che pensavo si sentisse male' },
    { testo: 'Ho cercato rassicurazione che non avrei vomitato' },
    { testo: 'Il pensiero di vomitare mi ha turbato' },
    { testo: 'Ho evitato certi alimenti o situazioni nel caso potessero farmi vomitare' },
  ],
  calcolaSeverita: (total) => {
    if (total >= 30) return 'Emetofobia grave';
    if (total >= 20) return 'Emetofobia moderata';
    if (total >= 10) return 'Emetofobia lieve';
    return 'Assenza di emetofobia';
  },
};

export default function Page() {
  return <QuestionnaireForm config={config} />;
}
