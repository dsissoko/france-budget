import {createHash,randomBytes,randomUUID} from 'node:crypto';

const keyPattern=/^[a-zA-Z0-9_.-]{1,160}$/;
const amountPattern=/^-?(?:0|[1-9]\d{0,5})(?:\.\d{1,3})?$/;
const sides=new Set(['revenues','expenses','offBudget']);
const text=(x:unknown)=>typeof x==='string'?x.trim():'';
function demand(ok:unknown,message:string):asserts ok {if(!ok)throw new CitizenInputError(message);}
export class CitizenInputError extends Error {}
export const makeEditToken=()=>randomBytes(32).toString('hex');
export const makeCitizenKey=()=>`citizen-${randomUUID()}`;
export const hashEditToken=(token:string)=>createHash('sha256').update(token).digest('hex');
export function editToken(req:any):string|null{
  const header=String(req.headers?.authorization??'');
  const match=/^Bearer ([a-f0-9]{64})$/i.exec(header);
  return match?match[1].toLowerCase():null;
}
export function sameOrigin(req:any):boolean{
  const origin=req.headers?.origin;
  if(!origin)return true; // scripts and same-origin requests may omit Origin
  try{
    const host=String(req.headers?.host??'').toLowerCase();
    const u=new URL(origin);
    return (u.protocol==='https:'||u.protocol==='http:')&&u.host.toLowerCase()===host;
  }catch{return false;}
}
function amount(value:unknown,required:boolean,ctx:string):string|null{
  if((value===null||value===undefined||value==='')&&!required)return null;
  demand(typeof value==='string'||typeof value==='number',ctx+': montant incorrect');
  const s=String(value);
  demand(amountPattern.test(s)&&Number.isFinite(Number(s)),ctx+': montant invalide ou précision >3 décimales');
  if(required)demand(Number(s)!==0,ctx+': impact nul');
  return s;
}
export function normalizeCitizenBody(body:any,key:string){
  demand(body&&typeof body==='object'&&!Array.isArray(body),'Payload JSON invalide');
  demand(!body.origin||body.origin==='citizen','Création politique interdite');
  demand(keyPattern.test(key)&&key.startsWith('citizen-'),'Clé citoyenne invalide');
  const title=text(body.title),description=text(body.description),author=text(body.author);
  demand(title.length>=3&&title.length<=100,'Titre du budget invalide');
  demand(description.length<=500,'Description du budget trop longue');
  demand(author.length>=2&&author.length<=60,'Auteur invalide');
  demand(body.referenceYear===2025,'Année de référence non prise en charge');
  const mode=body.budgetMode??'PARTIAL';
  demand(['PARTIAL','AGGREGATE'].includes(mode),'Mode invalide');
  demand(Array.isArray(body.proposals)&&body.proposals.length<=100,'Propositions invalides');
  const publish=body.publish!==false;
  demand(body.sourceBudgetKey===undefined||/^[a-zA-Z0-9_.-]{1,160}$/.test(body.sourceBudgetKey),'Budget source invalide');
  demand(!publish||body.proposals.length>0||typeof body.sourceBudgetKey==='string','Publication sans proposition');
  const proposals:any[]=[],impacts:any[]=[];
  const proposalKeys=new Set<string>(),postKeys=new Set<string>();
  for(const [index,p] of body.proposals.entries()){
    demand(p&&typeof p==='object'&&!Array.isArray(p),'Proposition invalide');
    const proposalKey=text(p.proposalKey),pt=text(p.title),pd=text(p.description);
    demand(keyPattern.test(proposalKey)&&!proposalKeys.has(proposalKey),'Clé de proposition invalide ou doublon');
    proposalKeys.add(proposalKey);
    demand(pt.length>=3&&pt.length<=160,'Titre de proposition invalide');
    demand(pd.length<=2000,'Description de proposition trop longue');
    demand(Array.isArray(p.impacts)&&p.impacts.length<=100,'Impacts invalides');
    demand(!publish||p.impacts.length>0,'Proposition publiée sans impact');
    demand(!p.impacts.length||pd.length>0,'Impact non expliqué');
    proposals.push({budget_key:key,proposal_key:proposalKey,title:pt,description:pd});
    for(const impact of p.impacts){
      demand(impact&&typeof impact==='object','Impact invalide');
      const side=impact.side,categoryId=text(impact.categoryId),postKey=side+':'+categoryId;
      demand(sides.has(side)&&keyPattern.test(categoryId)&&!postKeys.has(postKey),
        'Poste de budget invalide ou affecté deux fois');
      postKeys.add(postKey);
      impacts.push({budget_key:key,proposal_key:proposalKey,side,category_id:categoryId,
        delta_amount_bn:amount(impact.deltaAmountBn,true,'impact')});
    }
  }
  demand(impacts.length<=100,'Trop d’impacts');
  return {budget:{budget_key:key,version:'latest',origin:'citizen',party_code:'',
    author,title,description,reference_year:'2025',source_year:'',
    budget_mode:mode,documentary:{}},proposals,measures:[],impacts,publish};
}
export function parseRevision(raw:unknown):number{
  const n=Number(raw);
  demand(typeof raw==='number'&&Number.isSafeInteger(n)&&n>0,'Révision obligatoire');
  return n;
}
export function parseJsonBody(req:any):any{
  const body=typeof req.body==='string'?JSON.parse(req.body):req.body;
  demand(body&&typeof body==='object'&&!Array.isArray(body),'JSON invalide');
  demand(JSON.stringify(body).length<=120000,'Payload trop volumineux');
  return body;
}
export function writeErrorStatus(e:unknown):number{
  if(e instanceof CitizenInputError||e instanceof SyntaxError)return 400;
  const msg=String((e as any)?.message??e);
  if(/edit_capability_denied|invalid_edit_capability|budget_withdrawn/.test(msg))return 403;
  if(/published_budget_immutable/.test(msg))return 409;
  if(/publication_rate_limited/.test(msg))return 429;
  if(/revision_conflict|citizen_budget_already_exists|publication_limit_reached|published_budget_immutable/.test(msg))return 409;
  if(/foreign key|check constraint|invalid_|duplicate_|orphan_|null value|out_of_range/.test(msg))return 422;
  return 503;
}

/** Checks delta bounds against the frozen citizen pivot; no invented accounting. */
export function validatePivotImpacts(
  impacts:ReadonlyArray<{side:string;category_id:string;delta_amount_bn:string}>,
  refs:ReadonlyArray<{side:string;category_id:string;reference_amount_bn:string|number}>
):void {
  const byPost=new Map(refs.map(r=>[r.side+':'+r.category_id,Number(r.reference_amount_bn)]));
  for(const i of impacts){
    const base=byPost.get(i.side+':'+i.category_id);
    demand(base!==undefined,'Poste inconnu dans le référentiel citoyen');
    const delta=Number(i.delta_amount_bn);
    demand(Number.isFinite(delta)&&Number.isFinite(base),'Montant invalide');
    demand(base+delta>=0&&base+delta<=base*2,'Variation hors plage autorisée');
  }
}
