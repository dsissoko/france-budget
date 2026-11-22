# AGENTS.md — Convention de travail de Mon Budget Citoyen

Ces instructions s'appliquent aux assistants IA et contributeurs travaillant dans ce dépôt.
Elles complètent les exigences techniques et de provenance des données du projet.
**Le dialogue de cadrage ne donne jamais, à lui seul, le droit de modifier le code ou de publier.**

## Les trois modes conversationnels

### 1. Slow burn : définir et enrichir une Issue

**Objectif :** transformer un besoin en Issue GitHub claire, sans lancer de réalisation.

- Discuter du besoin, de ses motivations, de son impact et des critères d'acceptation.
- Vérifier les Issues existantes pour éviter les doublons.
- Créer ou mettre à jour une Issue **sur demande ou après accord explicite**.
- Une Issue représente une unité de besoin ; elle peut évoluer au fil de plusieurs discussions.
- La création ou la mise à jour d'une Issue **n'autorise pas** une branche, un changement de code ou une PR.

**Livrable :** une Issue documentée et traçable, avec son lien.

### 2. Picky cheering : sélectionner et cadrer un lot d'Issues pour une PR

**Objectif :** décider, avant réalisation, de ce qui doit entrer dans une PR.

- Examiner une sélection d'Issues déjà identifiées.
- Discuter des priorités, dépendances, risques, arbitrages et critères d'acceptation.
- Une PR peut traiter **une ou plusieurs Issues**, si elles forment un lot cohérent.
- Une Issue complexe peut nécessiter **plusieurs PR** ; documenter ce découpage.
- Choisir un titre, une portée, une stratégie de tests et la branche du lot.
- Obtenir l'accord sur le périmètre **avant d'engager le cycle de PR**.

**Livrable :** un cadrage de PR et sa liste d'Issues, sans développement tant que le mode 3 n'est pas demandé.

### 3. Cycle de PR : mettre en œuvre et piloter

**Prérequis :** accord explicite pour exécuter le lot cadré au mode 2.

- Créer la branche de travail, puis les commits **sur cette branche**, pas sur `main`.
- Ouvrir la PR associée au lot, la compléter et faire évoluer le code sur sa branche.
- Exécuter au minimum : vérification TypeScript, tests Vitest et build ; suivre la CI GitHub.
- Ajuster la PR à partir de la revue et des retours ; ne pas confondre cette revue avec le *picky cheering*, déjà réalisé en mode 2.
- Fusionner uniquement après validation explicite de la PR par le responsable du projet.
- La réussite de la CI ne vaut pas autorisation de fusion.
- La fusion **ne vaut jamais autorisation de déploiement**.

**Livrable :** une PR tracée, validée et éventuellement fusionnée, distincte d'une release.

## Quatrième décision : la release

Une **demande explicite de publication** est nécessaire pour lancer ou promouvoir une version en production.

- Distinguer sans ambiguïté : Issue, cadrage de PR, réalisation, merge, publication.
- Avant publication, vérifier les tests, les migrations, l'environnement ciblé et l'état Vercel.
- Éviter un déploiement par commit ; regrouper les changements et publier une version consolidée.
- **Important :** ces consignes sont organisationnelles. Elles n'empêchent pas techniquement les déploiements automatiques déjà configurés. Ne jamais affirmer qu'un merge n'aura pas d'effet sur Vercel avant vérification et mise en place des garde-fous GitHub/Vercel.
- Ne pas modifier la configuration des déploiements, les protections de branche ou la facturation sans accord spécifique.

## Liens Issues ↔ PR

- En cadrage, lister explicitement toutes les Issues incluses et celles hors périmètre.
- Dans la description d'une PR, utiliser `Refs #NN` pour une Issue encore partiellement traitée et `Closes #NN` / `Fixes #NN` **uniquement** si la PR la résout complètement.
- Ne jamais fermer prématurément une Issue traitée par plusieurs PR.
- La PR est une unité de livraison technique ; l'Issue reste une unité de besoin.

## Catalogue commun des outils optionnels

Le catalogue décrit les capacités mobilisables, **pas une garantie d'accès permanent**. Avant d'agir, vérifier les connecteurs réellement accessibles, leurs permissions et l'environnement cible. Les connecteurs/MCP donnent accès à des services ; les *skills* indiquent des méthodes ; les commandes/CLI supposent un environnement d'exécution disponible.

