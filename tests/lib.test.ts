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
  assert.equal(compact(4_980_000_000_000),'4.98T');
});
test('chart ranges validate and compute cutoffs',()=>{
  assert.ok(isChartRange('1y'));assert.ok(!isChartRange('2w'));
  const now=new Date('2026-11-07T12:00:00Z');
  assert.equal(cutoffForRange('max',now),0);
  assert.equal(new Date(cutoffForRange('ytd',now)*1000).toISOString(),'2026-01-01T00:00:00.000Z');
  assert.equal(new Date(cutoffForRange('1y',now)*1000).toISOString(),'2025-11-07T12:00:00.000Z');
});
import {usMarketSession,describeNext,nyTime,calendar} from '../lib/market-hours.ts';
test('NYSE holidays and early closes follow exchange rules',()=>{
  assert.deepEqual([...calendar(2026).holidays.keys()],['1-1','1-19','2-16','4-3','5-25','6-19','7-3','9-7','11-26','12-25']);
  assert.deepEqual([...calendar(2026).early],['11-27','12-24']);
  const h27=calendar(2027).holidays;assert.ok(h27.has('6-18')&&h27.has('7-5')&&h27.has('12-24'));
  assert.ok(!calendar(2022).holidays.has('1-1'));
});
test('usMarketSession reports the session and the next change in New York time',()=>{
  const at=(m:number,d:number,h:number,mi=0)=>usMarketSession(nyTime(2026,m,d,h,mi));
  assert.equal(at(11,9,10).state,'open');
  assert.equal(at(11,9,9,29).state,'pre');
  assert.equal(at(11,9,16,30).state,'post');
  assert.equal(at(11,9,3).state,'closed');
  assert.equal(at(11,7,12).reason,'Weekend');
  assert.equal(at(11,26,12).reason,'Thanksgiving');
  const early=at(11,27,12,30);assert.equal(early.state,'open');assert.equal(early.nextChange,nyTime(2026,11,27,13));
  assert.equal(at(11,27,14).state,'post');
  assert.equal(at(11,7,12).nextChange,nyTime(2026,11,9,9,30));
  assert.equal(describeNext(at(11,9,15,15),nyTime(2026,11,9,15,15)),'Closes in 45m');
  assert.equal(describeNext(at(11,6,21),nyTime(2026,11,6,21)),'Opens Mon 9:30 AM ET');
  assert.equal(describeNext(at(11,9,21),nyTime(2026,11,9,21)),'Opens tomorrow 9:30 AM ET');
  assert.equal(usMarketSession(Date.UTC(2026,2,9,13,45)).state,'open');// DST already started: 9:45 AM EDT
});
