---
name: budget-impact-qualification
description: Étape agentique de qualification d'impacts comptables pour les programmes politiques et citoyens de Mon Budget Citoyen V2. À employer lorsque des propositions sourcées doivent être ventilées vers le pivot citoyen sans inventer de montants ni doubler les agrégats.
---

# Qualification agentique des impacts budgétaires

## Périmètre STRICT de l'agent

Le pipeline global **est déterministe**. Ce skill intervient uniquement après extraction et normalisation des propositions, avant validation/import. L'agent **propose** des écritures budgétaires et justifie leur classification. Le code déterministe contrôle les propositions, génère les fichiers finaux approuvés, importe et calcule ; l'agent ne modifie jamais la logique du moteur, la base ni les droits de publication.

```text
PDF / sources -> extraction + CSV proposals (déterministe)
              -> QUALIFICATION AGENTIQUE (ce skill)
              -> revue des écritures proposées
              -> validation mécanique des CSV (déterministe)
              -> import v2 (déterministe)
              -> moteur existant (déterministe)
              -> UI V2 (déterministe)
```

## Préparation obligatoire

Lire, dans cet ordre :
1. `AGENTS.md` et `docs/v2-qualification-pipeline.md`.
2. `data/programmes/<parti>/<année>/budget.csv`, `proposals.csv`, `impacts.csv`.
3. `db/v2/001_schema.sql`, `scripts/v2/import.mjs` et le référentiel `v2.reference_posts` pour le millésime retenu.
4. Les documents PRIMAIRES exacts cités dans `source_url`, avec page/section, et la documentation de qualification antérieure si elle existe. Ne pas changer de millésime ni compléter une source inaccessible de mémoire.

L'agent ne déduit **aucun montant** d'un intitulé seul et ne prétend pas disposer des effets macroéconomiques d'une politique à partir de son coût annoncé.

## Pour CHAQUE proposition (même celles non qualifiées)

Produire une décision structurée dans un **registre de travail** séparé (ex. `qualification-review.csv`, jamais importé directement) :
- `budget_key,proposal_key,source_year,source_url,source_section`.
- `claimed_amount_bn` et `direction` tels que sourcés ; distinguer coût, produit et variation, ainsi que montant annuel vs pluriannuel.
- `classification_status` : `direct_candidate`, `split_required`, `overlap_risk`, `year_uncertain`, `out_of_scope`, `insufficient_evidence`.
- `side,category_id,delta_amount_bn` proposés ou vides ; **plusieurs lignes pour une mesure sont permises**, ainsi que plusieurs mesures sur un même poste.
- `reason` précis et falsifiable : pourquoi ce poste, pourquoi ce signe, pourquoi ce montant, et quelles limites de périmètre.
- `overlap_with` : autres identifiants de propositions, agrégats ou imputations susceptibles de double compte.
- `evidence_location` (document + page) et `uncertainty` ; une confiance subjective ne remplace jamais une preuve.

**Aucune écriture** si l'année, le poste, la part attribuable ou la nature APU ne sont pas suffisamment établis. En cas de ventilation multi-postes, fournir des parts prouvées ; sinon marquer `split_required` et laisser les impacts vides.

## Règles de raisonnement comptable

1. **Sens comptable** : recette positive -> `revenues` avec delta positif ; dépense supplémentaire -> `expenses` avec delta positif. Pour une suppression, delta négatif. Les manques à gagner `offBudget` n'utilisent pas le même signe que la recette correspondante : respecter la règle de compensation existante dans `src/projection-core.ts`.
2. **Périmètre** : administrations publiques (APU S.13), référence V2 définie, non « budget de l'État » uniquement. Une mesure sur une banque publique ou un effet macro n'est pas automatiquement une dépense APU.
3. **Additionnalité** : vérifier les lignes sources déjà incluses dans d'autres mesures, enveloppes et totaux. Les mesures multi-postes se répartissent ; elles ne se dupliquent jamais en totalité sur plusieurs catégories.
4. **Millésime** : ne jamais cumuler mécaniquement les mesures LFI 2026 et LFI 2027. Une mesure annuelle 2027 doit effectivement viser 2027.
5. **AGGREGATE** : conserver les agrégats `documentary.aggregates` comme **seule base des résultats globaux revendiqués**. Les impacts individuels décrivent la ventilation possible, **ne s'ajoutent pas** aux agrégats dans le moteur. Prévoir une réconciliation séparée, avec résidu explicitement nommé.
6. **PARTIAL** : seuls les impacts validés modifient les postes citoyens. Un montant `claimed_amount_bn` non ventilé **n'est pas** automatiquement un impact.
7. **Traçabilité** : ne jamais valoriser un code `category_id`, un `source_status` « validé » ou un montant par simple analogie ou faute de mieux ; ne jamais supprimer une proposition simplement parce qu'elle n'est pas ventilable.

