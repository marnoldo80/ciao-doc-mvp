'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Patient = { 
  id: string; 
  display_name: string | null; 
  email: string | null; 
  phone: string | null; 
};

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [hoverBack, setHoverBack] = useState(false);
  const [hoverNuovo, setHoverNuovo] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('patients')
        .select('id, display_name, email, phone')
        .eq('therapist_user_id', user.id)
        .order('display_name', { ascending: true }); // Ordine alfabetico

      setPatients(data || []);
      setLoading(false);
    })();
  }, []);

  // Filtra pazienti in base alla ricerca
  const filteredPatients = patients.filter(patient => 
    patient.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone?.includes(searchTerm)
  );

  return (
    <div style={{ padding: '24px', background: '#0b0f1c', minHeight: '100vh' }}>
      <div className="max-w-6xl mx-auto space-y-6">

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
          <h1 className="text-3xl font-bold" style={{ color: '#f1f5ff' }}>
            👥 I tuoi pazienti
          </h1>
          <Link
            href="/app/therapist/pazienti/nuovo"
            onMouseEnter={() => setHoverNuovo(true)}
            onMouseLeave={() => setHoverNuovo(false)}
            className="px-5 py-2 rounded-lg font-semibold transition-all duration-200"
            style={{
              background: hoverNuovo ? '#9ab8ff' : '#7aa2ff',
              color: '#0b1022',
              textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(122,162,255,0.25)'
            }}
          >
            + Nuovo Paziente
          </Link>
        </div>

        {/* Barra di ricerca */}
        <div className="max-w-md">
          <label className="block text-sm font-medium mb-2" style={{ color: '#a8b2d6' }}>
            🔍 Cerca paziente
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Nome, email o telefono..."
            className="w-full px-4 py-3 rounded-lg outline-none transition-colors duration-300"
            style={{ background: '#141a2c', border: '2px solid #26304b', color: '#f1f5ff' }}
            onFocus={(e) => e.target.style.borderColor = '#7aa2ff'}
            onBlur={(e) => e.target.style.borderColor = '#26304b'}
          />
          {searchTerm && (
            <div className="mt-2 text-sm" style={{ color: '#a8b2d6' }}>
              {filteredPatients.length} paziente{filteredPatients.length !== 1 ? 'i' : ''} trovato{filteredPatients.length !== 1 ? 'i' : ''}
            </div>
          )}
        </div>

        {loading && (
          <div className="text-center py-8" style={{ color: '#a8b2d6' }}>Caricamento...</div>
        )}

        {/* Griglia pazienti */}
        {!loading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPatients.map((p) => (
              <Link
                key={p.id}
                href={`/app/therapist/pazienti/${p.id}`}
                className="block rounded-xl p-5 transition-all duration-200 hover:scale-105 hover:-translate-y-1"
                style={{
                  background: '#141a2c',
                  border: '2px solid #26304b',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                  color: '#f1f5ff',
                  textDecoration: 'none',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = '#7aa2ff';
                  e.currentTarget.style.boxShadow = '0 16px 40px rgba(122,162,255,0.2)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#26304b';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)';
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0"
                    style={{ background: 'rgba(122,162,255,0.15)', color: '#7aa2ff', border: '1px solid rgba(122,162,255,0.3)' }}>
                    {(p.display_name || '?')[0].toUpperCase()}
                  </div>
                  <h3 className="font-semibold text-lg" style={{ color: '#f1f5ff' }}>
                    {p.display_name || 'Senza nome'}
                  </h3>
                </div>
                <p className="text-sm mb-1" style={{ color: '#a8b2d6' }}>
                  📧 {p.email || 'Nessuna email'}
                </p>
                {p.phone && (
                  <p className="text-sm" style={{ color: '#a8b2d6' }}>
                    📱 {p.phone}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}

        {/* Nessun paziente */}
        {filteredPatients.length === 0 && !loading && !searchTerm && (
          <div className="text-center py-12" style={{ color: '#a8b2d6' }}>
            <p className="text-lg mb-4">Nessun paziente ancora</p>
            <Link
              href="/app/therapist/pazienti/nuovo"
              className="px-6 py-3 rounded-lg font-medium transition-all duration-200 inline-block"
              style={{ background: '#7aa2ff', color: '#0b1022', textDecoration: 'none' }}
            >
              Crea il primo paziente
            </Link>
          </div>
        )}

        {/* Nessun risultato ricerca */}
        {filteredPatients.length === 0 && !loading && searchTerm && (
          <div className="text-center py-12" style={{ color: '#a8b2d6' }}>
            <p className="text-lg mb-4">Nessun paziente trovato per "{searchTerm}"</p>
            <button
              onClick={() => setSearchTerm('')}
              className="px-4 py-2 rounded-lg font-medium transition-all duration-200"
              style={{ background: '#141a2c', border: '1px solid #26304b', color: '#a8b2d6', cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#7aa2ff'; e.currentTarget.style.color = '#f1f5ff'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#26304b'; e.currentTarget.style.color = '#a8b2d6'; }}
            >
              Cancella ricerca
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
