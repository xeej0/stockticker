import type {SeriesPoint} from './market-types';
export type {SeriesPoint} from './market-types';
export type DailyBar={time:number;close:number};
export type IndicatorKey='sma50'|'sma200';
export const INDICATORS=[{key:'sma50',label:'50-day MA',color:'#628bd0',period:50},{key:'sma200',label:'200-day MA',color:'#b174bd',period:200}] as const;
export function sma(values:number[],period:number):(number|null)[]{let sum=0;return values.map((value,i)=>{sum+=value;if(i>=period)sum-=values[i-period];return i>=period-1?sum/period:null})}
export function alignDaily(rows:DailyBar[],values:(number|null)[],points:SeriesPoint[],intraday=false):SeriesPoint[]{let index=-1;const aligned:SeriesPoint[]=[];for(const point of points){while(index+1<rows.length&&rows[index+1].time<=point.time)index++;const pos=intraday?index-1:index;const value=pos>=0?values[pos]:null;if(value!=null)aligned.push({time:point.time,value})}return aligned}
export function nearestPointIndex(points:SeriesPoint[],time:number){if(!points.length)return 0;let lo=0,hi=points.length-1;while(lo<hi){const mid=Math.floor((lo+hi)/2);if(points[mid].time<time)lo=mid+1;else hi=mid}return lo>0&&time-points[lo-1].time<points[lo].time-time?lo-1:lo}
export function downsample<T>(values:T[],limit=1400):T[]{if(values.length<=limit)return values;return Array.from({length:limit},(_,i)=>values[Math.round(i/(limit-1)*(values.length-1))])}
