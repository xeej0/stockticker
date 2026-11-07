import {validSymbol} from './market-types';
export type PriceAlert={id:string;symbol:string;direction:'above'|'below';price:number;createdAt:number;triggeredAt?:number;triggeredPrice?:number};
export const ALERTS_STORAGE_KEY='ticker-alerts-v1';
export const MAX_ALERTS=200;
export function readAlerts(value:unknown):PriceAlert[]{
 if(!Array.isArray(value))return [];
 return value.filter((a):a is PriceAlert=>a&&typeof a.id==='string'&&typeof a.symbol==='string'&&validSymbol(a.symbol)&&(a.direction==='above'||a.direction==='below')&&typeof a.price==='number'&&Number.isFinite(a.price)&&a.price>0&&a.id.length<=40).slice(0,MAX_ALERTS).map(a=>({id:a.id,symbol:a.symbol,direction:a.direction,price:a.price,createdAt:Number(a.createdAt)||Date.now(),...(typeof a.triggeredAt==='number'?{triggeredAt:a.triggeredAt}:{}),...(typeof a.triggeredPrice==='number'?{triggeredPrice:a.triggeredPrice}:{})}));
}
