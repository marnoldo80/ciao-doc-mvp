'use client';
import QuestionnaireForm, { QuestionnaireConfig } from '@/components/QuestionnaireForm';

const config: QuestionnaireConfig = {
  type: 'binge-eating',
  titolo: 'Test binge eating',
  sottotitolo: 'BES · Binge Eating Scale',
  emoji: '🍰',
  istruzioni: 'Scegli l\'affermazione che meglio descrive il tuo comportamento alimentare.',
  maxScore: 46,
  opzioniDefault: [
    { label: 'Mai (0)', valore: 0 },
    { label: 'Raramente (1)', valore: 1 },
    { label: 'A volte (2)', valore: 2 },
    { label: 'Spesso (3)', valore: 3 },
  ],
  domande: [
    { testo: 'Mangio molto più del necessario arrivando a sentirmi pieno/a in modo scomodo' },
    { testo: 'Ho episodi in cui mangio in modo incontrollato' },
    { testo: 'Mi vergogno di quanto mangio' },
    { testo: 'Mi sento colpevole dopo aver mangiato troppo' },
    { testo: 'Mangio da solo/a perché mi vergogno della quantità di cibo che mangio' },
    { testo: 'Mangio anche quando non ho fame' },
    { testo: 'Dopo aver mangiato molto mi sento depresso/a' },
    { testo: 'Penso al cibo quando non ho fame' },
    { testo: 'Continuo a mangiare anche quando sono sazio/a' },
    { testo: 'Dopo un episodio di abbuffata mi sento disgustato/a da me stesso/a' },
    { testo: 'Mi sento come se non potessi smettere di mangiare' },
    { testo: 'Uso il cibo per affrontare stati emotivi negativi' },
    { testo: 'Non sono in grado di determinare quando sono sazio/a' },
    { testo: 'Penso che il mio modo di mangiare sia fuori controllo' },
    { testo: 'Mangio molto più velocemente del normale durante gli episodi di abbuffata' },
    { testo: 'Mi sento triste, depresso/a o ansioso/a prima di un episodio di abbuffata' },
  ],
  calcolaSeverita: (total) => {
    if (total >= 27) return 'Binge eating grave';
    if (total >= 17) return 'Binge eating moderato';
    return 'Binge eating assente o lieve';
  },
};

export default function Page() {
  return <QuestionnaireForm config={config} />;
}
