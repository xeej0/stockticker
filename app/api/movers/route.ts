import {quoteBatch} from '../../../lib/quote-batch';
type Item={symbol:string;name:string;type:string;currency:string;price?:number;percent?:number;asOf?:number};
type ListData={list:string;items:Item[];updatedAt:number;sessionTime?:number;source:string;stale?:boolean};
const cache=new Map<string,ListData>();
const numeric=(value:any):number|undefined=>{const n=typeof value==='object'?value?.raw:value;return typeof n==='number'&&Number.isFinite(n)?n:undefined};
export async function GET(request:Request){
 const list=new URL(request.url).searchParams.get('list')||'winners';
 if(!['winners','losers','trending'].includes(list))return Response.json({error:'Invalid market list.'},{status:400});
 const saved=cache.get(list);if(saved&&Date.now()-saved.updatedAt<120000)return Response.json(saved);
 const path=list==='trending'?'/v1/finance/trending/US?count=5':`/v1/finance/screener/predefined/saved?scrIds=${list==='winners'?'day_gainers':'day_losers'}&count=6`;
 for(const host of ['query2','query1'])try{
  const res=await fetch(`https://${host}.finance.yahoo.com${path}`,{headers:{'User-Agent':'Mozilla/5.0','Accept':'application/json'},signal:AbortSignal.timeout(10000)});
  if(!res.ok)continue;const body:any=await res.json();const quotes=body.finance?.result?.[0]?.quotes;
  if(!Array.isArray(quotes))continue;
  let items:Item[]=quotes.filter((q:any)=>typeof q.symbol==='string'&&/^[A-Z0-9^=._-]{1,24}$/.test(q.symbol)).map((q:any)=>({symbol:q.symbol,name:q.longName||q.shortName||q.symbol,type:q.quoteType||'EQUITY',currency:q.currency||'USD',price:numeric(q.regularMarketPrice),percent:numeric(q.regularMarketChangePercent),asOf:numeric(q.regularMarketTime)}));
  items=items.filter((item,i,all)=>all.findIndex(x=>x.symbol===item.symbol)===i);
  if(list==='trending'){
   items=items.slice(0,5);try{const quotes=await quoteBatch(items.map(i=>i.symbol));const bySymbol=new Map(quotes.map(q=>[q.symbol,q]));items=items.map(item=>({...item,...bySymbol.get(item.symbol)}))}catch{/* Trending symbols are still useful when prices are unavailable. */}
  }else{
   items=items.filter(i=>i.type==='EQUITY'&&i.price!==undefined&&i.percent!==undefined&&(list==='winners'?i.percent>0:i.percent<0));
   items.sort((a,b)=>list==='winners'?b.percent!-a.percent!:a.percent!-b.percent!);items=items.slice(0,5);
  }
  const times=items.map(i=>i.asOf).filter((t):t is number=>typeof t==='number');
  const data:ListData={list,items,updatedAt:Date.now(),sessionTime:times.length?Math.max(...times):undefined,source:'Yahoo Finance'};
  cache.set(list,data);return Response.json(data,{headers:{'Cache-Control':'public, max-age=60'}});
 }catch{ /* Retry the other data host. */ }
 if(saved)return Response.json({...saved,stale:true},{headers:{'Cache-Control':'no-store'}});
 return Response.json({error:'This market list is temporarily unavailable. Please try again.'},{status:503});
}
