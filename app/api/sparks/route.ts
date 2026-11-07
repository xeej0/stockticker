import {sparkBatch} from '../../../lib/spark-batch';
import {validSymbol} from '../../../lib/market-types';
export async function GET(request:Request){
 const value=new URL(request.url).searchParams.get('symbols')||'';
 const symbols=[...new Set(value.split(',').map(s=>s.trim().toUpperCase()).filter(Boolean))];
 if(!symbols.length||symbols.length>104||symbols.some(s=>!validSymbol(s)))return Response.json({error:'Provide 1–104 valid tickers.'},{status:400});
 const sparks=await sparkBatch(symbols);
 return Response.json({sparks},{headers:{'Cache-Control':'public, max-age=60'}});
}
