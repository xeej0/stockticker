const number=new Intl.NumberFormat('en-US',{maximumFractionDigits:2});
const abbreviated=new Intl.NumberFormat('en-US',{notation:'compact',maximumFractionDigits:2});
const currencies=new Map<string,Intl.NumberFormat>();
const finite=(value?:number|null):value is number=>value!=null&&Number.isFinite(value);
export function money(value?:number|null,currency='USD'){if(!finite(value))return '—';let formatter=currencies.get(currency);if(!formatter){formatter=new Intl.NumberFormat('en-US',{style:'currency',currency,maximumFractionDigits:2});currencies.set(currency,formatter)}return formatter.format(value)}
export const num=(value?:number|null)=>finite(value)?number.format(value):'—';
export const compact=(value?:number|null)=>finite(value)?abbreviated.format(value):'—';
export const pct=(value?:number|null)=>finite(value)?`${value>=0?'+':''}${value.toFixed(2)}%`:'—';
export const yieldPct=(value?:number|null)=>finite(value)?`${(value*100).toFixed(2)}%`:'—';
export const ratio=(value?:number|null)=>finite(value)?`${value.toFixed(2)}×`:'—';
