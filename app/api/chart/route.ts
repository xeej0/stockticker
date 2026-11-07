import {INTERVALS,isChartRange} from '../../../lib/chart-ranges';
import {createCache} from '../../../lib/server-cache';
const cache=createCache<Record<string,unknown>>(60000,300);
export async function GET(req:Request) {
 const url = new URL(req.url), symbol = (url.searchParams.get('symbol')||'').toUpperCase(), range=url.searchParams.get('range')||'1d';
 if(!/^[A-Z0-9^=._-]{1,24}$/.test(symbol)||!isChartRange(range)) return Response.json({error:'Invalid ticker or range.'},{status:400});
 try{const data=await cache.get(`${symbol}:${range}`,async()=>{
 for(const host of ['query2','query1']) {
 try {
 // Yahoo does not support every requested year count as a named range.
 const params=new URLSearchParams({interval:INTERVALS[range]});
 if(['3y','10y'].includes(range)){const end=new Date(),start=new Date(end);start.setUTCFullYear(start.getUTCFullYear()-Number.parseInt(range,10));params.set('period1',String(Math.floor(start.getTime()/1000)));params.set('period2',String(Math.floor(end.getTime()/1000)))}else{params.set('range',range)}
 const res=await fetch(`https://${host}.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?${params}`,{headers:{'User-Agent':'Mozilla/5.0','Accept':'application/json'},signal:AbortSignal.timeout(10000)});
 if(!res.ok) { console.warn('Quote source returned',host,res.status); continue; }
 const body:any=await res.json(), result=body.chart?.result?.[0];
 if(!result) continue;
 let m=result.meta;
 if(range!=='1d'&&m.previousClose==null&&m.regularMarketChangePercent==null){const daily=await fetch(`https://${host}.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=5m`,{headers:{'User-Agent':'Mozilla/5.0','Accept':'application/json'},signal:AbortSignal.timeout(10000)});if(!daily.ok)continue;const day:any=await daily.json();if(!day.chart?.result?.[0]?.meta)continue;m={...m,...day.chart.result[0].meta}}
 const q=result.indicators?.quote?.[0], points=(result.timestamp||[]).map((t:number,i:number)=>({time:t,value:q?.close?.[i]})).filter((p:{value:number})=>Number.isFinite(p.value));
 // Keep the regular-session price and change together; extended-hours values differ.
 const dayChange=m.regularMarketChange,dayPercent=m.regularMarketChangePercent;
 const previous=m.previousClose??(dayChange!=null?m.regularMarketPrice-dayChange:dayPercent!=null?m.regularMarketPrice/(1+dayPercent/100):m.chartPreviousClose);
 const change=dayChange??(m.regularMarketPrice-previous);
 const now=Date.now()/1000, session=m.currentTradingPeriod?.regular;
 const data={symbol:m.symbol,name:m.longName||m.shortName||symbol,currency:m.currency||'USD',exchange:m.fullExchangeName||m.exchangeName,type:m.instrumentType,price:m.regularMarketPrice,change,percent:dayPercent??(change/previous*100),previous,high:m.regularMarketDayHigh,low:m.regularMarketDayLow,yearHigh:m.fiftyTwoWeekHigh,yearLow:m.fiftyTwoWeekLow,volume:m.regularMarketVolume,asOf:m.regularMarketTime,marketOpen:session?now>=session.start&&now<session.end:false,timezone:m.exchangeTimezoneName,points,range,source:'Yahoo Finance'};
 return data;
 } catch (e) { console.warn('Quote fetch failed',host,e instanceof Error?e.message:'network error'); }
 }
 throw Error('Chart unavailable.');
 });return Response.json(data,{headers:{'Cache-Control':'public, max-age=30'}})}catch{return Response.json({error:'Market data is temporarily unavailable. Try refreshing shortly.'},{status:503})}
}