## Regroupements citoyens issus de la PR #145 (contrat V2)

La qualification amont peut produire, en complément du triplet CSV canonique, les fichiers **versionnés et contrôlables** suivants dans le même dossier programme :

- `presentation.csv` : titre et description publique du budget ; aucune URL brute dans la description.
- `groupes-citoyens.csv` : groupes pédagogiques et réservation des postes citoyens, ainsi que les identifiants des mesures sources.
- `rattachements-citoyens.csv` : relation explicite entre chaque proposition source et son groupe, avec page et justification.
- `impacts-citoyens.csv` : un enregistrement par poste réservé, son statut, le montant attribuable ou vide, la justification et `simulation_applied`.

**Ces CSV ne remplacent pas** `budget.csv`, `proposals.csv`, `impacts.csv`. Le triplet reste le contrat commun des citoyens et des partis ; les quatre fichiers supplémentaires apportent le détail documentaire et les ventilations **internes** d'un AGGREGATE. L'importeur `scripts/v2/import.mjs` les joint en `v2.budgets.documentary.citizenGroups` et `claimedAllocations`, avec contrôle des identifiants, de l'exhaustivité et de la non-duplication.

### Règle de regroupement transitive

Construire un graphe biparti entre les mesures sources et les postes citoyens retenus par l'analyse. Les groupes correspondent aux **composantes connexes** de ce graphe, y compris lorsque le lien passe par plusieurs mesures :

- A concerne Éducation et Santé, B concerne Santé, C concerne Retraites : groupes {A,B} et {C}.
- Si B concerne également Retraites, les trois propositions A, B, C sont **un seul groupe**.
- Une mesure sans poste fiable reste visible comme documentaire ; elle n'autorise pas à inventer un impact.
- Pour un budget, un poste ne peut appartenir à deux groupes, même si les thèmes sont distincts. Ne jamais recréer une ligne source en raison de son caractère multi-postes.
- Les identifiants sont stables ; un groupe doit conserver la liste exacte des propositions sources.

La classification initiale des liens est agentique et argumentée. **Le calcul des composantes connexes, le contrôle des exclusivités et l'import sont déterministes.** Les titres, thèmes, et orientations partisanes ne servent jamais de clés de regroupement.

### Activation financière

Pour les budgets `AGGREGATE`, `simulation_applied=true` signifie que le montant documenté peut être **ventilé à l'intérieur** de la masse annoncée, sans augmenter le total. La différence entre la masse annoncée et les ventilations justifiées reste dans les postes de rapprochement (reliquat), pas attribuée arbitrairement.

Pour les budgets `PARTIAL`, seules les lignes de `impacts.csv` approuvées constituent des variations calculées. Le montant revendiqué d'une proposition n'est jamais une preuve d'impact.

L'exemple LFI 2027 porte **28 mesures sources → 11 groupes → 15 postes réservés, dont 11 allocations**, pour +106,4 Md€ de recettes et +81,7 Md€ de dépenses. Les 84,4 Md€ et 37,7 Md€ ventilés laissent des reliquats de +22 Md€ et +44 Md€ sans modification du solde +24,7 Md€. Ces invariants sont vérifiés par `scripts/v2/grouping.node-test.mjs`.

### Contraintes éditoriales et preuve

Chercher les limites réellement imposées par l'UI, l'API et Neon. Si aucune longueur maximale n'existe, adopter une cible éditoriale justifiée plutôt que créer une fausse contrainte métier. Tout impact doit indiquer sa source, l'année, le poste, le sens, l'unité, les incertitudes et son statut. **Une proposition sourcée reste visible même sans impact activé.**

