'use client';
import QuestionnaireForm, { QuestionnaireConfig } from '@/components/QuestionnaireForm';

const config: QuestionnaireConfig = {
  type: 'autostima',
  titolo: 'Test autostima',
  sottotitolo: 'RSES · Scala di Rosenberg',
  emoji: '💪',
  istruzioni: 'Indica quanto sei d\'accordo con le seguenti affermazioni riguardo a te stesso/a.',
  maxScore: 30,
  opzioniDefault: [
    { label: 'Molto d\'accordo (3)', valore: 3 },
    { label: 'D\'accordo (2)', valore: 2 },
    { label: 'In disaccordo (1)', valore: 1 },
    { label: 'Molto in disaccordo (0)', valore: 0 },
  ],
  domande: [
    { testo: 'Nel complesso sono soddisfatto/a di me stesso/a' },
    { testo: 'A volte penso di non valere niente (inverso)' },
    { testo: 'Sento di avere diverse buone qualità' },
    { testo: 'Sono capace di fare le cose altrettanto bene come la maggior parte delle persone' },
    { testo: 'Sento di avere poco di cui essere orgoglioso/a (inverso)' },
    { testo: 'A volte mi sento inutile (inverso)' },
    { testo: 'Sento di essere una persona di valore, almeno quanto gli altri' },
    { testo: 'Desidero avere più rispetto per me stesso/a (inverso)' },
    { testo: 'Tutto sommato tendo a sentirmi un fallimento (inverso)' },
    { testo: 'Ho un atteggiamento positivo verso me stesso/a' },
  ],
  calcolaSeverita: (total) => {
    if (total >= 25) return 'Alta autostima';
    if (total >= 15) return 'Autostima nella norma';
    if (total >= 8) return 'Bassa autostima';
    return 'Autostima molto bassa';
  },
};

export default function Page() {
  return <QuestionnaireForm config={config} />;
}
