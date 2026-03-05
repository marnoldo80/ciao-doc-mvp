'use client';
import { useEffect, useRef } from 'react';

const PATIENT_TOUR_KEY = 'ciaodoc_patient_tour_done';

const PATIENT_TOUR_STEPS = [
  {
    element: 'body',
    popover: {
      title: '📋 Scheda Paziente',
      description:
        'Benvenuto nella scheda paziente. Qui trovi tutto quello che riguarda questo paziente, organizzato in tab. Ti guidiamo rapidamente attraverso ogni sezione.',
      side: 'over' as const,
      align: 'center' as const,
    },
  },
  {
    element: '[data-patient-tour="tabs"]',
    popover: {
      title: '🗂️ Le sezioni della scheda',
      description:
        'La scheda è divisa in <strong>6 tab</strong>: Profilo, Valutazione, Obiettivi, Comunicazioni, Sedute e Questionari. Clicca su ciascuna per navigare.',
      side: 'bottom' as const,
      align: 'start' as const,
    },
  },
  {
    element: '[data-patient-tour="tab-profilo"]',
    popover: {
      title: '👤 Profilo',
      description:
        'Anagrafica completa del paziente: dati anagrafici, contatti, codice fiscale, medico MMG e gestione delle <strong>tariffe per seduta</strong>. Da qui puoi anche generare il <strong>modulo di consenso informato</strong> in PDF.',
      side: 'bottom' as const,
      align: 'start' as const,
    },
  },
  {
    element: '[data-patient-tour="tab-valutazione"]',
    popover: {
      title: '🎯 Valutazione',
      description:
        'Area clinica per <strong>anamnesi</strong>, <strong>valutazione psicodiagnostica</strong> e <strong>formulazione del caso</strong>. Supportata dall\'AI per suggerire contenuti a partire dalle note delle sedute.',
      side: 'bottom' as const,
      align: 'start' as const,
    },
  },
  {
    element: '[data-patient-tour="tab-obiettivi"]',
    popover: {
      title: '💪 Obiettivi ed Esercizi',
      description:
        'Definisci <strong>obiettivi generali e specifici</strong> del percorso terapeutico ed <strong>esercizi da assegnare</strong> al paziente. L\'AI può suggerire un piano di intervento. Gli obiettivi possono essere inviati direttamente al paziente.',
      side: 'bottom' as const,
      align: 'start' as const,
    },
  },
  {
    element: '[data-patient-tour="tab-comunicazioni"]',
    popover: {
      title: '📨 Comunicazioni Paziente',
      description:
        'Sezione dedicata alla <strong>comunicazione tra sedute</strong>: messaggi, promemoria, pensieri del paziente e notifiche da inviare via chat automatica. I messaggi non letti appaiono con un badge rosso.',
      side: 'bottom' as const,
      align: 'start' as const,
    },
  },
  {
    element: '[data-patient-tour="tab-sedute"]',
    popover: {
      title: '🎙️ Sedute',
      description:
        'Storico di tutte le sedute. Per ogni appuntamento passato puoi <strong>aprire la registrazione audio</strong>, leggere il <strong>riassunto generato dall\'AI</strong> con temi, punti chiave e osservazioni. Puoi anche aggiungere note manuali.',
      side: 'bottom' as const,
      align: 'start' as const,
    },
  },
  {
    element: '[data-patient-tour="tab-questionari"]',
    popover: {
      title: '📋 Questionari',
      description:
        'Somministra questionari clinici validati: <strong>GAD-7</strong> (ansia), <strong>PHQ-9</strong> (depressione), <strong>PTSD Checklist</strong>, <strong>ADHD</strong> e molti altri. I risultati vengono salvati e mostrati nel tempo per monitorare i progressi.',
      side: 'bottom' as const,
      align: 'start' as const,
    },
  },
  {
    element: 'body',
    popover: {
      title: '✅ Tutto qui!',
      description:
        'Ora conosci la scheda paziente. Usa il pulsante <strong>?</strong> in basso a destra per rivedere questo tour in qualsiasi momento. Buon lavoro!',
      side: 'over' as const,
      align: 'center' as const,
    },
  },
];

export default function PatientTourGuide() {
  const driverRef = useRef<any>(null);

  useEffect(() => {
    if (localStorage.getItem(PATIENT_TOUR_KEY) !== '1') {
      const timer = setTimeout(() => startTour(), 900);
      return () => clearTimeout(timer);
    }
  }, []);

  async function startTour() {
    const { driver } = await import('driver.js');

    const validSteps = PATIENT_TOUR_STEPS.filter(step => {
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
        localStorage.setItem(PATIENT_TOUR_KEY, '1');
        driverRef.current?.destroy();
      },
    });

    driverRef.current.drive();
  }

  return (
    <button
      onClick={startTour}
      title="Ripeti il tour della scheda paziente"
      style={{
        position: 'fixed',
        bottom: '88px',
        right: '72px',       // affiancato al "?" principale
        zIndex: 999,
        background: '#141a2c',
        border: '2px solid #9d4edd',
        borderRadius: '50%',
        width: '44px',
        height: '44px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 4px 16px rgba(157,78,221,0.25)',
        transition: 'all .2s ease',
        color: '#c77dff',
        fontSize: '18px',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.background = '#9d4edd';
        (e.currentTarget as HTMLButtonElement).style.color = '#fff';
        (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.1)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.background = '#141a2c';
        (e.currentTarget as HTMLButtonElement).style.color = '#c77dff';
        (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
      }}
    >
      ?
    </button>
  );
}
