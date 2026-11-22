# Contribuer à Mon Budget Citoyen

Merci pour votre intérêt. Le projet est gratuit, open source et **non partisan**. Nous accueillons des contributions sur les données, le moteur économique, la conformité documentaire des programmes et la diffusion du projet.

La [roadmap à trois piliers](docs/roadmap.md) précise les priorités. L'interface grand public est stabilisée ; ne soumettez pas de refonte UX sans discussion préalable.

> **Travaux V2 :** lire le [référentiel documentaire](docs/v2/README.md) et utiliser le [template V2](.github/PULL_REQUEST_TEMPLATE/v2-change.md). Les instructions historiques V1 sont conservées uniquement durant la transition.

## Choisir sa contribution

| Profil / objectif | Premier pas | Pour proposer une modification |
| --- | --- | --- |
| Économiste, chercheur, data scientist ou développeur | [Issue de modèle économique](.github/ISSUE_TEMPLATE/economic-model.yml) | [PR — modèle économique](.github/PULL_REQUEST_TEMPLATE/economic-model.md) |
| Équipe d'un parti ou personne documentant un programme | [Issue de proposition politique](.github/ISSUE_TEMPLATE/political-programme.yml) | [PR — programme politique](.github/PULL_REQUEST_TEMPLATE/political-programme.md) |
| Communication, associations, pédagogie | [Issue de diffusion](.github/ISSUE_TEMPLATE/outreach.yml) | Une issue suffit dans un premier temps |

**Sans savoir programmer :** ouvrez une issue structurée avec vos sources ; une PR n'est pas obligatoire. Avec GitHub, une issue est une demande ou proposition, une PR propose une modification traçable des fichiers.

## Workflow GitHub

1. Rechercher une issue existante, puis créer une issue ciblée si nécessaire.
2. Décrire les sources, unités (Md€), périmètres institutionnels, années et hypothèses.
3. Pour une contribution codée, créer une branche et une PR ; sélectionner le modèle correspondant.
4. Décrire les conséquences et les limites du changement, joindre des exemples vérifiables.
5. La revue peut demander des modifications avant fusion ; **aucun contributeur ne valide seul ses propres hypothèses**.

Vérifications de base pour une PR technique :

```bash
npm install
npm run check
npm test
npm run build
```

Ne jamais inclure de secrets, données personnelles non nécessaires, accès Neon ou jetons Vercel dans une contribution. Les PR ne doivent pas provoquer de modification automatique de production.

## Programmes et propositions politiques

Toutes les formations sont traitées avec les mêmes critères documentaires. Une contribution doit préciser :
- Programme, formation, date de publication, source primaire consultable et identité ou qualité **déclarée** du contributeur.
- Intitulé, description, calendrier, population concernée et montant revendiqué, en précisant montant annuel/total, récurrent/ponctuel et prix courants/constants.
- Ventilation vers les catégories existantes : **recettes ou dépenses**, catégories, montants, justification et somme de contrôle.
- Hypothèses, intervalles d'incertitude le cas échéant, mesures liées et risques de double compte.
- Distinction **chiffrage revendiqué par le parti**, **interprétation de notre équipe** et **projection du moteur**.

**La création d'une PR ne vaut pas preuve de représentation officielle.** Une attestation « transcription confirmée par le parti » n'est possible qu'après contrôle séparé de l'habilitation. Elle n'implique jamais l'approbation scientifique du chiffrage. Les documents et liens présentés restent attribués à leurs auteurs.

Les identifiants des catégories et schémas existants doivent être vérifiés avant toute modification : ne pas inventer d'identifiant ou modifier directement les données de production.

## Contribuer au moteur

La démarche attendue inclut la question étudiée, la méthode, les équations ou références, les hypothèses, les données sources, les tests de cohérence et le domaine de validité. Une projection de dette n'est pas une prévision de croissance ; une modélisation d'effet comportemental réclame des données et une incertitude explicites.

Les règles et limitations existantes figurent dans [docs/vision.md](docs/vision.md), [docs/architecture.md](docs/architecture.md) et [docs/methode.md](docs/methode.md).

## Diffuser

Partager le projet, organiser des démonstrations, proposer des contenus accessibles ou contacter des acteurs académiques et associatifs. Ne pas faire passer un nombre de votes pour un sondage représentatif, ni donner une caution officielle sans autorisation.

## Revue et gouvernance

Mainteneurs : revue du respect des formats, des sources, de la neutralité, des tests et du risque de régression. Une demande peut être documentée et discutée sans être fusionnée. La licence du code est MIT ; les droits sur les documents et données tiers doivent être respectés.
