'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import AlertsWidget from '@/components/AlertsWidget';
import CalendarPicker from '@/components/CalendarPicker';
import QuickAppointmentModal from '@/components/QuickAppointmentModal';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function AlertsWidgetWrapper() {
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
  }, []);

  if (!userId) return null;
  return <AlertsWidget therapistId={userId} />;
}

export default function Page() {
  const [err, setErr] = useState<string|null>(null);
  const [therapist, setTherapist] = useState<{ display_name: string|null; address: string|null; vat_number: string|null; }|null>(null);
  const [allPatients, setAllPatients] = useState<any[]>([]);
  const [nextAppts, setNextAppts] = useState<any[]>([]);
  const [totalPatients, setTotalPatients] = useState(0);
  const [weekAppts, setWeekAppts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCalendarPicker, setShowCalendarPicker] = useState(false);
  const [showQuickModal, setShowQuickModal] = useState(false);
  const [selectedDateTime, setSelectedDateTime] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setErr(null);
      setLoading(true);

      await new Promise(r => setTimeout(r, 500));

      const { data:{ user } } = await supabase.auth.getUser();
      if (!user) { setErr('Non autenticato'); setLoading(false); return; }

      {
        const { data, error } = await supabase
          .from('therapists')
          .select('display_name,address,vat_number')
          .eq('user_id', user.id)
          .maybeSingle();
        if (error) setErr(error.message);
        setTherapist(data || null);
      }

      {
        const { count } = await supabase
          .from('patients')
          .select('*', { count: 'exact', head: true })
          .eq('therapist_user_id', user.id);
        setTotalPatients(count || 0);

        const weekStart = new Date();
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        const { count: apptCount } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('therapist_user_id', user.id)
          .gte('starts_at', weekStart.toISOString())
          .lte('starts_at', weekEnd.toISOString());
        setWeekAppts(apptCount || 0);
      }

      {
        const { data, error } = await supabase
          .from('patients')
          .select('id,display_name,email,created_at')
          .eq('therapist_user_id', user.id)
          .order('display_name', { ascending: true });
        if (error) setErr(error.message);
        setAllPatients(data || []);
      }

      {
        const { data, error } = await supabase
          .from('appointments')
          .select('id,title,starts_at,ends_at,status,patients!appointments_patient_fkey(display_name)')
          .eq('therapist_user_id', user.id)
          .gte('starts_at', new Date().toISOString())
          .order('starts_at', { ascending: true })
          .limit(5);
        if (error) setErr(error.message);
        setNextAppts(data || []);
      }

      setLoading(false);
    })();
  }, []);

  function getWelcomeMessage(name: string | null | undefined): string {
    if (!name) return 'Benvenuto/a';
    const femaleEndings = ['a', 'na', 'la', 'ra', 'sa', 'ta'];
    const lowerName = name.toLowerCase();
    const isFemale = femaleEndings.some(ending => lowerName.endsWith(ending));
    return isFemale ? 'Benvenuta' : 'Benvenuto';
  }

  function getPatientName(rel: any): string {
    if (!rel) return '';
    if (Array.isArray(rel)) return rel[0]?.display_name || '';
    return rel.display_name || '';
  }

  function handleDateTimeSelected(dateTime: string) {
    setSelectedDateTime(dateTime);
    setShowCalendarPicker(false);
    setShowQuickModal(true);
  }

  function reloadAppointments() {
    window.location.reload();
  }

  return (
    <div style={{ padding: '24px' }}>
      <div className="max-w-7xl mx-auto">
        {/* HERO HEADER - Dark theme like login */}
        <div className="mb-8 p-8 rounded-3xl relative overflow-hidden animate-fadeIn" style={{
          background: '#141a2c',
          border: '2px solid #26304b',
          boxShadow: '0 12px 32px rgba(0,0,0,0.3)'
        }}>
          <div className="relative z-10">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-4xl font-bold mb-2" style={{ color: '#f1f5ff' }}>
                  {getWelcomeMessage(therapist?.display_name)} {therapist?.display_name || ''}
                </h1>
                <p className="text-lg" style={{ color: '#a8b2d6' }}>
                  {new Date().toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <Link
                href="/app/therapist/onboarding"
                className="px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105"
                style={{
                  background: '#7aa2ff',
                  color: '#0b1022',
                  boxShadow: '0 4px 12px rgba(122, 162, 255, 0.25)'
                }}
              >
                ⚙️ Modifica Profilo
              </Link>
            </div>

            {/* Quick Stats - Dark theme */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="rounded-xl p-4 transition-all duration-200 hover:border-color" style={{
                background: '#0b0f1c',
                border: '1px solid #26304b'
              }}>
                <div className="text-sm mb-1" style={{ color: '#a8b2d6' }}>👥 Pazienti Totali</div>
                <div className="text-3xl font-bold" style={{ color: '#7aa2ff' }}>{loading ? '...' : totalPatients}</div>
              </div>
              <div className="rounded-xl p-4 transition-all duration-200" style={{
                background: '#0b0f1c',
                border: '1px solid #26304b'
              }}>
                <div className="text-sm mb-1" style={{ color: '#a8b2d6' }}>📅 Appuntamenti questa settimana</div>
                <div className="text-3xl font-bold" style={{ color: '#7aa2ff' }}>{loading ? '...' : weekAppts}</div>
              </div>
              <div className="rounded-xl p-4 transition-all duration-200" style={{
                background: '#0b0f1c',
                border: '1px solid #26304b'
              }}>
                <div className="text-sm mb-1" style={{ color: '#a8b2d6' }}>⏰ Prossimi appuntamenti</div>
                <div className="text-3xl font-bold" style={{ color: '#7aa2ff' }}>{loading ? '...' : nextAppts.length}</div>
              </div>
            </div>
          </div>

        </div>

        {err && (
          <div className="mb-6 p-4 rounded-lg animate-fadeIn" style={{
            background: '#141a2c',
            border: '2px solid #ef4444',
            color: '#f1f5ff'
          }}>
            ⚠️ {err}
          </div>
        )}

        {/* Main Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Nuovo Paziente - Dark theme */}
          <Link
            href="/app/therapist/pazienti/nuovo"
            className="block p-8 rounded-2xl text-center font-semibold text-xl transition-all duration-300 hover:scale-105 hover:-translate-y-1 animate-fadeIn"
            style={{
              background: '#141a2c',
              border: '2px solid #26304b',
              boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
              animationDelay: '100ms',
              color: '#f1f5ff'
            }}
          >
            <div className="text-5xl mb-4">👤</div>
            <div className="mb-2">Nuovo Paziente</div>
            <div className="text-sm" style={{ color: '#a8b2d6', opacity: 0.8 }}>Aggiungi un nuovo paziente</div>
          </Link>

          {/* Nuovo Appuntamento - Dark theme */}
          <button
            onClick={() => setShowCalendarPicker(true)}
            className="p-8 rounded-2xl text-center font-semibold text-xl transition-all duration-300 hover:scale-105 hover:-translate-y-1 w-full animate-fadeIn"
            style={{
              background: '#141a2c',
              border: '2px solid #26304b',
              boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
              animationDelay: '200ms',
              color: '#f1f5ff',
              cursor: 'pointer'
            }}
          >
            <div className="text-5xl mb-4">📅</div>
            <div className="mb-2">Nuovo Appuntamento</div>
            <div className="text-sm" style={{ color: '#a8b2d6', opacity: 0.8 }}>Pianifica una nuova seduta</div>
          </button>

          {/* Fatture - Dark theme */}
          <Link
            href="/app/therapist/fatture"
            className="block p-8 rounded-2xl text-center font-semibold text-xl transition-all duration-300 hover:scale-105 hover:-translate-y-1 animate-fadeIn"
            style={{
              background: '#141a2c',
              border: '2px solid #26304b',
              boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
              animationDelay: '300ms',
              color: '#f1f5ff'
            }}
          >
            <div className="text-5xl mb-4">💰</div>
            <div className="mb-2">Gestione Fatture</div>
            <div className="text-sm" style={{ color: '#a8b2d6', opacity: 0.8 }}>Gestisci le tue fatture</div>
          </Link>

          {/* Prossimi Appuntamenti - Dark theme */}
          <div
            className="p-8 rounded-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-1 animate-fadeIn"
            style={{
              background: '#141a2c',
              border: '2px solid #26304b',
              boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
              minHeight: '240px',
              animationDelay: '400ms',
              color: '#f1f5ff'
            }}
          >
            <h2 className="text-xl font-semibold mb-4" style={{ color: '#f1f5ff' }}>📋 Prossimi Appuntamenti</h2>
            <div className="space-y-3 max-h-40 overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="text-center py-4" style={{ color: '#a8b2d6' }}>Caricamento...</div>
              ) : nextAppts.length > 0 ? (
                nextAppts.slice(0, 3).map((a, idx) => (
                  <div key={a.id} className="rounded-lg p-3 transition-colors" style={{
                    background: '#0b0f1c',
                    border: '1px solid #26304b',
                    animation: `fadeIn 0.3s ease-out ${idx * 100}ms backwards`
                  }}>
                    <div className="font-medium text-sm" style={{ color: '#f1f5ff' }}>
                      {a.title}
                      {(() => { const n = getPatientName(a.patients || null); return n ? ` · ${n}` : ''; })()}
                    </div>
                    <div className="text-xs mt-1" style={{ color: '#a8b2d6' }}>
                      {new Date(a.starts_at).toLocaleDateString('it-IT')} alle {new Date(a.starts_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4" style={{ color: '#a8b2d6' }}>Nessun appuntamento in programma</div>
              )}
            </div>
            {nextAppts.length > 3 && (
              <Link href="/app/therapist/appuntamenti" className="text-sm block text-center mt-3 transition-colors" style={{ color: '#7aa2ff' }}>
                Vedi tutti ({nextAppts.length}) →
              </Link>
            )}
          </div>

          {/* I Tuoi Pazienti - Dark theme */}
          <Link
            href="/app/therapist/pazienti"
            className="block p-8 rounded-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-1 animate-fadeIn"
            style={{
              background: '#141a2c',
              border: '2px solid #26304b',
              boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
              minHeight: '240px',
              textDecoration: 'none',
              animationDelay: '500ms',
              color: '#f1f5ff'
            }}
          >
            <h2 className="text-xl font-semibold mb-4" style={{ color: '#f1f5ff' }}>👥 I Tuoi Pazienti</h2>
            <div className="space-y-2">
              {loading ? (
                <div className="text-center py-4" style={{ color: '#a8b2d6' }}>Caricamento...</div>
              ) : allPatients.length > 0 ? (
                allPatients.slice(0, 4).map((p, idx) => (
                  <div key={p.id} className="rounded-lg p-2 transition-colors" style={{
                    background: '#0b0f1c',
                    border: '1px solid #26304b',
                    animation: `fadeIn 0.3s ease-out ${idx * 100}ms backwards`
                  }}>
                    <div className="font-medium text-sm" style={{ color: '#f1f5ff' }}>{p.display_name || 'Senza nome'}</div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4" style={{ color: '#a8b2d6' }}>Nessun paziente registrato</div>
              )}
            </div>
            {allPatients.length > 4 && (
              <div className="text-sm text-center mt-3" style={{ color: '#7aa2ff' }}>
                Vedi tutti ({allPatients.length}) →
              </div>
            )}
          </Link>

          {/* Alert e Notifiche - Dark theme */}
          <div
            className="p-8 rounded-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-1 animate-fadeIn"
            style={{
              background: '#141a2c',
              border: '2px solid #26304b',
              boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
              minHeight: '240px',
              animationDelay: '600ms',
              color: '#f1f5ff'
            }}
          >
            <h2 className="text-xl font-semibold mb-4" style={{ color: '#f1f5ff' }}>🔔 Alert e Notifiche</h2>
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-4" style={{ color: '#a8b2d6' }}>Caricamento...</div>
              ) : (
                <AlertsWidgetWrapper />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CalendarPicker
        isOpen={showCalendarPicker}
        onClose={() => setShowCalendarPicker(false)}
        onSelectDateTime={handleDateTimeSelected}
      />

      <QuickAppointmentModal
        isOpen={showQuickModal}
        onClose={() => setShowQuickModal(false)}
        prefilledDateTime={selectedDateTime}
        onSuccess={reloadAppointments}
      />

      {/* Inline Styles for Animations and Hover Effects */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out backwards;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: #0b0f1c;
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #26304b;
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #7aa2ff;
        }

        /* Hover effects per le card principali */
        a[href="/app/therapist/pazienti/nuovo"]:hover,
        button:hover,
        a[href="/app/therapist/fatture"]:hover {
          border-color: #7aa2ff !important;
          box-shadow: 0 16px 40px rgba(122, 162, 255, 0.2) !important;
        }

        /* Hover effects per le card informative */
        a[href="/app/therapist/pazienti"]:hover,
        div[style*="minHeight: 240px"]:hover {
          border-color: #7aa2ff !important;
          box-shadow: 0 16px 40px rgba(122, 162, 255, 0.2) !important;
        }
      `}</style>
    </div>
  );
}