| Outil | Rôle dans le cycle produit | Précautions |
| --- | --- | --- |
| **GitHub (connecteur / MCP)** | Référentiel du projet : Issues, branches, PR, code, CI et documentation | **Outil central** ; éviter tout commit direct sur `main` |
| **Vercel (connecteur / MCP)** | Builds, déploiements, domaines et diagnostic de production | **Outil central** ; limiter les déploiements, vérifier les quotas |
| **Neon (connecteur / MCP)** | PostgreSQL, migrations et contrôle des données budgétaires | **Outil central** ; vérifier la cible avant toute écriture |
| **Skills** (si installés) | Procédures spécialisées, consignes et bonnes pratiques | Découvrir et lire le skill pertinent ; ne pas supposer sa présence |
| **Commandes / CLI** (`git`, `gh`, `npm`, `vercel`, `psql`) | Tests, diagnostics, maintenance et opérations de secours | Exécution uniquement si l'outil et les accès existent ; ne pas contourner les permissions |

**Trio technique privilégié : GitHub + Vercel + Neon.** Choisir l'outil minimal adapté, consigner le résultat vérifiable, et ne pas simuler les actions indisponibles.

## Processus autonome : campagne de notoriété (non commerciale)

**Périmètre isolé du développement :** faire connaître Mon Budget Citoyen, susciter des discussions, des essais du simulateur, des budgets alternatifs et des votes. Aucun objectif commercial ou achat de trafic n'est présumé.

### Référentiel unique et organisation documentaire

**Tous les éléments opérationnels de campagne vivent sous [`docs/promotion/`](docs/promotion/README.md).** `AGENTS.md` ne définit que le fonctionnement transversal ; il ne duplique ni le calendrier, ni les contacts, ni les messages, ni les KPI.

- [`campagne-promotionnelle.md`](docs/promotion/campagne-promotionnelle.md) : objectifs, canaux, positionnement, planning et indicateurs.
- `messages.md` : brouillons de prises de parole.
- `contacts.csv` : cibles et état réel des prises de contact.
- `publications.csv` : publications et réponses effectivement réalisées, avec preuves/URL.
- `indicateurs.csv` : mesures observées ; valeur absente = `ND`, jamais zéro inventé.

La campagne actuelle est **« Parlons chiffres »**. Toute nouvelle campagne dispose de son propre cadrage dans ce même espace, sans éparpiller son suivi entre le code, des Issues techniques ou des tâches non référencées.

### Cycle de campagne

1. **Cadrer** : cible, angle éditorial, canaux, messages, calendrier, règles de publication et indicateurs.
2. **Préparer** : sélectionner les actions, rédiger et vérifier les contenus, identifier communautés et contacts. Préparer ne signifie pas envoyer.
3. **Diffuser sur accord** : publication, programmation, envoi ou prise de contact uniquement avec validation explicite. Ne pas automatiser du démarchage non sollicité.
4. **Suivre de manière récurrente** : analyser les retours, l'engagement, les résultats observables et proposer les prochaines actions. Les tâches récurrentes sont créées/modifiées uniquement sur demande ou accord ; consigner dans `docs/promotion/` leur objectif, cadence et identifiant.
5. **Faire le bilan et ajuster** : mesurer notoriété, échanges utiles, visites, budgets créés/publiés, votes et enseignements ; actualiser le référentiel de campagne.

**Garde-fous :** transparence sur le rôle du créateur, neutralité partisane, respect des règles de chaque plateforme, aucune statistique inventée, aucune adresse privée ou secret dans le dépôt public, aucune relance intrusive.

### Outillage spécifique à la campagne

| Outil optionnel | Apport envisagé | État / limites |
| --- | --- | --- |
| **GitHub** | Versionner le dossier `docs/promotion/` et historiser les décisions | Déjà dans le trio technique ; ne pas créer un second référentiel |
| **Automations / tâches récurrentes** | Bilans périodiques, contrôles des réponses, suivi de campagne et rappels | Capacité disponible ; ne créer, modifier ou déclencher de tâche qu'avec autorisation adaptée |
| **Metricool (connecteur / MCP)** | Comptes sociaux liés, programmation, indicateurs et horaires de diffusion | **Connecté à LinkedIn**, mais intérêt opérationnel **à démontrer** ; vérifier ses fonctions effectives |
| **Gmail (connecteur, si accessible)** | Préparer et suivre des prises de contact ciblées | Aucune expédition sans validation explicite |
| **Skills / commandes spécialisés** | Recherche, analyse, préparation des messages et tableaux de bord | Facultatifs ; découvrir ceux effectivement installés |

