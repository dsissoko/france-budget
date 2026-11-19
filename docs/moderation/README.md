# Modération quotidienne — mode opératoire

**Tâche ChatGPT** : `6aff7d6264008191a78ebc3b189f0245`  
**Fréquence** : quotidienne à partir du 20 novembre 2026, vers 08:00 (Europe/Paris).  
**Application** : https://mon-budget-citoyen.vercel.app/  
**Référentiel CGU** : [conditions-generales-utilisation.md](../conditions-generales-utilisation.md).

## Périmètre

Contrôler dans Neon `calm-rain-58562193` les publications `budgets` (origin = `citizen`) et leurs entrées `measures`, en particulier les nouvelles depuis le dernier contrôle. Examiner les titres, descriptions, pseudonymes et intitulés/descriptions des mesures. Les contenus des partis préchargés ne sont pas à supprimer sur la base du même examen.

## Classification

| Niveau | Critères | Action |
|---|---|---|
| Urgent | Contenu manifestement illégal, menace, doxxing, apologie de violence ou contenu pédocriminel | Masquer en priorité, documenter le motif et orienter vers la procédure appropriée si requis |
| Abus manifeste | Spam massif, publicité sans lien budgétaire, phishing, usurpation évidente | Masquer si constat net, documenter |
| Discussion | Contenu politiquement polémique mais légal, contestation chiffrée, humour ou satire budgétaire | Ne pas retirer au seul motif du désaccord ou d'une controverse |
| À examiner | Légalité ou intention incertaine | Alerter le propriétaire et ne pas décider automatiquement |

Un modèle de langage **n'est pas un juge**. En cas de doute, privilégier la revue humaine. Les contenus illégaux urgents ne doivent pas attendre l'exécution programmée.

## Requêtes de lecture

```sql
SELECT b.id, b.title, b.description, b.published_at,
       b.scenario->>'author' AS author, b.visibility,
       jsonb_agg(jsonb_build_object('title', m.title, 'description', m.description)
                 ORDER BY m.created_at) FILTER (WHERE m.id IS NOT NULL) AS measures
FROM budgets b
LEFT JOIN measures m ON m.budget_id=b.id
WHERE b.origin='citizen'
GROUP BY b.id
ORDER BY b.published_at DESC;
```

**Ne pas supprimer physiquement** de budget : le masquage est réversible et préserve les éléments nécessaires au traitement d'un recours. N'autoriser que les cas manifestes, avec une justification individuelle traçable.

```sql
-- Exemple de masquage APRÈS revue, en remplaçant l'identifiant validé :
UPDATE budgets SET visibility='hidden'
WHERE id = '<UUID_VALIDE>' AND origin='citizen' AND visibility='public'
RETURNING id, title, visibility;
```

Les requêtes de lecture et de masquage doivent s'exécuter uniquement avec des droits appropriés. Ne jamais modifier les votes, les mesures ou les autres budgets par erreur.

## Journal de contrôle

Au minimum, noter pour chaque exécution : date, nombre de budgets examinés, identifiants examinés, nouveaux contenus, cas suspects, décisions de masquage avec règle CGU correspondante, et éléments demandant un arbitrage. Ne pas diffuser de données personnelles.

Les auteurs doivent être informés d'une décision de retrait et des voies de recours **lorsque les obligations applicables le requièrent**. Or le site n'a aujourd'hui **pas de compte utilisateur ni de canal de contact privé par budget** : la notification individuelle n'est donc pas techniquement assurée.

## Mesures de conformité complémentaires

1. Publier des mentions légales exactes (identité de l'éditeur, hébergeur, point de contact).
2. Fournir un canal de signalement et de contestation effectif, adapté aux obligations applicables (DSA).
3. Publier une information RGPD complète (notamment traitements, bases juridiques, durées, destinataires, droits).
4. Examiner la possibilité d'un journal de modération pérenne et d'une notification individuelle, en minimisant les données personnelles.
5. Pour les opinions et les chiffres controversés, modérer les comportements et la pertinence plutôt que les orientations politiques.

Références :
- https://www.arcom.fr/espace-professionnel/reglement-sur-les-services-numeriques-ou-dsa-obligations-et-services-concernes
- https://www.cnil.fr/fr/conformite-rgpd-information-des-personnes-et-transparence
- https://entreprendre.service-public.gouv.fr/vosdroits/F37351
