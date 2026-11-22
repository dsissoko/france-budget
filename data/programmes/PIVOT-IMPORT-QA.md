# Format pivot CSV commun — partis et citoyens

Le pivot est **NoPasaran**, pas une ventilation INSEE. Pour chaque programme : `budget.csv`, `proposals.csv`, `impacts.csv` (vide pour les partis dont les impacts ne sont pas qualifiés). Un montant revendiqué **n'est pas** un impact comptable.

| Programme | Lignes historiques | Propositions pivot |
|---|---:|---:|
| eco/2027 | 4 | 4 |
| eqx/2027 | 14 | 14 |
| hor/2027 | 2 | 2 |
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
| **Total** | **287** | **287** |

Les 2 anciennes illustrations Horizons sont exclues des CSV actifs, mais demeurent dans les archives `mesures.csv` d'origine. Tous les statuts non vérifiés sont conservés, **sans requalification**. Les programmes sans mesures ont des fichiers avec en-têtes uniquement. Les AGGREGATE gardent leurs propositions documentaires : aucun calcul de double comptage.

## Mappage
- `measure_id` → `proposal_key`, `impact_description` → `description`, `claimed_amount_bn` → `claimed_amount_bn`.
- `source_url`, `source_section`, `source_status`, `origin`, `notes`, `direction` sont archivés dans des colonnes universelles de `proposals.csv` ; `theme_id` est abandonné.
- `apu_entries_json` **non converti** en `impacts` : aucune ventilation INSEE ne fait partie de ce test.
- Le `reference_year=2025` est le référentiel de calcul existant, alors que `source_year` indique l'année du programme.

## Limite actuelle de Neon
La table existante `budget_proposals` ne stocke que `client_id`, `title`, `description` parmi ces colonnes. Le stockage fidèle de `claimed_amount_bn` et des sources nécessite **des colonnes communes supplémentaires**, sans structure citoyen/parti distincte. La migration SQL de production reste bloquée ; cet ensemble est un **prototype de CSV**, aucune source historique n'est effacée. Aucun script d'import de production modifié, aucune UI touchée.
