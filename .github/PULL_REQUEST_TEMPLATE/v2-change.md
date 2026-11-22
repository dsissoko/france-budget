## Objectif métier, périmètre et issues
<!-- Préciser Refs #NN ou Closes #NN uniquement si le besoin est totalement traité. -->

## Composants concernés
- [ ] Règle métier / moteur
- [ ] Données / CSV / qualification
- [ ] API / schéma V2
- [ ] UI / accessibilité
- [ ] Documentation / exploitation

## Invariants V2
- [ ] Modèle commun Budget → Proposition → Impact, origines distinctes
- [ ] Montant annoncé différent de l'impact calculé
- [ ] AGGREGATE : aucune addition double ; allocations et reliquats documentés
- [ ] Sources primaires traçables ; CSV validés et réimport idempotent
- [ ] Pas de modification involontaire de `public` ni des contributions post-cutover
- [ ] README, MCD Mermaid, contrats API et docs/v2 alignés si impactés

## Tests et recette
- [ ] `npm run check`
- [ ] `npm test`
- [ ] `npm run test:v2`
- [ ] `npm run audit:editorial:v2`
- [ ] `npm run build`
- [ ] Preview GitHub / Vercel + branche Neon QA testées
- [ ] E2E : créer, publier, voter, partager, comparer, mobile
- [ ] NoPasaran 8/8 ; LFI 28/11 et allocations sans double compte (si concernés)

**Commit SHA / URL preview / branche Neon / dataset CSV :**

## Livraison
**Migration appliquée :** Non / QA / Production (détailler).

**Rollback et impact sur les écritures V2 :**

**Garde-fou :** CI verte ≠ autorisation de merge ni de publication. Une validation explicite est nécessaire.
