import {readWatchlist,type Stock} from '../market-types';
import {readAlerts,type PriceAlert} from '../alert-types';
import {query} from './db';
import {AccountsUnavailable} from './db';
export type AccountData={watchlist:Stock[];alerts:PriceAlert[];updatedAt:number};

/** Keep only known fields with bounded lengths before anything is stored. */
export function cleanData(body:unknown):{watchlist:Stock[];alerts:PriceAlert[]}|null{
 if(!body||typeof body!=='object')return null;
 const {watchlist,alerts}=body as Record<string,unknown>;
 const list=readWatchlist(watchlist);
 if(!list)return null;
 return {
  watchlist:list.map(s=>({symbol:s.symbol,name:String(s.name).slice(0,120),...(typeof s.type==='string'?{type:s.type.slice(0,20)}:{}),...(typeof s.exchange==='string'?{exchange:s.exchange.slice(0,40)}:{})})),
  alerts:readAlerts(alerts),
 };
}
export async function loadData(userId:string):Promise<AccountData|null>{
 const rows=await query<{watchlist:Stock[];alerts:PriceAlert[];updated_at:Date}>('select watchlist,alerts,updated_at from ticker_user_data where user_id=$1',[userId]);
 return rows[0]?{watchlist:rows[0].watchlist,alerts:rows[0].alerts,updatedAt:rows[0].updated_at.getTime()}:null;
}
export async function saveData(userId:string,data:{watchlist:Stock[];alerts:PriceAlert[]}){
 const rows=await query<{updated_at:Date}>('insert into ticker_user_data(user_id,watchlist,alerts,updated_at) values($1,$2,$3,now()) on conflict(user_id) do update set watchlist=excluded.watchlist,alerts=excluded.alerts,updated_at=now() returning updated_at',[userId,JSON.stringify(data.watchlist),JSON.stringify(data.alerts)]);
 return rows[0].updated_at.getTime();
}
const noStore={'Cache-Control':'private, no-store'};
export const json=(body:unknown,status=200)=>Response.json(body,{status,headers:noStore});
/** Shared error handling: a missing database is a clear 503, anything else a generic 500. */
export async function handle(run:()=>Promise<Response>){
 try{return await run()}
 catch(error){
  if(error instanceof AccountsUnavailable)return json({error:'Accounts are not available right now.'},503);
  console.error('Account route failed',error instanceof Error?error.message:error);
  return json({error:'Something went wrong. Please try again.'},500);
 }
}
