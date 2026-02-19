'use client';
import { useState, useEffect, useRef } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface TherapistAssistantProps {
  therapistName?: string;
}

const QUICK_ACTIONS = [
  { label: '🏥 Creare un paziente', query: 'Come creo un nuovo paziente?' },
  { label: '📅 Creare appuntamento', query: 'Come creo un appuntamento?' },
  { label: '🎙️ Trascrizione seduta', query: 'Come funziona la trascrizione audio delle sedute?' },
  { label: '🎯 Piano terapeutico', query: 'Come uso il piano terapeutico e l\'IA?' },
  { label: '📊 Inviare questionari', query: 'Come invio un questionario al paziente?' },
  { label: '📋 Consenso informato', query: 'Come creo il consenso informato?' },
  { label: '📤 Inviare obiettivi', query: 'Come invio obiettivi ed esercizi al paziente?' },
  { label: '⚙️ Workflow consigliato', query: 'Qual è il workflow consigliato per un nuovo paziente?' },
];

export default function TherapistAssistant({ therapistName }: TherapistAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Ciao ${therapistName || 'Dottore/ssa'}! 👨‍⚕️ Sono il tuo assistente per Therap-IA.\n\nPosso aiutarti a usare tutte le funzionalità della piattaforma e posso anche eseguire azioni come:\n• 📅 Creare un appuntamento\n• 🏥 Avviare la creazione di un nuovo paziente\n\nCosa ti serve?`,
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const conversationHistory = useRef<{ role: string; content: string }[]>([]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Web Speech API — riconoscimento vocale
  const startVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Il tuo browser non supporta il riconoscimento vocale. Usa Chrome.');
      return;
    }
    const rec = new SpeechRecognition();
    rec.lang = 'it-IT';
    rec.continuous = false;
    rec.interimResults = false;
    rec.onstart = () => setIsListening(true);
    rec.onend = () => setIsListening(false);
    rec.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setInputMessage(transcript);
    };
    rec.onerror = () => setIsListening(false);
    recognitionRef.current = rec;
    rec.start();
  };

  const stopVoice = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const sendMessage = async (text?: string) => {
    const textToSend = text || inputMessage.trim();
    if (!textToSend || isLoading) return;

    const userMsg: Message = { role: 'user', content: textToSend, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    // Aggiorna storico conversazione
    conversationHistory.current.push({ role: 'user', content: textToSend });

    try {
      const res = await fetch('/api/therapist-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          conversationHistory: conversationHistory.current.slice(-10),
        }),
      });

      if (!res.ok) throw new Error('Errore risposta assistente');
      const data = await res.json();

      // Gestione redirect (es. crea nuovo paziente)
      if (data.action === 'redirect' && data.url) {
        const assistantMsg: Message = { role: 'assistant', content: data.reply, timestamp: new Date() };
        setMessages(prev => [...prev, assistantMsg]);
        conversationHistory.current.push({ role: 'assistant', content: data.reply });
        setTimeout(() => { window.location.href = data.url; }, 1500);
        return;
      }

      const assistantMsg: Message = { role: 'assistant', content: data.reply, timestamp: new Date() };
      setMessages(prev => [...prev, assistantMsg]);
      conversationHistory.current.push({ role: 'assistant', content: data.reply });

    } catch (e: any) {
      const errMsg: Message = {
        role: 'assistant',
        content: 'Mi dispiace, ho avuto un problema tecnico. Riprova tra poco.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const formatTime = (d: Date) => d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed', bottom: '24px', right: '104px',
          background: 'linear-gradient(135deg, #1d4ed8, #7aa2ff)',
          color: 'white', border: 'none', borderRadius: '999px',
          padding: '14px 20px', fontWeight: 700, fontSize: '14px',
          cursor: 'pointer', zIndex: 40, display: 'flex', alignItems: 'center', gap: '8px',
          boxShadow: '0 4px 20px rgba(122,162,255,0.4)',
        }}
        title="Assistente Therap-IA"
      >
        <span style={{ fontSize: '22px' }}>🩺</span>
        <span>Assistente</span>
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed', bottom: '24px', right: '24px',
      width: '400px', height: '620px',
      background: '#141a2c', border: '1px solid #26304b',
      borderRadius: '16px', boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
      display: 'flex', flexDirection: 'column', zIndex: 50,
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1d4ed8, #7aa2ff)',
        padding: '16px 20px', borderRadius: '16px 16px 0 0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '22px' }}>🩺</span>
          <div>
            <div style={{ fontWeight: 700, color: 'white', fontSize: '15px' }}>Assistente Therap-IA</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>Guida e supporto per terapeuti</div>
          </div>
        </div>
        <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '22px', cursor: 'pointer', lineHeight: 1 }}>×</button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', background: '#0b0f1c' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '85%', padding: '10px 14px', borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
              background: msg.role === 'user' ? '#1d4ed8' : '#141a2c',
              border: msg.role === 'user' ? 'none' : '1px solid #26304b',
              color: '#f1f5ff', fontSize: '14px', lineHeight: 1.5,
            }}>
              {msg.role === 'assistant' && (
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#7aa2ff', marginBottom: '4px' }}>🩺 Assistente</div>
              )}
              <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
              <div style={{ fontSize: '11px', color: 'rgba(168,178,214,0.6)', marginTop: '4px', textAlign: 'right' }}>{formatTime(msg.timestamp)}</div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ background: '#141a2c', border: '1px solid #26304b', borderRadius: '12px', padding: '12px 16px', display: 'flex', gap: '6px', alignItems: 'center' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: '8px', height: '8px', background: '#7aa2ff', borderRadius: '50%', animation: `bounce 1s ${i * 0.15}s infinite` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick actions */}
      <div style={{ padding: '10px 12px', borderTop: '1px solid #26304b', background: '#141a2c' }}>
        <div style={{ fontSize: '11px', color: '#66708a', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Azioni rapide</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
          {QUICK_ACTIONS.map((a, i) => (
            <button key={i} onClick={() => sendMessage(a.query)}
              style={{ fontSize: '12px', background: '#0b0f1c', color: '#7aa2ff', border: '1px solid #26304b', borderRadius: '6px', padding: '5px 8px', cursor: 'pointer', textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#7aa2ff'; e.currentTarget.style.background = 'rgba(122,162,255,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#26304b'; e.currentTarget.style.background = '#0b0f1c'; }}>
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid #26304b', background: '#141a2c', borderRadius: '0 0 16px 16px' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="text"
            value={inputMessage}
            onChange={e => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Fai una domanda su Therap-IA..."
            disabled={isLoading}
            style={{
              flex: 1, background: '#0b0f1c', border: '1px solid #26304b', borderRadius: '8px',
              padding: '9px 12px', color: '#f1f5ff', fontSize: '13px', outline: 'none',
            }}
          />
          {/* Pulsante voce */}
          <button
            onClick={isListening ? stopVoice : startVoice}
            title={isListening ? 'Stop registrazione' : 'Parla'}
            style={{
              background: isListening ? 'rgba(239,68,68,0.15)' : '#0b0f1c',
              border: `1px solid ${isListening ? '#ef4444' : '#26304b'}`,
              borderRadius: '8px', padding: '9px 11px', cursor: 'pointer', fontSize: '16px',
              animation: isListening ? 'pulse 1s infinite' : 'none',
            }}>
            {isListening ? '🔴' : '🎙️'}
          </button>
          <button
            onClick={() => sendMessage()}
            disabled={isLoading || !inputMessage.trim()}
            style={{
              background: isLoading || !inputMessage.trim() ? '#26304b' : '#1d4ed8',
              color: isLoading || !inputMessage.trim() ? '#66708a' : 'white',
              border: 'none', borderRadius: '8px', padding: '9px 14px',
              fontWeight: 600, fontSize: '13px', cursor: isLoading || !inputMessage.trim() ? 'not-allowed' : 'pointer',
            }}>
            📤
          </button>
        </div>
        <div style={{ fontSize: '11px', color: '#66708a', marginTop: '6px' }}>Premi Enter per inviare · 🎙️ per parlare</div>
      </div>

      <style>{`
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
      `}</style>
    </div>
  );
}
