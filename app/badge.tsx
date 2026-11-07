'use client';
import {useState} from 'react';
// Remember misses for the session so a symbol without a logo never flickers.
const missing=new Set<string>();
const tints=['#edf1ef','#eef2fa','#f6efe6','#efeef8','#f8eeee','#eaf4f2'];
const tint=(symbol:string)=>tints[[...symbol].reduce((a,c)=>a+c.charCodeAt(0),0)%tints.length];
const initials=(symbol:string)=>symbol.replace(/^\^/,'').replace(/-USD$/,'').slice(0,symbol.startsWith('^')?3:2);
export default function Badge({symbol,size}:{symbol:string;size?:number}){
 const [failed,setFailed]=useState(()=>missing.has(symbol)||symbol.startsWith('^'));
 const style=size?{width:size,height:size}:undefined;
 if(failed)return <span className="stock-badge" style={{...style,background:tint(symbol)}} aria-hidden="true">{initials(symbol)}</span>;
 return <span className="stock-badge stock-logo" style={style} aria-hidden="true"><img src={`/api/logo/${encodeURIComponent(symbol)}`} alt="" loading="lazy" decoding="async" onError={()=>{missing.add(symbol);setFailed(true)}}/></span>;
}
