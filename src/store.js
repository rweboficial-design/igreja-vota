// src/store.js
import React from 'react';
import { api } from './api';

const SESSION_POLL_MS = Number(import.meta.env.VITE_SESSION_POLL_MS || 1500);

export default function useStore() {
  // --- PERFIL com persistência no navegador ---
  const [userType, _setUserType] = React.useState(() => {
    try {
      const saved = localStorage.getItem('profile');
      return saved === 'tech' ? 'tech' : 'member';
    } catch {
      return 'member';
    }
  });

  const setUserType = React.useCallback((type) => {
    const next = type === 'tech' ? 'tech' : 'member';
    _setUserType(next);
    try {
      localStorage.setItem('profile', next);
    } catch {}
  }, []);

  // --- SESSION ---
  const [session, setSession] = React.useState({
    stage: 'none',
    ministry_id: '',
    role_id: '',
  });

  // ---- POLLING da sessão (dinâmico) ----
import React from 'react';
import { api } from './api';

export default function useStore(){
  // ... seu estado de userType, session, setSession etc. ficam como estão

  React.useEffect(() => {
    let alive = true;
    let timer = null;

    const tick = async () => {
      try {
        const s = await api('session'); // GET /.netlify/functions/session
        if (!alive) return;
        const next = {
          stage: String(s?.stage || 'none'),
          ministry_id: String(s?.ministry_id || ''),
          role_id: String(s?.role_id || ''),
        };
        setSession(prev =>
          JSON.stringify(prev) === JSON.stringify(next) ? prev : next
        );
      } catch (e) {
        console.error('poll session error', e);
      } finally {
        if (!alive) return;
        // ⬇️ intervalo mais curto quando a sessão está ativa
        const ms = (s?.stage === 'indication' || s?.stage === 'voting') ? 800 : 1400;
        timer = setTimeout(tick, ms);
      }
    };

    tick();
    return () => { alive = false; if (timer) clearTimeout(timer); };
  }, []);

  // return { userType, setUserType, session, setSession, ... }
}


  // --- ALTERAR perfil via URL (ex: ?profile=tech) ---
  React.useEffect(() => {
    try {
      const p = new URLSearchParams(window.location.search).get('profile');
      if (p === 'tech' || p === 'member') {
        setUserType(p);
      }
    } catch {}
  }, [setUserType]);

  // --- EXPORT ---
  return {
    userType,
    setUserType,
    session,
    setSession,
  };
}
