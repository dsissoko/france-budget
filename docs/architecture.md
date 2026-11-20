# Architecture technique et modèle de données — Mon Budget Citoyen

## Vue d'ensemble (code main et modèle Neon, 20/11/2026)

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

## Modèle relationnel (voir [schema.md](schema.md), référence vérifiée en base)

Le [schéma détaillé](schema.md) est la **référence technique** (colonnes, FK, index, tables de préparation et état de validation). Le fichier [`db/schema.sql`](../db/schema.sql) est un bootstrap historique, **pas un miroir à jour de la base de production**.

| Table | Responsabilité | Identité / contraintes majeures |
|---|---|---|
| `political_parties` | Répertoire des formations | `code` PK stable, `name` libellé |
| `budgets` | Budgets citoyens et politiques | `id UUID` PK, `party_code` FK validée (requise pour `origin='party'`), `scenario JSONB`, visibilité |
| `measures` | Mesures associées aux budgets | `id UUID` PK, FK budget, `legacy_id` historique |
| `measure_accounting_entries` | **Écritures APU normalisées** | PK `(measure_id,line_number)`, FK catégorie `(category_id,side)`, montant signé |
| `reference_categories` | 25 postes APU, y compris les deux « Autres et ajustement » | `id` PK, `(id,side)` unique |
| `reference_off_budget` | Deux avantages hors budget | Écarts imputés aux recettes, non additionnés aux dépenses |
| `votes` | Votes sur les budgets | FK budget et unique `(budget_id,voter_hash)` |
| `party_*_draft` | Sources, lignes et groupes politiques **non encore publiés** | Identités composites, validation documentaire restante |

Les libellés `title` et `name` ne doivent **jamais** identifier un parti ou déterminer une écriture comptable. Les groupes documentaires ne sont pas comptés en plus de leurs composantes.

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
4. `POST /api/budgets` valide les catégories contre Neon, puis utilise la fonction SQL `publish_citizen_budget` pour une publication atomique et la limite globale actuellement codée de **100 budgets citoyens**.
5. `POST /api/votes` enregistre un soutien. Unicité technique par budget et empreinte du cookie, **pas par personne**.
6. Les budgets personnels non publiés ne passent pas par ces endpoints : ils restent dans le navigateur.

## Calcul budgétaire

- Agrégats APU 2025 actifs dans Neon : recettes **1 561,7 Md€**, dépenses **1 714,2 Md€**, déficit **152,5 Md€**.
- **Important** : les catégories ventilées et les reclassements pédagogiques ne sont pas des montants INSEE certifiés poste par poste.
- `src/projection.ts` contient `calculateScenario`, `projectMeasure` et les audits de rapprochement des revendications. Le solde résulte des recettes moins les dépenses, après application des ajustements et écritures de mesures.
- Les mesures politiques actives sont maintenant ventilées dans `measure_accounting_entries` ; `GET /api/reference` produit `apuEntries` et contrôle la réconciliation avec les deltas. `projectMeasure` privilégie ces écritures et rejette toute incohérence. Les règles `rules` codées en dur subsistent **en repli historique**, pas comme mode cible.
- Une égalité comptable entre montant revendiqué et montant ventilé n'atteste ni faisabilité économique ni absence de double compte. Les trajectoires v1.0.0 sont indicatives et non prédictives.

## Dette technique : issue #22 (v1.0.0, ouverte)

- **Réalisé partiellement** : table `measure_accounting_entries` avec FK et code parti stable. Reste à enrichir le modèle des propositions documentaires validées et à éliminer les copies/règles transitoires.
- Fournir ces paramètres par API, tout en conservant le moteur d'exécution TypeScript réactif côté navigateur.
- Supprimer les dépendances de production à la copie historique `src/data.ts` ; garder des fixtures dédiées pour les tests.
- Tester la conservation des totaux INSEE, les mesures RN/LFI/Horizons, les propositions citoyennes, les répartitions multiples et les avertissements.
- Versionner les hypothèses et leurs sources ; documenter les migrations de données sans effacer les publications ni les votes.

## Sécurité et exploitation

- L'API doit valider les montants et catégories indépendamment des validations du navigateur.
- Limites anti-abus documentées : 100 publications citoyennes publiques, 100 publications par 24 h et par empreinte, cookie de vote HttpOnly/Secure/SameSite.
- Les limites par cookie/empreinte ne garantissent pas une identité unique ; aucun scrutin représentatif n'est revendiqué.
- Ne jamais lancer de réinitialisation de `votes` ou de `budgets` lors d'un déploiement ou d'une migration.
- Éviter de présenter les contenus saisis par les visiteurs comme du HTML de confiance.

## Versions

- **v1.0.0** : quatre parcours, base Neon unifiée, comparaison A/B en deux clics, campagne de recette et migration de paramètres à terminer.
- **v1.1.0** : modèle pluriannuel avec dette/PIB, intérêts, sensibilité, indicateurs de désendettement validés ; **non implémenté dans la v1.0.0**.

Voir aussi **[schema.md](schema.md)** (schéma réel et statut des migrations), [vision.md](vision.md), [neon-integration.md](neon-integration.md) et [../db/schema.sql](../db/schema.sql) (bootstrap historique).
