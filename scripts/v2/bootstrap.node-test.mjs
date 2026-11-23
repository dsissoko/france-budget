import {describe,it} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {validateFixture,seedSql,bootstrapSql} from './db-init.mjs';
import {policySql} from './apply-policy.mjs';

const d=JSON.parse(readFileSync(resolve('data/reference/2025-v2.json'),'utf8'));
describe('Bootstrap V2 indépendant de public',()=>{
 it('valide la source de référence : 27 postes et masses APU 2025',()=>{
  assert.deepEqual(validateFixture(d),{revenues:10,expenses:15,offBudget:2});
 });
 it('produit des INSERT numériques et paramétriques déterministes',()=>{
  const a=seedSql(d);
  assert.equal(a,seedSql(d));
  assert.match(a,/INSERT INTO v2\.reference_posts/);
  assert.match(a,/INSERT INTO v2\.reference_parameters/);
  assert.match(a,/ON CONFLICT\(reference_year,side,category_id\) DO NOTHING/);
 });
 it('refuse les postes doublons ou une masse incohérente',()=>{
  assert.throws(()=>validateFixture({...d,posts:[...d.posts.slice(0,-1),d.posts[0]]}),/Duplicate post/);
  assert.throws(()=>validateFixture({...d,posts:d.posts.map((p,i)=>i===0?{...p,amount_bn:'999'}:p)}),/APU totals/);
 });
 it('n exécute que des DDL V2 et protège une base déjà alimentée',()=>{
  const sql=bootstrapSql(d);
  assert.match(sql,/^BEGIN;/);
  assert.match(sql,/COMMIT;\s*$/);
  assert.match(sql,/db:init refuses nonempty v2.budgets/);
  assert.doesNotMatch(sql.replace(/^--.*$/gm,''),/(?:FROM|INTO|UPDATE|JOIN|ALTER TABLE)\s+public\./i);
  assert.match(sql,/REVOKE ALL ON FUNCTION v2\.import_budget\(jsonb\) FROM PUBLIC/);
  assert.match(sql,/SECURITY DEFINER/);
  assert.match(sql,/CREATE TRIGGER trg_refresh_featured_citizen_votes/);
  assert.match(sql,/CREATE TRIGGER trg_refresh_featured_citizen_budgets/);
  assert.match(sql,/CREATE TRIGGER trg_refresh_featured_citizen_proposals/);
  assert.match(sql,/SELECT v2\.refresh_featured_citizen_budget\(\)/);
  assert.match(sql,/publication_limit_reached/);
  assert.doesNotMatch(sql,/publication_rate_limited|now\(\)-interval '24 hours'/);
  assert.match(sql,/b\.origin='citizen' AND b\.version='latest'/);
  assert.match(sql,/AND b\.publication_status='published'/);
  assert.match(sql,/ORDER BY count\(v\.id\) DESC,pc\.proposal_count DESC,b\.published_at DESC NULLS LAST,b\.id/);

  assert.match(bootstrapSql(d,'france_budget_app'),/SET LOCAL v2\.application_role = 'france_budget_app'/);
  assert.throws(()=>bootstrapSql(d,'unsafe;role'),/Unsafe V2_APP_ROLE/);
 });
});


describe('Migration non destructive V2 des règles citoyennes',()=>{
 it('ne réexécute ni le bootstrap ni les opérations de suppression de vues',()=>{
  const sql=policySql();
  assert.match(sql,/^BEGIN;/);
  assert.match(sql,/COMMIT;\s*$/);
  assert.match(sql,/CREATE OR REPLACE FUNCTION v2\.write_citizen_budget/);
  assert.match(sql,/CREATE TRIGGER trg_refresh_featured_citizen_votes/);
  assert.match(sql,/CREATE TRIGGER trg_refresh_featured_citizen_budgets/);
  assert.match(sql,/CREATE TRIGGER trg_refresh_featured_citizen_proposals/);
  assert.match(sql,/SECURITY DEFINER/);
  assert.doesNotMatch(sql,/DROP VIEW|DROP SCHEMA|DELETE FROM v2\.budgets/);
  assert.doesNotMatch(sql,/publication_rate_limited|now\(\)-interval '24 hours'/);
  assert.match(sql,/publication_limit_reached/);
 });
});
