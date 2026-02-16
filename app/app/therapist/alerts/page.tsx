'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  useEffect(() => {
    loadAlerts();
  }, []);

  async function loadAlerts() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const res = await fetch(`/api/get-alerts?therapistId=${user.id}`);
      if (!res.ok) throw new Error('Errore caricamento alert');
      const data = await res.json();
      setAlerts(data.alerts || []);
    } catch (e) {
      console.error('Errore alert:', e);
    } finally {
      setLoading(false);
    }
  }

  async function dismissAlert(alertId: string) {
    try {
      setAlerts(prev => prev.filter(a => a.id !== alertId));
      // API call per persistere la dismissione (da implementare)
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

  const getSeverityBg = (severity: string) => {
    switch (severity) {
      case 'high': return { bg: '#3d1515', border: '#ef4444', text: '#fca5a5' };
      case 'medium': return { bg: '#3d2a15', border: '#f97316', text: '#fdba74' };
      case 'low': return { bg: '#3d3615', border: '#eab308', text: '#fde047' };
      default: return { bg: '#1f2937', border: '#6b7280', text: '#9ca3af' };
    }
  };

  const filteredAlerts = filter === 'all'
    ? alerts
    : alerts.filter(a => a.severity === filter);

  return (
    <div style={{
      padding: '24px',
      minHeight: 'calc(100vh - 80px)',
      background: 'linear-gradient(180deg, #10162a 0%, #0b0f1c 100%)'
    }}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Link
              href="/app/therapist"
              className="flex items-center gap-1 transition-colors px-3 py-1 rounded-lg"
              style={{
                color: '#f1f5ff',
                background: '#141a2c',
                border: '1px solid #26304b'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Dashboard
            </Link>
          </div>
          <h1 className="text-3xl font-bold" style={{ color: '#f1f5ff' }}>
            🚨 Alert e Notifiche
          </h1>
          <p className="text-lg mt-2" style={{ color: '#a8b2d6' }}>
            Tutti gli alert relativi ai tuoi pazienti
          </p>
        </div>

        {/* Filtri */}
        <div className="mb-6 flex gap-3 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className="px-4 py-2 rounded-lg font-medium transition-all"
            style={{
              background: filter === 'all' ? '#7aa2ff' : '#141a2c',
              color: filter === 'all' ? '#0b1022' : '#f1f5ff',
              border: `2px solid ${filter === 'all' ? '#7aa2ff' : '#26304b'}`
            }}
          >
            Tutti ({alerts.length})
          </button>
          <button
            onClick={() => setFilter('high')}
            className="px-4 py-2 rounded-lg font-medium transition-all"
            style={{
              background: filter === 'high' ? '#ef4444' : '#141a2c',
              color: filter === 'high' ? '#ffffff' : '#f1f5ff',
              border: `2px solid ${filter === 'high' ? '#ef4444' : '#26304b'}`
            }}
          >
            Urgenti ({alerts.filter(a => a.severity === 'high').length})
          </button>
          <button
            onClick={() => setFilter('medium')}
            className="px-4 py-2 rounded-lg font-medium transition-all"
            style={{
              background: filter === 'medium' ? '#f97316' : '#141a2c',
              color: filter === 'medium' ? '#ffffff' : '#f1f5ff',
              border: `2px solid ${filter === 'medium' ? '#f97316' : '#26304b'}`
            }}
          >
            Medi ({alerts.filter(a => a.severity === 'medium').length})
          </button>
          <button
            onClick={() => setFilter('low')}
            className="px-4 py-2 rounded-lg font-medium transition-all"
            style={{
              background: filter === 'low' ? '#eab308' : '#141a2c',
              color: filter === 'low' ? '#0b1022' : '#f1f5ff',
              border: `2px solid ${filter === 'low' ? '#eab308' : '#26304b'}`
            }}
          >
            Bassi ({alerts.filter(a => a.severity === 'low').length})
          </button>
        </div>

        {/* Lista Alert */}
        {loading ? (
          <div style={{ background: '#141a2c', border: '2px solid #26304b' }} className="rounded-lg p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-20 rounded" style={{ background: '#0b0f1c' }}></div>
              <div className="h-20 rounded" style={{ background: '#0b0f1c' }}></div>
              <div className="h-20 rounded" style={{ background: '#0b0f1c' }}></div>
            </div>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div style={{ background: '#141a2c', border: '2px solid #26304b', color: '#f1f5ff' }} className="rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-xl font-bold mb-2">
              {filter === 'all' ? 'Nessun alert attivo' : `Nessun alert ${filter === 'high' ? 'urgente' : filter === 'medium' ? 'medio' : 'basso'}`}
            </h3>
            <p style={{ color: '#a8b2d6' }}>
              {filter === 'all'
                ? 'Tutti i pazienti sono monitorati correttamente'
                : 'Nessun paziente richiede attenzione in questa categoria'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAlerts.map(alert => {
              const colors = getSeverityBg(alert.severity);
              return (
                <div
                  key={alert.id}
                  className="p-5 rounded-lg hover:shadow-lg transition-shadow"
                  style={{
                    background: colors.bg,
                    borderLeft: `4px solid ${colors.border}`,
                    border: `1px solid ${colors.border}`
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <Link
                      href={`/app/therapist/pazienti/${alert.patientId}`}
                      className="flex items-start gap-4 flex-1"
                    >
                      <span className="text-3xl">{getAlertIcon(alert.type)}</span>
                      <div className="flex-1">
                        <div className="font-bold text-lg mb-1" style={{ color: colors.text }}>
                          {alert.patientName}
                        </div>
                        <div className="text-base mb-2" style={{ color: '#f1f5ff' }}>
                          {alert.message}
                        </div>
                        <div className="flex items-center gap-4 text-sm" style={{ color: '#a8b2d6' }}>
                          <span>📅 {alert.daysAgo} giorni fa</span>
                          <span>•</span>
                          <span className="capitalize">{alert.type}</span>
                          <span>•</span>
                          <span className="capitalize font-medium">
                            Priorità: {alert.severity === 'high' ? 'Urgente' : alert.severity === 'medium' ? 'Media' : 'Bassa'}
                          </span>
                        </div>
                      </div>
                    </Link>
                    <button
                      onClick={() => dismissAlert(alert.id)}
                      className="p-2 rounded-lg transition-colors flex-shrink-0"
                      style={{
                        background: 'transparent',
                        color: '#f1f5ff',
                        border: '1px solid #26304b'
                      }}
                      title="Dismissi alert"
                    >
                      <svg
                        width="20"
                        height="20"
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
