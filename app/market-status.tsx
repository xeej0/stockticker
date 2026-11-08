'use client';
import {useEffect,useState} from 'react';
import {describeNext,usMarketSession} from '../lib/market-hours';

/** Live US market session pill: open, pre-market, after hours or closed, with a countdown. */
export default function MarketStatus(){
 const [now,setNow]=useState<number|null>(null);
 useEffect(()=>{setNow(Date.now());const tick=()=>setNow(Date.now());const t=setInterval(tick,15000);document.addEventListener('visibilitychange',tick);return()=>{clearInterval(t);document.removeEventListener('visibilitychange',tick)}},[]);
 if(now===null)return <span className="market-status placeholder" aria-hidden="true"/>;
 const s=usMarketSession(now),next=describeNext(s,now);
 const local=new Date(s.nextChange).toLocaleString(undefined,{weekday:'short',hour:'numeric',minute:'2-digit'});
 const detail=[s.reason,next].filter(Boolean).join(' · ');
 return <span className={'market-status '+s.state} title={`US stocks (NYSE, Nasdaq). Regular hours 9:30 AM to 4 PM ET. ${s.nextLabel} ${local} your time.`}>
  <span className="market-dot"/><strong>{s.label}</strong><span className="market-next">{detail}</span>
 </span>;
}
