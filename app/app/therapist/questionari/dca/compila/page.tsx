'use client';
import QuestionnaireForm, { QuestionnaireConfig } from '@/components/QuestionnaireForm';

const config: QuestionnaireConfig = {
  type: 'dca',
  titolo: 'Test DCA',
  sottotitolo: 'EDE-Q · Eating Disorder Examination Questionnaire (versione breve)',
  emoji: '🍽️',
  istruzioni: 'Nelle ultime 4 settimane, indica quanto spesso hai avuto i seguenti pensieri o comportamenti.',
  maxScore: 30,
  opzioniDefault: [
    { label: 'Mai (0)', valore: 0 },
    { label: 'Raramente (1)', valore: 1 },
    { label: 'A volte (2)', valore: 2 },
    { label: 'Spesso (3)', valore: 3 },
    { label: 'Molto spesso (4)', valore: 4 },
    { label: 'Quasi sempre (5)', valore: 5 },
    { label: 'Sempre (6)', valore: 6 },
  ],
  domande: [
    { testo: 'Hai deliberatamente cercato di limitare la quantità di cibo che mangi per influenzare la forma o il peso del corpo?' },
    { testo: 'Hai evitato di mangiare per lunghi periodi per influenzare la forma o il peso del corpo?' },
    { testo: 'Hai cercato di escludere dalla tua dieta cibi che ami per influenzare la forma o il peso del corpo?' },
    { testo: 'Hai cercato di seguire regole precise riguardo al mangiare per influenzare forma o peso?' },
    { testo: 'Hai avuto episodi in cui mangiavi molto, con la sensazione di perdere il controllo sul mangiare?' },
    { testo: 'Hai vomitato per controllare la forma o il peso del corpo?' },
    { testo: 'Hai fatto esercizio fisico eccessivo per controllare forma o peso?' },
    { testo: 'Importanza che ha avuto il peso corporeo nel tuo modo di valutarti come persona?' },
    { testo: 'Importanza che ha avuto la forma del corpo nel tuo modo di valutarti come persona?' },
    { testo: 'Quanto ti ha disturbato vedere il tuo corpo?' },
  ],
  calcolaSeverita: (total) => {
    const media = total / 10;
    if (media >= 4) return 'Grave – intervento urgente';
    if (media >= 2.5) return 'Moderata';
    if (media >= 1) return 'Lieve';
    return 'Assenza di DCA';
  },
};

export default function Page() {
  return <QuestionnaireForm config={config} />;
}
