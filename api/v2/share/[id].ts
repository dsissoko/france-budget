import {v2db} from '../_db.js';

const uuid=/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;
const publicOrigin='https://mon-budget-citoyen.vercel.app';
export const escapeHtml=(value:unknown)=>String(value??'').replace(/[&<>"']/g,
 ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]!));

export default async function handler(req:any,res:any){
  if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).end('Method not allowed');}
  const id=String(req.query?.id||'');
  if(!uuid.test(id))return res.status(404).end('Budget introuvable');
  try{
    const sql=v2db();
    const rows=await sql`
      SELECT id,legacy_budget_id,title,description,author,origin
      FROM v2.latest_budgets
      WHERE (id=${id}::uuid OR legacy_budget_id=${id}::uuid)
        AND origin IN ('party','citizen') LIMIT 1`;
    if(!rows.length)return res.status(404).end('Budget introuvable');
    const b=rows[0];
    const publicId=b.legacy_budget_id||b.id;
    const name=String(b.title).slice(0,100);
    const author=b.origin==='citizen'?String(b.author||''):'';
    const description=(String(b.description||'').trim()||
      'Découvre ce budget et ses propositions, puis soutiens-le sur Mon Budget Citoyen.').slice(0,240);
    const title=escapeHtml(name+' — Mon Budget Citoyen');
    const desc=escapeHtml((author?'Budget proposé par '+author+'. ':'')+description);
    const url=publicOrigin+'/b/'+encodeURIComponent(publicId);
    const destination='/?budget='+encodeURIComponent(publicId);
    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.setHeader('Cache-Control','public, max-age=0, s-maxage=300');
    res.setHeader('X-Content-Type-Options','nosniff');
    return res.status(200).end(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><meta name="description" content="${desc}"><meta property="og:type" content="website"><meta property="og:site_name" content="Mon Budget Citoyen"><meta property="og:title" content="${title}"><meta property="og:description" content="${desc}"><meta property="og:url" content="${escapeHtml(url)}"><meta name="twitter:card" content="summary"><meta name="twitter:title" content="${title}"><meta name="twitter:description" content="${desc}"><link rel="canonical" href="${escapeHtml(url)}"><meta http-equiv="refresh" content="0;url=${destination}"><script>window.location.replace(${JSON.stringify(destination)})</script></head><body><p>Ouverture du budget… <a href="${destination}">Voir le budget</a></p></body></html>`);
  }catch(e){console.error('V2 share error',e);return res.status(503).end('Budget momentanément indisponible');}
}
