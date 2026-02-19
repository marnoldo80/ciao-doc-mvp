import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { callGemini, toGeminiHistory } from '@/lib/gemini';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
);

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory, action, actionData } = await request.json();

    // ===== GESTIONE AZIONI DIRETTE =====
    if (action === 'create_appointment') {
      const { patientId, title, startsAt, endsAt, location } = actionData;
      if (!patientId || !startsAt || !endsAt) {
        return NextResponse.json({ error: 'Dati appuntamento incompleti' }, { status: 400 });
      }
      const { error } = await supabase.from('appointments').insert({
        patient_id: patientId,
        title: title || 'Seduta',
        starts_at: startsAt,
        ends_at: endsAt,
        location: location || null,
      });
      if (error) throw error;
      return NextResponse.json({ ok: true, reply: `✅ Appuntamento "${title || 'Seduta'}" creato con successo per il ${new Date(startsAt).toLocaleString('it-IT')}!` });
    }

    if (action === 'delete_appointment') {
      const { appointmentId } = actionData;
      if (!appointmentId) return NextResponse.json({ error: 'ID appuntamento mancante' }, { status: 400 });
      const { error } = await supabase.from('appointments').delete().eq('id', appointmentId);
      if (error) throw error;
      return NextResponse.json({ ok: true, reply: '✅ Appuntamento cancellato con successo!' });
    }

    if (action === 'create_patient') {
      const { display_name, email, phone } = actionData;
      if (!display_name || !email) {
        return NextResponse.json({ error: 'Nome ed email obbligatori' }, { status: 400 });
      }
      // Verifica utente autenticato
      const authHeader = request.headers.get('authorization');
      if (!authHeader) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

      return NextResponse.json({
        ok: true,
        action: 'redirect',
        url: `/app/therapist/pazienti/nuovo?name=${encodeURIComponent(display_name)}&email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone || '')}`,
        reply: `✅ Ti porto alla pagina di creazione paziente con i dati già precompilati per ${display_name}!`
      });
    }

    // ===== RISPOSTA AI CON KNOWLEDGE BASE =====
    if (!message) {
      return NextResponse.json({ error: 'Messaggio mancante' }, { status: 400 });
    }

    const systemPrompt = `Sei l'assistente virtuale di Therap-IA, una piattaforma software per psicologi e psicoterapeuti.
Il tuo unico scopo è aiutare il terapeuta a UTILIZZARE correttamente la piattaforma Therap-IA.

REGOLE FONDAMENTALI:
- Rispondi SOLO a domande sull'utilizzo di Therap-IA
- NON inventare funzionalità che non esistono
- NON dare consigli clinici o terapeutici
- Se non sai qualcosa di specifico sulla piattaforma, dillo chiaramente
- Sii conciso (max 120 parole), chiaro e diretto
- Usa emoji per rendere le istruzioni più leggibili

FUNZIONALITÀ DISPONIBILI IN THERAP-IA:
1. PAZIENTI: Crea nuovo paziente (Dashboard → Pazienti → Nuovo Paziente). Campi: nome, email, telefono, indirizzo, codice fiscale, data nascita, luogo nascita, medico MMG, problematiche, obiettivi, tariffe per tipo seduta.
2. INVITO PAZIENTE: Scheda paziente → pulsante "Invia invito email" → il paziente riceve credenziali di accesso.
3. CONSENSO INFORMATO: Lista pazienti → colonna Consenso → Crea Consenso → firma terapeuta → paziente firma tramite email.
4. APPUNTAMENTI: 3 modi: Dashboard → Nuovo Appuntamento, oppure Calendario → click su cella, oppure Appuntamenti → Nuovo. Campi: paziente, titolo, data/ora, durata, luogo. La cancellazione avviene cliccando sull'appuntamento → Modifica → Elimina.
5. SEDUTE: Scheda paziente → tab Sedute → Nuova seduta. Si possono generare riassunti IA, estrarre temi, generare obiettivi automatici dalle sedute.
6. TRASCRIZIONE AUDIO: Nella pagina nuova seduta, puoi registrare l'audio della seduta → il sistema trascrive automaticamente separando TERAPEUTA e PAZIENTE.
7. PIANO TERAPEUTICO: Scheda paziente → tab Valutazione (anamnesi, diagnosi, formulazione caso) e tab Obiettivi ed Esercizi. Il bottone "Suggerisci con IA" genera contenuti automaticamente dalle sedute.
8. OBIETTIVI ED ESERCIZI: Visibili anche al paziente nella sua area. Puoi selezionarli e inviare email al paziente con "Invia al Paziente".
9. COMUNICAZIONI PAZIENTE: Scheda paziente → tab Comunicazioni Paziente. Trovi messaggi sugli appuntamenti, pensieri pre-seduta e diario del paziente.
10. QUESTIONARI: Oltre 20 questionari clinici (GAD-7, PHQ-9, SPIN, ADHD, ecc.). Puoi compilarli in seduta o inviarli al paziente via email. I risultati appaiono nello storico.
11. AREA PAZIENTE: Il paziente accede alla sua area con email/password ricevuta via email. Può vedere obiettivi, esercizi, prossimi appuntamenti, scrivere nel diario, chattare con l'assistente IA.
12. BLOG E SOCIAL: Sezione marketing per generare contenuti per blog, Instagram, Facebook, LinkedIn con IA.
13. FATTURE: Sezione dedicata alla gestione fatture e parcelle.
14. AZIONI CHATBOT: Puoi dirmi di creare un appuntamento o un nuovo paziente e lo farò direttamente. Es: "Crea appuntamento per Mario Rossi domani alle 15" oppure "Nuovo paziente: Nome Cognome, email@example.com".

PROBLEMI COMUNI:
- Email non arriva: controlla spam, verifica email corretta, reinvia invito
- Errore salvataggio: ricarica pagina, verifica connessione
- Calendario non risponde: click preciso sulla cella oraria, ricarica se necessario
- Trascrizione incompleta: usa audio pulito, evita registrazioni da altoparlanti

IMPORTANTE: Se il terapeuta chiede di eseguire un'azione (crea appuntamento, crea paziente, cancella appuntamento), rispondi con le informazioni necessarie usando questo formato JSON nel tuo testo:
Per CREARE APPUNTAMENTO: {"intent":"create_appointment","needs":["patientId","startsAt","endsAt","title"]}
Per NUOVO PAZIENTE: {"intent":"create_patient","needs":["display_name","email"]}
Per CANCELLARE APPUNTAMENTO: {"intent":"delete_appointment","needs":["appointmentId"]}`;

    const reply = await callGemini({
      systemPrompt,
      userPrompt: message,
      temperature: 0.3,
      maxTokens: 400,
      history: toGeminiHistory(conversationHistory || []),
    });

    return NextResponse.json({ reply });

  } catch (error: any) {
    console.error('Errore therapist-chat:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
