import {describe,it,expect} from 'vitest';
import {hashEditToken,makeEditToken,makeCitizenKey,normalizeCitizenBody,parseRevision,editToken,writeErrorStatus} from './_citizen.js';

const citizen={
 title:'Mon budget',description:'Budget citoyen de test',author:'Citoyen',
 referenceYear:2025,publish:true,
 proposals:[{proposalKey:'p1',title:'Réduire les dépenses de défense',
 description:'Réduire de 2 milliards les dépenses de défense.',
 impacts:[{side:'expenses',categoryId:'defense',deltaAmountBn:'-2'}]}]
};
describe('v2 citizen write contract',()=>{
 it('creates a random edit capability, only hash is stored',()=>{
   const token=makeEditToken();
   expect(token).toMatch(/^[a-f0-9]{64}$/);
   expect(hashEditToken(token)).toMatch(/^[a-f0-9]{64}$/);
   expect(hashEditToken(token)).not.toBe(token);
   expect(makeCitizenKey()).toMatch(/^citizen-[0-9a-f-]{36}$/);
 });
 it('maps public UI payload to canonical proposal/impact rows',()=>{
   const p=normalizeCitizenBody(citizen,'citizen-00000000-0000-4000-8000-000000000001');
   expect(p.budget.origin).toBe('citizen');
   expect(p.budget.version).toBe('latest');
   expect(p.proposals[0].description).toBe(citizen.proposals[0].description);
   expect(p.impacts[0].delta_amount_bn).toBe('-2');
 });
 it('refuses a party POST or overriding the citizen origin',()=>{
   expect(()=>normalizeCitizenBody({...citizen,origin:'party'},'citizen-00000000-0000-4000-8000-000000000001')).toThrow(/politique/);
 });
 it('refuses duplicated posts, unqualified deltas and undocumented impacts',()=>{
   const p=citizen.proposals[0];
   expect(()=>normalizeCitizenBody({...citizen,proposals:[p,{...p,proposalKey:'p2'}]},'citizen-00000000-0000-4000-8000-000000000001')).toThrow(/deux fois/);
   expect(()=>normalizeCitizenBody({...citizen,proposals:[{...p,description:''}]},'citizen-00000000-0000-4000-8000-000000000001')).toThrow(/expliqué/);
   expect(()=>normalizeCitizenBody({...citizen,proposals:[{...p,impacts:[{...p.impacts[0],deltaAmountBn:'-1.1234'}]}]},'citizen-00000000-0000-4000-8000-000000000001')).toThrow(/précision/);
 });
 it('supports unpublished empty draft, but rejects an empty publication',()=>{
   expect(normalizeCitizenBody({...citizen,publish:false,proposals:[]},'citizen-00000000-0000-4000-8000-000000000001').proposals).toHaveLength(0);
   expect(()=>normalizeCitizenBody({...citizen,proposals:[]},'citizen-00000000-0000-4000-8000-000000000001')).toThrow(/sans proposition/);
 });
 it('requires edit capability and numeric optimistic revision',()=>{
   expect(editToken({headers:{authorization:'Bearer '+makeEditToken()}})).toMatch(/^[0-9a-f]{64}$/);
   expect(editToken({headers:{authorization:'Bearer invalid'}})).toBeNull();
   expect(()=>parseRevision(undefined)).toThrow(/Révision/);
   expect(parseRevision(2)).toBe(2);
   expect(writeErrorStatus(new Error('revision_conflict'))).toBe(409);
   expect(writeErrorStatus(new Error('edit_capability_denied'))).toBe(403);
   expect(writeErrorStatus(new Error('publication_limit_reached'))).toBe(409);
   expect(writeErrorStatus(new Error('publication_rate_limited'))).toBe(429);
 });
});
