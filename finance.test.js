import test from 'node:test';
import assert from 'node:assert/strict';
import {chargedMinutes,charge,validMinutes,validRate} from '../finance.js';
test('25 minutes at EGP 30/hour => EGP 12.50',()=>assert.equal(charge(25,30),12.5));
test('open timer rounds up to next minute',()=>{
 assert.equal(chargedMinutes('open','2026-01-01T12:00:00Z','2026-01-01T12:25:04Z'),26);
 assert.equal(chargedMinutes('open','2026-01-01T12:00:00Z','2026-01-01T12:00:00Z'),1);
});
test('fixed timer charges booked, not elapsed',()=>assert.equal(chargedMinutes('fixed','2026-01-01T12:00:00Z','2026-01-01T12:03:00Z',25),25));
test('reject invalid rates and minutes',()=>{
 assert.equal(validMinutes(0),false);assert.equal(validMinutes(1441),false);
 assert.equal(validRate(-1),false);assert.equal(validRate(''),false);
 assert.throws(()=>charge(0,30));
});
