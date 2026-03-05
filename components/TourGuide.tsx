'use client';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

const TOUR_KEY = 'ciaodoc_tour_done';

const TOUR_STEPS = [
  {
    element: 'body',
    popover: {
      title: '👋 Benvenuto in cIAo-doc!',
      description:
        'Questo è un <strong>prototipo dimostrativo</strong>. Ti guidiamo in un tour rapido delle funzionalità principali. Premi <strong>→ Avanti</strong> per iniziare, oppure <strong>✕</strong> per saltare.',
      side: 'over' as const,
      align: 'center' as const,
    },
  },
  {
    element: '[data-tour="nav"]',
    popover: {
      title: '🧭 Navigazione principale',
      description:
        'Da qui accedi alle sezioni principali: <strong>Pazienti</strong>, <strong>Appuntamenti</strong> e <strong>Personal Branding</strong>. Tutto il resto è accessibile dalla dashboard qui sotto.',
      side: 'bottom' as const,
      align: 'start' as const,
    },
  },
  {
    element: '[data-tour="dashboard"]',
    popover: {
      title: '📊 La tua Dashboard',
      description:
        'La tua panoramica quotidiana: statistiche sui pazienti, appuntamenti imminenti e accesso rapido alle azioni più comuni. Tutto a colpo d\'occhio.',
      side: 'bottom' as const,
      align: 'start' as const,
    },
  },
  {
    element: '[data-tour="pazienti-widget"]',
    popover: {
      title: '👥 I Tuoi Pazienti',
      description:
        'Qui vedi i tuoi pazienti recenti. Cliccando su ognuno accedi alla <strong>scheda completa</strong>: storico sedute, questionari somministrati, piano terapeutico, obiettivi e note.',
      side: 'top' as const,
      align: 'start' as const,
    },
  },
  {
    element: '[data-tour="pazienti"]',
    popover: {
      title: '🗂️ Sezione Pazienti',
      description:
        'Dalla scheda paziente puoi: avviare una <strong>seduta con registrazione audio</strong>, somministrare <strong>questionari clinici validati</strong> (GAD-7, PTSD, ADHD, e altri), definire obiettivi ed esercizi.',
      side: 'bottom' as const,
      align: 'start' as const,
    },
  },
  {
    element: '[data-tour="appuntamenti"]',
    popover: {
      title: '📅 Agenda e Appuntamenti',
      description:
        'Gestisci la tua agenda. Il sistema può inviare <strong>promemoria automatici via email</strong> ai pazienti prima degli appuntamenti, riducendo i no-show.',
      side: 'bottom' as const,
      align: 'start' as const,
    },
  },
  {
    element: '[data-tour="fatture"]',
    popover: {
      title: '💶 Fatturazione',
      description:
        'Genera e invia fatture ai pazienti direttamente dalla piattaforma. Tieni traccia dei pagamenti senza fogli Excel o strumenti esterni.',
      side: 'top' as const,
      align: 'start' as const,
    },
  },
  {
    element: '[data-tour="branding"]',
    popover: {
      title: '🎨 Personal Branding',
      description:
        'Strumenti AI per costruire la tua presenza online: <strong>post social</strong>, <strong>articoli di blog</strong>, <strong>logo</strong> e template per il sito. Creati su misura per professionisti della salute mentale.',
      side: 'bottom' as const,
      align: 'end' as const,
    },
  },
  {
    element: '[data-tour="assistant"]',
    popover: {
      title: '🤖 Assistente AI',
      description:
        'Il chatbot in basso a destra è il tuo assistente sempre disponibile. Puoi chiedergli informazioni sui pazienti, suggerimenti clinici o qualsiasi domanda sulla piattaforma.',
      side: 'top' as const,
      align: 'end' as const,
    },
  },
  {
    element: 'body',
    popover: {
      title: '🚀 Buona esplorazione!',
      description:
        'Tour completato! Ricorda: questo è un <strong>prototipo</strong>, alcune funzionalità sono simulate. Puoi rilanciare il tour in qualsiasi momento con il pulsante <strong>?</strong> in basso a destra.',
      side: 'over' as const,
      align: 'center' as const,
    },
  },
];

interface TourGuideProps {
  autoStart?: boolean; // se true, parte automaticamente al primo accesso
}

export default function TourGuide({ autoStart = true }: TourGuideProps) {
  const driverRef = useRef<any>(null);
  const [showButton, setShowButton] = useState(false);
  const pathname = usePathname();

  // Nascondi il tour generale nelle pagine scheda-paziente (hanno il proprio tour)
  const isPatientDetailPage = /\/app\/therapist\/pazienti\/[^/]+$/.test(pathname || '');

  useEffect(() => {
    // Mostra sempre il bottone "Ripeti tour"
    setShowButton(true);

    if (autoStart && localStorage.getItem(TOUR_KEY) !== '1') {
      // Piccolo delay per aspettare che il DOM sia pronto
      const timer = setTimeout(() => startTour(), 800);
      return () => clearTimeout(timer);
    }
  }, [autoStart]);

  async function startTour() {
    // Import dinamico per evitare SSR issues
    const { driver } = await import('driver.js');

    const validSteps = TOUR_STEPS.filter(step => {
      if (step.element === 'body') return true;
      return document.querySelector(step.element) !== null;
    });

    driverRef.current = driver({
      showProgress: true,
      steps: validSteps,
      nextBtnText: 'Avanti →',
      prevBtnText: '← Indietro',
      doneBtnText: 'Fine ✓',
      progressText: 'Step {{current}} di {{total}}',
      onDestroyStarted: () => {
        localStorage.setItem(TOUR_KEY, '1');
        driverRef.current?.destroy();
      },
    });

    driverRef.current.drive();
  }

  if (!showButton || isPatientDetailPage) return null;

  return (
    <button
      onClick={startTour}
      title="Ripeti il tour guidato"
      style={{
        position: 'fixed',
        bottom: '88px',      // sopra il chatbot assistant
        right: '20px',
        zIndex: 999,
        background: '#141a2c',
        border: '2px solid #7aa2ff',
        borderRadius: '50%',
        width: '44px',
        height: '44px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 4px 16px rgba(122,162,255,0.25)',
        transition: 'all .2s ease',
        color: '#7aa2ff',
        fontSize: '18px',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.background = '#7aa2ff';
        (e.currentTarget as HTMLButtonElement).style.color = '#0b1022';
        (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.1)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.background = '#141a2c';
        (e.currentTarget as HTMLButtonElement).style.color = '#7aa2ff';
        (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
      }}
    >
      ?
    </button>
  );
}
