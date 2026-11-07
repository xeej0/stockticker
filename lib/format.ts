const number=new Intl.NumberFormat('en-US',{maximumFractionDigits:2});
const abbreviated=new Intl.NumberFormat('en-US',{notation:'compact',maximumFractionDigits:2});
const currencies=new Map<string,Intl.NumberFormat>();
const finite=(value?:number|null):value is number=>value!=null&&Number.isFinite(value);
export function money(value?:number|null,currency='USD'){if(!finite(value))return '—';
 // Yahoo quotes some exchanges in minor units (GBp pence, ZAc cents). Intl reads codes case-insensitively and would show pence as pounds.
 if(currency!==currency.toUpperCase())return `${fixed.format(value)} ${currency}`;
 let formatter=currencies.get(currency);if(!formatter){formatter=new Intl.NumberFormat('en-US',{style:'currency',currency,maximumFractionDigits:2});currencies.set(currency,formatter)}return formatter.format(value)}
export const num=(value?:number|null)=>finite(value)?number.format(value):'—';
export const compact=(value?:number|null)=>finite(value)?abbreviated.format(value):'—';
export const pct=(value?:number|null)=>finite(value)?`${value>=0?'+':''}${value.toFixed(2)}%`:'—';
export const yieldPct=(value?:number|null)=>finite(value)?`${(value*100).toFixed(2)}%`:'—';
export const ratio=(value?:number|null)=>finite(value)?`${value.toFixed(2)}×`:'—';
const fixed=new Intl.NumberFormat('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
/** Signed price change with two decimals, e.g. +1.80 or -235.38. */
export const signed=(value?:number|null)=>finite(value)?`${value>=0?'+':'-'}${fixed.format(Math.abs(value))}`:'—';
