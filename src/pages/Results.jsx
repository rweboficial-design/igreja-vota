import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../api';
import { useMembersMap } from '../utils/useMembersMap';
import useStore from '../store';

export default function Results() {
  const { memberId } = useStore();
  const [ministries, setMinistries] = useState([]);
  const [selectedMin, setSelectedMin] = useState('');
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState([]);
  const { byId: memberNames } = useMembersMap();

  // Carregar ministérios e cargos
  useEffect(() => {
    api('ministries').then(setMinistries);
    api('roles').then(setRoles);
  }, []);

  // Gera o relatório dos mais votados
  async function generateResults() {
    if (!selectedRole) return;
    setLoading(true);
    setError('');
    setResults([]);

    try {
      // busca os resultados (ou indicações agregadas)
      const data = await api(`results?role_id=${selectedRole}`).catch(() =>
        api(`indication?role_id=${selectedRole}`)
      );
      const list = Array.isArray(data)
        ? data
        : data?.results || data?.ranking || [];

      // normaliza
      const normalized = list
        .map((item) => {
          const id =
            item.candidate_id ??
            item.id ??
            item.nominee_id ??
            item.member_id ??
            String(item);
          const count =
            item.votes ?? item.indications ?? item.count ?? 0;
          const name =
            memberNames.get(String(id)) ?? item.name ?? String(id);
          return { id, name, count };
        })
        .sort((a, b) => b.count - a.count);

      setResults(normalized);

      // registra visualização no log
      await api('log_result_view', {
        method: 'POST',
        body: JSON.stringify({
          member_id: memberId || 'anon',
          ministry_id: selectedMin,
          role_id: selectedRole,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (err) {
      console.error(err);
      setError('Erro ao gerar resultados.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 16 }}>
      <h2>Resultados por Ministério</h2>

      <div className="row">
        <select
          value={selectedMin}
          onChange={(e) => setSelectedMin(e.target.value)}
        >
          <option value="">Selecione o ministério…</option>
          {ministries.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>

        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
        >
          <option value="">Selecione o cargo…</option>
          {roles
            .filter((r) => !selectedMin || r.ministry_id === selectedMin)
            .map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
        </select>

        <button
          onClick={generateResults}
          disabled={!selectedRole || loading}
        >
          {loading ? 'Gerando…' : 'Gerar resultados'}
        </button>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {results.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <h3>Mais votados</h3>
          <table
            style={{
              width: '100%',
              maxWidth: 520,
              borderCollapse: 'collapse',
            }}
          >
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '6px 8px' }}>
                  Posição
                </th>
                <th style={{ textAlign: 'left', padding: '6px 8px' }}>
                  Membro
                </th>
                <th style={{ textAlign: 'right', padding: '6px 8px' }}>
                  Votos
                </th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, idx) => (
                <tr
                  key={r.id}
                  style={{ borderTop: '1px solid rgba(255,255,255,.1)' }}
                >
                  <td style={{ padding: '6px 8px' }}>{idx + 1}º</td>
                  <td style={{ padding: '6px 8px' }}>{r.name}</td>
                  <td
                    style={{
                      padding: '6px 8px',
                      textAlign: 'right',
                    }}
                  >
                    {r.count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
