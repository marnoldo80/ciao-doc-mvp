'use client';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(180deg, #10162a 0%, #0b0f1c 100%)',
      padding: '40px 20px',
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '900px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        {/* Header con logo */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <img
            src="/logo-transparent-png.png"
            alt="cIAo-doc"
            style={{ height: '140px', width: 'auto', marginBottom: '16px' }}
          />
          <p style={{
            margin: '16px 0 0 0',
            color: '#a8b2d6',
            fontSize: '20px',
            fontWeight: '500'
          }}>
            Scegli il tipo di accesso
          </p>
        </div>

        {/* Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px',
          width: '100%',
          maxWidth: '750px'
        }}>
          {/* Card Terapeuta */}
          <div className="login-card" style={{
            background: '#141a2c',
            border: '2px solid #26304b',
            borderRadius: '20px',
            padding: '32px',
            textAlign: 'center',
            boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
            transition: 'all 0.3s ease'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #7aa2ff, #5b9cff)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px'
            }}>
              <svg style={{ width: '40px', height: '40px', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>

            <h2 style={{
              margin: '0 0 12px',
              fontSize: '24px',
              fontWeight: '700',
              color: '#f1f5ff'
            }}>
              Sono un Terapeuta
            </h2>

            <p style={{
              margin: '0 0 24px',
              color: '#a8b2d6',
              fontSize: '16px',
              lineHeight: '1.5'
            }}>
              Gestisci i tuoi pazienti, appuntamenti e piani terapeutici
            </p>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <Link
                href="/login/terapeuta?mode=signup"
                style={{
                  display: 'block',
                  padding: '14px 24px',
                  borderRadius: '12px',
                  fontWeight: '700',
                  fontSize: '16px',
                  textDecoration: 'none',
                  textAlign: 'center',
                  background: '#7aa2ff',
                  color: '#0b1022',
                  boxShadow: '0 8px 20px rgba(122, 162, 255, 0.25)',
                  transition: 'all 0.3s ease'
                }}
                className="btn-primary-hover"
              >
                Registrati
              </Link>

              <Link
                href="/login/terapeuta?mode=login"
                style={{
                  display: 'block',
                  padding: '14px 24px',
                  borderRadius: '12px',
                  fontWeight: '700',
                  fontSize: '16px',
                  textDecoration: 'none',
                  textAlign: 'center',
                  background: 'transparent',
                  color: '#7aa2ff',
                  border: '2px solid #7aa2ff',
                  transition: 'all 0.3s ease'
                }}
                className="btn-secondary-hover"
              >
                Accedi
              </Link>
            </div>
          </div>

          {/* Card Paziente */}
          <div className="login-card" style={{
            background: '#141a2c',
            border: '2px solid #26304b',
            borderRadius: '20px',
            padding: '32px',
            textAlign: 'center',
            boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
            transition: 'all 0.3s ease'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #7aa2ff, #5b9cff)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px'
            }}>
              <svg style={{ width: '40px', height: '40px', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>

            <h2 style={{
              margin: '0 0 12px',
              fontSize: '24px',
              fontWeight: '700',
              color: '#f1f5ff'
            }}>
              Sono un Paziente
            </h2>

            <p style={{
              margin: '0 0 24px',
              color: '#a8b2d6',
              fontSize: '16px',
              lineHeight: '1.5'
            }}>
              Accedi ai tuoi appuntamenti, questionari e piano terapeutico
            </p>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <Link
                href="/login/paziente"
                style={{
                  display: 'block',
                  padding: '14px 24px',
                  borderRadius: '12px',
                  fontWeight: '700',
                  fontSize: '16px',
                  textDecoration: 'none',
                  textAlign: 'center',
                  background: '#7aa2ff',
                  color: '#0b1022',
                  boxShadow: '0 8px 20px rgba(122, 162, 255, 0.25)',
                  transition: 'all 0.3s ease'
                }}
                className="btn-primary-hover"
              >
                Accedi
              </Link>

              <div style={{
                marginTop: '12px',
                fontSize: '14px',
                color: '#a8b2d6',
                opacity: '0.8'
              }}>
                Il tuo account viene creato dal terapeuta
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Styles for hover effects */}
      <style jsx>{`
        .login-card:hover {
          border-color: #7aa2ff !important;
          transform: translateY(-4px);
          box-shadow: 0 16px 40px rgba(122, 162, 255, 0.2) !important;
        }

        .btn-primary-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(122, 162, 255, 0.35) !important;
        }

        .btn-secondary-hover:hover {
          background: #7aa2ff !important;
          color: #0b1022 !important;
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
}
