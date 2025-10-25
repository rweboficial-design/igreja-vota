import React from "react";

export default function MemberCard({
  member,
  selected = false,
  disabled = false,
  onClick,
}) {
  const handleClick = () => {
    if (!disabled && onClick) onClick(member);
  };

  return (
    <button
      className={[
        "member-card",
        selected ? "member-card--selected" : "",
        disabled ? "member-card--disabled" : "",
      ].join(" ")}
      onClick={handleClick}
      type="button"
      aria-pressed={selected}
      aria-disabled={disabled}
    >
      <div className="member-card__photo">
        {member.photoUrl ? (
          <img src={member.photoUrl} alt={`Foto de ${member.name}`} />
        ) : (
          <div className="member-card__avatar-fallback" aria-hidden>
            <span>{getInitials(member.name)}</span>
          </div>
        )}
      </div>

      {/* NOME aparece UMA VEZ: abaixo da foto */}
      <div className="member-card__name" title={member.name}>
        {member.name}
      </div>
    </button>
  );
}

function getInitials(name = "") {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map(p => p[0]?.toUpperCase() ?? "").join("");
}
