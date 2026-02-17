'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type SessionNote = {
  id: string;
  patient_id: string;
  session_date: string;
  notes: string | null;
  ai_summary: string | null;
  themes: string[];
  created_at: string;
  patients?: {
    display_name: string | null;
  } | null;
};

// Estrae sezioni strutturate dal campo notes (salvato da nuovo/page.tsx)
function parseStructuredNotes(notes: string | null) {
  if (!notes) return { transcript: '', summary: '', themes: [], objectives: [], exercises: [], personalNotes: '' };

  const sections: Record<string, string> = {};
  const sectionPattern = /(?:📝 TRASCRIZIONE SEDUTA:|✨ RIASSUNTO IA:|🎯 TEMI PRINCIPALI:|🎯 OBIETTIVI EMERSI:|💪 ESERCIZI PROPOSTI:|📝 NOTE PERSONALI TERAPEUTA:)/g;
  const matches = [...notes.matchAll(new RegExp('(📝 TRASCRIZIONE SEDUTA:|✨ RIASSUNTO IA:|🎯 TEMI PRINCIPALI:|🎯 OBIETTIVI EMERSI:|💪 ESERCIZI PROPOSTI:|📝 NOTE PERSONALI TERAPEUTA:)', 'g'))];

  for (let i = 0; i < matches.length; i++) {
    const key = matches[i][0];
    const start = matches[i].index! + key.length;
    const end = i + 1 < matches.length ? matches[i + 1].index! : notes.length;
    sections[key] = notes.slice(start, end).trim();
  }

  const parseList = (text: string) =>
    text.split('\n').map(l => l.replace(/^•\s*/, '').trim()).filter(Boolean);

  return {
    transcript: sections['📝 TRASCRIZIONE SEDUTA:'] || '',
    summary: sections['✨ RIASSUNTO IA:'] || '',
    themes: sections['🎯 TEMI PRINCIPALI:'] ? parseList(sections['🎯 TEMI PRINCIPALI:']) : [],
    objectives: sections['🎯 OBIETTIVI EMERSI:'] ? parseList(sections['🎯 OBIETTIVI EMERSI:']) : [],
    exercises: sections['💪 ESERCIZI PROPOSTI:'] ? parseList(sections['💪 ESERCIZI PROPOSTI:']) : [],
    personalNotes: sections['📝 NOTE PERSONALI TERAPEUTA:'] || '',
  };
}

