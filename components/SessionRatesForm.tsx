'use client';
import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type SessionRatesFormProps = {
  patientId: string;
  initialData: {
    session_duration_individual: number;
    session_duration_couple: number;
    session_duration_family: number;
    rate_individual: number;
    rate_couple: number;
    rate_family: number;
  };
  onSave: () => void;
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#0b0f1c',
  border: '2px solid #26304b',
  borderRadius: '8px',
  padding: '8px 10px',
  color: '#f1f5ff',
  fontSize: '14px',
  outline: 'none',
};

export default function SessionRatesForm({ patientId, initialData, onSave }: SessionRatesFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [durationIndividual, setDurationIndividual] = useState(initialData.session_duration_individual || 0);
  const [durationCouple, setDurationCouple] = useState(initialData.session_duration_couple || 0);
  const [durationFamily, setDurationFamily] = useState(initialData.session_duration_family || 0);

  const [rateIndividual, setRateIndividual] = useState(initialData.rate_individual || 0);
  const [rateCouple, setRateCouple] = useState(initialData.rate_couple || 0);
  const [rateFamily, setRateFamily] = useState(initialData.rate_family || 0);

  async function handleSave() {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('patients')
        .update({
          session_duration_individual: durationIndividual,
          session_duration_couple: durationCouple,
          session_duration_family: durationFamily,
          rate_individual: rateIndividual,
          rate_couple: rateCouple,
          rate_family: rateFamily
        })
        .eq('id', patientId);

      if (error) throw error;

      alert('✅ Tariffe salvate!');
      setIsEditing(false);
      onSave();
    } catch (e: any) {
      alert('Errore: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  }

  const rateCardStyle: React.CSSProperties = {
    background: '#0b0f1c',
    border: '1px solid #26304b',
    borderRadius: '10px',
    padding: '14px',
  };

  const labelSmall: React.CSSProperties = {
    display: 'block',
    fontSize: '11px',
    color: '#a8b2d6',
    marginBottom: '4px',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            style={{
              background: 'none',
              border: '1px solid #26304b',
              borderRadius: '6px',
              padding: '5px 12px',
              color: '#7aa2ff',
              fontSize: '13px',
              cursor: 'pointer',
              fontWeight: 500,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#7aa2ff'; e.currentTarget.style.background = 'rgba(122,162,255,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#26304b'; e.currentTarget.style.background = 'none'; }}
          >
            ✏️ Modifica
          </button>
        )}
      </div>

      {!isEditing ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          <div style={rateCardStyle}>
            <div style={{ fontSize: '12px', color: '#a8b2d6', marginBottom: '8px' }}>👤 Individuale</div>
            <div style={{ fontWeight: 700, fontSize: '20px', color: '#f1f5ff' }}>€{rateIndividual}</div>
            <div style={{ fontSize: '12px', color: '#7aa2ff', marginTop: '4px' }}>{durationIndividual} min</div>
          </div>
          <div style={rateCardStyle}>
            <div style={{ fontSize: '12px', color: '#a8b2d6', marginBottom: '8px' }}>👥 Coppia</div>
            <div style={{ fontWeight: 700, fontSize: '20px', color: '#f1f5ff' }}>€{rateCouple}</div>
            <div style={{ fontSize: '12px', color: '#7aa2ff', marginTop: '4px' }}>{durationCouple} min</div>
          </div>
          <div style={rateCardStyle}>
            <div style={{ fontSize: '12px', color: '#a8b2d6', marginBottom: '8px' }}>👨‍👩‍👧 Famiglia</div>
            <div style={{ fontWeight: 700, fontSize: '20px', color: '#f1f5ff' }}>€{rateFamily}</div>
            <div style={{ fontSize: '12px', color: '#7aa2ff', marginTop: '4px' }}>{durationFamily} min</div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {/* Individuale */}
            <div style={{ background: '#0b0f1c', border: '1px solid #26304b', borderRadius: '10px', padding: '12px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5ff', marginBottom: '10px' }}>👤 Individuale</div>
              <div style={{ marginBottom: '8px' }}>
                <label style={labelSmall}>Durata (min)</label>
                <input type="number" value={durationIndividual} onChange={e => setDurationIndividual(Number(e.target.value))} style={inputStyle} min="15" step="15"
                  onFocus={e => (e.currentTarget.style.borderColor = '#7aa2ff')} onBlur={e => (e.currentTarget.style.borderColor = '#26304b')} />
              </div>
              <div>
                <label style={labelSmall}>Tariffa (€)</label>
                <input type="number" value={rateIndividual} onChange={e => setRateIndividual(Number(e.target.value))} style={inputStyle} min="0" step="5"
                  onFocus={e => (e.currentTarget.style.borderColor = '#7aa2ff')} onBlur={e => (e.currentTarget.style.borderColor = '#26304b')} />
              </div>
            </div>

            {/* Coppia */}
            <div style={{ background: '#0b0f1c', border: '1px solid #26304b', borderRadius: '10px', padding: '12px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5ff', marginBottom: '10px' }}>👥 Coppia</div>
              <div style={{ marginBottom: '8px' }}>
                <label style={labelSmall}>Durata (min)</label>
                <input type="number" value={durationCouple} onChange={e => setDurationCouple(Number(e.target.value))} style={inputStyle} min="15" step="15"
                  onFocus={e => (e.currentTarget.style.borderColor = '#7aa2ff')} onBlur={e => (e.currentTarget.style.borderColor = '#26304b')} />
              </div>
              <div>
                <label style={labelSmall}>Tariffa (€)</label>
                <input type="number" value={rateCouple} onChange={e => setRateCouple(Number(e.target.value))} style={inputStyle} min="0" step="5"
                  onFocus={e => (e.currentTarget.style.borderColor = '#7aa2ff')} onBlur={e => (e.currentTarget.style.borderColor = '#26304b')} />
              </div>
            </div>

            {/* Famiglia */}
            <div style={{ background: '#0b0f1c', border: '1px solid #26304b', borderRadius: '10px', padding: '12px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5ff', marginBottom: '10px' }}>👨‍👩‍👧 Famiglia</div>
              <div style={{ marginBottom: '8px' }}>
                <label style={labelSmall}>Durata (min)</label>
                <input type="number" value={durationFamily} onChange={e => setDurationFamily(Number(e.target.value))} style={inputStyle} min="15" step="15"
                  onFocus={e => (e.currentTarget.style.borderColor = '#7aa2ff')} onBlur={e => (e.currentTarget.style.borderColor = '#26304b')} />
              </div>
              <div>
                <label style={labelSmall}>Tariffa (€)</label>
                <input type="number" value={rateFamily} onChange={e => setRateFamily(Number(e.target.value))} style={inputStyle} min="0" step="5"
                  onFocus={e => (e.currentTarget.style.borderColor = '#7aa2ff')} onBlur={e => (e.currentTarget.style.borderColor = '#26304b')} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', paddingTop: '8px', borderTop: '1px solid #26304b' }}>
            <button onClick={() => setIsEditing(false)}
              style={{ background: '#141a2c', color: '#a8b2d6', border: '1px solid #26304b', borderRadius: '8px', padding: '8px 16px', fontWeight: 500, cursor: 'pointer', fontSize: '14px' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#7aa2ff'; e.currentTarget.style.color = '#f1f5ff'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#26304b'; e.currentTarget.style.color = '#a8b2d6'; }}>
              Annulla
            </button>
            <button onClick={handleSave} disabled={isSaving}
              style={{ background: '#7aa2ff', color: '#0b1022', border: 'none', borderRadius: '8px', padding: '8px 16px', fontWeight: 600, cursor: isSaving ? 'not-allowed' : 'pointer', fontSize: '14px', opacity: isSaving ? 0.6 : 1 }}
              onMouseEnter={e => { if (!isSaving) e.currentTarget.style.background = '#9ab8ff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#7aa2ff'; }}>
              {isSaving ? 'Salvataggio...' : '💾 Salva Tariffe'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
