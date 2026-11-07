import {notFound} from 'next/navigation';
import StockPage from './stock-page';
export async function generateMetadata({params}:{params:Promise<{symbol:string}>}){const {symbol}=await params;return {title:`${symbol.toUpperCase()} · Stock details · Ticker`}}
export default async function Page({params}:{params:Promise<{symbol:string}>}){const {symbol:input}=await params;const symbol=input.toUpperCase().replace(/^BRK\.B$/,'BRK-B');if(!/^[A-Z0-9^=._-]{1,24}$/.test(symbol))notFound();return <StockPage symbol={symbol}/>}
