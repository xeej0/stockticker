# Ticker

A quiet stock tracker: your watchlist, live quotes, and interactive charts in one place.
Live at **https://ticker.xeej.app** (Vercel project `ticker-stock-desk`).

## Features

- Watchlist saved in the browser (no account), with CSV import and export
- Click any row to chart it; arrow keys move through the list; sort any column both ways
- Ranges from 1D to ALL, S&P 500 comparison, previous-close baseline on intraday charts
- Chart scrubbing by mouse, touch, or keyboard (arrows, Shift+arrows, Home/End)
- Company logos, intraday sparklines on every watchlist row and index card
- Price alerts: set a target on any symbol; a toast and optional browser notification fire when it is reached (checked while Ticker is open, synced across tabs)
- Stock detail pages with 50/200-day moving averages and key metrics for stocks, ETFs, and crypto
- Market movers: daily winners, losers, and trending symbols
- Light and dark themes, following your system setting until you choose

## Development

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # unit tests for lib/ (node:test)
npm run typecheck
npm run build
```

Requires Node 22.13+.

## Layout

- `app/page.tsx`: watchlist and detail desk
- `app/stock/[symbol]/`: stock detail page
- `app/stock-chart.tsx`: SVG chart, measured to real pixels so text and lines never scale
- `app/api/*`: server routes that proxy and cache Yahoo Finance
- `lib/`: formatting, indicators, caching, and shared types

Market data comes from Yahoo Finance and may be delayed.
