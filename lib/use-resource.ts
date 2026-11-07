'use client';
import {useEffect,useState} from 'react';
export async function fetchJson<T>(url:string,signal?:AbortSignal):Promise<T>{
 const controller=new AbortController();let timedOut=false;
 const abort=()=>controller.abort();if(signal?.aborted)abort();else signal?.addEventListener('abort',abort,{once:true});
 const timer=setTimeout(()=>{timedOut=true;controller.abort()},20000);
 try{const response=await fetch(url,{signal:controller.signal});const data=await response.json() as T&{error?:string};if(!response.ok)throw Error(data.error||'Market data unavailable.');return data}
 catch(error){if(timedOut&&!signal?.aborted)throw Error('Market data took too long to respond. Please try again.');throw error}
 finally{clearTimeout(timer);signal?.removeEventListener('abort',abort)}
}
export function useResource<T>(url:string|null,refresh=0,poll=0){
 const [data,setData]=useState<T>(),[error,setError]=useState(''),[loading,setLoading]=useState(!!url);
 useEffect(()=>{const controller=new AbortController();setData(undefined);setError('');setLoading(!!url);if(!url)return;let busy=false;async function load(){if(busy)return;busy=true;try{const value=await fetchJson<T>(url!,controller.signal);if(!controller.signal.aborted){setData(value);setError('')}}catch(e){if(!controller.signal.aborted)setError((e as Error).message)}finally{busy=false;if(!controller.signal.aborted)setLoading(false)}}void load();const timer=poll?setInterval(()=>{if(!document.hidden)void load()},poll):undefined;return()=>{controller.abort();if(timer)clearInterval(timer)}},[url,refresh,poll]);
 return {data,error,loading};
}
