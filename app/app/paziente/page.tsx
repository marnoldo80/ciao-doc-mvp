'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import ChatWidget from '@/components/ChatWidget';
import PasswordChangeModal from '@/components/PasswordChangeModal';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Patient = {
  id: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  province: string | null;
  fiscal_code: string | null;
  birth_date: string | null;
  birth_place: string | null;
  medico_mmg: string | null;
  goals: string | null;
  issues: string | null;
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

// ─── palette dark (uguale al terapeuta) ───────────────────────────────────────
const bg       = '#0b0f1c';
const card     = '#141a2c';
const border   = '#26304b';
const accent   = '#7aa2ff';
const textMain = '#f1f5ff';
const textMuted= '#a8b2d6';
const success  = '#22c55e';
const warning  = '#f59e0b';
const danger   = '#ef4444';

export default function Page() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [objectivesCompletion, setObjectivesCompletion] = useState<ObjectiveCompletion[]>([]);
  const [exercisesCompletion, setExercisesCompletion] = useState<ExerciseCompletion[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patientNotes, setPatientNotes] = useState<PatientNote[]>([]);
  const [nextSessionThoughts, setNextSessionThoughts] = useState('');
  const [diaryEntry, setDiaryEntry] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'goals' | 'diary' | 'progress'>('overview');
  const [consentDocuments, setConsentDocuments] = useState<ConsentDocument[]>([]);

  const [editingPersonalData, setEditingPersonalData] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedPhone, setEditedPhone] = useState('');
  const [editedAddress, setEditedAddress] = useState('');
  const [editedCity, setEditedCity] = useState('');
  const [editedPostalCode, setEditedPostalCode] = useState('');
  const [editedProvince, setEditedProvince] = useState('');
  const [editedFiscalCode, setEditedFiscalCode] = useState('');
  const [editedBirthDate, setEditedBirthDate] = useState('');
  const [editedBirthPlace, setEditedBirthPlace] = useState('');
  const [editedMedico, setEditedMedico] = useState('');

  const [appointmentMessages, setAppointmentMessages] = useState<{[key: string]: string}>({});
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 500));
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setErr('Sessione non valida'); setLoading(false); return; }

      const { data: p, error: pe } = await supabase
        .from('patients')
        .select('id, display_name, email, phone, address, city, postal_code, province, fiscal_code, birth_date, birth_place, medico_mmg, goals, issues')
        .eq('patient_user_id', user.id)
        .single();
      if (pe || !p) { setErr('Profilo paziente non trovato'); setLoading(false); return; }

      setPatient(p as Patient);
      setEditedName(p.display_name || '');
      setEditedPhone(p.phone || '');
      setEditedAddress(p.address || '');
      setEditedCity(p.city || '');
      setEditedPostalCode(p.postal_code || '');
      setEditedProvince(p.province || '');
      setEditedFiscalCode(p.fiscal_code || '');
      setEditedBirthDate(p.birth_date || '');
      setEditedBirthPlace(p.birth_place || '');
      setEditedMedico(p.medico_mmg || '');

      const { data: appts } = await supabase.from('appointments').select('id, title, starts_at')
        .eq('patient_id', p.id).gte('starts_at', new Date().toISOString())
        .order('starts_at', { ascending: true }).limit(5);
      setAppointments(appts || []);

      const { data: notes } = await supabase.from('patient_notes').select('id, note_date, content')
        .eq('patient_id', p.id).order('note_date', { ascending: false }).limit(10);
      setPatientNotes(notes || []);

      const { data: thoughts } = await supabase.from('patient_session_thoughts').select('content')
        .eq('patient_id', p.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (thoughts) setNextSessionThoughts(thoughts.content || '');

      const { data: objData } = await supabase.from('objectives_completion').select('*')
        .eq('patient_id', p.id).order('objective_index', { ascending: true });
      setObjectivesCompletion(objData || []);

      const { data: exData } = await supabase.from('exercises_completion').select('*')
        .eq('patient_id', p.id).order('exercise_index', { ascending: true });
      setExercisesCompletion(exData || []);

      const { data: consentsData } = await supabase.from('consent_documents').select('*')
        .eq('patient_id', p.id).order('created_at', { ascending: false });
      setConsentDocuments(consentsData || []);

      setLoading(false);
    } catch (e: any) {
      setErr(e?.message || 'Errore sconosciuto');
      setLoading(false);
    }
  }

  async function savePersonalData() {
    if (!patient?.id) return;
    try {
      const { error } = await supabase.from('patients').update({
        display_name: editedName, phone: editedPhone, address: editedAddress,
        city: editedCity, postal_code: editedPostalCode, province: editedProvince.toUpperCase(),
        fiscal_code: editedFiscalCode.toUpperCase(), birth_date: editedBirthDate || null,
        birth_place: editedBirthPlace, medico_mmg: editedMedico
      }).eq('id', patient.id);
      if (error) throw error;
      alert('✅ Dati salvati!');
      setEditingPersonalData(false);
      loadData();
    } catch (e: any) { alert('Errore: ' + e.message); }
  }

  async function saveNextSessionThoughts() {
    if (!patient?.id) return;
    try {
      const { error } = await supabase.from('patient_session_thoughts').upsert({
        patient_id: patient.id, content: nextSessionThoughts, created_at: new Date().toISOString()
      });
      if (error) throw error;
      alert('✅ Salvato! Il tuo terapeuta potrà leggerlo.');
    } catch (e: any) { alert('Errore: ' + e.message); }
  }

  async function saveDiaryEntry() {
    if (!patient?.id || !diaryEntry.trim()) return;
    try {
      const { error } = await supabase.from('patient_notes').insert({
        patient_id: patient.id, note_date: new Date().toISOString().split('T')[0], content: diaryEntry
      });
      if (error) throw error;
      alert('✅ Nota salvata nel diario!');
      setDiaryEntry('');
      loadData();
    } catch (e: any) { alert('Errore: ' + e.message); }
  }

  async function updateDiaryNote(noteId: string) {
    try {
      const { error } = await supabase.from('patient_notes').update({ content: editingNoteContent }).eq('id', noteId);
      if (error) throw error;
      alert('✅ Nota aggiornata!');
      setEditingNoteId(null); setEditingNoteContent(''); loadData();
    } catch (e: any) { alert('Errore: ' + e.message); }
  }

  async function deleteDiaryNote(noteId: string) {
    if (!confirm('Sei sicuro di voler cancellare questa nota?')) return;
    try {
      const { error } = await supabase.from('patient_notes').delete().eq('id', noteId);
      if (error) throw error;
      loadData();
    } catch (e: any) { alert('Errore: ' + e.message); }
  }

  async function sendAppointmentMessage(appointmentId: string) {
    if (!patient?.id) return;
    const message = appointmentMessages[appointmentId];
    if (!message?.trim()) { alert('Scrivi un messaggio prima di inviare'); return; }
    try {
      const { error } = await supabase.from('appointment_messages').insert({
        appointment_id: appointmentId, patient_id: patient.id, message
      });
      if (error) throw error;
      alert('✅ Messaggio inviato al terapeuta!');
      setAppointmentMessages({ ...appointmentMessages, [appointmentId]: '' });
    } catch (e: any) { alert('Errore: ' + e.message); }
  }

  async function toggleObjective(objId: string, currentCompleted: boolean) {
    try {
      const { error } = await supabase.from('objectives_completion').update({
        completed: !currentCompleted, completed_at: !currentCompleted ? new Date().toISOString() : null
      }).eq('id', objId);
      if (error) throw error;
      loadData();
    } catch (e: any) { alert('Errore: ' + e.message); }
  }

  async function toggleExercise(exId: string, currentCompleted: boolean) {
    try {
      const { error } = await supabase.from('exercises_completion').update({
        completed: !currentCompleted, completed_at: !currentCompleted ? new Date().toISOString() : null
      }).eq('id', exId);
      if (error) throw error;
      loadData();
    } catch (e: any) { alert('Errore: ' + e.message); }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: textMuted }}>Caricamento della tua area...</p>
      </div>
    );
  }

  if (err || !patient) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: card, border: `1px solid ${danger}`, borderRadius: 12, padding: 24, color: danger }}>
          {err || 'Profilo paziente non disponibile.'}
        </div>
      </div>
    );
  }

  const nextAppointment = appointments[0];
  const lastNote = patientNotes[0];
  const generalObjectives = objectivesCompletion.filter(o => o.objective_type === 'generale');
  const specificObjectives = objectivesCompletion.filter(o => o.objective_type === 'specifico');
  const pendingConsents = consentDocuments.filter(c => c.status !== 'completed');
  const completedExercises = exercisesCompletion.filter(e => e.completed).length;
  const completedObjectives = objectivesCompletion.filter(o => o.completed).length;

  // ─── stili condivisi ──────────────────────────────────────────────────────
  const cardStyle: React.CSSProperties = {
    background: card,
    border: `1px solid ${border}`,
    borderRadius: 14,
    padding: 24,
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: bg,
    border: `1px solid ${border}`,
    borderRadius: 8,
    padding: '8px 12px',
    color: textMain,
    fontSize: 13,
    outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    color: textMuted,
    marginBottom: 4,
    display: 'block',
  };

  const tabs: { key: 'overview' | 'goals' | 'diary' | 'progress'; label: string }[] = [
    { key: 'overview', label: '📊 Panoramica' },
    { key: 'goals', label: '🎯 Obiettivi ed Esercizi' },
    { key: 'diary', label: '📔 Diario' },
    { key: 'progress', label: '📈 Progressi' },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: bg, padding: '24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* ── HERO ── */}
        <div style={{
          background: `linear-gradient(135deg, #1a2540 0%, #141a2c 100%)`,
          border: `1px solid ${border}`,
          borderRadius: 16,
          padding: '32px 36px',
          marginBottom: 24,
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -30, right: -30, width: 200, height: 200, borderRadius: '50%', background: `${accent}10` }} />
          <h1 style={{ fontSize: 28, fontWeight: 700, color: textMain, margin: 0, marginBottom: 8 }}>
            Benvenuto, {patient.display_name || 'Paziente'}! 👋
          </h1>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginTop: 12 }}>
            {nextAppointment && (
              <div style={{ background: `${accent}15`, border: `1px solid ${accent}40`, borderRadius: 8, padding: '6px 14px', color: accent, fontSize: 13 }}>
                📅 Prossima seduta: {new Date(nextAppointment.starts_at).toLocaleDateString('it-IT')} alle {new Date(nextAppointment.starts_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
            {lastNote && (
              <div style={{ background: `${success}15`, border: `1px solid ${success}40`, borderRadius: 8, padding: '6px 14px', color: success, fontSize: 13 }}>
                📝 Ultima nota: {new Date(lastNote.note_date).toLocaleDateString('it-IT')}
              </div>
            )}
            {pendingConsents.length > 0 && (
              <div style={{ background: `${warning}20`, border: `1px solid ${warning}50`, borderRadius: 8, padding: '6px 14px', color: warning, fontSize: 13, fontWeight: 600 }}>
                📄 {pendingConsents.length} consenso da firmare
              </div>
            )}
          </div>
          {/* stat pill */}
          <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
            <div style={{ background: `${accent}10`, border: `1px solid ${border}`, borderRadius: 10, padding: '8px 18px', textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: accent }}>{completedObjectives}</div>
              <div style={{ fontSize: 11, color: textMuted }}>Obiettivi completati</div>
            </div>
            <div style={{ background: `${success}10`, border: `1px solid ${border}`, borderRadius: 10, padding: '8px 18px', textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: success }}>{completedExercises}</div>
              <div style={{ fontSize: 11, color: textMuted }}>Esercizi completati</div>
            </div>
            <div style={{ background: `${accent}10`, border: `1px solid ${border}`, borderRadius: 10, padding: '8px 18px', textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: accent }}>{appointments.length}</div>
              <div style={{ fontSize: 11, color: textMuted }}>Appuntamenti futuri</div>
            </div>
          </div>
        </div>

        {/* ── CONSENSI BANNER ── */}
        {pendingConsents.length > 0 && (
          <div style={{ background: `${warning}15`, border: `1px solid ${warning}40`, borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
            <div style={{ color: warning, fontWeight: 600, marginBottom: 10 }}>📄 Consensi da firmare ({pendingConsents.length})</div>
            {pendingConsents.map(consent => (
              <div key={consent.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: card, borderRadius: 8, padding: '10px 14px', marginBottom: 8 }}>
                <div>
                  <div style={{ color: textMain, fontSize: 13, fontWeight: 500 }}>📋 Consenso Informato</div>
                  <div style={{ color: textMuted, fontSize: 11 }}>Creato il {new Date(consent.created_at).toLocaleDateString('it-IT')}</div>
                </div>
                <a href={`/consent/view/${consent.id}`} target="_blank" rel="noopener noreferrer"
                  style={{ background: accent, color: '#fff', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                  👁️ Visualizza e Firma
                </a>
              </div>
            ))}
          </div>
        )}

        {/* ── TABS ── */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: `1px solid ${border}`, paddingBottom: 0 }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '10px 18px',
              fontSize: 13,
              fontWeight: 600,
              color: activeTab === t.key ? accent : textMuted,
              borderBottom: activeTab === t.key ? `2px solid ${accent}` : '2px solid transparent',
              transition: 'color 0.2s',
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════ */}
        {/* TAB PANORAMICA: dati personali + appuntamenti */}
        {/* ══════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

            {/* DATI PERSONALI */}
            <div style={{ ...cardStyle, gridColumn: '1' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h2 style={{ color: textMain, fontSize: 17, fontWeight: 700, margin: 0 }}>👤 Dati personali</h2>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setShowPasswordModal(true)} style={{
                    background: 'none', border: `1px solid ${border}`, borderRadius: 8,
                    color: textMuted, cursor: 'pointer', fontSize: 11, padding: '4px 10px'
                  }}>🔐 Password</button>
                  {!editingPersonalData && (
                    <button onClick={() => setEditingPersonalData(true)} style={{
                      background: 'none', border: `1px solid ${accent}40`, borderRadius: 8,
                      color: accent, cursor: 'pointer', fontSize: 11, padding: '4px 10px'
                    }}>✏️ Modifica</button>
                  )}
                </div>
              </div>

              {editingPersonalData ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div><label style={labelStyle}>Nome completo</label><input style={inputStyle} value={editedName} onChange={e => setEditedName(e.target.value)} placeholder="Mario Rossi" /></div>
                    <div><label style={labelStyle}>Data di nascita</label><input type="date" style={inputStyle} value={editedBirthDate} onChange={e => setEditedBirthDate(e.target.value)} /></div>
                  </div>
                  <div><label style={labelStyle}>Luogo di nascita</label><input style={inputStyle} value={editedBirthPlace} onChange={e => setEditedBirthPlace(e.target.value)} placeholder="Roma" /></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div><label style={labelStyle}>Email</label><input style={{ ...inputStyle, opacity: 0.5 }} value={patient.email || ''} disabled /></div>
                    <div><label style={labelStyle}>Telefono</label><input style={inputStyle} value={editedPhone} onChange={e => setEditedPhone(e.target.value)} placeholder="+39 123 456 7890" /></div>
                  </div>
                  <div><label style={labelStyle}>Codice Fiscale</label><input style={inputStyle} value={editedFiscalCode} onChange={e => setEditedFiscalCode(e.target.value.toUpperCase())} placeholder="RSSMRA80A01H501Z" maxLength={16} /></div>
                  <div><label style={labelStyle}>Medico di medicina generale</label><input style={inputStyle} value={editedMedico} onChange={e => setEditedMedico(e.target.value)} placeholder="Dr. Mario Rossi" /></div>
                  <div><label style={labelStyle}>Indirizzo</label><input style={inputStyle} value={editedAddress} onChange={e => setEditedAddress(e.target.value)} placeholder="Via Roma 123" /></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px', gap: 10 }}>
                    <div><label style={labelStyle}>Città</label><input style={inputStyle} value={editedCity} onChange={e => setEditedCity(e.target.value)} placeholder="Roma" /></div>
                    <div><label style={labelStyle}>CAP</label><input style={inputStyle} value={editedPostalCode} onChange={e => setEditedPostalCode(e.target.value)} placeholder="00100" /></div>
                    <div><label style={labelStyle}>Prov.</label><input style={inputStyle} value={editedProvince} onChange={e => setEditedProvince(e.target.value.toUpperCase())} placeholder="RM" maxLength={2} /></div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <button onClick={savePersonalData} style={{ background: accent, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>💾 Salva</button>
                    <button onClick={() => {
                      setEditingPersonalData(false);
                      setEditedName(patient.display_name || ''); setEditedPhone(patient.phone || '');
                      setEditedAddress(patient.address || ''); setEditedCity(patient.city || '');
                      setEditedPostalCode(patient.postal_code || ''); setEditedProvince(patient.province || '');
                      setEditedFiscalCode(patient.fiscal_code || ''); setEditedBirthDate(patient.birth_date || '');
                      setEditedBirthPlace(patient.birth_place || ''); setEditedMedico(patient.medico_mmg || '');
                    }} style={{ background: border, color: textMuted, border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13 }}>Annulla</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    ['Nome', patient.display_name],
                    ['Data nascita', patient.birth_date ? new Date(patient.birth_date).toLocaleDateString('it-IT') : null],
                    ['Luogo nascita', patient.birth_place],
                    ['Email', patient.email],
                    ['Telefono', patient.phone],
                    ['Codice Fiscale', patient.fiscal_code],
                    ['Medico MMG', patient.medico_mmg],
                    ['Indirizzo', patient.address],
                    ['Città', [patient.city, patient.postal_code, patient.province].filter(Boolean).join(', ')],
                  ].map(([label, value]) => (
                    <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${border}`, paddingBottom: 8 }}>
                      <span style={{ fontSize: 12, color: textMuted }}>{label}</span>
                      <span style={{ fontSize: 13, color: value ? textMain : border, fontWeight: value ? 500 : 400 }}>{value || '—'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* PROSSIMI APPUNTAMENTI */}
            <div style={{ ...cardStyle, gridColumn: '2' }}>
              <h2 style={{ color: textMain, fontSize: 17, fontWeight: 700, margin: 0, marginBottom: 16 }}>📅 Prossimi appuntamenti</h2>
              {appointments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: textMuted, fontSize: 13 }}>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>📭</div>
                  Nessun appuntamento programmato
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {appointments.map((apt, i) => (
                    <div key={apt.id} style={{
                      background: bg, border: `1px solid ${i === 0 ? accent + '60' : border}`,
                      borderRadius: 10, padding: '14px 16px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        {i === 0 && <span style={{ background: accent, color: '#fff', borderRadius: 6, padding: '2px 8px', fontSize: 10, fontWeight: 700 }}>PROSSIMO</span>}
                        <div style={{ fontWeight: 600, color: textMain, fontSize: 14 }}>{apt.title}</div>
                      </div>
                      <div style={{ color: accent, fontSize: 13, marginBottom: 10 }}>
                        📅 {new Date(apt.starts_at).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })} alle {new Date(apt.starts_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <textarea
                        placeholder="Scrivi un messaggio al terapeuta (es: disdetta, cambio orario...)"
                        value={appointmentMessages[apt.id] || ''}
                        onChange={e => setAppointmentMessages({ ...appointmentMessages, [apt.id]: e.target.value })}
                        style={{ ...inputStyle, minHeight: 56, resize: 'vertical', fontSize: 12 }}
                      />
                      <button onClick={() => sendAppointmentMessage(apt.id)} style={{
                        marginTop: 6, background: `${accent}20`, border: `1px solid ${accent}40`,
                        color: accent, borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 11, fontWeight: 600
                      }}>📨 Invia al terapeuta</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* PENSIERI PER LA PROSSIMA SEDUTA - full width */}
            <div style={{ ...cardStyle, gridColumn: '1 / -1' }}>
              <h2 style={{ color: textMain, fontSize: 17, fontWeight: 700, margin: 0, marginBottom: 8 }}>💭 I tuoi pensieri per la prossima seduta</h2>
              <p style={{ color: textMuted, fontSize: 13, marginBottom: 12 }}>
                Scrivi qui domande, obiettivi o situazioni che vuoi discutere nella prossima seduta. Il terapeuta potrà leggerli in anticipo.
              </p>
              <textarea
                style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }}
                placeholder="Es: Vorrei parlare di come gestire l'ansia prima delle presentazioni di lavoro..."
                value={nextSessionThoughts}
                onChange={e => setNextSessionThoughts(e.target.value)}
              />
              <button onClick={saveNextSessionThoughts} style={{
                marginTop: 10, background: accent, color: '#fff', border: 'none',
                borderRadius: 8, padding: '8px 20px', cursor: 'pointer', fontWeight: 600, fontSize: 13
              }}>💾 Salva pensieri</button>
            </div>

          </div>
        )}

        {/* ════════════════════════════════════════════════════════ */}
        {/* TAB OBIETTIVI ED ESERCIZI                               */}
        {/* ════════════════════════════════════════════════════════ */}
        {activeTab === 'goals' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

            {/* OBIETTIVI */}
            <div style={cardStyle}>
              <h2 style={{ color: textMain, fontSize: 17, fontWeight: 700, margin: 0, marginBottom: 6 }}>🎯 I tuoi obiettivi</h2>
              <p style={{ color: textMuted, fontSize: 12, marginBottom: 16 }}>Condivisi con il terapeuta</p>

              {generalObjectives.length === 0 && specificObjectives.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: textMuted, fontSize: 13 }}>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>🎯</div>
                  Nessun obiettivo definito ancora.<br />Il terapeuta li aggiungerà nel piano terapeutico.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {generalObjectives.length > 0 && (
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: accent, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Obiettivi Generali</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {generalObjectives.map(obj => (
                          <label key={obj.id} style={{
                            display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px',
                            background: bg, border: `1px solid ${obj.completed ? success + '40' : border}`,
                            borderRadius: 8, cursor: 'pointer'
                          }}>
                            <input type="checkbox" checked={obj.completed} onChange={() => toggleObjective(obj.id, obj.completed)}
                              style={{ width: 16, height: 16, marginTop: 2, accentColor: success }} />
                            <span style={{ fontSize: 13, color: obj.completed ? textMuted : textMain, textDecoration: obj.completed ? 'line-through' : 'none' }}>
                              {obj.objective_text}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  {specificObjectives.length > 0 && (
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: accent, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Obiettivi Specifici</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {specificObjectives.map(obj => (
                          <label key={obj.id} style={{
                            display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px',
                            background: bg, border: `1px solid ${obj.completed ? success + '40' : border}`,
                            borderRadius: 8, cursor: 'pointer'
                          }}>
                            <input type="checkbox" checked={obj.completed} onChange={() => toggleObjective(obj.id, obj.completed)}
                              style={{ width: 16, height: 16, marginTop: 2, accentColor: success }} />
                            <span style={{ fontSize: 13, color: obj.completed ? textMuted : textMain, textDecoration: obj.completed ? 'line-through' : 'none' }}>
                              {obj.objective_text}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Progress bar */}
                  <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 8, padding: '10px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: textMuted }}>Completamento</span>
                      <span style={{ fontSize: 12, color: success, fontWeight: 600 }}>
                        {objectivesCompletion.length > 0 ? Math.round((completedObjectives / objectivesCompletion.length) * 100) : 0}%
                      </span>
                    </div>
                    <div style={{ height: 6, background: border, borderRadius: 3 }}>
                      <div style={{
                        height: '100%', borderRadius: 3, background: success,
                        width: `${objectivesCompletion.length > 0 ? (completedObjectives / objectivesCompletion.length) * 100 : 0}%`,
                        transition: 'width 0.4s ease'
                      }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ESERCIZI */}
            <div style={cardStyle}>
              <h2 style={{ color: textMain, fontSize: 17, fontWeight: 700, margin: 0, marginBottom: 6 }}>💪 Esercizi assegnati</h2>
              <p style={{ color: textMuted, fontSize: 12, marginBottom: 16 }}>Assegnati dal terapeuta</p>

              {exercisesCompletion.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: textMuted, fontSize: 13 }}>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>💪</div>
                  Nessun esercizio assegnato ancora.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {exercisesCompletion.map(ex => (
                    <label key={ex.id} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px',
                      background: bg, border: `1px solid ${ex.completed ? success + '40' : border}`,
                      borderRadius: 8, cursor: 'pointer'
                    }}>
                      <input type="checkbox" checked={ex.completed} onChange={() => toggleExercise(ex.id, ex.completed)}
                        style={{ width: 16, height: 16, marginTop: 2, accentColor: success }} />
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: 13, color: ex.completed ? textMuted : textMain, textDecoration: ex.completed ? 'line-through' : 'none' }}>
                          {ex.exercise_text}
                        </span>
                        {ex.completed && ex.completed_at && (
                          <div style={{ fontSize: 11, color: success, marginTop: 3 }}>
                            ✓ Completato il {new Date(ex.completed_at).toLocaleDateString('it-IT')}
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                  {/* Progress bar */}
                  <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 8, padding: '10px 14px', marginTop: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: textMuted }}>Completamento</span>
                      <span style={{ fontSize: 12, color: success, fontWeight: 600 }}>
                        {exercisesCompletion.length > 0 ? Math.round((completedExercises / exercisesCompletion.length) * 100) : 0}%
                      </span>
                    </div>
                    <div style={{ height: 6, background: border, borderRadius: 3 }}>
                      <div style={{
                        height: '100%', borderRadius: 3, background: success,
                        width: `${exercisesCompletion.length > 0 ? (completedExercises / exercisesCompletion.length) * 100 : 0}%`,
                        transition: 'width 0.4s ease'
                      }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ════════════════════ */}
        {/* TAB DIARIO          */}
        {/* ════════════════════ */}
        {activeTab === 'diary' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={cardStyle}>
              <h2 style={{ color: textMain, fontSize: 17, fontWeight: 700, margin: 0, marginBottom: 8 }}>✍️ Scrivi una nuova nota</h2>
              <p style={{ color: textMuted, fontSize: 13, marginBottom: 12 }}>
                Usa il diario per annotare pensieri, emozioni, situazioni quotidiane. Il terapeuta potrà leggerle.
              </p>
              <textarea
                style={{ ...inputStyle, minHeight: 140, resize: 'vertical' }}
                placeholder="Oggi mi sono sentito/a..."
                value={diaryEntry}
                onChange={e => setDiaryEntry(e.target.value)}
              />
              <button onClick={saveDiaryEntry} disabled={!diaryEntry.trim()} style={{
                marginTop: 10, background: accent, color: '#fff', border: 'none',
                borderRadius: 8, padding: '8px 20px', cursor: 'pointer', fontWeight: 600, fontSize: 13,
                opacity: diaryEntry.trim() ? 1 : 0.4
              }}>💾 Salva nota</button>
            </div>

            <div style={cardStyle}>
              <h2 style={{ color: textMain, fontSize: 17, fontWeight: 700, margin: 0, marginBottom: 16 }}>📚 Le tue note</h2>
              {patientNotes.length === 0 ? (
                <p style={{ color: textMuted, fontSize: 13 }}>Nessuna nota nel diario ancora.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {patientNotes.map(note => (
                    <div key={note.id} style={{ borderLeft: `3px solid ${accent}`, paddingLeft: 14, background: bg, borderRadius: '0 8px 8px 0', padding: '12px 14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <div style={{ fontSize: 12, color: textMuted }}>
                          {new Date(note.note_date).toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                        {editingNoteId !== note.id && (
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => { setEditingNoteId(note.id); setEditingNoteContent(note.content); }}
                              style={{ background: 'none', border: 'none', color: accent, cursor: 'pointer', fontSize: 12 }}>✏️ Modifica</button>
                            <button onClick={() => deleteDiaryNote(note.id)}
                              style={{ background: 'none', border: 'none', color: danger, cursor: 'pointer', fontSize: 12 }}>🗑️ Cancella</button>
                          </div>
                        )}
                      </div>
                      {editingNoteId === note.id ? (
                        <div>
                          <textarea value={editingNoteContent} onChange={e => setEditingNoteContent(e.target.value)}
                            style={{ ...inputStyle, minHeight: 90, resize: 'vertical' }} />
                          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                            <button onClick={() => updateDiaryNote(note.id)} style={{ background: accent, color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>💾 Salva</button>
                            <button onClick={() => { setEditingNoteId(null); setEditingNoteContent(''); }} style={{ background: border, color: textMuted, border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 12 }}>Annulla</button>
                          </div>
                        </div>
                      ) : (
                        <p style={{ color: textMain, fontSize: 13, whiteSpace: 'pre-wrap', margin: 0 }}>{note.content}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════════════════ */}
        {/* TAB PROGRESSI       */}
        {/* ════════════════════ */}
        {activeTab === 'progress' && (
          <div style={cardStyle}>
            <h2 style={{ color: textMain, fontSize: 17, fontWeight: 700, margin: 0, marginBottom: 12 }}>📈 I tuoi progressi</h2>
            <p style={{ color: textMuted, fontSize: 13 }}>
              Questa sezione mostrerà una timeline dei tuoi progressi, obiettivi completati e statistiche.
              <br /><em>(In sviluppo – verrà implementata nelle prossime versioni)</em>
            </p>
          </div>
        )}

      </div>

      {patient && (
        <ChatWidget patientId={patient.id} patientName={patient.display_name || 'Paziente'} />
      )}
      <PasswordChangeModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={() => { alert('✅ Password aggiornata con successo!'); }}
      />
    </div>
  );
}
