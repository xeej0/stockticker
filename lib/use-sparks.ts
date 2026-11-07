'use client';
import {useEffect,useState} from 'react';
import type {Spark} from './spark-batch';
/** One request for every sparkline on the page; refreshes every 2 minutes while visible. */
export function useSparks(symbolKey:string){
 const [sparks,setSparks]=useState<Record<string,Spark>>({});
 useEffect(()=>{if(!symbolKey)return;const controller=new AbortController();const load=()=>fetch(`/api/sparks?symbols=${encodeURIComponent(symbolKey)}`,{signal:controller.signal}).then(r=>r.ok?r.json():undefined).then(d=>{if(d?.sparks)setSparks(s=>({...s,...d.sparks}))}).catch(()=>{});load();const t=setInterval(()=>{if(!document.hidden)load()},120_000);return()=>{controller.abort();clearInterval(t)}},[symbolKey]);
 return sparks;
}
