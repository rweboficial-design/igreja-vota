import React, { useEffect, useState, useRef } from "react";
import useStore from "../store";
import TopBar from "../components/TopBar";
import SessionWatcher from "./SessionWatcher";

export default function IndicationScreen() {
  const { role_id, setStage, member, isTech } = useStore();
  const [members, setMembers] = useState([]);
  const [selected, setSelected] = useState([]);
  const [sending, setSending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const did = useRef(false);

  const MAX_SELECTION = 3;

  async function loadMembers() {
    try {
      const res = await fetch("/api/members");
      const data = await res.json();
      if (Array.isArray(data)) {
        const list = data.map((m, i) => ({
          id: m.id || `m_${i}`,
          name: m.name || `Membro ${i + 1}`,
          photo_url: m.photo_url || "",
        }));
        setMembers(list);
      } else setMembers([]);
    } catch (e) {
      console.error("Falha ao carregar membros:", e);
    }
  }

  useEffect(() => {
    if (did.current) return;
    did.current = true;
    loadMembers();
  }, []);

  const handleSelect = (m) => {
    const exists = selected.find((x) => x.id === m.id);
    if (exists) setSelected(selected.filter((x) => x.id !== m.id));
    else {
      if (selected.length < MAX_SELECTION) setSelected([...selected, m]);
      else alert(`Você só pode indicar até ${MAX_SELECTION} membros.`);
    }
  };

  async function handleSend() {
    setErrorMsg("");
    if (selected.length === 0) {
      alert("Selecione pelo menos um membro antes de enviar.");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/indications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role_id,
          member_id: member?.id || "anonymous",
          nominees: selected.map((s) => s.id),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Não foi possível registrar as indicações.");
      }

      setShowSuccess(true);
      setTimeout(() => setStage("none"), 1000);
    } catch (e) {
      console.error("Erro ao enviar indicações:", e);
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
        <h2>Indique até {MAX_SELECTION} membros</h2>

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
              <h4 style={{ marginBottom: 8, color: "#0f172a" }}>
                Indicação enviada!
              </h4>
              <p style={{ color: "#334155" }}>Obrigado por participar.</p>
            </div>
          </div>
        )}

        {errorMsg && (
          <p style={{ color: "#ef4444", fontWeight: 600, marginTop: 8 }}>
            {errorMsg}
          </p>
        )}

        {members.length === 0 ? (
          <p style={{ color: "#e2e8f0" }}>Nenhum membro disponível.</p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
              gap: 12,
              marginTop: 16,
            }}
          >
            {members.map((m) => {
              const isSel = selected.some((x) => x.id === m.id);
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
                  key={m.id}
                  onClick={() => handleSelect(m)}
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
                    {m.photo_url ? (
                      <img
                        src={m.photo_url}
                        alt={m.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <span style={{ fontSize: 28, color: "#2563eb" }}>👤</span>
                    )}
                  </div>
                  <div
                    style={{ marginTop: 8, fontWeight: 600, fontSize: 14, color: "#0f172a" }}
                  >
                    {m.name}
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
            onClick={handleSend}
            disabled={sending || selected.length === 0}
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
            {sending ? "Enviando..." : "Enviar Indicações"}
          </button>
        </div>
      </div>
    </div>
  );
}
