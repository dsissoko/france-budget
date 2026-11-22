import {v2db,respond,safeError} from './_db.js';

export default async function handler(req:any,res:any){
  if(req.method!=='GET'){res.setHeader('Allow','GET');return respond(res,405,{error:'Méthode non autorisée'});}
  try{
    const sql=v2db();
    const rows=await sql`
      SELECT reference_year AS "referenceYear",side,category_id AS "categoryId",
        label,reference_amount_bn::text AS "referenceAmountBn"
      FROM v2.reference_posts ORDER BY reference_year,side,category_id`;
    respond(res,200,{posts:rows});
  }catch(e){safeError(res,e);}
}
