# France Budget — Vision produit (V1)

## Positionnement
France Budget est un simulateur citoyen, gratuit, open source et non partisan, pour comprendre le budget public français, découvrir les propositions politiques, construire son scénario et observer leur impact sur les recettes, dépenses et déficit. Le langage est celui du citoyen et des thèmes de campagne, pas celui d'un comptable. Les méthodes et incertitudes restent transparentes.

**Promesse :** « Comprendre où va l'argent public. Voir ce que proposent les partis. Imaginer son propre budget. »

## Public
Toute personne intéressée par les finances publiques, sans prérequis économique ou administratif. Utilisation mobile prioritaire. Accessibilité et simplicité avant exhaustivité.

## Périmètre
L'ensemble des administrations publiques (État, administrations de sécurité sociale et administrations locales) est le périmètre de référence pour le déficit public. La nomenclature fonctionnelle COFOG/CFAP et la comptabilité nationale SEC 2010 forment le futur niveau canonique ; la LOLF (missions/programmes/actions) concerne seulement le sous-périmètre État.

## Parcours UX
### 1. Comprendre
Photographie de l'exercice 2025 : recettes, dépenses, déficit, catégories citoyennes (dix au maximum par côté) et trajectoire annuelle. Des explications courtes remplacent le jargon. L'origine et le statut des données doivent rester visibles.

### 2. Comparer
Sélectionner une référence ou un ensemble de mesures publiées par un parti ; voir les impacts *différentiels* par thème (pouvoir d'achat, retraites, fiscalité, immigration, écologie, éducation, santé, etc.). Les sources, dates et périmètres des mesures sont accessibles ; un contre-budget incomplet est accepté. Une mesure annoncée en 2026 n'est pas un constat pour 2025.

### 3. Mon budget
Partir de la référence ou copier un scénario. Modifier les grandes catégories via des curseurs, activer/désactiver des mesures et voir l'écart, le déficit et la projection pluriannuelle. Réinitialiser facilement. L'état local persiste dans le navigateur.

### 4. Lecture expert (optionnelle)
Voir les correspondances officielles des postes et les écarts économiques, ainsi que les limites de ventilation. Un thème politique peut traverser plusieurs postes ; il n'est jamais additionné comme un poste comptable autonome.

## Principes d'interface
- Look sobre inspiré de la maquette initiale ChatGPT : fond clair, cards blanches, fine bordure grise, onglets segmentés, typographie lisible, accent vert pour les recettes et corail pour les dépenses.
- Progressive disclosure : 3 nombres d'abord ; catégories et explications ensuite.
- Comparaison constante avec le scénario de référence.
- Impacts comparés en Md€ ; variation du déficit annuel et projection sur cinq ans.
- Aucun classement ni recommandation politique.
- Codes couleur accompagnés de textes ; navigation clavier et responsive.

## Modèle de mesure
`id, party, sourceUrl, sourceYear, theme, label, description, revenueDelta, expenseDelta, confidence, assumptions, canonicalMappings`.
Pour une année donnée : `solde_scenario = solde_reference + somme(recettes_delta - dépenses_delta)`.
Les mesures concurrentes peuvent se recouper : le moteur doit avertir du double comptage avant tout usage analytique.
La projection V1 est *mécanique*, à hypothèses constantes, **non prédictive** (pas d'effets comportementaux ou macroéconomiques).

## Discipline de vérité
- Séparer **données officielles**, **chiffrages revendiqués par les partis**, **estimations** et **démonstrations fictives**.
- La V1 inclut une base de **démonstration**, visiblement étiquetée. Ne pas attribuer ses catégories agrégées à l'Insee.
- Un parti peut n'avoir qu'un fragment de programme : ne pas afficher de déficit total de ce parti comme s'il s'agissait d'un contre-budget complet.
- Les sources documentaires et millésimes sont attachés aux mesures.
- La suite devra remplacer la base fictive par une extraction officielle contrôlée et une concordance datée par périmètre.

## Fonctionnalités de la V1
Site statique React/Vite avec onglets Comprendre/Comparer/Mon budget, graphiques simples, choix de scénarios illustratifs, curseurs, comparaison au référentiel, courbe de déficit indicative, détail des mesures, persistance locale, vue de correspondance et liens source. Aucun compte ni collecte de données personnelles.

## Non-objectifs V1
Pas de prévision macroéconomique, d'affirmation sur la faisabilité politique, de recalcul certifié Maastricht ou de ventilation LOLF exacte, ni de base officielle exhaustivement réconciliée.

## Architecture et livraison
React + Vite + TypeScript à terme, Tailwind/shadcn envisageables ; V1 légère sans backend. GitHub main -> Vercel production, branches/PR -> previews ; GitHub Actions assure les vérifications (build). Aucun jeton Vercel dans GitHub Actions : intégration Git native.

## Architecture de données unifiée (Neon / Vercel)

La source de vérité pour le référentiel budgétaire et les scénarios publiés est **Neon PostgreSQL**, accessible au navigateur **uniquement via les API Vercel**. Les catégories et mesures politiques proviennent de `GET /api/reference`. Les budgets des partis et citoyens proviennent de `GET /api/budgets` ; leur différence métier est l'attribut `origin`, pas un modèle ou un moteur distinct. Les vues « Comprendre », « Comparer », « Mon budget » et « Voter » réutilisent les mêmes catégories et projections.

Un scénario budgétaire possède un identifiant, un titre, une origine (`party` ou `citizen`), une année de référence, une description, une visibilité et une définition JSON (`picked`, `budget`, propositions citoyennes). Les mesures du catalogue politique ont leur propre table `reference_measures` et une provenance documentaire ; les propositions citoyennes publiées sont conservées dans `measures`. Les règles de calcul sont encore implémentées dans `src/projection.ts` et devront être externalisées pour obtenir une centralisation totale des hypothèses.

La sauvegarde personnelle reste locale, hors Neon. La publication est une copie indépendante et définitive. Voir `docs/neon-integration.md` et `db/schema.sql`.
