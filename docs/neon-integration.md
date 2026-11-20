# Mon Budget Citoyen — intégration Neon, publication et votes (état au 20/11/2026)

## Architecture
- Frontend React/Vite, sauvegarde locale conservée.
- Fonctions Vercel `/api/reference` (GET), `/api/budgets` (GET, POST) et `/api/votes` (POST).
- PostgreSQL Neon à Francfort, avec un rôle applicatif `france_budget_app` à droits limités.
- `DATABASE_URL` est configuré comme secret serveur dans Vercel (production + preview). **Ne jamais utiliser le préfixe `VITE_` pour ce secret.**
- **Schéma réel et contrats** : [schema.md](schema.md). `db/schema.sql` est un bootstrap historique ; les migrations incrémentales sont dans `db/migrations/`.

## Fonctionnement
- Le citoyen peut créer des mesures de recettes/dépenses, voir l'effet sur le déficit, enregistrer localement ou publier.
- Publication anonyme et définitive, avec titre et description non identifiants ; la copie locale reste modifiable.
- Limite globale de 100 publications citoyennes (fonction SQL actuelle), imposée par une fonction SQL transactionnelle avec verrou consultatif.
- Limite de 100 publications par 24 h et par empreinte de connexion (fonction SQL actuelle) ; les IP ne sont pas enregistrées en clair.
- Onglet Voter : galerie unifiée des budgets publics (partis et citoyens), filtres d'origine, tris popularité/date/proximité de l'équilibre, clic sur une carte ouvrant une fiche en bottom sheet avec les détails de Comparer, puis vote. La limite de 100 concerne les publications citoyennes, pas les budgets politiques.
- Cookie aléatoire HttpOnly/Secure/SameSite ; unicité (budget, empreinte du cookie) en base. **Un navigateur peut effacer ses cookies : un vote par personne n'est pas garanti.**
- L'API ne fournit aucun droit de modification ou suppression aux visiteurs. Un retrait administratif reste possible pour les contenus abusifs.

## Sécurité et limites
- Les noms, descriptions et mesures sont fournis par les visiteurs : les afficher en texte, jamais en HTML brut.
- Les budgets sont limités en taille, les catégories et montants sont vérifiés côté serveur.
- Le dispositif anti-abus est volontairement léger et ne résiste pas à une attaque coordonnée : prévoir CAPTCHA/WAF ou modération si l'application gagne en visibilité.
- Ne pas présenter les simulations comme des prévisions officielles ; les ventilations de référence restent indicatives.
- Vérifier les fonctions Vercel et le parcours utilisateur en production après déploiement.

## Référentiel unifié — migration 2026-11

- `reference_categories` : catégories de recettes et dépenses, libellés, montants de référence, descriptions, codes canoniques, millésime et ordre d'affichage.
- `reference_measures` : ancienne table conservée temporairement pour migration/retour arrière ; elle n'est plus interrogée par l'API.
- `budgets` : **même modèle** pour les budgets politiques (`origin='party'`) et les publications citoyennes (`origin='citizen'`). `scenario` contient les identifiants des mesures et les ajustements catégoriels. `featured BOOLEAN NOT NULL DEFAULT false` pilote la mise en avant dans Comparer ; `featured_order INTEGER` règle l'ordre. Seul un administrateur de la base peut modifier ces colonnes.
- `measures` : **table commune des propositions des partis et des citoyens**, liées à `budgets.id` ; les propositions politiques conservent `legacy_id`, `theme`, `source`, `reference_year`, `status`, `revenue_delta`, `expense_delta`. Les mesures citoyennes utilisent les champs communs `category_code`, `kind`, `delta_amount`, `reference_amount`, `title`, `description`. Les écritures APU des mesures actives sont désormais normalisées dans `measure_accounting_entries` ; `src/projection.ts` conserve des règles historiques de repli.
- `votes` : suffrages de popularité sur les scénarios publiés ; ne constituent pas un scrutin électoral.
- `political_parties` : identifiants `code` de partis et noms d'affichage ; `budgets.party_code` est une FK validée, sans interprétation du titre.
- `measure_accounting_entries` : écritures APU par mesure, liées aux codes de catégories et à leur côté comptable par FK composite validée.
- `party_source_registry_draft`, `party_source_measure_draft`, `party_proposal_draft` : documentation et regroupements en cours de validation, **non exposés par les API publiques**.

### Circulation des données

1. Les 25 catégories et 8 mesures de l'ancien `src/data.ts` ont été copiées dans Neon, en conservant leur caractère indicatif et leurs sources.
2. `GET /api/reference` charge catégories et mesures depuis Neon (la table `measures` pour les partis) ; le frontend attend sa réponse avant d'afficher les données.
3. `GET /api/budgets` retourne budgets des partis et citoyens publiés, avec votes et indicateurs `featured`/`featured_order`. **Comparer** affiche en premier les budgets mis en avant et permet aussi de sélectionner tout budget public ; **Voter** affiche tous les budgets publics. Les deux vues utilisent la même API.
4. `POST /api/budgets` valide les montants contre `reference_categories` dans Neon ; `POST /api/votes` enregistre les votes.
5. `src/projection.ts` conserve le moteur de calcul côté navigateur pour la réactivité des jauges, alimenté par les références récupérées via l'API.

