import {describe,it} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {validateFixture,seedSql,bootstrapSql} from './db-init.mjs';

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
  assert.match(bootstrapSql(d,'france_budget_app'),/SET LOCAL v2\.application_role = 'france_budget_app'/);
  assert.throws(()=>bootstrapSql(d,'unsafe;role'),/Unsafe V2_APP_ROLE/);
 });
});
