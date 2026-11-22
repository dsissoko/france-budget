import {describe,it,expect} from 'vitest';
import {escapeHtml} from './[id].js';

describe('V2 share metadata',()=>{
 it('escapes user-authored markup before entering HTML attributes',()=>{
  expect(escapeHtml('<img src="x" onerror="alert(1)">')).toBe('&lt;img src=&quot;x&quot; onerror=&quot;alert(1)&quot;&gt;');
 });
});
