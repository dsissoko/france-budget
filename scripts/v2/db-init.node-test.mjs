import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {bootstrapSql} from './db-init.mjs';

const fixture=JSON.parse(readFileSync('data/reference/2025-v2.json','utf8'));

test('db:init defaults to a protected transactional bootstrap',()=>{
 const sql=bootstrapSql(fixture);
 assert.match(sql,/^BEGIN;/);
 assert.match(sql,/db:init refuses nonempty v2\.budgets/);
 assert.doesNotMatch(sql,/DROP SCHEMA IF EXISTS v2/);
 assert.match(sql,/CREATE TABLE IF NOT EXISTS v2\.budget_measures/);
 assert.match(sql,/CREATE OR REPLACE FUNCTION v2\.refresh_featured_citizen_budget/);
 assert.match(sql,/COMMIT;\s*$/);
});

test('db:init --force rebuilds only v2 inside the transaction',()=>{
 const sql=bootstrapSql(fixture,'',true);
 assert.match(sql,/^BEGIN;\s*DROP SCHEMA IF EXISTS v2 CASCADE;/);
 assert.ok(sql.indexOf('DROP SCHEMA IF EXISTS v2 CASCADE') < sql.indexOf('CREATE SCHEMA IF NOT EXISTS v2'));
 assert.match(sql,/CREATE TABLE IF NOT EXISTS v2\.budget_impacts/);
 assert.match(sql,/CREATE OR REPLACE FUNCTION v2\.write_citizen_budget/);
 assert.match(sql,/CREATE OR REPLACE FUNCTION v2\.refresh_featured_citizen_budget/);
 assert.match(sql,/INSERT INTO v2\.reference_posts/);
 assert.match(sql,/COMMIT;\s*$/);
 assert.doesNotMatch(sql,/DROP SCHEMA(?: IF EXISTS)? public/);
});

test('db:init rejects a force reset without two explicit confirmations',()=>{
 const command=(...args)=>spawnSync(process.execPath,['scripts/v2/db-init.mjs',...args],{encoding:'utf8'});
 const missing=command('--force');
 assert.notEqual(missing.status,0);
 assert.match(missing.stderr,/--force requires --apply and --confirm-reset-v2/);
 const missingConfirmation=command('--apply','--force');
 assert.notEqual(missingConfirmation.status,0);
 assert.match(missingConfirmation.stderr,/--force requires --apply and --confirm-reset-v2/);
 const unnecessary=command('--confirm-reset-v2');
 assert.notEqual(unnecessary.status,0);
 assert.match(unnecessary.stderr,/requires --force/);
 const normalDryRun=command();
 assert.equal(normalDryRun.status,0,normalDryRun.stderr);
 assert.match(normalDryRun.stdout,/"dryRun": true/);
});
