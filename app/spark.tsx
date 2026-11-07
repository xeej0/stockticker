'use client';
import {useEffect,useState} from 'react';
import type {Quote} from '../lib/market-types';
/** Tiny intraday line for index cards. Shares the server's 60s chart cache. */
export default function Spark({symbol,up}:{symbol:string;up:boolean}){
 const [points,setPoints]=useState<number[]>();
 useEffect(()=>{const controller=new AbortController();const load=()=>fetch(`/api/chart?symbol=${encodeURIComponent(symbol)}&range=1d`,{signal:controller.signal}).then(r=>r.ok?r.json():undefined).then((q?:Quote)=>{if(q?.points?.length)setPoints(q.points.map(p=>p.value))}).catch(()=>{});load();const t=setInterval(()=>{if(!document.hidden)load()},300000);return()=>{controller.abort();clearInterval(t)}},[symbol]);
 if(!points||points.length<2)return <span className="spark spark-empty" aria-hidden="true"/>;
 const w=96,h=34,lo=Math.min(...points),hi=Math.max(...points),span=hi-lo||1;
 const d=points.map((v,i)=>`${i?'L':'M'}${(i/(points.length-1)*w).toFixed(1)},${(h-2-(v-lo)/span*(h-4)).toFixed(1)}`).join('');
 return <svg className="spark" preserveAspectRatio="none" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true"><path d={d} fill="none" stroke={up?'var(--green)':'var(--red)'} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round"/></svg>;
}