Metricool ne doit pas être présenté comme capable de parcourir l'ensemble des relations LinkedIn ou d'accéder à des échanges privés. Sa pertinence sera jugée sur des résultats réellement vérifiés.

## Règles générales de communication et de sécurité

- Face à un message ambigu, rester dans le mode courant ; ne pas présumer une autorisation de passer au suivant.
- Dans une nouvelle conversation, repartir des Issues et PR GitHub plutôt que prétendre connaître un état non vérifié.
- Documenter les décisions et liens de suivi dans GitHub pour assurer la continuité.
- Préserver les données Neon et la neutralité du produit ; ne pas attribuer au parti des chiffres non vérifiés et ne pas rendre public un programme documentaire comme scénario chiffré.
- Ne jamais déclarer une modification « en production » sans vérifier le déploiement effectivement actif.

## Versionnement et Conventional Commits

- Respecter la spécification [Conventional Commits 1.0.0](https://www.conventionalcommits.org/fr/v1.0.0/) pour les nouveaux commits et les titres de PR destinées à être fusionnées par *squash* (`feat:`, `fix:`, `docs:`, etc.). Contrôler automatiquement les titres de PR lorsque la CI correspondante est installée.
- Appliquer [Semantic Versioning](https://semver.org/lang/fr/) au format `MAJOR.MINOR.PATCH`. Les jalons correspondent aux versions mineures : **M1 → v1.1.0**, **M2 → v1.2.0**, …, **M8 → v1.8.0**. Entre deux jalons, des versions correctives `PATCH` sont possibles (ex. `v1.1.1`). Une version majeure ultérieure nécessite une décision explicite.
- Utiliser **Release Please** dans un workflow GitHub Actions dédié pour préparer les PR de release, le changelog et les tags. **Les jalons GitHub ne pilotent pas nativement Release Please** : encadrer explicitement les changements de version mineure afin de ne publier la version cible qu'à la validation du jalon correspondant.
- La PR de release reste soumise à revue et fusion manuelles ; **fusionner une PR de release ne vaut pas autorisation de déployer en production**. Vérifier séparément les déclencheurs réels de CI/CD et de Vercel.
- Conserver l'historique Git antérieur sans réécriture. Initialiser la première release `v1.1.0` à la validation de M1 ; ne pas créer cette version tant que le jalon n'est pas validé.

### Consignes opérationnelles pour les agents

- Avant chaque commit, choisir un type Conventional Commits correspondant **à la nature réelle du changement** (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`). Ne jamais employer artificiellement `feat:` pour forcer une version mineure.
- Donner également aux PR un titre conforme à Conventional Commits. En cas de *squash merge*, vérifier que le titre du commit final respecte cette convention : c'est ce commit que Release Please analysera sur `main`.
- Ne pas modifier manuellement les numéros de version, créer de tag Git, fusionner une PR de release ou déclencher une publication sans validation explicite. Les montées de version mineure restent conditionnées à la validation du jalon correspondant.
- Le contrôle automatique des titres de PR relève de la CI GitHub Actions ; ces instructions seules ne constituent pas un contrôle technique.

## Skill de qualification des impacts budgétaires V2

Quand un utilisateur demande de **déduire les impacts des mesures politiques vers les postes du budget citoyen**, lire le skill local [`skills/budget-impact-qualification/SKILL.md`](skills/budget-impact-qualification/SKILL.md) et le pipeline [`docs/v2-qualification-pipeline.md`](docs/v2-qualification-pipeline.md). La chaîne est **déterministe**, seule la décision d'imputation est **agentique**. Aucune exécution IA à la consultation de l'UI ou dans le moteur de simulation. Ne jamais produire un impact non étayé pour satisfaire un compteur ; distinguer montant revendiqué, écriture qualifiée, résultat AGGREGATE. L'agent n'a pas l'autorité d'importer ou de publier sans accord explicite.


## Documentation de référence V2

Pour les évolutions de la V2, partir du [corpus V2](docs/v2/README.md), de son [MCD](docs/v2/mcd.md) et de ses [contrats API](docs/v2/api.md). Les schémas et routes V1 sont historiques. Chaque changement de schéma, API, règles métier, CSV ou pipeline doit mettre à jour ses documents et diagrammes Mermaid dans la même PR. Les budgets et votes citoyens V1 actuels sont des données de test : ils ne sont pas à migrer.