export default function DettaglioSedutaPage() {
  const params = useParams();
  const id = params?.id as string;

  const [session, setSession] = useState<SessionNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    loadSession();
  }, [id]);

  async function loadSession() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non autenticato');

      const { data, error } = await supabase
        .from('session_notes')
        .select('*, patients(display_name)')
        .eq('id', id)
        .eq('therapist_user_id', user.id)
        .single();

      if (error) throw error;
      setSession(data as SessionNote);
    } catch (e: any) {
      setErr(e?.message || 'Errore caricamento');
    } finally {
      setLoading(false);
    }
  }

  if (loading) return (
    <div className="max-w-4xl mx-auto p-6" style={{ color: '#a8b2d6' }}>
      <div className="flex items-center gap-3">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
        Caricamento seduta...
      </div>
    </div>
  );

  if (err) return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="p-4 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}>
        {err}
      </div>
    </div>
  );

  if (!session) return (
    <div className="max-w-4xl mx-auto p-6" style={{ color: '#a8b2d6' }}>Seduta non trovata</div>
  );

  const patientName = session.patients && typeof session.patients === 'object' && 'display_name' in session.patients
    ? session.patients.display_name
    : 'Paziente';

  const parsed = parseStructuredNotes(session.notes);
  // Temi: prima usa quelli dal campo themes[], poi quelli parsati dalle notes
  const displayThemes = (session.themes && session.themes.length > 0) ? session.themes : parsed.themes;
  // Riassunto: prima usa ai_summary[], poi quello parsato
  const displaySummary = session.ai_summary || parsed.summary;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href={`/app/therapist/pazienti/${session.patient_id}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200"
            style={{ color: '#a8b2d6', background: '#141a2c', border: '1px solid #26304b', textDecoration: 'none' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#7aa2ff'; e.currentTarget.style.color = '#f1f5ff'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#26304b'; e.currentTarget.style.color = '#a8b2d6'; }}
          >
            ← Scheda Paziente
          </Link>
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#f1f5ff' }}>
            📝 Seduta del {new Date(session.session_date + 'T12:00:00').toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </h1>
          {patientName && (
            <p className="text-sm mt-1" style={{ color: '#a8b2d6' }}>Paziente: {patientName}</p>
          )}
        </div>
      </div>

      {/* Trascrizione */}
      {parsed.transcript && (
        <div className="rounded-lg p-6" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <h3 className="font-bold text-lg mb-4" style={{ color: 'white' }}>📝 Trascrizione Seduta</h3>
          <div
            className="whitespace-pre-wrap rounded-lg p-4"
            style={{
              color: '#d1d5db',
              maxHeight: '320px',
              overflowY: 'auto',
              backgroundColor: 'rgba(0,0,0,0.2)',
              border: '1px solid rgba(255,255,255,0.07)',
              lineHeight: '1.7',
              fontSize: '14px',
            }}
          >
            {parsed.transcript}
          </div>
        </div>
      )}

      {/* Riassunto IA */}
      {displaySummary && (
        <div className="rounded-lg p-6" style={{ background: 'rgba(147,51,234,0.08)', border: '1px solid rgba(147,51,234,0.25)' }}>
          <h3 className="font-bold text-lg mb-4" style={{ color: '#c084fc' }}>✨ Riassunto IA</h3>
          <div className="whitespace-pre-wrap" style={{ color: '#d1d5db', lineHeight: '1.7', fontSize: '14px' }}>
            {displaySummary}
          </div>
        </div>
      )}

      {/* Temi principali */}
      {displayThemes.length > 0 && (
        <div className="rounded-lg p-6" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <h3 className="font-bold text-lg mb-4" style={{ color: 'white' }}>🏷️ Temi Principali</h3>
          <div className="flex flex-wrap gap-2">
            {displayThemes.map((theme, i) => (
              <span key={i} className="px-3 py-1 rounded-full text-sm" style={{ background: 'rgba(122,162,255,0.15)', color: '#7aa2ff', border: '1px solid rgba(122,162,255,0.3)' }}>
                {theme}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Obiettivi */}
      {parsed.objectives.length > 0 && (
        <div className="rounded-lg p-6" style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.2)' }}>
          <h3 className="font-bold text-lg mb-4" style={{ color: '#22c55e' }}>🎯 Obiettivi Emersi</h3>
          <ul className="space-y-2">
            {parsed.objectives.map((obj, i) => (
              <li key={i} className="flex items-start gap-2" style={{ color: '#d1d5db' }}>
                <span className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: '#22c55e' }}></span>
                {obj}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Esercizi */}
      {parsed.exercises.length > 0 && (
        <div className="rounded-lg p-6" style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <h3 className="font-bold text-lg mb-4" style={{ color: '#f59e0b' }}>💪 Esercizi Proposti</h3>
          <ul className="space-y-2">
            {parsed.exercises.map((ex, i) => (
              <li key={i} className="flex items-start gap-2" style={{ color: '#d1d5db' }}>
                <span className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: '#f59e0b' }}></span>
                {ex}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Note personali terapeuta */}
      {parsed.personalNotes && (
        <div className="rounded-lg p-6" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <h3 className="font-bold text-lg mb-4" style={{ color: 'white' }}>📝 Note Personali Terapeuta</h3>
          <div className="whitespace-pre-wrap rounded-lg p-4" style={{ color: '#d1d5db', backgroundColor: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.07)', lineHeight: '1.7', fontSize: '14px' }}>
            {parsed.personalNotes}
          </div>
        </div>
      )}

      {/* Fallback: se le notes non hanno struttura, mostra il testo grezzo */}
      {!parsed.transcript && !displaySummary && displayThemes.length === 0 && session.notes && (
        <div className="rounded-lg p-6" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <h3 className="font-bold text-lg mb-4" style={{ color: 'white' }}>📝 Note Seduta</h3>
          <div className="whitespace-pre-wrap" style={{ color: '#d1d5db', lineHeight: '1.7', fontSize: '14px' }}>
            {session.notes}
          </div>
        </div>
      )}

      {/* Nessun contenuto */}
      {!session.notes && !session.ai_summary && (
        <div className="rounded-lg p-8 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.15)' }}>
          <p style={{ color: '#a8b2d6' }}>📭 Nessun contenuto salvato per questa seduta.</p>
        </div>
      )}

      {/* Info footer */}
      <div className="text-sm" style={{ color: '#6b7280' }}>
        Creata il {new Date(session.created_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
      </div>

    </div>
  );
}
