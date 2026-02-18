import { NextRequest, NextResponse } from 'next/server';
import { callGemini } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const { transcript, patientId } = await request.json();

    if (!transcript) {
      return NextResponse.json({ error: 'Trascrizione mancante' }, { status: 400 });
    }

    const aiResponse = await callGemini({
      systemPrompt: `Sei uno psicoterapeuta esperto. Analizza la trascrizione della seduta e identifica i temi principali emersi.

Genera una risposta in formato JSON con questa struttura esatta:
{
  "themes": ["tema 1", "tema 2", "tema 3", "tema 4", "tema 5"]
}

ISTRUZIONI:
- Identifica massimo 5 temi principali
- I temi devono essere specifici e clinicamente rilevanti
- Usa terminologia professionale ma concisa
- Esempi: "Ansia sociale", "Gestione delle emozioni", "Relazioni interpersonali", "Autostima", "Tecniche di rilassamento"
- Considera: problematiche discusse, emozioni prevalenti, strategie terapeutiche, obiettivi emersi
- Evita temi generici come "conversazione" o "dialogo"

Rispondi SOLO con il JSON, senza altro testo.`,
      userPrompt: `Analizza questa trascrizione di seduta terapeutica e identifica i temi principali:\n\n${transcript}`,
      temperature: 0.3,
      maxTokens: 500,
    });

    // Parse JSON dalla risposta IA
    try {
      const cleanResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const themesData = JSON.parse(cleanResponse);
      
      if (!themesData.themes || !Array.isArray(themesData.themes)) {
        throw new Error('Struttura JSON non valida');
      }

      return NextResponse.json({ 
        themes: themesData.themes.slice(0, 5), // Massimo 5 temi
        transcript_length: transcript.length
      });
    } catch (parseError) {
      console.error('Errore parsing JSON IA:', aiResponse);
      return NextResponse.json({ error: 'Formato risposta IA non valido' }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Errore generazione temi:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
