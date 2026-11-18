# Notre méthode — France Budget

## 1. D'où viennent les chiffres ?
La référence 2025 couvre **l'ensemble des administrations publiques (APU)**, pas uniquement l'État. Les agrégats INSEE retenus sont **1 561,6 Md€ de recettes, 1 714,1 Md€ de dépenses et 152,5 Md€ de déficit**. Source : https://www.insee.fr/fr/statistiques/8956575

Les grandes catégories présentées dans la V1 sont **indicatives** : elles ne reproduisent pas encore intégralement les ventilations officielles. Des lignes d'ajustement de **41,6 Md€ en recettes** et **64,1 Md€ en dépenses** réconcilient les totaux. Les postes affichés ne doivent donc pas être pris pour des lignes budgétaires certifiées.

## 2. Pourquoi une règle de projection ?
Les thèmes de campagne (« pouvoir d'achat », « immigration », « écologie ») ne sont pas des postes comptables. Une mesure peut modifier plusieurs recettes et dépenses ; un même poste peut recevoir plusieurs mesures. France Budget traduit les mesures en écritures budgétaires au moyen de règles **génériques** (delta, ventilation) ou **spécifiques** (calcul particulier). Ces ventilations sont des **interprétations documentées**, non opposables.

Exemple : une baisse de TVA sur l'énergie de 10 Md€ (exemple pédagogique) se projette sur les recettes fiscales et dégrade mécaniquement le solde de 10 Md€, à effets indirects constants.

## 3. Vérifier, sans prétendre prédire
Pour chaque mesure, conserver le document et le millésime du parti, le montant revendiqué, la règle, les postes affectés et l'écart entre montant annoncé et montant projeté. **Un écart nul vérifie la cohérence arithmétique de la ventilation, pas la réalité des effets économiques.** Les contre-budgets 2026 répondent à un projet 2026 ; leur application à une référence exécutée 2025 constitue une simulation conventionnelle.

## 4. Hypothèses macroéconomiques
Indicateurs à documenter : croissance du PIB (assiettes fiscales), inflation (TVA et dépenses indexées), chômage et emploi (prestations et cotisations), prix du pétrole/gaz/électricité (fiscalité et aides), taux d'intérêt (charge de la dette), salaires et démographie (cotisations, retraites, santé).

Pour chaque indicateur, indiquer **année, valeur, unité, source, scénario, statut** : « utilisé dans le calcul », « documenté seulement » ou « non modélisé ». Distinguer **hypothèse officielle de référence**, **hypothèse attribuée au parti** et **hypothèse du simulateur**. Ne pas inventer de valeur manquante ; la V1 n'emploie pas ces indicateurs dans un modèle de rétroaction macroéconomique. Sa trajectoire de déficit à +2,5 %/an est une prolongation mécanique illustrative, pas une prévision.

## 5. Limites et transparence
Le simulateur ne certifie ni la faisabilité d'une proposition, ni les interactions économiques indirectes. Les effets sur l'emploi, la croissance et le chômage ne sont pas déduits automatiquement d'une politique. La classification canonique cible doit préciser périmètre APU/État/sécurité sociale, nature économique et fonction de dépense ; COFOG seul ne constitue pas une comptabilité complète.

## Évolution interne V2 — causalité macroéconomique conditionnelle (non implémentée)
**Principe :** une proposition peut modifier des indicateurs macroéconomiques selon des hypothèses **attribuées, sourcées et versionnées** ; ces variations peuvent ensuite produire des impacts budgétaires indirects.

Chaîne : `PoliticalMeasure -> (DirectBudgetEntries, MacroEffects) -> MacroContext -> IndirectBudgetEntries -> BudgetScenario`.

- `MacroContext` : année, scénario, valeur initiale et valeur simulée, unité, source et incertitude de chaque indicateur.
- `MacroImpactRule` : relation causale conditionnelle propre à une proposition ou famille de propositions, avec version et hypothèses du porteur.
- `BudgetProjectionRule` : traduction des impacts directs et macroéconomiques en écritures canoniques, avec origine et dédoublonnage.

**Cas illustratif :** un parti peut supposer qu'une restriction migratoire réduit le chômage. Il faut enregistrer cette hypothèse comme celle du porteur, sans la traiter comme une relation économique démontrée. L'effet réel dépend de la population active, de la structure des emplois, des qualifications et de la demande de travail. Une baisse du taux de chômage ne suffit pas à calculer les économies d'indemnisation.

**Conditions de mise en œuvre :** relations sourcées, plages d'incertitude, tests de sensibilité, calcul pluriannuel, traitement explicite des interactions et absence de double comptage. Introduire les relations une par une, sans modèle macro généraliste ni changement d'interface V1.

Voir aussi [les règles de projection](./projections.md).
