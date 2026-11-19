import {db} from '../_db.js';

const escapeHtml=(value:unknown)=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]!));
const uuid=/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;
const publicOrigin='https://mon-budget-citoyen.vercel.app';

export default async function handler(req:any,res:any){
  if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).end('Method not allowed');}
  const id=String(req.query?.id||'');
  if(!uuid.test(id))return res.status(404).end('Budget introuvable');
  try {
    const sql=db();
    const rows=await sql`SELECT title,description,origin,scenario FROM budgets WHERE id=${id}::uuid AND visibility='public' AND origin IN ('party','citizen') LIMIT 1`;
    if(!rows.length)return res.status(404).end('Budget introuvable');
    const budget=rows[0];
    const name=String(budget.title).slice(0,100);
    const author=budget.origin==='citizen'&&typeof budget.scenario?.author==='string'?budget.scenario.author:'';
    const description=(String(budget.description||'').trim()||'Découvre ce budget et ses propositions, puis soutiens-le sur Mon Budget Citoyen.').slice(0,240);
    const title=escapeHtml(name+' — Mon Budget Citoyen');
    const desc=escapeHtml((author?'Budget proposé par '+author+'. ':'')+description);
    const url=publicOrigin+'/b/'+encodeURIComponent(id);
    const destination='/?budget='+encodeURIComponent(id);
    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.setHeader('Cache-Control','public, max-age=0, s-maxage=300');
    res.setHeader('X-Content-Type-Options','nosniff');
    return res.status(200).end(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><meta name="description" content="${desc}"><meta property="og:type" content="website"><meta property="og:site_name" content="Mon Budget Citoyen"><meta property="og:title" content="${title}"><meta property="og:description" content="${desc}"><meta property="og:url" content="${escapeHtml(url)}"><meta name="twitter:card" content="summary"><meta name="twitter:title" content="${title}"><meta name="twitter:description" content="${desc}"><link rel="canonical" href="${escapeHtml(url)}"><meta http-equiv="refresh" content="0;url=${destination}"><script>window.location.replace(${JSON.stringify(destination)})</script></head><body><p>Ouverture du budget… <a href="${destination}">Voir le budget</a></p></body></html>`);
  }catch{
    return res.status(503).end('Budget momentanément indisponible');
  }
}
