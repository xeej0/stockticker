import type {Metadata,Viewport} from 'next';
import './globals.css';
export const metadata:Metadata={title:'Ticker · Your market, at a glance',description:'A straightforward stock tracker. Your watchlist, real market quotes, and interactive charts in one quiet place.',icons:{icon:'/favicon.svg'}};
export const viewport:Viewport={themeColor:[{media:'(prefers-color-scheme: light)',color:'#ffffff'},{media:'(prefers-color-scheme: dark)',color:'#19251e'}]};
// Runs before first paint: saved choice wins, otherwise follow the system setting. Avoids a light flash in dark mode.
const themeScript=`try{var t=localStorage.getItem('ticker-theme');if(t!=='dark'&&t!=='light')t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=t}catch(e){}`;
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{__html:themeScript}}/></head><body>{children}</body></html>}
