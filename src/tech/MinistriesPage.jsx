import React, { useEffect, useState } from 'react';

export default function MinistriesPage(){
  const [items, setItems] = useState([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  async function load(){
    setErr('');
    try{
      const r = await fetch('/api/ministries'); // via redirect do netlify.toml
      const data = await r.json();
      setItems(Array.isArray(data)?data:[]);
    }catch(e){ setErr('Falha ao carregar ministérios'); }
  }
  useEffect(()=>{ load(); },[]);

  async function add(){
    if(!name.trim()) return alert('Digite o nome do ministério');
    setLoading(true); setErr('');
    try{
      const r = await fetch('/api/ministries', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ name: name.trim() })
      });
      const data = await r.json();
      if (data && data.ok) { setName(''); await load(); }
      else setErr('Não foi possível adicionar.');
    }catch(e){ setErr('Erro ao adicionar.'); }
    finally{ setLoading(false); }
  }

  async function rename(id, oldName){
    const n = prompt('Novo nome do ministério:', oldName||'');
    if (n===null) return;
    await fetch('/api/ministries',{ method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id, name:n }) });
    await load();
  }

  async function del(id){
    if(!confirm('Remover este ministério?')) return;
    await fetch('/api/ministries',{ method:'DELETE', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id }) });
    await load();
  }

  return (
    <div>
      <h3>Ministérios</h3>
      <div className="row" style={{gap:8, marginBottom:12}}>
        <input placeholder="Nome do ministério" value={name} onChange={e=>setName(e.target.value)} style={{flex:1}}/>
        <button onClick={add} disabled={loading}>{loading?'Salvando…':'Incluir ministério'}</button>
      </div>
      {err && <p style={{color:'#ff9b9b'}}>{err}</p>}
      <ul className="grid">
        {items.map(m=>(
          <li key={m.id} className="card" style={{display:'flex',gap:12,alignItems:'center',justifyContent:'space-between'}}>
            <div style={{fontWeight:600}}>{m.name}</div>
            <div className="row" style={{gap:8}}>
              <button onClick={()=>rename(m.id, m.name)}>Editar</button>
              <button onClick={()=>del(m.id)}>Excluir</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
