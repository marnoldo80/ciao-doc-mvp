'use client';
import PatientQuestionnaireForm, { PatientQuestionnaireConfig } from '@/components/PatientQuestionnaireForm';

const config: PatientQuestionnaireConfig = {
  type: 'borderline',
  titolo: 'Test disturbo borderline',
  sottotitolo: 'MSI-BPD · McLean Screening Instrument for BPD',
  emoji: '🌊',
  istruzioni: 'Rispondi sì o no per ciascuna delle seguenti affermazioni.',
  maxScore: 10,
  opzioniDefault: [
    { label: 'No (0)', valore: 0 },
    { label: 'Sì (1)', valore: 1 },
  ],
  domande: [
    { testo: 'Hai fatto delle cose impulsive che potrebbero causare danno a te (es. guida spericolata, sesso a rischio, spese eccessive)?' },
    { testo: 'Hai avuto relazioni intensissime ma instabili?' },
    { testo: 'Hai avuto pensieri di suicidio o di farti del male?' },
    { testo: 'Hai avuto bruschi cambiamenti nel modo in cui ti senti riguardo alle persone (da molto positivo a molto negativo)?' },
    { testo: 'Hai avuto forti sbalzi d\'umore nell\'arco di poche ore o giorni?' },
    { testo: 'Ti sei sentito/a spesso arrabbiato/a?' },
    { testo: 'Hai avuto difficoltà a controllare la tua rabbia (liti, aggressività)?' },
    { testo: 'Hai avuto sensazione di vuoto o noia persistente?' },
    { testo: 'Ti sei sentito/a confuso/a su chi sei o cosa vuoi nella vita?' },
    { testo: 'Hai avuto sensazioni di smettere di esistere o di sentirti fuori dal tuo corpo?' },
  ],
  calcolaSeverita: (total) => {
    if (total >= 7) return 'Alta probabilità BPD – approfondire';
    if (total >= 4) return 'Moderata probabilità BPD';
    return 'Bassa probabilità BPD';
  },
};

export default function Page() {
  return <PatientQuestionnaireForm config={config} />;
}