Références : [métier V2](../../docs/v2/metier.md), [MCD](../../docs/v2/mcd.md), [intégration](../../docs/v2/integration.md) et [contrat API](../../docs/v2/api.md).

## Sorties attendues

- **Registre de qualification** exhaustif, incluant aussi les décisions de non-imputation et leurs raisons, avec identifiants stables et preuves.
- **Proposition de patch** sur `proposals.csv` : descriptions compréhensibles, provenance et statut correctement établis.
- **Proposition de patch** sur `impacts.csv` : uniquement les décisions d'imputation approuvées **et regroupées mécaniquement par poste**, chaque ligne `budget_key,proposal_key,side,category_id,delta_amount_bn` ; conserver 3 décimales et le signe. Le groupe est une proposition technique distincte, pas une nouvelle mesure annoncée.
- **Rapport de réconciliation** : nombre de mesures, nombre de mesures imputées, nombre d'écritures, sommes recettes/dépenses proposées, couverture, résidus, risques d'additionnalité, divergences avec les agrégats et raisons des blocages.
- **Aucun import et aucune déclaration de conformité INSEE/Eurostat**. Le mapping vers des formats normalisés appartient à l'issue #143 et ne peut être inféré du seul pivot citoyen.

## Critères d'arrêt / escalade

Arrêter le lot si source principale manquante, décalage d'année, contradiction comptable, montant non additif, ventilation sans preuve, catégorie inexistante, ou calcul du moteur différent du scénario approuvé. Signaler exactement les propositions en cause ; ne jamais « compléter » à 100 % par estimation.

**Décision d'architecture : consolidation déterministe par poste, sans changer la contrainte d'unicité.** Lorsque plusieurs mesures qualifiées concernent le même `side/category_id`, conserver chaque mesure source, ses preuves et son montant dans `proposals.csv` ; produire une proposition technique `pivot-<side>-<category_id>` dont `source_origin=pivot_consolidation`, `notes=members=<sourceKey>:<montant>|...` et `description` détaille le rapprochement ; une seule écriture consolidée apparaît dans `impacts.csv` pour ce poste. Les mesures constitutives sont marquées `source_status=grouped_into_pivot` pour éviter leur double comptage dans les cartes UI, mais demeurent traçables en sous-lignes du groupe. La somme des contributions doit être strictement égale à la ligne consolidée ; interdire toute référence orpheline, catégorie divergente ou inclusion non validée. Ce regroupement est **déterministe après qualification agentique**, pas une nouvelle décision de l'agent et ne demande aucune modification de schéma.

## Exemple LFI 2027 — décisions préexistantes

Les données existantes contiennent 28 propositions chiffrées (14 recettes, 14 dépenses), 6 imputations déjà documentées et un agrégat revendiqué de +106,4 Md€ de recettes / +81,7 Md€ de dépenses (solde +24,7 Md€). Ce total n'est pas une validation indépendante des effets.

| Proposition | Écriture candidate étayée | Remarque |
| --- | --- | --- |
| `src-4` CVAE +3 | `revenues/business/+3.000` | effet direct revendiqué |
| `src-19` enseignants +0,5 | composante `expenses/education/+0.500` | conservée comme source du groupe |
| `src-21` places universitaires +3,5 | composante `expenses/education/+3.500` | conservée comme source du groupe |
| `pivot-expenses-education` | **`expenses/education/+4.000`** | seule écriture persistée pour ce poste ; les deux composantes restent visibles |
| `src-22` hôpitaux +3 | `expenses/health/+3.000` | effets indirects exclus |
| `src-27` retraites +9 | `expenses/social/+9.000` | effets cotisations exclus |
| `src-28` chômage +3 | `expenses/unemployment/+3.000` | vérifier conditions millésimées |

Le reste doit faire l'objet d'une qualification ligne par ligne ; **28 mesures sourcées ≠ 28 impacts comptables validés**.

## Commandes de contrôle (lecture seule par défaut)

```bash
node scripts/v2/import.mjs data/programmes/lfi/2027
npm run test:v2
npm run check
npm test
npm run build
```

L'option `--apply` est **interdite par défaut** : exiger une autorisation explicite, vérifier `V2_DATABASE_URL` = Neon QA et effectuer une comparaison SQL post-import avant toute Preview. Aucune écriture V1.
