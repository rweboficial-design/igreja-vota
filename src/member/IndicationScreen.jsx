import React, { useMemo, useState } from "react";
import MemberCard from "../components/MemberCard";
import { dedupeMembers } from "../utils/members";

export default function Indicar({ allMembers = [], maxSelect = 3, onNext }) {
  // garante que a lista não tenha duplicados
  const members = useMemo(() => dedupeMembers(allMembers), [allMembers]);
  const [selectedIds, setSelectedIds] = useState([]);

  const toggle = (m) => {
    const isSelected = selectedIds.includes(m.id ?? m._id ?? m.codigo ?? m.name);
    if (isSelected) {
      setSelectedIds(prev => prev.filter(x => x !== (m.id ?? m._id ?? m.codigo ?? m.name)));
    } else {
      if (selectedIds.length >= maxSelect) return; // trava em 3
      setSelectedIds(prev => [...prev, (m.id ?? m._id ?? m.codigo ?? m.name)]);
    }
  };

  const reachedLimit = selectedIds.length >= maxSelect;

  return (
    <div className="page">
      <h1>Indique até {maxSelect} membros</h1>

      <div className="members-grid">
        {members.map((m) => {
          const mKey = m.id ?? m._id ?? m.codigo ?? m.name;
          const isSelected = selectedIds.includes(mKey);
          return (
            <MemberCard
              key={mKey}
              member={m}
              selected={isSelected}
              disabled={reachedLimit && !isSelected}
              onClick={toggle}
            />
          );
        })}
      </div>

      <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
        <button
          disabled={selectedIds.length === 0}
          onClick={() => onNext?.(selectedIds)}
          className="primary"
        >
          Continuar
        </button>
        <span className="muted">
          {selectedIds.length}/{maxSelect} selecionados
        </span>
      </div>
    </div>
  );
}
