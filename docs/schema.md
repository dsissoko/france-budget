> **ARCHIVE V1 — documentation historique.** Les tableaux, routes et flux `public` décrits ci-dessous ne sont pas la cible de la V2. Pour toute évolution, lire le [référentiel V2](v2/README.md), le [MCD](v2/mcd.md) et les [contrats API](v2/api.md). Aucun usage comme runbook de déploiement V2.

---

# Schéma de données Neon — état réel au 20 novembre 2026

**Document de référence technique.** Établi à partir de l'introspection de la base Neon de production du projet `calm-rain-58562193`, et rapproché du code `main`. Les migrations SQL versionnées expliquent les changements ; `db/archive/v1/schema.sql` est un **bootstrap historique**, pas un dump exact de production ni un outil de mise à niveau à rejouer tel quel.

## Périmètres et statuts

- **Actif** : schéma, contraintes et écritures politiques déjà exploités par `api/reference.ts` et le moteur V1.
- **Préparation** : tables suffixées `_draft`, non exposées par l'API et **non prises en compte** dans le déficit.
- **Historique** : snapshots `*_backup_*`, `*_before_*` et `*_snapshot_*` pour restauration ; ne pas supprimer avant recette finale.
- **Source de vérité comptable des mesures politiques actives** : `measure_accounting_entries`, jamais `title`, `theme`, `budgets.title` ni `legacy_id`.
- **Source de vérité des montants de référence** : `reference_categories` et `reference_off_budget`, pas la copie de repli dans `src/data.ts`.

## Diagramme relationnel

```mermaid
erDiagram
    POLITICAL_PARTIES ||--o{ BUDGETS : "code -> party_code"
    BUDGETS ||--o{ MEASURES : "id -> budget_id"
    BUDGETS ||--o{ VOTES : "id -> budget_id"
    MEASURES ||--o{ MEASURE_ACCOUNTING_ENTRIES : "id -> measure_id"
    REFERENCE_CATEGORIES ||--o{ MEASURE_ACCOUNTING_ENTRIES : "(id,side) -> (category_id,side)"
    PARTY_SOURCE_REGISTRY_DRAFT ||..o{ PARTY_SOURCE_MEASURE_DRAFT : "party_code / party (logique)"
    PARTY_PROPOSAL_DRAFT ||..o{ PARTY_SOURCE_MEASURE_DRAFT : "party+year+group_id (logique)"
    POLITICAL_PARTIES {
        text code PK
        text name
    }
    BUDGETS {
        uuid id PK
        text party_code FK
        text title
        text origin
        text visibility
        jsonb scenario
        integer reference_year
        text reference_data_version
        boolean featured
        integer featured_order
    }
    MEASURES {
        uuid id PK
        uuid budget_id FK
        text legacy_id
        text category_code
        text kind
        numeric delta_amount
        numeric revenue_delta
        numeric expense_delta
        jsonb apu_entries
    }
    MEASURE_ACCOUNTING_ENTRIES {
        uuid measure_id PK,FK
        integer line_number PK
        text side FK
        text category_id FK
        numeric amount
    }
    REFERENCE_CATEGORIES {
        text id PK
        text side UK
        numeric amount
        integer reference_year
        text label
    }
    VOTES {
        bigint id PK
        uuid budget_id FK
        text voter_hash
    }
    PARTY_SOURCE_REGISTRY_DRAFT {
        text party_code PK
        integer document_year
        text verification_status
        text source_url
    }
    PARTY_PROPOSAL_DRAFT {
        text party PK
        integer source_year PK
        text group_id PK
        text review_status
    }
    PARTY_SOURCE_MEASURE_DRAFT {
        text party PK
        integer source_year PK
        integer source_row PK
        text group_id
        numeric claimed_amount_bn
        text validation_status
    }
```

Les relations en pointillés représentent des **rattachements logiques non encore matérialisés par des clés étrangères** dans les tables de préparation. Le diagramme ne doit pas laisser croire que les 25 groupes sont intégrés à `measures` ou au calcul public.

