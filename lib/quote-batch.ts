import {createCache} from './server-cache';
import {yahooQuotes} from './yahoo-session';
import {validSymbol,type MarketQuote} from './market-types';
const cache=createCache<MarketQuote[]>(60000,80);
const number=(value:unknown)=>typeof value==='number'&&Number.isFinite(value)?value:undefined;
export async function quoteBatch(symbols:string[]){
 const requested=[...new Set(symbols)].sort();if(!requested.length)return [];
 return cache.get(requested.join(','),async()=>{const raw=await yahooQuotes(requested);const wanted=new Set(requested);const result:MarketQuote[]=[];for(const q of raw){if(!validSymbol(q.symbol||'')||!wanted.has(q.symbol))continue;const price=number(q.regularMarketPrice),previous=number(q.regularMarketPreviousClose),change=number(q.regularMarketChange)??(price!==undefined&&previous!==undefined?price-previous:undefined),percent=number(q.regularMarketChangePercent)??(change!==undefined&&previous?change/previous*100:undefined),asOf=number(q.regularMarketTime);if(price===undefined||change===undefined||percent===undefined||asOf===undefined)continue;result.push({symbol:q.symbol,name:q.longName||q.shortName||q.symbol,type:q.quoteType,exchange:q.fullExchangeName||q.exchange,currency:q.currency||'USD',price,change,percent,asOf,marketOpen:q.marketState==='REGULAR',timezone:q.exchangeTimezoneName||'UTC'})}return result});
}
