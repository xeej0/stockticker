import {test} from 'node:test';
import assert from 'node:assert/strict';
import {sma,nearestPointIndex,downsample} from '../lib/indicators.ts';
import {money,pct,signed,compact} from '../lib/format.ts';
import {cutoffForRange,isChartRange} from '../lib/chart-ranges.ts';

test('sma averages a sliding window and pads the warmup with null',()=>{
  assert.deepEqual(sma([1,2,3,4,5],3),[null,null,2,3,4]);
});
test('nearestPointIndex picks the closest timestamp',()=>{
  const pts=[{time:0,value:1},{time:10,value:2},{time:20,value:3}];
  assert.equal(nearestPointIndex(pts,4),0);
  assert.equal(nearestPointIndex(pts,6),1);
  assert.equal(nearestPointIndex(pts,99),2);
  assert.equal(nearestPointIndex([],5),0);
});
test('downsample keeps both ends and the limit',()=>{
  const out=downsample(Array.from({length:5000},(_,i)=>i),100);
  assert.equal(out.length,100);assert.equal(out[0],0);assert.equal(out.at(-1),4999);
});
test('formatters handle signs and missing values',()=>{
  assert.equal(signed(-1.8),'-1.80');
  assert.equal(signed(1234.5),'+1,234.50');
  assert.equal(signed(undefined),'—');
  assert.equal(pct(0.5),'+0.50%');
  assert.equal(money(342.37),'$342.37');
  assert.equal(money(116.5,'GBp'),'116.50 GBp');
  assert.equal(compact(4_980_000_000_000),'4.98T');
});
test('chart ranges validate and compute cutoffs',()=>{
  assert.ok(isChartRange('1y'));assert.ok(!isChartRange('2w'));
  const now=new Date('2026-11-07T12:00:00Z');
  assert.equal(cutoffForRange('max',now),0);
  assert.equal(new Date(cutoffForRange('ytd',now)*1000).toISOString(),'2026-01-01T00:00:00.000Z');
  assert.equal(new Date(cutoffForRange('1y',now)*1000).toISOString(),'2025-11-07T12:00:00.000Z');
});
