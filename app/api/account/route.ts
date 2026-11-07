import {currentUser,endSession,rateLimited,sameOrigin,verifyPassword} from '../../../lib/server/auth';
import {query} from '../../../lib/server/db';
import {cleanData,handle,json,loadData,saveData} from '../../../lib/server/account-data';

/** Who is signed in, plus their saved watchlist and alerts. Signed out is a normal 200. */
export async function GET(){
 return handle(async()=>{
  if(!process.env.DATABASE_URL)return json({user:null,available:false});
  const user=await currentUser();
  if(!user)return json({user:null,available:true});
  return json({user:{username:user.username},available:true,data:await loadData(user.id)});
 });
}

/** Replace the saved watchlist and alerts. */
export async function PUT(request:Request){
 return handle(async()=>{
  if(!sameOrigin(request))return json({error:'Invalid request.'},403);
  const user=await currentUser();
  if(!user)return json({error:'Signed out.'},401);
  const raw=await request.text();
  if(raw.length>200_000)return json({error:'That is more data than an account can hold.'},413);
  let body:unknown;try{body=JSON.parse(raw)}catch{return json({error:'Invalid request.'},400)}
  const data=cleanData(body);
  if(!data)return json({error:'Invalid watchlist.'},400);
  return json({updatedAt:await saveData(user.id,data)});
 });
}

/** Delete the account and everything stored with it. Requires the password again. */
export async function DELETE(request:Request){
 return handle(async()=>{
  if(!sameOrigin(request))return json({error:'Invalid request.'},403);
  const user=await currentUser();
  if(!user)return json({error:'Signed out.'},401);
  const body=await request.json().catch(()=>null) as {password?:unknown}|null;
  if(await rateLimited('delete',8,15,user.username))return json({error:'Too many attempts. Wait 15 minutes and try again.'},429);
  const [row]=await query<{password_hash:string}>('select password_hash from ticker_users where id=$1',[user.id]);
  if(typeof body?.password!=='string'||!row||!await verifyPassword(body.password,row.password_hash))return json({error:'That password is not correct.'},401);
  await query('delete from ticker_users where id=$1',[user.id]);
  await endSession();
  return json({ok:true});
 });
}
