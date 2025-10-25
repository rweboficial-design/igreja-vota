import React, { useEffect, useState } from 'react';

export default function MembersPage(){
  const [items, setItems] = useState([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  async function load(){
    setErr('');
    try{
      const r = await fetch('/api/members');
      const data = await r.json();
      if (Array.isArray(data)) setItems(data);
      else setItems([]);
    }catch(e){ setErr('Falha ao carregar membros'); }
  }
  useEffect(()=>{ load(); },[]);

  async function add(){
    if(!name.trim()) return alert('Digite o nome do membro');
    setLoading(true);
    setErr('');
    try{
      const r = await fetch('/api/members', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ name: name.trim(), photo_url:'', active:true })
      });
      const data = await r.json();
      if (data && data.ok) {
        setName('');
        await load();
      } else {
        setErr('Não foi possível adicionar.');
      }
    }catch(e){ setErr('Erro ao adicionar.'); }
    finally{ setLoading(false); }
  }

  async function del(id){
    if(!confirm('Remover este membro?')) return;
    await fetch('/api/members', {
      method:'DELETE',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ id })
    });
    await load();
  }

  return (
    <div>
      <h3>Membros</h3>

      <div className="row" style={{gap:8, marginBottom:12}}>
        <input
          placeholder="Nome do membro"
          value={name}
          onChange={e=>setName(e.target.value)}
          style={{flex:1}}
        />
        <button onClick={add} disabled={loading}>
          {loading ? 'Salvando…' : 'Adicionar'}
        </button>
      </div>

      {err && <p style={{color:'#ff9b9b'}}>{err}</p>}
      {items.length === 0 ? (
        <p>Nenhum membro cadastrado.</p>
      ) : (
        <ul className="grid">
          {items.map(m => (
            <li key={m.id} className="card" style={{textAlign:'left'}}>
              <div style={{display:'flex', gap:12, alignItems:'center'}}>
                <div style={{flex:1, fontWeight:600}}>{m.name}</div>
                <button onClick={()=>del(m.id)}>Excluir</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
