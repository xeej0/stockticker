import {createSession,hashPassword,rateLimited,sameOrigin,validateCredentials} from '../../../../lib/server/auth';
import {query} from '../../../../lib/server/db';
import {cleanData,handle,json,loadData,saveData} from '../../../../lib/server/account-data';

export async function POST(request:Request){
 return handle(async()=>{
  if(!sameOrigin(request))return json({error:'Invalid request.'},403);
  const body=await request.json().catch(()=>null);
  const credentials=validateCredentials(body);
  if(typeof credentials==='string')return json({error:credentials},400);
  if(await rateLimited('signup',5,60))return json({error:'Too many new accounts from this network. Try again later.'},429);
  const hash=await hashPassword(credentials.password);
  const rows=await query<{id:string}>('insert into ticker_users(username,password_hash) values($1,$2) on conflict(username) do nothing returning id',[credentials.username,hash]);
  if(!rows[0])return json({error:'That username is taken. Try another.'},409);
  // Start the account with whatever this browser already has.
  const seed=cleanData((body as Record<string,unknown>).data);
  if(seed)await saveData(rows[0].id,seed);
  await createSession(rows[0].id);
  return json({user:{username:credentials.username},data:await loadData(rows[0].id)});
 });
}
