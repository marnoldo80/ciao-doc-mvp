'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

type Alert = {
  id: string;
  type: 'exercise' | 'diary' | 'thoughts' | 'questionnaire' | 'appointment';
  severity: 'low' | 'medium' | 'high';
  patientId: string;
  patientName: string;
  message: string;
  daysAgo: number;
  createdAt: string;
};

type AlertsWidgetProps = {
  therapistId: string;
};

export default function AlertsWidget({ therapistId }: AlertsWidgetProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    loadAlerts();
  }, [therapistId]);

  async function loadAlerts() {
    try {
      const res = await fetch(`/api/get-alerts?therapistId=${therapistId}`);
      if (!res.ok) throw new Error('Errore caricamento alert');
      const data = await res.json();
      setAlerts(data.alerts || []);
    } catch (e) {
      console.error('Errore alert:', e);
    } finally {
      setLoading(false);
    }
  }

  async function dismissAlert(alertId: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    try {
      // Rimuovi l'alert dall'UI immediatamente
      setAlerts(prev => prev.filter(a => a.id !== alertId));

      // Chiama API per dismissare (da implementare se serve persistenza)
      // await fetch(`/api/dismiss-alert?alertId=${alertId}`, { method: 'POST' });
    } catch (error) {
      console.error('Errore dismissione alert:', error);
    }
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'exercise': return '💪';
      case 'diary': return '📔';
      case 'thoughts': return '💭';
      case 'questionnaire': return '📊';
      case 'appointment': return '📅';
      default: return '⚠️';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-50 border-red-500 text-red-800';
      case 'medium': return 'bg-orange-50 border-orange-500 text-orange-800';
      case 'low': return 'bg-yellow-50 border-yellow-500 text-yellow-800';
      default: return 'bg-gray-50 border-gray-500 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div style={{ background: '#0b0f1c', border: '1px solid #26304b' }} className="rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 rounded w-1/3 mb-4" style={{ background: '#26304b' }}></div>
          <div className="space-y-3">
            <div className="h-16 rounded" style={{ background: '#141a2c' }}></div>
            <div className="h-16 rounded" style={{ background: '#141a2c' }}></div>
          </div>
        </div>
      </div>
    );
  }

  const displayedAlerts = showAll ? alerts : alerts.slice(0, 5);
  const highAlerts = alerts.filter(a => a.severity === 'high').length;

  return (
    <div style={{ background: '#0b0f1c', border: '1px solid #26304b', color: '#f1f5ff' }} className="rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg flex items-center gap-2" style={{ color: '#f1f5ff' }}>
          🚨 Alert e Notifiche
          {highAlerts > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {highAlerts} urgenti
            </span>
          )}
        </h3>
        {alerts.length > 5 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            {showAll ? 'Mostra meno' : `Vedi tutti (${alerts.length})`}
          </button>
        )}
      </div>

      {alerts.length === 0 ? (
        <div className="text-center py-8" style={{ color: '#a8b2d6' }}>
          <div className="text-4xl mb-2">✅</div>
          <p className="font-medium">Nessun alert attivo</p>
          <p className="text-sm">Tutti i pazienti sono monitorati correttamente</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedAlerts.map(alert => (
            <div
              key={alert.id}
              className={`block border-l-4 p-4 rounded hover:shadow-md transition relative ${getSeverityColor(alert.severity)}`}
            >
              <Link
                href={`/app/therapist/pazienti/${alert.patientId}`}
                className="block"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <span className="text-2xl">{getAlertIcon(alert.type)}</span>
                    <div>
                      <div className="font-semibold">{alert.patientName}</div>
                      <div className="text-sm mt-1">{alert.message}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="text-xs text-gray-600 whitespace-nowrap">
                      {alert.daysAgo} giorni fa
                    </div>
                    <button
                      onClick={(e) => dismissAlert(alert.id, e)}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                      title="Dismissi alert"
                      aria-label="Dismissi alert"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}

      {alerts.length > 0 && (
        <div className="mt-4 pt-4 text-sm" style={{ borderTop: '1px solid #26304b', color: '#a8b2d6' }}>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>Urgente ({alerts.filter(a => a.severity === 'high').length})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
              <span>Medio ({alerts.filter(a => a.severity === 'medium').length})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span>Basso ({alerts.filter(a => a.severity === 'low').length})</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