## Nouvelles tables relationnelles permanentes (créées en base le 20/11/2026)

La transition documentaire a franchi une étape **sans activation de nouveaux budgets** :

- `party_proposals` : PK composite `(party_code,source_year,group_id)`, FK `party_code` → `political_parties.code`. Titre d'affichage, `source_measure_count`, `review_status` limité à `review_pending`, `validated` ou `rejected`.
- `party_source_lines` : PK composite `(party_code,source_year,source_row)`, FK composite **validée** `(party_code,source_year,group_id)` → `party_proposals`. Sens de flux contrôlé, montant revendiqué positif ou nul, source HTTPS, statut documentaire et éventuel tag APU manuel.
- Index `idx_party_source_lines_group(party_code,source_year,group_id,source_row)` pour les lectures d'un groupe.
- Initialisation RN → `RN`, LFI → `LFI`, Équinoxe → `EQX` : correspondances **explicites de codes**, aucun libellé parsé comme clé. Vérifié : 25 groupes, 232 lignes, **zéro orpheline**, décomptes par groupe cohérents, **zéro groupe validé**.
- Les tables `party_proposal_draft` et `party_source_measure_draft` sont conservées provisoirement comme données d'origine, **pas comme second moteur comptable**. La promotion vers les nouvelles tables n'implique pas leur publication.

Le modèle cible est désormais :

```text
political_parties.code
  ├── budgets.party_code → measures.id → measure_accounting_entries
  └── party_proposals (party_code, source_year, group_id)
        └── party_source_lines (party_code, source_year, source_row)
```

**Raccordement structurel réalisé** par les deux tables de liaison décrites ci-dessous, avec FK composites et unicité. Les données de liaison et les décisions APU sont encore vides : aucune activation des groupes préparatoires.

Migration reproductible : [`db/archive/v1/migrations/20261120_party_proposals_relational.sql`](../db/archive/v1/migrations/20261120_party_proposals_relational.sql).

Modèle de contribution synchronisé : [PR programme politique](../.github/PULL_REQUEST_TEMPLATE/political-programme.md) et [issue de soumission](../.github/ISSUE_TEMPLATE/political-programme.yml). Ils exigent désormais identifiants stables, validation APU, contrôle des doublons et mise à jour du schéma.

## Traçabilité des impacts APU (créée, non activée)

Deux tables de liaison complètent désormais la chaîne de provenance, **sans dupliquer les montants** :

```text
political_parties (code)
    ├── budgets (id, party_code) ── measures (id, budget_id)
    │                                     └── measure_accounting_entries (measure_id, line_number)
    └── party_proposals (party_code, source_year, group_id)
           └── party_source_lines (party_code, source_year, group_id, source_row)
                          │
              source_accounting_links (une ligne source -> une mesure)
                          │
              proposal_accounting_measures (une mesure -> un groupe, un budget et un parti)
```

- `proposal_accounting_measures` : `measure_id UUID` PK, `budget_id`, `party_code`, `source_year`, `group_id`. FK composites vers la mesure et son budget, le budget et son parti, ainsi que le groupe documentaire. Une mesure ne peut appartenir qu'à **un** groupe.
- `source_accounting_links` : PK `(party_code,source_year,source_row)`, `group_id`, `measure_id`. FK composite vers la ligne source et vers la mesure liée au **même** groupe ; une ligne source ne peut alimenter qu'une seule mesure, y compris après changement de titre. Index de lecture `idx_source_accounting_links_measure(measure_id)`.
- `party_source_lines.apu_decision` : optionnelle, valeurs `calculate` ou `non_chiffrable_apu`. Si `non_chiffrable_apu`, `apu_reason` doit expliquer le motif. Le champ hérité `apu_manual_tag` est une annotation libre, **pas** une décision de validation.
- **État effectif** : 0 liens et 0 décisions APU dans ces nouvelles structures. Les 232 lignes et 25 groupes ne sont pas automatiquement calculables. Les cinq mesures RN/LFI historiques continuent à être servies par le contrat de compatibilité.
- **Porte de publication pour les nouvelles mesures** (`legacy_id IS NULL`) : `GET /api/reference` utilise `m.id::text` comme identifiant stable, exige un groupe `validated`, une ligne source `calculate` et `validated` liée à la mesure, et **toutes les lignes du groupe** explicitement revues ; toutes les lignes calculables doivent être liées. Il vérifie aussi que les montants des écritures équilibrent les deltas des mesures. En cas d'incohérence, l'API échoue plutôt que de renvoyer un résultat partiel.
- Le fait qu'une ligne soit rattachée ne certifie pas son effet économique. La revue documentaire, la décision APU et la revue des doubles comptes restent des étapes humaines distinctes.

