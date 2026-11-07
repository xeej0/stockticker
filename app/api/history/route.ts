import {createCache} from '../../../lib/server-cache';
import {validSymbol} from '../../../lib/market-types';
import {cutoffForRange,isChartRange} from '../../../lib/chart-ranges';
const cache=createCache<Record<string,unknown>>(300000,30);
export async function GET(request:Request){
 const url=new URL(request.url),symbol=(url.searchParams.get('symbol')||'').toUpperCase(),range=url.searchParams.get('range')||'1y';if(!validSymbol(symbol)||!isChartRange(range))return Response.json({error:'Invalid ticker or range.'},{status:400});
 try{const data=await cache.get(`${symbol}:${range}`,async()=>{
 // Include 400 calendar days before the view for 200 trading-day warmup.
 const start=range==='max'?0:Math.max(0,cutoffForRange(range)-400*86400);
 for(const host of ['query2','query1'])try{const params=new URLSearchParams({period1:String(start),period2:String(Math.floor(Date.now()/1000)),interval:'1d'});const r=await fetch(`https://${host}.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?${params}`,{headers:{'User-Agent':'Mozilla/5.0'},signal:AbortSignal.timeout(15000)});if(!r.ok)continue;const body:any=await r.json(),d=body.chart?.result?.[0];if(!d||d.meta.dataGranularity!=='1d')continue;const closes=d.indicators?.quote?.[0]?.close;const rows=(d.timestamp||[]).map((time:number,i:number)=>({time,close:closes?.[i]})).filter((row:any)=>Number.isFinite(row.close));return {symbol:d.meta.symbol,rows,source:'Yahoo Finance'}}catch{}throw Error('History unavailable.');
 });return Response.json(data,{headers:{'Cache-Control':'public, max-age=120'}})}catch{return Response.json({error:'Moving averages are temporarily unavailable.'},{status:503})}
}
