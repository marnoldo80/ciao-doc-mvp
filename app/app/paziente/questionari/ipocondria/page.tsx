'use client';
import PatientQuestionnaireForm, { PatientQuestionnaireConfig } from '@/components/PatientQuestionnaireForm';

const config: PatientQuestionnaireConfig = {
  type: 'ipocondria',
  titolo: 'Test ipocondria',
  sottotitolo: 'HAI · Health Anxiety Inventory (versione breve)',
  emoji: '🏥',
  istruzioni: 'Indica quanto le seguenti situazioni ti hanno riguardato nell\'ultimo mese.',
  maxScore: 18,
  opzioniDefault: [
    { label: 'No / Mai (0)', valore: 0 },
    { label: 'Raramente / Un po\' (1)', valore: 1 },
    { label: 'Moderatamente (2)', valore: 2 },
    { label: 'Molto / Sempre (3)', valore: 3 },
  ],
  domande: [
    { testo: 'Mi preoccupo per la mia salute' },
    { testo: 'Noto dolori nel mio corpo' },
    { testo: 'Sono consapevole delle sensazioni nel mio corpo' },
    { testo: 'Se sento parlare di una malattia penso di avercela' },
    { testo: 'Se ho una sensazione insolita nel corpo mi preoccupo che possa essere seriamente malato/a' },
    { testo: 'La mia famiglia o i miei amici mi dicono che sono eccessivamente preoccupato/a per la mia salute' },
  ],
  calcolaSeverita: (total) => {
    if (total >= 15) return 'Ansia per la salute grave';
    if (total >= 10) return 'Ansia per la salute moderata';
    if (total >= 5) return 'Ansia per la salute lieve';
    return 'Assenza di ipocondria';
  },
};

export default function Page() {
  return <PatientQuestionnaireForm config={config} />;
}
