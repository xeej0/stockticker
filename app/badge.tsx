'use client';
import {useCallback,useState} from 'react';
type Processed={url:string;dark:boolean}|null;
// Results per symbol for this session: cropped logo, or null when it should fall back to initials.
const processed=new Map<string,Processed>();
const tints=['#edf1ef','#eef2fa','#f6efe6','#efeef8','#f8eeee','#eaf4f2'];
const tint=(symbol:string)=>tints[[...symbol].reduce((a,c)=>a+c.charCodeAt(0),0)%tints.length];
const initials=(symbol:string)=>symbol.replace(/^\^/,'').replace(/-USD$/,'').slice(0,symbol.startsWith('^')?3:2);

/**
 * Normalize a logo: trim transparent padding so every mark fills its tile evenly,
 * pick a dark tile for light marks on transparent backgrounds (white Amazon "a"),
 * and reject wide banners that turn unreadable when squeezed into a square.
 */
function processLogo(img:HTMLImageElement):Processed{
 const scale=Math.min(1,256/Math.max(img.naturalWidth,img.naturalHeight));
 const w=Math.max(1,Math.round(img.naturalWidth*scale)),h=Math.max(1,Math.round(img.naturalHeight*scale));
 const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
 const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)return {url:img.src,dark:false};
 ctx.drawImage(img,0,0,w,h);
 const {data}=ctx.getImageData(0,0,w,h);
 let minX=w,minY=h,maxX=-1,maxY=-1,opaque=0,light=0,transparent=0;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4,a=data[i+3];if(a<24){transparent++;continue}opaque++;const lum=(.2126*data[i]+.7152*data[i+1]+.0722*data[i+2])/255;if(lum>.86)light++;if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y}
 if(!opaque)return null;
 const bw=maxX-minX+1,bh=maxY-minY+1,aspect=bw/bh;
 if(aspect>3||aspect<1/3)return null;
 const dark=transparent/(w*h)>.15&&light/opaque>.6;
 const size=96,pad=size*.1,fit=(size-pad*2)/Math.max(bw,bh);
 const out=document.createElement('canvas');out.width=size;out.height=size;
 const octx=out.getContext('2d');if(!octx)return {url:img.src,dark};
 octx.imageSmoothingQuality='high';
 octx.drawImage(canvas,minX,minY,bw,bh,(size-bw*fit)/2,(size-bh*fit)/2,bw*fit,bh*fit);
 return {url:out.toDataURL('image/png'),dark};
}

export default function Badge({symbol,size}:{symbol:string;size?:number}){
 const [state,setState]=useState<Processed|undefined>(()=>symbol.startsWith('^')?null:processed.get(symbol));
 const style=size?{width:size,height:size}:undefined;
 const finish=useCallback((img:HTMLImageElement)=>{if(processed.has(symbol)){setState(processed.get(symbol));return}let result:Processed;try{result=processLogo(img)}catch{result={url:img.src,dark:false}}processed.set(symbol,result);setState(result)},[symbol]);
 const fail=useCallback(()=>{processed.set(symbol,null);setState(null)},[symbol]);
 // Prerendered images can finish loading before React attaches onLoad; catch those here.
 const attach=useCallback((img:HTMLImageElement|null)=>{if(!img||!img.complete)return;if(img.naturalWidth>0)finish(img);else fail()},[finish,fail]);
 if(state===null)return <span className="stock-badge" style={{...style,background:tint(symbol)}} aria-hidden="true">{initials(symbol)}</span>;
 if(state===undefined)return <span className="stock-badge stock-logo loading" style={style} aria-hidden="true"><img ref={attach} src={`/api/logo/${encodeURIComponent(symbol)}?v=2`} alt="" decoding="async" onLoad={e=>finish(e.currentTarget)} onError={fail}/></span>;
 return <span className={'stock-badge stock-logo'+(state.dark?' on-dark':'')} style={style} aria-hidden="true"><img src={state.url} alt=""/></span>;
}
