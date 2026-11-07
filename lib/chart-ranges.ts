export const CHART_RANGES=[['1d','1D'],['5d','1W'],['1mo','1M'],['6mo','6M'],['ytd','YTD'],['1y','1Y'],['3y','3Y'],['5y','5Y'],['10y','10Y'],['max','ALL']] as const;
export type ChartRange=typeof CHART_RANGES[number][0];
export const isChartRange=(range:string):range is ChartRange=>CHART_RANGES.some(([key])=>key===range);
export const INTERVALS:Record<ChartRange,string>={'1d':'5m','5d':'30m','1mo':'1d','6mo':'1d','ytd':'1d','1y':'1d','3y':'1wk','5y':'1wk','10y':'1wk','max':'1mo'};
export function cutoffForRange(range:ChartRange,now=new Date()){const cutoff=new Date(now);if(range==='max')return 0;if(range==='ytd'){cutoff.setUTCMonth(0,1);cutoff.setUTCHours(0,0,0,0)}else if(range.endsWith('y'))cutoff.setUTCFullYear(cutoff.getUTCFullYear()-parseInt(range,10));else if(range.endsWith('mo'))cutoff.setUTCMonth(cutoff.getUTCMonth()-parseInt(range,10));else cutoff.setUTCDate(cutoff.getUTCDate()-(range==='5d'?5:1));return Math.floor(cutoff.getTime()/1000)}
