'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {readAlerts,MAX_ALERTS,type PriceAlert} from './alert-types';
export {readAlerts,type PriceAlert,ALERTS_STORAGE_KEY} from './alert-types';
import {ALERTS_STORAGE_KEY} from './alert-types';
/** True when the price has reached the target in the alert's direction. */
export const crossed=(alert:Pick<PriceAlert,'direction'|'price'>,price:number)=>alert.direction==='above'?price>=alert.price:price<=alert.price;
function load(){try{return readAlerts(JSON.parse(localStorage.getItem(ALERTS_STORAGE_KEY)||'[]'))}catch{return []}}
function save(alerts:PriceAlert[]){try{localStorage.setItem(ALERTS_STORAGE_KEY,JSON.stringify(alerts))}catch{}}
/** Alerts live in this browser and stay in sync across open tabs. */
export function useAlerts(){
 const [alerts,setAlerts]=useState<PriceAlert[]>([]),ready=useRef(false),current=useRef<PriceAlert[]>([]);
 current.current=alerts;
 useEffect(()=>{setAlerts(load());ready.current=true;const sync=(e:StorageEvent)=>{if(e.key===ALERTS_STORAGE_KEY)setAlerts(load())};window.addEventListener('storage',sync);return()=>window.removeEventListener('storage',sync)},[]);
 const update=useCallback((change:(list:PriceAlert[])=>PriceAlert[])=>setAlerts(list=>{const next=change(list).slice(0,MAX_ALERTS);if(ready.current)save(next);return next}),[]);
 const add=useCallback((symbol:string,price:number,current:number)=>{const alert:PriceAlert={id:Math.random().toString(36).slice(2,10)+Date.now().toString(36),symbol,price,direction:price>=current?'above':'below',createdAt:Date.now()};update(list=>[...list,alert]);return alert},[update]);
 /** Swap in a whole list, e.g. the one saved to an account. */
 const replace=useCallback((list:PriceAlert[])=>update(()=>readAlerts(list)),[update]);
 const remove=useCallback((id:string)=>update(list=>list.filter(a=>a.id!==id)),[update]);
 const clearTriggered=useCallback((symbol?:string)=>update(list=>list.filter(a=>!a.triggeredAt||(symbol!==undefined&&a.symbol!==symbol))),[update]);
 /** Mark alerts that the given prices satisfy; returns the ones that just fired. */
 const check=useCallback((prices:Record<string,number|undefined>)=>{const fired:PriceAlert[]=[];const next=current.current.map(a=>{const price=prices[a.symbol];if(a.triggeredAt||price===undefined||!crossed(a,price))return a;const done={...a,triggeredAt:Date.now(),triggeredPrice:price};fired.push(done);return done});if(fired.length){current.current=next;update(()=>next)}return fired},[update]);
 return {alerts,add,remove,clearTriggered,check,replace};
}
export function notify(title:string,body:string){
 try{if(typeof Notification!=='undefined'&&Notification.permission==='granted')new Notification(title,{body,icon:'/favicon.svg',tag:title})}catch{/* Some browsers only allow notifications from a service worker. */}
}
