'use client';
import {useEffect,useState} from 'react';
import {defaultWatchlist,WATCHLIST_STORAGE_KEY} from './default-watchlist';
import {readWatchlist,type Stock} from './market-types';
export function useWatchlist(){const [watch,setWatch]=useState<Stock[]>(defaultWatchlist),[ready,setReady]=useState(false);useEffect(()=>{try{const saved=readWatchlist(JSON.parse(localStorage.getItem(WATCHLIST_STORAGE_KEY)||'null'));if(saved)setWatch(saved)}catch{}setReady(true)},[]);useEffect(()=>{if(ready)try{localStorage.setItem(WATCHLIST_STORAGE_KEY,JSON.stringify(watch))}catch{}},[watch,ready]);return {watch,setWatch,ready}}
/** The inline script in layout.tsx sets data-theme before paint, so read it back instead of guessing. */
export function useTheme(){const [dark,setDark]=useState(false),[ready,setReady]=useState(false);useEffect(()=>{setDark(document.documentElement.dataset.theme==='dark');setReady(true)},[]);useEffect(()=>{if(!ready)return;document.documentElement.dataset.theme=dark?'dark':'light';try{localStorage.setItem('ticker-theme',dark?'dark':'light')}catch{}},[dark,ready]);return {dark,setDark}}
