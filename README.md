# Mon Budget Citoyen

[![Site Vercel](https://img.shields.io/website?url=https%3A%2F%2Fmon-budget-citoyen.vercel.app&label=Vercel&logo=vercel&logoColor=white)](https://mon-budget-citoyen.vercel.app)

**Application : [mon-budget-citoyen.vercel.app](https://mon-budget-citoyen.vercel.app)**

Simulateur citoyen open source et non partisan pour **comprendre** les finances publiques, **comparer** deux budgets, **construire** son propre scénario et **voter** pour des budgets publiés.

> **Statut : V1 en recette.** Les agrégats de recettes (1 561,6 Md€), de dépenses (1 714,1 Md€) et le déficit (152,5 Md€) correspondent à la référence INSEE 2025 utilisée par le projet. La ventilation des catégories est **indicative et pédagogique**, non une extraction comptable certifiée. Les mesures politiques ont des sources et statuts distincts ; les simulations sont mécaniques, non des prévisions économiques.

## Parcours

- **Comprendre** : agrégats INSEE 2025, catégories de recettes et de dépenses, explications et trajectoire indicative.
- **Comparer** : choisir un budget A puis un budget B **en deux clics** parmi les budgets mis en avant (10 maximum) ; comparaison à la référence INSEE ; **Réinitialiser** pour recommencer.
- **Mon budget** : partir de la référence ou d'un budget existant, modifier les postes, ajouter des propositions, enregistrer des scénarios dans le navigateur ou publier.
- **Voter** : explorer les budgets politiques et citoyens publiés, filtrer, consulter le détail et soutenir un budget. Le vote n'est pas une élection représentative.

## Architecture actuelle

```text
Navigateur (React 19 / Vite / TypeScript / CSS / Recharts)
    ├── localStorage : brouillons et scénarios personnels non publiés
    ├── GET /api/reference : catégories et mesures politiques
    ├── GET /api/budgets : budgets publics, sélection éditoriale et votes
    ├── POST /api/budgets : publication citoyenne
    └── POST /api/votes : soutien d'un budget
              │
       Fonctions serverless Vercel (Node.js)
              │ DATABASE_URL (secret serveur)
              ▼
          Neon PostgreSQL
```

**Neon est la source de vérité** pour les catégories budgétaires, les mesures et les budgets publics. Les budgets politiques et citoyens utilisent le même modèle `budgets` + `measures`, différenciés par `origin`. Les règles de ventilation du moteur de projection restent **partiellement codées** dans `src/projection.ts` : leur migration est suivie par [l'issue #22](https://github.com/dsissoko/france-budget/issues/22).

Les scénarios **enregistrés** restent locaux au navigateur/profil : ils ne sont ni synchronisés entre appareils ni publiés automatiquement. Une **publication** crée une copie indépendante dans Neon. Le site n'impose pas de compte utilisateur ; un nom/pseudonyme public est demandé lors de la publication.

## Développement

Prérequis : Node.js compatible avec Vite 6 et npm.

```bash
npm install
npm run dev
npm run check
npm test
npm run build
```

Le frontend utilise les routes `/api/*` : `vite dev` seul ne fournit pas les fonctions Vercel ni Neon. Pour tester les parcours avec base de données, utiliser un environnement Vercel adapté et une `DATABASE_URL` **côté serveur uniquement**, jamais avec le préfixe `VITE_`. Ne pas pointer les tests d'écriture vers la production.

## Projet collaboratif et roadmap

Le développement s'organise désormais autour de **trois piliers parallèles** :

1. **Participation citoyenne (v1.x)** — améliorer le partage des budgets, l'invitation au vote et la gestion des soutiens, sans refonte de l'interface.
2. **Crédibilité économique (en démarrage)** — renforcer la ventilation des mesures, les trajectoires de dette et, progressivement, les modèles macroéconomiques documentés et testables.
3. **Contribution ouverte (en démarrage)** — accueillir les propositions d'économistes, de chercheurs, de développeurs, de formations politiques et les initiatives de diffusion non partisane.

Voir la [roadmap](docs/roadmap.md) et le [guide des contributions](CONTRIBUTING.md). Une équipe politique peut soumettre des corrections sourcées et leur ventilation via une [issue dédiée](.github/ISSUE_TEMPLATE/political-programme.yml) ou une [PR structurée](.github/PULL_REQUEST_TEMPLATE/political-programme.md). Une contribution ne vaut ni certification officielle ni validation scientifique.

## Documentation

- [Roadmap à trois piliers](docs/roadmap.md)
- [Participer au projet](CONTRIBUTING.md)
- [Vision produit et versions](docs/vision.md)
- [Architecture et modèle de données](docs/architecture.md)
- [Intégration Neon, publication et sécurité](docs/neon-integration.md)
- [Schéma SQL versionné](db/schema.sql)
- [Issues et recette](https://github.com/dsissoko/france-budget/issues) : `v1.0.0` en validation, `v1.1.0` pour les évolutions de projection.

## Livraison

GitHub `main` déclenche les déploiements Vercel via l'intégration Git native. GitHub Actions vérifie la compilation et les contrôles définis dans les workflows ; aucun jeton de déploiement Vercel n'est requis dans les actions. Les publications et votes existants dans Neon ne sont pas réinitialisés par les déploiements du frontend.

## Limites connues

- Ventilation des catégories indicative, même lorsque les agrégats sont officiels.
- Interactions entre mesures, effets macroéconomiques et risques de double compte non modélisés exhaustivement.
- Limitation des votes par cookie/navigateur, sans garantie d'unicité par personne.
- Migration des règles de projection vers Neon inachevée (issue #22).
- La qualification du désendettement, de la dette/PIB et des intérêts relève de `v1.1.0`.

## Licence

MIT. Les données et documents tiers conservent leurs propres licences.
