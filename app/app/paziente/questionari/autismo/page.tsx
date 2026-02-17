'use client';
import PatientQuestionnaireForm, { PatientQuestionnaireConfig } from '@/components/PatientQuestionnaireForm';

const config: PatientQuestionnaireConfig = {
  type: 'autismo',
  titolo: 'Test autismo',
  sottotitolo: 'AQ-10 · Autism Spectrum Quotient (versione breve)',
  emoji: '🧩',
  istruzioni: 'Indica quanto sei d\'accordo con le seguenti affermazioni.',
  maxScore: 10,
  opzioniDefault: [
    { label: 'Concordo pienamente (0)', valore: 0 },
    { label: 'Concordo un po\' (0)', valore: 0 },
    { label: 'Discordo un po\' (1)', valore: 1 },
    { label: 'Discordo pienamente (1)', valore: 1 },
  ],
  domande: [
    { testo: 'Noto regolarmente piccoli suoni che gli altri non sentono' },
    { testo: 'Di solito mi concentro più sull\'insieme che sui singoli dettagli' },
    { testo: 'Trovo facile fare due cose contemporaneamente' },
    { testo: 'Se c\'è un\'interruzione, posso tornare facilmente a quello che stavo facendo' },
    { testo: 'Trovo facile "leggere tra le righe" quando qualcuno parla con me' },
    { testo: 'So quando è il mio turno in una conversazione' },
    { testo: 'Quando leggo una storia, trovo difficile capire le intenzioni dei personaggi' },
    { testo: 'Mi piace raccogliere informazioni sulle categorie di cose (es. tipi di auto, uccelli, treni)' },
    { testo: 'Trovo facile capire cosa pensa o sente qualcuno guardando la sua espressione' },
    { testo: 'Trovo difficile capire le sfumature nelle intenzioni delle persone' },
  ],
  calcolaSeverita: (total) => {
    if (total >= 6) return 'Possibile spettro autistico – approfondire';
    if (total >= 4) return 'Caratteristiche autistiche borderline';
    return 'Punteggio nella norma';
  },
};

export default function Page() {
  return <PatientQuestionnaireForm config={config} />;
}
