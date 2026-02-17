'use client';
import { useState, useRef } from 'react';

type AudioRecorderProps = {
  onTranscriptComplete: (transcript: string) => void;
  onSummaryComplete: (summary: string) => void;
};

export default function AudioRecorder({ onTranscriptComplete, onSummaryComplete }: AudioRecorderProps) {
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

      // Timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
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
      // Step 1: Trascrizione con Deepgram
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

      // Step 2: Riassunto con Groq
      const summaryRes = await fetch('/api/ai-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
      });

      if (!summaryRes.ok) {
        throw new Error('Errore generazione riassunto');
      }

      const { summary } = await summaryRes.json();
      onSummaryComplete(summary);

    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(239,68,68,0.5)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(239,68,68,0.4)'; }}
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
              <div style={{ width: '10px', height: '10px', background: '#ef4444', borderRadius: '50%', animation: 'pulse 1s infinite' }}></div>
              <span style={{ fontFamily: 'monospace', fontSize: '18px', fontWeight: 700, color: '#ef4444' }}>{formatTime(recordingTime)}</span>
              <span style={{ fontSize: '13px', color: '#a8b2d6' }}>REC</span>
            </div>
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
            <span style={{ fontWeight: 500, fontSize: '14px' }}>Elaborazione in corso...</span>
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
