// Helper condiviso per chiamate a Google Gemini API
// Modello: gemini-2.0-flash — veloce, gratuito fino a 1.500 req/giorno

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export interface GeminiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export async function callGemini({
  systemPrompt,
  userPrompt,
  temperature = 0.3,
  maxTokens = 2000,
  history = [],
}: {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  history?: GeminiMessage[];
}): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY non configurata');

  // Gemini usa systemInstruction separato dai contents
  const body = {
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    contents: [
      ...history,
      { role: 'user', parts: [{ text: userPrompt }] },
    ],
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
    },
  };

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Nessuna risposta da Gemini');
  return text;
}

// Converte history OpenAI-style (role: user/assistant) a Gemini-style (role: user/model)
export function toGeminiHistory(
  openAiHistory: { role: string; content: string }[]
): GeminiMessage[] {
  return openAiHistory.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
}
