import React from "react";
import useStore from "../store";

export default function TopBar() {
  const { member, isTech, logout } = useStore();

  return (
    <div
      style={{
        width: "100%",
        background: "#0b1220",
        color: "#e2e8f0",
        padding: "10px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 100,
        borderBottom: "1px solid #1f2937",
      }}
    >
      <div style={{ fontWeight: 700 }}>Igreja Vota</div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {isTech ? (
          <span style={{ fontSize: 14, color: "#93c5fd" }}>Técnico</span>
        ) : member ? (
          <span style={{ fontSize: 14, color: "#93c5fd" }}>{member.name}</span>
        ) : null}
        <button
          onClick={logout}
          style={{
            background: "transparent",
            color: "#f87171",
            border: "1px solid #374151",
            borderRadius: 6,
            padding: "6px 10px",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Sair
        </button>
      </div>
    </div>
  );
}
