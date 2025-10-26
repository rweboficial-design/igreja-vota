import { useEffect, useMemo, useState } from "react";

/** Hook que busca a lista de membros na Function `members`
 *  e devolve um Map: id (string) => name (string)
 */
export function useMembersMap() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const r = await fetch("/.netlify/functions/members", { cache: "no-store" });
        const data = await r.json();
        const list = Array.isArray(data) ? data : data?.members || [];
        if (alive) setMembers(list);
      } catch (e) {
        console.error("Falha ao carregar membros:", e);
        if (alive) setMembers([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const byId = useMemo(() => {
    const m = new Map();
    for (const it of members) {
      const id = it?.id ?? it?._id ?? it?.codigo ?? it?.member_id ?? null;
      const name = (it?.name || "").trim();
      if (id && name) m.set(String(id), name);
    }
    return m;
  }, [members]);

  return { byId, loading };
}