Migrations : [`20261120_party_source_accounting_links.sql`](../db/archive/v1/migrations/20261120_party_source_accounting_links.sql) et [`20261120_party_source_apu_decisions.sql`](../db/archive/v1/migrations/20261120_party_source_apu_decisions.sql).

## Maturité éditoriale du budget (20/11/2026)

Le champ `budgets.maturity_status` est **générique** et commun aux budgets citoyens et politiques. Son affichage est actuellement limité aux budgets `origin='party'`. Il est indépendant des champs `visibility`, `featured` et de la performance du déficit.

| Code stable | Badge visible pour les partis | Signification documentaire |
| --- | --- | --- |
| `en_preparation` | **En préparation** (gris) | Collecte, regroupement ou contrôle documentaire incomplet |
| `complet` | **Complet** (neutre) | Couverture achevée sur le périmètre annoncé ; vérifications éditoriales encore à finaliser |
| `a_confirmer` | **À confirmer** (vert) | Restitution consolidée, prête pour sollicitation officielle du parti |
| `confirme` | **Confirmé** (vert soutenu) | La formation a explicitement confirmé la fidélité de sa transcription, **pas** sa faisabilité économique |

**Contrôle en base :** contrainte `budgets_maturity_status_check` sur les quatre codes. Le statut `confirme` requiert `confirmation_organization`, `confirmation_evidence_url` (HTTPS) et `confirmed_at` non nuls. Aucun budget n'a été marqué « Complet », « À confirmer » ou « Confirmé » automatiquement : **les cinq budgets présents commencent à `en_preparation`**.

**Historisation :** `budget_maturity_history` conserve le budget, l'ancien/nouveau statut, l'horodatage, le rôle SQL déclencheur (`changed_by`) et, si applicable, la preuve de confirmation. Un trigger enregistre les changements de statut. `changed_by` correspond au rôle PostgreSQL, **pas automatiquement à l'identité d'un représentant du parti** : la preuve documentaire doit contenir ou permettre de vérifier cette identité. Une confirmation officielle nécessite une revue humaine avant toute mutation.

**Affichage :** `GET /api/budgets` fournit les champs de maturité et de preuve. Dans **Comparer**, le badge figure sur les choix de budgets politiques. Dans **Voter**, il remplace le badge de qualification budgétaire sur les cartes politiques pour éviter de cumuler les badges ; les citoyens conservent leur badge de qualification. La fiche détaillée affiche le sens du statut et un lien vers la preuve pour `confirme`. La visibilité du budget **n'est jamais modifiée par le statut**.

Migration versionnée : [`db/archive/v1/migrations/20261120_budget_maturity.sql`](../db/archive/v1/migrations/20261120_budget_maturity.sql). Tests de présentation : [`src/budget-maturity.test.ts`](../src/budget-maturity.test.ts).

**Publication des nouveaux budgets politiques :** reste un chantier distinct, qui doit distinguer catalogue documentaire et impacts effectivement calculables. Ne pas promouvoir silencieusement les groupes encore `review_pending` dans les calculs ni fabriquer de confirmations pour accélérer la publication.

