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
      {/* HEADER - Dark theme like login */}
      <header style={{
        background: '#141a2c',
        borderBottom: '2px solid #26304b',
        padding: '16px 24px'
      }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo cIAo-doc */}
          <div className="flex items-center">
            <img 
              src="/logo-transparent-png.png" 
              alt="cIAo-doc" 
              style={{ height: '60px', width: 'auto' }}
            />
          </div>
          
          {/* Menu Orizzontale - Dark theme */}
          <nav className="flex items-center gap-4">
            <Link
              href="/app/therapist/pazienti"
              className="px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105"
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
              className="px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105"
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
              className="px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105"
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
              className="px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105"
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
    </div>
  );
}
