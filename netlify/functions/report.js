import { readRange } from './utils/google.js';
import { PDFDocument, StandardFonts } from 'pdf-lib';

export const handler = async () => {
  try {
    const rows = await readRange('results!A:E');
    const [h,...d]=rows || []; if(!h) return { statusCode:200, body:'No results yet' };
    const idx = Object.fromEntries(h.map((x,i)=>[x,i]));

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 portrait
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    let y = 800; const left=50; const line=18;
    const draw = (t, size=12) => { page.drawText(String(t), { x:left, y, size, font }); y -= line; };

    draw('Relatório de Votação — Igreja', 16);
    draw(new Date().toLocaleString());
    y -= 10;

    d.forEach((r,i)=>{
      const role = r[idx.role_id];
      const elected = r[idx.elected_id];
      draw(`${i+1}. Cargo: ${role}`);
      draw(`   Eleito: ${elected}`);
      try {
        const ranking = JSON.parse(r[idx.ranking_json]||'[]');
        ranking.slice(1).forEach((x,j)=> draw(`   Suplente ${j+1}: ${x.id} — ${x.votes} votos`));
      } catch {}
      y -= 8;
    });

    const bytes = await pdfDoc.save();
    return { statusCode:200, headers: { 'Content-Type':'application/pdf' }, body: Buffer.from(bytes).toString('base64'), isBase64Encoded: true };
  } catch(e){
    return { statusCode:500, body: JSON.stringify({ error:e.message }) };
  }
}