### Dette technique explicite

- `src/data.ts` conserve une **copie statique historique** utilisée notamment par les tests et comme fixture de migration ; elle ne doit plus être considérée comme source de vérité pour l'interface. À terme, remplacer cette fixture par un jeu de données de test dédié.
- Les écritures validées de production sont en Neon (`measure_accounting_entries`) et renvoyées en `apuEntries` via l'API, avec contrôle d'intégrité. Les règles codées de `projection.ts` ne subsistent que comme repli pour les fixtures et anciens scénarios ; il faudra les retirer après recette.
- Les budgets locaux non publiés restent volontairement dans `localStorage` : ils ne sont pas stockés dans Neon.

### Mise en avant éditoriale

- RN (ordre 10) et LFI (20) sont visibles ; **Horizons (30) est masqué** depuis le retrait des chiffrages fictifs. Le champ `featured=true` d'un budget masqué ne le rend pas public.
- Les budgets citoyens publiés restent `featured=false` par défaut, mais peuvent être promus sans changer leur modèle ni leur API.
- La sélection éditoriale ne doit pas être confondue avec le nombre de votes : elle est indépendante de la popularité et de l'origine.
- Aucun endpoint public n'autorise la modification de `featured` ou `featured_order`.

### Migration des propositions

- Les huit mesures politiques ont été copiées de `reference_measures` vers `measures`, chacune rattachée au budget politique correspondant.
- La colonne `legacy_id` préserve les identifiants utilisés par les scénarios et le moteur de projection.
- L'ancienne table reste disponible pour vérification avant suppression future ; **elle n'est plus source de lecture**.
- Les écritures multiples par mesure sont **implémentées** dans `measure_accounting_entries` ; leur liaison éditoriale avec les regroupements politiques en cours de vérification reste à terminer.

## UX Voter, auteur public et v1.1.0

- Les nouvelles publications citoyennes exigent un nom ou pseudo public de 2 à 60 caractères, enregistré dans `scenario.author` ; le backend valide ce champ. Les publications historiques restent compatibles et affichent « Auteur anonyme ».
- Le clic sur une carte ouvre une fiche détaillée sans navigation, reprenant les indicateurs, écarts par poste, mesures et trajectoire de Comparer. La liste est filtrable Tous/Partis/Citoyens et triable par votes, date ou proximité de l'équilibre.
- V1 : un badge maximum par carte, « À l'équilibre » si |déficit| ≤ 1 Md€, sinon « Déficit réduit » si le déficit diminue d'au moins 1 Md€ face à la référence. Aucune affirmation de soutenabilité à partir de la projection mécanique.
- v1.1.0 : projection à cinq ans avec dette/PIB, intérêts, hypothèses macroéconomiques et analyses de sensibilité. Le badge « Désendettement à 5 ans » sera calculé seulement quand le modèle pluriannuel sera disponible et validé ; ne pas l'afficher par anticipation. Les autres indicateurs restent dans le détail, pas dans une accumulation de badges.

## Sélection A/B et versions

En v1.0.0, **Comparer** utilise les budgets `featured` issus de Neon : premier clic = A, deuxième clic = B, puis sélection verrouillée. Un bouton **Réinitialiser** vide le duo. Les cartes déjà choisies ne sont pas des commandes de désélection. La référence INSEE reste indépendante des deux choix. Cette ergonomie est suivie dans [l'issue #26](https://github.com/dsissoko/france-budget/issues/26) jusqu'à recette.

Le moteur `src/projection.ts` préfère maintenant les écritures normalisées envoyées par l'API ; l'élimination complète des règles de repli et l'intégration des groupes politiques sont **inachevées** ([issue #22](https://github.com/dsissoko/france-budget/issues/22)). Le moteur de calcul TypeScript peut rester côté navigateur. Les budgets personnels sauvegardés dans `localStorage` ne font volontairement pas partie de cette migration.

Pour la vue complète des tables, contraintes, flux et limites, voir [schema.md](schema.md), [architecture.md](architecture.md) et [../db/schema.sql](../db/schema.sql) (bootstrap historique).

## État de migration des partis — 20/11/2026

L'API `GET /api/reference` sélectionne les mesures publiques via `budgets.party_code` et lit les écritures dans `measure_accounting_entries`. Elle ne dérive **plus** le parti d'un motif textuel du titre. Les totaux de recettes et dépenses par mesure sont contrôlés avant la réponse. L'API `GET /api/budgets` fournit également `party_code`.

Ce travail ne signifie **pas** que les groupes `party_proposal_draft` ont été activés : ils sont encore non validés et hors moteur public. Le formulaire citoyen conserve le même schéma `budgets`/`measures`, sans `party_code`. Les 25 catégories, incluant les deux « Autres et ajustement », restent visibles et modifiables. Référence APU 2025 : **1 561,7 Md€ de recettes**, **1 714,2 Md€ de dépenses**, **152,5 Md€ de déficit**.

Voir [schema.md](schema.md) pour le modèle relationnel exact, les FK, index et migrations. Les fonctionnalités non encore déployées sur Vercel ne doivent pas être assimilées à une mise en production publique.
