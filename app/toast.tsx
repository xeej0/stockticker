import type {ReactNode} from 'react';
import {Check,Info,TriangleAlert} from 'lucide-react';
export type NoticeTone='success'|'info'|'error';
export type Notice={text:string;tone:NoticeTone};
const icons={success:Check,info:Info,error:TriangleAlert};
/** Bottom-of-screen notice. Success shows a check; info and error say so with their own icon and color. */
export default function Toast({notice,size=16,children}:{notice:Notice;size?:number;children?:ReactNode}){
 const Icon=icons[notice.tone];
 return <div className={'toast'+(notice.tone==='success'?'':` toast-${notice.tone}`)} role={notice.tone==='error'?'alert':'status'}><Icon size={size}/>{notice.text}{children}</div>;
}
