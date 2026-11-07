import {endSession,sameOrigin} from '../../../../lib/server/auth';
import {handle,json} from '../../../../lib/server/account-data';

export async function POST(request:Request){
 return handle(async()=>{
  if(!sameOrigin(request))return json({error:'Invalid request.'},403);
  await endSession();
  return json({ok:true});
 });
}
