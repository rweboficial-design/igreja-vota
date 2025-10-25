import React, { useState } from "react";
import useStore from "./store";

export default function HomeScreen() {
  const { setStage, setMember, setTech } = useStore();
  const [mode, setMode] = useState(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  function handleLogin() {
    if (mode === "member") {
      if (!name.trim()) {
        alert("Por favor, digite seu nome.");
        return;
      }
      setMember({ id: name.toLowerCase().replace(/\s+/g, "_"), name });
      setStage("none");
    } else if (mode === "tech") {
      if (password !== "123") {
        alert("Senha incorreta.");
        return;
      }
      setTech(true);
      setStage("tech");
    }
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "#0f172a",
        color: "#f9fafb",
        textAlign: "center",
        padding: 20,
      }}
    >
      <h1 style={{ fontSize: 28, marginBottom: 10 }}>Igreja Vota</h1>
      <p style={{ color: "#94a3b8", marginBottom: 40 }}>
        Escolha seu modo de acesso
      </p>

      {!mode && (
        <>
          <button
            onClick={() => setMode("member")}
            style={{
              background: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: 8,
              padding: "12px 24px",
              marginBottom: 10,
              fontSize: 16,
              fontWeight: 600,
              cursor: "pointer",
              width: 220,
            }}
          >
            Entrar como Membro
          </button>

          <button
            onClick={() => setMode("tech")}
            style={{
              background: "#22c55e",
              color: "white",
              border: "none",
              borderRadius: 8,
              padding: "12px 24px",
              fontSize: 16,
              fontWeight: 600,
              cursor: "pointer",
              width: 220,
            }}
          >
            Entrar como Técnico
          </button>
        </>
      )}

      {mode === "member" && (
        <div style={{ marginTop: 30 }}>
          <h3 style={{ marginBottom: 10 }}>Digite seu nome:</h3>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome completo"
            style={{
              padding: "10px 12px",
              borderRadius: 6,
              border: "1px solid #334155",
              background: "#1e293b",
              color: "#f9fafb",
              width: 240,
            }}
          />
          <div style={{ marginTop: 20 }}>
            <button
              onClick={handleLogin}
              style={{
                background: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: 6,
                padding: "10px 20px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Entrar
            </button>
            <button
              onClick={() => setMode(null)}
              style={{
                background: "transparent",
                color: "#9ca3af",
                border: "none",
                marginLeft: 10,
                cursor: "pointer",
              }}
            >
              Voltar
            </button>
          </div>
        </div>
      )}

      {mode === "tech" && (
        <div style={{ marginTop: 30 }}>
          <h3 style={{ marginBottom: 10 }}>Senha de Técnico:</h3>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Digite a senha"
            style={{
              padding: "10px 12px",
              borderRadius: 6,
              border: "1px solid #334155",
              background: "#1e293b",
              color: "#f9fafb",
              width: 240,
            }}
          />
          <div style={{ marginTop: 20 }}>
            <button
              onClick={handleLogin}
              style={{
                background: "#22c55e",
                color: "white",
                border: "none",
                borderRadius: 6,
                padding: "10px 20px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Entrar
            </button>
            <button
              onClick={() => setMode(null)}
              style={{
                background: "transparent",
                color: "#9ca3af",
                border: "none",
                marginLeft: 10,
                cursor: "pointer",
              }}
            >
              Voltar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
