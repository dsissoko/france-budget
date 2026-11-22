# Programme politique — qualification et import V2

> Référence obligatoire : [métier](../../docs/v2/metier.md), [intégration](../../docs/v2/integration.md) et [contrat CSV V2](../../db/v2/README.md). Une contribution documentaire n'est pas une validation économique ni une publication.

## Programme et sources
- Issue reliée :
- Formation et code stable :
- Année / millésime de la source :
- Périmètre exact, document principal et URL :
- Pages / extraits et provenance :
- Montants revendiqués (Md€, exercice, ponctuel/récurrent) :

## Fichiers CSV versionnés
- `budget.csv` :
- `proposals.csv` :
- `impacts.csv` :
- Données éditoriales et sources conservées :
- Justification des identifiants, sans titre comme clé :
- Regroupements transverses / exclusivité des postes :
- Incertitudes et montants non ventilables :

## Qualification comptable
- [ ] Chaque montant déclaré est distinct d'un impact calculé.
- [ ] Aucun poste citoyen n'est compté deux fois.
- [ ] Aucune ventilation inventée.
- [ ] AGGREGATE : ventilations incluses dans l'agrégat, sans addition.
- [ ] PARTIAL : seuls les impacts qualifiés sont comptabilisés.
- [ ] Contrôle des totaux, reliquats et sources.

## Import, API et documentation
- [ ] Import V2 déterministe/idempotent en Neon QA.
- [ ] Parité CSV ↔ PostgreSQL ↔ API V2 ↔ UI.
- [ ] Métier, MCD, diagrammes Mermaid et contrat API à jour si concernés.
- [ ] Aucun script de migration V1 ajouté ou réactivé.
- [ ] `npm run test:v2` / `npm run docs:check` / build.
- [ ] URL de recette, SHA, branche Neon, preuve de non-double-compte.

**Décision de fusion distincte de la publication production.**
