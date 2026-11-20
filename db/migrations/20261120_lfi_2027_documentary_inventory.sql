-- LFI 2027: documentary-only primary source inventory (28 separate monetary proposals)
-- Reconciles 106.4 MdEUR revenue and 81.7 MdEUR expenses as claimed by party.
-- NO accounting links, scenario.picked changes, or APU classification/activation.
-- Source rows: 1–14 revenues, 15–28 expenditures; idempotent.
INSERT INTO public.party_proposals(party_code,source_year,group_id,title,review_status,source_measure_count)
VALUES
('LFI',2027,'fiscalite_reformes','Retour sur les baisses d''impôts depuis 2017','review_pending',4),
('LFI',2027,'grandes_fortunes','Fiscalité des grandes fortunes','review_pending',2),
('LFI',2027,'entreprises','Fiscalité des grandes entreprises','review_pending',4),
('LFI',2027,'transactions_financieres','Transactions financières et crypto-actifs','review_pending',3),
('LFI',2027,'fraude_fiscale','Lutte contre la fraude fiscale','review_pending',1),
('LFI',2027,'revenus_populaires','Relance des revenus populaires','review_pending',4),
('LFI',2027,'services_publics','Renforcement des services publics','review_pending',7),
('LFI',2027,'planification_ecologique','Planification écologique et adaptation climatique','review_pending',1),
('LFI',2027,'protection_sociale','Retraites et assurance chômage','review_pending',2)
ON CONFLICT (party_code,source_year,group_id) DO NOTHING;

