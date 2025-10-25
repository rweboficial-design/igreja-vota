import React from "react";

export default function AwaitScreen() {
  return (
    <div
      style={{
        height: "100vh",
        background: "#0f172a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "#f9fafb",
        textAlign: "center",
      }}
    >
      <img
        src="/logo.png"
        alt="Logo da Igreja"
        style={{ width: 120, marginBottom: 20 }}
        onError={(e) => (e.target.style.display = "none")}
      />
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 10 }}>
        Aguarde...
      </h2>
      <p style={{ color: "#94a3b8" }}>
        Aguardando o início da próxima etapa de votação.
      </p>
    </div>
  );
}
