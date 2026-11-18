import { db, reply, method } from './_db';
export default async function handler(req:any,res:any){
 if(!method(req,'GET',res))return;
 try{
  const sql=db();
  const [categories,measures]=await sql.transaction([
   sql`SELECT id,side,label,amount::float8 AS amount,canonical,description FROM reference_categories WHERE reference_year=2025 ORDER BY side,sort_order`,
   sql`SELECT id,party,theme,title,revenue_delta::float8 AS "revenueDelta",expense_delta::float8 AS "expenseDelta",source,year,status,description FROM reference_measures ORDER BY sort_order`
  ],{readOnly:true});
  res.setHeader('Cache-Control','public, max-age=60, stale-while-revalidate=300');
  return reply(res,200,{referenceYear:2025,revenues:categories.filter((x:any)=>x.side==='revenues').map(({side,...x}:any)=>x),expenses:categories.filter((x:any)=>x.side==='expenses').map(({side,...x}:any)=>x),measures});
 }catch{return reply(res,503,{error:'Référentiel temporairement indisponible'})}
}
