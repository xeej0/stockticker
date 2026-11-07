'use client';
import {useEffect,useRef,useState} from 'react';
import {Bell,BellRing,Check,X} from 'lucide-react';
import {money,pct} from '../lib/format';
import type {PriceAlert} from '../lib/alerts';
type Props={symbol:string;price?:number;currency:string;alerts:PriceAlert[];onAdd:(price:number)=>void;onRemove:(id:string)=>void;onClearTriggered:()=>void;onClose:()=>void};
/** Set a target price; direction is inferred from where it sits relative to the current price. */
export default function AlertPanel({symbol,price,currency,alerts,onAdd,onRemove,onClearTriggered,onClose}:Props){
 const [value,setValue]=useState(''),[permission,setPermission]=useState<NotificationPermission|'unsupported'>('unsupported'),input=useRef<HTMLInputElement>(null),panel=useRef<HTMLDivElement>(null);
 useEffect(()=>{setPermission(typeof Notification==='undefined'?'unsupported':Notification.permission);input.current?.focus()},[]);
 useEffect(()=>{if(price!==undefined&&!value)setValue((price*1.05).toFixed(price<10?4:2))},[price]);// eslint-disable-line react-hooks/exhaustive-deps
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose()};const click=(e:MouseEvent)=>{if(panel.current&&!panel.current.contains(e.target as Node)&&!(e.target as HTMLElement).closest('[data-alert-toggle]'))onClose()};document.addEventListener('keydown',key);document.addEventListener('mousedown',click);return()=>{document.removeEventListener('keydown',key);document.removeEventListener('mousedown',click)}},[onClose]);
 const target=Number.parseFloat(value.replace(/[,$\s]/g,'')),valid=Number.isFinite(target)&&target>0&&price!==undefined&&target!==price;
 const direction=valid?(target>price!?'rises above':'falls below'):undefined,distance=valid?(target/price!-1)*100:undefined;
 const active=alerts.filter(a=>!a.triggeredAt),done=alerts.filter(a=>a.triggeredAt);
 function submit(e:React.FormEvent){e.preventDefault();if(!valid)return;onAdd(target);setValue('')}
 return <div className="alert-panel" ref={panel} role="dialog" aria-label={`Price alerts for ${symbol}`}>
  <div className="alert-panel-head"><strong><Bell size={15}/> Price alert</strong><button className="icon-button" aria-label="Close alerts" onClick={onClose}><X size={15}/></button></div>
  <form onSubmit={submit}><label htmlFor="alert-price">Notify me when {symbol}{direction?` ${direction}`:' reaches'}</label>
   <div className="alert-input"><input id="alert-price" ref={input} inputMode="decimal" autoComplete="off" value={value} onChange={e=>setValue(e.target.value)} aria-describedby="alert-hint"/><button className="primary-button" disabled={!valid}>Set alert</button></div>
   <p id="alert-hint" className="alert-hint">{price===undefined?'Waiting for a live price…':valid?`${pct(distance)} from ${money(price,currency)}`:`Now ${money(price,currency)}`}</p>
  </form>
  {(active.length>0||done.length>0)&&<ul className="alert-list">
   {active.map(a=><li key={a.id}><span><BellRing size={13}/>{a.direction==='above'?'Above':'Below'} <b>{money(a.price,currency)}</b></span><button className="icon-button" aria-label={`Delete alert at ${money(a.price,currency)}`} onClick={()=>onRemove(a.id)}><X size={13}/></button></li>)}
   {done.map(a=><li key={a.id} className="triggered"><span><Check size={13}/>{a.direction==='above'?'Rose above':'Fell below'} <b>{money(a.price,currency)}</b><small>{new Date(a.triggeredAt!).toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}</small></span><button className="icon-button" aria-label="Dismiss" onClick={()=>onRemove(a.id)}><X size={13}/></button></li>)}
   {done.length>1&&<li className="alert-clear"><button onClick={onClearTriggered}>Clear triggered</button></li>}
  </ul>}
  <div className="alert-foot">{permission==='default'?<button onClick={()=>Notification.requestPermission().then(setPermission)}>Turn on browser notifications</button>:permission==='granted'?<span><Check size={12}/> Browser notifications on</span>:permission==='denied'?<span>Notifications are blocked in this browser</span>:null}<span>Checked while Ticker is open</span></div>
 </div>;
}
