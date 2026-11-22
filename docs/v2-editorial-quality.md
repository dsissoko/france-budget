# Relecture éditoriale des propositions V2

Les champs `title` et `description` de `proposals.csv` sont **les textes définitifs affichés tels quels dans l'UI**. Ils doivent être compréhensibles par une personne **non initiée** aux finances publiques. Aucune transformation ou rédaction automatique à l'import, en SQL ou à la lecture des API.

**Règles de contrôle proposées :**
- Titre court et explicite (alerte au-delà de 100 caractères).
- Description accessible et concise (alerte au-delà de 360 caractères) : action envisagée, montant, principaux postes impactés si ventilation préqualifiée.
- Si une proposition a des impacts, leur justification intelligible figure dans sa description ; la preuve détaillée est conservée dans les sources et métadonnées (`notes`, `source_section`, `source_url`).
- Montants revendiqués ≠ impacts sur le budget citoyen ; aucun delta n'est inventé.
- Une proposition sans description reste **à revoir éditorialement**, mais n'est jamais complétée par une phrase fabriquée à partir du titre.
- Une phrase sous le seuil n'est pas nécessairement compréhensible : relecture humaine obligatoire avant publication.

**Commande** : `node scripts/v2/audit-editorial.mjs --output=editorial-report.json`.
Le rapport est un **audit sans écriture** dans les CSV ou en base. Les seuils sont des alertes, pas une troncature du contenu.

Le rapport de qualité doit accompagner la recette et empêcher de qualifier un budget d'entièrement prêt si ses propositions à publier ont encore des descriptions vides, difficiles à comprendre ou des ventilations insuffisamment expliquées.
