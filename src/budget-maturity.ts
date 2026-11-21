/** Budget-level data maturity, distinct from financial performance and publication visibility. */
export const maturityStatuses = ['non_verifie','en_preparation','complet','a_confirmer','confirme'] as const;
export type BudgetMaturityStatus = typeof maturityStatuses[number];

export type BudgetMaturity = {
  origin: 'party'|'citizen';
  maturity_status?: string|null;
  confirmation_organization?: string|null;
  confirmation_evidence_url?: string|null;
  confirmed_at?: string|null;
};

const statuses: Record<BudgetMaturityStatus,{label:string;description:string;tone:string}> = {
  non_verifie: {label:'Non vérifié',description:'Budget publié sans vérification documentaire indépendante.',tone:'unverified'},
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

/** Render only an explicitly supplied, recognized status, regardless of budget origin. */
export function budgetMaturity(b:BudgetMaturity){
  const raw=b.maturity_status;
  if(!raw||!maturityStatuses.includes(raw as BudgetMaturityStatus))return null;
  const status=raw as BudgetMaturityStatus;
  // Never present a budget as officially confirmed without evidence.
  if(status==='confirme'&&(!b.confirmation_organization?.trim()||!b.confirmed_at||!b.confirmation_evidence_url?.startsWith('https://'))){
    return null;
  }
  return {...statuses[status],status};
}
