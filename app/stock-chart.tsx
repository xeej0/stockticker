'use client';
import {useEffect,useId,useMemo,useRef,useState} from 'react';
import {nearestPointIndex} from '../lib/indicators';
import type {Quote,SeriesPoint} from '../lib/market-types';
import {money,pct} from '../lib/format';
export type {Quote,Stock} from '../lib/market-types';
export type Overlay={label:string;color:string;points:SeriesPoint[]};
const EMPTY:Overlay[]=[];
const UP='var(--green)',DOWN='var(--red)',BENCH='#8497be';
const top=16,bottom=30,left=4;

/** Measure the rendered box so the SVG draws in real pixels: text and strokes never scale. */
function useSize<T extends HTMLElement>(){
 const ref=useRef<T>(null),[size,setSize]=useState({width:0,height:0});
 useEffect(()=>{const node=ref.current;if(!node)return;const update=()=>{const box=node.getBoundingClientRect();setSize(s=>s.width===Math.round(box.width)&&s.height===Math.round(box.height)?s:{width:Math.round(box.width),height:Math.round(box.height)})};update();const observer=new ResizeObserver(update);observer.observe(node);return()=>observer.disconnect()},[]);
 return [ref,size] as const;
}

/** Pick decimals from the visible span so axis labels stay short and consistent. */
function axisFormatter(span:number,normalized:boolean){
 if(normalized)return (v:number)=>`${v>0?'+':''}${v.toFixed(span<4?1:0)}%`;
 const digits=span>=50?0:span>=1?2:4;
 const f=new Intl.NumberFormat('en-US',{minimumFractionDigits:digits,maximumFractionDigits:digits});
 return (v:number)=>f.format(v);
}

