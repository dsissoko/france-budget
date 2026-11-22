# MCD et schéma logique V2

**Référence physique :** [SQL 001](../../db/v2/001_schema.sql), [003](../../db/v2/003_citizen_crud.sql), [004](../../db/v2/004_votes.sql), [005](../../db/v2/005_ui_contract.sql).

```mermaid
erDiagram
    BUDGET ||--o{ PROPOSITION : contient
    BUDGET ||--o{ IMPACT : porte
    PROPOSITION ||--o{ IMPACT : justifie
    POSTE_REFERENCE ||--o{ IMPACT : concerne
    BUDGET ||--o{ VOTE : recoit
    BUDGET ||--o| AUTORISATION_EDITION : autorise
    BUDGET {
        uuid id PK
        text budget_key UK
        text version UK
        text origin
        text budget_mode
        text publication_status
        int reference_year
        int revision
        jsonb documentary
        bool featured
    }
    PROPOSITION {
        uuid id PK
        uuid budget_id FK
        text proposal_key
        text title
        numeric claimed_amount_bn
        text source_url
        text source_status
    }
    IMPACT {
        uuid id PK
        uuid budget_id FK
        uuid proposal_id FK
        int reference_year FK
        text side FK
        text category_id FK
        numeric delta_amount_bn
    }
    POSTE_REFERENCE {
        int reference_year PK
        text side PK
        text category_id PK
        numeric reference_amount_bn
    }
    VOTE {
        bigint id PK
        uuid budget_id FK
        text voter_hash
    }
    AUTORISATION_EDITION {
        uuid budget_id PK,FK
        text token_hash UK
    }
```

## Invariants physiques

| Table | Contrainte importante |
|---|---|
| `v2.budgets` | PK UUID ; UNIQUE (`budget_key`, `version`), `origin` citoyen/parti/pédagogique |
| `v2.budget_proposals` | UNIQUE (`budget_id`, `proposal_key`), FK budget |
| `v2.budget_proposal_impacts` | FK composites vers budget/proposition/poste ; UNIQUE (`budget_id`, `side`, `category_id`) ; montant non nul |
| `v2.reference_posts` | PK (`reference_year`, `side`, `category_id`) |
| `v2.reference_parameters` | Paramètres de simulation indexés par année |
| `v2.citizen_edit_grants` | Token haché, clé sur le budget |
| `v2.votes` | Unicité (`budget_id`, `voter_hash`) |

La vue `v2.latest_budgets` filtre la version `latest` et l'état `published`.

**Intégration #145 dans la V2 :** les groupes documentaires, lignes sources et allocations internes sont actuellement conservés en `v2.budgets.documentary` (JSONB structuré, validé à l'import), **pas** dans `v2.budget_proposal_impacts`. Ce choix évite les impacts additionnels, mais pourra être normalisé en tables relationnelles lorsque les besoins de requêtage le justifient.
