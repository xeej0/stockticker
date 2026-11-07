import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'Ticker — Your market, at a glance',description:'A straightforward stock tracker. Your watchlist, real market quotes, and interactive charts in one quiet place.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
