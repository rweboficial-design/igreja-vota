import React, { useEffect, useState } from "react";
import useStore from "../store";
import { api } from "../api";
import ConfigPage from "./ConfigPage";
import MinistriesPage from "./MinistriesPage";
import RolesPage from "./RolesPage";
import MembersPage from "./MembersPage";

// === NOVO BLOCO DE ESTADO E TELA DE ACOMPANHAMENTO ===
function ProgressPanel({ session }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  // busca status da votação ativa
  async function fetchStatus() {
    setLoading(true);
    try {
      const res = await fetch("/api/status");
      const data = await res.json();
      setStatus(data);
    } catch (e) {
      console.error("Falha ao buscar status:", e);
    } finally {
      setLoading(false);
    }
  }

  // atualiza a cada 5 segundos
  useEffect(() => {
    fetchStatus();
    const timer = setInterval(fetchStatus, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ marginTop: 24 }}>
      <h3>📊 Andamento da Votação</h3>
      {loading && <p>Atualizando...</p>}
      {status ? (
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            padding: 12,
            marginTop: 8,
            background: "#f9fafb",
          }}
        >
          <p>
            <strong>Ministério:</strong> {status.ministry_name || "-"}
          </p>
          <p>
            <strong>Cargo:</strong> {status.role_name || "-"}
          </p>
          <p>
            <strong>Membros logados:</strong> {status.total_members || 0}
          </p>
          <p>
            <strong>Votos recebidos:</strong> {status.voted_count || 0}
          </p>

          <div
            style={{
              background: "#e5e7eb",
              borderRadius: 6,
              overflow: "hidden",
              height: 14,
              marginTop: 8,
            }}
          >
            <div
              style={{
                width: `${
                  status.total_members
                    ? (status.voted_count / status.total_members) * 100
                    : 0
                }%`,
                background: "#22c55e",
                height: "100%",
                transition: "width .3s",
              }}
            />
          </div>

          <p style={{ fontSize: 12, marginTop: 4, color: "#555" }}>
            {status.total_members
              ? `${status.voted_count}/${status.total_members} membros já votaram`
              : "Aguardando dados dos membros..."}
          </p>
        </div>
      ) : (
        <p>Nenhuma votação ativa no momento.</p>
      )}
    </div>
  );
}

// =====================================================

export default function TechDashboard() {
  const { session, setStage } = useStore();
  const [tab, setTab] = useState("control");
  const [ministries, setMinistries] = useState([]);
  const [roles, setRoles] = useState([]);
  const [selectedMin, setSelectedMin] = useState("");
  const [selectedRole, setSelectedRole] = useState("");

  useEffect(() => {
    api("ministries").then(setMinistries);
    api("roles").then(setRoles);
  }, []);

  const startIndication = () => setStage("indication", selectedMin, selectedRole);
  const startVoting = () => setStage("voting", selectedMin, selectedRole);
  const goIdle = () => setStage("none");

  return (
    <div style={{ padding: 16 }}>
      <nav className="tabs" style={{ marginBottom: 16 }}>
        {["control", "config", "ministries", "roles", "members"].map((t) => (
          <button
            key={t}
            className={tab === t ? "active" : ""}
            onClick={() => setTab(t)}
            style={{
              marginRight: 8,
              padding: "6px 12px",
              borderRadius: 6,
              border: "1px solid #ccc",
              background: tab === t ? "#22c55e" : "#fff",
              color: tab === t ? "#fff" : "#333",
              cursor: "pointer",
            }}
          >
            {t === "control" && "Controle"}
            {t === "config" && "Configurações"}
            {t === "ministries" && "Ministérios"}
            {t === "roles" && "Cargos"}
            {t === "members" && "Membros"}
          </button>
        ))}
      </nav>

      {tab === "control" && (
        <div>
          <h2>Controle da Sessão</h2>
          <div className="row" style={{ marginTop: 12 }}>
            <select
              value={selectedMin}
              onChange={(e) => setSelectedMin(e.target.value)}
            >
              <option value="">Selecione o ministério…</option>
              {ministries.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              <option value="">Selecione o cargo…</option>
              {roles
                .filter((r) => !selectedMin || r.ministry_id === selectedMin)
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="row" style={{ marginTop: 12 }}>
            <button
              onClick={startIndication}
              disabled={!selectedMin || !selectedRole}
              style={{
                marginRight: 6,
                padding: "6px 12px",
                borderRadius: 6,
                border: "1px solid #22c55e",
                background: "#22c55e",
                color: "#fff",
              }}
            >
              Iniciar Indicação
            </button>
            <button
              onClick={startVoting}
              disabled={!selectedMin || !selectedRole}
              style={{
                marginRight: 6,
                padding: "6px 12px",
                borderRadius: 6,
                border: "1px solid #2563eb",
                background: "#2563eb",
                color: "#fff",
              }}
            >
              Iniciar Votação
            </button>
            <button
              onClick={goIdle}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: "1px solid #ccc",
              }}
            >
              Aguardar
            </button>
          </div>

          <div className="row" style={{ marginTop: 16 }}>
            <a
              href="/api/report"
              target="_blank"
              rel="noreferrer"
              style={{
                color: "#2563eb",
                textDecoration: "underline",
                fontWeight: 600,
              }}
            >
              Baixar Relatório (PDF)
            </a>
          </div>

          {/* BLOCO DE ANDAMENTO */}
          <ProgressPanel session={session} />

          <pre style={{ marginTop: 24, fontSize: 12, background: "#f1f5f9" }}>
            sessão: {JSON.stringify(session, null, 2)}
          </pre>
        </div>
      )}

      {tab === "config" && <ConfigPage />}
      {tab === "ministries" && <MinistriesPage />}
      {tab === "roles" && <RolesPage />}
      {tab === "members" && <MembersPage />}
    </div>
  );
}
