export async function GET(req:Request){
 const q=(new URL(req.url).searchParams.get('q')||'').trim().slice(0,80);
 if(!q)return Response.json({quotes:[]});
 for(const host of ['query2','query1'])try{
 const r=await fetch(`https://${host}.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=12&newsCount=0`,{headers:{'User-Agent':'Mozilla/5.0'},signal:AbortSignal.timeout(7000)});
 if(!r.ok)continue; const d:any=await r.json();return Response.json({quotes:(d.quotes||[]).filter((x:any)=>x.symbol&&['EQUITY','ETF','INDEX','MUTUALFUND','CRYPTOCURRENCY'].includes(x.quoteType)).map((x:any)=>({symbol:x.symbol,name:x.shortname||x.longname||x.symbol,exchange:x.exchDisp||x.exchange,type:x.quoteType}))});
 }catch{}
 return Response.json({quotes:[],unavailable:true});
}
