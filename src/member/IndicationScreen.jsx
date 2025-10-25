import React, { useEffect, useState, useRef } from "react";
import useStore from "../store";

function normalizeItem(item, idx = 0) {
  // Aceita tanto array quanto objeto
  if (Array.isArray(item)) {
    // Esperado: [id, name, photo_url, active]
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

export default function IndicationPage() {
  const { role_id, setStage } = useStore();
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

      // só ativos
      const actives = normalized.filter((m) => m && m.name && (m.active ?? true));

      // dedup por id (ou nome minúsculo)
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
    const isSelected = selected.some((s) => (s.id || s.name.toLowerCase()) === key);
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

    // muda para tela Aguardar rapidamente
    setTimeout(() => setStage("none"), 1000);

    // envio em segundo plano (sem travar a UI)
    try {
      await fetch("/api/indications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role_id,
          nominees: selected.map((x) => x.id || x.name),
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
        <div className="modal" role="dialog" aria-modal="true">
          <div className="modal-body">
            <h4>Indicação registrada!</h4>
            <p>Obrigado. Aguarde o próximo passo…</p>
          </div>
        </div>
      )}

      {members.length === 0 ? (
        <p>Nenhum membro disponível.</p>
      ) : (
        <div className="grid">
          {members.map((m) => {
            const key = m.id || m.name.toLowerCase();
            const isSel = selected.some(
              (s) => (s.id || s.name.toLowerCase()) === key
            );
            return (
              <button
                type="button"
                key={key}
                className={`card ${isSel ? "selected" : ""}`}
                onClick={() => toggleSelect(m)}
                aria-pressed={isSel}
                style={{ cursor: "pointer", textAlign: "center" }}
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
                  }}
                />
                <div style={{ marginTop: 6, fontWeight: 600 }}>{m.name}</div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>
                  {isSel ? "Selecionado" : "Toque para selecionar"}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="row" style={{ marginTop: 20 }}>
        <button
          onClick={handleConfirmIndication}
          disabled={sending || selected.length === 0}
        >
          {sending ? "Enviando…" : `Confirmar Indicação (${selected.length}/3)`}
        </button>
      </div>
    </div>
  );
}
