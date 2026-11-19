export type Category={id:string;label:string;amount:number;canonical:string;description:string};
import {ENTERPRISE_AIDS,OFF_BUDGET_ACCOUNTING_NOTE} from './enterprise-aids';
export type Measure={id:string;party:'RN'|'LFI'|'Horizons';theme:string;title:string;revenueDelta:number;expenseDelta:number;source:string;year:number;status:'publié'|'illustration';description:string};
// Totaux officiels APU 2025 INSEE : dépenses 1 714,1 Md€, recettes 1 561,6 Md€, déficit 152,5 Md€.
// La répartition par catégorie est indicative ; les lignes d'ajustement rendent les totaux exacts.
// Soutien aux entreprises : reclassement PÉDAGOGIQUE de 30 Md€ depuis « économie » ; ce montant n'est PAS une statistique officielle des aides.
// Source : https://www.insee.fr/fr/statistiques/8956575
export const expenses:Category[]=[
{id:'social',label:'Retraites et pensions',amount:400,canonical:'COFOG 10.2 — Vieillesse et 10.3 — Survivants (ventilation indicative)',description:'Pensions de retraite et pensions de réversion. Montant indicatif issu du reclassement de l’ancien poste de 620 Md€, non certifié.'},
{id:'family',label:'Famille et enfance',amount:65,canonical:'COFOG 10.4 — Famille et enfants (ventilation indicative)',description:'Allocations familiales et soutien à la parentalité et à l’enfance. Montant indicatif, non certifié.'},
{id:'unemployment',label:'Chômage et insertion',amount:50,canonical:'COFOG 10.5 — Chômage (ventilation indicative)',description:'Indemnisation du chômage et dispositifs d’insertion associés. Montant indicatif, non certifié.'},
{id:'solidarity',label:'Solidarité et autonomie',amount:105,canonical:'COFOG 10 — Autres fonctions de protection sociale (ventilation indicative)',description:'RSA, prime d’activité, handicap, invalidité, dépendance et autres protections sociales. Regroupement pédagogique, non certifié.'},
{id:'health',label:'Santé',amount:280,canonical:'COFOG 07 — Santé',description:'Hôpitaux, soins et politique de santé.'},
{id:'education',label:'Éducation',amount:180,canonical:'COFOG 09 — Enseignement',description:'Écoles, universités et formation.'},
{id:'economy',label:'Économie et transports',amount:125,canonical:'COFOG 04 — Affaires économiques (ventilation indicative)',description:'Transports, infrastructures et autres affaires économiques, hors soutien aux entreprises isolé ci-dessous.'},
{id:'enterprise-support',label:'Soutien public aux entreprises',amount:30,canonical:'Sous-ensemble indicatif de COFOG 04 — Affaires économiques',description:'Dépenses directes de soutien aux entreprises : enveloppe pédagogique de 30 Md€ reclassée depuis Économie et transports pour conserver les comptes APU 2025. Le recensement officiel élargi 2024 atteint 166,1 Md€ : 43,3 Md€ d’aides budgétaires, 49,7 Md€ d’avantages fiscaux, 69,1 Md€ d’allègements de cotisations et 4,0 Md€ d’aides financières. Ces chiffres de millésimes et de périmètres différents ne sont pas additionnables.'},
{id:'general',label:'Services publics généraux',amount:150,canonical:'COFOG 01 — Services publics généraux',description:'Administration générale, dette et autres services.'},
{id:'defense',label:'Défense',amount:65,canonical:'COFOG 02 — Défense',description:'Armées et défense nationale.'},
{id:'safety',label:'Sécurité et justice',amount:55,canonical:'COFOG 03 — Ordre et sécurité publics',description:'Police, justice et sécurité.'},
{id:'culture',label:'Culture et loisirs',amount:40,canonical:'COFOG 08 — Loisirs, culture et culte',description:'Culture, sport et loisirs.'},
{id:'housing',label:'Logement',amount:55,canonical:'COFOG 06 — Logement et équipements collectifs',description:'Logement et équipements collectifs.'},
{id:'environment',label:'Environnement',amount:50,canonical:'COFOG 05 — Protection de l’environnement',description:'Actions de protection de l’environnement.'},
{id:'other-expenses',label:'Autres dépenses et ajustement',amount:64.1,canonical:'Ventilation indicative — solde de rapprochement INSEE 2025',description:'Complément de ventilation pour retrouver exactement les dépenses publiques 2025 ; répartition fonctionnelle à consolider.'}
];
// Hors budget : recensement des avantages, sans ajout aux dépenses/recettes 2025.
export const offBudget:Category[]=[
 {id:'business-tax-relief',label:'Avantages fiscaux aux entreprises',amount:ENTERPRISE_AIDS.fiscal,
  canonical:'Jaune budgétaire PLF 2027 — aides fiscales 2024 · hors budget',
  description:'49,7 Md€ d’avantages fiscaux recensés en 2024 : crédits d’impôt, exonérations et taux réduits. '+OFF_BUDGET_ACCOUNTING_NOTE},
 {id:'business-social-relief',label:'Allègements de cotisations des entreprises',amount:ENTERPRISE_AIDS.social,
  canonical:'Jaune budgétaire PLF 2027 — aides sociales 2024 · hors budget',
  description:'69,1 Md€ d’allègements et exonérations de cotisations recensés en 2024. '+OFF_BUDGET_ACCOUNTING_NOTE},
];
// 4,0 Md€ d’aides financières en équivalent-avantage : documentés dans la
// description du soutien aux entreprises, mais pas convertis en recettes fictives.
export const revenues:Category[]=[
{id:'vat',label:'TVA et consommation',amount:260,canonical:'SEC 2010 — Impôts sur produits',description:'Fiscalité sur les achats et la consommation.'},
{id:'income',label:'Impôt sur le revenu',amount:115,canonical:'SEC 2010 — Impôts courants sur revenu',description:'Prélèvements sur les revenus des ménages.'},
{id:'business',label:'Fiscalité des entreprises',amount:110,canonical:'SEC 2010 — Impôts sur revenus et production',description:'Impôt sur les sociétés et autres prélèvements.'},
{id:'contributions',label:'Cotisations sociales',amount:520,canonical:'SEC 2010 — Cotisations sociales nettes',description:'Cotisations employeurs et salariés.'},
{id:'socialtax',label:'CSG et prélèvements sociaux',amount:210,canonical:'SEC 2010 — Impôts courants sur revenu',description:'Prélèvements affectés notamment à la protection sociale.'},
{id:'property',label:'Patrimoine et immobilier',amount:85,canonical:'SEC 2010 — Impôts sur capital/production',description:'Fiscalité du patrimoine et foncière.'},
{id:'energy',label:'Énergie et environnement',amount:45,canonical:'SEC 2010 — Impôts sur produits',description:'Fiscalité énergétique et environnementale.'},
{id:'otherTax',label:'Autres impôts',amount:95,canonical:'SEC 2010 — Impôts divers',description:'Autres recettes fiscales.'},
{id:'nontax',label:'Recettes non fiscales',amount:80,canonical:'SEC 2010 — Revenus de la propriété, ventes et transferts',description:'Dividendes, services, revenus divers.'},
{id:'other',label:'Autres recettes et ajustement',amount:41.6,canonical:'Ventilation indicative — solde de rapprochement INSEE 2025',description:'Complément de ventilation pour retrouver exactement les recettes publiques 2025 ; répartition économique à consolider.'}
];
// Mesures de démonstration uniquement : intitulés inspirés de débats publics,
// montants fictifs, jamais présentés comme chiffrages des formations.
export const measures:Measure[]=[
{id:'rn-vat',party:'RN',theme:'Pouvoir d’achat',title:'Réduire la TVA sur certaines énergies',revenueDelta:-10.96,expenseDelta:0,source:'https://rassemblementnational.fr/documents/GRN-CONTRE-BUDGET-2026.pdf',year:2026,status:'publié',description:'Chiffrage revendiqué dans le contre-budget RN 2026, page 4 ; projet gouvernemental d’octobre 2025 comme base.'},
{id:'rn-social',party:'RN',theme:'Immigration',title:'Modifier les conditions d’accès à certaines prestations',revenueDelta:0,expenseDelta:-6.1,source:'https://rassemblementnational.fr/documents/GRN-CONTRE-BUDGET-2026.pdf',year:2026,status:'publié',description:'Économies revendiquées par le RN, page 3. Impacts emploi, cotisations et macroéconomie non validés.'},
{id:'rn-agencies',party:'RN',theme:'Fonctionnement public',title:'Réduire certaines dépenses d’organismes publics',revenueDelta:0,expenseDelta:-7.7,source:'https://rassemblementnational.fr/documents/GRN-CONTRE-BUDGET-2026.pdf',year:2026,status:'publié',description:'Économie revendiquée dans le contre-budget RN, page 3 ; ventilation simulée indicative.'},
{id:'lfi-wealth',party:'LFI',theme:'Fiscalité',title:'Augmenter la taxation des très hauts patrimoines',revenueDelta:18,expenseDelta:0,source:'https://lafranceinsoumise.fr/',year:2026,status:'illustration',description:'Exemple inspiré du débat autour de la taxation des grands patrimoines ; montant fictif.'},
{id:'lfi-school',party:'LFI',theme:'Éducation',title:'Gratuité des cantines, fournitures, transports et activités périscolaires',revenueDelta:0,expenseDelta:3.6,source:'https://lafranceinsoumise.fr/wp-content/uploads/2025/10/Budget-2026_LFI_web_pages.pdf',year:2026,status:'publié',description:'Montant publié dans le contre-budget LFI 2026 pour la gratuité des services scolaires.'},
{id:'lfi-green',party:'LFI',theme:'Écologie',title:'Développer les filières françaises d’énergies renouvelables',revenueDelta:0,expenseDelta:10.6,source:'https://lafranceinsoumise.fr/wp-content/uploads/2025/10/Budget-2026_LFI_web_pages.pdf',year:2026,status:'publié',description:'Montant publié par LFI pour les filières françaises de production d’énergies renouvelables.'},
{id:'hor-admin',party:'Horizons',theme:'Services publics',title:'Réduire progressivement les effectifs administratifs',revenueDelta:0,expenseDelta:-5,source:'https://parti-horizons.fr/',year:2027,status:'illustration',description:'Illustration d’une économie de fonctionnement, sans chiffrage validé.'},
{id:'hor-tax',party:'Horizons',theme:'Fiscalité',title:'Limiter certaines hausses de prélèvements',revenueDelta:-4,expenseDelta:0,source:'https://parti-horizons.fr/',year:2027,status:'illustration',description:'Exemple de perte de recettes calculée fictivement.'}
];
export const partyNames=['Référence 2025','RN','LFI','Horizons'] as const;
export type Party=typeof partyNames[number];
// Shared business calendar, not a separate UI-defined range.
export {projectionYears as years} from './engine/simulation';
export const sum=(items:Category[])=>items.reduce((a,i)=>a+i.amount,0);
export const currency=(v:number)=>new Intl.NumberFormat('fr-FR',{maximumFractionDigits:1}).format(v)+' Md€';
