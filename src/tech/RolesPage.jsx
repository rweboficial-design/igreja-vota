import React, { useEffect, useState } from 'react';

export default function RolesPage(){
  const [ministries, setMinistries] = useState([]);
  const [current, setCurrent] = useState('');
  const [roles, setRoles] = useState([]);
  const [name, setName] = useState('');
  const [err, setErr] = useState('');

  async function loadMinistries(){
    const r = await fetch('/api/ministries');
    const data = await r.json();
    setMinistries(Array.isArray(data)?data:[]);
    if (!current && data?.length) setCurrent(data[0].id);
  }
  async function loadRoles(ministry_id){
    if (!ministry_id) { setRoles([]); return; }
    const r = await fetch(`/api/roles?ministry_id=${encodeURIComponent(ministry_id)}`);
    const data = await r.json();
    setRoles(Array.isArray(data)?data:[]);
  }

  useEffect(()=>{ loadMinistries(); },[]);
  useEffect(()=>{ loadRoles(current); },[current]);

  async function add(){
    if(!name.trim() || !current) return alert('Selecione o ministério e digite o nome do cargo');
    const r = await fetch('/api/roles', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ ministry_id: current, name: name.trim() })
    });
    const data = await r.json();
    if (data && data.ok) { setName(''); await loadRoles(current); }
    else setErr('Não foi possível adicionar.');
  }

  async function rename(id, oldName){
    const n = prompt('Novo nome do cargo:', oldName||'');
    if (n===null) return;
    await fetch('/api/roles',{ method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id, name:n }) });
    await loadRoles(current);
  }

  async function del(id){
    if(!confirm('Remover este cargo?')) return;
    await fetch('/api/roles',{ method:'DELETE', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id }) });
    await loadRoles(current);
  }

  return (
    <div>
      <h3>Cargos</h3>

      <div className="row" style={{gap:8, marginBottom:12}}>
        <select value={current} onChange={e=>setCurrent(e.target.value)}>
          <option value="">Selecione um ministério…</option>
          {ministries.map(m=> <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <input placeholder="Nome do cargo" value={name} onChange={e=>setName(e.target.value)} style={{flex:1}}/>
        <button onClick={add}>Incluir cargo</button>
      </div>

      {err && <p style={{color:'#ff9b9b'}}>{err}</p>}

      <ul className="grid">
        {roles.map(r=>(
          <li key={r.id} className="card" style={{display:'flex',gap:12,alignItems:'center',justifyContent:'space-between'}}>
            <div style={{fontWeight:600}}>{r.name}</div>
            <div className="row" style={{gap:8}}>
              <button onClick={()=>rename(r.id, r.name)}>Editar</button>
              <button onClick={()=>del(r.id)}>Excluir</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
