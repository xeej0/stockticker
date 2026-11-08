import {validSymbol} from '../../../../lib/market-types';
// Logos are proxied so visitors' browsers only talk to this site, and cached hard:
// the browser for a day, Vercel's CDN for a week. Misses are cached too.
type Entry={body:ArrayBuffer;type:string}|null;
const memory=new Map<string,Entry>();
const LIMIT=400;
const headers=(ok:boolean)=>({'Cache-Control':ok?'public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800':'public, max-age=86400, s-maxage=86400'});
function sourceSymbol(symbol:string){
 if(symbol.startsWith('^')||symbol.includes('='))return null; // Indexes and FX have no logo.
 if(symbol.endsWith('-USD'))return symbol.replace('-USD','USD'); // BTC-USD -> BTCUSD
 return symbol;
}
async function fetchLogo(symbol:string):Promise<Entry|'retry'>{
 const source=sourceSymbol(symbol);if(!source)return null;
 try{
  const r=await fetch(`https://financialmodelingprep.com/image-stock/${encodeURIComponent(source)}.png`,{signal:AbortSignal.timeout(6000)});
  const type=r.headers.get('content-type')||'';
  if(r.status>=500)return 'retry';
  if(!r.ok||!type.startsWith('image/'))return null;
  const body=await r.arrayBuffer();if(body.byteLength<100||body.byteLength>200_000)return null;
  return {body,type};
 }catch{return 'retry'}
}
export async function GET(_request:Request,{params}:{params:Promise<{symbol:string}>}){
 let symbol='';try{symbol=decodeURIComponent((await params).symbol).toUpperCase()}catch{/* Malformed escape: rejected below. */}
 if(!validSymbol(symbol))return new Response(null,{status:400});
 let entry=memory.get(symbol);
 if(entry===undefined){const fetched=await fetchLogo(symbol);if(fetched==='retry')return new Response(null,{status:503,headers:{'Cache-Control':'no-store'}});entry=fetched;memory.set(symbol,entry);while(memory.size>LIMIT)memory.delete(memory.keys().next().value!)}
 if(!entry)return new Response(null,{status:404,headers:headers(false)});
 return new Response(entry.body,{headers:{'Content-Type':entry.type,...headers(true)}});
}
