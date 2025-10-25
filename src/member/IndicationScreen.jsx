import React, { useEffect, useState, useRef } from "react";
import useStore from "../store";

function normalizeItem(item, idx = 0) {
  // aceita tanto array quanto objeto
  if (Array.isArray(item)) {
    const id = item[0] ?? `tmp_${idx}`;
    const name = item[1] ?? String(item[0] ?? idx);
    const photo_url = item[2] ?? "";
    const active = String(item[3]) === "1" || item[3] === true;
    return { id, name, photo_url, active };
  }
  const id =
    item?.id ??
    item?.ID ??
    item?.key ??
    (item?.name ? item.name.toLowerCase().replace(/\s+/g, "_") : `tmp_${idx}`);
  const name = item?.name ?? String(id);
  const photo_url = item?.photo_url ?? item?.photo ?? "";
  const active =
    item?.active === true ||
    item?.active === 1 ||
    item?.active === "1" ||
    item?.Active === true;
  return { id, name, photo_url, active };
}

export default function IndicationScreen() {
  const { role_id, setStage, member } = useStore();
  const [members, setMembers] = useState([]);
  const [selected, setSelected] = useState([]);
  const [sending, setSending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const did = useRef(false);

  async function loadMembers() {
    try {
      const res = await fetch("/api/members");
      const data = await res.json();

      const normalized = Array.isArray(data)
        ? data.map((it, i) => normalizeItem(it, i))
        : [];

      const actives = normalized.filter((m) => m && m.name && (m.active ?? true));

      // remove duplicados
      const map = new Map();
      for (const m of actives) {
        const key = (m.id && String(m.id).trim()) || m.name.toLowerCase();
        if (!map.has(key)) map.set(key, m);
      }

      const list = Array.from(map.values()).sort((a, b) =>
        a.name.localeCompare(b.name, "pt-BR")
      );

      setMembers(list);
    } catch (e) {
      console.error("Falha ao carregar membros", e);
      setMembers([]);
    }
  }

  useEffect(() => {
    if (did.current) return;
    did.current = true;
    loadMembers();
  }, []);

  const toggleSelect = (m) => {
    const key = m.id || m.name.toLowerCase();
    const isSelected = selected.some(
      (s) => (s.id || s.name.toLowerCase()) === key
    );

    if (isSelected) {
      setSelected(selected.filter((s) => (s.id || s.name.toLowerCase()) !== key));
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

    // muda para tela aguardando
    setTimeout(() => setStage("none"), 1200);

    // envio para API (em segundo plano)
    try {
      await fetch("/api/indications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role_id,
          nominees: selected.map((x) => x.id || x.name),
          member_id: member?.id || "anonymous",
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
        <div
          className="modal"
          style={{
            background: "rgba(0,0,0,0.4)",
            position: "fixed",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
        >
          <div
            className="modal-body"
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 24,
              maxWidth: 300,
              textAlign: "center",
              boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            }}
          >
            <h4 style={{ marginBottom: 8 }}>Indicação registrada!</h4>
            <p>Obrigado. Aguarde o próximo passo…</p>
          </div>
        </div>
      )}

      {members.length === 0 ? (
        <p>Nenhum membro disponível.</p>
      ) : (
        <div
          className="grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
            gap: 12,
            marginTop: 16,
          }}
        >
          {members.map((m) => {
            const key = m.id || m.name.toLowerCase();
            const isSel = selected.some(
              (s) => (s.id || s.name.toLowerCase()) === key
            );

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
                type="button"
                key={key}
                onClick={() => toggleSelect(m)}
                aria-pressed={isSel}
                style={{ ...baseStyle, ...selStyle }}
              >
                <img
                  src={m.photo_url || "/logo.png"}
                  alt={m.name}
                  style={{
                    width: 80,
                    height: 80,
                    objectFit: "cover",
                    borderRadius: 8,
                    display: "block",
                    margin: "0 auto",
                    border: isSel
                      ? "2px solid #22c55e"
                      : "2px solid transparent",
                  }}
                />
                <div style={{ marginTop: 8, fontWeight: 700 }}>{m.name}</div>
                {isSel ? (
                  <div
                    style={{ fontSize: 12, color: "#16a34a", marginTop: 4 }}
                  >
                    Selecionado
                  </div>
                ) : (
                  <div style={{ fontSize: 12, opacity: 0.7 }}>
                    Toque para selecionar
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      <div className="row" style={{ marginTop: 20 }}>
        <button
          onClick={handleConfirmIndication}
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
          {sending ? "Enviando…" : `Confirmar Indicação (${selected.length}/3)`}
        </button>
      </div>
    </div>
  );
}
