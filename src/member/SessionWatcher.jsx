import { useEffect } from "react";
import useStore from "../store";

export default function SessionWatcher() {
  const { stage, setStage, isTech } = useStore();

  useEffect(() => {
    if (isTech) return; // técnico não precisa mudar de tela
    let stop = false;

    async function tick() {
      try {
        const res = await fetch("/api/session");
        const s = await res.json();
        const next = s?.stage || "none";
        const ministry_id = s?.ministry_id || "";
        const role_id = s?.role_id || "";
        if (!stop && next !== stage) {
          setStage(next, ministry_id, role_id);
        }
      } catch (e) {
        // silencioso
      }
    }

    // roda já e a cada 3s
    tick();
    const it = setInterval(tick, 3000);
    return () => {
      stop = true;
      clearInterval(it);
    };
  }, [stage, setStage, isTech]);

  return null;
}
