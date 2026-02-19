"use client";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const Q = [
  "Sentirsi nervoso/a, ansioso/a o con i nervi a fior di pelle",
  "Non riuscire a smettere o a controllare la preoccupazione",
  "Preoccuparsi troppo per diverse cose",
  "Avere difficoltà a rilassarsi",
  "Essere così irrequieto/a da far fatica a stare fermo/a",
  "Irritabilità o facile agitazione",
  "Paura come se potesse succedere qualcosa di terribile",
];

const OPTIONS = [
  { label: "Per niente", valore: 0 },
  { label: "Alcuni giorni", valore: 1 },
  { label: "Più della metà dei giorni", valore: 2 },
  { label: "Quasi tutti i giorni", valore: 3 },
];

function toSeverity(total: number) {
  if (total <= 4) return "Minimo";
  if (total <= 9) return "Lieve";
  if (total <= 14) return "Moderato";
  return "Grave";
}

function severityColor(s: string) {
  if (s === "Grave") return "#ef4444";
  if (s === "Moderato") return "#eab308";
  if (s === "Lieve") return "#7aa2ff";
  return "#22c55e";
}

type Result = { created_at: string; total: number; severity: string };

export default function Page({ params }: { params: { id: string } }) {
  const pid = params.id;
  const router = useRouter();
  const [answers, setAnswers] = useState<number[]>(Array(7).fill(-1));
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [patientEmail, setPatientEmail] = useState("");
  const [patientName, setPatientName] = useState("Paziente");
  const [therapistId, setTherapistId] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const progresso = answers.filter((a) => a !== -1).length;
  const total = useMemo(() => answers.reduce((a, b) => (b === -1 ? a : a + b), 0), [answers]);
  const severity = useMemo(() => toSeverity(total), [total]);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u?.user) { router.replace("/login"); return; }
      setTherapistId(u.user.id);
      const { data: p } = await supabase.from("patients").select("email, display_name").eq("id", pid).single();
      if (p?.email) setPatientEmail(p.email);
      if (p?.display_name) setPatientName(p.display_name);
      await loadResults();
    })();
  }, [pid]);

  async function loadResults() {
    const { data } = await supabase.from("gad7_results").select("created_at,total,severity")
      .eq("patient_id", pid).order("created_at", { ascending: false }).limit(10);
    setResults(data || []);
  }

  async function save() {
    if (answers.some((a) => a === -1)) { alert("Rispondi a tutte le domande prima di continuare"); return; }
    setMsg(null); setErr(null); setSaved(false);
    try {
      if (!therapistId) throw new Error("Sessione non valida.");
      const { error } = await supabase.from("gad7_results").insert({
        patient_id: pid, total, severity, therapist_user_id: therapistId, answers,
      });
      if (error) throw error;
      setSaved(true);
      setSubmitted(true);
      setMsg("Risultato salvato.");
      await loadResults();
    } catch (e: any) { setErr(e?.message || "Errore salvataggio"); }
  }

  async function sendToPatient() {
    setErr(null); setMsg(null); setSending(true);
    try {
      if (!saved) throw new Error("Salva prima il risultato.");
      if (!patientEmail) throw new Error("Email paziente non presente.");
      const res = await fetch("/api/send-gad7-result", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toEmail: patientEmail, toName: patientName, patientName, total, severity, date: new Date().toLocaleString() }),
      });
      if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j?.error || "Invio email fallito"); }
      setMsg("Email risultati inviata al paziente.");
    } catch (e: any) { setErr(e?.message || "Errore invio email"); }
    finally { setSending(false); }
  }

  const inputStyle = {
    width: "100%", background: "#0b0f1c", border: "2px solid #26304b",
    borderRadius: "8px", padding: "10px 12px", color: "#f1f5ff", fontSize: "14px", outline: "none",
  };

  // Schermata risultato dopo salvataggio
  if (submitted && saved) {
    return (
      <div style={{ minHeight: "100vh", background: "#0b0f1c", padding: "32px 24px" }}>
        <div style={{ maxWidth: "720px", margin: "0 auto" }}>
          <button onClick={() => router.push(`/app/therapist/pazienti/${pid}?tab=questionari`)}
            style={{ color: "#a8b2d6", background: "#141a2c", border: "1px solid #26304b", borderRadius: "8px", padding: "6px 14px", fontSize: "14px", cursor: "pointer", marginBottom: "24px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
            ← Scheda Paziente
          </button>

          <div style={{ background: "#141a2c", border: "1px solid #26304b", borderRadius: "16px", padding: "40px", textAlign: "center" }}>
            <div style={{ fontSize: "56px", marginBottom: "16px" }}>😰</div>
            <h2 style={{ fontSize: "24px", fontWeight: 700, color: "#f1f5ff", marginBottom: "8px" }}>Questionario completato!</h2>
            <p style={{ color: "#a8b2d6", marginBottom: "28px" }}>{patientName}</p>

            <div style={{ background: "#0b0f1c", border: "1px solid #26304b", borderRadius: "12px", padding: "24px", marginBottom: "24px" }}>
              <div style={{ fontSize: "48px", fontWeight: 800, color: "#f1f5ff", fontFamily: "monospace" }}>
                {total}<span style={{ fontSize: "20px", color: "#a8b2d6", fontWeight: 400 }}>/21</span>
              </div>
              <div style={{ marginTop: "12px" }}>
                <span style={{
                  display: "inline-block", padding: "6px 18px", borderRadius: "999px", fontWeight: 700, fontSize: "15px",
                  background: severityColor(severity) + "22", color: severityColor(severity), border: `1px solid ${severityColor(severity)}44`,
                }}>
                  {severity}
                </span>
              </div>
              <p style={{ color: "#a8b2d6", fontSize: "13px", marginTop: "10px" }}>GAD-7 · Disturbo d'Ansia Generalizzata</p>
            </div>

            {err && <div style={{ marginBottom: "12px", padding: "10px 14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", borderRadius: "8px", fontSize: "14px" }}>{err}</div>}
            {msg && msg.includes("Email") && <div style={{ marginBottom: "12px", padding: "10px 14px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", color: "#22c55e", borderRadius: "8px", fontSize: "14px" }}>{msg}</div>}

            <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={sendToPatient} disabled={sending}
                style={{ background: sending ? "#26304b" : "linear-gradient(135deg,#22c55e,#16a34a)", color: "white", border: "none", borderRadius: "10px", padding: "12px 24px", fontWeight: 700, fontSize: "14px", cursor: sending ? "not-allowed" : "pointer" }}>
                {sending ? "⏳ Invio..." : "✉️ Invia risultati al paziente"}
              </button>
              <button onClick={() => router.push(`/app/therapist/pazienti/${pid}?tab=questionari`)}
                style={{ background: "#7aa2ff", color: "#0b1022", border: "none", borderRadius: "10px", padding: "12px 24px", fontWeight: 700, fontSize: "14px", cursor: "pointer" }}>
                ← Torna alla scheda paziente
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0b0f1c", padding: "32px 24px" }}>
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>

        {/* Breadcrumb */}
        <button onClick={() => router.push(`/app/therapist/pazienti/${pid}?tab=questionari`)}
          style={{ color: "#a8b2d6", background: "#141a2c", border: "1px solid #26304b", borderRadius: "8px", padding: "6px 14px", fontSize: "14px", cursor: "pointer", marginBottom: "24px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
          ← Scheda Paziente
        </button>

        {/* Header */}
        <div style={{ background: "#141a2c", border: "1px solid #26304b", borderRadius: "16px", padding: "24px", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <span style={{ fontSize: "40px" }}>😰</span>
            <div>
              <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#f1f5ff", margin: 0 }}>GAD-7 · Test Ansia</h1>
              <p style={{ fontSize: "13px", color: "#a8b2d6", margin: "4px 0 0 0" }}>Generalized Anxiety Disorder · Paziente: {patientName}</p>
            </div>
          </div>
          {/* Barra progresso */}
          <div style={{ marginTop: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ fontSize: "12px", color: "#a8b2d6" }}>{progresso}/{Q.length} domande</span>
              <span style={{ fontSize: "12px", color: "#7aa2ff" }}>Punteggio attuale: {total}/21</span>
            </div>
            <div style={{ height: "4px", background: "#26304b", borderRadius: "999px", overflow: "hidden" }}>
              <div style={{ height: "100%", background: "#7aa2ff", borderRadius: "999px", width: `${(progresso / Q.length) * 100}%`, transition: "width 0.3s" }} />
            </div>
          </div>
        </div>

        {/* Istruzioni */}
        <div style={{ background: "rgba(122,162,255,0.08)", border: "1px solid rgba(122,162,255,0.2)", borderRadius: "10px", padding: "12px 16px", marginBottom: "20px" }}>
          <p style={{ fontSize: "13px", color: "#a8b2d6", margin: 0 }}>📋 Nelle ultime 2 settimane, con quale frequenza è stato disturbato/a dai seguenti problemi?</p>
        </div>

        {/* Messaggi */}
        {err && <div style={{ marginBottom: "12px", padding: "10px 14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", borderRadius: "8px", fontSize: "14px" }}>{err}</div>}
        {msg && <div style={{ marginBottom: "12px", padding: "10px 14px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", color: "#22c55e", borderRadius: "8px", fontSize: "14px" }}>{msg}</div>}

        {/* Domande */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {Q.map((q, i) => (
            <div key={i} style={{
              background: "#141a2c",
              border: `1px solid ${answers[i] !== -1 ? "rgba(122,162,255,0.3)" : "#26304b"}`,
              borderRadius: "12px", padding: "18px", transition: "border-color 0.2s",
            }}>
              <p style={{ fontSize: "14px", fontWeight: 600, color: "#f1f5ff", marginBottom: "12px" }}>
                <span style={{ color: "#7aa2ff", marginRight: "8px" }}>{i + 1}.</span>{q}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {OPTIONS.map((opt) => (
                  <button key={opt.valore} type="button"
                    onClick={() => { const nr = [...answers]; nr[i] = opt.valore; setAnswers(nr); }}
                    style={{
                      padding: "7px 14px", borderRadius: "8px", fontSize: "13px", cursor: "pointer", transition: "all 0.15s",
                      fontWeight: answers[i] === opt.valore ? 700 : 400,
                      background: answers[i] === opt.valore ? "#7aa2ff" : "#0b0f1c",
                      color: answers[i] === opt.valore ? "#0b1022" : "#a8b2d6",
                      border: answers[i] === opt.valore ? "1px solid #7aa2ff" : "1px solid #26304b",
                    }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottone salva */}
        <button onClick={save} disabled={answers.some((a) => a === -1)}
          style={{
            marginTop: "16px", width: "100%", borderRadius: "12px", padding: "14px", fontWeight: 700, fontSize: "15px",
            cursor: answers.some((a) => a === -1) ? "not-allowed" : "pointer", transition: "all 0.2s",
            background: answers.some((a) => a === -1) ? "#141a2c" : "linear-gradient(135deg, #7aa2ff, #9333ea)",
            color: answers.some((a) => a === -1) ? "#a8b2d6" : "white",
            border: answers.some((a) => a === -1) ? "1px solid #26304b" : "none",
            boxShadow: answers.some((a) => a === -1) ? "none" : "0 4px 16px rgba(122,162,255,0.3)",
          }}>
          {answers.some((a) => a === -1)
            ? `Rispondi a ${Q.length - progresso} domande rimanenti`
            : `✓ Salva questionario (${total}/21)`}
        </button>

        {/* Storico */}
        {results.length > 0 && (
          <div style={{ background: "#141a2c", border: "1px solid #26304b", borderRadius: "16px", padding: "24px", marginTop: "24px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#f1f5ff", marginBottom: "16px" }}>📈 Storico GAD-7</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 80px 1fr 100px", gap: "12px", fontSize: "11px", fontWeight: 700, color: "#a8b2d6", paddingBottom: "8px", borderBottom: "1px solid #26304b", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                <div>Questionario</div><div>Punteggio</div><div>Risultato</div><div>Data</div>
              </div>
              {results.map((r, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 80px 1fr 100px", gap: "12px", padding: "10px 0", borderBottom: "1px solid rgba(38,48,75,0.5)", alignItems: "center" }}>
                  <div style={{ fontSize: "13px", color: "#f1f5ff", fontWeight: 500 }}>😰 GAD-7 Test Ansia</div>
                  <div style={{ fontFamily: "monospace", fontSize: "15px", fontWeight: 700, color: "#f1f5ff" }}>{r.total}</div>
                  <div>
                    <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 8px", borderRadius: "999px", background: severityColor(r.severity) + "22", color: severityColor(r.severity), border: `1px solid ${severityColor(r.severity)}44` }}>
                      {r.severity}
                    </span>
                  </div>
                  <div style={{ fontSize: "12px", color: "#a8b2d6" }}>{new Date(r.created_at).toLocaleDateString("it-IT")}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
