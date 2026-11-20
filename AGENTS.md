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

## Règles générales de communication et de sécurité

- Face à un message ambigu, rester dans le mode courant ; ne pas présumer une autorisation de passer au suivant.
- Dans une nouvelle conversation, repartir des Issues et PR GitHub plutôt que prétendre connaître un état non vérifié.
- Documenter les décisions et liens de suivi dans GitHub pour assurer la continuité.
- Préserver les données Neon et la neutralité du produit ; ne pas attribuer au parti des chiffres non vérifiés et ne pas rendre public un programme documentaire comme scénario chiffré.
- Ne jamais déclarer une modification « en production » sans vérifier le déploiement effectivement actif.
