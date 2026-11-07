/** Tiny intraday line with a faint previous-close baseline. Pure: data comes from /api/sparks. */
export default function Spark({points,previous,width=96,height=34,className='spark'}:{points?:number[];previous?:number;width?:number;height?:number;className?:string}){
 if(!points||points.length<2)return <span className={`${className} spark-empty`} aria-hidden="true"/>;
 const values=previous!=null?[...points,previous]:points,lo=Math.min(...values),hi=Math.max(...values),span=hi-lo||1;
 const y=(v:number)=>(height-2-(v-lo)/span*(height-4)).toFixed(1);
 const d=points.map((v,i)=>`${i?'L':'M'}${(i/(points.length-1)*width).toFixed(1)},${y(v)}`).join('');
 const up=points[points.length-1]>=(previous??points[0]);
 return <svg className={className} preserveAspectRatio="none" width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
  {previous!=null&&<line x1="0" x2={width} y1={y(previous)} y2={y(previous)} stroke="var(--muted)" strokeOpacity=".45" strokeDasharray="2 3" vectorEffect="non-scaling-stroke"/>}
  <path d={d} fill="none" stroke={up?'var(--green)':'var(--red)'} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke"/>
 </svg>;
}
