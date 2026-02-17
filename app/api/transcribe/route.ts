import { NextRequest, NextResponse } from 'next/server';

// Limite soft di avviso: oltre 90 minuti l'audio potrebbe essere molto pesante
const WARN_MINUTES = 90;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json({ error: 'File audio mancante' }, { status: 400 });
    }

    const audioBuffer = await audioFile.arrayBuffer();

    // Stima durata dal peso del file (webm ~20-40 KB/s a bassa qualità)
    // Solo per logging, non blocca
    const estimatedMinutes = Math.round(audioBuffer.byteLength / (30 * 1024) / 60);
    if (estimatedMinutes > WARN_MINUTES) {
      console.warn(`Audio molto lungo: ~${estimatedMinutes} minuti stimati`);
    }

    const deepgramUrl = new URL('https://api.deepgram.com/v1/listen');
    deepgramUrl.searchParams.append('model', 'nova-2');
    deepgramUrl.searchParams.append('language', 'it');
    deepgramUrl.searchParams.append('smart_format', 'true');
    deepgramUrl.searchParams.append('diarize', 'true');
    deepgramUrl.searchParams.append('punctuate', 'true');
    deepgramUrl.searchParams.append('utterances', 'true');
    deepgramUrl.searchParams.append('paragraphs', 'true');

    const response = await fetch(deepgramUrl.toString(), {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.DEEPGRAM_API_KEY}`,
        'Content-Type': 'audio/webm',
      },
      body: audioBuffer,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Errore Deepgram:', errorText);
      return NextResponse.json({ error: 'Errore trascrizione' }, { status: 500 });
    }

    const deepgramData = await response.json();

    let formattedTranscript = '';

    if (deepgramData.results?.utterances && deepgramData.results.utterances.length > 0) {
      // ✅ Raggruppa utterances consecutivi dello stesso speaker in un unico blocco
      // Evita "TERAPEUTA: parola\nTERAPEUTA: parola" per ogni pausa di respiro
      const utterances = deepgramData.results.utterances;
      const grouped: { speaker: number; text: string }[] = [];

      for (const utt of utterances) {
        const last = grouped[grouped.length - 1];
        if (last && last.speaker === utt.speaker) {
          // Stesso speaker: concatena il testo
          last.text += ' ' + utt.transcript.trim();
        } else {
          // Speaker diverso: nuovo blocco
          grouped.push({ speaker: utt.speaker, text: utt.transcript.trim() });
        }
      }

      // Formato compatto: ogni cambio speaker è separato da una sola riga vuota
      formattedTranscript = grouped
        .map(g => {
          const label = g.speaker === 0 ? 'TERAPEUTA' : 'PAZIENTE';
          return `${label}: ${g.text}`;
        })
        .join('\n\n');

    } else if (deepgramData.results?.channels?.[0]?.alternatives?.[0]) {
      // Fallback senza diarization: testo piano
      formattedTranscript = deepgramData.results.channels[0].alternatives[0].transcript;
    } else {
      return NextResponse.json({ error: 'Nessuna trascrizione trovata' }, { status: 500 });
    }

    return NextResponse.json({
      transcript: formattedTranscript,
      // raw_data rimosso dalla produzione per ridurre payload
    });

  } catch (error: any) {
    console.error('Errore trascrizione:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
