# France Budget — publication citoyenne (Neon + Vercel)

## Architecture
- Frontend React/Vite, sauvegarde locale conservée.
- Fonctions Vercel `/api/budgets` (GET, POST) et `/api/votes` (POST).
- PostgreSQL Neon à Francfort, avec un rôle applicatif `france_budget_app` à droits limités.
- `DATABASE_URL` est configuré comme secret serveur dans Vercel (production + preview). **Ne jamais utiliser le préfixe `VITE_` pour ce secret.**
- Schéma versionné dans `db/schema.sql`.

## Fonctionnement
- Le citoyen peut créer des mesures de recettes/dépenses, voir l'effet sur le déficit, enregistrer localement ou publier.
- Publication anonyme et définitive, avec titre et description non identifiants ; la copie locale reste modifiable.
- Limite globale de 50 publications citoyennes, imposée par une fonction SQL transactionnelle avec verrou consultatif.
- Limite de 2 publications par 24 h et par empreinte de connexion ; les IP ne sont pas enregistrées en clair.
- Onglet Voter : choix d'un budget parmi 50, consultation, comparaison, vote.
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
- `measures` : **table commune des propositions des partis et des citoyens**, liées à `budgets.id` ; les propositions politiques conservent `legacy_id`, `theme`, `source`, `reference_year`, `status`, `revenue_delta`, `expense_delta`. Les mesures citoyennes utilisent les champs communs `category_code`, `kind`, `delta_amount`, `reference_amount`, `title`, `description`. Les règles de ventilation restent dans `src/projection.ts`.
- `votes` : suffrages de popularité sur les scénarios publiés ; ne constituent pas un scrutin électoral.

### Circulation des données

1. Les 25 catégories et 8 mesures de l'ancien `src/data.ts` ont été copiées dans Neon, en conservant leur caractère indicatif et leurs sources.
2. `GET /api/reference` charge catégories et mesures depuis Neon (la table `measures` pour les partis) ; le frontend attend sa réponse avant d'afficher les données.
3. `GET /api/budgets` retourne budgets des partis et citoyens publiés, avec votes et indicateurs `featured`/`featured_order`. **Comparer** affiche en premier les budgets mis en avant et permet aussi de sélectionner tout budget public ; **Voter** affiche tous les budgets publics. Les deux vues utilisent la même API.
4. `POST /api/budgets` valide les montants contre `reference_categories` dans Neon ; `POST /api/votes` enregistre les votes.
5. `src/projection.ts` conserve le moteur de calcul côté navigateur pour la réactivité des jauges, alimenté par les références récupérées via l'API.

### Dette technique explicite

- `src/data.ts` conserve une **copie statique historique** utilisée notamment par les tests et comme fixture de migration ; elle ne doit plus être considérée comme source de vérité pour l'interface. À terme, remplacer cette fixture par un jeu de données de test dédié.
- Les règles de ventilation de `src/projection.ts` sont encore dans le code. Pour une centralisation intégrale des règles de projection, les versionner dans Neon et les exposer via l'API.
- Les budgets locaux non publiés restent volontairement dans `localStorage` : ils ne sont pas stockés dans Neon.

### Mise en avant éditoriale

- Les trois budgets politiques initiaux sont `featured=true`, ordonnés RN (10), LFI (20), Horizons (30).
- Les budgets citoyens publiés restent `featured=false` par défaut, mais peuvent être promus sans changer leur modèle ni leur API.
- La sélection éditoriale ne doit pas être confondue avec le nombre de votes : elle est indépendante de la popularité et de l'origine.
- Aucun endpoint public n'autorise la modification de `featured` ou `featured_order`.

### Migration des propositions

- Les huit mesures politiques ont été copiées de `reference_measures` vers `measures`, chacune rattachée au budget politique correspondant.
- La colonne `legacy_id` préserve les identifiants utilisés par les scénarios et le moteur de projection.
- L'ancienne table reste disponible pour vérification avant suppression future ; **elle n'est plus source de lecture**.
- La modélisation détaillée des impacts multiples par mesure (`measure_impacts`) reste à implémenter ; elle permettra de supprimer les règles de ventilation codées en dur.
