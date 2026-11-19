import type {QualificationCode} from './assessment';

// Presentation-only strings. The assessment service is independent of French copy / colors.
export type QualificationTone='positive'|'neutral'|'warning'|'negative';
export interface Qualification {title:string;label:string;tone:QualificationTone}
export const QUALIFICATIONS:Record<QualificationCode,Qualification>={
  SURPLUS_REACHED:{title:'Le budget devient excédentaire',label:'Excédent',tone:'positive'},
  BALANCE_REACHED:{title:"Le budget atteint l’équilibre",label:'Équilibre',tone:'positive'},
  DEFICIT_RETURNED:{title:'Le budget repasse dans le rouge',label:'Déficit de retour',tone:'negative'},
  SURPLUS_TO_BALANCE:{title:"Le budget revient à l’équilibre",label:'Équilibre',tone:'neutral'},
  BALANCE_STABLE:{title:"Le budget reste à l’équilibre",label:'Équilibre',tone:'positive'},
  SURPLUS_STABLE:{title:'Le budget reste excédentaire',label:'Excédent',tone:'positive'},
  DEFICIT_DECREASING:{title:'Le déficit diminue',label:'En bonne voie',tone:'positive'},
  INCREASE_DECELERATING:{title:'La hausse du déficit ralentit',label:'Ralentissement',tone:'positive'},
  DEFICIT_STABLE:{title:'Le déficit reste stable',label:'Stagnation',tone:'neutral'},
  INCREASE_STEADY:{title:'Le déficit continue de grimper',label:'Hausse persistante',tone:'warning'},
  INCREASE_ACCELERATING:{title:'Le déficit grimpe de plus en plus vite',label:'Accélération',tone:'negative'},
  UNDETERMINED:{title:'Évolution du déficit',label:'À déterminer',tone:'neutral'},
};
