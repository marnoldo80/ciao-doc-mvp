'use client';

type Suggestions = {
  obiettivi_generali: string[];
  obiettivi_specifici: string[];
  esercizi: string[];
  note: string;
};

type Assessment = {
  anamnesi: string;
  valutazione_psicodiagnostica: string;
  formulazione_caso: string;
};

type AISuggestionsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  suggestions: Suggestions | null;
  assessment?: Assessment | null;
  onApply: (suggestions: Suggestions) => void;
  isLoading: boolean;
  mode?: 'obiettivi' | 'valutazione';
};

export default function AISuggestionsModal({
  isOpen,
  onClose,
  suggestions,
  assessment,
  onApply,
  isLoading,
  mode = 'obiettivi',
}: AISuggestionsModalProps) {
  if (!isOpen) return null;

  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 50, padding: '16px',
  };
  const modal: React.CSSProperties = {
    background: '#141a2c', border: '1px solid #26304b', borderRadius: '16px',
    maxWidth: '800px', width: '100%', maxHeight: '90vh', overflowY: 'auto',
    display: 'flex', flexDirection: 'column',
  };
  const header: React.CSSProperties = {
    position: 'sticky', top: 0, background: 'linear-gradient(135deg, #9333ea, #7aa2ff)',
    padding: '20px 24px', borderRadius: '16px 16px 0 0',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  };
  const sectionCard: React.CSSProperties = {
    background: '#0b0f1c', border: '1px solid #26304b', borderRadius: '12px', padding: '16px',
  };
  const itemRow: React.CSSProperties = {
    display: 'flex', alignItems: 'flex-start', gap: '10px',
    padding: '10px 12px', background: '#141a2c', border: '1px solid #26304b',
    borderRadius: '8px',
  };

  return (
    <div style={overlay}>
      <div style={modal}>
        {/* Header */}
        <div style={header}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            ✨ {mode === 'valutazione' ? 'Valutazione Clinica IA' : 'Suggerimenti IA per Piano Terapeutico'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>

        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Loading */}
          {isLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 0', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', border: '3px solid #26304b', borderTopColor: '#9333ea', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <p style={{ color: '#a8b2d6', fontWeight: 500 }}>Analisi del caso in corso...</p>
              <p style={{ color: '#66708a', fontSize: '13px' }}>L'IA sta elaborando i dati clinici</p>
            </div>
          )}

          {/* MODE: VALUTAZIONE */}
          {!isLoading && mode === 'valutazione' && assessment && (
            <>
              {/* Anamnesi */}
              <div style={sectionCard}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#7aa2ff', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>📋 Anamnesi</h3>
                <p style={{ color: '#f1f5ff', fontSize: '14px', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{assessment.anamnesi}</p>
              </div>

              {/* Valutazione Psicodiagnostica */}
              <div style={sectionCard}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#9333ea', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🔍 Valutazione Psicodiagnostica</h3>
                <p style={{ color: '#f1f5ff', fontSize: '14px', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{assessment.valutazione_psicodiagnostica}</p>
              </div>

              {/* Formulazione del Caso */}
              <div style={sectionCard}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#22c55e', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🧩 Formulazione del Caso</h3>
                <p style={{ color: '#f1f5ff', fontSize: '14px', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{assessment.formulazione_caso}</p>
              </div>

              {/* Avviso */}
              <div style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)', borderRadius: '10px', padding: '12px 16px' }}>
                <p style={{ color: '#eab308', fontSize: '13px', margin: 0 }}>
                  ⚠️ <strong>Importante:</strong> Questi sono suggerimenti basati sull'IA. Rivedi sempre le proposte e adattale al tuo giudizio clinico professionale.
                </p>
              </div>

              {/* Azioni */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid #26304b' }}>
                <button onClick={onClose} style={{ padding: '10px 20px', background: '#0b0f1c', color: '#a8b2d6', border: '1px solid #26304b', borderRadius: '8px', fontWeight: 500, cursor: 'pointer', fontSize: '14px' }}>
                  Annulla
                </button>
                <button
                  onClick={() => {
                    if (assessment && suggestions) onApply(suggestions);
                    else if (assessment) {
                      // Applica solo valutazione via custom event
                      const evt = new CustomEvent('applyAssessment', { detail: assessment });
                      window.dispatchEvent(evt);
                    }
                    onClose();
                  }}
                  style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #9333ea, #7aa2ff)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}
                >
                  ✓ Applica Valutazione
                </button>
              </div>
            </>
          )}

          {/* MODE: OBIETTIVI */}
          {!isLoading && mode === 'obiettivi' && suggestions && (
            <>
              {/* Razionale Clinico */}
              <div style={{ ...sectionCard, borderLeft: '3px solid #7aa2ff' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#7aa2ff', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>💡 Razionale Clinico</h3>
                <p style={{ color: '#a8b2d6', fontSize: '14px', lineHeight: 1.6 }}>{suggestions.note}</p>
              </div>

              {/* Obiettivi Generali */}
              <div style={sectionCard}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#9333ea', marginBottom: '12px' }}>🎯 Obiettivi Generali</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {suggestions.obiettivi_generali.map((obj, i) => (
                    <div key={i} style={itemRow}>
                      <span style={{ color: '#9333ea', fontWeight: 700, minWidth: '20px' }}>{i + 1}.</span>
                      <span style={{ color: '#f1f5ff', fontSize: '14px' }}>{obj}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Obiettivi Specifici */}
              <div style={sectionCard}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#7aa2ff', marginBottom: '12px' }}>🎯 Obiettivi Specifici</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {suggestions.obiettivi_specifici.map((obj, i) => (
                    <div key={i} style={itemRow}>
                      <span style={{ color: '#7aa2ff', fontWeight: 700, minWidth: '20px' }}>{i + 1}.</span>
                      <span style={{ color: '#f1f5ff', fontSize: '14px' }}>{obj}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Esercizi */}
              <div style={sectionCard}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#22c55e', marginBottom: '12px' }}>💪 Esercizi Consigliati</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {suggestions.esercizi.map((ex, i) => (
                    <div key={i} style={itemRow}>
                      <span style={{ color: '#22c55e', fontWeight: 700, minWidth: '20px' }}>{i + 1}.</span>
                      <span style={{ color: '#f1f5ff', fontSize: '14px' }}>{ex}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Avviso */}
              <div style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)', borderRadius: '10px', padding: '12px 16px' }}>
                <p style={{ color: '#eab308', fontSize: '13px', margin: 0 }}>
                  ⚠️ <strong>Importante:</strong> Questi sono suggerimenti basati sull'IA. Rivedi sempre le proposte e adattale al tuo giudizio clinico professionale.
                </p>
              </div>

              {/* Azioni */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid #26304b' }}>
                <button onClick={onClose} style={{ padding: '10px 20px', background: '#0b0f1c', color: '#a8b2d6', border: '1px solid #26304b', borderRadius: '8px', fontWeight: 500, cursor: 'pointer', fontSize: '14px' }}>
                  Annulla
                </button>
                <button onClick={() => onApply(suggestions)} style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #9333ea, #7aa2ff)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}>
                  ✓ Applica Suggerimenti
                </button>
              </div>
            </>
          )}

          {/* Errore */}
          {!isLoading && !suggestions && !assessment && (
            <div style={{ textAlign: 'center', padding: '32px', color: '#a8b2d6' }}>
              Errore nel caricamento dei suggerimenti. Riprova.
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
