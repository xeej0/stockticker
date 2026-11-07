/**
 * US stock market (NYSE / Nasdaq) session from the clock, so the status is exact to the minute
 * and works before any quote loads. Holidays and 1 PM early closes follow NYSE rules.
 */
export type SessionState='open'|'pre'|'post'|'closed';
export type MarketSession={state:SessionState;label:string;reason?:string;earlyClose:boolean;nextChange:number;nextLabel:string};

const ZONE='America/New_York';
const partsFormat=new Intl.DateTimeFormat('en-US',{timeZone:ZONE,hourCycle:'h23',year:'numeric',month:'numeric',day:'numeric',hour:'numeric',minute:'numeric',second:'numeric'});
function nyParts(ms:number){const p:Record<string,number>={};for(const x of partsFormat.formatToParts(ms))if(x.type!=='literal')p[x.type]=Number(x.value);return p as {year:number;month:number;day:number;hour:number;minute:number;second:number}}
/** Epoch ms for a New York wall-clock time. */
export function nyTime(year:number,month:number,day:number,hour=0,minute=0){
 const guess=Date.UTC(year,month-1,day,hour,minute);
 let ms=guess;for(let i=0;i<2;i++){const p=nyParts(ms);const offset=Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute,p.second)-ms;ms=guess-offset}
 return ms;
}
const weekday=(y:number,m:number,d:number)=>new Date(Date.UTC(y,m-1,d)).getUTCDay();
const nthWeekday=(y:number,m:number,dow:number,n:number)=>1+((dow-weekday(y,m,1)+7)%7)+(n-1)*7;
const lastWeekday=(y:number,m:number,dow:number)=>{const last=new Date(Date.UTC(y,m,0)).getUTCDate();return last-((weekday(y,m,last)-dow+7)%7)};
function easter(y:number){const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),month=Math.floor((h+l-7*m+114)/31),day=(h+l-7*m+114)%31+1;return {month,day}}
const key=(m:number,d:number)=>`${m}-${d}`;
/** Saturday holidays move to Friday, Sunday holidays to Monday. */
function observed(y:number,m:number,d:number,map:Map<string,string>,name:string){const w=weekday(y,m,d);const t=new Date(Date.UTC(y,m-1,d+(w===6?-1:w===0?1:0)));if(t.getUTCFullYear()===y)map.set(key(t.getUTCMonth()+1,t.getUTCDate()),name)}

const cache=new Map<number,{holidays:Map<string,string>;early:Set<string>}>();
export function calendar(y:number){
 const hit=cache.get(y);if(hit)return hit;
 const holidays=new Map<string,string>(),early=new Set<string>();
 // New Year's on a Saturday is not made up on the Friday before (that Friday ends the prior year).
 if(weekday(y,1,1)!==6)observed(y,1,1,holidays,'New Year’s Day');
 holidays.set(key(1,nthWeekday(y,1,1,3)),'Martin Luther King Jr. Day');
 holidays.set(key(2,nthWeekday(y,2,1,3)),'Presidents’ Day');
 const e=easter(y),gf=new Date(Date.UTC(y,e.month-1,e.day-2));holidays.set(key(gf.getUTCMonth()+1,gf.getUTCDate()),'Good Friday');
 holidays.set(key(5,lastWeekday(y,5,1)),'Memorial Day');
 if(y>=2022)observed(y,6,19,holidays,'Juneteenth');
 observed(y,7,4,holidays,'Independence Day');
 holidays.set(key(9,nthWeekday(y,9,1,1)),'Labor Day');
 const thanks=nthWeekday(y,11,4,4);holidays.set(key(11,thanks),'Thanksgiving');
 observed(y,12,25,holidays,'Christmas');
 const w3=weekday(y,7,3);if(w3>=1&&w3<=4)early.add(key(7,3));
 early.add(key(11,thanks+1));
 const w24=weekday(y,12,24);if(w24>=1&&w24<=4)early.add(key(12,24));
 const out={holidays,early};cache.set(y,out);return out;
}
function dayInfo(y:number,m:number,d:number){const w=weekday(y,m,d),c=calendar(y),holiday=c.holidays.get(key(m,d));return {trading:w!==0&&w!==6&&!holiday,reason:w===0||w===6?'Weekend':holiday,early:c.early.has(key(m,d))}}
function nextTradingOpen(y:number,m:number,d:number){for(let i=1;i<15;i++){const t=new Date(Date.UTC(y,m-1,d+i));const ty=t.getUTCFullYear(),tm=t.getUTCMonth()+1,td=t.getUTCDate();if(dayInfo(ty,tm,td).trading)return nyTime(ty,tm,td,9,30)}return nyTime(y,m,d+1,9,30)}

export function usMarketSession(now=Date.now()):MarketSession{
 const p=nyParts(now),{year:y,month:m,day:d}=p,info=dayInfo(y,m,d);
 const open=nyTime(y,m,d,9,30),pre=nyTime(y,m,d,4),close=nyTime(y,m,d,info.early?13:16),post=nyTime(y,m,d,info.early?17:20);
 if(!info.trading)return {state:'closed',label:'Market closed',reason:info.reason,earlyClose:false,nextChange:nextTradingOpen(y,m,d),nextLabel:'Opens'};
 if(now<pre)return {state:'closed',label:'Market closed',earlyClose:info.early,nextChange:open,nextLabel:'Opens'};
 if(now<open)return {state:'pre',label:'Pre-market',earlyClose:info.early,nextChange:open,nextLabel:'Opens'};
 if(now<close)return {state:'open',label:'Market open',reason:info.early?'Early close':undefined,earlyClose:info.early,nextChange:close,nextLabel:'Closes'};
 if(now<post)return {state:'post',label:'After hours',earlyClose:info.early,nextChange:nextTradingOpen(y,m,d),nextLabel:'Opens'};
 return {state:'closed',label:'Market closed',earlyClose:false,nextChange:nextTradingOpen(y,m,d),nextLabel:'Opens'};
}

/** "in 2h 15m" when it's close, otherwise "Mon 9:30 AM ET". */
export function describeNext(session:MarketSession,now=Date.now()){
 const minutes=Math.max(1,Math.ceil((session.nextChange-now)/60000));
 if(minutes<60)return `${session.nextLabel} in ${minutes}m`;
 if(minutes<12*60)return `${session.nextLabel} in ${Math.floor(minutes/60)}h ${minutes%60}m`;
 const sameDay=nyParts(now).day===nyParts(session.nextChange).day,time=new Date(session.nextChange).toLocaleTimeString('en-US',{timeZone:ZONE,hour:'numeric',minute:'2-digit'});
 const tomorrow=nyParts(now+86400000).day===nyParts(session.nextChange).day;
 const day=sameDay?'':tomorrow?'tomorrow ':new Date(session.nextChange).toLocaleDateString('en-US',{timeZone:ZONE,weekday:'short'})+' ';
 return `${session.nextLabel} ${day}${time} ET`;
}