INSERT INTO public.party_source_lines(party_code,source_year,source_row,group_id,direction,title,claimed_amount_bn,source_url,apu_manual_tag,validation_status)
VALUES
('LFI',2027,10,'fiscalite_reformes','revenue_increase','Suppression de la flat tax',9,'https://melenchon2027.fr/wp-content/uploads/2026/10/Comment-nous-allons-remettre-de-l-ordre-dans-les-comptes-publics.pdf',NULL,'primary_source_checked_apu_review_pending'),
('LFI',2027,20,'fiscalite_reformes','revenue_increase','Rétablissement de l''impôt sur la fortune renforcé',10,'https://melenchon2027.fr/wp-content/uploads/2026/10/Comment-nous-allons-remettre-de-l-ordre-dans-les-comptes-publics.pdf',NULL,'primary_source_checked_apu_review_pending'),
('LFI',2027,30,'fiscalite_reformes','revenue_increase','Réduction et suppression de niches fiscales et sociales',22,'https://melenchon2027.fr/wp-content/uploads/2026/10/Comment-nous-allons-remettre-de-l-ordre-dans-les-comptes-publics.pdf',NULL,'primary_source_checked_apu_review_pending'),
('LFI',2027,40,'fiscalite_reformes','revenue_increase','Rétablissement de la CVAE sur les plus grandes entreprises',3,'https://melenchon2027.fr/wp-content/uploads/2026/10/Comment-nous-allons-remettre-de-l-ordre-dans-les-comptes-publics.pdf',NULL,'primary_source_checked_apu_review_pending'),
('LFI',2027,50,'grandes_fortunes','revenue_increase','Taxe Zucman sur les patrimoines de plus de 100 M€',15,'https://melenchon2027.fr/wp-content/uploads/2026/10/Comment-nous-allons-remettre-de-l-ordre-dans-les-comptes-publics.pdf',NULL,'primary_source_checked_apu_review_pending'),
('LFI',2027,60,'grandes_fortunes','revenue_increase','Réforme des droits de succession',20,'https://melenchon2027.fr/wp-content/uploads/2026/10/Comment-nous-allons-remettre-de-l-ordre-dans-les-comptes-publics.pdf',NULL,'primary_source_checked_apu_review_pending'),
('LFI',2027,70,'entreprises','revenue_increase','Réforme de l''impôt sur les sociétés',3,'https://melenchon2027.fr/wp-content/uploads/2026/10/Comment-nous-allons-remettre-de-l-ordre-dans-les-comptes-publics.pdf',NULL,'primary_source_checked_apu_review_pending'),
('LFI',2027,80,'entreprises','revenue_increase','Taxe universelle sur les multinationales',5,'https://melenchon2027.fr/wp-content/uploads/2026/10/Comment-nous-allons-remettre-de-l-ordre-dans-les-comptes-publics.pdf',NULL,'primary_source_checked_apu_review_pending'),
('LFI',2027,90,'entreprises','revenue_increase','Renforcement de la taxe GAFAM',3.9,'https://melenchon2027.fr/wp-content/uploads/2026/10/Comment-nous-allons-remettre-de-l-ordre-dans-les-comptes-publics.pdf',NULL,'primary_source_checked_apu_review_pending'),
('LFI',2027,100,'entreprises','revenue_increase','Taxe sur les superprofits',5,'https://melenchon2027.fr/wp-content/uploads/2026/10/Comment-nous-allons-remettre-de-l-ordre-dans-les-comptes-publics.pdf',NULL,'primary_source_checked_apu_review_pending'),
('LFI',2027,110,'transactions_financieres','revenue_increase','Augmentation des taxes sur les transactions financières',5,'https://melenchon2027.fr/wp-content/uploads/2026/10/Comment-nous-allons-remettre-de-l-ordre-dans-les-comptes-publics.pdf',NULL,'primary_source_checked_apu_review_pending'),
('LFI',2027,120,'transactions_financieres','revenue_increase','Taxation des rachats d''actions',2.5,'https://melenchon2027.fr/wp-content/uploads/2026/10/Comment-nous-allons-remettre-de-l-ordre-dans-les-comptes-publics.pdf',NULL,'primary_source_checked_apu_review_pending'),
('LFI',2027,130,'transactions_financieres','revenue_increase','Taxation des crypto-actifs',1,'https://melenchon2027.fr/wp-content/uploads/2026/10/Comment-nous-allons-remettre-de-l-ordre-dans-les-comptes-publics.pdf',NULL,'primary_source_checked_apu_review_pending'),
('LFI',2027,140,'fraude_fiscale','revenue_increase','Renforcement de la lutte contre la fraude fiscale',2,'https://melenchon2027.fr/wp-content/uploads/2026/10/Comment-nous-allons-remettre-de-l-ordre-dans-les-comptes-publics.pdf',NULL,'primary_source_checked_apu_review_pending'),
('LFI',2027,114,'revenus_populaires','expense_increase','Augmentation de 10 % des salaires des fonctionnaires',17,'https://melenchon2027.fr/wp-content/uploads/2026/10/Comment-nous-allons-remettre-de-l-ordre-dans-les-comptes-publics.pdf',NULL,'primary_source_checked_apu_review_pending'),
('LFI',2027,214,'revenus_populaires','expense_increase','Revalorisation des pensions, allocations familiales et APL',8,'https://melenchon2027.fr/wp-content/uploads/2026/10/Comment-nous-allons-remettre-de-l-ordre-dans-les-comptes-publics.pdf',NULL,'primary_source_checked_apu_review_pending'),
('LFI',2027,314,'revenus_populaires','expense_increase','Logements d''urgence et réquisition de logements vacants',3,'https://melenchon2027.fr/wp-content/uploads/2026/10/Comment-nous-allons-remettre-de-l-ordre-dans-les-comptes-publics.pdf',NULL,'primary_source_checked_apu_review_pending'),
('LFI',2027,414,'revenus_populaires','expense_increase','Garantie d''autonomie pour les jeunes',9.5,'https://melenchon2027.fr/wp-content/uploads/2026/10/Comment-nous-allons-remettre-de-l-ordre-dans-les-comptes-publics.pdf',NULL,'primary_source_checked_apu_review_pending'),
('LFI',2027,514,'services_publics','expense_increase','Création de 10 000 postes dans l''enseignement',0.5,'https://melenchon2027.fr/wp-content/uploads/2026/10/Comment-nous-allons-remettre-de-l-ordre-dans-les-comptes-publics.pdf',NULL,'primary_source_checked_apu_review_pending'),
('LFI',2027,614,'services_publics','expense_increase','Gratuité de la cantine scolaire',3.6,'https://melenchon2027.fr/wp-content/uploads/2026/10/Comment-nous-allons-remettre-de-l-ordre-dans-les-comptes-publics.pdf',NULL,'primary_source_checked_apu_review_pending'),
('LFI',2027,714,'services_publics','expense_increase','Création de 250 000 places universitaires',3.5,'https://melenchon2027.fr/wp-content/uploads/2026/10/Comment-nous-allons-remettre-de-l-ordre-dans-les-comptes-publics.pdf',NULL,'primary_source_checked_apu_review_pending'),
('LFI',2027,814,'services_publics','expense_increase','Hausse du budget hospitalier et créations de postes soignants',3,'https://melenchon2027.fr/wp-content/uploads/2026/10/Comment-nous-allons-remettre-de-l-ordre-dans-les-comptes-publics.pdf',NULL,'primary_source_checked_apu_review_pending'),
('LFI',2027,914,'services_publics','expense_increase','Plan d''urgence contre les violences sexistes et sexuelles',2.6,'https://melenchon2027.fr/wp-content/uploads/2026/10/Comment-nous-allons-remettre-de-l-ordre-dans-les-comptes-publics.pdf',NULL,'primary_source_checked_apu_review_pending'),
('LFI',2027,1014,'services_publics','expense_increase','Lutte contre les violences faites aux enfants',2,'https://melenchon2027.fr/wp-content/uploads/2026/10/Comment-nous-allons-remettre-de-l-ordre-dans-les-comptes-publics.pdf',NULL,'primary_source_checked_apu_review_pending'),
('LFI',2027,1114,'services_publics','expense_increase','Rétablissement des budgets de services publics et indexation inflation',7,'https://melenchon2027.fr/wp-content/uploads/2026/10/Comment-nous-allons-remettre-de-l-ordre-dans-les-comptes-publics.pdf',NULL,'primary_source_checked_apu_review_pending'),
('LFI',2027,1214,'planification_ecologique','expense_increase','Investissements d''adaptation aux effets du dérèglement climatique',10,'https://melenchon2027.fr/wp-content/uploads/2026/10/Comment-nous-allons-remettre-de-l-ordre-dans-les-comptes-publics.pdf',NULL,'primary_source_checked_apu_review_pending'),
('LFI',2027,1314,'protection_sociale','expense_increase','Abrogation de la réforme des retraites à 64 ans',9,'https://melenchon2027.fr/wp-content/uploads/2026/10/Comment-nous-allons-remettre-de-l-ordre-dans-les-comptes-publics.pdf',NULL,'primary_source_checked_apu_review_pending'),
('LFI',2027,1414,'protection_sociale','expense_increase','Abrogation des réformes de l''assurance chômage',3,'https://melenchon2027.fr/wp-content/uploads/2026/10/Comment-nous-allons-remettre-de-l-ordre-dans-les-comptes-publics.pdf',NULL,'primary_source_checked_apu_review_pending')
ON CONFLICT (party_code,source_year,source_row) DO NOTHING;
