export type Category={id:string;label:string;amount:number;canonical:string;description:string};
export type Measure={id:string;party:'RN'|'LFI'|'Horizons';theme:string;title:string;revenueDelta:number;expenseDelta:number;source:string;year:number;status:'publié'|'illustration';description:string};
export const expenses:Category[]=[
{id:'social',label:'Retraites et solidarité',amount:620,canonical:'COFOG 10 — Protection sociale',description:'Retraites, prestations sociales et solidarité.'},
{id:'health',label:'Santé',amount:280,canonical:'COFOG 07 — Santé',description:'Hôpitaux, soins et politique de santé.'},
{id:'education',label:'Éducation',amount:180,canonical:'COFOG 09 — Enseignement',description:'Écoles, universités et formation.'},
{id:'economy',label:'Économie et transports',amount:155,canonical:'COFOG 04 — Affaires économiques',description:'Infrastructures, aides économiques, transports.'},
{id:'general',label:'Services publics généraux',amount:150,canonical:'COFOG 01 — Services publics généraux',description:'Administration générale, dette et autres services.'},
{id:'defense',label:'Défense',amount:65,canonical:'COFOG 02 — Défense',description:'Armées et défense nationale.'},
{id:'safety',label:'Sécurité et justice',amount:55,canonical:'COFOG 03 — Ordre et sécurité publics',description:'Police, justice et sécurité.'},
{id:'culture',label:'Culture et loisirs',amount:40,canonical:'COFOG 08 — Loisirs, culture et culte',description:'Culture, sport et loisirs.'},
{id:'housing',label:'Logement',amount:55,canonical:'COFOG 06 — Logement et équipements collectifs',description:'Logement et équipements collectifs.'},
{id:'environment',label:'Environnement',amount:50,canonical:'COFOG 05 — Protection de l’environnement',description:'Actions de protection de l’environnement.'}
];
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
{id:'other',label:'Autres recettes',amount:0,canonical:'SEC 2010 — Autres recettes',description:'Autres catégories de recettes.'}
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
export const years=[2025,2026,2027,2028,2029,2030];
export const sum=(items:Category[])=>items.reduce((a,i)=>a+i.amount,0);
export const currency=(v:number)=>new Intl.NumberFormat('fr-FR',{maximumFractionDigits:1}).format(v)+' Md€';
