# Contribution au moteur et aux données économiques V2

> Les simulations sont pédagogiques, pas des prévisions certifiées. Référence : [règles métier V2](../../docs/v2/metier.md), [architecture](../../docs/v2/architecture.md), [MCD](../../docs/v2/mcd.md).

## Objectif et traçabilité
- Issue / périmètre et niveau (comptable, trajectoire, macroéconomie) :
- Question traitée et résultat attendu :

## Méthodes et sources
- Équations, paramètres, unités et années :
- Sources institutionnelles ou académiques, datées :
- Hypothèses, incertitudes, analyse de sensibilité :

## Contrats V2 affectés
- Tables `v2.*` / migrations / schéma de données :
- API `/api/v2/*` et changement de payload :
- Impacts sur la distinction `claimed_amount_bn` / `delta_amount_bn` :
- Risque de double compte AGGREGATE et traitement des reliquats :
- Documentation / Mermaid / ADR mis à jour :

## Recette
- [ ] `npm run check`
- [ ] `npm test`
- [ ] `npm run test:v2`
- [ ] `npm run docs:check`
- [ ] `npm run build`
- [ ] Parité NoPasaran et programmes PARTIAL / AGGREGATE
- [ ] Tests navigateur si visible

**Aucune fusion ou publication automatique :** préciser la branche Neon et la stratégie de rollback.
