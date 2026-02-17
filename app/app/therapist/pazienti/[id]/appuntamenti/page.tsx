'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import CalendarPicker from '@/components/CalendarPicker';
import QuickAppointmentModal from '@/components/QuickAppointmentModal';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Appointment = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  status: string;
  location: string | null;
  notes: string | null;
};

export default function PatientAppointmentsPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patientName, setPatientName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');
  const [showCalendarPicker, setShowCalendarPicker] = useState(false);
  const [showQuickModal, setShowQuickModal] = useState(false);
  const [selectedDateTime, setSelectedDateTime] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    loadData();
  }, [id, filter]);

  async function loadData() {
    setLoading(true);
    try {
      const { data: patientData } = await supabase
        .from('patients')
        .select('display_name')
        .eq('id', id)
        .single();
      setPatientName(patientData?.display_name || 'Paziente');

      let query = supabase
        .from('appointments')
        .select('id, title, starts_at, ends_at, status, location, notes')
        .eq('patient_id', id)
        .order('starts_at', { ascending: filter !== 'past' });

      if (filter === 'upcoming') {
        query = query.gte('starts_at', new Date().toISOString());
      } else if (filter === 'past') {
        query = query.lt('starts_at', new Date().toISOString());
      }

      const { data } = await query;
      setAppointments(data || []);
    } catch (e) {
      console.error('Errore:', e);
    } finally {
      setLoading(false);
    }
  }

  function handleDateTimeSelected(dateTime: string) {
    setSelectedDateTime(dateTime);
    setShowCalendarPicker(false);
    setShowQuickModal(true);
  }

  function getStatusBadge(status: string) {
    const map: Record<string, { label: string; bg: string; color: string; border: string }> = {
      scheduled: { label: 'Programmato', bg: 'rgba(122,162,255,0.15)', color: '#7aa2ff', border: 'rgba(122,162,255,0.3)' },
      completed: { label: 'Completato', bg: 'rgba(34,197,94,0.15)', color: '#22c55e', border: 'rgba(34,197,94,0.3)' },
      cancelled: { label: 'Annullato', bg: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'rgba(239,68,68,0.3)' },
    };
    const s = map[status] || map['scheduled'];
    return (
      <span style={{ fontSize: '12px', fontWeight: 600, padding: '3px 10px', borderRadius: '999px', background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
        {s.label}
      </span>
    );
  }

  const upcoming = appointments.filter(a => new Date(a.starts_at) >= new Date());
  const past = appointments.filter(a => new Date(a.starts_at) < new Date());

  return (
    <div style={{ padding: '24px', background: '#0b0f1c', minHeight: '100vh' }}>
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/app/therapist/pazienti"
            style={{ color: '#a8b2d6', textDecoration: 'none', fontSize: '14px' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#f1f5ff')}
            onMouseLeave={e => (e.currentTarget.style.color = '#a8b2d6')}>
            Pazienti
          </Link>
          <span style={{ color: '#26304b' }}>›</span>
          <Link href={`/app/therapist/pazienti/${id}`}
            style={{ color: '#a8b2d6', textDecoration: 'none', fontSize: '14px' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#f1f5ff')}
            onMouseLeave={e => (e.currentTarget.style.color = '#a8b2d6')}>
            {patientName}
          </Link>
          <span style={{ color: '#26304b' }}>›</span>
          <span style={{ color: '#f1f5ff', fontSize: '14px' }}>Appuntamenti</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: '#f1f5ff' }}>📅 Appuntamenti</h1>
            <p style={{ color: '#a8b2d6', fontSize: '14px', marginTop: '4px' }}>{patientName}</p>
          </div>
          <button
            onClick={() => setShowCalendarPicker(true)}
            className="px-5 py-2 rounded-lg font-semibold transition-all duration-200"
            style={{ background: '#7aa2ff', color: '#0b1022', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(122,162,255,0.25)' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#9ab8ff')}
            onMouseLeave={e => (e.currentTarget.style.background = '#7aa2ff')}
          >
            + Nuovo Appuntamento
          </button>
        </div>

        {/* Filtri */}
        <div className="flex gap-2">
          {(['upcoming', 'all', 'past'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-4 py-2 rounded-lg font-medium transition-all duration-200"
              style={{
                background: filter === f ? 'rgba(122,162,255,0.15)' : '#141a2c',
                color: filter === f ? '#7aa2ff' : '#a8b2d6',
                border: filter === f ? '1px solid #7aa2ff' : '1px solid #26304b',
                cursor: 'pointer'
              }}
            >
              {f === 'upcoming' ? `Prossimi (${upcoming.length})` : f === 'all' ? 'Tutti' : `Passati (${past.length})`}
            </button>
          ))}
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '48px', color: '#a8b2d6' }}>Caricamento...</div>
        )}

        {!loading && appointments.length === 0 && (
          <div style={{ background: '#141a2c', border: '2px solid #26304b', borderRadius: '16px', padding: '48px', textAlign: 'center', color: '#a8b2d6' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
            <p style={{ fontSize: '16px', marginBottom: '16px' }}>
              {filter === 'upcoming' ? 'Nessun appuntamento futuro' : filter === 'past' ? 'Nessun appuntamento passato' : 'Nessun appuntamento'}
            </p>
            <button
              onClick={() => setShowCalendarPicker(true)}
              style={{ background: '#7aa2ff', color: '#0b1022', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 600, cursor: 'pointer' }}
            >
              + Pianifica ora
            </button>
          </div>
        )}

        {!loading && appointments.length > 0 && (
          <div className="space-y-3">
            {appointments.map(apt => {
              const isPast = new Date(apt.starts_at) < new Date();
              return (
                <div
                  key={apt.id}
                  style={{ background: '#141a2c', border: '1px solid #26304b', borderRadius: '14px', padding: '20px 24px', transition: 'border-color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#7aa2ff')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#26304b')}
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#f1f5ff' }}>{apt.title}</h3>
                        {getStatusBadge(apt.status)}
                        {isPast && <span style={{ fontSize: '11px', color: '#a8b2d6', background: 'rgba(168,178,214,0.1)', border: '1px solid rgba(168,178,214,0.2)', borderRadius: '999px', padding: '2px 8px' }}>Passato</span>}
                      </div>
                      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '13px', color: '#7aa2ff' }}>
                          📅 {new Date(apt.starts_at).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                        <span style={{ fontSize: '13px', color: '#a8b2d6' }}>
                          🕐 {new Date(apt.starts_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })} → {new Date(apt.ends_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {apt.location && <span style={{ fontSize: '13px', color: '#a8b2d6' }}>📍 {apt.location}</span>}
                      </div>
                      {apt.notes && <p style={{ fontSize: '13px', color: '#a8b2d6', marginTop: '8px' }}>{apt.notes}</p>}
                    </div>

                    {/* Bottone Entra nell'appuntamento */}
                    <button
                      onClick={() => router.push(`/app/therapist/sedute/nuovo?patientId=${id}&appointmentId=${apt.id}`)}
                      style={{
                        background: isPast ? '#141a2c' : '#7aa2ff',
                        color: isPast ? '#a8b2d6' : '#0b1022',
                        border: isPast ? '1px solid #26304b' : 'none',
                        borderRadius: '10px',
                        padding: '10px 18px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = isPast ? '#1e2a3f' : '#9ab8ff';
                        e.currentTarget.style.borderColor = isPast ? '#7aa2ff' : 'none';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = isPast ? '#141a2c' : '#7aa2ff';
                        e.currentTarget.style.borderColor = isPast ? '#26304b' : 'none';
                      }}
                    >
                      {isPast ? '📝 Apri seduta' : '🎙️ Entra nell\'appuntamento'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <CalendarPicker
        isOpen={showCalendarPicker}
        onClose={() => setShowCalendarPicker(false)}
        onSelectDateTime={handleDateTimeSelected}
      />
      <QuickAppointmentModal
        isOpen={showQuickModal}
        onClose={() => setShowQuickModal(false)}
        prefilledDateTime={selectedDateTime}
        onSuccess={loadData}
      />
    </div>
  );
}
