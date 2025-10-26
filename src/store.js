// src/store.js (trecho relevante)
import React from 'react';
import { api } from './api';

const SESSION_POLL_MS = Number(import.meta.env.VITE_SESSION_POLL_MS || 1500);

export default function useStore(){
  const [userType, setUserType] = React.useState('member'); // ou conforme seu login
  const [session, setSession] = React.useState({ stage: 'none', ministry_id: '', role_id: '' });

  React.useEffect(() => {
    let alive = true;
    let t = null;

    const tick = async () => {
      try {
        const s = await api('session');  // GET /.netlify/functions/session
        if (!alive) return;
        const next = {
          stage: String(s?.stage || 'none'),
          ministry_id: String(s?.ministry_id || ''),
          role_id: String(s?.role_id || ''),
        };
        setSession(prev => JSON.stringify(prev) === JSON.stringify(next) ? prev : next);
      } catch (e) {
        console.error('poll session error', e);
      } finally {
        if (alive) t = setTimeout(tick, SESSION_POLL_MS);
      }
    };

    tick();
    return () => { alive = false; if (t) clearTimeout(t); };
  }, []);

  return {
    userType, setUserType,
    session, setSession,
  };
}
