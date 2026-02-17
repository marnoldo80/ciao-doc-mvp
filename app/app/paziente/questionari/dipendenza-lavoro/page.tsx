'use client';
import PatientQuestionnaireForm, { PatientQuestionnaireConfig } from '@/components/PatientQuestionnaireForm';

const config: PatientQuestionnaireConfig = {
  type: 'dipendenza-lavoro',
  titolo: 'Test dipendenza da lavoro',
  sottotitolo: 'BWAS · Bergen Work Addiction Scale',
  emoji: '💼',
  istruzioni: 'Nell\'ultimo anno, con quale frequenza hai avuto le seguenti esperienze legate al lavoro?',
  maxScore: 35,
  opzioniDefault: [
    { label: 'Mai (1)', valore: 1 },
    { label: 'Raramente (2)', valore: 2 },
    { label: 'A volte (3)', valore: 3 },
    { label: 'Spesso (4)', valore: 4 },
    { label: 'Sempre (5)', valore: 5 },
  ],
  domande: [
    { testo: 'Pensi a come puoi trovare più tempo per lavorare' },
    { testo: 'Hai lavorato molto più di quanto fosse inizialmente previsto' },
    { testo: 'Hai lavorato per ridurre sentimenti di colpa, ansia, impotenza e depressione' },
    { testo: 'Ti è stato detto di ridurre il lavoro senza però riuscirci' },
    { testo: 'Stai stressato/a se ti è proibito lavorare' },
    { testo: 'Hai dato priorità al lavoro rispetto ad hobby, attività ricreative e sport' },
    { testo: 'Hai lavorato così tanto che ha avuto un impatto negativo sulla tua salute' },
  ],
  calcolaSeverita: (total) => {
    if (total >= 25) return 'Alta probabilità workaholism';
    if (total >= 20) return 'Moderata probabilità workaholism';
    return 'Bassa probabilità workaholism';
  },
};

export default function Page() {
  return <PatientQuestionnaireForm config={config} />;
}
