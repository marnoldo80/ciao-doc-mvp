'use client';
import PatientQuestionnaireForm, { PatientQuestionnaireConfig } from '@/components/PatientQuestionnaireForm';

const config: PatientQuestionnaireConfig = {
  type: 'dipendenza-internet',
  titolo: 'Test dipendenza da internet',
  sottotitolo: 'IAT · Internet Addiction Test (versione breve)',
  emoji: '📱',
  istruzioni: 'Indica con quale frequenza si verificano le seguenti situazioni nella tua vita.',
  maxScore: 60,
  opzioniDefault: [
    { label: 'Raramente (1)', valore: 1 },
    { label: 'A volte (2)', valore: 2 },
    { label: 'Frequentemente (3)', valore: 3 },
    { label: 'Spesso (4)', valore: 4 },
    { label: 'Sempre (5)', valore: 5 },
  ],
  domande: [
    { testo: 'Quanto spesso passi più tempo online di quanto avevi intenzione?' },
    { testo: 'Quanto spesso le persone a casa tua si lamentano del tempo che passi online?' },
    { testo: 'Quanto spesso controlli le email prima di fare altro?' },
    { testo: 'Quanto spesso Internet interferisce con la tua vita scolastica/lavorativa?' },
    { testo: 'Quanto spesso formi nuove relazioni con altri utenti online?' },
    { testo: 'Quanto spesso ti senti depresso/a, di cattivo umore o nervoso/a quando sei offline e ti senti meglio quando ritorni online?' },
    { testo: 'Quanto spesso perdi sonno a causa di Internet?' },
    { testo: 'Quanto spesso preferisci la vita online a quella reale?' },
    { testo: 'Quanto spesso dici alle persone "solo ancora un po\'" quando sei online?' },
    { testo: 'Quanto spesso pensi a Internet quando sei offline?' },
    { testo: 'Quanto spesso cerchi di nascondere quanto tempo trascorri online?' },
    { testo: 'Quanto spesso preferisci passare più tempo online piuttosto che uscire con gli altri?' },
  ],
  calcolaSeverita: (total) => {
    if (total >= 49) return 'Dipendenza da internet significativa';
    if (total >= 31) return 'Uso problematico – monitorare';
    return 'Uso normale / basso rischio';
  },
};

export default function Page() {
  return <PatientQuestionnaireForm config={config} />;
}
