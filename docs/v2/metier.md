# Domaine métier V2

## Mission

Rendre compréhensibles les recettes, les dépenses et le solde des administrations publiques françaises, permettre aux citoyens de composer des scénarios et de comparer les engagements politiques. Les simulations sont **pédagogiques**, pas des prévisions macroéconomiques ni une certification des politiques.

## Glossaire

| Concept | Définition |
|---|---|
| Budget | Scénario versionné, d'origine `citizen`, `party` ou `educational` |
| Proposition | Engagement documenté ou choix citoyen, rattaché à un budget |
| Montant revendiqué | Chiffre annoncé par une source ; sans portée comptable automatique |
| Impact | Variation signée, validée et exclusive d'un poste de référence |
| Poste | Catégorie de recettes, dépenses ou hors budget ; pivot commun de 27 postes |
| AGGREGATE | Deux masses financières annoncées, dont les mesures détaillées font partie |
| PARTIAL | Programme partiellement chiffré ; seules les écritures qualifiées peuvent modifier la référence |
| Reliquat | Fraction d'un agrégat sans ventilation défendable ; n'est pas répartie arbitrairement |
| Vote | Soutien anonyme, non représentatif, dédupliqué par cookie |

## Invariants de gestion

**RG-01 — Source et écriture séparées.** `claimed_amount_bn` (revendication) ne vaut pas `delta_amount_bn` (impact calculé).

**RG-02 — Aucun double comptage.** Pour AGGREGATE, les propositions ne doivent pas être ajoutées une seconde fois aux masses annoncées. Les allocations justifiées sont des **ventilations internes** ; le reste demeure un reliquat.

**RG-03 — Exclusivité des postes.** Une combinaison budget/côté/poste ne reçoit qu'un impact actif. Si plusieurs mesures sources touchent les mêmes postes, les regroupements documentaires doivent être explicitement consolidés.

**RG-04 — Pas d'invention.** Une mesure multi-postes sans ventilation démontrable peut être affichée mais ne crée pas d'affectation comptable.

**RG-05 — Provenance.** Conserver année, source primaire, statut, réserves et, quand disponibles, page et extrait. `validated` n'est pas équivalent à `primary_source_checked_apu_review_pending`.

**RG-06 — Modèle commun.** Partis et citoyens utilisent Budget → Proposition → Impact. L'origine contrôle les opérations autorisées, pas la structure de données.

**RG-07 — Publication.** Brouillon modifiable avec jeton et révision ; publication définitive ; retrait logique. Les contributions réalisées après le passage en V2 ne sont jamais supprimées par réimport de CSV.

**RG-08 — Projection.** Trajectoire mécanique jusqu'en 2032, toujours assortie de limites d'interprétation.

## Jeux de référence

**NoPasaran** : 8 propositions, 8 impacts, depuis [les CSV versionnés](../../data/programmes/nopasaran/2025/). Les anciens budgets citoyens V1 et leurs votes ont été déclarés jetables.

**LFI 2027 (recette #145)** : 28 mesures sources → 11 regroupements → 15 lignes de postes, dont 11 allocations activées. Recettes annoncées +106,4 Md€, dépenses +81,7 Md€, solde +24,7 Md€. Ventilation connue : +84,4 Md€ de recettes et +37,7 Md€ de dépenses. Reliquats : +22 et +44 Md€. **Ces données ne sont pas encore considérées comme intégrées à l'API V2.**
