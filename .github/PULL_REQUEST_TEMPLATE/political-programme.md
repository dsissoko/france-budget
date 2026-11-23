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
- `measures.csv` : engagements extraits, sources et `measure_key` → `proposal_key` ;\n- `proposals.csv` : propositions consolidées uniquement ;
- `impacts.csv` :
- Données éditoriales et sources conservées :
- Justification des identifiants, sans titre comme clé :
- Regroupements transverses / exclusivité des postes :
- Incertitudes et montants non ventilables :

## Qualification comptable
- [ ] Toutes les mesures sourcées sont conservées, même sans montant.\n- [ ] Chaque mesure source appartient à une proposition unique ; aucune mesure n'est fabriquée pour un budget citoyen direct.\n- [ ] Chaque montant déclaré est distinct d'un impact calculé.
- [ ] Aucun poste citoyen n'est compté deux fois.
- [ ] Aucune ventilation inventée.
- [ ] AGGREGATE : ventilations incluses dans l'agrégat, sans addition.
- [ ] PARTIAL : seuls les impacts qualifiés sont comptabilisés.
- [ ] Contrôle des totaux, reliquats et sources.

## Import, API et documentation
- [ ] Contrat des quatre CSV validé et import V2 déterministe/idempotent en Neon QA.
- [ ] Parité CSV ↔ PostgreSQL ↔ API V2 ↔ UI.
- [ ] Métier, MCD, diagrammes Mermaid et contrat API à jour si concernés.
- [ ] Aucun script de migration V1 ajouté ou réactivé.
- [ ] `npm run test:v2` / `npm run docs:check` / build.
- [ ] URL de recette, SHA, branche Neon, preuve de non-double-compte.

**Décision de fusion distincte de la publication production.**
