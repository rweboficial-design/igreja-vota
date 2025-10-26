// src/pages/Results.jsx (versão somente leitura para membros)
import React, { useEffect, useMemo, useState } from 'react'
import { api } from '../api'
import { useMembersMap } from '../utils/useMembersMap'

export default function Results() {
  const { byId: memberNames } = useMembersMap()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [groups, setGroups] = useState([])

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const [mins, ros] = await Promise.all([api('ministries'), api('roles')])
        if (!alive) return
        const minsArr = Array.isArray(mins) ? mins : []
        const rolesArr = Array.isArray(ros) ? ros : []
        const ministryNameById = new Map(minsArr.map(m => [String(m.id), m.name ?? '']))
        const all = await Promise.all(
          rolesArr.map(async (role) => {
            const rid = role.id
            let data
            try { data = await api(`results?role_id=${rid}`) }
            catch { data = await api(`indication?role_id=${rid}`) }
            const list = Array.isArray(data) ? data : (data?.results || data?.ranking || [])
            const rows = list
              .map(item => {
                const id = item.candidate_id ?? item.id ?? item.nominee_id ?? item.member_id ?? String(item)
                const count = Number(item.votes ?? item.indications ?? item.count ?? item.total ?? 0)
                const name = memberNames.get(String(id)) ?? item.name ?? String(id)
                return { id: String(id), name, count }
              })
              .filter(r => r.count > 0)
              .sort((a,b) => b.count - a.count)
            return {
              ministryId: String(role.ministry_id ?? ''),
              ministryName: ministryNameById.get(String(role.ministry_id ?? '')) ?? 'Sem ministério',
              roleId: String(rid),
              roleName: role.name ?? 'Cargo',
              rows
            }
          })
        )
        const nonEmpty = all.filter(g => g.rows.length > 0)
        if (alive) setGroups(nonEmpty)
      } catch (e) {
        console.error(e)
        if (alive) setError('Não foi possível carregar os resultados.')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [memberNames])

  const groupsByMinistry = useMemo(() => {
    const map = new Map()
    for (const g of groups) {
      const key = g.ministryId
      if (!map.has(key)) map.set(key, { ministryName: g.ministryName, roles: [] })
      map.get(key).roles.push(g)
    }
    return Array.from(map.values())
      .sort((a,b) => a.ministryName.localeCompare(b.ministryName, 'pt-BR'))
      .map(m => ({ ...m, roles: m.roles.sort((a,b) => a.roleName.localeCompare(b.roleName, 'pt-BR')) }))
  }, [groups])

  if (loading) return <div style={{ padding:16 }}>Carregando resultados…</div>
  if (error)   return <div style={{ padding:16, color:'#fca5a5' }}>{error}</div>

  return (
    <div style={{ padding: 16 }}>
      <h2>Resultados gerais (por Ministério → Cargo)</h2>
      <p style={{ color: '#9ca3af', marginTop: 4 }}>
        Atualizado: {new Date().toLocaleString()}
      </p>

      {groupsByMinistry.length === 0 && (
        <p style={{ marginTop: 12 }}>Ainda não há votos/indicações para exibir.</p>
      )}

      {groupsByMinistry.map((min, mi) => (
        <section key={mi} style={{ marginTop: 20 }}>
          <h3 style={{ marginBottom: 8 }}>{min.ministryName}</h3>
          {min.roles.map(role => (
            <div key={role.roleId} style={{ marginBottom: 16 }}>
              <h4 style={{ margin: '6px 0' }}>{role.roleName}</h4>
              <table style={{ width:'100%', maxWidth: 640, borderCollapse:'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign:'left', padding:'6px 8px' }}>Posição</th>
                    <th style={{ textAlign:'left', padding:'6px 8px' }}>Membro</th>
                    <th style={{ textAlign:'right', padding:'6px 8px' }}>Votos</th>
                  </tr>
                </thead>
                <tbody>
                  {role.rows.map((r, idx) => (
                    <tr key={r.id} style={{ borderTop:'1px solid rgba(255,255,255,.1)' }}>
                      <td style={{ padding:'6px 8px' }}>{idx + 1}º</td>
                      <td style={{ padding:'6px 8px' }}>{r.name}</td>
                      <td style={{ padding:'6px 8px', textAlign:'right' }}>{r.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </section>
      ))}
    </div>
  )
}
