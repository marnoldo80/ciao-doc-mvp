'use client';
import { useState, useRef, useEffect } from 'react';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

type ChatWidgetProps = {
  patientId: string;
  patientName: string;
};

export default function ChatWidget({ patientId, patientName }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Ciao ${patientName}! 👋 Sono il tuo assistente terapeutico. Sono qui per supportarti tra una seduta e l'altra con esercizi, obiettivi e ascolto. Come posso aiutarti oggi?`,
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const conversationHistory = useRef<{ role: string; content: string }[]>([]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // TTS — legge la risposta ad alta voce
  const speak = (text: string) => {
    if (!ttsEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'it-IT';
    utterance.rate = 0.95;
    utterance.pitch = 1;
    // Preferisce voce italiana se disponibile
    const voices = window.speechSynthesis.getVoices();
    const itVoice = voices.find(v => v.lang.startsWith('it'));
    if (itVoice) utterance.voice = itVoice;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

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

    conversationHistory.current.push({ role: 'user', content: textToSend });

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          message: textToSend,
          conversationHistory: conversationHistory.current.slice(-10),
        }),
      });

      if (!res.ok) throw new Error('Errore risposta chatbot');
      const data = await res.json();

      const assistantMsg: Message = { role: 'assistant', content: data.reply, timestamp: new Date() };
      setMessages(prev => [...prev, assistantMsg]);
      conversationHistory.current.push({ role: 'assistant', content: data.reply });

      // Legge la risposta ad alta voce
      speak(data.reply);

    } catch {
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

  const suggestedQuestions = [
    'Quali esercizi devo fare oggi?',
    'Come posso gestire l\'ansia?',
    'Quando è la mia prossima seduta?',
    'Ho completato tutti gli obiettivi?',
  ];

  const formatTime = (d: Date) => d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed', bottom: '24px', right: '24px',
            background: 'linear-gradient(135deg, #9333ea, #7aa2ff)',
            color: 'white', border: 'none', borderRadius: '999px',
            padding: '14px 20px', fontWeight: 700, fontSize: '14px',
            cursor: 'pointer', zIndex: 50,
            display: 'flex', alignItems: 'center', gap: '8px',
            boxShadow: '0 4px 20px rgba(147,51,234,0.4)',
          }}
        >
          <span style={{ fontSize: '22px' }}>💬</span>
          <span>Assistente IA</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px',
          width: '400px', height: '620px',
          background: '#141a2c', border: '1px solid #26304b',
          borderRadius: '16px', boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
          display: 'flex', flexDirection: 'column', zIndex: 50,
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #9333ea, #7aa2ff)',
            padding: '16px 20px', borderRadius: '16px 16px 0 0',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '10px', height: '10px', background: '#22c55e', borderRadius: '50%', animation: 'pulse 2s infinite' }} />
              <div>
                <div style={{ fontWeight: 700, color: 'white', fontSize: '15px' }}>Assistente Terapeutico</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>Sempre disponibile per te</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Toggle TTS */}
              <button
                onClick={() => { setTtsEnabled(p => !p); stopSpeaking(); }}
                title={ttsEnabled ? 'Disabilita voce' : 'Abilita voce'}
                style={{ background: 'none', border: 'none', color: 'white', fontSize: '18px', cursor: 'pointer', opacity: ttsEnabled ? 1 : 0.5 }}>
                🔊
              </button>
              {isSpeaking && (
                <button onClick={stopSpeaking} title="Ferma lettura"
                  style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', fontSize: '14px', cursor: 'pointer', borderRadius: '6px', padding: '3px 8px' }}>
                  ⏹
                </button>
              )}
              <button onClick={() => { setIsOpen(false); stopSpeaking(); }}
                style={{ background: 'none', border: 'none', color: 'white', fontSize: '22px', cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', background: '#0b0f1c' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '85%', padding: '10px 14px',
                  borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  background: msg.role === 'user' ? '#9333ea' : '#141a2c',
                  border: msg.role === 'user' ? 'none' : '1px solid #26304b',
                  color: '#f1f5ff', fontSize: '14px', lineHeight: 1.5,
                }}>
                  {msg.role === 'assistant' && (
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#9333ea', marginBottom: '4px' }}>🤖 Assistente</div>
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
                    <div key={i} style={{ width: '8px', height: '8px', background: '#9333ea', borderRadius: '50%', animation: `bounce 1s ${i * 0.15}s infinite` }} />
                  ))}
                  <span style={{ fontSize: '13px', color: '#a8b2d6', marginLeft: '4px' }}>Sto pensando...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Questions — solo all'inizio */}
          {messages.length <= 1 && (
            <div style={{ padding: '10px 12px', borderTop: '1px solid #26304b', background: '#141a2c' }}>
              <div style={{ fontSize: '11px', color: '#66708a', marginBottom: '6px' }}>Domande frequenti:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {suggestedQuestions.map((q, i) => (
                  <button key={i} onClick={() => sendMessage(q)}
                    style={{ fontSize: '12px', background: '#0b0f1c', color: '#9333ea', border: '1px solid rgba(147,51,234,0.3)', borderRadius: '999px', padding: '4px 12px', cursor: 'pointer' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(147,51,234,0.1)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#0b0f1c'; }}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid #26304b', background: '#141a2c', borderRadius: '0 0 16px 16px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="text"
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Scrivi o parla..."
                disabled={isLoading}
                style={{
                  flex: 1, background: '#0b0f1c', border: '1px solid #26304b', borderRadius: '8px',
                  padding: '9px 12px', color: '#f1f5ff', fontSize: '13px', outline: 'none',
                }}
              />
              {/* Pulsante voce */}
              <button
                onClick={isListening ? stopVoice : startVoice}
                title={isListening ? 'Stop' : 'Parla'}
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
                  background: isLoading || !inputMessage.trim() ? '#26304b' : 'linear-gradient(135deg,#9333ea,#7aa2ff)',
                  color: isLoading || !inputMessage.trim() ? '#66708a' : 'white',
                  border: 'none', borderRadius: '8px', padding: '9px 14px',
                  fontWeight: 600, fontSize: '13px', cursor: isLoading || !inputMessage.trim() ? 'not-allowed' : 'pointer',
                }}>
                Invia
              </button>
            </div>
            <div style={{ fontSize: '11px', color: '#66708a', marginTop: '6px', textAlign: 'center' }}>
              💡 Per urgenze contatta il tuo terapeuta · 🔊 voce {ttsEnabled ? 'attiva' : 'disattiva'}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
      `}</style>
    </>
  );
}
