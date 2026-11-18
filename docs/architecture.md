# Architecture technique et modèle de données — Mon Budget Citoyen

## Vue d'ensemble (état v1.0.0)

```text
React 19 + TypeScript + Vite + Recharts (navigateur)
  ├── GET /api/reference ───────────────────────────┐
  ├── GET /api/budgets ─────────────────────────────┤
  ├── POST /api/budgets ────────────────────────────┤ Vercel Functions (Node.js)
  ├── POST /api/votes ──────────────────────────────┤   └── Neon PostgreSQL
  ├── localStorage : scénarios personnels           │
  └── src/projection.ts : calculs côté navigateur   ┘
```

- **Déploiement** : GitHub `main` → intégration Git Vercel → production. L'API n'est pas fournie par `vite dev` seul.
- **Secret** : `DATABASE_URL` côté fonctions Vercel uniquement, jamais exposé via `VITE_*`.
- **Base** : Neon PostgreSQL (Francfort, d'après la documentation d'intégration) ; rôle applicatif `france_budget_app` à droits limités.
- **Données privées locales** : `localStorage['france-budget-v1']` (ajustements de jauges) et `localStorage['france-budget-scenarios']` (scénarios nommés). Pas de synchronisation inter-appareils.
- **Données publiques** : budgets publiés, mesures et votes conservés dans Neon ; une publication est une copie distincte du scénario local.

## Modèle relationnel (voir db/schema.sql)

| Objet | Fonction | Relations / contraintes |
|---|---|---|
| `reference_categories` | Référence budgétaire : `id`, `side`, `amount`, `label`, `canonical`, `description`, `reference_year`, `sort_order` | Clé `id` ; catégories recettes/dépenses |
| `budgets` | Budget publié politique ou citoyen | UUID ; `origin` (`party`, `citizen`, `educational`), `visibility`, `reference_year`, `scenario JSONB`, `featured`, `featured_order`, `published_at` |
| `measures` | Propositions liées à un budget | FK `budget_id` → `budgets.id`, `category_code`, `kind`, `delta_amount`, `reference_amount`, métadonnées politiques et `legacy_id` |
| `votes` | Soutien public | FK `budget_id`, `voter_hash`, contrainte UNIQUE (`budget_id`, `voter_hash`) |
| `publication_limits` | Limitation des publications | Empreinte et horodatage |
| `reference_measures` | Ancienne table de migration | Conservée pour vérification / retour arrière ; plus lue par `GET /api/reference` |

Le schéma `db/schema.sql` documente la structure de création ; **ne pas le confondre avec un outil de migration automatique de la base existante**. Les évolutions de schéma et les données migrées doivent être suivies séparément.

### Modèle logique de scénario

```json
{
  "budget": {"revenues": {}, "expenses": {}},
  "picked": ["id-de-mesure"],
  "citizenMeasures": [],
  "author": "pseudonyme-public"
}
```

- `budget` : ajustements par code de catégorie, en Md€ ; absence de clé = valeur de référence.
- `picked` : identifiants de mesures politiques retenues.
- `citizenMeasures` : propositions citoyennes décrites, reliées à une catégorie et un type recette/dépense.
- `author` : pseudonyme public demandé pour les nouvelles publications citoyennes ; anciens enregistrements compatibles sans auteur.
- Les métadonnées de publication (titre, description, origine, visibilité, année) sont dans `budgets`, hors JSON.

## Lecture / écriture

1. `GET /api/reference` lit `reference_categories` et les mesures politiques de `measures` jointes à `budgets` ; la version actuelle cible **2025**.
2. Le frontend attend ce référentiel avant d'afficher les montants ; il alimente les collections utilisées par les composants et le moteur de projection.
3. `GET /api/budgets` sert les budgets publiés et leur sélection éditoriale (`featured`, `featured_order`). Comparer limite la sélection mise en avant à dix budgets ; Voter liste les budgets publics.
4. `POST /api/budgets` valide les catégories contre Neon, puis utilise la fonction SQL `publish_citizen_budget` pour une publication atomique et la limite globale de **50 budgets citoyens**.
5. `POST /api/votes` enregistre un soutien. Unicité technique par budget et empreinte du cookie, **pas par personne**.
6. Les budgets personnels non publiés ne passent pas par ces endpoints : ils restent dans le navigateur.

## Calcul budgétaire

- Agrégats APU 2025 utilisés : recettes **1 561,6 Md€**, dépenses **1 714,1 Md€**, déficit **152,5 Md€**.
- **Important** : les catégories ventilées et les reclassements pédagogiques ne sont pas des montants INSEE certifiés poste par poste.
- `src/projection.ts` contient `calculateScenario`, `projectMeasure` et les audits de rapprochement des revendications. Le solde résulte des recettes moins les dépenses, après application des ajustements et écritures de mesures.
- Les règles `rules` (notamment la répartition d'une mesure entre plusieurs catégories et certaines exceptions) sont **encore codées en dur** ; elles utilisent les identifiants historiques `legacy_id`.
- Une égalité comptable entre montant revendiqué et montant ventilé n'atteste ni faisabilité économique ni absence de double compte. Les trajectoires v1.0.0 sont indicatives et non prédictives.

## Dette technique : issue #22 (v1.0.0, ouverte)

- Concevoir et migrer `measure_impacts` ou une représentation versionnée équivalente : mesures → catégories, parts, sens, justification et hypothèses.
- Fournir ces paramètres par API, tout en conservant le moteur d'exécution TypeScript réactif côté navigateur.
- Supprimer les dépendances de production à la copie historique `src/data.ts` ; garder des fixtures dédiées pour les tests.
- Tester la conservation des totaux INSEE, les mesures RN/LFI/Horizons, les propositions citoyennes, les répartitions multiples et les avertissements.
- Versionner les hypothèses et leurs sources ; documenter les migrations de données sans effacer les publications ni les votes.

## Sécurité et exploitation

- L'API doit valider les montants et catégories indépendamment des validations du navigateur.
- Limites anti-abus documentées : 50 publications citoyennes publiques, 2 publications par 24 h et par empreinte, cookie de vote HttpOnly/Secure/SameSite.
- Les limites par cookie/empreinte ne garantissent pas une identité unique ; aucun scrutin représentatif n'est revendiqué.
- Ne jamais lancer de réinitialisation de `votes` ou de `budgets` lors d'un déploiement ou d'une migration.
- Éviter de présenter les contenus saisis par les visiteurs comme du HTML de confiance.

## Versions

- **v1.0.0** : quatre parcours, base Neon unifiée, comparaison A/B en deux clics, campagne de recette et migration de paramètres à terminer.
- **v1.1.0** : modèle pluriannuel avec dette/PIB, intérêts, sensibilité, indicateurs de désendettement validés ; **non implémenté dans la v1.0.0**.

Voir aussi [vision.md](vision.md), [neon-integration.md](neon-integration.md) et [../db/schema.sql](../db/schema.sql).
