// src/store.js
import { useEffect, useState, useCallback } from 'react';
import { api } from './api';

const DEFAULT_SESSION = { stage: 'none', ministry_id: '', role_id: '' };

export default function useStore() {
  // Perfil com persistência no navegador
  const [userType, _setUserType] = useState(() => {
    try {
      const saved = localStorage.getItem('profile');
      return saved === 'tech' ? 'tech' : 'member';
    } catch {
      return 'member';
    }
  });

  const setUserType = useCallback((type) => {
    const next = type === 'tech' ? 'tech' : 'member';
    _setUserType(next);
    try { localStorage.setItem('profile', next); } catch {}
  }, []);

  // Sessão (estágio, ministério e cargo ativos)
  const [session, setSession] = useState(DEFAULT_SESSION);

  // Permitir selecionar perfil via URL (?profile=tech|member)
  useEffect(() => {
    try {
      const p = new URLSearchParams(window.location.search).get('profile');
      if (p === 'tech' || p === 'member') setUserType(p);
    } catch {}
  }, [setUserType]);

  // Polling dinâmico da sessão
  useEffect(() => {
    let alive = true;
    let timer = null;

    const tick = async () => {
      let stageForInterval = 'none';
      try {
        const s = await api('session'); // GET /.netlify/functions/session
        if (!alive) return;
        const next = {
          stage: String(s?.stage || 'none'),
          ministry_id: String(s?.ministry_id || ''),
          role_id: String(s?.role_id || ''),
        };
        stageForInterval = next.stage;
        setSession(prev =>
          JSON.stringify(prev) === JSON.stringify(next) ? prev : next
        );
      } catch (e) {
        console.error('poll session error', e);
      } finally {
        if (!alive) return;
        const delay =
          stageForInterval === 'indication' || stageForInterval === 'voting'
            ? 800
            : 1400;
        timer = setTimeout(tick, delay);
      }
    };

    tick();
    return () => { alive = false; if (timer) clearTimeout(timer); };
  }, []);

  return {
    userType,
    setUserType,
    session,
    setSession,
  };
}
