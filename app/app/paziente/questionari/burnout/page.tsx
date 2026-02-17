'use client';
import PatientQuestionnaireForm, { PatientQuestionnaireConfig } from '@/components/PatientQuestionnaireForm';

const config: PatientQuestionnaireConfig = {
  type: 'burnout',
  titolo: 'Test burnout',
  sottotitolo: 'CBI · Copenhagen Burnout Inventory (versione personale)',
  emoji: '🔥',
  istruzioni: 'Con quale frequenza provi le seguenti sensazioni?',
  maxScore: 100,
  opzioniDefault: [
    { label: 'Mai (0)', valore: 0 },
    { label: 'Raramente (25)', valore: 25 },
    { label: 'A volte (50)', valore: 50 },
    { label: 'Spesso (75)', valore: 75 },
    { label: 'Sempre (100)', valore: 100 },
  ],
  domande: [
    { testo: 'Quanto spesso ti senti stanco/a?' },
    { testo: 'Quanto spesso ti senti fisicamente esaurito/a?' },
    { testo: 'Quanto spesso ti senti emotivamente esaurito/a?' },
    { testo: 'Quanto spesso pensi: "Non ce la faccio più"?' },
    { testo: 'Quanto spesso ti senti esaurito/a?' },
    { testo: 'Quanto spesso ti senti debole e malato/a come se volessi ammalarti?' },
    { testo: 'Il tuo lavoro è emotivamente estenuante?' },
    { testo: 'Ti senti esaurito/a per via del tuo lavoro?' },
    { testo: 'Il tuo lavoro ti frustra?' },
    { testo: 'Ti senti svuotato/a a causa del tuo lavoro?' },
    { testo: 'Senti che il tuo lavoro richiede troppo da te?' },
    { testo: 'È frustrante lavorare con i clienti/pazienti?' },
  ],
  calcolaSeverita: (total) => {
    const media = total / 12;
    if (media >= 75) return 'Burnout grave';
    if (media >= 50) return 'Burnout moderato';
    if (media >= 25) return 'Burnout lieve';
    return 'Assenza di burnout';
  },
};

export default function Page() {
  return <PatientQuestionnaireForm config={config} />;
}
