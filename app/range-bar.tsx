import {num} from '../lib/format';
const two=new Intl.NumberFormat('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const fmt=(v?:number)=>v==null?'—':two.format(v);
/** Low/high with a marker for the current price: easier to read than two bare numbers. */
export default function RangeBar({low,high,value,label}:{low?:number;high?:number;value?:number;label:string}){
 const ok=[low,high,value].every(v=>typeof v==='number'&&Number.isFinite(v))&&high!>low!;
 if(!ok)return <strong>{low!=null&&high!=null?`${num(low)} – ${num(high)}`:'—'}</strong>;
 const position=Math.max(0,Math.min(100,(value!-low!)/(high!-low!)*100));
 return <span className="range-bar" role="img" aria-label={`${label}: ${num(low)} to ${num(high)}, current ${num(value)} (${Math.round(position)}% of range)`}>
  <span className="range-bar-values"><strong>{fmt(low)}</strong><strong>{fmt(high)}</strong></span>
  <span className="range-bar-track"><span className="range-bar-fill" style={{width:`${position}%`}}/><span className="range-bar-dot" style={{left:`${position}%`}}/></span>
 </span>;
}
