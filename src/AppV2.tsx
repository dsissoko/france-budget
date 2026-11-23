import {useEffect,useState} from 'react';
import {Landmark,ChevronDown,RefreshCcw,SlidersHorizontal,ArrowRight,ExternalLink,BookOpen,Scale,Heart,UserRound,ListChecks,Trash2,Trophy,X,Check} from 'lucide-react';
import {sum,currency,type Category} from './model';
import type {ReferenceModel,Result} from './projection-core';
import {simulationService,yearsFor,type SimulationParameters} from './engine/simulation';
import {voteQualification} from './engine/vote-qualification';
import {budgetMaturity} from './budget-maturity';
import {
 computeBudget,computeCitizenDraft,readDraftProposals,eligibleForDisplay,comparisonBudgets,displayedProposals,
 reportedAggregate,hasQualifiedBudgetImpact,declaredAmountForDisplay,sourceMeasureCount,proposalSourceMeasures,availablePost,updateImpact,validExclusiveProposals,
 type PublishedBudget,type BudgetProposal,type BudgetImpact,type BudgetSide
} from './v2-budget';
import DeficitTrajectory from './components/DeficitTrajectory';
import BudgetSummary from './components/BudgetSummary';
import InfoHint from './components/InfoHint';
import {buildLabel,currentBuild} from './build-display';
import {readBudgetLink} from './share';
import './compact-measures.css';

