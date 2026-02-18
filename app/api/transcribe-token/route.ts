import { NextResponse } from 'next/server';

// Genera un JWT temporaneo Deepgram per la trascrizione lato client.
// Il browser usa questo token per chiamare api.deepgram.com direttamente,
// bypassando i limiti Vercel (4.5MB body, 10s timeout su Hobby).
export const maxDuration = 10;

export async function POST() {
  try {
    const apiKey = process.env.DEEPGRAM_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Deepgram API key non configurata' }, { status: 500 });
    }

    // Richiede un JWT temporaneo con TTL 300 secondi (sufficiente per upload + elaborazione)
    const response = await fetch('https://api.deepgram.com/v1/auth/grant', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ttl_seconds: 300 }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Errore generazione token Deepgram:', errorText);
      return NextResponse.json({ error: 'Errore generazione token' }, { status: 500 });
    }

    const { access_token } = await response.json();
    return NextResponse.json({ token: access_token });

  } catch (error: any) {
    console.error('Errore transcribe-token:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
