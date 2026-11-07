import {clearAttempts,createSession,dummyHash,rateLimited,sameOrigin,validateCredentials,verifyPassword} from '../../../../lib/server/auth';
import {query} from '../../../../lib/server/db';
import {handle,json,loadData} from '../../../../lib/server/account-data';

export async function POST(request:Request){
 return handle(async()=>{
  if(!sameOrigin(request))return json({error:'Invalid request.'},403);
  const credentials=validateCredentials(await request.json().catch(()=>null));
  // Same message for every failure so the form never reveals which usernames exist.
  const wrong=json({error:'That username and password don’t match.'},401);
  if(typeof credentials==='string')return wrong;
  // Per network and per account: slows guessing without letting one person lock out another everywhere.
  if(await rateLimited('login',20,15)||await rateLimited('login-user',8,15,credentials.username))return json({error:'Too many attempts. Wait 15 minutes and try again.'},429);
  const rows=await query<{id:string;password_hash:string}>('select id,password_hash from ticker_users where username=$1',[credentials.username]);
  const ok=await verifyPassword(credentials.password,rows[0]?.password_hash??await dummyHash());
  if(!rows[0]||!ok)return wrong;
  await clearAttempts('login-user',credentials.username);
  await createSession(rows[0].id);
  return json({user:{username:credentials.username},data:await loadData(rows[0].id)});
 });
}
