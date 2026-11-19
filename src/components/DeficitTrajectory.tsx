import {QUALIFICATIONS,type QualificationTone} from '../engine/qualification';
import type {ProjectionResult} from '../engine/simulation';
import {buildSlopeGraph,type SlopeSeries} from './slopegraph';
import './DeficitTrajectory.css';

type Props={primary:ProjectionResult;secondary?:ProjectionResult;referenceOnly?:boolean};
const seriesColors:Record<SlopeSeries['id'],string>={
 reference:'#9b9e9a',a:'#c58b39',b:'#238d80',
};
const amount=(value:number)=>new Intl.NumberFormat('fr-FR',{maximumFractionDigits:1}).format(value)+' Md€';
const benefit=(difference:number)=>{
 if(Math.abs(difference)<.05)return 'Même déficit que la référence';
 return amount(Math.abs(difference))+(difference>0?' de déficit évité':' de déficit supplémentaire')+' vs référence';
};
const toneText:Record<QualificationTone,string>={
 positive:'positive',negative:'negative',neutral:'neutral',warning:'warning',
};
const pointPath=(points:SlopeSeries['points'])=>points.map((p,i)=>(i===0?'M':'L')+p.x.toFixed(2)+' '+p.y.toFixed(2)).join(' ');
const last=<T,>(items:T[])=>items[items.length-1];

export default function DeficitTrajectory({primary,secondary,referenceOnly=false}:Props){
 const graph=buildSlopeGraph(primary,secondary,referenceOnly);
 const qA=QUALIFICATIONS[primary.assessment.code];
 const qB=secondary?QUALIFICATIONS[secondary.assessment.code]:null;
 const comparison=Boolean(secondary);
 const caption=graph.startYear+' → '+graph.endYear+' · Effets dès '+graph.applicationYear;
 const seriesName=(id:SlopeSeries['id'])=>
   id==='reference'?'Sans changement':id==='a'?(comparison?'Budget A':'Avec ce budget'):'Budget B';
 const chartDescription=graph.series.map(s=>seriesName(s.id)+' : '+amount(s.points[0].value)+' en '+graph.startYear+', '+amount(s.ending)+' en '+graph.endYear).join(' ; ');
 const assessments=referenceOnly?[]:[
  {id:'a' as const,label:comparison?'Budget A':'Avec ce budget',qualification:qA,difference:graph.deltas.a,amount:graph.series.find(s=>s.id==='a')?.ending},
  ...(qB?[{id:'b' as const,label:'Budget B',qualification:qB,difference:graph.deltas.b,amount:graph.series.find(s=>s.id==='b')?.ending}]:[]),
 ];
 return <div className="deficit-trajectory" aria-label="Projection indicative du déficit public">
  <div className="deficit-trajectory__header">
   <div>
    <h3>{comparison?'Évolution des déficits':referenceOnly?'Évolution du déficit':qA.title}</h3>
    <p>{caption}</p>
   </div>
   {!comparison&&!referenceOnly&&<span className={'deficit-trajectory__badge deficit-trajectory__badge--'+qA.tone}>{qA.label}</span>}
  </div>
  <div className="deficit-trajectory__plot">
   <svg viewBox="0 0 360 162" role="img" aria-label={chartDescription} preserveAspectRatio="xMidYMid meet">
    <title>{chartDescription}</title>
    <line x1="28" x2="28" y1="10" y2="128" stroke="currentColor" strokeOpacity=".12"/>
    <line x1="332" x2="332" y1="10" y2="128" stroke="currentColor" strokeOpacity=".12"/>
    <line x1={28+304*(graph.applicationYear-graph.startYear)/(graph.endYear-graph.startYear)}
      x2={28+304*(graph.applicationYear-graph.startYear)/(graph.endYear-graph.startYear)}
      y1="10" y2="128" stroke="#238d80" strokeOpacity=".35" strokeDasharray="3 4"/>
    {graph.series.map(series=><g key={series.id}>
      <path d={pointPath(series.points)} fill="none" stroke={seriesColors[series.id]}
        strokeWidth={series.id==='reference'?2.5:3.5}
        strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray={series.id==='b'?'6 5':undefined}/>
      <circle cx={series.points[0].x} cy={series.points[0].y}
        r={series.id==='reference'?3.5:3} fill={seriesColors[series.id]}/>
      <circle cx={last(series.points).x} cy={last(series.points).y}
        r={series.id==='reference'?4:4.5} fill={seriesColors[series.id]}/>
    </g>)}
    <text x="28" y="153" fill="currentColor" opacity=".72" textAnchor="middle" fontSize="12">2025</text>
    <text x={28+304*(graph.applicationYear-graph.startYear)/(graph.endYear-graph.startYear)}
      y="153" fill="#238d80" textAnchor="middle" fontSize="12" fontWeight="700">2027</text>
    <text x="332" y="153" fill="currentColor" opacity=".72" textAnchor="middle" fontSize="12">2032</text>
   </svg>
  </div>
  <div className="deficit-trajectory__legend">
   {graph.series.map(series=><span key={series.id}>
    <i className={series.id==='b'?'dashed':''} style={series.id==='b'?{borderColor:seriesColors[series.id]}:{background:seriesColors[series.id]}}/>
    {seriesName(series.id)}
   </span>)}
  </div>
  <div className="deficit-trajectory__results">
   <div className="deficit-trajectory__result deficit-trajectory__result--reference">
    <div className="deficit-trajectory__result-title"><span className="deficit-trajectory__stripe" style={{background:seriesColors.reference}}/>Référence en 2032</div>
    <strong>{amount(graph.reference2032)}</strong>
   </div>
   {assessments.map(item=><div className="deficit-trajectory__result" key={item.id}>
    <div className="deficit-trajectory__result-top">
     <span className="deficit-trajectory__result-title"><span className="deficit-trajectory__stripe" style={{background:seriesColors[item.id]}}/>{item.label} en 2032</span>
     <strong>{amount(item.amount!)}</strong>
    </div>
    <div className="deficit-trajectory__result-bottom">
     <span className={'deficit-trajectory__assessment--'+toneText[item.qualification.tone]}>{item.qualification.label}</span>
     <span>{benefit(item.difference!)}</span>
    </div>
   </div>)}
  </div>
  <div className="deficit-trajectory__footnotes">
   <span>Échelle verticale adaptée aux valeurs affichées</span>
   <span>Simulation indicative</span>
  </div>
  <details className="deficit-trajectory__details">
   <summary>Comprendre cette projection</summary>
   <p>Référence comptable 2025 ; budget simulé applicable en 2027, effets annuels constants jusqu’à l’horizon 2032. Le déficit de référence augmente mécaniquement de 2,5 % de sa valeur de 2025 par année. Les effets indirects et calendriers propres aux mesures ne sont pas modélisés. Les contre-budgets 2026 sont transposés à titre illustratif. La comparaison utilise la même échelle pour les courbes : une petite différence numérique demeure visuellement petite. Ce n’est pas une prévision.</p>
  </details>
 </div>;
}
