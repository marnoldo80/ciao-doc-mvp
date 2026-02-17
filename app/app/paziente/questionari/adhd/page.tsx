'use client';
import PatientQuestionnaireForm, { PatientQuestionnaireConfig } from '@/components/PatientQuestionnaireForm';

const config: PatientQuestionnaireConfig = {
  type: 'adhd',
  titolo: 'Test ADHD',
  sottotitolo: 'ASRS-v1.1 · Adult ADHD Self-Report Scale',
  emoji: '⚡',
  istruzioni: 'Indica con quale frequenza ti ritrovi nelle seguenti situazioni nella vita quotidiana.',
  maxScore: 72,
  opzioniDefault: [
    { label: 'Mai (0)', valore: 0 },
    { label: 'Raramente (1)', valore: 1 },
    { label: 'A volte (2)', valore: 2 },
    { label: 'Spesso (3)', valore: 3 },
    { label: 'Molto spesso (4)', valore: 4 },
  ],
  domande: [
    { testo: 'Quante volte hai difficoltà a finire gli ultimi dettagli di un progetto dopo le parti difficili?' },
    { testo: 'Quante volte hai difficoltà a mettere in ordine le cose quando devi fare qualcosa che richiede organizzazione?' },
    { testo: 'Quante volte hai problemi a ricordare gli appuntamenti o gli obblighi?' },
    { testo: 'Quando hai un compito noioso o difficile, quanto spesso eviti o rimandi di iniziarlo?' },
    { testo: 'Quante volte ti muovi o agiti mani o piedi quando sei seduto/a a lungo?' },
    { testo: 'Quante volte ti senti troppo attivo/a e costretto/a a fare cose come se fossi spinto/a da un motore?' },
    { testo: 'Quante volte fai errori di distrazione quando lavori su un progetto noioso o difficile?' },
    { testo: 'Quante volte hai difficoltà a mantenere l\'attenzione quando fai un lavoro noioso o ripetitivo?' },
    { testo: 'Quante volte hai difficoltà a concentrarti su ciò che ti dicono le persone, anche quando ti parlano direttamente?' },
    { testo: 'Quante volte metti male le cose o hai difficoltà a trovare le cose a casa o al lavoro?' },
    { testo: 'Quante volte sei distratto/a da attività o rumori intorno a te?' },
    { testo: 'Quante volte esci dal tuo posto durante le riunioni o altre situazioni in cui dovresti stare seduto/a?' },
    { testo: 'Quante volte ti senti irrequieto/a o agitato/a?' },
    { testo: 'Quante volte hai difficoltà a rilassarti e a ricaricarti quando hai del tempo libero?' },
    { testo: 'Quante volte ti trovi a parlare troppo nelle situazioni sociali?' },
    { testo: 'Quando sei in conversazione, quante volte finisci le frasi delle persone prima che possano farlo loro?' },
    { testo: 'Quante volte hai difficoltà ad aspettare il tuo turno in situazioni in cui è necessario attendere?' },
    { testo: 'Quante volte interrompi gli altri quando sono impegnati?' },
  ],
  calcolaSeverita: (total) => {
    if (total >= 40) return 'Alta probabilità ADHD';
    if (total >= 24) return 'Moderata probabilità ADHD';
    if (total >= 12) return 'Bassa probabilità ADHD';
    return 'Minima';
  },
};

export default function Page() {
  return <PatientQuestionnaireForm config={config} />;
}