## Tables opérationnelles

| Table | Identité et contenu | Intégrité / comportement |
| --- | --- | --- |
| `political_parties` | `code TEXT PK`, `name TEXT NOT NULL` | 13 formations initialisées. Le code est stable ; nom uniquement pour affichage |
| `budgets` | `id UUID PK`, `party_code TEXT NULL`, `origin`, `visibility`, `scenario JSONB`, millésime, champs `featured` | FK `party_code` → `political_parties.code` **validée** ; `origin='party'` exige un code ; budget citoyen sans parti. Les titres ne servent pas au rattachement |
| `measures` | `id UUID PK`, `budget_id UUID FK`, `legacy_id`, `category_code`, `kind`, `delta_amount`, `reference_amount`, `revenue_delta`, `expense_delta`, `status`, `source`, `apu_entries JSONB` | Référence commune citoyen/parti ; unicité partielle `(budget_id,legacy_id)`. `apu_entries` = **copie transitoire à retirer après recette**, pas la source utilisée par l'API |
| `measure_accounting_entries` | `(measure_id,line_number) PK`, `side`, `category_id`, `amount NUMERIC` | FK mesure `ON DELETE CASCADE` et FK composite `(category_id,side)` → `reference_categories(id,side)`, **validées** ; `side IN ('revenues','expenses')`, `line_number>0` |
| `reference_categories` | `id TEXT PK`, `side`, `label`, `amount`, `canonical`, `description`, `reference_year`, `sort_order` | 15 catégories dépenses et 10 recettes, **y compris « Autres et ajustement »**, à conserver. Unicité additionnelle `(id,side)` pour la FK d'écritures |
| `reference_off_budget` | Deux avantages fiscaux/sociaux de référence, `revenue_impact_category` | Hors agrégats APU : seule la variation du manque à gagner impacte les recettes |
| `votes` | `id BIGINT PK`, `budget_id UUID FK`, `voter_hash` | Unicité `(budget_id,voter_hash)` ; ne prouve pas l'identité unique d'une personne |
| `publication_limits` | Empreinte et date de publication | Contrôle anti-abus par fonction SQL `publish_citizen_budget` |

### Référence 2025 active

- Recettes APU : **1 561,7 Md€** ; dépenses : **1 714,2 Md€** ; déficit : **152,5 Md€**.
- Ventilations individuelles : approximations/reconstitutions assumées, **pas** certification INSEE de chaque catégorie.
- Postes « Autres recettes et ajustement » : **0 Md€** ; « Autres dépenses et ajustement » : **0,8 Md€** ; restent dans le moteur et l'interface après migration.
- Les propositions politiques 2026 chiffrées par rapport au PLF/PLFSS 2026 ne deviennent pas automatiquement des effets économiques certifiés sur la référence APU 2025.

### Structures de préparation, non publiques

| Table | Clé | Contenu / statut |
| --- | --- | --- |
| `party_source_registry_draft` | `party_code` | 13 formations recensées et statut de recherche/validation de source |
| `party_source_measure_draft` | `(party,source_year,source_row)` | 232 lignes : RN 75, LFI 143 préliminaires, Équinoxe 14 grandes lignes préliminaires ; revendications, sens, URL, tag manuel éventuel |
| `party_proposal_draft` | `(party,source_year,group_id)` | 25 regroupements : RN 9, LFI 8, Équinoxe 8 ; **`review_pending`** |
| Fichiers GitHub `data/programmes/` | Identifiants documentaires et liens sources | Inventaires et rapprochements publiquement consultables dans « Notre méthode » |

**Attention :** le groupe de présentation n'est **pas** une écriture comptable ; seules les composantes validées produisent un effet. Les propositions partielles doivent rester identifiées comme telles. Le tag `non_chiffrable_apu` est une décision **manuelle** applicable aux propositions des partis ; il ne constitue ni une économie à zéro ni une inférence du RAG. Le RAG est une architecture générique, utilisée pour les sources des partis en V1, non pour chiffrer automatiquement les effets.

