# Contrats API V2

[Spécification OpenAPI 3.1 versionnée](openapi.yaml) — contrats de la branche #142 ; la validation automatique contre les handlers reste à compléter.

Les endpoints ci-dessous sont ceux de l'API V2 publiée sur [Mon Budget Citoyen](https://mon-budget-citoyen.vercel.app). Le contrat normatif reste le code des handlers [api/v2](../../api/v2/) et les tests associés.

| Méthode | Endpoint | Réponse normale |
|---|---|---|
| GET | `/api/v2/reference` | Postes (`revenues`, `expenses`, `offBudget`, `posts`), `simulation`, `referenceYear`, `referenceVersion` |
| GET | `/api/v2/budgets` | `{budgets:[...],version:"latest"}`, filtre facultatif `?origin=citizen|party|educational` |
| POST | `/api/v2/budgets` | Création citoyenne ; identifiant, clé, révision, statut, jeton d'édition |
| GET | `/api/v2/budgets/{key}` | Budget, présentation et `proposals[]` avec leurs `impacts[]` |
| PATCH | `/api/v2/budgets/{key}` | Mutation du brouillon avec token Bearer et révision |
| DELETE | `/api/v2/budgets/{key}` | Retrait logique avec token et révision |
| GET | `/api/v2/budgets/{key}/positions` | Pour PARTIAL, postes de référence et impacts ; pour AGGREGATE ventilé, positions et statut `aggregate_allocated`, sinon retour documentaire sans positions |
| POST | `/api/v2/votes` | `{voted:true}` / HTTP 201, ou HTTP 409 si déjà voté |
| GET | `/api/v2/share/{id}` | HTML partage / métadonnées sociales / redirection |

## Distinction de données obligatoire

- `claimedAmountBn` : montant source annoncé, **non imputé automatiquement**.
- `deltaAmountBn` : impact comptable validé.
- `budgetMode` : `PARTIAL` ou `AGGREGATE`.
- `documentary` : références, contexte et masses publiées ; ses chiffres ne sont pas ajoutés aux impacts.

Le handler `GET /budgets/{key}/positions` restitue désormais les postes ventilés pour les AGGREGATE possédant `documentary.claimedAllocations` ; il continue de renvoyer `positions:[]` pour les agrégats sans ventilation qualifiée. Les allocations issues de #145 ont été importées dans `v2.budgets.documentary` pour LFI 2027. Les accès PostgreSQL du rôle applicatif ont été accordés au schéma V2 sans autorisation d'import administratif.

## Erreurs, sécurité et limites

- 400 pour clés/origines invalides ; 404 pour budget absent ou non publié ; 405 pour méthode non autorisée.
- 403 pour opérations d'édition ou de création refusées par les contrôles d'origine/capacité ; 409 sur un vote dupliqué.
- 503 lorsque le référentiel requis manque ou que le backend échoue (voir handlers pour les statuts exacts des autres validations).
- `V2_DATABASE_URL` uniquement côté serveur, sans fallback `DATABASE_URL`.
- Jeton d'édition **séparé** du cookie de vote `fb_voter`.
- Le GET de liste est actuellement limité à 500 lignes ; pas de pagination publique codée.

## Exemples

```bash
curl -fsS "$BASE_URL/api/v2/reference"
curl -fsS "$BASE_URL/api/v2/budgets?origin=party"
curl -fsS "$BASE_URL/api/v2/budgets/nopasaran-2025"
curl -fsS "$BASE_URL/api/v2/budgets/nopasaran-2025/positions"
```

Les payloads des mutations sont définis par [`api/v2/_citizen.ts`](../../api/v2/_citizen.ts) et doivent être testés sur la preview, sans reconstitution des champs V1 `scenario.citizenMeasures`. Une spécification OpenAPI pleinement synchronisée reste un chantier distinct, à contractualiser avec les tests.
