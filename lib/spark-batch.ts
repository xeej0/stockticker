import {createCache} from './server-cache';
import {downsample} from './indicators';
export type Spark={points:number[];previous?:number};
// Yahoo's spark endpoint takes at most 20 symbols per call.
const CHUNK=20;
const cache=createCache<Record<string,Spark>>(120_000,200);
const finite=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v);
async function loadChunk(symbols:string[]):Promise<Record<string,Spark>>{
 const params=new URLSearchParams({symbols:symbols.join(','),range:'1d',interval:'5m'});
 for(const host of ['query2','query1'])try{
  const r=await fetch(`https://${host}.finance.yahoo.com/v8/finance/spark?${params}`,{headers:{'User-Agent':'Mozilla/5.0',Accept:'application/json'},signal:AbortSignal.timeout(10000)});
  if(!r.ok)continue;const body:any=await r.json();if(!body||typeof body!=='object'||body.spark)continue;
  const out:Record<string,Spark>={};
  for(const symbol of symbols){const s=body[symbol];if(!s||!Array.isArray(s.close))continue;const points=downsample((s.close as unknown[]).filter(finite),48);if(points.length<2)continue;out[symbol]={points,previous:symbol.endsWith('-USD')?undefined:finite(s.chartPreviousClose)?s.chartPreviousClose:finite(s.previousClose)?s.previousClose:undefined}}
  return out;
 }catch{/* Try the other host. */}
 throw Error('Sparklines unavailable.');
}
export async function sparkBatch(symbols:string[]){
 const sorted=[...new Set(symbols)].sort(),chunks:string[][]=[];
 for(let i=0;i<sorted.length;i+=CHUNK)chunks.push(sorted.slice(i,i+CHUNK));
 const results=await Promise.allSettled(chunks.map(c=>cache.get(c.join(','),()=>loadChunk(c))));
 return Object.assign({},...results.map(r=>r.status==='fulfilled'?r.value:{})) as Record<string,Spark>;
}
