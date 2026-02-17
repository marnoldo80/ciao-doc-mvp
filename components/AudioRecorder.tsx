'use client';
import { useState, useRef } from 'react';

type AudioRecorderProps = {
  onTranscriptComplete: (transcript: string) => void;
  onSummaryComplete: (summary: string) => void;
  patientId?: string; // opzionale: per passare orientamento al riassunto
};

const MAX_RECORDING_MINUTES = 120; // limite hard: 2 ore
const WARN_RECORDING_MINUTES = 90; // avviso a 90 minuti

export default function AudioRecorder({ onTranscriptComplete, onSummaryComplete, patientId }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const next = prev + 1;
          // Limite hard: ferma automaticamente dopo 2 ore
          if (next >= MAX_RECORDING_MINUTES * 60) {
            stopRecording();
          }
          return next;
        });
      }, 1000);

    } catch (err: any) {
      setError('Errore accesso microfono: ' + err.message);
      console.error(err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const processAudio = async () => {
    if (!audioBlob) return;

    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const transcribeRes = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!transcribeRes.ok) {
        throw new Error('Errore trascrizione');
      }

      const { transcript } = await transcribeRes.json();
      onTranscriptComplete(transcript);

      // Il riassunto viene generato dalla pagina padre (sedute/nuovo) che ha già patientId
      // Questo componente notifica solo il completamento
      onSummaryComplete('');

    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const recordingMinutes = Math.floor(recordingTime / 60);
  const isLong = recordingMinutes >= WARN_RECORDING_MINUTES;
  const timerColor = isLong ? '#f59e0b' : '#ef4444'; // giallo se lungo, rosso normale

  return (
    <div style={{ background: '#0b0f1c', border: '1px solid #26304b', borderRadius: '12px', padding: '20px' }}>

      {error && (
        <div style={{ marginBottom: '12px', padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: '8px', fontSize: '14px' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        {!isRecording && !audioBlob && (
          <button
            onClick={startRecording}
            style={{
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              padding: '12px 24px',
              fontWeight: 700,
              fontSize: '15px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 16px rgba(239,68,68,0.4)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            🎙️ Avvia Registrazione
          </button>
        )}

        {isRecording && (
          <>
            <button
              onClick={stopRecording}
              style={{
                background: '#1a2236',
                color: '#f1f5ff',
                border: '1px solid #7aa2ff',
                borderRadius: '10px',
                padding: '12px 24px',
                fontWeight: 600,
                fontSize: '15px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#243050'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#1a2236'; }}
            >
              ⏹️ Ferma Registrazione
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '10px', height: '10px', background: timerColor, borderRadius: '50%', animation: 'pulse 1s infinite' }}></div>
              <span style={{ fontFamily: 'monospace', fontSize: '18px', fontWeight: 700, color: timerColor }}>
                {formatTime(recordingTime)}
              </span>
              <span style={{ fontSize: '13px', color: '#a8b2d6' }}>REC</span>
            </div>
            {isLong && (
              <span style={{ fontSize: '12px', color: '#f59e0b', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '6px', padding: '3px 8px' }}>
                ⚠️ Registrazione molto lunga
              </span>
            )}
          </>
        )}

        {audioBlob && !isProcessing && (
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={processAudio}
              style={{
                background: 'linear-gradient(135deg, #7aa2ff, #9333ea)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                padding: '12px 24px',
                fontWeight: 700,
                fontSize: '15px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 16px rgba(122,162,255,0.3)',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
            >
              ✨ Trascrivi e Genera IA
            </button>
            <button
              onClick={() => { setAudioBlob(null); setRecordingTime(0); }}
              style={{ background: '#141a2c', color: '#a8b2d6', border: '1px solid #26304b', borderRadius: '10px', padding: '12px 18px', fontWeight: 500, fontSize: '14px', cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#7aa2ff'; e.currentTarget.style.color = '#f1f5ff'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#26304b'; e.currentTarget.style.color = '#a8b2d6'; }}
            >
              🔄 Nuova Registrazione
            </button>
          </div>
        )}

        {isProcessing && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#7aa2ff' }}>
            <div style={{ width: '20px', height: '20px', border: '2px solid #7aa2ff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
            <span style={{ fontWeight: 500, fontSize: '14px' }}>Trascrizione in corso...</span>
          </div>
        )}
      </div>

      {audioBlob && (
        <div style={{ marginTop: '12px', fontSize: '13px', color: '#22c55e' }}>
          ✅ Registrazione completata ({formatTime(recordingTime)})
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}
