'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import type {Stock} from './market-types';
import type {PriceAlert} from './alert-types';
type Data={watchlist:Stock[];alerts:PriceAlert[];updatedAt:number};
export type SyncState='idle'|'saving'|'saved'|'error';
export type Account={status:'loading'|'unavailable'|'signed-out'|'signed-in';username?:string;sync:SyncState;syncedAt?:number};
type Options={watch:Stock[];setWatch:(list:Stock[])=>void;alerts:PriceAlert[];replaceAlerts:(list:PriceAlert[])=>void;ready:boolean};

async function send(url:string,method:string,body?:unknown){
 const response=await fetch(url,{method,headers:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),credentials:'same-origin'});
 const data=await response.json().catch(()=>({}));
 if(!response.ok)throw Object.assign(Error(data.error||'Something went wrong. Please try again.'),{status:response.status});
 return data;
}
const snapshot=(watchlist:Stock[],alerts:PriceAlert[])=>JSON.stringify({watchlist,alerts});

/**
 * Optional account sync. Signed out, everything stays in this browser as before.
 * Signed in, the account copy is loaded once, then every change is saved (debounced),
 * and returning to the tab pulls changes made on another device.
 */
export function useAccount({watch,setWatch,alerts,replaceAlerts,ready}:Options){
 const [account,setAccount]=useState<Account>({status:'loading',sync:'idle'});
 const synced=useRef<string|null>(null),updatedAt=useRef(0),latest=useRef({watch,alerts});
 latest.current={watch,alerts};
 const apply=useCallback((data:Data|null|undefined)=>{
  if(!data){synced.current=null;return}
  updatedAt.current=data.updatedAt;
  synced.current=snapshot(data.watchlist,data.alerts);
  setWatch(data.watchlist);replaceAlerts(data.alerts);
  setAccount(a=>({...a,sync:'saved',syncedAt:data.updatedAt}));
 },[setWatch,replaceAlerts]);
 const signedIn=(username:string,data:Data|null|undefined)=>{setAccount({status:'signed-in',username,sync:'idle'});apply(data);if(!data)synced.current=''};

 // Load the session once the local watchlist has been read, so account data wins over it.
 useEffect(()=>{if(!ready)return;let active=true;
  send('/api/account','GET').then(d=>{if(!active)return;if(!d.available)setAccount({status:'unavailable',sync:'idle'});else if(d.user)signedIn(d.user.username,d.data);else setAccount({status:'signed-out',sync:'idle'})}).catch(()=>{if(active)setAccount({status:'unavailable',sync:'idle'})});
  return()=>{active=false}},[ready]);// eslint-disable-line react-hooks/exhaustive-deps

 // Save changes while signed in.
 useEffect(()=>{
  if(account.status!=='signed-in'||synced.current===null)return;
  const next=snapshot(watch,alerts);if(next===synced.current)return;
  setAccount(a=>({...a,sync:'saving'}));
  const timer=setTimeout(()=>{send('/api/account','PUT',{watchlist:watch,alerts}).then(d=>{synced.current=next;updatedAt.current=d.updatedAt;setAccount(a=>({...a,sync:'saved',syncedAt:d.updatedAt}))}).catch(e=>{if(e.status===401)setAccount({status:'signed-out',sync:'idle'});else setAccount(a=>({...a,sync:'error'}))})},700);
  return()=>clearTimeout(timer);
 },[watch,alerts,account.status]);

 // Pull changes from other devices when the tab comes back, unless there are unsaved local edits.
 useEffect(()=>{if(account.status!=='signed-in')return;
  const pull=()=>{if(document.hidden)return;const {watch:w,alerts:a}=latest.current;if(synced.current!==snapshot(w,a))return;send('/api/account','GET').then(d=>{if(!d.user){setAccount({status:'signed-out',sync:'idle'});return}if(d.data&&d.data.updatedAt>updatedAt.current)apply(d.data)}).catch(()=>{})};
  document.addEventListener('visibilitychange',pull);window.addEventListener('focus',pull);
  return()=>{document.removeEventListener('visibilitychange',pull);window.removeEventListener('focus',pull)}},[account.status,apply]);

 const signIn=useCallback(async(mode:'login'|'signup',username:string,password:string)=>{
  const {watch:w,alerts:a}=latest.current;
  const d=await send(mode==='login'?'/api/auth/login':'/api/auth/signup','POST',mode==='signup'?{username,password,data:{watchlist:w,alerts:a}}:{username,password});
  signedIn(d.user.username,d.data);return d.user.username as string;
 },[]);// eslint-disable-line react-hooks/exhaustive-deps
 const signOut=useCallback(async()=>{await send('/api/auth/logout','POST',{}).catch(()=>{});synced.current=null;setAccount({status:'signed-out',sync:'idle'})},[]);
 const deleteAccount=useCallback(async(password:string)=>{await send('/api/account','DELETE',{password});synced.current=null;setAccount({status:'signed-out',sync:'idle'})},[]);
 return {account,signIn,signOut,deleteAccount};
}
