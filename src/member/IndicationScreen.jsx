import React, { useEffect, useState, useRef } from "react";
import useStore from "../store";

export default function IndicationPage() {
  const { role_id, setStage } = useStore();
  const [members, setMembers] = useState([]);
  const [selected, setSelected] = useState([]);
  const [sending, setSending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const did = useRef(false);

  // Evita duplicar lista
  async function loadMembers() {
    try {
      const res = await fetch("/api/members");
      const data = await res.json();
      if (Array.isArray(data)) {
        // deduplica por id ou nome
        const map = new Map();
        for (const m of data) {
          const key = m.id || m.name.toLowerCase();
          if (!map.has(key)) map.set(key, m);
        }
        setMembers([...map.values()]);
      } else setMembers([]);
    } catch (e) {
      console.error("Falha ao carregar membros", e);
    }
  }

  useEffect(() => {
    if (did.current) return;
    did.current = true;
    loadMembers();
  }, []);

  const toggleSelect = (m) => {
    if (selected.find((s) => s.id === m.id)) {
      setSelected(selected.filter((s) => s.id !== m.id));
    } else {
      if (selected.length >= 3) {
        alert("Você pode indicar no máximo 3 pessoas.");
        return;
      }
      setSelected([...selected, m]);
    }
  };

  async function handleConfirmIndication() {
    if (selected.length === 0) {
      alert("Selecione até 3 nomes antes de confirmar.");
      return;
    }

    // feedback instantâneo
    setSending(true);
    setShowSuccess(true);

    // muda para tela Aguardar rapidamente
    setTimeout(() => setStage("none"), 1000);

    // envio em segundo plano
    try {
      await fetch("/api/indications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role_id,
          nominees: selected.map((x) => x.id),
        }),
      });
    } catch (e) {
      console.error("Falha ao registrar indicação:", e);
    }
  }

  return (
    <div>
      <h2>Indique até 3 membros</h2>
      {showSuccess && (
        <div className="modal">
          <div className="modal-body">
            <h4>Indicação registrada!</h4>
            <p>Obrigado. Aguarde o próximo passo…</p>
          </div>
        </div>
      )}

      <div className="grid">
        {members.map((m) => (
          <div
            key={m.id}
            className={`card ${
              selected.find((s) => s.id === m.id) ? "selected" : ""
            }`}
            onClick={() => toggleSelect(m)}
          >
            <img
              src={m.photo_url || "/logo.png"}
              alt={m.name}
              style={{
                width: 80,
                height: 80,
                objectFit: "cover",
                borderRadius: 8,
              }}
            />
            <div style={{ marginTop: 6 }}>{m.name}</div>
          </div>
        ))}
      </div>

      <div className="row" style={{ marginTop: 20 }}>
        <button
          onClick={handleConfirmIndication}
          disabled={sending || selected.length === 0}
        >
          {sending ? "Enviando…" : "Confirmar Indicação"}
        </button>
      </div>
    </div>
  );
}
