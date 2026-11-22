#!/usr/bin/env node
// Verify the active V2 documentation's relative links and Mermaid fences.
// No external dependencies or network requests.
import {readFileSync, existsSync} from 'node:fs';
import {resolve, dirname} from 'node:path';

const docs = [
  'README.md',
  'docs/v2/README.md',
  'docs/v2/metier.md',
  'docs/v2/fonctionnel.md',
  'docs/v2/architecture.md',
  'docs/v2/mcd.md',
  'docs/v2/integration.md',
  'docs/v2/api.md',
  'docs/v2/exploitation.md',
  'docs/v2/adr/README.md',
  'docs/v2/adr/0001-modele-canonique.md',
  'docs/v2/adr/0002-qualification-amont.md',
  'docs/v2/adr/0003-cutover-parallele.md'
];
const errors = [];
for (const path of docs) {
  if (!existsSync(path)) { errors.push(path + ': missing document'); continue; }
  const raw = readFileSync(path, 'utf8');
  const fences = [...raw.matchAll(/^\s*(?:`{3}|~{3})(?:mermaid)?\s*$/gm)];
  const mermaidStarts = [...raw.matchAll(/^\s*(?:`{3}|~{3})mermaid\s*$/gm)];
  if (fences.length % 2 !== 0) errors.push(path + ': unbalanced mermaid/code fences');
  for (const start of mermaidStarts) {
    const remaining = raw.slice(start.index + start[0].length);
    if (!/^\s*(?:`{3}|~{3})\s*$/m.test(remaining)) errors.push(path + ': unclosed Mermaid block');
  }
  for (const match of raw.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const target = match[1].trim().split(/\s+"/)[0];
    if (/^(https?:|mailto:|#|\/)/.test(target)) continue;
    const clean = decodeURIComponent(target.split('#')[0].split('?')[0]);
    if (!clean) continue;
    if (!existsSync(resolve(dirname(path), clean)))
      errors.push(path + ': broken link ' + clean);
  }
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('V2 docs: ' + docs.length + ' pages checked, local links and Mermaid fences valid.');
