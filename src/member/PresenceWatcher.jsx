import { useEffect } from "react";
import useStore from "../store";

export default function PresenceWatcher() {
  const { member } = useStore();

  useEffect(() => {
    if (!member?.id) return;
    let stop = false;

    async function ping() {
      try {
        await fetch("/api/presence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ member_id: member.id, name: member.name }),
        });
      } catch {}
    }

    ping();
    const it = setInterval(ping, 30000); // a cada 30 s
    return () => {
      stop = true;
      clearInterval(it);
    };
  }, [member]);

  return null;
}
