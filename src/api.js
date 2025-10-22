export async function api(path, opts){
  const res = await fetch(`/api/${path}`, { headers:{ 'Content-Type':'application/json' }, ...opts });
  if(!res.ok) throw new Error(await res.text());
  const ct = res.headers.get('content-type')||'';
  return ct.includes('application/pdf')? res.blob() : res.json();
}