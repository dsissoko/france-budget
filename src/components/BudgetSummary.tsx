import {useState} from 'react';
import {Share2} from 'lucide-react';
import {currency} from '../data';
import {publishedBudgetUrl} from '../share';
import './BudgetSummary.css';

type BudgetSummaryProps = {
  title: string;
  side?: 'a' | 'b';
  revenues: number;
  expenses: number;
  deficit: number;
  referenceDeficit: number;
  shareBudget?: {id: string; title: string};
};

export const formatSummaryAmount = (value:number) => new Intl.NumberFormat('fr-FR',{maximumFractionDigits:1}).format(value);
const percent = (value: number) => value.toLocaleString('fr-FR', {maximumFractionDigits: 1});
const closeToZero = (value: number) => Math.abs(value) < 0.05;

export default function BudgetSummary({title,side,revenues,expenses,deficit,referenceDeficit,shareBudget}:BudgetSummaryProps) {
  const [shareFeedback,setShareFeedback]=useState('');
  const share=async()=>{
    if(!shareBudget)return;
    setShareFeedback('');
    const url=publishedBudgetUrl(shareBudget.id,window.location.origin);
    if(typeof navigator.share==='function'){
      try {
        await navigator.share({title:shareBudget.title,text:'Découvre ce budget pour la France et soutiens-le sur Mon Budget Citoyen.',url});
        return;
      }catch(error){
        if(error instanceof DOMException && error.name==='AbortError')return;
      }
    }
    try{
      await navigator.clipboard.writeText(url);
      setShareFeedback('Lien copié');
    }catch{
      setShareFeedback('Copie le lien affiché');
      window.prompt('Copie le lien vers le budget',url);
    }
  };
  // The visual is a proportion of the scenario's expenses, not an estimate of financial sustainability.
  const covered = expenses > 0 ? Math.max(0,Math.min(100,100*revenues/expenses)) : 100;
  const gap = 100-covered;
  const improvement = referenceDeficit-deficit;
  const trend = closeToZero(improvement)
    ? 'Déficit inchangé par rapport à la référence'
    : improvement > 0
      ? 'Déficit réduit de '+currency(Math.abs(improvement))+' vs référence'
      : 'Déficit augmenté de '+currency(Math.abs(improvement))+' vs référence';
  return <article className={'budget-summary budget-summary--'+(side||'personal')} aria-label={'Synthèse du budget '+title}>
    <div className="budget-summary__heading">
      <h3>{side&&<span className="budget-summary__side">{side.toUpperCase()}</span>}{title}</h3>
      <div className="budget-summary__heading-actions"><span className="budget-summary__period">2025 · Md€</span>{shareBudget&&<button type="button" className="budget-summary__share" aria-label={'Partager '+shareBudget.title} onClick={()=>void share()}><Share2 size={13}/> Partager</button>}</div>
    </div>
    <div className="budget-summary__figures">
      <div><span>Recettes</span><strong className="green-text">{formatSummaryAmount(revenues)}</strong></div>
      <div><span>Dépenses</span><strong>{formatSummaryAmount(expenses)}</strong></div>
      <div><span>Déficit</span><strong className="coral-text">{formatSummaryAmount(deficit)}</strong></div>
    </div>
    <div className="budget-summary__funding">
      <div className="budget-summary__track" role="img" aria-label={percent(covered)+' % des dépenses couvertes par les recettes ; '+percent(gap)+' % non couvertes'}>
        <span className="budget-summary__paid" style={{width:covered+'%'}}/>
        <span className="budget-summary__unpaid"/>
      </div>
      <div className="budget-summary__legend"><span>{percent(covered)} % financés</span><span>{percent(gap)} % de déficit</span></div>
    </div>
    <p className="budget-summary__difference">{trend}</p>{shareFeedback&&<p className="budget-summary__share-feedback" role="status">{shareFeedback}</p>}
  </article>;
}
