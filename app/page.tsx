'use client';
import { useState, useEffect } from 'react';

const FORM_URL = 'https://docs.google.com/forms/d/11GYH-A0r8B53Vi6uN5DNGQuX9ooLCuGEw4oEbWORdPk/viewform';
const STORAGE_OPENED  = 'ciaodoc_form_opened';   // ha cliccato il link
const STORAGE_DONE    = 'ciaodoc_form_visited';   // ha confermato la compilazione

export default function HomePage() {
  const [formOpened,   setFormOpened]   = useState(false);
  const [formDone,     setFormDone]     = useState(false);

  useEffect(() => {
    setFormOpened(localStorage.getItem(STORAGE_OPENED) === '1');
    setFormDone(  localStorage.getItem(STORAGE_DONE)   === '1');
  }, []);

  function handleFormClick() {
    localStorage.setItem(STORAGE_OPENED, '1');
    setFormOpened(true);
    window.open(FORM_URL, '_blank', 'noopener');
  }

  function handleFormDone() {
    localStorage.setItem(STORAGE_DONE, '1');
    setFormDone(true);
  }

  // stato aggregato per lo stepper
  const step2Done = formDone;
  const step2Active = formOpened && !formDone;
  const step2Idle = !formOpened && !formDone;

  return (
    <html lang="it">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>cIAo-doc — AI per Terapeuti</title>
        <style dangerouslySetInnerHTML={{ __html: `
          :root{
            --bg:#0b0f1c; --panel:#141a2c; --ink:#f1f5ff; --muted:#a8b2d6;
            --ring:#26304b; --accent:#7aa2ff; --accent-weak:#1c2440;
            --purple-start:#9d4edd; --purple-end:#c77dff;
          }
          *{box-sizing:border-box; margin:0; padding:0}
          body{
            background:var(--bg); color:var(--ink);
            font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
            line-height:1.55;
          }
          .wrap{max-width:1100px; margin:0 auto; padding:0 24px}

          /* ===== HERO ===== */
          .hero{
            position:relative; overflow:hidden;
            background:linear-gradient(135deg,#0d1228 0%,#131830 50%,#0b0f1c 100%);
            padding:64px 0 56px;
            border-bottom:1px solid var(--accent-weak);
          }
          .hero::before{
            content:''; position:absolute; inset:0;
            background:
              radial-gradient(ellipse 700px 400px at 70% 50%, rgba(122,162,255,.07) 0%, transparent 70%),
              radial-gradient(ellipse 500px 300px at 20% 60%, rgba(157,78,221,.08) 0%, transparent 70%);
            pointer-events:none;
          }
          .hero-inner{
            position:relative; display:flex; align-items:center;
            gap:48px; flex-wrap:wrap;
          }
          .hero-logo{height:130px; width:auto; flex-shrink:0; filter:drop-shadow(0 0 24px rgba(122,162,255,.25))}
          .hero-text{flex:1; min-width:260px}
          .hero-tag{
            display:inline-block; background:rgba(122,162,255,.12);
            color:var(--accent); font-size:12px; font-weight:700;
            padding:4px 14px; border-radius:20px; letter-spacing:.8px;
            text-transform:uppercase; margin-bottom:16px;
            border:1px solid rgba(122,162,255,.2);
          }
          .hero-title{
            font-size:clamp(28px,4vw,44px); font-weight:800; line-height:1.15;
            color:var(--ink); margin-bottom:16px;
          }
          .hero-title span{
            background:linear-gradient(90deg,var(--accent) 0%,var(--purple-end) 100%);
            -webkit-background-clip:text; -webkit-text-fill-color:transparent;
            background-clip:text;
          }
          .hero-sub{
            font-size:17px; color:var(--muted); line-height:1.65; margin-bottom:28px; max-width:520px;
          }
          .hero-pills{display:flex; flex-wrap:wrap; gap:10px}
          .pill{
            display:inline-flex; align-items:center; gap:7px;
            background:var(--panel); border:1px solid var(--ring);
            border-radius:30px; padding:7px 16px;
            font-size:13px; color:var(--muted); font-weight:500;
          }
          .pill-dot{
            width:8px; height:8px; border-radius:50%;
            background:linear-gradient(135deg,var(--purple-start),var(--purple-end));
            flex-shrink:0;
          }

          /* ===== FEATURES ===== */
          .section{padding:48px 0 16px}
          .section-label{
            font-size:11px; font-weight:700; letter-spacing:1.2px; text-transform:uppercase;
            color:var(--accent); margin-bottom:12px;
          }
          h2.sec{font-size:26px; margin-bottom:10px; color:var(--ink); font-weight:700; line-height:1.25}
          p.lead{color:var(--muted); font-size:16px; margin-bottom:28px; max-width:600px; line-height:1.65}
          .features-grid{display:grid; gap:16px; grid-template-columns:repeat(2,1fr)}
          @media(max-width:640px){.features-grid{grid-template-columns:1fr}}
          .feature-card{
            background:var(--panel); border:1px solid var(--ring);
            border-radius:14px; padding:22px;
            transition:border-color .2s, transform .2s;
          }
          .feature-card:hover{border-color:rgba(157,78,221,.45); transform:translateY(-2px)}
          .feature-icon{
            width:40px; height:40px; border-radius:10px; display:flex;
            align-items:center; justify-content:center; font-size:20px;
            background:linear-gradient(135deg,var(--purple-start),var(--purple-end));
            margin-bottom:14px;
          }
          .feature-card h3{font-size:15px; font-weight:700; margin-bottom:6px; color:var(--ink)}
          .feature-card p{font-size:13px; color:var(--muted); line-height:1.55}

          /* ===== STEPPER ===== */
          .stepper-section{padding:48px 0 56px}
          .stepper-header{text-align:center; margin-bottom:48px}
          .stepper-header h2{font-size:24px; font-weight:700; margin-bottom:10px; color:var(--ink)}
          .stepper-header p{font-size:15px; color:var(--muted); max-width:500px; margin:0 auto}

          .stepper{display:flex; align-items:flex-start; position:relative; margin-bottom:40px}
          .stepper::before{
            content:''; position:absolute; top:27px;
            left:calc(16.66%); width:calc(66.66%); height:2px;
            background:var(--ring); z-index:0;
          }
          .step{flex:1; display:flex; flex-direction:column; align-items:center; position:relative; z-index:1; padding:0 8px}
          .step-num{
            width:54px; height:54px; border-radius:50%; display:flex; align-items:center;
            justify-content:center; font-size:20px; font-weight:700; margin-bottom:14px;
            background:var(--panel); border:2px solid var(--ring); color:var(--muted);
            transition:all .3s ease;
          }
          .step-num.active{
            background:linear-gradient(135deg,var(--purple-start),var(--purple-end));
            border-color:var(--purple-end); color:#fff;
            box-shadow:0 0 22px rgba(157,78,221,.4);
          }
          .step-num.done{background:var(--accent); border-color:var(--accent); color:#0b1022}
          .step-label{font-size:12px; font-weight:700; color:var(--muted); text-align:center; margin-bottom:4px; letter-spacing:.3px}
          .step-label.active{color:var(--ink)}
          .step-desc{font-size:11px; color:var(--muted); text-align:center; max-width:130px; line-height:1.4}

          /* ===== CTA CARDS ===== */
          .cta-grid{display:grid; gap:20px; grid-template-columns:repeat(3,1fr)}
          @media(max-width:820px){.cta-grid{grid-template-columns:1fr}}
          .cta-card{
            background:var(--panel); border:1.5px solid var(--ring);
            border-radius:18px; padding:28px 24px; display:flex;
            flex-direction:column; gap:0;
          }
          .cta-card.highlight{border-color:rgba(157,78,221,.5); box-shadow:0 0 28px rgba(157,78,221,.08)}
          .cta-card.dim{opacity:.6}
          .cta-badge{
            display:inline-block; font-size:10px; font-weight:700; letter-spacing:.8px;
            text-transform:uppercase; padding:3px 11px; border-radius:20px; margin-bottom:14px;
          }
          .cta-badge.blue{background:rgba(122,162,255,.12); color:var(--accent)}
          .cta-badge.purple{background:rgba(157,78,221,.15); color:var(--purple-end)}
          .cta-card h3{font-size:17px; font-weight:700; color:var(--ink); margin-bottom:8px}
          .cta-card p{font-size:13px; color:var(--muted); line-height:1.6; margin-bottom:20px; flex:1}

          /* ===== BUTTONS ===== */
          .btn{
            display:inline-block; padding:12px 22px; border-radius:12px;
            font-weight:700; font-size:14px; text-decoration:none;
            cursor:pointer; border:none; transition:all .2s ease; text-align:center;
          }
          .btn-full{display:block; width:100%}
          .btn-blue{
            background:var(--accent); color:#0b1022;
            box-shadow:0 6px 18px rgba(122,162,255,.25);
          }
          .btn-blue:hover{transform:translateY(-2px); box-shadow:0 10px 24px rgba(122,162,255,.4)}
          .btn-purple{
            background:linear-gradient(135deg,var(--purple-start),var(--purple-end));
            color:#fff; box-shadow:0 6px 18px rgba(157,78,221,.25);
          }
          .btn-purple:hover{transform:translateY(-2px); box-shadow:0 10px 24px rgba(157,78,221,.4)}
          .btn-ghost{
            background:rgba(122,162,255,.08); color:var(--accent);
            border:1.5px solid rgba(122,162,255,.3);
          }
          .btn-ghost:hover{background:rgba(122,162,255,.15)}
          .btn-dim{
            background:var(--accent-weak); color:var(--muted);
            border:1.5px solid var(--ring); cursor:default;
          }
          .badge-done{
            display:inline-flex; align-items:center; gap:8px;
            background:rgba(122,162,255,.1); color:var(--accent);
            border:1px solid rgba(122,162,255,.25);
            padding:10px 18px; border-radius:12px; font-size:13px; font-weight:600;
          }
          .hint{font-size:12px; color:var(--muted); margin-top:10px; line-height:1.4}

          /* ===== NOTICE BOX (step 2 confirm) ===== */
          .notice{
            background:rgba(157,78,221,.08); border:1px solid rgba(157,78,221,.25);
            border-radius:10px; padding:12px 16px; font-size:13px;
            color:var(--muted); line-height:1.5; margin-bottom:16px;
          }
          .notice strong{color:var(--purple-end)}

          footer{padding:28px 0; color:var(--muted); font-size:12px; text-align:center; border-top:1px solid var(--accent-weak)}
        `}} />
      </head>
      <body>

        {/* ===== HERO ===== */}
        <section className="hero">
          <div className="wrap">
            <div className="hero-inner">
              <img src="/logo-transparent-png.png" alt="cIAo-doc" className="hero-logo" />
              <div className="hero-text">
                <span className="hero-tag">Prototipo · Feedback aperto</span>
                <h1 className="hero-title">
                  L'AI che lavora<br/>
                  <span>con il terapeuta</span>
                </h1>
                <p className="hero-sub">
                  cIAo-doc affianca il professionista nella gestione della pratica clinica: pazienti, sedute, piani terapeutici e fatturazione — tutto in un unico strumento intelligente.
                </p>
                <div className="hero-pills">
                  <span className="pill"><span className="pill-dot"></span>Registrazione sedute</span>
                  <span className="pill"><span className="pill-dot"></span>Riassunti AI</span>
                  <span className="pill"><span className="pill-dot"></span>Questionari validati</span>
                  <span className="pill"><span className="pill-dot"></span>Agenda automatica</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <main className="wrap">

          {/* ===== FEATURES ===== */}
          <section className="section">
            <div className="section-label">Funzionalità</div>
            <h2 className="sec">Cosa fa cIAo-doc?</h2>
            <p className="lead">
              Un supporto operativo per ridurre il carico amministrativo e lasciare più spazio alla relazione terapeutica.
            </p>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">📅</div>
                <h3>Gestione Agenda</h3>
                <p>Appuntamenti, promemoria automatici e riduzione dei no-show con notifiche al paziente.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🎙️</div>
                <h3>Gestione Seduta</h3>
                <p>Registrazione audio, riassunti post-seduta e punti salienti generati automaticamente dall'AI.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">📋</div>
                <h3>Piano di Intervento</h3>
                <p>Questionari clinici validati (GAD-7, PHQ-9…), obiettivi terapeutici ed esercizi personalizzati.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🤖</div>
                <h3>Assistente tra Sedute</h3>
                <p>Reminder automatici al paziente, raccolta feedback e sintesi settimanale per il terapeuta.</p>
              </div>
            </div>
          </section>

          {/* ===== STEPPER ===== */}
          <section className="stepper-section">
            <div className="stepper-header">
              <h2>Come partecipare</h2>
              <p>Prima di esplorare la demo, ti chiediamo un piccolo contributo: 8–10 minuti per il questionario.</p>
            </div>

            <div className="stepper">
              <div className="step">
                <div className="step-num done">✓</div>
                <div className="step-label active">Scopri il progetto</div>
                <div className="step-desc">Presentazione funzionalità</div>
              </div>
              <div className="step">
                <div className={`step-num ${step2Done ? 'done' : step2Active ? 'active' : ''}`}>
                  {step2Done ? '✓' : '2'}
                </div>
                <div className={`step-label ${!step2Done ? 'active' : ''}`}>Compila il Questionario</div>
                <div className="step-desc">8–10 min · nessun dato promozionale</div>
              </div>
              <div className="step">
                <div className={`step-num ${step2Done ? 'active' : ''}`}>3</div>
                <div className={`step-label ${step2Done ? 'active' : ''}`}>Esplora la Demo</div>
                <div className="step-desc">Accedi al prototipo interattivo</div>
              </div>
            </div>

            <div className="cta-grid">

              {/* Step 1 */}
              <div className="cta-card">
                <span className="cta-badge blue">Passo 1</span>
                <h3>Scopri il progetto</h3>
                <p>Hai già letto la presentazione qui sopra — ottimo inizio!</p>
                <span className="badge-done">✓ Completato</span>
              </div>

              {/* Step 2 */}
              <div className="cta-card highlight">
                <span className="cta-badge purple">Passo 2 · Importante</span>
                <h3>Compila il Questionario</h3>
                <p>
                  8–10 minuti per aiutarci a capire priorità e bisogni reali.
                  L'email è opzionale; nessuna lista promozionale.
                </p>

                {step2Done ? (
                  <span className="badge-done">✓ Questionario compilato</span>
                ) : step2Active ? (
                  <>
                    <div className="notice">
                      <strong>Hai aperto il form!</strong> Torna qui dopo averlo compilato e conferma.
                    </div>
                    <button className="btn btn-ghost btn-full" onClick={handleFormClick}>
                      Riapri il questionario
                    </button>
                    <button className="btn btn-purple btn-full" style={{marginTop:'10px'}} onClick={handleFormDone}>
                      ✓ Ho compilato il questionario
                    </button>
                  </>
                ) : (
                  <button className="btn btn-purple btn-full" onClick={handleFormClick}>
                    Apri il Questionario →
                  </button>
                )}
              </div>

              {/* Step 3 */}
              <div className={`cta-card ${step2Done ? 'highlight' : 'dim'}`}>
                <span className="cta-badge blue">Passo 3</span>
                <h3>Esplora la Demo</h3>
                <p>
                  Naviga il prototipo e sperimenta le funzionalità. Registrati per accedere a tutte le sezioni.
                </p>
                {step2Done ? (
                  <a className="btn btn-blue btn-full" href="/login">Accedi alla Demo →</a>
                ) : (
                  <>
                    <a className="btn btn-dim btn-full" href="/login">Accedi alla Demo</a>
                    <p className="hint">Completa prima il questionario per sbloccare l'accesso guidato.</p>
                  </>
                )}
              </div>

            </div>
          </section>

        </main>

        <footer>
          <div className="wrap">
            © cIAo-doc — materiale informativo per la raccolta di feedback professionali
          </div>
        </footer>
      </body>
    </html>
  );
}
