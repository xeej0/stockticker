import {yahooSummary} from '../../../lib/yahoo-session';
import {createCache} from '../../../lib/server-cache';
import {validSymbol} from '../../../lib/market-types';
const cache=createCache<Record<string,unknown>>(300000,100);
const raw=(value:any):number|null=>{const n=typeof value==='object'?value?.raw:value;return typeof n==='number'&&Number.isFinite(n)?n:null};
export async function GET(request:Request){
 const symbol=(new URL(request.url).searchParams.get('symbol')||'').toUpperCase();if(!validSymbol(symbol))return Response.json({error:'Invalid ticker.'},{status:400});
 try{const data=await cache.get(symbol,async()=>{const d=await yahooSummary(symbol),s=d.summaryDetail||{},k=d.defaultKeyStatistics||{},p=d.price||{},fund=d.fundProfile||{};
 const metrics:Record<string,number|null>={};for(const key of ['marketCap','trailingPE','forwardPE','dividendYield','beta','averageVolume','totalAssets','yield','navPrice','circulatingSupply','maxSupply','volume24Hr'])metrics[key]=raw(s[key]??k[key]??p[key]);metrics.trailingEps=raw(k.trailingEps);metrics.priceToBook=raw(k.priceToBook);metrics.annualReportExpenseRatio=raw(k.annualReportExpenseRatio??fund.feesExpensesInvestment?.annualReportExpenseRatio);
 return {symbol,name:p.longName||p.shortName||symbol,type:p.quoteType||'EQUITY',currency:p.currency||s.currency||'USD',metrics,updatedAt:Date.now(),source:'Yahoo Finance'};});return Response.json(data,{headers:{'Cache-Control':'public, max-age=120'}})}catch{return Response.json({error:'Metrics are temporarily unavailable.'},{status:503})}
}
