'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

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
  patients?: { display_name: string | null } | { display_name: string | null }[] | null;
};

type CalendarPickerProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelectDateTime: (dateTime: string) => void;
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

export default function CalendarPicker({ isOpen, onClose, onSelectDateTime }: CalendarPickerProps) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadAppointments();
    }
  }, [isOpen, weekOffset]);

  async function loadAppointments() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const weekDays = getWeekDays(weekOffset);
      const weekStart = weekDays[0];
      const weekEnd = new Date(weekDays[6]);
      weekEnd.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('appointments')
        .select('id, title, starts_at, ends_at, status, patients!appointments_patient_id_fkey(display_name)')
        .eq('therapist_user_id', user.id)
        .gte('starts_at', weekStart.toISOString())
        .lte('starts_at', weekEnd.toISOString())
        .order('starts_at', { ascending: true });

      if (error) throw error;
      setAppointments((data || []) as Appointment[]);
    } catch (error) {
      console.error('Errore caricamento appuntamenti:', error);
    } finally {
      setLoading(false);
    }
  }

  function getAppointmentsForTimeSlot(date: Date, hour: number) {
    const slotStart = new Date(date);
    slotStart.setHours(hour, 0, 0, 0);
    const slotEnd = new Date(date);
    slotEnd.setHours(hour, 59, 59, 999);

    return appointments.filter(apt => {
      const aptStart = new Date(apt.starts_at);
      const aptEnd = new Date(apt.ends_at);
      return (aptStart < slotEnd && aptEnd > slotStart);
    });
  }

  function handleCellClick(day: Date, hour: number) {
    const conflictingAppts = getAppointmentsForTimeSlot(day, hour);
    if (conflictingAppts.length > 0) {
      alert(`⚠️ Conflitto di orario!\n\nEsiste già un appuntamento in questo slot:\n"${conflictingAppts[0].title}" alle ${new Date(conflictingAppts[0].starts_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`);
      return;
    }
    const selectedDateTime = new Date(day);
    selectedDateTime.setHours(hour, 0, 0, 0);
    onSelectDateTime(selectedDateTime.toISOString());
  }

  if (!isOpen) return null;

  const weekDays = getWeekDays(weekOffset);
  const hours = Array.from({ length: 16 }, (_, i) => i + 7); // 7:00 - 22:00

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
      <div className="rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto" style={{
        background: '#0b0f1c',
        border: '2px solid #26304b',
        boxShadow: '0 24px 64px rgba(0,0,0,0.5)'
      }}>
        {/* Header */}
        <div className="p-6 rounded-t-2xl flex items-center justify-between" style={{
          background: '#141a2c',
          borderBottom: '2px solid #26304b'
        }}>
          <div>
            <h2 className="text-2xl font-bold" style={{ color: '#f1f5ff' }}>📅 Seleziona Data e Ora</h2>
            <p className="text-sm mt-1" style={{ color: '#a8b2d6' }}>
              Clicca su uno slot libero per creare l'appuntamento
              {loading && ' • Caricamento...'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-3xl font-bold leading-none transition-colors"
            style={{ color: '#a8b2d6' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#f1f5ff')}
            onMouseLeave={e => (e.currentTarget.style.color = '#a8b2d6')}
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Navigazione settimana */}
          <div className="flex items-center justify-between rounded-xl p-4" style={{
            background: '#141a2c',
            border: '1px solid #26304b'
          }}>
            <button
              onClick={() => setWeekOffset(weekOffset - 1)}
              className="px-4 py-2 rounded-lg font-medium transition-all"
              style={{ background: '#0b0f1c', border: '1px solid #26304b', color: '#a8b2d6' }}
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
              style={{ background: '#0b0f1c', border: '1px solid #26304b', color: '#a8b2d6' }}
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
                      const cellDateTime = new Date(day);
                      cellDateTime.setHours(hour, 0, 0, 0);
                      const isPast = cellDateTime < new Date();
                      const slotAppointments = getAppointmentsForTimeSlot(day, hour);
                      const hasConflict = slotAppointments.length > 0;

                      return (
                        <td
                          key={dayIndex}
                          onClick={() => !isPast && !hasConflict && handleCellClick(day, hour)}
                          style={{
                            borderLeft: '1px solid #26304b',
                            verticalAlign: 'top',
                            background: isPast ? '#0b0f1c' : hasConflict ? 'rgba(122,162,255,0.08)' : 'transparent',
                            cursor: isPast || hasConflict ? 'not-allowed' : 'pointer',
                            opacity: isPast ? 0.4 : 1,
                          }}
                          onMouseEnter={e => {
                            if (!isPast && !hasConflict) e.currentTarget.style.background = 'rgba(122,162,255,0.12)';
                          }}
                          onMouseLeave={e => {
                            if (!isPast && !hasConflict) e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          {hasConflict ? (
                            <div className="p-2">
                              {slotAppointments.map(apt => (
                                <div
                                  key={apt.id}
                                  className="p-2 mb-1 text-xs rounded"
                                  style={{
                                    background: 'rgba(122,162,255,0.15)',
                                    borderLeft: '3px solid #7aa2ff',
                                    color: '#a8b2d6'
                                  }}
                                >
                                  <div className="font-medium" style={{ color: '#7aa2ff' }}>
                                    {new Date(apt.starts_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                  <div className="truncate" style={{ color: '#f1f5ff' }}>{apt.title}</div>
                                  {getPatientName(apt.patients) && (
                                    <div className="truncate" style={{ color: '#a8b2d6' }}>{getPatientName(apt.patients)}</div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="h-16 flex items-center justify-center rounded text-sm" style={{ color: isPast ? '#26304b' : '#a8b2d6' }}>
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

          {/* Footer */}
          <div className="flex justify-center pt-2">
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-lg font-medium transition-all"
              style={{ background: '#141a2c', border: '1px solid #26304b', color: '#a8b2d6' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#7aa2ff'; e.currentTarget.style.color = '#f1f5ff'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#26304b'; e.currentTarget.style.color = '#a8b2d6'; }}
            >
              Annulla
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
