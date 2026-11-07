import Link from 'next/link';
export default function NotFound(){return <main className="not-found"><h1>That ticker isn’t on the tape<span>.</span></h1><p>The page or symbol you’re looking for doesn’t exist.</p><Link className="primary-button" href="/">Back to my watchlist</Link></main>}
