'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type Domanda = {
  testo: string;
  opzioni?: string[]; // se non specificato usa le opzioni standard
};

export type QuestionnaireConfig = {
  type: string;           // chiave nel DB
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
  config: QuestionnaireConfig;
};

function FormInner({ config }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get('patientId');

  const [risposte, setRisposte] = useState<number[]>(Array(config.domande.length).fill(-1));
  const [loading, setLoading] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [risultato, setRisultato] = useState<{ total: number; severity: string } | null>(null);

  useEffect(() => {
    if (!patientId) return;
    supabase.from('patients').select('display_name').eq('id', patientId).single()
      .then(({ data }) => setPatientName(data?.display_name || 'Paziente'));
  }, [patientId]);

  const progresso = risposte.filter(r => r !== -1).length;
  const totale = risposte.reduce((a, b) => (b === -1 ? a : a + b), 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (risposte.some(r => r === -1)) {
      alert('Rispondi a tutte le domande prima di continuare');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non autenticato');

      const total = risposte.reduce((a, b) => a + b, 0);
      const severity = config.calcolaSeverita(total);

      const { error } = await supabase.from('questionnaire_results').insert({
        patient_id: patientId,
        therapist_user_id: user.id,
        type: config.type,
        answers: risposte,
        total,
        severity,
      });

      if (error) throw error;

      setRisultato({ total, severity });
      setSubmitted(true);
    } catch (e: any) {
      alert('Errore durante il salvataggio: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  const severityColor = (s: string) => {
    if (s.includes('grave') || s.includes('severa') || s.includes('alta')) return '#ef4444';
    if (s.includes('moderata') || s.includes('media')) return '#eab308';
    if (s.includes('lieve') || s.includes('bassa') || s.includes('lievemente')) return '#7aa2ff';
    return '#22c55e';
  };

  if (submitted && risultato) {
    return (
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ background: '#141a2c', border: '1px solid #26304b', borderRadius: '16px', padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>{config.emoji}</div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#f1f5ff', marginBottom: '8px' }}>Questionario completato!</h2>
          <p style={{ color: '#a8b2d6', marginBottom: '28px' }}>{patientName}</p>

          <div style={{ background: '#0b0f1c', border: '1px solid #26304b', borderRadius: '12px', padding: '24px', marginBottom: '28px' }}>
            <div style={{ fontSize: '48px', fontWeight: 800, color: '#f1f5ff', fontFamily: 'monospace' }}>
              {risultato.total}
              <span style={{ fontSize: '20px', color: '#a8b2d6', fontWeight: 400 }}>/{config.maxScore}</span>
            </div>
            <div style={{ marginTop: '12px' }}>
              <span style={{
                display: 'inline-block', padding: '6px 18px', borderRadius: '999px', fontWeight: 700, fontSize: '15px',
                background: severityColor(risultato.severity) + '22',
                color: severityColor(risultato.severity),
                border: `1px solid ${severityColor(risultato.severity)}44`,
              }}>
                {risultato.severity.charAt(0).toUpperCase() + risultato.severity.slice(1)}
              </span>
            </div>
          </div>

          <button
            onClick={() => router.push(`/app/therapist/pazienti/${patientId}?tab=questionari`)}
            style={{ background: '#7aa2ff', color: '#0b1022', border: 'none', borderRadius: '10px', padding: '12px 28px', fontWeight: 700, fontSize: '15px', cursor: 'pointer' }}
          >
            ← Torna alla scheda paziente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 24px' }}>

      {/* Breadcrumb */}
      <div style={{ marginBottom: '20px' }}>
        <Link
          href={patientId ? `/app/therapist/pazienti/${patientId}?tab=questionari` : '/app/therapist/pazienti'}
          style={{ color: '#a8b2d6', textDecoration: 'none', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: '#141a2c', border: '1px solid #26304b', borderRadius: '8px', padding: '6px 14px' }}
        >
          ← Scheda Paziente
        </Link>
      </div>

      {/* Header */}
      <div style={{ background: '#141a2c', border: '1px solid #26304b', borderRadius: '16px', padding: '24px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ fontSize: '40px' }}>{config.emoji}</span>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#f1f5ff', margin: 0 }}>{config.titolo}</h1>
            <p style={{ fontSize: '13px', color: '#a8b2d6', margin: '4px 0 0 0' }}>{config.sottotitolo} · Paziente: {patientName}</p>
          </div>
        </div>

        {/* Barra progresso */}
        <div style={{ marginTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', color: '#a8b2d6' }}>{progresso}/{config.domande.length} domande</span>
            <span style={{ fontSize: '12px', color: '#7aa2ff' }}>Punteggio attuale: {totale}/{config.maxScore}</span>
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
                      padding: '7px 14px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: risposte[i] === opzione.valore ? 700 : 400,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
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
            borderRadius: '12px', padding: '14px', fontWeight: 700, fontSize: '15px',
            cursor: risposte.some(r => r === -1) ? 'not-allowed' : 'pointer',
            width: '100%', transition: 'all 0.2s',
            boxShadow: risposte.some(r => r === -1) ? 'none' : '0 4px 16px rgba(122,162,255,0.3)',
          }}
        >
          {loading ? 'Salvataggio in corso...' : risposte.some(r => r === -1)
            ? `Rispondi a ${config.domande.length - progresso} domande rimanenti`
            : `✓ Salva questionario (${totale}/${config.maxScore})`
          }
        </button>
      </form>
    </div>
  );
}

export default function QuestionnaireForm({ config }: Props) {
  return (
    <div style={{ minHeight: '100vh', background: '#0b0f1c', padding: '24px 0' }}>
      <Suspense fallback={<div style={{ padding: '48px', textAlign: 'center', color: '#a8b2d6' }}>Caricamento...</div>}>
        <FormInner config={config} />
      </Suspense>
    </div>
  );
}
