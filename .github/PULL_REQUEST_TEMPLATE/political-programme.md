# Proposition de budget politique — contribution sourcée

> Cette PR ajoute ou corrige un **document**, une **proposition regroupée** ou une **écriture budgétaire**. Une contribution ne vaut ni reconnaissance officielle du contributeur, ni validation économique, ni publication automatique. Référence : [schéma Neon](../../docs/schema.md) et [méthode](../../docs/methode.md).

## 1. Identité et millésime (identifiants stables)

- **Code de formation** (`political_parties.code`, par ex. `RN`, `LFI`) :
- **Année du document source** (`source_year`) :
- **Identifiant de groupe** (`party_proposals.group_id`, conserver l'existant si correction) :
- **Identifiants de lignes documentaires** (`source_row` ou liste des lignes concernées) :
- **Type de contribution** : ajout / correction source / regroupement / affectation APU / retrait motivé :
- Issue liée :

Les titres et libellés sont uniquement **des données d'affichage**, jamais des clés ni des conditions de calcul. Ne pas modifier les identifiants existants pour une simple correction de titre.

## 2. Sources primaires et fidélité documentaire

| Identifiant source | Document officiel, URL et page | Publication / année | Base de comparaison | Revendication (Md€) | Sens |
| --- | --- | --- | --- | ---: | --- |
| | | | | | `revenue_increase` / `revenue_decrease` / `expense_increase` / `expense_decrease` |

- Décrire si la contribution couvre **tout un programme** ou seulement un **extrait** :
- Montant **annuel / ponctuel / pluriannuel**, horizon et année d'application :
- Chiffrages officiels, estimations indépendantes et montants non chiffrés clairement séparés :
- Risques de sous-totaux déjà inclus, recouvrements ou doubles comptes :

## 3. Proposition regroupée (présentation seulement)

- Groupe existant / nouveau :
- Nombre de lignes sources du groupe :
- Vérification que **chaque ligne appartient à un seul groupe** :
- Libellé public proposé (compréhensible, sans modifier la clé) :
- **Attention** : le total d'un groupe n'est jamais une écriture supplémentaire dans le déficit.

## 4. Décision APU manuelle et écritures détaillées

Pour chaque ligne source, choisir **un statut documenté** :
- `calculate` : effet **direct** APU justifiable, écrire les ventilations ci-dessous ;
- `non_chiffrable_apu` : effet exclu du calcul, préciser le motif (transfert interne APU, effet indirect, assiette inconnue, etc.) ;
- `review_pending` : ne pas intégrer au moteur ou aux budgets publics.

| Ligne source stable | Décision APU | `side` (`revenues`/`expenses`) | `category_id` existant | Montant signé (Md€) | Source et justification |
| --- | --- | --- | --- | ---: | --- |
| | | | | | |

- Sommes des écritures recettes et dépenses **réconciliées** avec les variations directes validées :
- Éléments `non_chiffrable_apu` et justifications :
- Cas d'interactions, allocations multiples, doublons neutralisés :
- **Ne pas confondre** montants revendiqués par rapport au PLF/PLFSS du parti et impact simulé sur les APU 2025.
- Ne pas créer de catégorie budgétaire ou changer les 25 existantes (dont les deux « Autres et ajustement ») sans décision dédiée.

## 5. Modèle et migration

- Tables concernées : `political_parties`, `party_proposals`, `party_source_lines`, `budgets`, `measures`, `measure_accounting_entries` :
- Identifiants et FK ajoutés ou modifiés :
- Index nécessaires, avec requête `EXPLAIN` si ajout :
- Migration SQL versionnée et reproductible (pas de mutation de production depuis la PR seule) :
- Compatibilité avec les scénarios citoyens et votes, et stratégie de retour arrière :
- Documentation mise à jour : `docs/schema.md`, `docs/architecture.md` et/ou `docs/projections.md` :

## 6. Maturité du budget complet et confirmation officielle

- **Budget concerné** (`budgets.id`, UUID stable) :
- **Statut actuel** : `en_preparation` / `complet` / `a_confirmer` / `confirme`
- **Statut proposé** :
- **Périmètre couvert** (programme complet ou extrait explicitement nommé) :
- **Justification du changement de maturité** :
- **Confirmation demandée au parti** (date, canal, interlocuteur déclaré, sans publier de coordonnées privées) :
- **Si « Confirmé »** : organisation, date et URL HTTPS d'une preuve explicite de confirmation de la fidélité documentaire :
- **Limites connues** : mesures non chiffrables, postes incomplets, hypothèses et divergences :

> « À confirmer » signifie **prêt à soumettre**, et non « demande envoyée ». « Confirmé » signifie que la **fidélité documentaire** du budget a reçu une confirmation traçable de la formation concernée. Aucun de ces statuts ne certifie la viabilité économique. Le statut est générique en base mais son affichage est limité aux budgets politiques dans cette première version.

## 7. Vérifications avant fusion

- [ ] Codes/UUID/identifiants stables ; aucun titre utilisé comme clé
- [ ] Source primaire datée et pages vérifiées, couverture déclarée (complète ou partielle)
- [ ] Aucune attribution fictive au parti ; année et périmètre explicités
- [ ] Aucun double compte entre groupes, sous-totaux et lignes sources
- [ ] Chaque écriture calculée référence une catégorie APU existante, du bon côté, avec montant signé
- [ ] Sommes des écritures et variations directes validées concordantes ; aucun calcul partiel silencieux
- [ ] Lignes non chiffrables ou non revues exclues du calcul, avec justification
- [ ] Les budgets citoyens, votes et les deux catégories « Autres » restent compatibles
- [ ] Documentation technique et migrations synchronisées
- [ ] CI GitHub réussie : `npm run check`, `npm test`, `npm run build`
- [ ] Aucun secret, empreinte de vote ou donnée privée joint à la PR

## 8. Validation et publication

- **Revue documentaire** (fidélité à la source) :
- **Revue comptable APU** (ventilations et doubles comptes) :
- **État de publication** : préparation / validé / activé dans l'API / vérifié en production :
- **Limites et éléments encore en attente** :

La fusion de cette PR **n'active pas automatiquement** une proposition dans l'API ni ne signifie que le déploiement Vercel est terminé.
