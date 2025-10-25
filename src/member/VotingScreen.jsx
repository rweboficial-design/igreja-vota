import React, { useEffect, useState, useRef } from "react";
import useStore from "../store";
import TopBar from "../components/TopBar";
import SessionWatcher from "./SessionWatcher";

export default function VotingScreen() {
  const { role_id, setStage, member, isTech } = useStore();
  const [candidates, setCandidates] = useState([]);
  const [selected, setSelected] = useState(null);
  const [sending, setSending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const did = useRef(false);

  async function loadCandidates() {
    try {
      const res = await fetch("/api/candidates");
      const data = await res.json();
      if (Array.isArray(data)) {
        const list = data.map((c, i) => ({
          id: c.id || `cand_${i}`,
          name: c.name || `Candidato ${i + 1}`,
          photo_url: c.photo_url || "",
        }));
        setCandidates(list);
      } else setCandidates([]);
    } catch (e) {
      console.error("Falha ao carregar candidatos:", e);
    }
  }

  useEffect(() => {
    if (did.current) return;
    did.current = true;
    loadCandidates();
  }, []);

  async function handleConfirmVote() {
    setErrorMsg("");
    if (!selected) {
      alert("Selecione um candidato antes de votar.");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role_id,
          nominee_id: selected.id,
          member_id: member?.id || "anonymous",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Não foi possível registrar o voto.");
      }
      setShowSuccess(true);
      setTimeout(() => setStage("none"), 1000);
    } catch (e) {
      console.error("Erro ao enviar voto:", e);
      setErrorMsg(e.message || "Falha ao enviar. Tente novamente.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", color: "#f9fafb" }}>
      <TopBar />
      {!isTech && <SessionWatcher />}

      <div style={{ padding: 16 }}>
        <h2>Escolha 1 membro para votar</h2>

        {showSuccess && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 50,
            }}
          >
            <div
              style={{
                background: "#fff",
                borderRadius: 12,
                padding: 24,
                maxWidth: 300,
                textAlign: "center",
                boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
              }}
            >
              <h4 style={{ marginBottom: 8, color: "#0f172a" }}>Voto registrado!</h4>
              <p style={{ color: "#334155" }}>Obrigado por participar.</p>
            </div>
          </div>
        )}

        {errorMsg && (
          <p style={{ color: "#ef4444", fontWeight: 600, marginTop: 8 }}>
            {errorMsg}
          </p>
        )}

        {candidates.length === 0 ? (
          <p style={{ color: "#e2e8f0" }}>Nenhum candidato disponível.</p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
              gap: 12,
              marginTop: 16,
            }}
          >
            {candidates.map((c) => {
              const isSel = selected?.id === c.id;
              const baseStyle = {
                cursor: "pointer",
                textAlign: "center",
                border: "2px solid #e5e7eb",
                borderRadius: 12,
                padding: 12,
                transition:
                  "transform .08s ease, box-shadow .12s ease, border-color .12s ease",
                background: "#fff",
              };
              const selStyle = isSel
                ? {
                    borderColor: "#22c55e",
                    boxShadow: "0 6px 14px rgba(34,197,94,.25)",
                    transform: "translateY(-1px)",
                    background: "#f0fdf4",
                  }
                : {};
              return (
                <button
                  key={c.id}
                  onClick={() => setSelected(c)}
                  style={{ ...baseStyle, ...selStyle }}
                >
                  <div
                    style={{
                      width: 80,
                      height: 80,
                      margin: "0 auto",
                      background: "#f3f4f6",
                      borderRadius: 8,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: isSel
                        ? "2px solid #22c55e"
                        : "2px solid transparent",
                      overflow: "hidden",
                    }}
                  >
                    {c.photo_url ? (
                      <img
                        src={c.photo_url}
                        alt={c.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <span style={{ fontSize: 28, color: "#2563eb" }}>👤</span>
                    )}
                  </div>
                  <div
                    style={{ marginTop: 8, fontWeight: 600, fontSize: 14, color: "#0f172a" }}
                  >
                    {c.name}
                  </div>
                  {isSel && (
                    <div
                      style={{ fontSize: 12, color: "#16a34a", marginTop: 4, fontWeight: 500 }}
                    >
                      Selecionado
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        <div style={{ marginTop: 20 }}>
          <button
            onClick={handleConfirmVote}
            disabled={sending || !selected}
            style={{
              background: "#22c55e",
              color: "white",
              fontWeight: 600,
              padding: "10px 20px",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
            }}
          >
            {sending ? "Enviando voto..." : "Confirmar Voto"}
          </button>
        </div>
      </div>
    </div>
  );
}
