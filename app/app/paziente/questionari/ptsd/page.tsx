'use client';
import PatientQuestionnaireForm, { PatientQuestionnaireConfig } from '@/components/PatientQuestionnaireForm';

const config: PatientQuestionnaireConfig = {
  type: 'ptsd',
  titolo: 'Test PTSD',
  sottotitolo: 'PCL-5 · PTSD Checklist for DSM-5',
  emoji: '💥',
  istruzioni: 'Nell\'ultimo mese, quanto sei stato/a disturbato/a dai seguenti problemi collegati a un\'esperienza stressante passata?',
  maxScore: 80,
  opzioniDefault: [
    { label: 'Per niente (0)', valore: 0 },
    { label: 'Un po\' (1)', valore: 1 },
    { label: 'Moderatamente (2)', valore: 2 },
    { label: 'Molto (3)', valore: 3 },
    { label: 'Moltissimo (4)', valore: 4 },
  ],
  domande: [
    { testo: 'Ricordi ripetuti, disturbanti e indesiderati dell\'esperienza stressante' },
    { testo: 'Sogni disturbanti riguardanti l\'esperienza' },
    { testo: 'Sentire o agire improvvisamente come se l\'esperienza stesse accadendo di nuovo (flashback)' },
    { testo: 'Sentirsi turbato/a quando qualcosa ti ricordava l\'esperienza' },
    { testo: 'Reazioni fisiche forti quando qualcosa ti ricordava l\'esperienza' },
    { testo: 'Evitare i ricordi, i pensieri o i sentimenti relativi all\'esperienza' },
    { testo: 'Evitare persone, luoghi, conversazioni, attività o situazioni che ti ricordano l\'esperienza' },
    { testo: 'Problemi a ricordare parti importanti dell\'esperienza stressante' },
    { testo: 'Credenze negative su te stesso/a, gli altri o il mondo' },
    { testo: 'Incolpare te stesso/a o gli altri per l\'esperienza o per ciò che è successo dopo' },
    { testo: 'Avere sentimenti forti negativi come paura, orrore, rabbia, senso di colpa o vergogna' },
    { testo: 'Perdita di interesse nelle attività che prima amavi' },
    { testo: 'Sentirti distante o distaccato/a dagli altri' },
    { testo: 'Difficoltà a provare emozioni positive' },
    { testo: 'Comportamento irritabile, scoppi d\'ira o aggressività' },
    { testo: 'Prendersi rischi inutili o fare cose che potrebbero causarti del male' },
    { testo: 'Essere "super allerta" o vigile o guardingo/a' },
    { testo: 'Sentirsi nervoso/a o facilmente sorprendibile' },
    { testo: 'Difficoltà di concentrazione' },
    { testo: 'Problemi di sonno' },
  ],
  calcolaSeverita: (total) => {
    if (total >= 33) return 'PTSD probabile – valutazione clinica necessaria';
    if (total >= 20) return 'Sintomi significativi – monitorare';
    return 'Sotto soglia clinica';
  },
};

export default function Page() {
  return <PatientQuestionnaireForm config={config} />;
}
