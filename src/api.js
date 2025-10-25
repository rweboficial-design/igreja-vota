// src/api.js
export async function api(path, options) {
  // Usa as rotas /api/* (redirecionadas para Netlify Functions)
  const url = path.startsWith('/') ? `/api${path}` : `/api/${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  // Tenta decodificar JSON sempre, para expor erro legível
  let data = null;
  try {
    data = await res.json();
  } catch {
    // se não for JSON, joga o texto
    const txt = await res.text();
    throw new Error(`Falha na API ${url}: ${res.status} ${txt}`);
  }
  if (!res.ok) {
    throw new Error(data?.error || `Falha na API ${url}: status ${res.status}`);
  }
  return data;
}
