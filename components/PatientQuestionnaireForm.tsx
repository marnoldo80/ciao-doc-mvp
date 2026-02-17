'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type Domanda = {
  testo: string;
  opzioni?: string[];
};

export type PatientQuestionnaireConfig = {
  type: string;
  titolo: string;
  sottotitolo: string;
  istruzioni: string;
  domande: Domanda[];
  opzioniDefault: { label: string; valore: number }[];
  calcolaSeverita: (total: number) => string;
  maxScore: number;
  emoji: string;
};

type Props = {
  config: PatientQuestionnaireConfig;
};

function FormInner({ config }: Props) {
  const searchParams = useSearchParams();
  const patientId = searchParams.get('patientId');

  const [risposte, setRisposte] = useState<number[]>(Array(config.domande.length).fill(-1));
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [risultato, setRisultato] = useState<{ total: number; severity: string } | null>(null);
  const [patientName, setPatientName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (patientId) {
      supabase.from('patients').select('display_name').eq('id', patientId).single()
        .then(({ data }) => setPatientName(data?.display_name || 'Paziente'));
    }
  }, [patientId]);

  const progresso = risposte.filter(r => r !== -1).length;
  const totale = risposte.reduce((a, b) => (b === -1 ? a : a + b), 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (risposte.some(r => r === -1)) {
      alert('Rispondi a tutte le domande prima di continuare');
      return;
    }
    if (!patientId) {
      setError('Link non valido. Contatta il tuo terapeuta.');
      return;
    }

    setLoading(true);
    try {
      const total = risposte.reduce((a, b) => a + b, 0);
      const severity = config.calcolaSeverita(total);

      // Salva tramite API server-side (service role, nessun login richiesto)
      const res = await fetch('/api/submit-questionnaire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          type: config.type,
          answers: risposte,
          total,
          severity,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Errore salvataggio');
      }

      setRisultato({ total, severity });
      setSubmitted(true);
    } catch (e: any) {
      setError('Errore durante il salvataggio: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  const severityColor = (s: string) => {
    if (s.includes('rave') || s.includes('urgente') || s.includes('Alta')) return '#ef4444';
    if (s.includes('oderata') || s.includes('ossibile')) return '#eab308';
    if (s.includes('ieve') || s.includes('bassa') || s.includes('ormale') || s.includes('ssenza')) return '#22c55e';
    return '#7aa2ff';
  };

  if (!patientId) {
    return (
      <div style={{ maxWidth: '600px', margin: '60px auto', padding: '32px', textAlign: 'center' }}>
        <div style={{ background: '#141a2c', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '16px', padding: '40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h2 style={{ color: '#ef4444', marginBottom: '12px' }}>Link non valido</h2>
          <p style={{ color: '#a8b2d6' }}>Il link che hai ricevuto non è corretto. Contatta il tuo terapeuta.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: '600px', margin: '60px auto', padding: '32px', textAlign: 'center' }}>
        <div style={{ background: '#141a2c', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '16px', padding: '40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
          <h2 style={{ color: '#ef4444', marginBottom: '12px' }}>Errore</h2>
          <p style={{ color: '#a8b2d6' }}>{error}</p>
        </div>
      </div>
    );
  }

  if (submitted && risultato) {
    return (
      <div style={{ maxWidth: '600px', margin: '60px auto', padding: '32px' }}>
        <div style={{ background: '#141a2c', border: '1px solid #26304b', borderRadius: '20px', padding: '48px', textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>✅</div>
          <h2 style={{ fontSize: '26px', fontWeight: 700, color: '#f1f5ff', marginBottom: '8px' }}>Questionario completato!</h2>
          <p style={{ color: '#a8b2d6', marginBottom: '32px', fontSize: '15px' }}>Grazie {patientName}. I tuoi risultati sono stati inviati al tuo terapeuta.</p>

          <div style={{ background: '#0b0f1c', border: '1px solid #26304b', borderRadius: '14px', padding: '28px', marginBottom: '24px' }}>
            <p style={{ fontSize: '14px', color: '#a8b2d6', marginBottom: '8px' }}>{config.titolo}</p>
            <div style={{ fontSize: '52px', fontWeight: 800, color: '#f1f5ff', fontFamily: 'monospace' }}>
              {risultato.total}
              <span style={{ fontSize: '20px', color: '#a8b2d6', fontWeight: 400 }}>/{config.maxScore}</span>
            </div>
            <div style={{ marginTop: '14px' }}>
              <span style={{
                display: 'inline-block', padding: '6px 20px', borderRadius: '999px', fontWeight: 700, fontSize: '15px',
                background: severityColor(risultato.severity) + '22',
                color: severityColor(risultato.severity),
                border: `1px solid ${severityColor(risultato.severity)}44`,
              }}>
                {risultato.severity}
              </span>
            </div>
          </div>

          <p style={{ color: '#a8b2d6', fontSize: '13px' }}>Puoi chiudere questa finestra.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 20px' }}>

      {/* Logo / Header app */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ fontSize: '28px', fontWeight: 800, color: '#7aa2ff', letterSpacing: '-0.5px' }}>CiaoDoc</div>
        <p style={{ fontSize: '13px', color: '#a8b2d6', marginTop: '4px' }}>Questionario psicologico</p>
      </div>

      {/* Header questionario */}
      <div style={{ background: '#141a2c', border: '1px solid #26304b', borderRadius: '16px', padding: '24px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ fontSize: '40px' }}>{config.emoji}</span>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#f1f5ff', margin: 0 }}>{config.titolo}</h1>
            <p style={{ fontSize: '13px', color: '#a8b2d6', margin: '4px 0 0 0' }}>{config.sottotitolo}</p>
          </div>
        </div>

        {/* Barra progresso */}
        <div style={{ marginTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', color: '#a8b2d6' }}>{progresso}/{config.domande.length} risposte</span>
            {progresso > 0 && <span style={{ fontSize: '12px', color: '#7aa2ff' }}>Punteggio: {totale}</span>}
          </div>
          <div style={{ height: '4px', background: '#26304b', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: '#7aa2ff', borderRadius: '999px', width: `${(progresso / config.domande.length) * 100}%`, transition: 'width 0.3s' }} />
          </div>
        </div>
      </div>

      {/* Istruzioni */}
      <div style={{ background: 'rgba(122,162,255,0.08)', border: '1px solid rgba(122,162,255,0.2)', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px' }}>
        <p style={{ fontSize: '13px', color: '#a8b2d6', margin: 0 }}>📋 {config.istruzioni}</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {config.domande.map((domanda, i) => {
          const opzioni = domanda.opzioni
            ? domanda.opzioni.map((label, idx) => ({ label, valore: idx }))
            : config.opzioniDefault;

          return (
            <div key={i} style={{
              background: '#141a2c',
              border: `1px solid ${risposte[i] !== -1 ? 'rgba(122,162,255,0.3)' : '#26304b'}`,
              borderRadius: '12px', padding: '18px', transition: 'border-color 0.2s'
            }}>
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#f1f5ff', marginBottom: '12px' }}>
                <span style={{ color: '#7aa2ff', marginRight: '8px' }}>{i + 1}.</span>
                {domanda.testo}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {opzioni.map((opzione) => (
                  <button
                    key={opzione.valore}
                    type="button"
                    onClick={() => {
                      const nr = [...risposte];
                      nr[i] = opzione.valore;
                      setRisposte(nr);
                    }}
                    style={{
                      padding: '8px 16px', borderRadius: '8px', fontSize: '13px',
                      fontWeight: risposte[i] === opzione.valore ? 700 : 400,
                      cursor: 'pointer', transition: 'all 0.15s',
                      background: risposte[i] === opzione.valore ? '#7aa2ff' : '#0b0f1c',
                      color: risposte[i] === opzione.valore ? '#0b1022' : '#a8b2d6',
                      border: risposte[i] === opzione.valore ? '1px solid #7aa2ff' : '1px solid #26304b',
                    }}
                  >
                    {opzione.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}

        <button
          type="submit"
          disabled={loading || risposte.some(r => r === -1)}
          style={{
            marginTop: '8px',
            background: risposte.some(r => r === -1) ? '#141a2c' : 'linear-gradient(135deg, #7aa2ff, #9333ea)',
            color: risposte.some(r => r === -1) ? '#a8b2d6' : 'white',
            border: risposte.some(r => r === -1) ? '1px solid #26304b' : 'none',
            borderRadius: '12px', padding: '16px', fontWeight: 700, fontSize: '16px',
            cursor: risposte.some(r => r === -1) ? 'not-allowed' : 'pointer',
            width: '100%', transition: 'all 0.2s',
            boxShadow: risposte.some(r => r === -1) ? 'none' : '0 4px 20px rgba(122,162,255,0.3)',
          }}
        >
          {loading ? 'Invio in corso...' : risposte.some(r => r === -1)
            ? `Rispondi ancora a ${config.domande.length - progresso} domande`
            : `✓ Invia questionario`
          }
        </button>

        <p style={{ textAlign: 'center', fontSize: '12px', color: '#a8b2d6', margin: '8px 0 0 0' }}>
          Le tue risposte saranno inviate in modo sicuro al tuo terapeuta
        </p>
      </form>
    </div>
  );
}

export default function PatientQuestionnaireForm({ config }: Props) {
  return (
    <div style={{ minHeight: '100vh', background: '#0b0f1c', padding: '24px 0' }}>
      <Suspense fallback={<div style={{ padding: '48px', textAlign: 'center', color: '#a8b2d6' }}>Caricamento...</div>}>
        <FormInner config={config} />
      </Suspense>
    </div>
  );
}