## Chaîne d'exécution et contrats

```text
Neon / reference_categories, reference_off_budget
    + budgets / party_code -> political_parties.code
    + measures -> measure_accounting_entries
                  ↓
GET /api/reference : catégories, mesures 'publié' de partis visibles,
                     code stable, apuEntries dérivées des lignes SQL,
                     contrôle sommes des écritures = deltas annoncés
GET /api/budgets   : scénarios citoyens et politiques visibles + party_code + votes
                  ↓
React / src/App.tsx : collections de catégories et mesures, scénarios
                  ↓
AccountingService -> calculateScenario / projectMeasure
                  ↓
SimulationService -> AssessmentService -> vues
```

- Le moteur privilégie `Measure.apuEntries` reçues par API ; il vérifie catégories, sens, finitude et réconciliation avec `revenueDelta`/`expenseDelta`. Une mesure documentaire incohérente fait **échouer** la projection ; pas de solde partiel silencieux. Le repli sur `rules` reste présent **uniquement pour les mesures historiques/fixtures** et doit disparaître après migrations et tests.
- `calculateScenario(ids, overrides, sourcedEntries?)` garde son contrat historique ; troisième argument facultatif. `src/engine/documented-budget.ts` et `party-proposals.ts` sont des adaptateurs pour les groupes ; **pas encore appelés par le parcours public**.
- `GET /api/reference` ne lit **pas** les tables `_draft`. L'API fait aussi un contrôle de somme avant réponse : si elle détecte une incohérence, elle retourne une indisponibilité plutôt que des données invalides.
- `GET /api/budgets` expose `party_code` sans analyser le titre. L'écran possède encore une sélection de parti initiale et un chemin d'activation historiques ; **l'activation automatique des nouveaux partis/groupes reste à terminer**.
- L'exclusion de mesures non chiffrables doit être portée dans le modèle avant toute promotion des tables `_draft`. Le critère « source publiée » ne signifie pas « impact APU validé ».

## Index opérationnels vérifiés

- `budgets_pkey(id)` et index partiels `idx_budgets_public(published_at DESC)`, `idx_budgets_featured(featured_order,published_at DESC)`, `idx_budgets_public_party_code(party_code,featured_order)` pour partis visibles ;
- `idx_measures_budget_legacy(budget_id,legacy_id)` unique partiel ;
- `measure_accounting_entries_pkey(measure_id,line_number)` ;
- `votes_budget_id_voter_hash_key(budget_id,voter_hash)` unique, et `idx_votes_budget(budget_id)` ;
- `party_source_measure_draft_pkey(party,source_year,source_row)` et `idx_party_source_measure_group(party,source_year,group_id,source_row)`.

Mesures ponctuelles `EXPLAIN (ANALYZE,BUFFERS)` : lectures de budgets/mesures publiées ~0,1 ms côté PostgreSQL avec **seulement quelques enregistrements** ; accès à un groupe RN ~0,08 ms. Ces chiffres **n'incluent pas le réseau, la durée des fonctions Vercel ni la latence réelle de l'API** et ne sont pas une garantie à charge future.

## Migrations, non-régression, nettoyage

