'use client';
import QuestionnaireForm, { QuestionnaireConfig } from '@/components/QuestionnaireForm';

const config: QuestionnaireConfig = {
  type: 'dismorfofobia',
  titolo: 'Test dismorfofobia',
  sottotitolo: 'BDDQ · Body Dysmorphic Disorder Questionnaire',
  emoji: '🪞',
  istruzioni: 'Indica come ti sei sentito/a riguardo al tuo aspetto fisico nell\'ultimo mese.',
  maxScore: 28,
  opzioniDefault: [
    { label: 'Mai (0)', valore: 0 },
    { label: 'Raramente (1)', valore: 1 },
    { label: 'A volte (2)', valore: 2 },
    { label: 'Spesso (3)', valore: 3 },
    { label: 'Sempre (4)', valore: 4 },
  ],
  domande: [
    { testo: 'Sei preoccupato/a per il tuo aspetto fisico?' },
    { testo: 'Pensi che uno o più difetti del tuo aspetto siano evidenti agli altri?' },
    { testo: 'Ti preoccupi del tuo aspetto più di 1 ora al giorno?' },
    { testo: 'La preoccupazione per il tuo aspetto ti causa sofferenza?' },
    { testo: 'Eviti attività sociali a causa di preoccupazioni sull\'aspetto fisico?' },
    { testo: 'Ti guardi allo specchio ripetutamente per controllare i tuoi "difetti"?' },
    { testo: 'Chiedi frequentemente rassicurazione agli altri sul tuo aspetto?' },
  ],
  calcolaSeverita: (total) => {
    if (total >= 20) return 'BDD grave – intervento urgente';
    if (total >= 12) return 'BDD moderata';
    if (total >= 6) return 'BDD lieve';
    return 'Assenza di BDD';
  },
};

export default function Page() {
  return <QuestionnaireForm config={config} />;
}
