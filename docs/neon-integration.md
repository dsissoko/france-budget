# France Budget — publication citoyenne (Neon + Vercel)

## Architecture
- Frontend React/Vite, sauvegarde locale conservée.
- Fonctions Vercel `/api/budgets` (GET, POST) et `/api/votes` (POST).
- PostgreSQL Neon à Francfort, avec un rôle applicatif `france_budget_app` à droits limités.
- `DATABASE_URL` est configuré comme secret serveur dans Vercel (production + preview). **Ne jamais utiliser le préfixe `VITE_` pour ce secret.**
- Schéma versionné dans `db/schema.sql`.

## Fonctionnement
- Le citoyen peut créer des mesures de recettes/dépenses, voir l'effet sur le déficit, enregistrer localement ou publier.
- Publication anonyme et définitive, avec titre et description non identifiants ; la copie locale reste modifiable.
- Limite globale de 50 publications citoyennes, imposée par une fonction SQL transactionnelle avec verrou consultatif.
- Limite de 2 publications par 24 h et par empreinte de connexion ; les IP ne sont pas enregistrées en clair.
- Onglet Voter : choix d'un budget parmi 50, consultation, comparaison, vote.
- Cookie aléatoire HttpOnly/Secure/SameSite ; unicité (budget, empreinte du cookie) en base. **Un navigateur peut effacer ses cookies : un vote par personne n'est pas garanti.**
- L'API ne fournit aucun droit de modification ou suppression aux visiteurs. Un retrait administratif reste possible pour les contenus abusifs.

## Sécurité et limites
- Les noms, descriptions et mesures sont fournis par les visiteurs : les afficher en texte, jamais en HTML brut.
- Les budgets sont limités en taille, les catégories et montants sont vérifiés côté serveur.
- Le dispositif anti-abus est volontairement léger et ne résiste pas à une attaque coordonnée : prévoir CAPTCHA/WAF ou modération si l'application gagne en visibilité.
- Ne pas présenter les simulations comme des prévisions officielles ; les ventilations de référence restent indicatives.
- Vérifier les fonctions Vercel et le parcours utilisateur en production après déploiement.
