# Format pivot CSV commun — partis et citoyens

Le pivot est **NoPasaran**, pas une ventilation INSEE. Pour chaque programme : `budget.csv`, `proposals.csv`, `impacts.csv` (vide tant qu'aucun impact sur les postes du budget de référence citoyen n'est établi). Un montant revendiqué **n'est pas** un impact comptable.

| Programme | Lignes historiques | Propositions pivot |
|---|---:|---:|
| eco/2027 | 4 | 4 |
| eqx/2027 | 14 | 14 |
| hor/2027 | 2 | 0 |
| lfi/2026 | 145 | 145 |
| lfi/2027 | 34 | 34 |
| lr/2026 | 10 | 10 |
| modem/2027 | 0 | 0 |
| ne/2027 | 0 | 0 |
| pcf/2026 | 0 | 0 |
| pp/2026 | 0 | 0 |
| ps/2027 | 0 | 0 |
| rec/2027 | 0 | 0 |
| ren/2027 | 0 | 0 |
| rn/2026 | 78 | 78 |
| upr/2027 | 0 | 0 |
| **Total** | **287** | **285** |

Les 2 anciennes illustrations Horizons sont exclues du jeu actif, conservées en CSV historiques. Les statuts de qualification originaux sont conservés sans requalification. Les programmes sans proposition ont des fichiers avec en-têtes seulement.

- `measure_id` → `proposal_key`, `impact_description` → `description`, `claimed_amount_bn` inchangé, toutes les métadonnées documentaires en colonnes de `proposals.csv`.
- `theme_id` abandonné. `apu_entries_json` ignoré dans cet import : **aucune ventilation INSEE**. Les archives historiques restent inchangées.
- `reference_year=2025` : référentiel comptable de l'application. `source_year` : année du programme.

Le stockage complet de `claimed_amount_bn` et des métadonnées exige des **colonnes communes supplémentaires dans `budget_proposals`**. Ces colonnes ont été ajoutées seulement à la branche QA Neon `br-gentle-hill-b9gmz04u`, sans aucun effet sur la production. L'import SQL expérimental et ses résultats doivent être vérifiés séparément. Aucun code UI modifié.

## Recette Neon QA réalisée (22/11/2026)

- Base : branche isolée `qa-nopasaran-unified-import-20261122` (`br-gentle-hill-b9gmz04u`), **jamais la production**.
- Ajustement additif **sur QA uniquement** de `budget_proposals` : `claimed_amount_bn`, `source_url`, `source_year`, `source_status`, `direction`, `amount_unit`, `source_section`, `source_origin`, `notes`. Ces champs sont **communs** aux citoyens et partis ; aucune table spécifique.
- Import depuis les `budget.csv` et `proposals.csv` de cette branche GitHub, via `INSERT ... ON CONFLICT` ; budgets de QA en visibilité `hidden`. Aucun script de production modifié.
- **15 budgets QA**, **285 propositions**, dont **283 montants revendiqués**, **285 sources URL**, **285 statuts de qualification**, **0 titre vide**, **0 impact comptable inventé**.
- Par programme : ECO 4 ; EQX 14 ; HOR 0 (2 anciennes illustrations exclues) ; LFI 2026 145 ; LFI 2027 34 ; LR 10 ; RN 78 ; autres programmes 0.
- Un premier export avait produit des lignes sans titres/identifiants : **corrigé et contrôlé avant l'import réussi**.
- Les `source_status` initiaux demeurent inchangés, sans promotion artificielle en données validées. Les propositions AGGREGATE ne sont pas additionnées aux résultats.
- **À industrialiser** : importeur CSV partagé, transactions, tests automatiques d'idempotence, résolution stable de `budget_key`, stratégie de publication/versioning. La recette ne prouve pas encore l'affichage via l'API existante, qui lit l'ancien modèle.

**Limite de périmètre** : le rattachement aux postes du budget citoyen est effectué en amont, lors de l'extraction et qualification des programmes. Ce chantier n'effectue aucune ventilation ; seules d'éventuelles anomalies constatées dans les CSV seront remontées.
