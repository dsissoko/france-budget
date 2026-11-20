# Notre méthode — Mon Budget Citoyen

## Notre approche : des chiffres sérieux, des catégories qui parlent

Mon Budget Citoyen n'est **pas une reproduction du budget de l'État**. Le simulateur couvre **l'ensemble des administrations publiques (APU/S13)** : État, Sécurité sociale et collectivités territoriales. Il regroupe les dépenses et recettes en thèmes compréhensibles : retraites, santé, éducation, logement, sécurité, fiscalité, etc. Les noms et regroupements sont des **choix éditoriaux pédagogiques** ; leur transparence et leur traçabilité sont indispensables. Une nomenclature officielle n'est pas forcément intelligible pour le public.

## 1. Ce qui est officiel et ce qui est estimé

Le **déficit des APU en 2025 est de 152,5 Md€**, selon l'INSEE. Les données provisoires de mai 2026 donnent **1 561,7 Md€ de recettes** et **1 714,2 Md€ de dépenses** (même périmètre, même millésime). Source : [INSEE, compte des APU 2025](https://www.insee.fr/fr/statistiques/8997691), figure 4. Les valeurs antérieures de référence (1 561,6 / 1 714,1 Md€) proviennent de la notification de mars 2026 : [INSEE](https://www.insee.fr/fr/statistiques/8956575).

