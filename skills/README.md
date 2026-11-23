# Skills — pipeline d'intégration V2

Le [skill de qualification budgétaire](budget-impact-qualification/SKILL.md) couvre les trois décisions **agentiques** : extraire des **mesures** sourcées, les regrouper en **propositions** consolidées et proposer des **impacts** documentés. Les contrôles des clés, contraintes d'unicité et opérations d'import restent déterministes.

Contrat partagé des citoyens et partis : `budget.csv`, `measures.csv`, `proposals.csv`, `impacts.csv`. Les propositions citoyennes directes peuvent ne comporter aucune mesure source.

Exemple de demande : « À partir des sources primaires LFI 2027 et des 27 postes citoyens, recense les mesures avec leurs chiffrages, constitue les propositions regroupées sans double comptage, justifie les impacts ventilables et prépare un patch des quatre CSV pour revue. Ne modifie ni la base, ni le moteur de simulation. »

Documentation : [chaîne V2](../docs/v2-qualification-pipeline.md) et [glossaire canonique](../docs/v2/metier.md).
