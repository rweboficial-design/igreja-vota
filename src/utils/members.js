function normalizeMembers(input) {
  if (!Array.isArray(input)) return [];
  const byId = new Map();
  for (const raw of input) {
    const id = raw?.id ?? raw?._id ?? raw?.codigo ?? raw?.member_id ?? raw?.name;
    const name = (typeof raw?.name === "string" ? raw.name : String(id ?? "")).trim();
    if (!id || !name) continue;
    const key = String(id);
    if (!byId.has(key)) {
      byId.set(key, { id: key, name, photo_url: raw?.photo_url ?? raw?.photoUrl ?? null });
    }
  }
  return Array.from(byId.values());
}


// Remove duplicados por ID (preferível). Se não tiver ID confiável, cai para nome normalizado.
export function dedupeMembers(list = []) {
  const mapById = new Map();
  const seenNames = new Set();

  for (const m of list) {
    const id = m.id ?? m._id ?? m.codigo ?? null;
    const normName = normalizeName(m.name);

    if (id != null) {
      if (!mapById.has(id)) mapById.set(id, { ...m, name: formatName(m.name) });
    } else {
      if (!seenNames.has(normName)) {
        seenNames.add(normName);
        mapById.set(normName, { ...m, name: formatName(m.name) });
      }
    }
  }
  return Array.from(mapById.values());
}

export function formatName(name = "") {
  // Remove espaços duplos, corrige capitalização simples
  const cleaned = name.replace(/\s+/g, " ").trim();
  // Se já vier com maiúsculas corretas, mantém; caso contrário, capitaliza palavras >2 letras
  return cleaned
    .toLowerCase()
    .split(" ")
    .map(w => (w.length > 2 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function normalizeName(name = "") {
  return name
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/\s+/g, " ")
    .trim();
}

