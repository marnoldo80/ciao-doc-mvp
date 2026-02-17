'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import EditAppointmentModal from '@/components/EditAppointmentModal';
import QuickAppointmentModal from '@/components/QuickAppointmentModal';
import CalendarPicker from '@/components/CalendarPicker';

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
  patient_id: string | null;
  patients?: { display_name: string | null } | { display_name: string | null }[] | null;
};

function getPatientName(patients: Appointment['patients']): string {
  if (!patients) return '';
  if (Array.isArray(patients)) return patients[0]?.display_name || '';
  return patients.display_name || '';
}

function getWeekDays(weekOffset: number = 0) {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff + (weekOffset * 7));
  monday.setHours(0, 0, 0, 0);
  const days = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    days.push(day);
  }
  return days;
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [weekOffset, setWeekOffset] = useState(0);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showQuickModal, setShowQuickModal] = useState(false);
  const [quickModalDateTime, setQuickModalDateTime] = useState<string | null>(null);
  const [showCalendarPicker, setShowCalendarPicker] = useState(false);
  const [hoverNuovo, setHoverNuovo] = useState(false);
  const [hoverBack, setHoverBack] = useState(false);

  useEffect(() => {
    loadAppointments();
  }, [filter]);

  async function loadAppointments() {
    setLoading(true);
    setErr(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non autenticato');

      let query = supabase
        .from('appointments')
        .select('id, title, starts_at, ends_at, status, location, notes, patient_id, patients!appointments_patient_id_fkey(display_name)')
        .eq('therapist_user_id', user.id)
        .order('starts_at', { ascending: filter !== 'past' });

      if (filter === 'upcoming') {
        query = query.gte('starts_at', new Date().toISOString());
      } else if (filter === 'past') {
        query = query.lt('starts_at', new Date().toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      setAppointments((data || []) as Appointment[]);
    } catch (e: any) {
      setErr(e?.message || 'Errore caricamento appuntamenti');
    } finally {
      setLoading(false);
    }
  }

  function handleEditClick(apt: Appointment) {
    setEditingAppointment(apt);
    setShowEditModal(true);
  }

  function handleCellClick(day: Date, hour: number) {
    const clickedDateTime = new Date(day);
    clickedDateTime.setHours(hour, 0, 0, 0);
    setQuickModalDateTime(clickedDateTime.toISOString());
    setShowQuickModal(true);
  }

  function handleDateTimeSelected(dateTime: string) {
    setQuickModalDateTime(dateTime);
    setShowCalendarPicker(false);
    setShowQuickModal(true);
  }

  function getAppointmentsForDay(date: Date) {
    const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date); dayEnd.setHours(23, 59, 59, 999);
    return appointments.filter(apt => {
      const aptDate = new Date(apt.starts_at);
      return aptDate >= dayStart && aptDate <= dayEnd;
    });
  }

  const weekDays = getWeekDays(weekOffset);
  const hours = Array.from({ length: 16 }, (_, i) => i + 7); // 7:00 - 22:00

  return (
    <div style={{ padding: '24px', background: '#0b0f1c', minHeight: '100vh' }}>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Tasto ritorno dashboard */}
        <div>
          <Link
            href="/app/therapist"
            onMouseEnter={() => setHoverBack(true)}
            onMouseLeave={() => setHoverBack(false)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200"
            style={{
              color: hoverBack ? '#f1f5ff' : '#a8b2d6',
              textDecoration: 'none',
              background: '#141a2c',
              border: hoverBack ? '1px solid #7aa2ff' : '1px solid #26304b',
            }}
          >
            ← Dashboard
          </Link>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h1 className="text-3xl font-bold" style={{ color: '#f1f5ff' }}>📋 Appuntamenti</h1>
          <button
            onClick={() => setShowCalendarPicker(true)}
            onMouseEnter={e => { e.currentTarget.style.background = '#9ab8ff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#7aa2ff'; }}
            className="px-5 py-2 rounded-lg font-semibold transition-all duration-200"
            style={{ background: '#7aa2ff', color: '#0b1022', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(122,162,255,0.25)' }}
          >
            + Nuovo Appuntamento
          </button>
        </div>

        {err && (
          <div className="p-4 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}>
            ⚠️ {err}
          </div>
        )}

        {/* Toggle Vista Lista / Calendario */}
        <div className="flex gap-0 rounded-xl p-1 w-fit" style={{ background: '#141a2c', border: '2px solid #26304b' }}>
          <button
            onClick={() => setView('list')}
            className="px-6 py-2 rounded-lg font-semibold transition-all duration-200"
            style={{
              background: view === 'list' ? '#7aa2ff' : 'transparent',
              color: view === 'list' ? '#0b1022' : '#a8b2d6',
              border: 'none',
              cursor: 'pointer',
              fontSize: '15px'
            }}
          >
            📋 Lista
          </button>
          <button
            onClick={() => setView('calendar')}
            className="px-6 py-2 rounded-lg font-semibold transition-all duration-200"
            style={{
              background: view === 'calendar' ? '#7aa2ff' : 'transparent',
              color: view === 'calendar' ? '#0b1022' : '#a8b2d6',
              border: 'none',
              cursor: 'pointer',
              fontSize: '15px'
            }}
          >
            📅 Calendario
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
              {f === 'upcoming' ? 'Prossimi' : f === 'all' ? 'Tutti' : 'Passati'}
            </button>
          ))}
        </div>

        {loading && (
          <div className="text-center py-8" style={{ color: '#a8b2d6' }}>Caricamento...</div>
        )}

        {/* VISTA LISTA */}
        {view === 'list' && !loading && (
          <div className="space-y-3">
            {appointments.map((apt) => (
              <div
                key={apt.id}
                className="rounded-xl p-5 transition-all duration-200"
                style={{ background: '#141a2c', border: '1px solid #26304b' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#7aa2ff')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#26304b')}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg" style={{ color: '#f1f5ff' }}>{apt.title}</h3>
                    {getPatientName(apt.patients) && (
                      <p className="text-sm mt-1" style={{ color: '#a8b2d6' }}>👤 {getPatientName(apt.patients)}</p>
                    )}
                    <div className="text-sm mt-2" style={{ color: '#a8b2d6' }}>
                      📅 {new Date(apt.starts_at).toLocaleString('it-IT')} → {new Date(apt.ends_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {apt.location && (
                      <div className="text-sm mt-1" style={{ color: '#a8b2d6' }}>📍 {apt.location}</div>
                    )}
                    <div className="mt-2">
                      <span
                        className="text-xs px-2 py-1 rounded-full"
                        style={{
                          background: apt.status === 'scheduled' ? 'rgba(122,162,255,0.15)' : 'rgba(168,178,214,0.1)',
                          color: apt.status === 'scheduled' ? '#7aa2ff' : '#a8b2d6',
                          border: apt.status === 'scheduled' ? '1px solid rgba(122,162,255,0.3)' : '1px solid rgba(168,178,214,0.2)'
                        }}
                      >
                        {apt.status}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleEditClick(apt)}
                    className="text-sm font-medium px-3 py-1 rounded-lg transition-all duration-200"
                    style={{ background: '#0b0f1c', border: '1px solid #26304b', color: '#7aa2ff', cursor: 'pointer' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#7aa2ff'; e.currentTarget.style.background = 'rgba(122,162,255,0.1)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#26304b'; e.currentTarget.style.background = '#0b0f1c'; }}
                  >
                    ✏️ Modifica
                  </button>
                </div>
              </div>
            ))}
            {appointments.length === 0 && (
              <div className="text-center py-12" style={{ color: '#a8b2d6' }}>
                <p className="text-lg mb-2">Nessun appuntamento trovato</p>
                <button
                  onClick={() => setShowCalendarPicker(true)}
                  className="text-sm font-medium transition-colors"
                  style={{ color: '#7aa2ff', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  + Crea il primo appuntamento
                </button>
              </div>
            )}
          </div>
        )}

        {/* VISTA CALENDARIO */}
        {view === 'calendar' && !loading && (
          <div className="space-y-4">
            {/* Navigazione settimana */}
            <div className="flex items-center justify-between rounded-xl p-4" style={{ background: '#141a2c', border: '1px solid #26304b' }}>
              <button
                onClick={() => setWeekOffset(weekOffset - 1)}
                className="px-4 py-2 rounded-lg font-medium transition-all"
                style={{ background: '#0b0f1c', border: '1px solid #26304b', color: '#a8b2d6', cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#7aa2ff'; e.currentTarget.style.color = '#7aa2ff'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#26304b'; e.currentTarget.style.color = '#a8b2d6'; }}
              >
                ← Settimana Precedente
              </button>
              <div className="font-semibold text-lg" style={{ color: '#f1f5ff' }}>
                {weekDays[0].toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })} – {weekDays[6].toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              <button
                onClick={() => setWeekOffset(weekOffset + 1)}
                className="px-4 py-2 rounded-lg font-medium transition-all"
                style={{ background: '#0b0f1c', border: '1px solid #26304b', color: '#a8b2d6', cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#7aa2ff'; e.currentTarget.style.color = '#7aa2ff'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#26304b'; e.currentTarget.style.color = '#a8b2d6'; }}
              >
                Settimana Successiva →
              </button>
            </div>

            {/* Griglia calendario */}
            <div className="rounded-xl overflow-x-auto" style={{ border: '1px solid #26304b' }}>
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '2px solid #26304b', background: '#141a2c' }}>
                    <th className="p-3 text-left w-20 sticky left-0 font-semibold" style={{ background: '#141a2c', color: '#a8b2d6' }}>Ora</th>
                    {weekDays.map((day, i) => {
                      const isToday = day.toDateString() === new Date().toDateString();
                      return (
                        <th key={i} className="p-3 text-center min-w-32">
                          <div className="font-semibold" style={{ color: isToday ? '#7aa2ff' : '#f1f5ff' }}>
                            {day.toLocaleDateString('it-IT', { weekday: 'short' })}
                          </div>
                          <div className="text-sm" style={{ color: isToday ? '#7aa2ff' : '#a8b2d6', fontWeight: isToday ? 'bold' : 'normal' }}>
                            {day.getDate()}
                          </div>
                          {isToday && <div className="text-xs" style={{ color: '#7aa2ff' }}>Oggi</div>}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {hours.map(hour => (
                    <tr key={hour} style={{ borderBottom: '1px solid #26304b' }}>
                      <td className="p-3 text-sm font-medium sticky left-0" style={{ background: '#0b0f1c', color: '#a8b2d6' }}>
                        {hour}:00
                      </td>
                      {weekDays.map((day, dayIndex) => {
                        const dayAppts = getAppointmentsForDay(day).filter(apt => new Date(apt.starts_at).getHours() === hour);
                        const cellDateTime = new Date(day);
                        cellDateTime.setHours(hour, 0, 0, 0);
                        const isPast = cellDateTime < new Date();

                        return (
                          <td
                            key={dayIndex}
                            className="p-1 align-top"
                            style={{
                              borderLeft: '1px solid #26304b',
                              cursor: isPast ? 'default' : 'pointer',
                              opacity: isPast ? 0.5 : 1,
                            }}
                            onClick={() => !isPast && handleCellClick(day, hour)}
                            onMouseEnter={e => { if (!isPast) e.currentTarget.style.background = 'rgba(122,162,255,0.08)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                          >
                            {dayAppts.length > 0 ? (
                              dayAppts.map(apt => (
                                <div
                                  key={apt.id}
                                  onClick={e => { e.stopPropagation(); handleEditClick(apt); }}
                                  className="p-2 mb-1 text-xs rounded cursor-pointer transition-all"
                                  style={{ background: 'rgba(122,162,255,0.15)', borderLeft: '3px solid #7aa2ff', color: '#a8b2d6' }}
                                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(122,162,255,0.25)'; }}
                                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(122,162,255,0.15)'; }}
                                >
                                  <div className="font-medium" style={{ color: '#7aa2ff' }}>
                                    {new Date(apt.starts_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                  <div className="truncate" style={{ color: '#f1f5ff' }}>{apt.title}</div>
                                  {getPatientName(apt.patients) && (
                                    <div className="truncate" style={{ color: '#a8b2d6' }}>{getPatientName(apt.patients)}</div>
                                  )}
                                </div>
                              ))
                            ) : (
                              <div className="h-16 flex items-center justify-center text-xs" style={{ color: isPast ? '#26304b' : '#a8b2d6' }}>
                                {isPast ? '—' : '+ Crea'}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* Modals */}
      <EditAppointmentModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        appointment={editingAppointment}
        onSuccess={loadAppointments}
      />
      <CalendarPicker
        isOpen={showCalendarPicker}
        onClose={() => setShowCalendarPicker(false)}
        onSelectDateTime={handleDateTimeSelected}
      />
      <QuickAppointmentModal
        isOpen={showQuickModal}
        onClose={() => setShowQuickModal(false)}
        prefilledDateTime={quickModalDateTime}
        onSuccess={loadAppointments}
      />
    </div>
  );
}
