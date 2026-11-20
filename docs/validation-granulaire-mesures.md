# Validation granulaire des propositions politiques

## Problème
Le contrat de `GET /api/reference` imposait la validation de **toutes les lignes du groupe** avant l'activation d'une seule mesure. Cela rendait l'intégration de catalogues politiques (LFI 2026 : 143 lignes / 8 groupes ; LFI 2027 : 28 lignes / 9 groupes) artificiellement coûteuse.

## Règle universelle
Une mesure non historique est admissible si et seulement si :
1. elle appartient à un budget du bon parti ;
2. son `reference_year` est identique au `source_year` de ses rattachements ;
3. elle possède au moins une ligne source liée ;
4. **toutes ses lignes liées** sont marquées `validation_status='validated'` et `apu_decision='calculate'` ;
5. le contrôle déjà en place sur les écritures APU, les catégories et les sommes est satisfait.

Les **autres lignes** du même groupe peuvent rester `review_pending` et hors calcul. Les clés composites/FK/PK existantes empêchent le rattachement à un autre parti, groupe ou double comptage d'une même ligne dans plusieurs mesures.

## Sécurité
- Aucun passage automatique de `review_pending` vers `validated` ;
- aucune création de mesure / écriture APU fictive ;
- les mesures historiques `legacy_id` conservent leur parcours existant ;
- la validation reste `fail closed` sur une mesure mal documentée ou une écriture incohérente.

## Pipeline de référence
**Source officielle → lignes documentaires → revue individuelle → mappage APU explicite → mesure calculable → scénario**, sans règle par parti.

Le fonctionnement des écrans peut ensuite consommer les propositions non calculables indépendamment via `/api/budgets` et les mesures calculables via `/api/reference`.
