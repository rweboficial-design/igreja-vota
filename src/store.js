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
// dentro do seu hook useStore():

// 3.1) estado com persistência no navegador
const [userType, _setUserType] = React.useState(() => {
  try {
    const saved = localStorage.getItem('profile')
    return saved === 'tech' ? 'tech' : 'member'
  } catch {
    return 'member'
  }
})

// 3.2) setter que salva no localStorage
const setUserType = React.useCallback((type) => {
  const next = type === 'tech' ? 'tech' : 'member'
  _setUserType(next)
  try { localStorage.setItem('profile', next) } catch {}
}, [])

// 3.3) (opcional) permitir trocar via URL ?profile=tech|member
React.useEffect(() => {
  try {
    const p = new URLSearchParams(window.location.search).get('profile')
    if (p === 'tech' || p === 'member') {
      setUserType(p)
    }
  } catch {}
}, [setUserType])

// 3.4) exporte no return do store
return {
  userType, setUserType,
  // ... já existentes: session, setSession, etc
}

}
