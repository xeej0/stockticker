import {notFound} from 'next/navigation';
import StockPage from './stock-page';
// Route params arrive still percent-encoded (links use encodeURIComponent, so ^GSPC is %5EGSPC).
const decode=(value:string)=>{try{return decodeURIComponent(value)}catch{return ''}};
export async function generateMetadata({params}:{params:Promise<{symbol:string}>}){const {symbol}=await params;return {title:`${decode(symbol).toUpperCase()} · Stock details · Ticker`}}
export default async function Page({params}:{params:Promise<{symbol:string}>}){const {symbol:input}=await params;const symbol=decode(input).toUpperCase().replace(/^BRK\.B$/,'BRK-B');if(!/^[A-Z0-9^=._-]{1,24}$/.test(symbol))notFound();return <StockPage symbol={symbol}/>}
