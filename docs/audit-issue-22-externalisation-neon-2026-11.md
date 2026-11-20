# Issue #22 — État réel de l'externalisation comptable dans Neon

> **Audit de lecture seule — 20 novembre 2026.** Ne pas confondre schéma créé, données présentes et moteur effectivement alimenté à partir de Neon.

## Ce qui existe déjà

- Tables Neon disponibles : `reference_categories`, `reference_off_budget`, `measures`, `measure_accounting_entries`, `party_proposals`, `party_source_lines`, `proposal_accounting_measures`, `source_accounting_links`.
- `GET /api/reference` lit en base les catégories, mesures et écritures `measure_accounting_entries`, avec un contrôle strict des propositions politiques documentaires nouvelles ; les mesures historiques ont une voie compatible.
- Contrôles SQL directs : **17 enregistrements** dans `measures` dont **7 legacy**, **6 écritures** dans `measure_accounting_entries` pour **5 mesures** ; **0 liaison** dans `source_accounting_links` et **0** dans `proposal_accounting_measures`. Ces zéros reflètent la non-validation documentaire, pas un défaut à contourner.
- Le moteur comptable commun est déjà isolé dans `src/engine/accounting.ts`, le contrat `sourcedEntries` est facultatif ; le déploiement actuel est volontairement compatible avec les budgets citoyens.

## Ce qui empêche réellement de clôturer #22

1. `src/projection.ts` importe encore les données de `src/data.ts` et contient un dictionnaire de règles `rules` codé dans TypeScript, comportant notamment des règles spécifiques historiques.
2. L'exécution réelle de `calculateScenario` ne dépend pas **exclusivement** des écritures normalisées de Neon ; elle traite les règles historiques et des valeurs/fixtures locales.
3. Absence de référence stable et versionnée de toutes les hypothèses et règles utilisées pour reproduire fidèlement les budgets déjà publiés.
4. `source_accounting_links` et `proposal_accounting_measures` sont vides : toute proposition documentaire non validée doit demeurer hors calcul, pas être « remplie » artificiellement pour débloquer une étape.
5. Le contrat d'API et les tests de parité RN/LFI/citoyens/INSEE doivent garantir une **équivalence exacte des montants V1** avant bascule.
6. Le contrôle documentaire LFI 2027 est un chantier distinct : [inventaire provisoire](../data/programmes/lfi-2027-revue-documentaire.md) ; ne pas exiger sa publication pour achever la migration technique de #22.

## Découpage minimal pour clôturer sans sur-ingénierie

- **A — Contrat stable :** définir en SQL et TypeScript le modèle `MeasureAccountingEntry` compatible avec les écritures `measure_accounting_entries`, avec version, année, source, sens, poste, montant et motif d'exclusion ; maintenir un chemin explicite de compatibilité tant que le référentiel V1 n'est pas migré.
- **B — Migration sans perte :** créer les écritures des **mesures historiques publiées et réellement calculables** à partir de leurs règles actuelles, avec **revue et preuve de parité**, sur branche Neon de test ; ne pas importer les totaux revendiqués en tant qu'écritures.
- **C — API et moteur :** faire consommer les écritures normalisées par les deux parcours politiques et citoyens, sans changer le modèle UI. Versionner les paramètres avec leur provenance.
- **D — Tests :** figer des fixtures de calcul avant migration, couvrir les catégories de référence, les scénarios RN/LFI historiques, les budgets citoyens publiés et les opérations atypiques ; refuser les groupes non validés.
- **E — Bascule contrôlée :** CI `check`/`test`/`build`, tests Neon en environnement isolé, comparaison des résultats, PR, **fusion distincte de la release Vercel**.

## Critères de clôture proposés

- [ ] Aucune nouvelle mesure calculable ne nécessite de modifier le dictionnaire TypeScript de règles.
- [ ] Les écritures de toutes les mesures historiques calculables sont versionnées en base et leur provenance est documentée.
- [ ] Aucun scénario citoyen ou politique historique ne change de montant à données identiques.
- [ ] Les cas documentaires non validés restent visibles sans effets APU.
- [ ] CI et tests de parité réussis ; plan de migration réversible documenté.

**Statut de #22 : travail d'architecture déjà largement entamé, mais finalisation non démontrée. Ne pas clôturer cette Issue avant les tests et la bascule.**