type Tab='comprendre'|'comparer'|'budget'|'voter';
type LocalDraft={id:string;name:string;createdAt:string;proposals:BudgetProposal[];sourceBudgetKey?:string|null};
const referenceResult:ReferenceModel={revenues:[],expenses:[],offBudget:[],measures:[]};
const loadDrafts=():LocalDraft[]=>{
 try{const x=JSON.parse(localStorage.getItem('france-budget-scenarios-v2')||'[]');return Array.isArray(x)?x:[]}catch{return []}
};
const money=(n:number)=>currency(Math.round(n*10)/10);
function Bars({items,values,tone}:{items:Category[];values?:Record<string,number>;tone:'green'|'coral'}){
 const max=Math.max(1,...items.map(x=>Math.max(x.amount,values?.[x.id]??x.amount)));
 return <div className="bar-list">{items.filter(x=>x.amount>0).map(x=>{
  const value=values?.[x.id]??x.amount;
  return <div className="bar-item" key={x.id}><div className="bar-head"><span>{x.label} <InfoHint item={x}/></span><span>{money(value)}</span></div>
    <div className="bar-track"><div className={'bar-fill '+tone} style={{width:Math.max(0,100*x.amount/max)+'%'}}/>
      {values&&<div className="bar-marker" style={{left:Math.max(0,Math.min(100,100*value/max))+'%'}}/>}</div></div>})}</div>;
}
function Gauge({item,value,onChange,tone,editing,id}:{
 item:Category;value:number;onChange?:(value:number)=>void;tone:'green'|'coral';editing?:boolean;id:string
}){
 const max=Math.max(1,item.amount*2,value);
 return <div className="slider-item"><div className="slider-label"><label htmlFor={id}>{item.label} <InfoHint item={item}/></label><strong>{money(value)}</strong></div>
  <div className="gauge-container"><div className="gauge-track"><div className={'gauge-fill '+tone} style={{width:Math.max(0,Math.min(100,100*value/max))+'%'}}/></div>
  {editing&&<input type="range" id={id} className="gauge-input" aria-label={'Modifier '+item.label} min={0} max={item.amount*2} step={0.1} value={value} onChange={e=>onChange?.(Number(e.target.value))}/>}</div>
  <span className="muted tiny">Référence {money(item.amount)}{Math.abs(value-item.amount)>.001?' · Écart '+(value>item.amount?'+':'')+money(value-item.amount):''}</span></div>;
}
function MaturityTag({b}:{b:PublishedBudget}){
 const m=b.origin==='educational'?null:budgetMaturity({...b,origin:b.origin});return m?<span className={'budget-maturity budget-maturity--'+m.tone} title={m.description}>{m.label}</span>:null;
}
function Champion({b,championId}:{b:PublishedBudget;championId:string|null}){
 return b.origin==='citizen'&&b.id===championId?<span className="citizen-champion"><Trophy size={13}/> Champion citoyen</span>:null;
}
function Stat({title,value,detail,tone}:{title:string;value:number;detail:string;tone?:'green-text'|'coral-text'}){
 return <div className="stat"><span className="eyebrow">{title}</span><strong className={tone??''}>{money(value)}</strong><small>{detail}</small></div>;
}
export default function AppV2(){
 const [reference,setReference]=useState<ReferenceModel|null>(null);
 const [simulationParams,setSimulationParams]=useState<SimulationParameters|null>(null);
 const [referenceError,setReferenceError]=useState('');
 const [tab,setTab]=useState<Tab>(()=>readBudgetLink(window.location.search)?'voter':'comprendre');
 const [published,setPublished]=useState<PublishedBudget[]>([]);
 const [publicError,setPublicError]=useState('');
 const [busy,setBusy]=useState(false);
 const [draftProposals,setDraftProposals]=useState<BudgetProposal[]>(()=>{
  try{return readDraftProposals(JSON.parse(localStorage.getItem('france-budget-draft-proposals-v2')??localStorage.getItem('france-budget-citizen-measures')??'[]'))}
  catch{return []}
 });
 const [saved,setSaved]=useState<LocalDraft[]>(loadDrafts);
 const [sourceBudget,setSourceBudget]=useState<PublishedBudget|null>(null);
 const [baseName,setBaseName]=useState('Référence INSEE 2025');
 const [originOpen,setOriginOpen]=useState(false);
 const [originChoice,setOriginChoice]=useState('reference');
 const [proposalPanel,setProposalPanel]=useState(false);
 const [editingProposalKey,setEditingProposalKey]=useState<string|null>(null);
 const [proposalTitle,setProposalTitle]=useState('');
 const [proposalDescription,setProposalDescription]=useState('');
 const [draftImpacts,setDraftImpacts]=useState<BudgetImpact[]>([]);
 const [budgetDetailOpen,setBudgetDetailOpen]=useState(false);
 const [publishOpen,setPublishOpen]=useState(false);
 const [publishName,setPublishName]=useState('');
 const [publishDescription,setPublishDescription]=useState('');
 const [publishAuthor,setPublishAuthor]=useState('');
 const [saveNotice,setSaveNotice]=useState('');
 const [compareA,setCompareA]=useState<string|null>(null);
 const [compareB,setCompareB]=useState<string|null>(null);
 const [voteFilter,setVoteFilter]=useState<'all'|'party'|'citizen'>('all');
 const [voteSort,setVoteSort]=useState<'popular'|'recent'|'balance'>('popular');
 const [voteDetail,setVoteDetail]=useState<string|null>(()=>readBudgetLink(window.location.search));
 const [openedProposal,setOpenedProposal]=useState<string|null>(null);
 const [showMethod,setShowMethod]=useState(false);
 const [expert,setExpert]=useState(false);
 const [lastPublishedKey,setLastPublishedKey]=useState<string|null>(null);
 const ref=reference??referenceResult;
 const revenues=ref.revenues,expenses=ref.expenses,offBudget=ref.offBudget;
 const referenceRevenue=sum([...revenues]),referenceExpense=sum([...expenses]);
 const baseDeficit=referenceExpense-referenceRevenue;
 const years=simulationParams?yearsFor(simulationParams):[];
 const project=(balanceDelta:number)=>simulationService.simulate(baseDeficit,balanceDelta,years,simulationParams??undefined);
 const projected=computeCitizenDraft(ref,draftProposals,sourceBudget);
 const localProjection=project(projected.balanceDelta);
 const championId=published.filter(b=>b.origin==='citizen')
  .sort((a,b)=>b.votes-a.votes||a.budgetKey.localeCompare(b.budgetKey))[0]?.id??null;
 useEffect(()=>{let live=true;fetch('/api/v2/reference').then(async r=>{
  if(!r.ok)throw Error('Référentiel indisponible');return r.json();
 }).then(data=>{
  if(!live)return;
  if(data.revenues?.length<1||data.expenses?.length<1||data.offBudget?.length<1||!data.simulation?.assessment)
   throw Error('Référentiel V2 incomplet');
  setReference({revenues:data.revenues,expenses:data.expenses,offBudget:data.offBudget,measures:[]});
  setSimulationParams(data.simulation);
 }).catch(()=>{if(live)setReferenceError('Impossible de charger les données du budget V2. Réessaie.')});
 return()=>{live=false};},[]);
 const refresh=async()=>{
  try{const r=await fetch('/api/v2/budgets');if(!r.ok)throw Error('Budget V2 indisponible');
   const data=await r.json();if(!Array.isArray(data.budgets))throw Error('Liste invalide');
   const budgets=data.budgets as PublishedBudget[];
   setPublished(budgets);
   const linked=readBudgetLink(window.location.search);
   setPublicError(linked&&!budgets.some(b=>b.id===linked)?'Ce budget est introuvable ou n’est plus public.':'');
  }catch{setPublicError('Les budgets publics sont momentanément indisponibles.')}
 };
 useEffect(()=>{if(reference&&(tab==='voter'||tab==='comparer'||tab==='budget'))void refresh()},[tab,reference]);
 useEffect(()=>{localStorage.setItem('france-budget-draft-proposals-v2',JSON.stringify(draftProposals))},[draftProposals]);
 const chooseCompare=(id:string)=>{
  if(!compareA){setCompareA(id);return}
  if(compareA===id||compareB===id)return;
  if(!compareB){setCompareB(id);return}
  setCompareA(compareB);setCompareB(id);
 };
 const navigate=(next:Tab)=>{setTab(next);window.scrollTo({top:0,behavior:'instant'})};
 const reset=()=>{setSourceBudget(null);setDraftProposals([]);setBaseName('Référence INSEE '+(simulationParams?.referenceYear??2025))};
 const applyOrigin=()=>{
  if(originChoice==='reference'){
   setSourceBudget(null);
   setBaseName('Référence INSEE '+(simulationParams?.referenceYear??2025));
  }else{
   const b=published.find(x=>x.id===originChoice),s=saved.find(x=>x.id===originChoice);
   if(b){setSourceBudget(b);setBaseName(b.title)}
   else if(s){setSourceBudget(published.find(x=>x.budgetKey===s.sourceBudgetKey)??null);
     setDraftProposals(readDraftProposals(s.proposals));setBaseName(s.name)}
  }
  setOriginOpen(false);
 };
 const saveDraft=()=>{
  const name=window.prompt('Nom de ton scénario','Mon budget '+(saved.length+1));
  if(!name?.trim())return;
  const item:LocalDraft={id:String(Date.now()),name:name.trim().slice(0,60),
   createdAt:new Date().toISOString(),proposals:JSON.parse(JSON.stringify(draftProposals)),
   sourceBudgetKey:sourceBudget?.budgetKey??null};
  const next=[...saved,item];setSaved(next);
  localStorage.setItem('france-budget-scenarios-v2',JSON.stringify(next));
  setSaveNotice('Budget « '+item.name+' » enregistré dans ce navigateur.');
 };
 const publishedReference:PublishedBudget={
  id:'insee-reference-'+(simulationParams?.referenceYear??2025),
  budgetKey:'insee-reference',version:'latest',origin:'educational',referenceYear:2025,
  title:'Référence INSEE '+(simulationParams?.referenceYear??2025),
  description:'Agrégats officiels des administrations publiques 2025 ; ventilation indicative.',
  budgetMode:'PARTIAL',documentary:{},proposals:[],featured:true,featured_order:0,votes:0,
  published_at:''
 };
 const featured=[publishedReference,...comparisonBudgets(published)];
 const compareBudgetA=featured.find(b=>b.id===compareA);
 const compareBudgetB=featured.find(b=>b.id===compareB);
 const lastPublished=published.find(b=>b.budgetKey===lastPublishedKey);
 const baseFor=(side:BudgetSide,id:string)=>{
  const source=sourceBudget?computeBudget(sourceBudget,ref):null;
  const item=(side==='revenues'?revenues:side==='expenses'?expenses:offBudget).find(c=>c.id===id);
  return source?.[side][id]??item?.amount??0;
 };
 const startProposal=(key:string|null)=>{
  const p=draftProposals.find(p=>p.proposalKey===key);
  setEditingProposalKey(key);setProposalTitle(p?.title??'');setProposalDescription(p?.description??'');
  setDraftImpacts(p?.impacts.map(i=>({...i}))??[]);setProposalPanel(true);
 };
 const editImpact=(side:BudgetSide,id:string,value:number)=>{
  if(!availablePost(side,id,draftProposals,editingProposalKey))return;
  setDraftImpacts(old=>updateImpact(old,side,id,value-baseFor(side,id)));
 };
 const saveProposal=()=>{
  if(!proposalDescription.trim()||!draftImpacts.length)return;
  const key=editingProposalKey??('citizen-'+Date.now().toString(36));
  const p:BudgetProposal={proposalKey:key,title:proposalTitle.trim()||proposalDescription.trim().slice(0,100),
    description:proposalDescription.trim(),impacts:draftImpacts};
  const next=editingProposalKey?draftProposals.map(x=>x.proposalKey===key?p:x):[...draftProposals,p];
  if(!validExclusiveProposals(next))return;
  setDraftProposals(next);setProposalPanel(false);setEditingProposalKey(null);setDraftImpacts([]);
 };
 const vote=async(id:string)=>{
  setBusy(true);setPublicError('');
  try{const r=await fetch('/api/v2/votes',{method:'POST',headers:{'Content-Type':'application/json'},
   body:JSON.stringify({budgetId:id})});
   if(!r.ok)throw Error(r.status===409?'Tu as déjà voté pour ce budget.':'Vote momentanément indisponible');
   await refresh();
  }catch(e){setPublicError(e instanceof Error?e.message:'Vote impossible')}
  finally{setBusy(false)}
 };
 const publish=async()=>{
  if(publishName.trim().length<3||publishAuthor.trim().length<2)return;
  if(!sourceBudget&&!draftProposals.length){setPublicError('Ajoute une proposition avant de publier.');return}
  setBusy(true);setPublicError('');
  try{const r=await fetch('/api/v2/budgets',{method:'POST',headers:{'Content-Type':'application/json'},
   body:JSON.stringify({title:publishName.trim(),description:publishDescription.trim(),
    author:publishAuthor.trim(),referenceYear:2025,budgetMode:'PARTIAL',
    sourceBudgetKey:sourceBudget?.budgetKey,proposals:draftProposals,publish:true})});
   const data=await r.json();if(!r.ok)throw Error(data.error||'Publication impossible');
   setPublishOpen(false);setBaseName(publishName.trim());setLastPublishedKey(data.budgetKey);
   setVoteDetail(data.id);setTab('voter');await refresh();
  }catch(e){setPublicError(e instanceof Error?e.message:'Publication impossible')}
  finally{setBusy(false)}
 };
 const renderDetails=(b:PublishedBudget,r:Result)=>{
  const groups=[{title:'Dépenses',side:'expenses' as const,items:expenses,tone:'coral' as const},
   {title:'Recettes',side:'revenues' as const,items:revenues,tone:'green' as const},
   {title:'Manques à gagner hors budget',side:'offBudget' as const,items:offBudget,tone:'green' as const}];
  return <><div className="card"><div className="card-title"><h3>Référence 2025 vs {b.title}</h3><span className="pill">Écarts par poste</span></div>
   <p className="muted small">Gris : référence · couleur : scénario. Seuls les postes modifiés sont affichés.</p>
   {groups.map(g=><div key={g.side} className="compare-group"><h4>{g.title}</h4>{
     g.items.filter(c=>Math.abs((r[g.side][c.id]??c.amount)-c.amount)>.005).map(c=>
      <Gauge key={c.id} id={'view-'+b.id+'-'+c.id} item={c} value={r[g.side][c.id]} tone={g.tone}/>)
   }</div>)}</div><div className="card"><div className="card-title"><h3>Présentation et propositions</h3>
    <span className="pill">{b.proposals.length} propositions</span></div>
    {b.origin==='party'&&sourceMeasureCount(b)>0&&
      <p className="muted small">Issues de {sourceMeasureCount(b)} mesures du programme</p>}
    {b.description&&<p className="muted small">{b.description}</p>}
    {b.origin==='party'&&displayedProposals(b).length===0&&
     <p className="muted small" role="status">
      {b.proposals.length>0?
       b.proposals.length+' propositions sont recensées, mais aucun impact chiffré n’est encore suffisamment qualifié.':
       'Aucune proposition n’est encore disponible pour ce programme.'}
      {' '}Les agrégats du programme, lorsqu’ils sont documentés, sont présentés séparément.
     </p>}
    {displayedProposals(b).some(p=>p.impacts.length===0)&&<p className="muted small">Les montants annoncés des propositions sont présentés à titre documentaire ; ils ne sont pas ajoutés aux agrégats ni à la simulation.</p>}
    <div className="compact-measure-list" aria-label="Propositions en lecture seule">
    {displayedProposals(b).map(p=><div key={p.proposalKey} className="compact-measure-item">
     <div className="compact-measure-row"><button className="compact-measure-content compact-measure-open"
      aria-expanded={openedProposal===p.proposalKey} onClick={()=>setOpenedProposal(x=>x===p.proposalKey?null:p.proposalKey)}>
      <span className="compact-measure-title">{p.title}</span><ChevronDown size={17}/></button></div>
     {openedProposal===p.proposalKey&&<div className="compact-measure-detail proposal-panel vote-proposal-readonly">
      {p.description?.trim()&&<p className="muted small">{p.description}</p>}
      {proposalSourceMeasures(b,p).length>0&&<ul className="muted small">{proposalSourceMeasures(b,p).map(m=><li key={m.measureKey}>{m.title}{m.claimedAmountBn?<> : {money(Number(m.claimedAmountBn))} revendiqués</>:<> — montant non renseigné</>}</li>)}</ul>}
      {declaredAmountForDisplay(p)!==null&&p.impacts.length===0&&
        <p className="muted small"><strong>Montant annoncé : {money(declaredAmountForDisplay(p)!)}</strong>
         {' · '}Chiffrage déclaré par son auteur, non imputé aux postes comptables.
         {p.measures?.some(m=>m.sourceStatus==='primary_source_checked_apu_review_pending')&&' · Qualification comptable en attente.'}
        </p>}
      {groups.map(g=>{const impacts=p.impacts.filter(i=>i.side===g.side);
       return impacts.length?<div className="card" key={g.side}><h4>{g.title}</h4>{impacts.map(i=>{
        const c=g.items.find(c=>c.id===i.categoryId);
        return c?<Gauge id={'proposal-'+p.proposalKey+'-'+i.categoryId} key={i.categoryId}
          item={c} value={c.amount+Number(i.deltaAmountBn)} tone={g.tone}/>:null;
       })}</div>:null})}
      {p.measures?.some(m=>m.sourceUrl?.startsWith('https://'))&&<a href={p.measures.find(m=>m.sourceUrl?.startsWith('https://'))?.sourceUrl??undefined} target="_blank" rel="noreferrer">Source officielle <ExternalLink size={13}/></a>}
     </div>}</div>)}</div></div>
   <div className="card">{hasQualifiedBudgetImpact(b)?<DeficitTrajectory primary={project(r.balanceDelta)}/>:<><p className="muted small">Aucun impact chiffré qualifié : les montants de référence ne doivent pas être attribués à ce programme.</p><DeficitTrajectory primary={project(0)} referenceOnly/></>}</div></>;
 };
 if(!reference||!simulationParams)return <div className="app"><main className="page"><div className="card">
  <h2>Mon Budget Citoyen</h2><p role="status">{referenceError||'Chargement des données budgétaires…'}</p>
  {referenceError&&<button onClick={()=>window.location.reload()}>Réessayer</button>}</div></main></div>;
 return <div className="app"><header className="topbar"><div className="brand"><div className="brand-symbol"><Landmark size={21}/></div><span>Mon Budget <b>Citoyen</b></span></div><div className="header-end"><span className="header-note">Comprendre • Comparer • Décider</span><a className="build-version" href={currentBuild().sha?'https://github.com/'+currentBuild().repo+'/commit/'+currentBuild().sha:undefined} title={currentBuild().sha?'Voir le commit '+currentBuild().sha:'Identifiant de build indisponible'} target="_blank" rel="noopener noreferrer" aria-label={'Version déployée : '+buildLabel(currentBuild())}>{buildLabel(currentBuild())}</a></div></header><main className="page"><section className="intro intro-unified"><div className="kicker">LES FINANCES PUBLIQUES, À LA PORTÉE DE TOUS</div><h1>Le budget de la France<span>.</span></h1><p>Explore les comptes publics {simulationParams?.referenceYear}, compare les propositions politiques et construis ton propre budget. Les totaux proviennent de l’INSEE ; les répartitions détaillées et les simulations restent indicatives.</p><button className="text-button" onClick={()=>setShowMethod(v=>!v)} aria-expanded={showMethod}><BookOpen size={16}/>{showMethod?"Masquer notre méthode":"Comprendre notre méthode"}</button></section>{showMethod&&<section className="card" aria-label="Notre méthode"><h2>Notre méthode, en quelques mots</h2><h3>Des agrégats citoyens, fondés sur les comptes publics</h3><p>Le simulateur couvre toutes les administrations publiques, et pas seulement l’État. Les comptes de référence INSEE {simulationParams?.referenceYear} indiquent {currency(referenceRevenue)} de recettes, {currency(referenceExpense)} de dépenses et {currency(baseDeficit)} de déficit. Nos catégories sont des regroupements pédagogiques : leur ventilation reste en cours de fiabilisation à partir des dernières données officielles disponibles, parfois antérieures à 2025. Une estimation n’est pas une statistique officielle.</p><h3>Deux cas pour restituer un programme politique</h3><p><b>1. Budget globalement chiffré :</b> si le parti annonce des agrégats de recettes et de dépenses cohérents, datés et sourcés, nous utilisons ces masses annoncées en priorité. Les mesures détaillées expliquent le programme, mais ne sont pas ajoutées une deuxième fois. Un budget global est ainsi plus simple à intégrer qu’un budget partiel.</p><p><b>Exemple LFI 2027 :</b> le contre-budget revendique <strong>106,4 Md€ de recettes nouvelles</strong> et <strong>81,7 Md€ de dépenses nouvelles</strong>, soit <strong>24,7 Md€ d’amélioration du solde</strong>. Ce sont des variations annoncées, et non les recettes et dépenses totales des administrations publiques. <a href="https://melenchon2027.fr/wp-content/uploads/2026/10/Comment-nous-allons-remettre-de-l-ordre-dans-les-comptes-publics.pdf" target="_blank" rel="noopener noreferrer">Source officielle, bilan p. 14 <ExternalLink size={13}/></a>.</p><p><b>2. Budget partiellement chiffré :</b> sans couple complet recettes/dépenses annoncé, nous partons de la référence INSEE et appliquons uniquement les variations des mesures sourcées. Tous les postes non modifiés conservent leur référence INSEE. Ce résultat est une simulation partielle, pas un bilan du programme entier.</p><p>Dans les deux cas, les montants restent attribués à leur auteur. Le site présente et vérifie la cohérence arithmétique, sans certifier la faisabilité économique des propositions.</p><h3>Des thèmes politiques aux postes budgétaires</h3><p>« Pouvoir d’achat », « immigration » ou « écologie » ne sont pas des lignes comptables. Nous n'appliquons que les impacts explicitement rattachés aux postes de recettes, dépenses ou manques à gagner. Aucune ventilation automatique non justifiée n'est inventée.</p><p><b>Exemple :</b> une baisse de TVA de 10 Md€ diminue les recettes de 10 Md€ et augmente mécaniquement le déficit de 10 Md€, hors effets indirects.</p><h3>Les hypothèses économiques</h3><p>Croissance, inflation, chômage, prix du pétrole, du gaz et de l’électricité, taux d’intérêt et démographie peuvent influencer les résultats. Nous distinguons les hypothèses officielles, celles des partis et celles du simulateur. Ces indicateurs ne sont pas utilisés comme effets indirects automatiques dans les simulations.</p><h3>Comment lire les labels de projection</h3><p>La qualification combine le déficit projeté en 2032 <b>par rapport à la référence projetée en 2032</b> et sa trajectoire entre 2027 et 2032. <b>Redressement</b> (vert) : déficit moindre et stabilisé, en baisse, ou revenu à l’équilibre (ou à l’excédent) en 2032. <b>Amélioration relative</b> (orange) : déficit encore présent et en hausse, mais moindre que la référence. <b>Dégradation</b> (rouge) : déficit supérieur à la référence, ou égal avec une pente haussière ; c’est le cas de notre référence mécanique. <b>Non qualifié</b> (gris) : série insuffisante ou égalité sans hausse. Le « déficit évité » ou « supplémentaire » exprime séparément l’écart chiffré à la référence en 2032.</p><p>Ces labels décrivent uniquement une simulation indicative, sans juger la faisabilité économique ni la fidélité documentaire. Les statuts <b>Non vérifié</b>, <b>En préparation</b>, <b>Complet</b>, <b>À confirmer</b> et <b>Confirmé</b> concernent exclusivement la restitution documentaire. Les modes « budget global » et « simulation partielle » indiquent seulement quelles données ont pu être intégrées. <a href="https://github.com/dsissoko/france-budget/blob/main/docs/methode.md#lecture-des-labels-de-projection-en-2032" target="_blank" rel="noopener noreferrer">Définitions complètes <ExternalLink size={13}/></a>.</p><h3>Ce que les résultats prouvent — et ne prouvent pas</h3><p>Nous pouvons vérifier qu’un chiffrage annoncé est correctement réparti entre postes. Cela ne prouve pas que la mesure produira réellement cet effet. Les interactions macroéconomiques sont prévues pour une évolution ultérieure.</p><p><a href="https://www.insee.fr/fr/statistiques/8997691" target="_blank" rel="noreferrer">Source INSEE <ExternalLink size={13}/></a> · <a href="https://github.com/dsissoko/france-budget/blob/main/docs/methode.md" target="_blank" rel="noreferrer">Méthode détaillée <ExternalLink size={13}/></a> · <a href="https://github.com/dsissoko/france-budget/blob/main/data/programmes/registre-partis-sources-2026-11.csv" target="_blank" rel="noreferrer">Registre des sources des partis <ExternalLink size={13}/></a></p></section>}<nav className="tabs" aria-label="Navigation principale">
   {([['comprendre','Comprendre',BookOpen],['comparer','Comparer',Scale],['budget','Mon budget',SlidersHorizontal],['voter','Voter',Check]] as const)
    .map(([id,label,Icon])=><button key={id} className={tab===id?'active':''} onClick={()=>navigate(id)} aria-current={tab===id?'page':undefined}><Icon size={17}/>{label}</button>)}
  </nav>
  {tab==='comprendre'&&<section className="stage"><div className="section-header"><div className="kicker">01 / COMPRENDRE</div>
   <h2>Où va l'argent public ?</h2><p>Une lecture simple des grands équilibres d'un budget public.</p></div>
   <div className="stats three"><Stat title="Recettes publiques" value={referenceRevenue} detail="L'argent qui entre" tone="green-text"/>
    <Stat title="Dépenses publiques" value={referenceExpense} detail="L'argent qui sort"/>
    <Stat title="Déficit annuel" value={baseDeficit} detail="Ce qu'il manque pour équilibrer" tone="coral-text"/></div>
   <div className="card"><h3>Chaque euro dépensé</h3><div className="ratio"><div className="ratio-paid" style={{width:referenceRevenue/referenceExpense*100+'%'}}/><div className="ratio-gap"/></div>
    <p className="muted small">{Math.round(referenceRevenue/referenceExpense*1000)/10} % des dépenses sont financées par les recettes.</p></div>
   <div className="split"><div className="card"><h3>D’où viennent les recettes publiques ?</h3><Bars items={[...revenues]} tone="green"/></div>
    <div className="card"><h3>À quoi servent les dépenses publiques ?</h3><Bars items={[...expenses]} tone="coral"/></div></div>
   <div className="card"><DeficitTrajectory primary={project(0)} referenceOnly/>
    <button className="text-button" onClick={()=>navigate('comparer')}>Découvrir les propositions politiques <ArrowRight size={16}/></button></div>
  </section>}
  {tab==='comparer'&&<section className="stage"><div className="section-header"><div className="kicker">02 / COMPARER</div><h2>Comparer les choix budgétaires.</h2>
   <p>Choisis deux budgets et découvre leurs différences sur les recettes, les dépenses et le déficit.</p></div>
   <div className="card"><h3>Les budgets à comparer</h3>
    <p className="muted small">{!compareA?'Étape 1/2 · Choisis le budget A.':!compareB?'Étape 2/2 · Choisis le budget B.':'Comparaison prête !'}</p>
    <div className="compare-slots">{(['a','b'] as const).map(side=>{const b=featured.find(x=>x.id===(side==='a'?compareA:compareB));
     return <div key={side} className={'compare-slot '+(b?'filled-'+side:'')}><strong>{b?.title||'À sélectionner'}</strong></div>})}</div>
    <div className="compare-gallery">{featured.map(b=><button key={b.id}
      className={'compare-choice '+(compareA===b.id?'chosen-a':compareB===b.id?'chosen-b':'')}
      onClick={()=>chooseCompare(b.id)}><span className="compare-choice-icon">{b.origin==='party'?<Landmark size={19}/>:<UserRound size={19}/>}</span>
      <span className="compare-choice-label"><strong>{b.title}</strong><small>{b.origin==='party'?'Parti politique':b.origin==='citizen'?'Budget citoyen':'Référence INSEE'}</small>
      <MaturityTag b={b}/><Champion b={b} championId={championId}/>
      {b.origin!=='educational'&&(()=>{const r=computeBudget(b,ref);
       const q=hasQualifiedBudgetImpact(b)?voteQualification(baseDeficit,r.balanceDelta,years,simulationParams):{label:'Non qualifié',tone:'neutral',title:'Aucun impact chiffré qualifié'};
       return <span className={'vote-impact vote-impact--'+q.tone} title={q.title}>{q.label}</span>})()}</span></button>)}</div>
    <button className="secondary" onClick={()=>{setCompareA(null);setCompareB(null)}}>Réinitialiser</button></div>
   {compareBudgetA&&compareBudgetB&&<div className="compare-summary-pair">{([compareBudgetA,compareBudgetB] as const).map((b,i)=>{
    const r=computeBudget(b,ref);
    return <div key={b.id} className="compare-budget-group"><BudgetSummary title={b.title} side={i===0?'a':'b'}
      shareBudget={b.origin!=='educational'?{id:b.id,title:b.title}:undefined}
      revenues={r.revenueTotal} expenses={r.expenseTotal} deficit={r.deficit} referenceDeficit={baseDeficit}/>
      <details className="compare-budget-detail"><summary>Détail du budget <ChevronDown size={17}/></summary>
       <div className="compare-budget-detail-content">{reportedAggregate(b)&&<p className="muted small">Agrégats revendiqués, non additionnés aux propositions.</p>}
        {renderDetails(b,r)}</div></details></div>})}</div>}
  </section>}
  {tab==='budget'&&<section className="stage"><div className="section-header"><div><div className="kicker">03 / MON BUDGET</div>
   <h2>Et toi, que changerais-tu ?</h2><p>Construis ton budget en ajoutant des propositions et leurs impacts sur les postes budgétaires.</p></div>
   <button className="secondary" onClick={reset}><RefreshCcw size={16}/> Réinitialiser</button></div>
   {saveNotice&&<p role="status" className="save-notice">{saveNotice}</p>}
   <div className="budget-origin"><span>Point de départ : <strong>{baseName}</strong></span>
    <button className="text-button" onClick={()=>setOriginOpen(x=>!x)}>{originOpen?'Fermer':'Changer'}</button></div>
   {originOpen&&<div className="card origin-choice-card"><h3>Choisir mon point de départ</h3>
    <label htmlFor="origin-selector">Budget de référence</label>
    <select id="origin-selector" className="origin-native-select" value={originChoice} onChange={e=>setOriginChoice(e.target.value)}>
     <option value="reference">Référence INSEE 2025</option>
     <optgroup label="Budgets publiés">{published.filter(eligibleForDisplay).map(b=>
      <option key={b.id} value={b.id}>{b.title}</option>)}</optgroup>
     {saved.length>0&&<optgroup label="Mes budgets enregistrés">{saved.map(x=>
      <option value={x.id} key={x.id}>{x.name}</option>)}</optgroup>}</select>
    <div className="actions"><button className="secondary" onClick={()=>setOriginOpen(false)}>Annuler</button>
     <button className="primary" onClick={applyOrigin}>Utiliser ce point de départ</button></div></div>}
   <BudgetSummary title="Mon budget" shareBudget={lastPublished?{id:lastPublished.id,title:lastPublished.title}:undefined}
    revenues={projected.revenueTotal} expenses={projected.expenseTotal} deficit={projected.deficit} referenceDeficit={baseDeficit}/>
   <div className="card"><h3>Présentation de mon budget</h3>
    <p className="muted small">{publishDescription.trim()||'Budget construit à partir de '+baseName+'. Ajoute des propositions pour préciser tes choix.'}</p></div>
   <div className="card budget-detail-accordion"><button type="button" className="budget-detail-toggle" onClick={()=>setBudgetDetailOpen(x=>!x)}>
    <span>Détail de mon budget</span><ChevronDown size={18}/></button>
    {budgetDetailOpen&&<div className="budget-detail-accordion-content"><div className="split">
     <div className="card"><h3>Mes recettes</h3>{revenues.map(c=><Gauge key={c.id} id={'rev-'+c.id} item={c} value={projected.revenues[c.id]} tone="green"/>)}</div>
     <div className="card"><h3>Mes dépenses</h3>{expenses.map(c=><Gauge key={c.id} id={'exp-'+c.id} item={c} value={projected.expenses[c.id]} tone="coral"/>)}</div></div>
     <div className="card"><h3>Manques à gagner hors budget</h3>{offBudget.map(c=><Gauge key={c.id} id={'off-'+c.id} item={c} value={projected.offBudget[c.id]} tone="green"/>)}</div></div>}</div>
   <div className="card"><div className="card-title proposal-section-title"><div><h3>Mes propositions</h3>
    <p className="muted small">{draftProposals.length} proposition(s) dans mon budget</p></div>
    <button className="primary" onClick={()=>proposalPanel?setProposalPanel(false):startProposal(null)}>{proposalPanel?'Fermer':'Ajouter une proposition'}</button></div>
    {!draftProposals.length&&<p className="muted small">Aucune nouvelle proposition pour le moment.</p>}
    <div className="compact-measure-list">{draftProposals.map(p=><div className="compact-measure-row" key={p.proposalKey}>
     <button className="compact-measure-content compact-measure-open" onClick={()=>startProposal(p.proposalKey)}>
      <span className="compact-measure-title">{p.title}</span><span className="compact-measure-subtitle">{p.impacts.length} postes modifiés</span></button>
     <div className="compact-measure-actions"><button className="secondary" aria-label={'Modifier '+p.title} onClick={()=>startProposal(p.proposalKey)}><SlidersHorizontal size={17}/></button>
      <button className="secondary" aria-label={'Supprimer '+p.title} onClick={()=>setDraftProposals(xs=>xs.filter(x=>x.proposalKey!==p.proposalKey))}><Trash2 size={17}/></button></div></div>)}</div>
    {proposalPanel&&<div className="proposal-panel proposal-form" role="dialog" aria-label="Modifier une proposition">
     <h4>{editingProposalKey?'Modifier ma proposition':'Ajouter une proposition'}</h4>
     <label htmlFor="proposal-title">Titre de la proposition</label>
     <input id="proposal-title" value={proposalTitle} maxLength={160} onChange={e=>setProposalTitle(e.target.value)}/>
     <label htmlFor="proposal-description">Description de la proposition</label>
     <textarea id="proposal-description" value={proposalDescription} maxLength={2000} onChange={e=>setProposalDescription(e.target.value)}/>
     <p className="muted small">Modifie les jauges des postes ci-dessous. Les postes utilisés dans une autre proposition ne sont pas disponibles.</p>
     <div className="split">{([{side:'revenues',title:'Recettes',items:revenues,tone:'green'},
       {side:'expenses',title:'Dépenses',items:expenses,tone:'coral'}] as const).map(g=>
      <div className="card" key={g.side}><h4>{g.title}</h4>{g.items.filter(c=>availablePost(g.side,c.id,draftProposals,editingProposalKey))
       .map(c=><Gauge key={c.id} id={'edit-'+g.side+'-'+c.id} item={c}
        value={baseFor(g.side,c.id)+(draftImpacts.find(i=>i.side===g.side&&i.categoryId===c.id)?.deltaAmountBn??0)}
        tone={g.tone} editing onChange={v=>editImpact(g.side,c.id,v)}/>)}</div>)}</div>
     <div className="card"><h4>Manques à gagner hors budget</h4>
      {offBudget.filter(c=>availablePost('offBudget',c.id,draftProposals,editingProposalKey))
       .map(c=><Gauge key={c.id} id={'edit-off-'+c.id} item={c}
        value={baseFor('offBudget',c.id)+(draftImpacts.find(i=>i.side==='offBudget'&&i.categoryId===c.id)?.deltaAmountBn??0)}
        tone="green" editing onChange={v=>editImpact('offBudget',c.id,v)}/>)}</div>
     <div className="actions"><button className="secondary" onClick={()=>setProposalPanel(false)}>Annuler</button>
      <button className="primary" disabled={!proposalDescription.trim()||draftImpacts.length===0} onClick={saveProposal}>Enregistrer la proposition</button></div>
    </div>}</div>
   <div className="card"><DeficitTrajectory primary={localProjection}/>
    <button className="text-button" onClick={()=>setExpert(x=>!x)}>Comment est calculé mon budget ? <ChevronDown size={16}/></button>
    {expert&&<p className="muted small">Les impacts explicites de chaque proposition sont appliqués aux postes budgétaires du référentiel V2. Les avantages hors budget modifient les recettes correspondantes. Simulation indicative jusqu’en 2032.</p>}</div>
   <div className="card budget-finalize"><h3>Que veux-tu faire de ton budget ?</h3>
    <button className="primary budget-publish" onClick={()=>setPublishOpen(true)}><Heart size={16}/> Publier mon budget</button>
    <p className="muted small">Ton budget sera visible par tous et pourra recevoir des votes. La publication ne remplace pas ta copie locale.</p>
    <div className="budget-secondary-actions"><button className="secondary" onClick={saveDraft}><Check size={16}/> Enregistrer</button></div></div>
   {publishOpen&&<div className="card" role="dialog" aria-label="Publier mon budget"><h3>Publier mon budget citoyen</h3>
    <p>Publication publique et définitive. Ta copie locale reste modifiable.</p>
    <label htmlFor="author">Nom ou pseudo public</label><input id="author" maxLength={60} value={publishAuthor} onChange={e=>setPublishAuthor(e.target.value)}/>
    <label htmlFor="title">Titre du budget</label><input id="title" maxLength={100} value={publishName} onChange={e=>setPublishName(e.target.value)}/>
    <label htmlFor="summary">Description du budget</label><textarea id="summary" maxLength={500} value={publishDescription} onChange={e=>setPublishDescription(e.target.value)}/>
    <div className="actions"><button className="secondary" onClick={()=>setPublishOpen(false)}>Annuler</button>
     <button className="primary" disabled={busy||publishName.trim().length<3||publishAuthor.trim().length<2}
      onClick={publish}>Confirmer la publication définitive</button></div></div>}
   {publicError&&<p role="alert">{publicError}</p>}
  </section>}
  {tab==='voter'&&<section className="stage"><div className="section-header"><div><div className="kicker">04 / VOTER</div>
   <h2>Découvrez les budgets</h2><p>Explore les propositions des partis et des citoyens, puis soutiens les budgets qui te convainquent.</p></div>
   <span className="pill">{published.length} budgets</span></div>
   {publicError&&<p role="alert">{publicError}</p>}
   <div className="vote-toolbar"><div className="vote-filters">
    {(['all','party','citizen'] as const).map(value=><button key={value}
      className={voteFilter===value?'active':''} onClick={()=>setVoteFilter(value)}>
      {value==='all'?'Tous':value==='party'?'Partis':'Citoyens'}</button>)}</div>
    <label className="vote-sort">Trier par <select value={voteSort} onChange={e=>setVoteSort(e.target.value as typeof voteSort)}>
     <option value="popular">Popularité</option><option value="recent">Plus récents</option>
     <option value="balance">Proximité de l'équilibre</option></select></label></div>
   <div className="vote-list">{published.filter(b=>eligibleForDisplay(b)&&(voteFilter==='all'||b.origin===voteFilter))
    .map(b=>({budget:b,result:computeBudget(b,ref)}))
    .sort((a,b)=>{
     const primary=voteSort==='popular'?b.budget.votes-a.budget.votes:
      voteSort==='recent'?new Date(b.budget.published_at??0).getTime()-new Date(a.budget.published_at??0).getTime():
      Math.abs(a.result.deficit)-Math.abs(b.result.deficit);
     return primary||sourceMeasureCount(b.budget)-sourceMeasureCount(a.budget)||
      a.budget.budgetKey.localeCompare(b.budget.budgetKey);
    })
    .map(({budget:b,result:r})=>{
     const q=hasQualifiedBudgetImpact(b)?voteQualification(baseDeficit,r.balanceDelta,years,simulationParams):{label:'Non qualifié',tone:'neutral',title:'Aucun impact chiffré qualifié'};
     return <article className="vote-card" key={b.id}><button className="vote-card-main" onClick={()=>{setVoteDetail(b.id);setOpenedProposal(null)}} aria-label={'Voir le détail de '+b.title}>
      <div className="vote-card-top"><div className="vote-author-icon">{b.origin==='party'?<Landmark size={18}/>:<UserRound size={18}/>}</div>
       <div className="vote-author"><strong>{b.origin==='party'?b.title:b.author||'Auteur anonyme'}</strong>
        <small>{b.origin==='party'?'Parti politique':'Proposition citoyenne'}</small></div></div>
      <div className="vote-card-badges"><MaturityTag b={b}/><Champion b={b} championId={championId}/>
       <span className={'vote-impact vote-impact--'+q.tone} title={q.title}>{q.label}</span></div>
      <h3>{b.title}</h3><p className="muted small">{b.description||'Consulter les propositions de ce budget.'}</p>
      <div className="vote-meta"><span><ListChecks size={15}/>{sourceMeasureCount(b)} mesures</span>
       <span><Heart size={15}/>{b.votes} votes</span></div></button>
      <button className="primary vote-action" disabled={busy} onClick={()=>vote(b.id)}><Heart size={16}/> Soutenir</button></article>;
    })}</div>
   {voteDetail&&(()=>{const b=published.find(x=>x.id===voteDetail);if(!b)return null;
    const result=computeBudget(b,ref);return <div className="sheet-backdrop" onClick={()=>setVoteDetail(null)}>
     <section className="budget-sheet" role="dialog" aria-modal="true" aria-label={'Détail du budget '+b.title}
      onClick={e=>e.stopPropagation()}><div className="sheet-handle"/><div className="sheet-heading"><div>
       <span className="kicker">{b.origin==='party'?'PARTI POLITIQUE':'PROPOSITION CITOYENNE'} · {b.author||b.title}</span>
       <h2>{b.title}</h2><Champion b={b} championId={championId}/></div>
       <button className="sheet-close" aria-label="Fermer" onClick={()=>setVoteDetail(null)}><X size={20}/></button></div>
      <BudgetSummary title="Synthèse du budget" shareBudget={{id:b.id,title:b.title}}
       revenues={result.revenueTotal} expenses={result.expenseTotal} deficit={result.deficit} referenceDeficit={baseDeficit}/>
      {renderDetails(b,result)}
      <div className="sheet-actions"><button className="primary" disabled={busy} onClick={()=>vote(b.id)}>
       <Heart size={16}/> Soutenir · {b.votes} votes</button></div></section></div>})()}
  </section>}
  <footer><div><b>Mon Budget Citoyen</b><span>Un outil citoyen open source et non partisan.</span></div>
   <div><a href="https://github.com/dsissoko/france-budget" target="_blank" rel="noreferrer">GitHub <ExternalLink size={13}/></a>
    <a href="https://github.com/dsissoko/france-budget/blob/main/docs/vision.md" target="_blank" rel="noreferrer">Vision <ExternalLink size={13}/></a><a href="/cgu.html" target="_blank" rel="noreferrer">CGU <ExternalLink size={13}/></a></div></footer>
  </main></div>;
}
