# France Budget — Vision produit (V1 / feuille de route V2)

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
Comparer deux budgets A/B parmi les budgets publics mis en avant (10 maximum), sans présélection. La galerie commune permet de choisir et remplacer les deux budgets ; les résultats restent masqués tant que les deux ne sont pas sélectionnés. Trois cartes affichent le solde de référence INSEE 2025, celui de A et celui de B, leurs écarts au solde de référence et l'écart A/B. Les recettes et dépenses sont représentées par trois séries (référence grise, A bleue, B orange), suivies des mesures respectives et des trajectoires indicatives. Aucun bouton de personnalisation dans Comparer : cette fonction appartient à Mon budget. Les sources, dates et limites de chiffrage restent visibles.

### 3. Mon budget
Partir par défaut de la référence INSEE 2025, ou choisir facultativement un budget public (parti ou citoyen) ou un budget personnel enregistré comme point de départ. La copie est indépendante ; le changement demande confirmation si des modifications non enregistrées existent. Modifier les grandes catégories via des curseurs, activer/désactiver des mesures et voir l'écart, le déficit et la projection pluriannuelle. Réinitialiser facilement. L'état local persiste dans le navigateur.

### 4. Lecture expert (optionnelle)
Voir les correspondances officielles des postes et les écarts économiques, ainsi que les limites de ventilation. Un thème politique peut traverser plusieurs postes ; il n'est jamais additionné comme un poste comptable autonome.

### 5. Voter
Consulter les budgets publiés, ouvrir leur fiche détaillée et les soutenir. Le détail conserve l'action de vote sans redirection « Ouvrir dans Comparer ».

### Navigation
Le changement d'onglet et le lien « Découvrir les propositions politiques » repositionnent la lecture en haut de page.

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

## Parcours Voter — V1

- Liste unifiée de **tous les budgets publics**, politiques et citoyens, sous forme de cartes responsive (aucun menu déroulant de sélection). Une carte affiche le nom du parti ou le **nom/pseudo public** choisi lors de la publication citoyenne, le titre, une description, le nombre de propositions, le nombre de votes et au maximum **un badge** de qualification.
- Filtres Tous / Partis / Citoyens. Tris : **popularité** (votes décroissants), **date de publication** (plus récent), **proximité de l’équilibre** (valeur absolue du déficit simulé la plus faible). Les tris sont des critères de navigation, pas des recommandations politiques.
- **Un clic sur la carte ouvre un bottom sheet** : même présentation métier que le détail de Comparer (déficit de référence, impact sur le solde, déficit simulé, écarts par catégorie, mesures et sources, trajectoire indicative). Fermeture et retour à la liste sans perdre les filtres ; lien facultatif vers Comparer.
- Bouton Soutenir sur la carte et dans la fiche ; votes de popularité, sans prétention de représentativité. Un vote par navigateur et par budget, sans garantie d'unicité par personne.
- Badges exclusifs sur la liste, dans cet ordre : **À l’équilibre** (déficit absolu ≤ 1 Md€), sinon **Déficit réduit** (déficit inférieur à la référence d’au moins 1 Md€), sinon aucun. Un éventuel badge **Désendettement à 5 ans** est réservé à la V2 : ne jamais l'inférer de la projection mécanique V1.
- Le nom/pseudo est affiché publiquement et stocké dans le JSON `scenario.author` pour les nouvelles publications. Les anciennes publications sans auteur renseigné portent « Auteur anonyme ». Aucune identité civile vérifiée.

## Feuille de route V2 — projections et qualification

- **Modèle pluriannuel sur cinq ans** : recettes, dépenses, déficit, dette nominale, dette/PIB, charge annuelle des intérêts ; hypothèses explicites et versionnées (croissance nominale, inflation, taux, refinancement, stock initial de dette).
- Comparer les trajectoires à hypothèses cohérentes, avec scénarios de sensibilité. Distinguer amélioration relative, équilibre annuel, stabilisation de la dette et baisse des intérêts ; ne pas présenter une simulation comme une prévision certifiée.
- Badge **Désendettement à 5 ans** uniquement lorsque le ratio dette/PIB baisse entre le début et la fin de la projection, sur la base d'un moteur V2 validé. Les indicateurs de charge d'intérêts, équilibre à horizon cinq ans et soutenabilité sont visibles dans le détail, **pas comme badges supplémentaires sur la liste**.
- Centraliser et versionner les règles de ventilation des mesures (`measure_impacts`) et les hypothèses économiques ; tests de cohérence comptable, documentation des incertitudes et de la provenance.
- Conserver au plus un badge par carte et séparer clairement indicateurs observés, hypothèses et résultats projetés.

## Fonctionnalités de la V1
Site statique React/Vite avec onglets Comprendre/Comparer/Mon budget, graphiques simples, choix de scénarios illustratifs, curseurs, comparaison au référentiel, courbe de déficit indicative, détail des mesures, persistance locale, vue de correspondance et liens source. Aucun compte ni collecte de données personnelles.

## Non-objectifs V1
Pas de prévision macroéconomique, d'affirmation sur la faisabilité politique, de recalcul certifié Maastricht ou de ventilation LOLF exacte, ni de base officielle exhaustivement réconciliée.

## Architecture et livraison
React + Vite + TypeScript à terme, Tailwind/shadcn envisageables ; V1 légère avec API Vercel et PostgreSQL Neon. GitHub main -> Vercel production, branches/PR -> previews ; GitHub Actions assure les vérifications (build). Aucun jeton Vercel dans GitHub Actions : intégration Git native.

## Architecture de données unifiée (Neon / Vercel)

La source de vérité pour le référentiel budgétaire et les scénarios publiés est **Neon PostgreSQL**, accessible au navigateur **uniquement via les API Vercel**. Les catégories et mesures politiques proviennent de `GET /api/reference`. Les budgets des partis et citoyens proviennent de `GET /api/budgets` ; leur différence métier est l'attribut `origin`, pas un modèle ou un moteur distinct. Les vues « Comprendre », « Comparer », « Mon budget » et « Voter » réutilisent les mêmes catégories et projections.

Un scénario budgétaire possède un identifiant, un titre, une origine (`party` ou `citizen`), une année de référence, une description, une visibilité et une définition JSON (`picked`, `budget`, propositions citoyennes). Les mesures des partis et les propositions citoyennes publiées sont conservées dans la table commune `measures` ; `reference_measures` est une table historique de migration, non lue par l'API. Les règles de calcul sont encore implémentées dans `src/projection.ts` et devront être externalisées pour obtenir une centralisation totale des hypothèses.

La sauvegarde personnelle reste locale, hors Neon. La publication est une copie indépendante et définitive. Voir `docs/neon-integration.md` et `db/schema.sql`.