1. Bootstrap historique : [`db/archive/v1/schema.sql`](../db/archive/v1/schema.sql). Ne pas l'exécuter sur une production existante ; il contient des DDL et des `INSERT/UPDATE` de référence historiques.
2. Préparation : [`db/archive/v1/migrations/20261120_party_documentary_groups.sql`](../db/archive/v1/migrations/20261120_party_documentary_groups.sql).
3. Identification stable et écritures : [`db/archive/v1/migrations/20261120_party_ids_apu_entries.sql`](../db/archive/v1/migrations/20261120_party_ids_apu_entries.sql). **Script de traçabilité, non intégralement idempotent**, et import initial des montants documenté mais non automatisé dans ce fichier.
4. Index : [`db/archive/v1/migrations/20261120_api_indexes.sql`](../db/archive/v1/migrations/20261120_api_indexes.sql).
5. Audit de cohérence : [`db/audits/party-source-grouping-readonly.sql`](../db/audits/party-source-grouping-readonly.sql).
6. CI : [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) — `npm run check`, `npm test`, `npm run build` à chaque push sur `main` et chaque PR. Vérifier le résultat de la **dernière** exécution avant bascule.
7. Après validation de production et test de restauration : nettoyer les snapshots temporaires, pas les inventaires sources. Les historiques contenant empreintes ou votes ne doivent **jamais** être exportés publiquement sur GitHub.


## Publication documentaire contrôlée — 20 novembre 2026

**État vérifié dans Neon après déploiement Vercel READY du commit `218e8bf`** :

| Formation | Visibilité | Maturité | Groupes documentaires affichés | Propositions chiffrées actives |
| --- | --- | --- | ---: | ---: |
| RN 2026 | Publique | En préparation | 9 | 3 |
| LFI 2026 | Publique | En préparation | 8 | 2 |
| Équinoxe 2027 | Publique | En préparation | 8 | 0 |
| Horizons | Masquée | En préparation | 0 | 0 public |

Deux budgets citoyens restent publics et inchangés.

- `GET /api/budgets` expose désormais `documentaryProposals` depuis `party_proposals` avec les libellés, millésimes, compte de sources et URL officielle provenant de `party_source_lines`. **Le catalogue n'est pas injecté dans le moteur comptable**.
- Équinoxe a été créé par [`db/archive/v1/migrations/20261120_publish_equinoxe_documentary.sql`](../db/archive/v1/migrations/20261120_publish_equinoxe_documentary.sql), **d'abord masqué** ; puis rendu public seulement après disponibilité du déploiement compatible. `scenario.documentaryOnly=true`, `picked=[]`, et aucun montant de scénario n'a été inventé.
- Dans **Voter**, les fiches documentaires présentent les groupes et sources, sans synthèse du déficit ni courbe financière. Les tris par équilibre les placent après les budgets chiffrables.
- Dans **Comparer** et comme point de départ de **Mon budget**, les scénarios exclusivement documentaires sont exclus afin de ne jamais simuler leur déficit sur la simple référence INSEE.
- Pour RN/LFI, la fiche présente séparément les lignes déjà calculées et les groupes documentaires non revus ; une ligne source n'est jamais additionnée deux fois.
- Les statuts `review_pending` des **25 groupes** et les **232 lignes** ne sont pas promus en « validés » par leur seule publication documentaire. Un badge `En préparation` n'est pas une confirmation officielle.

**Important :** cette publication rend visibles les données documentaires déjà structurées ; elle ne transforme pas des inventaires provisoires en programmes complets ni en prévisions économiques.


## Points restant à traiter dans le modèle

- **Structure réalisée** : les FK composites relient désormais les lignes sources, propositions, mesures et budgets, indirectement jusqu'aux écritures APU. **Population non réalisée** : aucune mesure de groupe préparatoire n'a encore été validée et reliée ; les 5 mesures historiques restent compatibles.
- Éliminer la double représentation transitoire `measures.apu_entries` et `measure_accounting_entries` après recette, en conservant **uniquement la table normalisée**.
- Refuser explicitement les mesures politiques actives sans écritures validées, et vérifier qu'une source documentaire ne contribue qu'à un seul calcul.
- Remplacer les reliquats de règles V1 et fixtures codées en dur ; garder les mêmes modèles, calculs et 25 catégories pour les citoyens et les partis.
- Vérifier la protection de branche GitHub et le déploiement Vercel indépendamment du succès de la CI.

Pour le suivi, consulter [l'issue #59](https://github.com/dsissoko/france-budget/issues/59).