**Une valeur officielle nationale n'implique pas que chaque catégorie citoyenne le soit.** Le détail des *dépenses par fonction* le plus récent actuellement disponible concerne **2024**, publié dans les tableaux [INSEE COFOG 3.301](https://www.insee.fr/fr/statistiques/8574707) et l'étude [Usage de l'argent public en 2024](https://www.insee.fr/fr/statistiques/8735252). Les impôts par nature sont disponibles pour **2025** dans [INSEE, Impôts](https://www.insee.fr/fr/statistiques/2381408).

La règle est la suivante :
- **Officiel** : montant directement publié pour un champ, une année et une définition précis.
- **Reconstitué** : somme ou différence de composantes officielles **non chevauchantes**, avec calcul explicite.
- **Estimé** : montant fondé sur la dernière ventilation officielle et une hypothèse de prolongation documentée. Une estimation 2025 calculée à partir de fonctions 2024 n'est pas un « chiffre INSEE 2025 » par catégorie.
- **Illustratif** : enveloppe purement pédagogique, non certifiée.

Les montants doivent toujours être accompagnés de leur **périmètre, année, source et statut**. Quand le détail des composantes ne permet pas une ventilation certaine, nous le signalons plutôt que d'affirmer une précision trompeuse.

## 2. De la nomenclature officielle aux agrégats citoyens

La construction du référentiel vise deux rapprochements :
1. Chaque agrégat citoyen doit être rattaché à des composantes de la comptabilité nationale (dépenses : COFOG/CFAP ; recettes : SEC 2010 et détail des impôts), sans compter deux fois une même dépense ou recette.
2. Le total des agrégats doit retrouver les **comptes publics APU consolidés** de l'année de référence ; une ligne d'ajustement technique ne remplace **pas** la justification économique des sous-postes.

Les sous-thèmes « Retraites et pensions », « Famille et enfance », « Chômage et insertion » et « Solidarité et autonomie » forment ensemble une ventilation citoyenne de la protection sociale. Il ne faut jamais ajouter ces quatre lignes à leur parent « Protection sociale ». Les dépenses de santé sont distinctes : les soins relèvent de la fonction Santé, les indemnités journalières de la protection sociale selon la convention INSEE.

### Cas particulier : aides aux entreprises

« Soutien public aux entreprises » distingue :
- les **dépenses budgétaires directes**, à isoler des « Affaires économiques » sans double compte ;
- les **avantages fiscaux** et les **allègements de cotisations**, suivis séparément comme *manques à gagner* et déjà reflétés dans les recettes nettes de référence.

La ligne de **30 Md€** initialement isolée est une **enveloppe pédagogique, et non le montant officiel de l'ensemble des aides aux entreprises**. Les avantages fiscaux (49,7 Md€) et sociaux (69,1 Md€) présentés à titre complémentaire proviennent du « jaune » budgétaire PLF 2027, avec données **2024**. La modification d'un manque à gagner provoque un effet **strictement comptable** dans le simulateur, pas une prévision de rendement fiscal réel. Source : [Jaune budgétaire Aides publiques aux entreprises](https://www.budget.gouv.fr/documentation/file-download/34471).

## 3. Des mesures politiques aux écritures budgétaires

« Pouvoir d'achat », « immigration » et « écologie » sont des thèmes politiques, pas des postes comptables. Une mesure peut affecter plusieurs agrégats. Le moteur comptable `src/projection.ts` traduit les mesures en variations de recettes et dépenses et contrôle le rapprochement arithmétique. Les services `src/engine/accounting.ts`, `simulation.ts` et `impact.ts` organisent le calcul et la trajectoire.

Un montant **revendiqué par un parti** ne devient pas une expertise indépendante du seul fait qu'il est intégré au simulateur. Certaines mesures sont des **illustrations fictives** ; les contre-budgets 2026 répondent à un autre projet de loi que les comptes APU exécutés de 2025. Les montants comparés ne constituent pas des programmes exhaustifs.

**Exemple :** une baisse de TVA de 10 Md€ baisse les recettes de 10 Md€ et augmente le déficit de 10 Md€ **à effets indirects constants**. L'écart de ventilation nul prouve seulement l'égalité comptable.

## 4. Projections et limites

La trajectoire V1 prolonge de manière **mécanique** le déficit de référence 2025 en ajoutant **2,5 % de sa valeur initiale par année**, sans intérêts composés. À partir de 2027, elle applique un effet budgétaire annuel constant du scénario jusqu'en 2032. **Ce n'est ni une prévision économique ni un programme gouvernemental validé.** Les conséquences indirectes sur croissance, emploi, salaires, inflation, fiscalité ou dette ne sont pas actuellement calculées par un modèle causal.

Les budgets citoyens sont des scénarios personnels, pas des lois de finances. La publication et le vote ne valent ni certification économique ni scrutin représentatif. Une révision du référentiel doit préserver le contexte des anciens budgets publiés, notamment les montants de référence utilisés à leur création.

## 5. Comment vérifier les chiffres

L'inventaire et les contrôles sont publics :
- [Audit des agrégats citoyens et sources](audit-fiabilisation-agregats-2026-11.md)
- [Rapprochement avec les dernières publications INSEE](rapprochement-insee-dernieres-donnees-2026-11.md)
- [Table de correspondance des 25 agrégats](../data/audit-agregats-citoyens-2026-11.csv)
- [Suivi des corrections](https://github.com/dsissoko/france-budget/issues/58)

La base opérationnelle est **Neon PostgreSQL**, servie par `GET /api/reference`. Le fichier historique `src/data.ts` n'est pas le référentiel à auditer en production ; il demeure une dépendance technique du moteur à supprimer lors de l'externalisation complète.


## Évolution interne V2 — causalité macroéconomique conditionnelle (non implémentée)
**Principe :** une proposition peut modifier des indicateurs macroéconomiques selon des hypothèses **attribuées, sourcées et versionnées** ; ces variations peuvent ensuite produire des impacts budgétaires indirects.

Chaîne : `PoliticalMeasure -> (DirectBudgetEntries, MacroEffects) -> MacroContext -> IndirectBudgetEntries -> BudgetScenario`.

- `MacroContext` : année, scénario, valeur initiale et valeur simulée, unité, source et incertitude de chaque indicateur.
- `MacroImpactRule` : relation causale conditionnelle propre à une proposition ou famille de propositions, avec version et hypothèses du porteur.
- `BudgetProjectionRule` : traduction des impacts directs et macroéconomiques en écritures canoniques, avec origine et dédoublonnage.

**Cas illustratif :** un parti peut supposer qu'une restriction migratoire réduit le chômage. Il faut enregistrer cette hypothèse comme celle du porteur, sans la traiter comme une relation économique démontrée. L'effet réel dépend de la population active, de la structure des emplois, des qualifications et de la demande de travail. Une baisse du taux de chômage ne suffit pas à calculer les économies d'indemnisation.

**Conditions de mise en œuvre :** relations sourcées, plages d'incertitude, tests de sensibilité, calcul pluriannuel, traitement explicite des interactions et absence de double comptage. Introduire les relations une par une, sans modèle macro généraliste ni changement d'interface V1.

Voir aussi [les règles de projection](./projections.md).
