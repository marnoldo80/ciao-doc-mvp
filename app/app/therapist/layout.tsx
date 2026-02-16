'use client';
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import TherapistAssistant from "@/components/TherapistAssistant";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Therapist = {
  full_name: string;
  display_name: string;
};

export default function TherapistLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [therapist, setTherapist] = useState<Therapist | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    loadTherapistData();
  }, []);

  async function loadTherapistData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: therapistData } = await supabase
        .from('therapists')
        .select('full_name, display_name')
        .eq('user_id', user.id)
        .single();

      if (therapistData) {
        setTherapist(therapistData);
      }
    } catch (error) {
      console.error('Errore caricamento dati terapeuta:', error);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #10162a 0%, #0b0f1c 100%)',
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif'
    }}>
      {/* HEADER - Dark theme responsive */}
      <header style={{
        background: '#141a2c',
        borderBottom: '2px solid #26304b',
        padding: '16px 24px',
        position: 'relative'
      }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            {/* Logo cIAo-doc */}
            <Link href="/app/therapist" className="flex items-center">
              <img
                src="/logo-transparent-png.png"
                alt="cIAo-doc"
                style={{ height: '50px', width: 'auto' }}
              />
            </Link>

            {/* Desktop Menu */}
            <nav className="hidden md:flex items-center gap-3">
              <Link
                href="/app/therapist/pazienti"
                className="px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 text-sm"
                style={{
                  background: '#7aa2ff',
                  color: '#0b1022',
                  boxShadow: '0 4px 12px rgba(122, 162, 255, 0.25)'
                }}
              >
                Pazienti
              </Link>
              <Link
                href="/app/therapist/appuntamenti"
                className="px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 text-sm"
                style={{
                  background: '#7aa2ff',
                  color: '#0b1022',
                  boxShadow: '0 4px 12px rgba(122, 162, 255, 0.25)'
                }}
              >
                Appuntamenti
              </Link>
              <Link
                href="/app/therapist/personal-branding"
                className="px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 text-sm"
                style={{
                  background: '#7aa2ff',
                  color: '#0b1022',
                  boxShadow: '0 4px 12px rgba(122, 162, 255, 0.25)'
                }}
              >
                Personal Branding
              </Link>
              <button
                onClick={logout}
                className="px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 text-sm"
                style={{
                  background: '#7aa2ff',
                  color: '#0b1022',
                  boxShadow: '0 4px 12px rgba(122, 162, 255, 0.25)',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Logout
              </button>
            </nav>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg"
              style={{
                background: mobileMenuOpen ? '#7aa2ff' : 'transparent',
                color: mobileMenuOpen ? '#0b1022' : '#7aa2ff',
                border: '2px solid #7aa2ff'
              }}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <nav className="md:hidden mt-4 pb-4 flex flex-col gap-2 animate-fadeIn">
              <Link
                href="/app/therapist/pazienti"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 rounded-lg font-medium transition-all duration-200 text-center"
                style={{
                  background: '#7aa2ff',
                  color: '#0b1022',
                  boxShadow: '0 4px 12px rgba(122, 162, 255, 0.25)'
                }}
              >
                Pazienti
              </Link>
              <Link
                href="/app/therapist/appuntamenti"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 rounded-lg font-medium transition-all duration-200 text-center"
                style={{
                  background: '#7aa2ff',
                  color: '#0b1022',
                  boxShadow: '0 4px 12px rgba(122, 162, 255, 0.25)'
                }}
              >
                Appuntamenti
              </Link>
              <Link
                href="/app/therapist/personal-branding"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 rounded-lg font-medium transition-all duration-200 text-center"
                style={{
                  background: '#7aa2ff',
                  color: '#0b1022',
                  boxShadow: '0 4px 12px rgba(122, 162, 255, 0.25)'
                }}
              >
                Personal Branding
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="px-4 py-3 rounded-lg font-medium transition-all duration-200"
                style={{
                  background: '#7aa2ff',
                  color: '#0b1022',
                  boxShadow: '0 4px 12px rgba(122, 162, 255, 0.25)',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Logout
              </button>
            </nav>
          )}
        </div>
      </header>

      {/* Main Content - SENZA padding wrapper, ogni pagina gestisce il suo layout */}
      <main>
        {children}
      </main>

      {/* Chatbot Assistente */}
      <TherapistAssistant
        therapistName={therapist?.full_name || therapist?.display_name}
      />

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