export default function Chart({quote,compare,range,area,overlays=EMPTY,baseline}:{quote:Quote;compare?:Quote;range:string;area:boolean;overlays?:Overlay[];baseline?:number}){
 const [hover,setHover]=useState<number|null>(null),id=useId(),[wrapRef,size]=useSize<HTMLDivElement>();
 useEffect(()=>setHover(null),[quote,range]);
 const width=size.width||800,height=size.height||260,compact=width<520;
 // Paths and scales stay cached while the pointer moves across the chart.
 const model=useMemo(()=>{
  const points=quote.points;if(points.length<2)return null;
  const first=points[0],last=points[points.length-1],normalized=!!compare?.points.length;
  const transform=(v:number)=>normalized?(v/first.value-1)*100:v;
  const values=points.map(p=>transform(p.value));
  const comparison=compare?.points.length?compare.points.map(p=>({time:p.time,value:(p.value/compare.points[0].value-1)*100})):[];
  const lines=overlays.map(o=>({...o,points:o.points.map(p=>({...p,value:transform(p.value)}))}));
  const reference=!normalized&&baseline!=null&&Number.isFinite(baseline)?baseline:undefined;
  let low=Infinity,high=-Infinity;
  for(const value of [...values,...comparison.map(p=>p.value),...lines.flatMap(o=>o.points.map(p=>p.value)),...(reference!==undefined?[reference]:[])]){low=Math.min(low,value);high=Math.max(high,value)}
  const padding=(high-low)*.1||Math.abs(high)*.01||1;low-=padding;high+=padding;
  const format=axisFormatter(high-low,normalized);
  const tickCount=compact?4:5,ticks=Array.from({length:tickCount},(_,i)=>high-(high-low)*i/(tickCount-1));
  const right=Math.max(...ticks.map(t=>format(t).length))*6.4+18;
  const plotWidth=Math.max(10,width-left-right),plotHeight=Math.max(10,height-top-bottom);
  const x=(time:number)=>left+(time-first.time)/(last.time-first.time||1)*plotWidth;
  const y=(value:number)=>top+(high-value)/(high-low)*plotHeight;
  const path=(series:SeriesPoint[])=>series.map((p,i)=>`${i?'L':'M'}${x(p.time).toFixed(1)},${y(p.value).toFixed(1)}`).join('');
  const pricePath=path(points.map((p,i)=>({time:p.time,value:values[i]})));
  const start=reference??first.value;
  const intraday=range==='1d'||range==='5d';
  const dateFormat=new Intl.DateTimeFormat('en-US',range==='1d'?{hour:'numeric',minute:'2-digit',timeZone:quote.timezone}:range==='5d'?{weekday:'short',hour:'numeric',timeZone:quote.timezone}:{month:'short',day:'numeric',year:/^\d+y$/.test(range)||range==='max'?'numeric':undefined});
  const longFormat=new Intl.DateTimeFormat('en-US',intraday?{weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZone:quote.timezone}:{weekday:'short',month:'short',day:'numeric',year:'numeric'});
  const xTicks=(compact?[0,.5,1]:[0,.25,.5,.75,1]).map(f=>points[Math.round(f*(points.length-1))]);
  return {points,values,normalized,comparison,x,y,right,plotWidth,pricePath,comparisonPath:path(comparison),lines:lines.map(line=>({...line,path:path(line.points)})),color:last.value>=start?UP:DOWN,ticks,format,start,reference,xTicks,date:(t:number)=>dateFormat.format(t*1000),longDate:(t:number)=>longFormat.format(t*1000)};
 },[quote,compare,range,overlays,baseline,width,height,compact]);
 if(!model)return <div className="chart-empty">No history available for this range.</div>;
 const {points,values,x,y,color}=model,fill=`${id}-fill`,clip=`${id}-clip`;
 const active=hover!==null?points[hover]:undefined;
 const compareValue=active&&model.comparison.length?model.comparison[nearestPointIndex(model.comparison,active.time)]?.value:undefined;
 const first=points[0],last=points[points.length-1],total=(last.value/model.start-1)*100;
 const label=`${quote.name} price chart. ${money(first.value,quote.currency)} on ${model.longDate(first.time)} to ${money(last.value,quote.currency)} on ${model.longDate(last.time)}, ${pct(total)}. Use arrow keys to inspect points.`;
 function move(event:React.PointerEvent<SVGSVGElement>){const box=event.currentTarget.getBoundingClientRect();const fraction=Math.max(0,Math.min(1,(event.clientX-box.left-left)/model!.plotWidth));setHover(nearestPointIndex(points,first.time+fraction*(last.time-first.time)))}
 function key(event:React.KeyboardEvent<SVGSVGElement>){const step=event.shiftKey?Math.max(1,Math.round(points.length/20)):1;const current=hover??points.length-1;let next:number|undefined;if(event.key==='ArrowLeft')next=Math.max(0,current-step);else if(event.key==='ArrowRight')next=Math.min(points.length-1,current+step);else if(event.key==='Home')next=0;else if(event.key==='End')next=points.length-1;else if(event.key==='Escape'){setHover(null);return}if(next!==undefined){event.preventDefault();setHover(next)}}
 const tipX=active?x(active.time):0,tipLeft=Math.max(0,Math.min(width-170,tipX-85));
 const change=active?(active.value/model.start-1)*100:0;
 return <div className="chart-wrap" ref={wrapRef}>
  {active&&<div className="chart-tooltip" style={{left:tipLeft}}><strong>{money(active.value,quote.currency)} <em className={change<0?'negative':'positive'}>{pct(change)}</em></strong>{compareValue!==undefined&&<span className="tip-compare"><i style={{background:BENCH}}/>S&amp;P 500 {pct(compareValue)}</span>}<span>{model.longDate(active.time)}</span></div>}
  {size.width>0&&<svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label} tabIndex={0} onKeyDown={key} onBlur={()=>setHover(null)} onPointerMove={move} onPointerDown={move} onPointerLeave={()=>setHover(null)}>
  <defs><linearGradient id={fill} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity=".16"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient><clipPath id={clip}><rect x={left} y={top-4} width={model.plotWidth} height={height-top-bottom+8}/></clipPath></defs>
  {model.ticks.map((value,i)=><g key={i}><line x1={left} x2={left+model.plotWidth} y1={y(value)} y2={y(value)} stroke="var(--border)" strokeDasharray="3 5"/><text x={width-4} y={y(value)+4} textAnchor="end" fill="var(--muted)" fontSize="11" className="chart-num">{model.format(value)}</text></g>)}
  {model.reference!==undefined&&<g><line x1={left} x2={left+model.plotWidth} y1={y(model.reference)} y2={y(model.reference)} stroke="var(--muted)" strokeOpacity=".7" strokeDasharray="1 4" strokeLinecap="round" strokeWidth="1.5"/><text x={left+4} y={y(model.reference)-6} fill="var(--muted)" fontSize="10">Prev close {model.format(model.reference)}</text></g>}
  <g clipPath={`url(#${clip})`}>{area&&!model.normalized&&<path d={`${model.pricePath}L${x(last.time).toFixed(1)},${height-bottom}L${left},${height-bottom}Z`} fill={`url(#${fill})`}/>}<path d={model.pricePath} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>{model.normalized&&<path d={model.comparisonPath} fill="none" stroke={BENCH} strokeWidth="1.6" strokeLinejoin="round"/>}{model.lines.map(line=><path key={line.label} data-indicator={line.label} d={line.path} fill="none" stroke={line.color} strokeWidth="1.5"/>)}</g>
  {model.xTicks.map((p,i,all)=><text key={i} x={x(p.time)} y={height-9} textAnchor={i===0?'start':i===all.length-1?'end':'middle'} fill="var(--muted)" fontSize="11">{model.date(p.time)}</text>)}
  {active&&<g><line x1={tipX} x2={tipX} y1={top} y2={height-bottom} stroke="var(--muted)" strokeDasharray="3 3"/>{compareValue!==undefined&&<circle cx={tipX} cy={y(compareValue)} r="3.5" fill={BENCH} stroke="var(--card)" strokeWidth="2"/>}<circle cx={tipX} cy={y(values[hover!])} r="4.5" fill={color} stroke="var(--card)" strokeWidth="2"/></g>}
  </svg>}
 </div>
}
