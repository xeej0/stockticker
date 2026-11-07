// Yahoo's anonymous guest session is kept in server memory only.
type Session={cookie:string;crumb:string;at:number};
let session:Session|undefined, pending:Promise<Session>|undefined;
async function initialize():Promise<Session>{
 const response=await fetch('https://fc.yahoo.com',{redirect:'manual',headers:{'User-Agent':'Mozilla/5.0'},signal:AbortSignal.timeout(10000)});
 const headers=response.headers as Headers&{getSetCookie?:()=>string[]};
 const lines=headers.getSetCookie?.()||((headers.get('set-cookie')||'').split(/,(?=\s*[^;,=]+=[^;,]+)/));
 const cookie=lines.map(line=>line.trim().split(';')[0]).filter(Boolean).join('; ');
 if(!cookie)throw Error('Market-data session unavailable.');
 for(const host of ['query2','query1']){
  const r=await fetch(`https://${host}.finance.yahoo.com/v1/test/getcrumb`,{headers:{'User-Agent':'Mozilla/5.0',Cookie:cookie},signal:AbortSignal.timeout(10000)});
  const crumb=(await r.text()).trim();if(r.ok&&crumb.length>0&&crumb.length<100&&!crumb.includes('<')&&!crumb.includes('{'))return {cookie,crumb,at:Date.now()};
 }
 throw Error('Market-data session unavailable.');
}
async function getSession(){if(session&&Date.now()-session.at<1800000)return session;if(!pending)pending=initialize().then(value=>{session=value;return value}).finally(()=>{pending=undefined});return pending}
async function yahooJson(path:string,input:Record<string,string>):Promise<any>{
 for(let attempt=0;attempt<2;attempt++){
  const auth=await getSession();
  for(const host of ['query2','query1'])try{
   const params=new URLSearchParams({...input,crumb:auth.crumb});
   const r=await fetch(`https://${host}.finance.yahoo.com${path}?${params}`,{headers:{'User-Agent':'Mozilla/5.0',Cookie:auth.cookie,Accept:'application/json'},signal:AbortSignal.timeout(12000)});
   if(r.status===401||r.status===403)continue;if(!r.ok)continue;
   const data:any=await r.json();if(!data.finance?.error&&!data.quoteSummary?.error&&!data.quoteResponse?.error)return data;
  }catch{/* Try the other provider host. */}
  session=undefined;
 }
 throw Error('Market data temporarily unavailable.');
}
export async function yahooSummary(symbol:string){const data=await yahooJson(`/v10/finance/quoteSummary/${encodeURIComponent(symbol)}`,{modules:'price,summaryDetail,defaultKeyStatistics,fundProfile'});const result=data.quoteSummary?.result?.[0];if(!result)throw Error('Fundamentals unavailable.');return result}
export async function yahooQuotes(symbols:string[]){const data=await yahooJson('/v7/finance/quote',{symbols:symbols.join(',')});const quotes=data.quoteResponse?.result;if(!Array.isArray(quotes))throw Error('Quotes unavailable.');return quotes}
