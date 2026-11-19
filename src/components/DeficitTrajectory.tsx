import {Line,LineChart,XAxis,Tooltip,ResponsiveContainer} from 'recharts';
import {QUALIFICATIONS,type QualificationTone} from '../engine/qualification';
import type {ProjectionResult} from '../engine/simulation';
import './DeficitTrajectory.css';

type Props={primary:ProjectionResult; secondary?:ProjectionResult; referenceOnly?:boolean};
const tones:Record<QualificationTone,string>={positive:'#268f7f',neutral:'#858581',warning:'#cd9244',negative:'#c76d61'};
const label=(n:number)=>new Intl.NumberFormat('fr-FR',{maximumFractionDigits:1}).format(n)+' Md€';
export default function DeficitTrajectory({primary,secondary,referenceOnly=false}:Props){
 const a=QUALIFICATIONS[primary.assessment.code];
 const b=secondary?QUALIFICATIONS[secondary.assessment.code]:null;
 const rows=primary.rows.map((r,i)=>({
  year:String(r.year),reference:r.reference,
  scenario: r.scenario,
  b:secondary?.rows[i]?.scenario,
 }));
 const shareReference=referenceOnly;
 return <div className="deficit-trajectory" aria-label="Projection indicative du déficit public">
   <div className="deficit-trajectory__header">
     <div><h3>{secondary?'Évolution des déficits':a.title}</h3>
       <p>{secondary?'Deux budgets, une même référence.':shareReference?'Sans changement, le déficit poursuit sa trajectoire.':a.tone==='positive'?'La tendance s’améliore.':a.tone==='negative'?'La tendance se dégrade.':a.tone==='warning'?'La hausse se poursuit.':'La tendance reste stable.'}</p>
     </div>
     {!secondary&&<span className={'deficit-trajectory__badge deficit-trajectory__badge--'+a.tone}>{a.label}</span>}
   </div>
   <div className="deficit-trajectory__plot">
     <ResponsiveContainer width="100%" height={112}>
       <LineChart data={rows} margin={{top:9,right:7,bottom:0,left:5}}>
         <XAxis dataKey="year" axisLine={false} tickLine={false} ticks={['2025','2027','2030','2032']} interval={0} tick={{fontSize:10,fill:'#85857f'}} tickMargin={7}/>
         <Tooltip formatter={(v,name)=>[label(Number(v)),name==='reference'?'Sans changement':name==='b'?'Budget B':secondary?'Budget A':'Avec ce budget']} labelFormatter={v=>'Année '+v} />
         <Line type="linear" dataKey="reference" name="reference" stroke="#b9b9b4" strokeWidth={2.2} dot={false} activeDot={{r:3}} isAnimationActive={false} />
         {!referenceOnly&&<Line type="linear" dataKey="scenario" name="scenario" stroke={tones[a.tone]} strokeWidth={3} dot={false} activeDot={{r:3}} isAnimationActive={false}/>}
         {secondary&&b&&<Line type="linear" dataKey="b" name="b" stroke={tones[b.tone]} strokeWidth={2.5} strokeDasharray="5 4" dot={false} activeDot={{r:3}} isAnimationActive={false}/>}
       </LineChart>
     </ResponsiveContainer>
   </div>
   <div className="deficit-trajectory__footer">
     <div className="deficit-trajectory__legend">
       <span><i style={{background:'#b9b9b4'}}/>Sans changement</span>
       {!referenceOnly&&<span><i style={{background:tones[a.tone]}}/>{secondary?'Budget A':'Avec ce budget'}</span>}
       {secondary&&b&&<span><i className="dashed" style={{borderColor:tones[b.tone]}}/>Budget B</span>}
     </div>
     <span className="deficit-trajectory__disclaimer">Effets 2027 · Horizon 2032</span>
   </div>
   {secondary&&b&&<div className="deficit-trajectory__assessments">
     <span>Budget A : <strong className={'deficit-trajectory__assessment--'+a.tone}>{a.label}</strong></span>
     <span>Budget B : <strong className={'deficit-trajectory__assessment--'+b.tone}>{b.label}</strong></span>
   </div>}
   <details className="deficit-trajectory__details"><summary>Comprendre cette projection</summary><p>Référence comptable 2025 ; budget simulé applicable en 2027, effets constants jusqu’à l’horizon 2032. Le déficit de référence augmente mécaniquement de 2,5 % de sa valeur de 2025 par année. Les effets économiques indirects et les calendriers de mise en œuvre propres aux mesures ne sont pas modélisés. Les chiffrages de contre-budgets 2026 sont ici transposés à titre illustratif. Ce n’est pas une prévision.</p></details>
 </div>;
}
