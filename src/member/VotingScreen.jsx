import React, { useMemo, useState } from "react";
import MemberCard from "../components/MemberCard";
import { dedupeMembers } from "../utils/members";

export default function Votar({ candidatos = [], onConfirm }) {
  const list = useMemo(() => dedupeMembers(candidatos), [candidatos]);
  const [chosen, setChosen] = useState(null);

  return (
    <div className="page">
      <h1>Vote em 1 membro</h1>

      <div className="members-grid">
        {list.map((m) => {
          const mKey = m.id ?? m._id ?? m.codigo ?? m.name;
          return (
            <MemberCard
              key={mKey}
              member={m}
              selected={chosen === mKey}
              onClick={() => setChosen(mKey)}
            />
          );
        })}
      </div>

      <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
        <button
          disabled={!chosen}
          onClick={() => onConfirm?.(chosen)}
          className="primary"
        >
          Confirmar voto
        </button>
      </div>
    </div>
  );
}
