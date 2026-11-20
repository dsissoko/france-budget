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

## Second processus émergent : notoriété et campagne de promotion

Ce processus est **distinct du développement / déploiement**. Il concerne une campagne **non commerciale**, visant la **notoriété de Mon Budget Citoyen**, les conversations utiles, l'essai du simulateur et la participation citoyenne. Aucun objectif de vente ou d'acquisition payante n'est présumé.

**Référentiel persistant :** [`docs/promotion/README.md`](docs/promotion/README.md), [`docs/promotion/campagne-promotionnelle.md`](docs/promotion/campagne-promotionnelle.md), ainsi que les journaux `contacts.csv`, `publications.csv`, `indicateurs.csv` et les brouillons `messages.md`.

**Cycle émergent, révisable selon les premiers retours :**

1. **Définir / affiner la campagne** : cible, angle éditorial, canaux, messages, calendrier, garde-fous et indicateurs. La campagne actuelle est « Parlons chiffres ».
2. **Préparer les actions** : sélectionner les prises de parole, rédiger les messages, identifier les comptes et communautés et vérifier les règles des plateformes. Une préparation n'est pas une publication.
3. **Exécuter sur validation** : obtenir un accord explicite pour envoyer, publier, programmer ou contacter. Ne pas poster automatiquement ni multiplier les relances.
4. **Suivre par tâches récurrentes** : revue des réponses, performances observables, participation, éventuels points de blocage et propositions de prochaines actions. Les automatisations ne sont créées ou modifiées que sur demande ou accord explicite.
5. **Capitaliser / ajuster** : journaliser les résultats vérifiés, mettre à jour le plan, interrompre les actions inefficaces et requalifier les opportunités.

**Mesure et éthique :** distinguer audience (portée, impressions), conversations (réponses utiles), usage (visites, budgets publiés, votes) et qualité des retours. Une valeur non disponible est `ND`, jamais un zéro inventé. Privilégier une diffusion transparente, pluraliste, non partisane et non intrusive. Respecter les règles de chaque plateforme, l'absence d'envoi sans validation et la confidentialité des données.

## Catalogue des outils optionnels — connecteurs, MCP, skills et commandes

Un **catalogue de capacités**, pas une garantie d'accès permanent. Avant chaque action, identifier les outils réellement connectés dans la session, leurs permissions, leurs limites et l'environnement cible. Les connecteurs/MCP sont des accès à des services ; les skills définissent des méthodes ; les commandes/outils locaux ne sont utilisables que si un environnement d'exécution approprié est réellement disponible.

| Outil / catégorie | Utilité dans nos processus | Statut / précaution |
| --- | --- | --- |
| **GitHub (connecteur / MCP)** | Issues, branches, PR, fichiers, historique, revue, CI, documentation et suivi de campagne versionné | **Outil central** ; éviter les commits directs sur `main` |
| **Vercel (connecteur / MCP)** | Builds, déploiements, environnements, domaines, diagnostics d'exécution | **Outil central** ; surveiller les quotas, éviter de déployer chaque commit |
| **Neon (connecteur / MCP)** | Postgres, requêtes, migrations, vérification des budgets, votes et données de référence | **Outil central** ; vérifier le projet et la cible avant toute écriture |
| **Automations / tâches récurrentes** | Suivi régulier de campagne, résultats, réactions, contrôle périodique et alertes | Pertinent pour **marketing et exploitation** ; aucune tâche à créer sans demande/accord |
| **Metricool (connecteur / MCP)** | Réseaux sociaux : accès aux comptes liés, programmation, métriques, horaires de publication | **Connecté (LinkedIn détecté), valeur à démontrer** ; tester les possibilités réelles avant de l'intégrer au flux |
| **Gmail (connecteur, si disponible)** | Préparer les prises de contact médias/relayeurs, rechercher des réponses et assurer le suivi | L'envoi nécessite une validation explicite |
| **Skills** (GitHub, Vercel, marketing, analyse, etc., selon installation) | Instructions spécialisées pour guider les opérations et éviter les erreurs répétées | Découvrir et lire le skill pertinent avant de l'utiliser ; ne pas supposer qu'il est installé |
| **Commandes / CLI** (`git`, `gh`, `npm`, `vercel`, `psql`, etc.) | Développement, tests, diagnostics, migrations et opérations de secours | Utiliser seulement si exécution et accès sont disponibles ; ne pas contourner quotas, permissions ou validations |

**Trio technique privilégié : GitHub + Vercel + Neon.** Il couvre le pilotage du développement, l'hébergement et la base de données. Les tâches récurrentes ajoutent une continuité opérationnelle pour le suivi de notoriété. Metricool est **candidat** pour enrichir cette chaîne avec des fonctions sociales mesurables, sans présumer qu'il peut consulter l'intégralité du réseau LinkedIn ni garantir un accès à ses conversations privées.

**Règle d'outillage :** choisir le minimum nécessaire à la demande, enregistrer les résultats durables dans le dépôt quand c'est pertinent, et mentionner les limitations constatées plutôt que de simuler une action.

## Règles générales de communication et de sécurité

- Face à un message ambigu, rester dans le mode courant ; ne pas présumer une autorisation de passer au suivant.
- Dans une nouvelle conversation, repartir des Issues et PR GitHub plutôt que prétendre connaître un état non vérifié.
- Documenter les décisions et liens de suivi dans GitHub pour assurer la continuité.
- Préserver les données Neon et la neutralité du produit ; ne pas attribuer au parti des chiffres non vérifiés et ne pas rendre public un programme documentaire comme scénario chiffré.
- Ne jamais déclarer une modification « en production » sans vérifier le déploiement effectivement actif.
