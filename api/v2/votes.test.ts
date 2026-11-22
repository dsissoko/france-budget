import {describe,it,expect} from 'vitest';
import {voterFromCookies,validVoteId} from './votes.js';

describe('v2 anonymous votes - preserve V1 contract',()=>{
 it('recognizes V1 voter cookie without disclosing a new identity',()=>{
  const token='a'.repeat(64);
  const v=voterFromCookies('theme=light; fb_voter='+token+'; other=x');
  expect(v).toEqual({token,fresh:false});
 });
 it('issues random voter token only when missing or invalid',()=>{
  const x=voterFromCookies('fb_voter=invalid');
  const y=voterFromCookies('');
  expect(x.fresh).toBe(true);
  expect(x.token).toMatch(/^[a-f0-9]{64}$/);
  expect(x.token).not.toBe(y.token);
 });
 it('rejects arbitrary IDs and accepts canonical UUIDs',()=>{
  expect(validVoteId('not-uuid')).toBe(false);
  expect(validVoteId('00000000-0000-4000-8000-000000000001')).toBe(true);
 });
});
