'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type QuickAppointmentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  prefilledDateTime: string | null;
  onSuccess: () => void;
};

type Patient = { id: string; display_name: string | null };

const inputStyle = {
  width: '100%',
  background: '#0b0f1c',
  border: '1px solid #26304b',
  borderRadius: '8px',
  padding: '10px 12px',
  color: '#f1f5ff',
  fontSize: '14px',
  outline: 'none',
};

const labelStyle = {
  display: 'block',
  fontWeight: '500' as const,
  marginBottom: '6px',
  color: '#a8b2d6',
  fontSize: '14px',
};

export default function QuickAppointmentModal({
  isOpen,
  onClose,
  prefilledDateTime,
  onSuccess
}: QuickAppointmentModalProps) {
  const [title, setTitle] = useState('Seduta terapeutica');
  const [patientId, setPatientId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startHour, setStartHour] = useState('08');
  const [startMinute, setStartMinute] = useState('00');
  const [duration, setDuration] = useState(60);
  const [location, setLocation] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadPatients();
      if (prefilledDateTime) {
        const dt = new Date(prefilledDateTime);
        // Data in formato YYYY-MM-DD per input date
        const yyyy = dt.getFullYear();
        const mm = String(dt.getMonth() + 1).padStart(2, '0');
        const dd = String(dt.getDate()).padStart(2, '0');
        setStartDate(`${yyyy}-${mm}-${dd}`);
        // Ora e minuti dallo slot cliccato
        setStartHour(String(dt.getHours()).padStart(2, '0'));
        // Arrotonda i minuti al quarto d'ora più vicino
        const mins = dt.getMinutes();
        if (mins < 8) setStartMinute('00');
        else if (mins < 23) setStartMinute('15');
        else if (mins < 38) setStartMinute('30');
        else if (mins < 53) setStartMinute('45');
        else setStartMinute('00');
      }
    }
  }, [isOpen, prefilledDateTime]);

  async function loadPatients() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('patients')
        .select('id, display_name')
        .eq('therapist_user_id', user.id)
        .order('display_name');
      setPatients(data || []);
    } catch (e) {
      console.error('Errore caricamento pazienti:', e);
    }
  }

  async function handleCreate() {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non autenticato');

      const start = new Date(`${startDate}T${startHour}:${startMinute}:00`);
      const end = new Date(start.getTime() + duration * 60000);

      const { data: newAppointment, error } = await supabase.from('appointments').insert({
        therapist_user_id: user.id,
        patient_id: patientId || null,
        title,
        starts_at: start.toISOString(),
        ends_at: end.toISOString(),
        location,
        status: 'scheduled'
      }).select().single();

      if (error) throw error;

      if (patientId && newAppointment) {
        try {
          await fetch('/api/send-appointment-confirmation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ appointmentId: newAppointment.id })
          });
        } catch (emailError) {
          console.error('Errore invio email:', emailError);
        }
      }

      alert('✅ Appuntamento creato!');
      onSuccess();
      onClose();
      resetForm();
    } catch (error: any) {
      alert('Errore: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  }

  function resetForm() {
    setTitle('Seduta terapeutica');
    setPatientId('');
    setStartDate('');
    setStartHour('08');
    setStartMinute('00');
    setDuration(60);
    setLocation('');
  }

  if (!isOpen) return null;

  const hours = Array.from({ length: 16 }, (_, i) => String(i + 7).padStart(2, '0')); // 07-22
  const minutes = ['00', '15', '30', '45'];

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
      <div className="rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto" style={{
        background: '#0b0f1c',
        border: '2px solid #26304b',
        boxShadow: '0 24px 64px rgba(0,0,0,0.5)'
      }}>
        {/* Header */}
        <div className="p-6 rounded-t-2xl flex items-center justify-between" style={{
          background: '#141a2c',
          borderBottom: '2px solid #26304b'
        }}>
          <h2 className="text-2xl font-bold" style={{ color: '#f1f5ff' }}>⚡ Nuovo Appuntamento</h2>
          <button
            onClick={onClose}
            className="text-2xl font-bold leading-none transition-colors"
            style={{ color: '#a8b2d6' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#f1f5ff')}
            onMouseLeave={e => (e.currentTarget.style.color = '#a8b2d6')}
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-4">

          {/* Titolo */}
          <div>
            <label style={labelStyle}>Titolo *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={inputStyle}
              onFocus={e => (e.currentTarget.style.borderColor = '#7aa2ff')}
              onBlur={e => (e.currentTarget.style.borderColor = '#26304b')}
              required
            />
          </div>

          {/* Paziente */}
          <div>
            <label style={labelStyle}>Paziente</label>
            <select
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              style={inputStyle}
              onFocus={e => (e.currentTarget.style.borderColor = '#7aa2ff')}
              onBlur={e => (e.currentTarget.style.borderColor = '#26304b')}
            >
              <option value="">Nessun paziente</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.display_name || 'Senza nome'}
                </option>
              ))}
            </select>
          </div>

          {/* Data */}
          <div>
            <label style={labelStyle}>Data inizio *</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={inputStyle}
              onFocus={e => (e.currentTarget.style.borderColor = '#7aa2ff')}
              onBlur={e => (e.currentTarget.style.borderColor = '#26304b')}
              required
            />
          </div>

          {/* Ora */}
          <div>
            <label style={labelStyle}>Ora inizio *</label>
            <div className="flex gap-3">
              <select
                value={startHour}
                onChange={(e) => setStartHour(e.target.value)}
                style={{ ...inputStyle }}
                onFocus={e => (e.currentTarget.style.borderColor = '#7aa2ff')}
                onBlur={e => (e.currentTarget.style.borderColor = '#26304b')}
              >
                {hours.map(h => (
                  <option key={h} value={h}>{h}:00</option>
                ))}
              </select>
              <select
                value={startMinute}
                onChange={(e) => setStartMinute(e.target.value)}
                style={{ ...inputStyle }}
                onFocus={e => (e.currentTarget.style.borderColor = '#7aa2ff')}
                onBlur={e => (e.currentTarget.style.borderColor = '#26304b')}
              >
                {minutes.map(m => (
                  <option key={m} value={m}>:{m}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Durata */}
          <div>
            <label style={labelStyle}>Durata</label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              style={inputStyle}
              onFocus={e => (e.currentTarget.style.borderColor = '#7aa2ff')}
              onBlur={e => (e.currentTarget.style.borderColor = '#26304b')}
            >
              <option value={15}>15 minuti</option>
              <option value={30}>30 minuti</option>
              <option value={45}>45 minuti</option>
              <option value={60}>60 minuti</option>
              <option value={90}>90 minuti</option>
            </select>
          </div>

          {/* Luogo */}
          <div>
            <label style={labelStyle}>Luogo</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Studio, online, ecc."
              style={inputStyle}
              onFocus={e => (e.currentTarget.style.borderColor = '#7aa2ff')}
              onBlur={e => (e.currentTarget.style.borderColor = '#26304b')}
            />
          </div>

          {/* Bottoni */}
          <div className="flex gap-3 pt-4" style={{ borderTop: '1px solid #26304b' }}>
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-lg font-medium transition-all"
              style={{ background: '#141a2c', border: '1px solid #26304b', color: '#a8b2d6' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#7aa2ff'; e.currentTarget.style.color = '#f1f5ff'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#26304b'; e.currentTarget.style.color = '#a8b2d6'; }}
            >
              Annulla
            </button>
            <button
              onClick={handleCreate}
              disabled={isLoading || !startDate || !title}
              className="flex-1 px-6 py-3 rounded-lg font-medium transition-all"
              style={{
                background: isLoading || !startDate || !title ? '#26304b' : '#7aa2ff',
                color: isLoading || !startDate || !title ? '#a8b2d6' : '#0b0f1c',
                border: 'none',
                cursor: isLoading || !startDate || !title ? 'not-allowed' : 'pointer'
              }}
              onMouseEnter={e => { if (!isLoading && startDate && title) e.currentTarget.style.background = '#9ab8ff'; }}
              onMouseLeave={e => { if (!isLoading && startDate && title) e.currentTarget.style.background = '#7aa2ff'; }}
            >
              {isLoading ? 'Creazione...' : '✅ Crea'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
