// src/member/PresenceWatcher.jsx
import { useEffect } from 'react';
import useStore from '../store';

export default function PresenceWatcher() {
  const { member } = useStore(); // precisa ter { id, name } ou ao menos { name }

  useEffect(() => {
    if (!member?.id && !member?.name) return;

    let stop = false;

    async function ping() {
      try {
        await fetch('/api/presence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // Enviamos id e name; se id estiver vazio, o backend resolve pelo name
          body: JSON.stringify({ member_id: member.id || '', name: member.name || '' }),
        });
      } catch {
        // silencia falha intermitente
      }
    }

    // primeiro envio imediato
    ping();
    // depois a cada 45s (alinhado ao throttle do backend)
    const it = setInterval(ping, 45_000);

    return () => {
      stop = true;
      clearInterval(it);
    };
  }, [member?.id, member?.name]);

  return null;
}
