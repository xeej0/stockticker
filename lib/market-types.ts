export type Stock={symbol:string;name:string;type?:string;exchange?:string};
export type SeriesPoint={time:number;value:number};
export type MarketQuote=Stock&{price:number;currency:string;change:number;percent:number;asOf:number;marketOpen:boolean;timezone:string};
export type Quote=MarketQuote&{previous:number;high:number;low:number;yearHigh:number;yearLow:number;volume:number;points:SeriesPoint[];range:string};
export const validSymbol=(symbol:string)=>/^[A-Z0-9^=._-]{1,24}$/.test(symbol);
export function readWatchlist(value:unknown):Stock[]|undefined{return Array.isArray(value)?value.filter((s):s is Stock=>s&&typeof s.symbol==='string'&&validSymbol(s.symbol)&&typeof s.name==='string').slice(0,100):undefined}
