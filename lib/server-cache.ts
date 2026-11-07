// Bounded cache also shares in-flight requests between concurrent visitors.
export function createCache<T>(ttl:number,limit:number){
 const values=new Map<string,{at:number;data:T}>(),pending=new Map<string,Promise<T>>();
 return {async get(key:string,load:()=>Promise<T>):Promise<T>{const hit=values.get(key);if(hit&&Date.now()-hit.at<ttl)return hit.data;const active=pending.get(key);if(active)return active;const request=load().then(data=>{values.delete(key);values.set(key,{at:Date.now(),data});while(values.size>limit)values.delete(values.keys().next().value!);return data}).finally(()=>pending.delete(key));pending.set(key,request);return request}};
}
