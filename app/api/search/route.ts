import {createCache} from '../../../lib/server-cache';
type Result={symbol:string;name:string;exchange?:string;type?:string};
const TYPES=new Set(['EQUITY','ETF','INDEX','MUTUALFUND','CRYPTOCURRENCY']);
// Typed queries repeat a lot ("a", "ap", "app"...): a short shared cache saves upstream calls.
const cache=createCache<Result[]>(10*60_000,500);
export async function GET(req:Request){
 const q=(new URL(req.url).searchParams.get('q')||'').trim().slice(0,80);
 if(!q)return Response.json({quotes:[]});
 try{
  const quotes=await cache.get(q.toLowerCase(),async()=>{
   for(const host of ['query2','query1'])try{
    const r=await fetch(`https://${host}.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=12&newsCount=0`,{headers:{'User-Agent':'Mozilla/5.0'},signal:AbortSignal.timeout(7000)});
    if(!r.ok)continue;const d:any=await r.json();
    return (d.quotes||[]).filter((x:any)=>typeof x.symbol==='string'&&TYPES.has(x.quoteType)).map((x:any)=>({symbol:x.symbol,name:x.shortname||x.longname||x.symbol,exchange:x.exchDisp||x.exchange,type:x.quoteType}));
   }catch{/* Try the other host. */}
   throw Error('Search unavailable.');
  });
  return Response.json({quotes},{headers:{'Cache-Control':'public, max-age=300'}});
 }catch{return Response.json({quotes:[],unavailable:true})}
}
