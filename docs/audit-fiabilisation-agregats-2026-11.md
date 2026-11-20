# Audit de fiabilisation des agrégats citoyens — 20 novembre 2026

## Objet et contraintes non négociables

**Périmètre :** ensemble des administrations publiques (APU/S13), pas le seul budget de l'État. **Finalité :** agrégats citoyens parlants et justifiables, et non présentation brute des lignes LOLF. **UX/UI inchangée** : mêmes onglets, catégories visibles, libellés, interactions et mécanismes de simulation. Le référentiel d'exécution est Neon PostgreSQL via `GET /api/reference`.

Cet audit est **en lecture seule** : ne pas remplacer les montants Neon à partir de rapprochements entre exercices différents ; ne pas réinitialiser budgets, votes, scénarios ou règles.

## État constaté directement dans Neon (20/11/2026)

Projet `calm-rain-58562193`, tables `reference_categories`, `reference_off_budget`, `budgets`, `measures`.

- Référence 2025 : **10 lignes de recettes = 1 561,6 Md€**, **15 lignes de dépenses = 1 714,1 Md€**, **déficit = 152,5 Md€**.
- Postes d'ajustement : **41,6 Md€ de recettes** (`other`) et **64,1 Md€ de dépenses** (`other-expenses`). Ces soldes techniques sont des signaux de ventilation incomplète, non des postes économiques sourcés.
- Dépenses 2025 indicatives : `social` 400 ; `family` 65 ; `unemployment` 50 ; `solidarity` 105 ; `health` 280 ; `education` 180 ; `economy` 125 ; `enterprise-support` 30 ; `general` 150 ; `defense` 65 ; `safety` 55 ; `culture` 40 ; `housing` 55 ; `environment` 50 ; `other-expenses` 64,1 (Md€).
- Recettes 2025 indicatives : `vat` 260 ; `income` 115 ; `business` 110 ; `contributions` 520 ; `socialtax` 210 ; `property` 85 ; `energy` 45 ; `otherTax` 95 ; `nontax` 80 ; `other` 41,6 (Md€).
- Compléments hors budget de référence : avantages fiscaux aux entreprises **49,7 Md€ (2024)**, allègements de cotisations **69,1 Md€ (2024)**. Ne pas les additionner aux dépenses 2025 ni supposer qu'une suppression produirait automatiquement une recette nette identique.
- Huit mesures politiques, dont trois au statut `illustration` : attention aux comparaisons de programmes incomplets.

## Sources primaires et statut

1. Comptes des APU 2025 INSEE, 29/05/2026 : https://www.insee.fr/fr/statistiques/8997691 . Déficit 2025 **152,5 Md€**. Source de cadrage pour total recettes/dépenses ; vérifier le dernier tableau de comptes avant toute actualisation.
2. Ventilation par fonction COFOG/CFAP **2024** (tableau **3.301, APU S13**, publication du 27/03/2026) : https://www.insee.fr/fr/statistiques/8574707 . Ce tableau est un benchmark de répartition, **pas** un jeu de montants définitifs 2025. Mise en garde INSEE sur la modification de nomenclature des collectivités en 2024 (logement/affaires économiques).
3. Page de ventilation 2025 INSEE : https://www.insee.fr/fr/statistiques/8988847 . Au 20/11/2026, les tableaux 3.301–3.307 pour 2025 sont annoncés pour **décembre 2026**.
4. Eurostat COFOG `gov_10a_exp` : https://ec.europa.eu/eurostat/databrowser/product/view/gov_10a_exp , source de contrôle complémentaire des fonctions de dépense.
5. Recettes : compte des APU 2025 INSEE https://www.insee.fr/fr/statistiques/8988845 ; rapprochements SEC 2010 par nature économique (éviter de confondre impôt national et produit consolidé APU).

## Règles de fiabilisation, sans modification de l'interface

1. **Conserver les agrégats citoyens**. Construire pour chaque ligne une *fiche de calcul* : ID immuable, définition en langage courant, périmètre APU, exercice, composantes officielles (codes COFOG ou SEC), signes, règles de répartition, source URL/tableau, date d'extraction, statut et incertitude.
2. **Rendre les regroupements exhaustifs et exclusifs** sur leur axe comptable : chaque composante du périmètre S13 contribue une fois, et une seule, aux catégories servant au total. Ne pas mélanger ventilation *par fonction* et ventilation *par nature économique* dans le même total.
3. **Sous-postes thématiques** : retraites/famille/chômage/solidarité ne peuvent pas être justifiés par la seule fonction COFOG 10 globale ; rechercher les sous-fonctions 10.x, puis documenter tout reclassement, en particulier les transferts et pensions. Les aides aux entreprises sont transversales : leurs sous-ensembles budgétaires doivent être exclusifs de `economy` et les avantages fiscaux/sociaux demeurent hors addition au total de dépenses.
4. **Ne pas déplacer silencieusement des montants entre années** : 2025 exécuté, 2024 fonctionnel, 2024 avantages et programmes politiques 2026 doivent rester distincts. Les données partielles peuvent être présentées comme approximations jusqu'à disponibilité de la même année officielle.
5. **Reconciler en deux directions** : (a) total national = somme des catégories = agrégat officiel ; (b) pour chaque catégorie = somme des composantes sources avec règles documentées. Un total exact obtenu par poste d'ajustement ne remplit que (a).
6. **Préserver les budgets citoyens publiés** : les scénarios et montants de référence doivent rester reproductibles. Avant toute migration, versionner l'ancien référentiel et définir la politique de relecture des anciennes publications. Ne pas réinterpréter tacitement un ancien vote ou scénario avec de nouveaux montants.

## Critères d'acceptation avant mise à jour de production

- [ ] Export versionné (CSV/JSON ou SQL) des 25 lignes Neon existantes et des avantages hors budget, sans données personnelles.
- [ ] Table de correspondance sourcée **pour chacune des 25 lignes**, avec couverture complète et statut de vérification par agrégat.
- [ ] Distinction explicite `official` / `reconstructed` / `estimated` / `illustrative`, y compris pour les mesures politiques.
- [ ] Test automatisé : sommes recettes/dépenses, déficit, unicité des composantes, absence de doubles comptes et compatibilité du moteur de projection.
- [ ] Tests de non-régression des 4 parcours existants et des scénarios citoyens enregistrés/publiés.
- [ ] Migration idempotente et réversible exécutée d'abord sur une branche Neon de test, **sans changement de composants UX/UI**.
- [ ] Revue de l'écart entre l'exercice de base 2025 et la publication INSEE la plus récente, puis décision documentée de passage en production.

## Décision pour cette étape

**Aucun changement appliqué à Neon ni au front.** Ce document formalise le périmètre, l'inventaire observé et les preuves nécessaires. Il ne prétend pas constituer une réconciliation quantitative finale des 25 catégories. Une version 2025 entièrement sourcée nécessite les données de fonction 2025 lorsqu'elles seront disponibles, ou une méthode d'estimation 2025 clairement étiquetée et contrôlée.
