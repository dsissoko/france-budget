/** Budget-level data maturity, distinct from financial performance and publication visibility. */
export const maturityStatuses = ['en_preparation','complet','a_confirmer','confirme'] as const;
export type BudgetMaturityStatus = typeof maturityStatuses[number];

export type BudgetMaturity = {
  origin: 'party'|'citizen';
  maturity_status?: string|null;
  confirmation_organization?: string|null;
  confirmation_evidence_url?: string|null;
  confirmed_at?: string|null;
};

const statuses: Record<BudgetMaturityStatus,{label:string;description:string;tone:string}> = {
  en_preparation: {
    label:'En préparation',
    description:'Collecte ou rapprochement des données en cours. Le budget ne représente pas nécessairement tout le programme.',
    tone:'preparation'
  },
  complet: {
    label:'Complet',
    description:'Les propositions ont été intégrées sur le périmètre annoncé. La restitution doit encore être contrôlée avant de solliciter le parti.',
    tone:'complete'
  },
  a_confirmer: {
    label:'À confirmer',
    description:'Restitution suffisamment mûre pour être soumise à la formation politique, sans confirmation reçue à ce stade.',
    tone:'ready'
  },
  confirme: {
    label:'Confirmé',
    description:'La formation politique a explicitement confirmé la fidélité documentaire de cette restitution. Cela ne garantit ni faisabilité ni effets économiques.',
    tone:'confirmed'
  }
};

/** Only party budgets show the feature during its initial rollout. */
export function budgetMaturity(b:BudgetMaturity){
  if(b.origin!=='party')return null;
  const raw=b.maturity_status;
  const status:BudgetMaturityStatus = maturityStatuses.includes(raw as BudgetMaturityStatus)
    ? raw as BudgetMaturityStatus : 'en_preparation';
  // Never present a budget as officially confirmed without evidence.
  if(status==='confirme'&&(!b.confirmation_organization?.trim()||!b.confirmed_at||!b.confirmation_evidence_url?.startsWith('https://'))){
    return {...statuses.en_preparation,status:'en_preparation' as const};
  }
  return {...statuses[status],status};
}
