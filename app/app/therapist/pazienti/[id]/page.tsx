'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import AISuggestionsModal from '@/components/AISuggestionsModal';
import CalendarPicker from '@/components/CalendarPicker';
import QuickAppointmentModal from '@/components/QuickAppointmentModal';
import SessionRatesForm from '@/components/SessionRatesForm';
import { useRouter } from 'next/navigation';
import ResendCredentialsButton from '@/components/ResendCredentialsButton';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Patient = {
  id: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  birth_date: string | null;
  birth_place: string | null;
  fiscal_code: string | null;
  city: string | null;
  postal_code: string | null;
  province: string | null;
  medico_mmg: string | null;
  issues: string | null;
  goals: string | null;
  session_duration_individual: number;
  session_duration_couple: number;
  session_duration_family: number;
  rate_individual: number;
  rate_couple: number;
  rate_family: number;
};

type TherapyPlan = {
  id: string;
  anamnesi: string | null;
  valutazione_psicodiagnostica: string | null;
  formulazione_caso: string | null;
  obiettivi_generali: any[];
  obiettivi_specifici: any[];
  esercizi: any[];
};

type SessionNote = {
  id: string;
  session_date: string;
  notes: string | null;
  ai_summary: string | null;
};

type GAD7Result = {
  id: string;
  total: number;
  severity: string;
  created_at: string;
};

type Appointment = {
  id: string;
  title: string;
  starts_at: string;
};

type PatientNote = {
  id: string;
  note_date: string;
  content: string;
};

type AppointmentMessage = {
  id: string;
  appointment_id: string;
  message: string;
  created_at: string;
  read_by_therapist: boolean;
};

type ObjectiveCompletion = {
  id: string;
  objective_index: number;
  objective_text: string;
  completed: boolean;
  objective_type: string;
  completed_at: string | null;
};

type ExerciseCompletion = {
  id: string;
  exercise_index: number;
  exercise_text: string;
  completed: boolean;
  completed_at: string | null;
};

type ConsentDocument = {
  id: string;
  therapist_signature: string;
  therapist_signature_type: string;
  patient_signature: string | null;
  patient_signature_type: string | null;
  tessera_sanitaria_consent: boolean;
  status: string;
  created_at: string;
  therapist_signed_at: string;
  patient_signed_at: string | null;
};

type Suggestions = {
  obiettivi_generali: string[];
  obiettivi_specifici: string[];
  esercizi: string[];
  note: string;
};

// Stili comuni riusabili
const cardStyle = {
  background: '#141a2c',
  border: '1px solid #26304b',
  borderRadius: '16px',
  padding: '24px',
};

const inputStyle = {
  width: '100%',
  background: '#0b0f1c',
  border: '2px solid #26304b',
  borderRadius: '8px',
  padding: '10px 12px',
  color: '#f1f5ff',
  fontSize: '14px',
  outline: 'none',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontWeight: 500,
  marginBottom: '6px',
  color: '#a8b2d6',
  fontSize: '14px',
};

const btnPrimary: React.CSSProperties = {
  background: '#7aa2ff',
  color: '#0b1022',
  border: 'none',
  borderRadius: '8px',
  padding: '8px 16px',
  fontWeight: 600,
  cursor: 'pointer',
  fontSize: '14px',
};

const btnSecondary: React.CSSProperties = {
  background: '#141a2c',
  color: '#a8b2d6',
  border: '1px solid #26304b',
  borderRadius: '8px',
  padding: '8px 16px',
  fontWeight: 500,
  cursor: 'pointer',
  fontSize: '14px',
};

const btnDanger: React.CSSProperties = {
  background: 'rgba(239,68,68,0.1)',
  color: '#ef4444',
  border: '1px solid rgba(239,68,68,0.3)',
  borderRadius: '8px',
  padding: '8px 16px',
  fontWeight: 500,
  cursor: 'pointer',
  fontSize: '14px',
};

// ===== COMPONENTE SEDUTE TAB =====
function SeduteTab({ id, sessionNotes, onOpenCalendar, loadData }: {
  id: string;
  sessionNotes: SessionNote[];
  onOpenCalendar: () => void;
  loadData: () => void;
}) {
  const router = useRouter();
  const [allAppointments, setAllAppointments] = useState<any[]>([]);
  const [loadingApts, setLoadingApts] = useState(true);
  const [filterApts, setFilterApts] = useState<'all' | 'upcoming' | 'past'>('all');

  useEffect(() => {
    loadAppointments();
  }, [id, filterApts]);

  async function loadAppointments() {
    setLoadingApts(true);
    try {
      let query = supabase
        .from('appointments')
        .select('id, title, starts_at, ends_at, status, location')
        .eq('patient_id', id)
        .order('starts_at', { ascending: false });

      if (filterApts === 'upcoming') {
        query = query.gte('starts_at', new Date().toISOString());
      } else if (filterApts === 'past') {
        query = query.lt('starts_at', new Date().toISOString());
      }

      const { data } = await query;
      setAllAppointments(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingApts(false);
    }
  }

  const upcoming = allAppointments.filter(a => new Date(a.starts_at) >= new Date());
  const past = allAppointments.filter(a => new Date(a.starts_at) < new Date());

  return (
    <div className="space-y-6">

      {/* Sezione Appuntamenti */}
      <div style={{ background: '#141a2c', border: '1px solid #26304b', borderRadius: '16px', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f1f5ff' }}>📅 Tutti gli Appuntamenti</h3>
          <button
            onClick={onOpenCalendar}
            style={{ background: '#7aa2ff', color: '#0b1022', border: 'none', borderRadius: '8px', padding: '8px 16px', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#9ab8ff')}
            onMouseLeave={e => (e.currentTarget.style.background = '#7aa2ff')}
          >
            + Nuovo Appuntamento
          </button>
        </div>

        {/* Filtri appuntamenti */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {(['all', 'upcoming', 'past'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilterApts(f)}
              style={{
                background: filterApts === f ? 'rgba(122,162,255,0.15)' : '#0b0f1c',
                color: filterApts === f ? '#7aa2ff' : '#a8b2d6',
                border: filterApts === f ? '1px solid #7aa2ff' : '1px solid #26304b',
                borderRadius: '8px', padding: '6px 14px', fontSize: '13px', fontWeight: 500, cursor: 'pointer'
              }}
            >
              {f === 'all' ? `Tutti (${allAppointments.length})` : f === 'upcoming' ? `Prossimi (${upcoming.length})` : `Passati (${past.length})`}
            </button>
          ))}
        </div>

        {loadingApts ? (
          <div style={{ textAlign: 'center', padding: '24px', color: '#a8b2d6' }}>Caricamento...</div>
        ) : allAppointments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: '#a8b2d6' }}>
            <div style={{ fontSize: '36px', marginBottom: '10px' }}>📭</div>
            <p style={{ fontSize: '14px', marginBottom: '14px' }}>Nessun appuntamento trovato</p>
            <button onClick={onOpenCalendar} style={{ background: '#7aa2ff', color: '#0b1022', border: 'none', borderRadius: '8px', padding: '8px 16px', fontWeight: 600, cursor: 'pointer' }}>
              + Pianifica ora
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {allAppointments.map(apt => {
              const isPast = new Date(apt.starts_at) < new Date();
              const aptDateStr = apt.starts_at?.substring(0, 10);
              // Trova la nota già salvata per questo appuntamento (per data)
              const existingNote = sessionNotes.find(n => n.session_date?.startsWith(aptDateStr));
              const hasNote = !!existingNote;

              // Destinazione bottone: se ha nota → apri dettaglio; se no → crea nuova seduta
              const buttonDest = hasNote
                ? `/app/therapist/sedute/${existingNote!.id}`
                : `/app/therapist/sedute/nuovo?patientId=${id}&appointmentId=${apt.id}`;

              return (
                <div
                  key={apt.id}
                  style={{ background: '#0b0f1c', border: '1px solid #26304b', borderRadius: '12px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', transition: 'border-color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#7aa2ff')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#26304b')}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#f1f5ff' }}>{apt.title}</span>
                      {isPast && hasNote && (
                        <span style={{ fontSize: '11px', background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '999px', padding: '2px 8px' }}>
                          📝 Nota presente
                        </span>
                      )}
                      {isPast && !hasNote && (
                        <span style={{ fontSize: '11px', background: 'rgba(249,115,22,0.1)', color: '#f97316', border: '1px solid rgba(249,115,22,0.2)', borderRadius: '999px', padding: '2px 8px' }}>
                          ⚠️ Nessuna nota
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '13px', color: '#7aa2ff' }}>
                      📅 {new Date(apt.starts_at).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      {' · '}
                      🕐 {new Date(apt.starts_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })} – {new Date(apt.ends_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {apt.location && <div style={{ fontSize: '12px', color: '#a8b2d6', marginTop: '3px' }}>📍 {apt.location}</div>}
                  </div>

                  {/* Bottone: apri nota esistente o crea nuova seduta */}
                  <button
                    onClick={() => router.push(buttonDest)}
                    style={{
                      background: isPast ? '#1a2236' : '#7aa2ff',
                      color: isPast ? '#7aa2ff' : '#0b1022',
                      border: isPast ? '1px solid rgba(122,162,255,0.3)' : 'none',
                      borderRadius: '10px',
                      padding: '9px 16px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '13px',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = isPast ? '#243050' : '#9ab8ff'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = isPast ? '#1a2236' : '#7aa2ff'; }}
                  >
                    {!isPast ? '🎙️ Entra nell\'appuntamento' : hasNote ? '📖 Vedi seduta' : '📝 Crea nota seduta'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}

// ===== STORICO QUESTIONARI UNIFICATO =====
type QResult = { id: string; type: string; total: number; severity: string | null; created_at: string };

function QuestionnaireHistorySection({ patientId, gad7Results }: { patientId: string; gad7Results: GAD7Result[] }) {
  const [qResults, setQResults] = useState<QResult[]>([]);
  const [loading, setLoading] = useState(true);

  const typeLabel: Record<string, string> = {
    'ansia': '😰 Test ansia', 'ansia-sociale': '👥 Test ansia sociale', 'adhd': '⚡ Test ADHD',
    'alessitimia': '🎭 Test alessitimia', 'autismo': '🧩 Test autismo', 'autostima': '💪 Test autostima',
    'burnout': '🔥 Test burnout', 'depressione': '🌧️ Test depressione', 'depressione-post-partum': '👶 Test dep. post-partum',
    'dca': '🍽️ Test DCA', 'doc': '🔄 Test DOC', 'insonnia': '🌙 Test insonnia',
    'ipocondria': '🏥 Test ipocondria', 'borderline': '🌊 Test borderline', 'cannabis': '🌿 Test cannabis',
    'dipendenza-lavoro': '💼 Dip. da lavoro', 'dipendenza-internet': '📱 Dip. da internet', 'ptsd': '💥 Test PTSD',
    'dismorfofobia': '🪞 Dismorfofobia', 'emetofobia': '🤢 Emetofobia', 'binge-eating': '🍰 Binge eating',
    'orientamento-psicoterapeutico': '🧭 Orientamento',
  };

  useEffect(() => {
    supabase.from('questionnaire_results').select('id, type, total, severity, created_at')
      .eq('patient_id', patientId).order('created_at', { ascending: false })
      .then(({ data }) => { setQResults(data || []); setLoading(false); });
  }, [patientId]);

  const severityBg = (s: string | null) => {
    if (!s) return 'rgba(168,178,214,0.1)';
    if (s.includes('rave') || s.includes('severa') || s.includes('urgente') || s.includes('Alta')) return 'rgba(239,68,68,0.15)';
    if (s.includes('oderata') || s.includes('media') || s.includes('Moderata') || s.includes('ossibile')) return 'rgba(234,179,8,0.15)';
    if (s.includes('ieve') || s.includes('bassa') || s.includes('Bassa') || s.includes('Lieve') || s.includes('ormale') || s.includes('ssenza')) return 'rgba(34,197,94,0.15)';
    return 'rgba(122,162,255,0.15)';
  };
  const severityColor = (s: string | null) => {
    if (!s) return '#a8b2d6';
    if (s.includes('rave') || s.includes('severa') || s.includes('urgente') || s.includes('Alta')) return '#ef4444';
    if (s.includes('oderata') || s.includes('media') || s.includes('Moderata') || s.includes('ossibile')) return '#eab308';
    if (s.includes('ieve') || s.includes('bassa') || s.includes('Bassa') || s.includes('ormale') || s.includes('ssenza')) return '#22c55e';
    return '#7aa2ff';
  };

  const gad7AsQ: QResult[] = gad7Results.map(r => ({ id: r.id, type: 'ansia', total: r.total, severity: r.severity, created_at: r.created_at }));
  const allResults = [...gad7AsQ, ...qResults].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const cardStyle2 = { background: '#141a2c', border: '1px solid #26304b', borderRadius: '16px', padding: '24px' };

  return (
    <div style={cardStyle2}>
      <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f1f5ff', marginBottom: '16px' }}>📈 Storico Risultati</h3>
      {loading ? (
        <div style={{ color: '#a8b2d6', textAlign: 'center', padding: '24px' }}>Caricamento...</div>
      ) : allResults.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px 0', color: '#a8b2d6' }}>
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>📊</div>
          <p style={{ fontSize: '14px' }}>Nessun questionario completato ancora</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 80px 1fr 100px', gap: '12px', fontSize: '11px', fontWeight: 700, color: '#a8b2d6', paddingBottom: '8px', borderBottom: '1px solid #26304b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <div>Questionario</div><div>Punteggio</div><div>Risultato</div><div>Data</div>
          </div>
          {allResults.map(result => (
            <div key={result.id} style={{ display: 'grid', gridTemplateColumns: '2fr 80px 1fr 100px', gap: '12px', padding: '10px 0', borderBottom: '1px solid rgba(38,48,75,0.5)', alignItems: 'center' }}>
              <div style={{ fontSize: '13px', color: '#f1f5ff', fontWeight: 500 }}>{typeLabel[result.type] || result.type}</div>
              <div style={{ fontFamily: 'monospace', fontSize: '15px', fontWeight: 700, color: '#f1f5ff' }}>{result.total}</div>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '999px', background: severityBg(result.severity), color: severityColor(result.severity) }}>
                  {result.severity || '—'}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#a8b2d6' }}>{new Date(result.created_at).toLocaleDateString('it-IT')}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PatientPage() {
  const params = useParams();
  const id = params?.id as string;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [therapyPlan, setTherapyPlan] = useState<TherapyPlan | null>(null);
  const [sessionNotes, setSessionNotes] = useState<SessionNote[]>([]);
  const [gad7Results, setGad7Results] = useState<GAD7Result[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patientNotes, setPatientNotes] = useState<PatientNote[]>([]);
  const [patientThoughts, setPatientThoughts] = useState<string>('');
  const [appointmentMessages, setAppointmentMessages] = useState<AppointmentMessage[]>([]);
  const [objectivesCompletion, setObjectivesCompletion] = useState<ObjectiveCompletion[]>([]);
  const [exercisesCompletion, setExercisesCompletion] = useState<ExerciseCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profilo' | 'valutazione' | 'obiettivi' | 'area-paziente' | 'sedute' | 'questionari'>('profilo');
  const [editValutazioneMode, setEditValutazioneMode] = useState(false);
  const [editObiettiviMode, setEditObiettiviMode] = useState(false);

  const [anamnesi, setAnamnesi] = useState('');
  const [valutazionePsico, setValutazionePsico] = useState('');
  const [formulazioneCaso, setFormulazioneCaso] = useState('');
  const [obiettiviGenerali, setObiettiviGenerali] = useState<string[]>([]);
  const [obiettiviSpecifici, setObiettiviSpecifici] = useState<string[]>([]);
  const [esercizi, setEsercizi] = useState<string[]>([]);

  const [showAIModal, setShowAIModal] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<Suggestions | null>(null);
  const [aiAssessment, setAiAssessment] = useState<{ anamnesi: string; valutazione_psicodiagnostica: string; formulazione_caso: string } | null>(null);
  const [aiModalMode, setAiModalMode] = useState<'obiettivi' | 'valutazione'>('obiettivi');
  const [aiLoading, setAiLoading] = useState(false);
  const [generatingObjectives, setGeneratingObjectives] = useState(false);
  const [sendingObjectives, setSendingObjectives] = useState(false);
  const [selectedObiettiviGenerali, setSelectedObiettiviGenerali] = useState<Set<number>>(new Set());
  const [selectedObiettiviSpecifici, setSelectedObiettiviSpecifici] = useState<Set<number>>(new Set());
  const [selectedEsercizi, setSelectedEsercizi] = useState<Set<number>>(new Set());

  const [showCalendarPicker, setShowCalendarPicker] = useState(false);
  const [showQuickModal, setShowQuickModal] = useState(false);
  const [selectedDateTime, setSelectedDateTime] = useState<string | null>(null);
  const router = useRouter();

  const [editPatientMode, setEditPatientMode] = useState(false);
  const [editPatientData, setEditPatientData] = useState<any>({});
  const [savingPatient, setSavingPatient] = useState(false);
  const [consentDocuments, setConsentDocuments] = useState<ConsentDocument[]>([]);

  useEffect(() => {
    if (!id) return;
    loadData();
  }, [id]);

  useEffect(() => {
    if (patient) setEditPatientData(patient);
  }, [patient]);

  // Ascolta evento applyAssessment dal modal valutazione
  useEffect(() => {
    function handleApplyAssessment(e: Event) {
      const detail = (e as CustomEvent).detail;
      if (detail) {
        setAnamnesi(detail.anamnesi || '');
        setValutazionePsico(detail.valutazione_psicodiagnostica || '');
        setFormulazioneCaso(detail.formulazione_caso || '');
        setEditValutazioneMode(true);
        alert('✅ Valutazione applicata! Rivedi e salva.');
      }
    }
    window.addEventListener('applyAssessment', handleApplyAssessment);
    return () => window.removeEventListener('applyAssessment', handleApplyAssessment);
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 500));
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: patientData } = await supabase.from('patients').select('*').eq('id', id).single();
      setPatient(patientData);

      const { data: planData } = await supabase.from('therapy_plan').select('*').eq('patient_id', id).maybeSingle();
      if (planData) {
        setTherapyPlan(planData);
        setAnamnesi(planData.anamnesi || '');
        setValutazionePsico(planData.valutazione_psicodiagnostica || '');
        setFormulazioneCaso(planData.formulazione_caso || '');
        setObiettiviGenerali(planData.obiettivi_generali || []);
        setObiettiviSpecifici(planData.obiettivi_specifici || []);
        setEsercizi(planData.esercizi || []);
      }

      const { data: notesData } = await supabase.from('session_notes').select('*').eq('patient_id', id).order('session_date', { ascending: false });
      setSessionNotes(notesData || []);

      const { data: gad7Data } = await supabase.from('gad7_results').select('id, total, severity, created_at').eq('patient_id', id).order('created_at', { ascending: false });
      setGad7Results(gad7Data || []);

      const { data: apptsData } = await supabase.from('appointments').select('id, title, starts_at').eq('patient_id', id).gte('starts_at', new Date().toISOString()).order('starts_at', { ascending: true }).limit(3);
      setAppointments(apptsData || []);

      const { data: thoughtsData } = await supabase.from('patient_session_thoughts').select('content').eq('patient_id', id).order('created_at', { ascending: false }).limit(1).maybeSingle();
      setPatientThoughts(thoughtsData?.content || '');

      const { data: diaryData } = await supabase.from('patient_notes').select('*').eq('patient_id', id).order('note_date', { ascending: false }).limit(10);
      setPatientNotes(diaryData || []);

      const { data: messagesData } = await supabase.from('appointment_messages').select('*').eq('patient_id', id).order('created_at', { ascending: false });
      setAppointmentMessages(messagesData || []);

      const { data: objData } = await supabase.from('objectives_completion').select('*').eq('patient_id', id);
      setObjectivesCompletion(objData || []);

      const { data: exData } = await supabase.from('exercises_completion').select('*').eq('patient_id', id);
      setExercisesCompletion(exData || []);

      const { data: consentsData } = await supabase.from('consent_documents').select('*').eq('patient_id', id).order('created_at', { ascending: false });
      setConsentDocuments(consentsData || []);

    } catch (e) {
      console.error('Errore:', e);
    } finally {
      setLoading(false);
    }
  }

  async function saveValutazione() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const planData = { patient_id: id, therapist_user_id: user.id, anamnesi, valutazione_psicodiagnostica: valutazionePsico, formulazione_caso: formulazioneCaso, obiettivi_generali: obiettiviGenerali, obiettivi_specifici: obiettiviSpecifici, esercizi };
      if (therapyPlan?.id) { await supabase.from('therapy_plan').update(planData).eq('id', therapyPlan.id); }
      else { await supabase.from('therapy_plan').insert(planData); }
      alert('✅ Valutazione salvata!');
      setEditValutazioneMode(false);
      loadData();
    } catch (e: any) { alert('Errore: ' + e.message); }
  }

  async function saveObiettivi() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const planData = { patient_id: id, therapist_user_id: user.id, anamnesi, valutazione_psicodiagnostica: valutazionePsico, formulazione_caso: formulazioneCaso, obiettivi_generali: obiettiviGenerali, obiettivi_specifici: obiettiviSpecifici, esercizi };
      if (therapyPlan?.id) { await supabase.from('therapy_plan').update(planData).eq('id', therapyPlan.id); }
      else { await supabase.from('therapy_plan').insert(planData); }
      await syncObjectivesCompletion();
      await syncExercisesCompletion();
      alert('✅ Obiettivi e Esercizi salvati!');
      setEditObiettiviMode(false);
      loadData();
    } catch (e: any) { alert('Errore: ' + e.message); }
  }

  async function syncObjectivesCompletion() {
    await supabase.from('objectives_completion').delete().eq('patient_id', id);
    const generalObjs = obiettiviGenerali.map((text, index) => ({ patient_id: id, objective_type: 'generale', objective_index: index, objective_text: text, completed: false }));
    const specificObjs = obiettiviSpecifici.map((text, index) => ({ patient_id: id, objective_type: 'specifico', objective_index: index, objective_text: text, completed: false }));
    if (generalObjs.length > 0 || specificObjs.length > 0) await supabase.from('objectives_completion').insert([...generalObjs, ...specificObjs]);
  }

  async function syncExercisesCompletion() {
    await supabase.from('exercises_completion').delete().eq('patient_id', id);
    const exs = esercizi.map((text, index) => ({ patient_id: id, exercise_index: index, exercise_text: text, completed: false }));
    if (exs.length > 0) await supabase.from('exercises_completion').insert(exs);
  }

  async function toggleObjectiveCompletion(objId: string, currentCompleted: boolean) {
    try {
      await supabase.from('objectives_completion').update({ completed: !currentCompleted, completed_at: !currentCompleted ? new Date().toISOString() : null }).eq('id', objId);
      loadData();
    } catch (e: any) { alert('Errore: ' + e.message); }
  }

  async function toggleExerciseCompletion(exId: string, currentCompleted: boolean) {
    try {
      await supabase.from('exercises_completion').update({ completed: !currentCompleted, completed_at: !currentCompleted ? new Date().toISOString() : null }).eq('id', exId);
      loadData();
    } catch (e: any) { alert('Errore: ' + e.message); }
  }

  async function clearPatientThoughts() {
    if (!confirm('Vuoi svuotare i pensieri del paziente? (Seduta completata)')) return;
    try {
      await supabase.from('patient_session_thoughts').delete().eq('patient_id', id);
      alert('✅ Pensieri svuotati!');
      loadData();
    } catch (e: any) { alert('Errore: ' + e.message); }
  }

  async function markMessageAsRead(messageId: string) {
    try {
      await supabase.from('appointment_messages').update({ read_by_therapist: true }).eq('id', messageId);
      loadData();
    } catch (e: any) { console.error('Errore:', e); }
  }

  async function deleteMessage(messageId: string) {
    if (!confirm('Eliminare questo messaggio?')) return;
    try {
      await supabase.from('appointment_messages').delete().eq('id', messageId);
      loadData();
    } catch (e: any) { alert('Errore: ' + e.message); }
  }

  async function deleteConsent(consentId: string) {
    if (!confirm('Eliminare questo documento di consenso? L\'azione non è reversibile.')) return;
    try {
      const { error } = await supabase.from('consent_documents').delete().eq('id', consentId);
      if (error) throw error;
      alert('✅ Consenso eliminato');
      loadData();
    } catch (e: any) { alert('Errore: ' + e.message); }
  }

  async function downloadConsentPDF(consentId: string) {
    try {
      const response = await fetch(`/api/download-consent-pdf/${consentId}`);
      if (!response.ok) throw new Error('Errore download');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `consenso_${patient?.display_name?.replace(/\s+/g, '_')}_${new Date().toLocaleDateString('it-IT').replace(/\//g, '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e: any) { alert('Errore: ' + e.message); }
  }

  function viewConsent(consentId: string) {
    window.open(`/consent/view/${consentId}`, '_blank');
  }

  async function invitePatient() {
    if (!patient?.email) { alert('Il paziente non ha email'); return; }
    try {
      const res = await fetch('/api/invite-patient', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: patient.email, patientId: id }) });
      if (!res.ok) throw new Error('Errore invio');
      alert('✅ Email inviata!');
    } catch (e: any) { alert('Errore: ' + e.message); }
  }

  async function getSuggestions() {
    if (activeTab === 'valutazione') {
      // Modalità valutazione: chiama generate-assessment
      setAiLoading(true);
      setAiModalMode('valutazione');
      setShowAIModal(true);
      setAiAssessment(null);
      setAiSuggestions(null);
      try {
        const res = await fetch('/api/generate-assessment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId: id }) });
        if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Errore generazione valutazione'); }
        const data = await res.json();
        setAiAssessment(data.assessment);
      } catch (e: any) {
        alert('Errore: ' + e.message);
        setShowAIModal(false);
      } finally { setAiLoading(false); }
    } else {
      // Modalità obiettivi: chiama suggest-plan
      setAiLoading(true);
      setAiModalMode('obiettivi');
      setShowAIModal(true);
      setAiSuggestions(null);
      setAiAssessment(null);
      try {
        const res = await fetch('/api/suggest-plan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId: id }) });
        if (!res.ok) throw new Error('Errore generazione suggerimenti');
        const data = await res.json();
        setAiSuggestions(data.suggestions);
      } catch (e: any) {
        alert('Errore: ' + e.message);
        setShowAIModal(false);
      } finally { setAiLoading(false); }
    }
  }

  function applySuggestions(suggestions: Suggestions) {
    setObiettiviGenerali(suggestions.obiettivi_generali);
    setObiettiviSpecifici(suggestions.obiettivi_specifici);
    setEsercizi(suggestions.esercizi);
    setEditObiettiviMode(true);
    setShowAIModal(false);
    alert('✅ Suggerimenti applicati! Rivedi e salva.');
  }

  async function sendObiettiviToPaziente() {
    const selOG = obiettiviGenerali.filter((_, i) => selectedObiettiviGenerali.has(i));
    const selOS = obiettiviSpecifici.filter((_, i) => selectedObiettiviSpecifici.has(i));
    const selEx = esercizi.filter((_, i) => selectedEsercizi.has(i));
    if (selOG.length === 0 && selOS.length === 0 && selEx.length === 0) {
      alert('Seleziona almeno un obiettivo o esercizio da inviare.');
      return;
    }
    setSendingObjectives(true);
    try {
      const res = await fetch('/api/send-objectives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: id, obiettivi_generali: selOG, obiettivi_specifici: selOS, esercizi: selEx }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Errore invio'); }
      alert('✅ Obiettivi ed esercizi inviati al paziente!');
      setSelectedObiettiviGenerali(new Set());
      setSelectedObiettiviSpecifici(new Set());
      setSelectedEsercizi(new Set());
    } catch (e: any) { alert('Errore: ' + e.message); }
    finally { setSendingObjectives(false); }
  }

  async function generateObjectivesFromSessions() {
    if (!confirm('Generare obiettivi ed esercizi dalle sedute registrate? Questo sovrascriverà i contenuti esistenti.')) return;
    setGeneratingObjectives(true);
    try {
      // lastSessionOnly:false → analizza TUTTE le sedute (comportamento scheda paziente)
      const res = await fetch('/api/generate-objectives', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId: id, lastSessionOnly: false }) });
      if (!res.ok) { const error = await res.json(); throw new Error(error.error || 'Errore generazione'); }
      const data = await res.json();
      setObiettiviGenerali(data.obiettivi_generali || []);
      setObiettiviSpecifici(data.obiettivi_specifici || []);
      setEsercizi(data.esercizi || []);
      setEditObiettiviMode(true);
      alert('✅ Obiettivi ed esercizi generati! Rivedi e salva.');
    } catch (e: any) { alert('Errore: ' + e.message); }
    finally { setGeneratingObjectives(false); }
  }

  function handleDateTimeSelected(dateTime: string) {
    setSelectedDateTime(dateTime);
    setShowCalendarPicker(false);
    setShowQuickModal(true);
  }

  async function savePatientData() {
    setSavingPatient(true);
    try {
      const { error } = await supabase.from('patients').update(editPatientData).eq('id', id);
      if (error) throw error;
      alert('✅ Dati paziente salvati!');
      setEditPatientMode(false);
      loadData();
    } catch (e: any) { alert('Errore: ' + e.message); }
    finally { setSavingPatient(false); }
  }

  function getObjectiveCompletion(type: string, index: number) {
    return objectivesCompletion.find(o => o.objective_type === type && o.objective_index === index);
  }

  function getExerciseCompletion(index: number) {
    return exercisesCompletion.find(e => e.exercise_index === index);
  }

  if (loading) return (
    <div style={{ padding: '24px', background: '#0b0f1c', minHeight: '100vh', color: '#a8b2d6' }}>
      Caricamento...
    </div>
  );
  if (!patient) return (
    <div style={{ padding: '24px', background: '#0b0f1c', minHeight: '100vh', color: '#a8b2d6' }}>
      Paziente non trovato
    </div>
  );

  const unreadMessages = appointmentMessages.filter(m => !m.read_by_therapist).length;
  const tabs: { key: typeof activeTab; label: string; emoji: string }[] = [
    { key: 'profilo', label: 'Profilo', emoji: '👤' },
    { key: 'valutazione', label: 'Valutazione', emoji: '🎯' },
    { key: 'obiettivi', label: 'Obiettivi ed Esercizi', emoji: '💪' },
    { key: 'area-paziente', label: 'Comunicazioni Paziente', emoji: '📨' },
    { key: 'sedute', label: 'Sedute', emoji: '📝' },
    { key: 'questionari', label: 'Questionari', emoji: '📋' },
  ];

  return (
    <div style={{ padding: '24px', background: '#0b0f1c', minHeight: '100vh' }}>
      <div className="max-w-6xl mx-auto space-y-6">

        {/* ← Dashboard */}
        <Link
          href="/app/therapist/pazienti"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200"
          style={{ color: '#a8b2d6', textDecoration: 'none', background: '#141a2c', border: '1px solid #26304b' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#7aa2ff'; e.currentTarget.style.color = '#f1f5ff'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#26304b'; e.currentTarget.style.color = '#a8b2d6'; }}
        >
          ← Pazienti
        </Link>

        {/* TABS — scrollabile su mobile */}
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <div className="flex gap-2" style={{ minWidth: 'max-content', paddingBottom: '4px' }}>
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 whitespace-nowrap"
                style={{
                  background: activeTab === tab.key ? '#7aa2ff' : '#141a2c',
                  color: activeTab === tab.key ? '#0b1022' : '#a8b2d6',
                  border: activeTab === tab.key ? 'none' : '1px solid #26304b',
                  cursor: 'pointer',
                  position: 'relative',
                }}
              >
                {tab.emoji} {tab.label}
                {/* Badge non letto su Area Paziente */}
                {tab.key === 'area-paziente' && unreadMessages > 0 && (
                  <span style={{
                    background: '#ef4444',
                    color: 'white',
                    borderRadius: '999px',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '1px 7px',
                    minWidth: '20px',
                    textAlign: 'center',
                    boxShadow: '0 0 0 2px #ef444455',
                    animation: 'pulse 2s infinite',
                  }}>
                    {unreadMessages}
                  </span>
                )}
                {tab.key === 'area-paziente' && patientThoughts && unreadMessages === 0 && (
                  <span style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: '#f97316',
                    display: 'inline-block',
                    boxShadow: '0 0 0 2px #f9731655',
                  }} />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ===== TAB: PROFILO ===== */}
        {activeTab === 'profilo' && (
          <div className="space-y-6">

            {/* Header: nome + azioni principali */}
            <div style={cardStyle}>
              <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
                <div className="flex items-center gap-4">
                  <div style={{
                    width: '56px', height: '56px', borderRadius: '50%',
                    background: 'rgba(122,162,255,0.15)', border: '2px solid rgba(122,162,255,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '22px', fontWeight: 700, color: '#7aa2ff', flexShrink: 0
                  }}>
                    {(patient.display_name || '?')[0].toUpperCase()}
                  </div>
                  <h1 className="text-3xl font-bold" style={{ color: '#f1f5ff' }}>
                    {patient.display_name || 'Senza nome'}
                  </h1>
                </div>
                <button
                  onClick={() => setEditPatientMode(!editPatientMode)}
                  style={btnPrimary}
                  onMouseEnter={e => (e.currentTarget.style.background = '#9ab8ff')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#7aa2ff')}
                >
                  ✏️ {editPatientMode ? 'Chiudi modifica' : 'Modifica dati'}
                </button>
              </div>

              {/* Bottoni azioni */}
              <div className="flex flex-wrap gap-3">
                <button onClick={invitePatient} style={btnSecondary}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#7aa2ff'; e.currentTarget.style.color = '#f1f5ff'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#26304b'; e.currentTarget.style.color = '#a8b2d6'; }}>
                  🔐 Invita paziente
                </button>
                <button onClick={() => router.push(`/app/therapist/consenso/${id}`)}
                  style={{ ...btnSecondary, borderColor: 'rgba(147,51,234,0.4)', color: '#c084fc' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#c084fc'; e.currentTarget.style.color = '#e9d5ff'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(147,51,234,0.4)'; e.currentTarget.style.color = '#c084fc'; }}>
                  📄 Genera Consenso
                </button>
              </div>

              {/* Form modifica dati paziente */}
              {editPatientMode && (
                <div className="mt-6 space-y-4" style={{ borderTop: '1px solid #26304b', paddingTop: '20px' }}>
                  <h3 style={{ color: '#7aa2ff', fontSize: '14px', fontWeight: 600, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Dati Anagrafici
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label style={labelStyle}>Nome e Cognome *</label>
                      <input style={inputStyle} value={editPatientData.display_name || ''} onChange={e => setEditPatientData({...editPatientData, display_name: e.target.value})} placeholder="Mario Rossi"
                        onFocus={e => (e.currentTarget.style.borderColor = '#7aa2ff')} onBlur={e => (e.currentTarget.style.borderColor = '#26304b')} />
                    </div>
                    <div>
                      <label style={labelStyle}>Data di nascita</label>
                      <input type="date" style={inputStyle} value={editPatientData.birth_date || ''} onChange={e => setEditPatientData({...editPatientData, birth_date: e.target.value})}
                        onFocus={e => (e.currentTarget.style.borderColor = '#7aa2ff')} onBlur={e => (e.currentTarget.style.borderColor = '#26304b')} />
                    </div>
                    <div>
                      <label style={labelStyle}>Luogo di nascita</label>
                      <input style={inputStyle} value={editPatientData.birth_place || ''} onChange={e => setEditPatientData({...editPatientData, birth_place: e.target.value})} placeholder="Roma"
                        onFocus={e => (e.currentTarget.style.borderColor = '#7aa2ff')} onBlur={e => (e.currentTarget.style.borderColor = '#26304b')} />
                    </div>
                    <div>
                      <label style={labelStyle}>Codice Fiscale</label>
                      <input style={inputStyle} value={editPatientData.fiscal_code || ''} onChange={e => setEditPatientData({...editPatientData, fiscal_code: e.target.value.toUpperCase()})} placeholder="RSSMRA80A01H501Z" maxLength={16}
                        onFocus={e => (e.currentTarget.style.borderColor = '#7aa2ff')} onBlur={e => (e.currentTarget.style.borderColor = '#26304b')} />
                    </div>
                    <div>
                      <label style={labelStyle}>Email *</label>
                      <input type="email" style={inputStyle} value={editPatientData.email || ''} onChange={e => setEditPatientData({...editPatientData, email: e.target.value})} placeholder="mario.rossi@email.com"
                        onFocus={e => (e.currentTarget.style.borderColor = '#7aa2ff')} onBlur={e => (e.currentTarget.style.borderColor = '#26304b')} />
                    </div>
                    <div>
                      <label style={labelStyle}>Telefono</label>
                      <input type="tel" style={inputStyle} value={editPatientData.phone || ''} onChange={e => setEditPatientData({...editPatientData, phone: e.target.value})} placeholder="+39 333 123 4567"
                        onFocus={e => (e.currentTarget.style.borderColor = '#7aa2ff')} onBlur={e => (e.currentTarget.style.borderColor = '#26304b')} />
                    </div>
                    <div>
                      <label style={labelStyle}>Medico MMG</label>
                      <input style={inputStyle} value={editPatientData.medico_mmg || ''} onChange={e => setEditPatientData({...editPatientData, medico_mmg: e.target.value})} placeholder="Dr. Mario Rossi"
                        onFocus={e => (e.currentTarget.style.borderColor = '#7aa2ff')} onBlur={e => (e.currentTarget.style.borderColor = '#26304b')} />
                    </div>
                  </div>

                  <h3 style={{ color: '#7aa2ff', fontSize: '14px', fontWeight: 600, marginTop: '16px', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Indirizzo
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label style={labelStyle}>Indirizzo</label>
                      <input style={inputStyle} value={editPatientData.address || ''} onChange={e => setEditPatientData({...editPatientData, address: e.target.value})} placeholder="Via Roma 123"
                        onFocus={e => (e.currentTarget.style.borderColor = '#7aa2ff')} onBlur={e => (e.currentTarget.style.borderColor = '#26304b')} />
                    </div>
                    <div>
                      <label style={labelStyle}>Città</label>
                      <input style={inputStyle} value={editPatientData.city || ''} onChange={e => setEditPatientData({...editPatientData, city: e.target.value})} placeholder="Roma"
                        onFocus={e => (e.currentTarget.style.borderColor = '#7aa2ff')} onBlur={e => (e.currentTarget.style.borderColor = '#26304b')} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label style={labelStyle}>CAP</label>
                        <input style={inputStyle} value={editPatientData.postal_code || ''} onChange={e => setEditPatientData({...editPatientData, postal_code: e.target.value})} placeholder="00100"
                          onFocus={e => (e.currentTarget.style.borderColor = '#7aa2ff')} onBlur={e => (e.currentTarget.style.borderColor = '#26304b')} />
                      </div>
                      <div>
                        <label style={labelStyle}>Provincia</label>
                        <input style={inputStyle} value={editPatientData.province || ''} onChange={e => setEditPatientData({...editPatientData, province: e.target.value.toUpperCase()})} placeholder="RM" maxLength={2}
                          onFocus={e => (e.currentTarget.style.borderColor = '#7aa2ff')} onBlur={e => (e.currentTarget.style.borderColor = '#26304b')} />
                      </div>
                    </div>
                  </div>

                  <h3 style={{ color: '#7aa2ff', fontSize: '14px', fontWeight: 600, marginTop: '16px', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Note Cliniche
                  </h3>
                  <div>
                    <label style={labelStyle}>Problemi / Sintomi</label>
                    <textarea style={{ ...inputStyle, minHeight: '90px', resize: 'vertical' }} value={editPatientData.issues || ''} onChange={e => setEditPatientData({...editPatientData, issues: e.target.value})} placeholder="Descrivi i problemi o sintomi del paziente..."
                      onFocus={e => (e.currentTarget.style.borderColor = '#7aa2ff')} onBlur={e => (e.currentTarget.style.borderColor = '#26304b')} />
                  </div>
                  <div>
                    <label style={labelStyle}>Obiettivi terapeutici</label>
                    <textarea style={{ ...inputStyle, minHeight: '90px', resize: 'vertical' }} value={editPatientData.goals || ''} onChange={e => setEditPatientData({...editPatientData, goals: e.target.value})} placeholder="Obiettivi del percorso terapeutico..."
                      onFocus={e => (e.currentTarget.style.borderColor = '#7aa2ff')} onBlur={e => (e.currentTarget.style.borderColor = '#26304b')} />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button onClick={savePatientData} disabled={savingPatient}
                      style={{ ...btnPrimary, opacity: savingPatient ? 0.6 : 1 }}
                      onMouseEnter={e => { if (!savingPatient) e.currentTarget.style.background = '#9ab8ff'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#7aa2ff'; }}>
                      {savingPatient ? 'Salvando...' : '💾 Salva'}
                    </button>
                    <button onClick={() => { setEditPatientMode(false); setEditPatientData(patient); }} style={btnSecondary}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#7aa2ff'; e.currentTarget.style.color = '#f1f5ff'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#26304b'; e.currentTarget.style.color = '#a8b2d6'; }}>
                      Annulla
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Griglia quadranti stile app/therapist */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Quadrante: Nuovo Appuntamento */}
              <div
                onClick={() => router.push(`/app/therapist/appuntamenti?patientId=${id}`)}
                className="p-6 rounded-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-1"
                style={{ background: '#141a2c', border: '2px solid #26304b', boxShadow: '0 12px 32px rgba(0,0,0,0.3)', cursor: 'pointer', color: '#f1f5ff', textAlign: 'center' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#7aa2ff'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(122,162,255,0.2)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#26304b'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.3)'; }}
              >
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>📅</div>
                <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '6px' }}>Appuntamenti</div>
                <div style={{ fontSize: '13px', color: '#a8b2d6' }}>Visualizza e gestisci le sedute</div>
              </div>

              {/* Quadrante: Prossimi Appuntamenti */}
              <div
                onClick={() => router.push(`/app/therapist/pazienti/${id}/appuntamenti`)}
                className="p-6 rounded-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-1"
                style={{ background: '#141a2c', border: '2px solid #26304b', boxShadow: '0 12px 32px rgba(0,0,0,0.3)', cursor: 'pointer', color: '#f1f5ff' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#7aa2ff'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(122,162,255,0.2)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#26304b'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.3)'; }}
              >
                <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '14px', color: '#f1f5ff' }}>📋 Prossimi Appuntamenti</h2>
                {appointments.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: '#a8b2d6' }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>📭</div>
                    <p style={{ fontSize: '13px' }}>Nessun appuntamento programmato</p>
                    <button onClick={e => { e.stopPropagation(); setShowCalendarPicker(true); }}
                      style={{ marginTop: '10px', ...btnPrimary, fontSize: '12px', padding: '6px 12px' }}>
                      + Pianifica ora
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {appointments.map(apt => (
                      <div key={apt.id} style={{ background: '#0b0f1c', border: '1px solid #26304b', borderRadius: '8px', padding: '10px 12px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5ff' }}>{apt.title}</div>
                        <div style={{ fontSize: '12px', color: '#7aa2ff', marginTop: '4px' }}>
                          {new Date(apt.starts_at).toLocaleDateString('it-IT')} alle {new Date(apt.starts_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quadrante: Tariffa e Durata Seduta */}
              <div
                style={{ background: '#141a2c', border: '2px solid #26304b', boxShadow: '0 12px 32px rgba(0,0,0,0.3)', borderRadius: '16px', padding: '24px', color: '#f1f5ff', transition: 'all 0.3s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#7aa2ff'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(122,162,255,0.2)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#26304b'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.3)'; }}
              >
                <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '14px', color: '#f1f5ff' }}>💰 Tariffa e Durata Seduta</h2>
                <SessionRatesForm
                  patientId={id}
                  initialData={{
                    session_duration_individual: patient.session_duration_individual || 0,
                    session_duration_couple: patient.session_duration_couple || 0,
                    session_duration_family: patient.session_duration_family || 0,
                    rate_individual: patient.rate_individual || 0,
                    rate_couple: patient.rate_couple || 0,
                    rate_family: patient.rate_family || 0
                  }}
                  onSave={loadData}
                />
              </div>

              {/* Quadrante: Consensi Firmati */}
              <div
                style={{ background: '#141a2c', border: '2px solid #26304b', boxShadow: '0 12px 32px rgba(0,0,0,0.3)', borderRadius: '16px', padding: '24px', color: '#f1f5ff', transition: 'all 0.3s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#7aa2ff'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(122,162,255,0.2)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#26304b'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.3)'; }}
              >
                <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '14px', color: '#f1f5ff' }}>📄 Consensi Firmati ({consentDocuments.length})</h2>
                {consentDocuments.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: '#a8b2d6' }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>📂</div>
                    <p style={{ fontSize: '13px' }}>Nessun consenso firmato</p>
                    <button onClick={() => router.push(`/app/therapist/consenso/${id}`)}
                      style={{ marginTop: '10px', ...btnSecondary, fontSize: '12px', padding: '6px 12px', borderColor: 'rgba(147,51,234,0.4)', color: '#c084fc' }}>
                      📄 Genera consenso
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '260px', overflowY: 'auto' }}>
                    {consentDocuments.map(consent => (
                      <div key={consent.id} style={{ background: '#0b0f1c', border: '1px solid #26304b', borderRadius: '10px', padding: '12px' }}>
                        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5ff' }}>📋 Consenso Informato</div>
                            <div style={{ fontSize: '11px', color: '#a8b2d6', marginTop: '2px' }}>
                              {new Date(consent.created_at).toLocaleDateString('it-IT')}
                            </div>
                          </div>
                          <span style={{
                            fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '999px',
                            background: consent.status === 'completed' ? 'rgba(34,197,94,0.15)' : consent.status === 'therapist_signed' ? 'rgba(249,115,22,0.15)' : 'rgba(168,178,214,0.1)',
                            color: consent.status === 'completed' ? '#22c55e' : consent.status === 'therapist_signed' ? '#f97316' : '#a8b2d6',
                            border: `1px solid ${consent.status === 'completed' ? 'rgba(34,197,94,0.3)' : consent.status === 'therapist_signed' ? 'rgba(249,115,22,0.3)' : 'rgba(168,178,214,0.2)'}`,
                          }}>
                            {consent.status === 'completed' ? '✅ Completato' : consent.status === 'therapist_signed' ? '⏳ In attesa paziente' : '📝 Bozza'}
                          </span>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <button onClick={() => viewConsent(consent.id)} style={{ ...btnSecondary, fontSize: '12px', padding: '5px 10px' }}>👁️ Visualizza</button>
                          {consent.status === 'completed' && (
                            <button onClick={() => downloadConsentPDF(consent.id)} style={{ ...btnSecondary, fontSize: '12px', padding: '5px 10px', borderColor: 'rgba(34,197,94,0.3)', color: '#22c55e' }}>📥 PDF</button>
                          )}
                          <button onClick={() => deleteConsent(consent.id)} style={{ ...btnDanger, fontSize: '12px', padding: '5px 10px' }}>🗑️ Elimina</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* ===== TAB: VALUTAZIONE ===== */}
        {activeTab === 'valutazione' && (
          <div className="space-y-6">
            <div className="flex justify-end gap-2 flex-wrap">
              <button onClick={getSuggestions} style={{ background: 'linear-gradient(to right, #9333ea, #7aa2ff)', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', fontWeight: 600, cursor: 'pointer' }}>
                ✨ Suggerisci con IA
              </button>
              {editValutazioneMode ? (
                <>
                  <button onClick={saveValutazione} style={btnPrimary}>💾 Salva</button>
                  <button onClick={() => setEditValutazioneMode(false)} style={btnSecondary}>Annulla</button>
                </>
              ) : (
                <button onClick={() => setEditValutazioneMode(true)} style={btnPrimary}>🔧 Modifica</button>
              )}
            </div>

            {!anamnesi && !valutazionePsico && !formulazioneCaso && !editValutazioneMode ? (
              <div style={{ ...cardStyle, textAlign: 'center', padding: '48px 24px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎯</div>
                <h3 style={{ color: '#f1f5ff', fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>Nessuna valutazione ancora</h3>
                <p style={{ color: '#a8b2d6', marginBottom: '20px', fontSize: '14px' }}>Inizia compilando l'anamnesi e la valutazione psicodiagnostica del paziente.</p>
                <button onClick={() => setEditValutazioneMode(true)} style={btnPrimary}>✏️ Inizia valutazione</button>
              </div>
            ) : (
              <>
                <div style={cardStyle}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f1f5ff', marginBottom: '16px' }}>🎯 Valutazione (Anamnesi e psicodiagnosi)</h3>
                  <div className="space-y-4">
                    <div>
                      <label style={labelStyle}>Anamnesi:</label>
                      {editValutazioneMode ? (
                        <textarea style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} value={anamnesi} onChange={e => setAnamnesi(e.target.value)}
                          onFocus={e => (e.currentTarget.style.borderColor = '#7aa2ff')} onBlur={e => (e.currentTarget.style.borderColor = '#26304b')} />
                      ) : (
                        <p style={{ color: '#a8b2d6', whiteSpace: 'pre-wrap' }}>{anamnesi || 'Nessuna informazione'}</p>
                      )}
                    </div>
                    <div>
                      <label style={labelStyle}>Valutazione psicodiagnostica:</label>
                      {editValutazioneMode ? (
                        <textarea style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} value={valutazionePsico} onChange={e => setValutazionePsico(e.target.value)}
                          onFocus={e => (e.currentTarget.style.borderColor = '#7aa2ff')} onBlur={e => (e.currentTarget.style.borderColor = '#26304b')} />
                      ) : (
                        <p style={{ color: '#a8b2d6', whiteSpace: 'pre-wrap' }}>{valutazionePsico || 'Nessuna informazione'}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div style={cardStyle}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f1f5ff', marginBottom: '16px' }}>📝 Formulazione del Caso</h3>
                  {editValutazioneMode ? (
                    <textarea style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }} value={formulazioneCaso} onChange={e => setFormulazioneCaso(e.target.value)}
                      onFocus={e => (e.currentTarget.style.borderColor = '#7aa2ff')} onBlur={e => (e.currentTarget.style.borderColor = '#26304b')} />
                  ) : (
                    <p style={{ color: '#a8b2d6', whiteSpace: 'pre-wrap' }}>{formulazioneCaso || 'Nessuna informazione'}</p>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ===== TAB: OBIETTIVI ED ESERCIZI ===== */}
        {activeTab === 'obiettivi' && (
          <div className="space-y-6">
            <div className="flex justify-end gap-2 flex-wrap">
              <button onClick={generateObjectivesFromSessions} disabled={generatingObjectives}
                style={{ background: generatingObjectives ? '#26304b' : '#7aa2ff', color: generatingObjectives ? '#a8b2d6' : '#0b1022', border: 'none', borderRadius: '8px', padding: '8px 16px', fontWeight: 600, cursor: generatingObjectives ? 'not-allowed' : 'pointer', opacity: generatingObjectives ? 0.7 : 1 }}>
                {generatingObjectives ? '⏳ Generazione...' : '🤖 Genera da Sedute'}
              </button>
              {!editObiettiviMode && (obiettiviGenerali.length > 0 || obiettiviSpecifici.length > 0 || esercizi.length > 0) && (
                <button onClick={sendObiettiviToPaziente} disabled={sendingObjectives}
                  style={{ background: sendingObjectives ? '#26304b' : 'linear-gradient(135deg,#22c55e,#16a34a)', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', fontWeight: 600, cursor: sendingObjectives ? 'not-allowed' : 'pointer', opacity: sendingObjectives ? 0.7 : 1 }}>
                  {sendingObjectives ? '⏳ Invio...' : '📤 Invia al Paziente'}
                </button>
              )}
              {editObiettiviMode ? (
                <>
                  <button onClick={saveObiettivi} style={btnPrimary}>💾 Salva</button>
                  <button onClick={() => setEditObiettiviMode(false)} style={btnSecondary}>Annulla</button>
                </>
              ) : (
                <button onClick={() => setEditObiettiviMode(true)} style={btnPrimary}>🔧 Modifica</button>
              )}
            </div>

            {obiettiviGenerali.length === 0 && obiettiviSpecifici.length === 0 && esercizi.length === 0 && !editObiettiviMode ? (
              <div style={{ ...cardStyle, textAlign: 'center', padding: '48px 24px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>💪</div>
                <h3 style={{ color: '#f1f5ff', fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>Nessun obiettivo ancora</h3>
                <p style={{ color: '#a8b2d6', marginBottom: '20px', fontSize: '14px' }}>Inserisci manualmente obiettivi ed esercizi oppure generali automaticamente dalle sedute.</p>
                <div className="flex gap-3 justify-center flex-wrap">
                  <button onClick={() => setEditObiettiviMode(true)} style={btnPrimary}>✏️ Inserisci manualmente</button>
                  <button onClick={generateObjectivesFromSessions} style={{ background: '#7aa2ff', color: '#0b1022', border: 'none', borderRadius: '8px', padding: '8px 16px', fontWeight: 600, cursor: 'pointer' }}>🤖 Genera da sedute</button>
                </div>
              </div>
            ) : (
              <>
                <div style={cardStyle}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f1f5ff', marginBottom: '16px' }}>🎯 Contratto Terapeutico e Obiettivi</h3>
                  <div className="space-y-4">
                    <div>
                      <label style={labelStyle}>Obiettivi generali:</label>
                      {editObiettiviMode ? (
                        <textarea style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} value={obiettiviGenerali.join('\n')} onChange={e => setObiettiviGenerali(e.target.value.split('\n').filter(o => o.trim()))} placeholder="Inserisci un obiettivo per riga"
                          onFocus={e => (e.currentTarget.style.borderColor = '#7aa2ff')} onBlur={e => (e.currentTarget.style.borderColor = '#26304b')} />
                      ) : obiettiviGenerali.length === 0 ? (
                        <p style={{ color: '#a8b2d6', fontSize: '14px' }}>Nessun obiettivo generale</p>
                      ) : (
                        <>
                          <p style={{ fontSize: '12px', color: '#66708a', marginBottom: '8px' }}>☑️ Seleziona quelli da inviare al paziente</p>
                          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {obiettiviGenerali.map((o, i) => {
                              const completion = getObjectiveCompletion('generale', i);
                              const selected = selectedObiettiviGenerali.has(i);
                              return (
                                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', background: selected ? 'rgba(34,197,94,0.08)' : '#0b0f1c', border: `1px solid ${selected ? 'rgba(34,197,94,0.4)' : '#26304b'}`, borderRadius: '8px', padding: '10px 12px', transition: 'all 0.15s' }}>
                                  <input type="checkbox" checked={completion?.completed || false} onChange={() => completion && toggleObjectiveCompletion(completion.id, completion.completed)} style={{ width: '16px', height: '16px', marginTop: '2px', cursor: 'pointer', accentColor: '#7aa2ff', flexShrink: 0 }} title="Completato" />
                                  <span style={{ color: completion?.completed ? '#a8b2d6' : '#f1f5ff', textDecoration: completion?.completed ? 'line-through' : 'none', fontSize: '14px', flex: 1 }}>{o}</span>
                                  <input type="checkbox" checked={selected} onChange={() => {
                                    const next = new Set(selectedObiettiviGenerali);
                                    selected ? next.delete(i) : next.add(i);
                                    setSelectedObiettiviGenerali(next);
                                  }} style={{ width: '16px', height: '16px', marginTop: '2px', cursor: 'pointer', accentColor: '#22c55e', flexShrink: 0 }} title="Seleziona per invio" />
                                </li>
                              );
                            })}
                          </ul>
                        </>
                      )}
                    </div>
                    <div>
                      <label style={labelStyle}>Obiettivi specifici:</label>
                      {editObiettiviMode ? (
                        <textarea style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} value={obiettiviSpecifici.join('\n')} onChange={e => setObiettiviSpecifici(e.target.value.split('\n').filter(o => o.trim()))} placeholder="Inserisci un obiettivo per riga"
                          onFocus={e => (e.currentTarget.style.borderColor = '#7aa2ff')} onBlur={e => (e.currentTarget.style.borderColor = '#26304b')} />
                      ) : obiettiviSpecifici.length === 0 ? (
                        <p style={{ color: '#a8b2d6', fontSize: '14px' }}>Nessun obiettivo specifico</p>
                      ) : (
                        <>
                          <p style={{ fontSize: '12px', color: '#66708a', marginBottom: '8px' }}>☑️ Seleziona quelli da inviare al paziente</p>
                          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {obiettiviSpecifici.map((o, i) => {
                              const completion = getObjectiveCompletion('specifico', i);
                              const selected = selectedObiettiviSpecifici.has(i);
                              return (
                                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', background: selected ? 'rgba(34,197,94,0.08)' : '#0b0f1c', border: `1px solid ${selected ? 'rgba(34,197,94,0.4)' : '#26304b'}`, borderRadius: '8px', padding: '10px 12px', transition: 'all 0.15s' }}>
                                  <input type="checkbox" checked={completion?.completed || false} onChange={() => completion && toggleObjectiveCompletion(completion.id, completion.completed)} style={{ width: '16px', height: '16px', marginTop: '2px', cursor: 'pointer', accentColor: '#7aa2ff', flexShrink: 0 }} title="Completato" />
                                  <span style={{ color: completion?.completed ? '#a8b2d6' : '#f1f5ff', textDecoration: completion?.completed ? 'line-through' : 'none', fontSize: '14px', flex: 1 }}>{o}</span>
                                  <input type="checkbox" checked={selected} onChange={() => {
                                    const next = new Set(selectedObiettiviSpecifici);
                                    selected ? next.delete(i) : next.add(i);
                                    setSelectedObiettiviSpecifici(next);
                                  }} style={{ width: '16px', height: '16px', marginTop: '2px', cursor: 'pointer', accentColor: '#22c55e', flexShrink: 0 }} title="Seleziona per invio" />
                                </li>
                              );
                            })}
                          </ul>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div style={cardStyle}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f1f5ff', marginBottom: '16px' }}>💪 Esercizi</h3>
                  {editObiettiviMode ? (
                    <textarea style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }} value={esercizi.join('\n')} onChange={e => setEsercizi(e.target.value.split('\n').filter(e => e.trim()))} placeholder="Inserisci un esercizio per riga"
                      onFocus={e => (e.currentTarget.style.borderColor = '#7aa2ff')} onBlur={e => (e.currentTarget.style.borderColor = '#26304b')} />
                  ) : esercizi.length === 0 ? (
                    <p style={{ color: '#a8b2d6', fontSize: '14px' }}>Nessun esercizio</p>
                  ) : (
                    <>
                      <p style={{ fontSize: '12px', color: '#66708a', marginBottom: '8px' }}>☑️ Seleziona quelli da inviare al paziente</p>
                      <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {esercizi.map((ex, i) => {
                          const completion = getExerciseCompletion(i);
                          const selected = selectedEsercizi.has(i);
                          return (
                            <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', background: selected ? 'rgba(34,197,94,0.08)' : '#0b0f1c', border: `1px solid ${selected ? 'rgba(34,197,94,0.4)' : '#26304b'}`, borderRadius: '8px', padding: '10px 12px', transition: 'all 0.15s' }}>
                              <input type="checkbox" checked={completion?.completed || false} onChange={() => completion && toggleExerciseCompletion(completion.id, completion.completed)} style={{ width: '16px', height: '16px', marginTop: '2px', cursor: 'pointer', accentColor: '#22c55e', flexShrink: 0 }} title="Completato" />
                              <span style={{ color: completion?.completed ? '#a8b2d6' : '#f1f5ff', textDecoration: completion?.completed ? 'line-through' : 'none', fontSize: '14px', flex: 1 }}>{ex}</span>
                              {completion?.completed && completion.completed_at && (
                                <span style={{ fontSize: '11px', color: '#a8b2d6', whiteSpace: 'nowrap' }}>✓ {new Date(completion.completed_at).toLocaleDateString('it-IT')}</span>
                              )}
                              <input type="checkbox" checked={selected} onChange={() => {
                                const next = new Set(selectedEsercizi);
                                selected ? next.delete(i) : next.add(i);
                                setSelectedEsercizi(next);
                              }} style={{ width: '16px', height: '16px', marginTop: '2px', cursor: 'pointer', accentColor: '#22c55e', flexShrink: 0 }} title="Seleziona per invio" />
                            </li>
                          );
                        })}
                      </ul>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ===== TAB: AREA PAZIENTE ===== */}
        {activeTab === 'area-paziente' && (
          <div className="space-y-6">
            {/* Messaggi */}
            <div style={cardStyle}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f1f5ff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                📨 Messaggi sugli appuntamenti
                {unreadMessages > 0 && (
                  <span style={{ background: '#ef4444', color: 'white', borderRadius: '999px', fontSize: '12px', fontWeight: 700, padding: '2px 8px', boxShadow: '0 0 0 3px rgba(239,68,68,0.3)' }}>
                    {unreadMessages} nuovi
                  </span>
                )}
              </h3>
              {appointmentMessages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: '#a8b2d6' }}>
                  <div style={{ fontSize: '36px', marginBottom: '8px' }}>📭</div>
                  <p style={{ fontSize: '14px' }}>Nessun messaggio ricevuto</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {appointmentMessages.map(msg => (
                    <div key={msg.id} style={{
                      borderLeft: `4px solid ${msg.read_by_therapist ? '#26304b' : '#f97316'}`,
                      paddingLeft: '14px', paddingTop: '10px', paddingBottom: '10px', paddingRight: '10px',
                      background: msg.read_by_therapist ? '#0b0f1c' : 'rgba(249,115,22,0.08)',
                      borderRadius: '0 8px 8px 0'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', flexWrap: 'wrap', gap: '6px' }}>
                        <span style={{ fontSize: '12px', color: '#a8b2d6' }}>{new Date(msg.created_at).toLocaleString('it-IT')}</span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {!msg.read_by_therapist && (
                            <button onClick={() => markMessageAsRead(msg.id)} style={{ fontSize: '12px', color: '#7aa2ff', background: 'none', border: 'none', cursor: 'pointer' }}>✓ Segna come letto</button>
                          )}
                          <button onClick={() => deleteMessage(msg.id)} style={{ fontSize: '12px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>🗑️ Elimina</button>
                        </div>
                      </div>
                      <p style={{ color: '#f1f5ff', fontSize: '14px' }}>{msg.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pensieri */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f1f5ff' }}>💭 Pensieri per la prossima seduta</h3>
                {patientThoughts && (
                  <button onClick={clearPatientThoughts} style={{ ...btnPrimary, fontSize: '13px' }}>✅ Seduta completata (svuota)</button>
                )}
              </div>
              {!patientThoughts ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: '#a8b2d6' }}>
                  <div style={{ fontSize: '36px', marginBottom: '8px' }}>💬</div>
                  <p style={{ fontSize: '14px' }}>Il paziente non ha ancora scritto pensieri per la prossima seduta</p>
                </div>
              ) : (
                <div style={{ background: 'rgba(122,162,255,0.08)', border: '1px solid rgba(122,162,255,0.2)', borderRadius: '10px', padding: '14px' }}>
                  <p style={{ color: '#f1f5ff', whiteSpace: 'pre-wrap', fontSize: '14px' }}>{patientThoughts}</p>
                </div>
              )}
            </div>

            {/* Diario */}
            <div style={cardStyle}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f1f5ff', marginBottom: '16px' }}>📔 Diario del paziente</h3>
              {patientNotes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: '#a8b2d6' }}>
                  <div style={{ fontSize: '36px', marginBottom: '8px' }}>📖</div>
                  <p style={{ fontSize: '14px' }}>Il paziente non ha ancora scritto note nel diario</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {patientNotes.map(note => (
                    <div key={note.id} style={{ borderLeft: '3px solid #22c55e', paddingLeft: '14px', paddingTop: '8px', paddingBottom: '8px', background: '#0b0f1c', borderRadius: '0 8px 8px 0' }}>
                      <div style={{ fontSize: '12px', color: '#a8b2d6', marginBottom: '6px', fontWeight: 500 }}>
                        {new Date(note.note_date).toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </div>
                      <p style={{ color: '#f1f5ff', whiteSpace: 'pre-wrap', fontSize: '14px' }}>{note.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== TAB: SEDUTE ===== */}
        {activeTab === 'sedute' && (
          <SeduteTab id={id} sessionNotes={sessionNotes} onOpenCalendar={() => setShowCalendarPicker(true)} loadData={loadData} />
        )}

        {/* ===== TAB: QUESTIONARI ===== */}
        {activeTab === 'questionari' && (
          <div className="space-y-6">
            <div style={cardStyle}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f1f5ff', marginBottom: '4px' }}>📋 Questionari Disponibili</h3>
              <p style={{ fontSize: '13px', color: '#a8b2d6', marginBottom: '20px' }}>Compila direttamente in seduta oppure invia al paziente via email</p>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">

                {/* Test ansia (GAD-7) */}
                <div style={{ background: '#0b0f1c', border: '1px solid #26304b', borderRadius: '12px', padding: '20px', transition: 'border-color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#7aa2ff')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#26304b')}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>😰</div>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#f1f5ff', marginBottom: '4px' }}>Test ansia</h4>
                  <p style={{ fontSize: '12px', color: '#a8b2d6', marginBottom: '12px' }}>GAD-7 · Ansia generalizzata</p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button onClick={() => window.open(`/app/therapist/questionari/gad7/compila?patientId=${id}`, '_blank')} style={{ ...btnPrimary, fontSize: '11px', padding: '5px 10px' }}>📝 Compila in seduta</button>
                    <button
                      onClick={async () => {
                        try {
                          const res = await fetch('/api/send-gad7-invite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId: id, email: patient.email }) });
                          if (!res.ok) throw new Error('Errore invio');
                          alert('📧 Email inviata al paziente!');
                        } catch (e: any) { alert('Errore: ' + e.message); }
                      }}
                      disabled={!patient.email}
                      style={{ ...btnSecondary, fontSize: '11px', padding: '5px 10px', opacity: patient.email ? 1 : 0.5, borderColor: patient.email ? 'rgba(34,197,94,0.3)' : '#26304b', color: patient.email ? '#22c55e' : '#a8b2d6' }}>
                      📧 Invia via email
                    </button>
                  </div>
                  {!patient.email && <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '6px' }}>Email paziente mancante</p>}
                </div>

                {/* Test ansia sociale */}
                <div style={{ background: '#0b0f1c', border: '1px solid #26304b', borderRadius: '12px', padding: '20px', transition: 'border-color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#7aa2ff')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#26304b')}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>👥</div>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#f1f5ff', marginBottom: '4px' }}>Test ansia sociale</h4>
                  <p style={{ fontSize: '12px', color: '#a8b2d6', marginBottom: '12px' }}>SPIN · Fobia e ansia in contesti sociali</p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button onClick={() => window.open(`/app/therapist/questionari/ansia-sociale/compila?patientId=${id}`, '_blank')} style={{ ...btnPrimary, fontSize: '11px', padding: '5px 10px' }}>📝 Compila in seduta</button>
                    <button onClick={async () => { try { const r = await fetch('/api/send-questionnaire-invite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId: id, email: patient.email, patientName: patient.display_name, questionnaireType: 'ansia-sociale' }) }); if (!r.ok) throw new Error('Errore'); alert('📧 Email inviata!'); } catch (e: any) { alert('Errore: ' + e.message); } }} disabled={!patient.email} style={{ ...btnSecondary, fontSize: '11px', padding: '5px 10px', opacity: patient.email ? 1 : 0.5, borderColor: patient.email ? 'rgba(34,197,94,0.3)' : '#26304b', color: patient.email ? '#22c55e' : '#a8b2d6' }}>📧 Invia via email</button>
                  </div>
                  {!patient.email && <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '6px' }}>Email paziente mancante</p>}
                </div>

                {/* Test ADHD */}
                <div style={{ background: '#0b0f1c', border: '1px solid #26304b', borderRadius: '12px', padding: '20px', transition: 'border-color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#7aa2ff')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#26304b')}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>⚡</div>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#f1f5ff', marginBottom: '4px' }}>Test ADHD</h4>
                  <p style={{ fontSize: '12px', color: '#a8b2d6', marginBottom: '12px' }}>ASRS · Deficit di attenzione e iperattività</p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button onClick={() => window.open(`/app/therapist/questionari/adhd/compila?patientId=${id}`, '_blank')} style={{ ...btnPrimary, fontSize: '11px', padding: '5px 10px' }}>📝 Compila in seduta</button>
                    <button onClick={async () => { try { const r = await fetch('/api/send-questionnaire-invite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId: id, email: patient.email, patientName: patient.display_name, questionnaireType: 'adhd' }) }); if (!r.ok) throw new Error('Errore'); alert('📧 Email inviata!'); } catch (e: any) { alert('Errore: ' + e.message); } }} disabled={!patient.email} style={{ ...btnSecondary, fontSize: '11px', padding: '5px 10px', opacity: patient.email ? 1 : 0.5, borderColor: patient.email ? 'rgba(34,197,94,0.3)' : '#26304b', color: patient.email ? '#22c55e' : '#a8b2d6' }}>📧 Invia via email</button>
                  </div>
                  {!patient.email && <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '6px' }}>Email paziente mancante</p>}
                </div>

                {/* Test alessitimia */}
                <div style={{ background: '#0b0f1c', border: '1px solid #26304b', borderRadius: '12px', padding: '20px', transition: 'border-color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#7aa2ff')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#26304b')}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>🎭</div>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#f1f5ff', marginBottom: '4px' }}>Test alessitimia</h4>
                  <p style={{ fontSize: '12px', color: '#a8b2d6', marginBottom: '12px' }}>TAS-20 · Difficoltà nell'identificare le emozioni</p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button onClick={() => window.open(`/app/therapist/questionari/alessitimia/compila?patientId=${id}`, '_blank')} style={{ ...btnPrimary, fontSize: '11px', padding: '5px 10px' }}>📝 Compila in seduta</button>
                    <button onClick={async () => { try { const r = await fetch('/api/send-questionnaire-invite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId: id, email: patient.email, patientName: patient.display_name, questionnaireType: 'alessitimia' }) }); if (!r.ok) throw new Error('Errore'); alert('📧 Email inviata!'); } catch (e: any) { alert('Errore: ' + e.message); } }} disabled={!patient.email} style={{ ...btnSecondary, fontSize: '11px', padding: '5px 10px', opacity: patient.email ? 1 : 0.5, borderColor: patient.email ? 'rgba(34,197,94,0.3)' : '#26304b', color: patient.email ? '#22c55e' : '#a8b2d6' }}>📧 Invia via email</button>
                  </div>
                  {!patient.email && <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '6px' }}>Email paziente mancante</p>}
                </div>

                {/* Test autismo */}
                <div style={{ background: '#0b0f1c', border: '1px solid #26304b', borderRadius: '12px', padding: '20px', transition: 'border-color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#7aa2ff')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#26304b')}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>🧩</div>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#f1f5ff', marginBottom: '4px' }}>Test autismo</h4>
                  <p style={{ fontSize: '12px', color: '#a8b2d6', marginBottom: '12px' }}>AQ-10 · Spettro autistico</p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button onClick={() => window.open(`/app/therapist/questionari/autismo/compila?patientId=${id}`, '_blank')} style={{ ...btnPrimary, fontSize: '11px', padding: '5px 10px' }}>📝 Compila in seduta</button>
                    <button onClick={async () => { try { const r = await fetch('/api/send-questionnaire-invite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId: id, email: patient.email, patientName: patient.display_name, questionnaireType: 'autismo' }) }); if (!r.ok) throw new Error('Errore'); alert('📧 Email inviata!'); } catch (e: any) { alert('Errore: ' + e.message); } }} disabled={!patient.email} style={{ ...btnSecondary, fontSize: '11px', padding: '5px 10px', opacity: patient.email ? 1 : 0.5, borderColor: patient.email ? 'rgba(34,197,94,0.3)' : '#26304b', color: patient.email ? '#22c55e' : '#a8b2d6' }}>📧 Invia via email</button>
                  </div>
                  {!patient.email && <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '6px' }}>Email paziente mancante</p>}
                </div>

                {/* Test autostima */}
                <div style={{ background: '#0b0f1c', border: '1px solid #26304b', borderRadius: '12px', padding: '20px', transition: 'border-color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#7aa2ff')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#26304b')}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>💪</div>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#f1f5ff', marginBottom: '4px' }}>Test autostima</h4>
                  <p style={{ fontSize: '12px', color: '#a8b2d6', marginBottom: '12px' }}>RSES · Scala di Rosenberg</p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button onClick={() => window.open(`/app/therapist/questionari/autostima/compila?patientId=${id}`, '_blank')} style={{ ...btnPrimary, fontSize: '11px', padding: '5px 10px' }}>📝 Compila in seduta</button>
                    <button onClick={async () => { try { const r = await fetch('/api/send-questionnaire-invite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId: id, email: patient.email, patientName: patient.display_name, questionnaireType: 'autostima' }) }); if (!r.ok) throw new Error('Errore'); alert('📧 Email inviata!'); } catch (e: any) { alert('Errore: ' + e.message); } }} disabled={!patient.email} style={{ ...btnSecondary, fontSize: '11px', padding: '5px 10px', opacity: patient.email ? 1 : 0.5, borderColor: patient.email ? 'rgba(34,197,94,0.3)' : '#26304b', color: patient.email ? '#22c55e' : '#a8b2d6' }}>📧 Invia via email</button>
                  </div>
                  {!patient.email && <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '6px' }}>Email paziente mancante</p>}
                </div>

                {/* Test burnout */}
                <div style={{ background: '#0b0f1c', border: '1px solid #26304b', borderRadius: '12px', padding: '20px', transition: 'border-color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#7aa2ff')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#26304b')}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>🔥</div>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#f1f5ff', marginBottom: '4px' }}>Test burnout</h4>
                  <p style={{ fontSize: '12px', color: '#a8b2d6', marginBottom: '12px' }}>CBI · Esaurimento lavorativo</p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button onClick={() => window.open(`/app/therapist/questionari/burnout/compila?patientId=${id}`, '_blank')} style={{ ...btnPrimary, fontSize: '11px', padding: '5px 10px' }}>📝 Compila in seduta</button>
                    <button onClick={async () => { try { const r = await fetch('/api/send-questionnaire-invite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId: id, email: patient.email, patientName: patient.display_name, questionnaireType: 'burnout' }) }); if (!r.ok) throw new Error('Errore'); alert('📧 Email inviata!'); } catch (e: any) { alert('Errore: ' + e.message); } }} disabled={!patient.email} style={{ ...btnSecondary, fontSize: '11px', padding: '5px 10px', opacity: patient.email ? 1 : 0.5, borderColor: patient.email ? 'rgba(34,197,94,0.3)' : '#26304b', color: patient.email ? '#22c55e' : '#a8b2d6' }}>📧 Invia via email</button>
                  </div>
                  {!patient.email && <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '6px' }}>Email paziente mancante</p>}
                </div>

                {/* Test depressione */}
                <div style={{ background: '#0b0f1c', border: '1px solid #26304b', borderRadius: '12px', padding: '20px', transition: 'border-color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#7aa2ff')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#26304b')}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>🌧️</div>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#f1f5ff', marginBottom: '4px' }}>Test depressione</h4>
                  <p style={{ fontSize: '12px', color: '#a8b2d6', marginBottom: '12px' }}>PHQ-9 · Disturbo depressivo</p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button onClick={() => window.open(`/app/therapist/questionari/depressione/compila?patientId=${id}`, '_blank')} style={{ ...btnPrimary, fontSize: '11px', padding: '5px 10px' }}>📝 Compila in seduta</button>
                    <button onClick={async () => { try { const r = await fetch('/api/send-questionnaire-invite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId: id, email: patient.email, patientName: patient.display_name, questionnaireType: 'depressione' }) }); if (!r.ok) throw new Error('Errore'); alert('📧 Email inviata!'); } catch { alert('Errore invio email'); } }} disabled={!patient.email} style={{ ...btnSecondary, fontSize: '11px', padding: '5px 10px', opacity: patient.email ? 1 : 0.5, borderColor: patient.email ? 'rgba(34,197,94,0.3)' : '#26304b', color: patient.email ? '#22c55e' : '#a8b2d6' }}>📧 Invia via email</button>
                  </div>
                  {!patient.email && <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '6px' }}>Email paziente mancante</p>}
                </div>

                {/* Test depressione post-partum */}
                <div style={{ background: '#0b0f1c', border: '1px solid #26304b', borderRadius: '12px', padding: '20px', transition: 'border-color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#7aa2ff')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#26304b')}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>👶</div>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#f1f5ff', marginBottom: '4px' }}>Test depressione post-partum</h4>
                  <p style={{ fontSize: '12px', color: '#a8b2d6', marginBottom: '12px' }}>EPDS · Periodo perinatale</p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button onClick={() => window.open(`/app/therapist/questionari/depressione-post-partum/compila?patientId=${id}`, '_blank')} style={{ ...btnPrimary, fontSize: '11px', padding: '5px 10px' }}>📝 Compila in seduta</button>
                    <button onClick={async () => { try { const r = await fetch('/api/send-questionnaire-invite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId: id, email: patient.email, patientName: patient.display_name, questionnaireType: 'depressione-post-partum' }) }); if (!r.ok) throw new Error('Errore'); alert('📧 Email inviata!'); } catch (e: any) { alert('Errore: ' + e.message); } }} disabled={!patient.email} style={{ ...btnSecondary, fontSize: '11px', padding: '5px 10px', opacity: patient.email ? 1 : 0.5, borderColor: patient.email ? 'rgba(34,197,94,0.3)' : '#26304b', color: patient.email ? '#22c55e' : '#a8b2d6' }}>📧 Invia via email</button>
                  </div>
                  {!patient.email && <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '6px' }}>Email paziente mancante</p>}
                </div>

                {/* Test DCA */}
                <div style={{ background: '#0b0f1c', border: '1px solid #26304b', borderRadius: '12px', padding: '20px', transition: 'border-color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#7aa2ff')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#26304b')}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>🍽️</div>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#f1f5ff', marginBottom: '4px' }}>Test DCA</h4>
                  <p style={{ fontSize: '12px', color: '#a8b2d6', marginBottom: '12px' }}>EDE-Q · Disturbi del comportamento alimentare</p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button onClick={() => window.open(`/app/therapist/questionari/dca/compila?patientId=${id}`, '_blank')} style={{ ...btnPrimary, fontSize: '11px', padding: '5px 10px' }}>📝 Compila in seduta</button>
                    <button onClick={async () => { try { const r = await fetch('/api/send-questionnaire-invite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId: id, email: patient.email, patientName: patient.display_name, questionnaireType: 'dca' }) }); if (!r.ok) throw new Error('Errore'); alert('📧 Email inviata!'); } catch (e: any) { alert('Errore: ' + e.message); } }} disabled={!patient.email} style={{ ...btnSecondary, fontSize: '11px', padding: '5px 10px', opacity: patient.email ? 1 : 0.5, borderColor: patient.email ? 'rgba(34,197,94,0.3)' : '#26304b', color: patient.email ? '#22c55e' : '#a8b2d6' }}>📧 Invia via email</button>
                  </div>
                  {!patient.email && <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '6px' }}>Email paziente mancante</p>}
                </div>

                {/* Test DOC */}
                <div style={{ background: '#0b0f1c', border: '1px solid #26304b', borderRadius: '12px', padding: '20px', transition: 'border-color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#7aa2ff')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#26304b')}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>🔄</div>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#f1f5ff', marginBottom: '4px' }}>Test DOC</h4>
                  <p style={{ fontSize: '12px', color: '#a8b2d6', marginBottom: '12px' }}>OCI-R · Disturbo ossessivo-compulsivo</p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button onClick={() => window.open(`/app/therapist/questionari/doc/compila?patientId=${id}`, '_blank')} style={{ ...btnPrimary, fontSize: '11px', padding: '5px 10px' }}>📝 Compila in seduta</button>
                    <button onClick={async () => { try { const r = await fetch('/api/send-questionnaire-invite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId: id, email: patient.email, patientName: patient.display_name, questionnaireType: 'doc' }) }); if (!r.ok) throw new Error('Errore'); alert('📧 Email inviata!'); } catch (e: any) { alert('Errore: ' + e.message); } }} disabled={!patient.email} style={{ ...btnSecondary, fontSize: '11px', padding: '5px 10px', opacity: patient.email ? 1 : 0.5, borderColor: patient.email ? 'rgba(34,197,94,0.3)' : '#26304b', color: patient.email ? '#22c55e' : '#a8b2d6' }}>📧 Invia via email</button>
                  </div>
                  {!patient.email && <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '6px' }}>Email paziente mancante</p>}
                </div>

                {/* Test insonnia */}
                <div style={{ background: '#0b0f1c', border: '1px solid #26304b', borderRadius: '12px', padding: '20px', transition: 'border-color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#7aa2ff')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#26304b')}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>🌙</div>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#f1f5ff', marginBottom: '4px' }}>Test insonnia</h4>
                  <p style={{ fontSize: '12px', color: '#a8b2d6', marginBottom: '12px' }}>ISI · Indice di severità dell'insonnia</p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button onClick={() => window.open(`/app/therapist/questionari/insonnia/compila?patientId=${id}`, '_blank')} style={{ ...btnPrimary, fontSize: '11px', padding: '5px 10px' }}>📝 Compila in seduta</button>
                    <button onClick={async () => { try { const r = await fetch('/api/send-questionnaire-invite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId: id, email: patient.email, patientName: patient.display_name, questionnaireType: 'insonnia' }) }); if (!r.ok) throw new Error('Errore'); alert('📧 Email inviata!'); } catch (e: any) { alert('Errore: ' + e.message); } }} disabled={!patient.email} style={{ ...btnSecondary, fontSize: '11px', padding: '5px 10px', opacity: patient.email ? 1 : 0.5, borderColor: patient.email ? 'rgba(34,197,94,0.3)' : '#26304b', color: patient.email ? '#22c55e' : '#a8b2d6' }}>📧 Invia via email</button>
                  </div>
                  {!patient.email && <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '6px' }}>Email paziente mancante</p>}
                </div>

                {/* Test ipocondria */}
                <div style={{ background: '#0b0f1c', border: '1px solid #26304b', borderRadius: '12px', padding: '20px', transition: 'border-color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#7aa2ff')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#26304b')}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>🏥</div>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#f1f5ff', marginBottom: '4px' }}>Test ipocondria</h4>
                  <p style={{ fontSize: '12px', color: '#a8b2d6', marginBottom: '12px' }}>HAI · Ansia per la salute</p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button onClick={() => window.open(`/app/therapist/questionari/ipocondria/compila?patientId=${id}`, '_blank')} style={{ ...btnPrimary, fontSize: '11px', padding: '5px 10px' }}>📝 Compila in seduta</button>
                    <button onClick={async () => { try { const r = await fetch('/api/send-questionnaire-invite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId: id, email: patient.email, patientName: patient.display_name, questionnaireType: 'ipocondria' }) }); if (!r.ok) throw new Error('Errore'); alert('📧 Email inviata!'); } catch (e: any) { alert('Errore: ' + e.message); } }} disabled={!patient.email} style={{ ...btnSecondary, fontSize: '11px', padding: '5px 10px', opacity: patient.email ? 1 : 0.5, borderColor: patient.email ? 'rgba(34,197,94,0.3)' : '#26304b', color: patient.email ? '#22c55e' : '#a8b2d6' }}>📧 Invia via email</button>
                  </div>
                  {!patient.email && <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '6px' }}>Email paziente mancante</p>}
                </div>

                {/* Test disturbo borderline */}
                <div style={{ background: '#0b0f1c', border: '1px solid #26304b', borderRadius: '12px', padding: '20px', transition: 'border-color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#7aa2ff')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#26304b')}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>🌊</div>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#f1f5ff', marginBottom: '4px' }}>Test disturbo borderline</h4>
                  <p style={{ fontSize: '12px', color: '#a8b2d6', marginBottom: '12px' }}>MSI-BPD · Disturbo di personalità</p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button onClick={() => window.open(`/app/therapist/questionari/borderline/compila?patientId=${id}`, '_blank')} style={{ ...btnPrimary, fontSize: '11px', padding: '5px 10px' }}>📝 Compila in seduta</button>
                    <button onClick={async () => { try { const r = await fetch('/api/send-questionnaire-invite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId: id, email: patient.email, patientName: patient.display_name, questionnaireType: 'borderline' }) }); if (!r.ok) throw new Error('Errore'); alert('📧 Email inviata!'); } catch (e: any) { alert('Errore: ' + e.message); } }} disabled={!patient.email} style={{ ...btnSecondary, fontSize: '11px', padding: '5px 10px', opacity: patient.email ? 1 : 0.5, borderColor: patient.email ? 'rgba(34,197,94,0.3)' : '#26304b', color: patient.email ? '#22c55e' : '#a8b2d6' }}>📧 Invia via email</button>
                  </div>
                  {!patient.email && <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '6px' }}>Email paziente mancante</p>}
                </div>

                {/* Test abuso di cannabis */}
                <div style={{ background: '#0b0f1c', border: '1px solid #26304b', borderRadius: '12px', padding: '20px', transition: 'border-color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#7aa2ff')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#26304b')}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>🌿</div>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#f1f5ff', marginBottom: '4px' }}>Test abuso di cannabis</h4>
                  <p style={{ fontSize: '12px', color: '#a8b2d6', marginBottom: '12px' }}>CUDIT-R · Uso problematico</p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button onClick={() => window.open(`/app/therapist/questionari/cannabis/compila?patientId=${id}`, '_blank')} style={{ ...btnPrimary, fontSize: '11px', padding: '5px 10px' }}>📝 Compila in seduta</button>
                    <button onClick={async () => { try { const r = await fetch('/api/send-questionnaire-invite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId: id, email: patient.email, patientName: patient.display_name, questionnaireType: 'cannabis' }) }); if (!r.ok) throw new Error('Errore'); alert('📧 Email inviata!'); } catch (e: any) { alert('Errore: ' + e.message); } }} disabled={!patient.email} style={{ ...btnSecondary, fontSize: '11px', padding: '5px 10px', opacity: patient.email ? 1 : 0.5, borderColor: patient.email ? 'rgba(34,197,94,0.3)' : '#26304b', color: patient.email ? '#22c55e' : '#a8b2d6' }}>📧 Invia via email</button>
                  </div>
                  {!patient.email && <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '6px' }}>Email paziente mancante</p>}
                </div>

                {/* Test dipendenza da lavoro */}
                <div style={{ background: '#0b0f1c', border: '1px solid #26304b', borderRadius: '12px', padding: '20px', transition: 'border-color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#7aa2ff')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#26304b')}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>💼</div>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#f1f5ff', marginBottom: '4px' }}>Test dipendenza da lavoro</h4>
                  <p style={{ fontSize: '12px', color: '#a8b2d6', marginBottom: '12px' }}>BWAS · Workaholism</p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button onClick={() => window.open(`/app/therapist/questionari/dipendenza-lavoro/compila?patientId=${id}`, '_blank')} style={{ ...btnPrimary, fontSize: '11px', padding: '5px 10px' }}>📝 Compila in seduta</button>
                    <button onClick={async () => { try { const r = await fetch('/api/send-questionnaire-invite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId: id, email: patient.email, patientName: patient.display_name, questionnaireType: 'dipendenza-lavoro' }) }); if (!r.ok) throw new Error('Errore'); alert('📧 Email inviata!'); } catch (e: any) { alert('Errore: ' + e.message); } }} disabled={!patient.email} style={{ ...btnSecondary, fontSize: '11px', padding: '5px 10px', opacity: patient.email ? 1 : 0.5, borderColor: patient.email ? 'rgba(34,197,94,0.3)' : '#26304b', color: patient.email ? '#22c55e' : '#a8b2d6' }}>📧 Invia via email</button>
                  </div>
                  {!patient.email && <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '6px' }}>Email paziente mancante</p>}
                </div>

                {/* Test dipendenza da internet */}
                <div style={{ background: '#0b0f1c', border: '1px solid #26304b', borderRadius: '12px', padding: '20px', transition: 'border-color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#7aa2ff')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#26304b')}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>📱</div>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#f1f5ff', marginBottom: '4px' }}>Test dipendenza da internet</h4>
                  <p style={{ fontSize: '12px', color: '#a8b2d6', marginBottom: '12px' }}>IAT · Uso problematico di internet</p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button onClick={() => window.open(`/app/therapist/questionari/dipendenza-internet/compila?patientId=${id}`, '_blank')} style={{ ...btnPrimary, fontSize: '11px', padding: '5px 10px' }}>📝 Compila in seduta</button>
                    <button onClick={async () => { try { const r = await fetch('/api/send-questionnaire-invite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId: id, email: patient.email, patientName: patient.display_name, questionnaireType: 'dipendenza-internet' }) }); if (!r.ok) throw new Error('Errore'); alert('📧 Email inviata!'); } catch (e: any) { alert('Errore: ' + e.message); } }} disabled={!patient.email} style={{ ...btnSecondary, fontSize: '11px', padding: '5px 10px', opacity: patient.email ? 1 : 0.5, borderColor: patient.email ? 'rgba(34,197,94,0.3)' : '#26304b', color: patient.email ? '#22c55e' : '#a8b2d6' }}>📧 Invia via email</button>
                  </div>
                  {!patient.email && <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '6px' }}>Email paziente mancante</p>}
                </div>

                {/* Test PTSD */}
                <div style={{ background: '#0b0f1c', border: '1px solid #26304b', borderRadius: '12px', padding: '20px', transition: 'border-color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#7aa2ff')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#26304b')}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>💥</div>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#f1f5ff', marginBottom: '4px' }}>Test PTSD</h4>
                  <p style={{ fontSize: '12px', color: '#a8b2d6', marginBottom: '12px' }}>PCL-5 · Disturbo post-traumatico da stress</p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button onClick={() => window.open(`/app/therapist/questionari/ptsd/compila?patientId=${id}`, '_blank')} style={{ ...btnPrimary, fontSize: '11px', padding: '5px 10px' }}>📝 Compila in seduta</button>
                    <button onClick={async () => { try { const r = await fetch('/api/send-questionnaire-invite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId: id, email: patient.email, patientName: patient.display_name, questionnaireType: 'ptsd' }) }); if (!r.ok) throw new Error('Errore'); alert('📧 Email inviata!'); } catch (e: any) { alert('Errore: ' + e.message); } }} disabled={!patient.email} style={{ ...btnSecondary, fontSize: '11px', padding: '5px 10px', opacity: patient.email ? 1 : 0.5, borderColor: patient.email ? 'rgba(34,197,94,0.3)' : '#26304b', color: patient.email ? '#22c55e' : '#a8b2d6' }}>📧 Invia via email</button>
                  </div>
                  {!patient.email && <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '6px' }}>Email paziente mancante</p>}
                </div>

                {/* Test dismorfofobia */}
                <div style={{ background: '#0b0f1c', border: '1px solid #26304b', borderRadius: '12px', padding: '20px', transition: 'border-color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#7aa2ff')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#26304b')}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>🪞</div>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#f1f5ff', marginBottom: '4px' }}>Test dismorfofobia</h4>
                  <p style={{ fontSize: '12px', color: '#a8b2d6', marginBottom: '12px' }}>BDDQ · Disturbo di dismorfismo corporeo</p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button onClick={() => window.open(`/app/therapist/questionari/dismorfofobia/compila?patientId=${id}`, '_blank')} style={{ ...btnPrimary, fontSize: '11px', padding: '5px 10px' }}>📝 Compila in seduta</button>
                    <button onClick={async () => { try { const r = await fetch('/api/send-questionnaire-invite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId: id, email: patient.email, patientName: patient.display_name, questionnaireType: 'dismorfofobia' }) }); if (!r.ok) throw new Error('Errore'); alert('📧 Email inviata!'); } catch (e: any) { alert('Errore: ' + e.message); } }} disabled={!patient.email} style={{ ...btnSecondary, fontSize: '11px', padding: '5px 10px', opacity: patient.email ? 1 : 0.5, borderColor: patient.email ? 'rgba(34,197,94,0.3)' : '#26304b', color: patient.email ? '#22c55e' : '#a8b2d6' }}>📧 Invia via email</button>
                  </div>
                  {!patient.email && <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '6px' }}>Email paziente mancante</p>}
                </div>

                {/* Test emetofobia */}
                <div style={{ background: '#0b0f1c', border: '1px solid #26304b', borderRadius: '12px', padding: '20px', transition: 'border-color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#7aa2ff')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#26304b')}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>🤢</div>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#f1f5ff', marginBottom: '4px' }}>Test emetofobia</h4>
                  <p style={{ fontSize: '12px', color: '#a8b2d6', marginBottom: '12px' }}>SPOVI · Paura del vomito</p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button onClick={() => window.open(`/app/therapist/questionari/emetofobia/compila?patientId=${id}`, '_blank')} style={{ ...btnPrimary, fontSize: '11px', padding: '5px 10px' }}>📝 Compila in seduta</button>
                    <button onClick={async () => { try { const r = await fetch('/api/send-questionnaire-invite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId: id, email: patient.email, patientName: patient.display_name, questionnaireType: 'emetofobia' }) }); if (!r.ok) throw new Error('Errore'); alert('📧 Email inviata!'); } catch (e: any) { alert('Errore: ' + e.message); } }} disabled={!patient.email} style={{ ...btnSecondary, fontSize: '11px', padding: '5px 10px', opacity: patient.email ? 1 : 0.5, borderColor: patient.email ? 'rgba(34,197,94,0.3)' : '#26304b', color: patient.email ? '#22c55e' : '#a8b2d6' }}>📧 Invia via email</button>
                  </div>
                  {!patient.email && <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '6px' }}>Email paziente mancante</p>}
                </div>

                {/* Test binge eating */}
                <div style={{ background: '#0b0f1c', border: '1px solid #26304b', borderRadius: '12px', padding: '20px', transition: 'border-color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#7aa2ff')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#26304b')}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>🍰</div>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#f1f5ff', marginBottom: '4px' }}>Test binge eating</h4>
                  <p style={{ fontSize: '12px', color: '#a8b2d6', marginBottom: '12px' }}>BES · Disturbo da alimentazione incontrollata</p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button onClick={() => window.open(`/app/therapist/questionari/binge-eating/compila?patientId=${id}`, '_blank')} style={{ ...btnPrimary, fontSize: '11px', padding: '5px 10px' }}>📝 Compila in seduta</button>
                    <button onClick={async () => { try { const r = await fetch('/api/send-questionnaire-invite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId: id, email: patient.email, patientName: patient.display_name, questionnaireType: 'binge-eating' }) }); if (!r.ok) throw new Error('Errore'); alert('📧 Email inviata!'); } catch (e: any) { alert('Errore: ' + e.message); } }} disabled={!patient.email} style={{ ...btnSecondary, fontSize: '11px', padding: '5px 10px', opacity: patient.email ? 1 : 0.5, borderColor: patient.email ? 'rgba(34,197,94,0.3)' : '#26304b', color: patient.email ? '#22c55e' : '#a8b2d6' }}>📧 Invia via email</button>
                  </div>
                  {!patient.email && <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '6px' }}>Email paziente mancante</p>}
                </div>

                {/* Test orientamento psicoterapeutico */}
                <div style={{ background: '#0b0f1c', border: '1px solid #26304b', borderRadius: '12px', padding: '20px', transition: 'border-color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#7aa2ff')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#26304b')}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>🧭</div>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#f1f5ff', marginBottom: '4px' }}>Test orientamento psicoterapeutico</h4>
                  <p style={{ fontSize: '12px', color: '#a8b2d6', marginBottom: '12px' }}>Approccio terapeutico più adatto</p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button onClick={() => window.open(`/app/therapist/questionari/orientamento-psicoterapeutico/compila?patientId=${id}`, '_blank')} style={{ ...btnPrimary, fontSize: '11px', padding: '5px 10px' }}>📝 Compila in seduta</button>
                    <button onClick={async () => { try { const r = await fetch('/api/send-questionnaire-invite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId: id, email: patient.email, patientName: patient.display_name, questionnaireType: 'orientamento-psicoterapeutico' }) }); if (!r.ok) throw new Error('Errore'); alert('📧 Email inviata!'); } catch (e: any) { alert('Errore: ' + e.message); } }} disabled={!patient.email} style={{ ...btnSecondary, fontSize: '11px', padding: '5px 10px', opacity: patient.email ? 1 : 0.5, borderColor: patient.email ? 'rgba(34,197,94,0.3)' : '#26304b', color: patient.email ? '#22c55e' : '#a8b2d6' }}>📧 Invia via email</button>
                  </div>
                  {!patient.email && <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '6px' }}>Email paziente mancante</p>}
                </div>

              </div>
            </div>

            {/* Storico risultati unificato (GAD-7 + tutti i questionari) */}
            <QuestionnaireHistorySection patientId={id} gad7Results={gad7Results} />
          </div>
        )}

      </div>

      <AISuggestionsModal isOpen={showAIModal} onClose={() => setShowAIModal(false)} suggestions={aiSuggestions} assessment={aiAssessment} onApply={applySuggestions} isLoading={aiLoading} mode={aiModalMode} />
      <CalendarPicker isOpen={showCalendarPicker} onClose={() => setShowCalendarPicker(false)} onSelectDateTime={handleDateTimeSelected} />
      <QuickAppointmentModal isOpen={showQuickModal} onClose={() => setShowQuickModal(false)} prefilledDateTime={selectedDateTime} onSuccess={loadData} />

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 2px rgba(239,68,68,0.4); }
          50% { box-shadow: 0 0 0 5px rgba(239,68,68,0.1); }
        }
      `}</style>
    </div>
  );
}
