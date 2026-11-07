import {createHash,randomBytes,scrypt,timingSafeEqual} from 'node:crypto';
import {cookies,headers} from 'next/headers';
import {query} from './db';
const COOKIE='ticker_session',SESSION_DAYS=60;
// scrypt N=2^15, r=8, p=1: about 32 MiB and tens of ms per hash. Parameters are stored with each hash.
const PARAMS={N:32768,r:8,p:1,maxmem:64*1024*1024};
type Params={N:number;r:number;p:number;maxmem:number};
const derive=(password:string,salt:Buffer,length:number,params:Params)=>new Promise<Buffer>((resolve,reject)=>scrypt(password.normalize('NFKC'),salt,length,params,(error,key)=>error?reject(error):resolve(key)));

export async function hashPassword(password:string){
 const salt=randomBytes(16),key=await derive(password,salt,32,PARAMS);
 return `scrypt$${PARAMS.N}$${PARAMS.r}$${PARAMS.p}$${salt.toString('base64')}$${key.toString('base64')}`;
}
export async function verifyPassword(password:string,stored:string){
 const [kind,N,r,p,salt,key]=stored.split('$');
 if(kind!=='scrypt'||!salt||!key)return false;
 const expected=Buffer.from(key,'base64');
 const actual=await derive(password,Buffer.from(salt,'base64'),expected.length,{N:Number(N),r:Number(r),p:Number(p),maxmem:PARAMS.maxmem});
 return actual.length===expected.length&&timingSafeEqual(actual,expected);
}
// A real hash to check against when the username does not exist, so timing does not reveal which accounts exist.
let dummy:Promise<string>|undefined;
export const dummyHash=()=>(dummy??=hashPassword(randomBytes(12).toString('hex')));

export const USERNAME=/^[a-z0-9][a-z0-9_.-]{2,23}$/;
export function validateCredentials(body:unknown):{username:string;password:string}|string{
 if(!body||typeof body!=='object')return 'Invalid request.';
 const {username,password}=body as Record<string,unknown>;
 if(typeof username!=='string'||typeof password!=='string')return 'Enter a username and password.';
 const name=username.trim().toLowerCase();
 if(!USERNAME.test(name))return 'Usernames are 3 to 24 characters: letters, numbers, dot, dash or underscore.';
 if(password.length<8)return 'Use at least 8 characters for your password.';
 if(password.length>200)return 'That password is too long.';
 return {username:name,password};
}

const sha256=(value:string)=>createHash('sha256').update(value).digest('hex');
/** Only the SHA-256 of the session token is stored, so a database leak does not leak live sessions. */
export async function createSession(userId:string){
 const token=randomBytes(32).toString('base64url'),expires=new Date(Date.now()+SESSION_DAYS*864e5);
 await query('insert into ticker_sessions(token_hash,user_id,expires_at) values($1,$2,$3)',[sha256(token),userId,expires]);
 (await cookies()).set(COOKIE,token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',expires});
 // Occasional cleanup keeps the tables small without a cron job.
 if(Math.random()<.05){
  await query('delete from ticker_sessions where expires_at<now()').catch(()=>{});
  await query("delete from ticker_auth_attempts where at<now()-interval '1 day'").catch(()=>{});
 }
}
export async function currentUser():Promise<{id:string;username:string}|null>{
 const token=(await cookies()).get(COOKIE)?.value;
 if(!token||token.length>100)return null;
 const rows=await query<{id:string;username:string}>('select u.id,u.username from ticker_sessions s join ticker_users u on u.id=s.user_id where s.token_hash=$1 and s.expires_at>now()',[sha256(token)]);
 return rows[0]??null;
}
export async function endSession(){
 const jar=await cookies(),token=jar.get(COOKIE)?.value;
 if(token)await query('delete from ticker_sessions where token_hash=$1',[sha256(token)]).catch(()=>{});
 jar.delete(COOKIE);
}

async function clientIp(){const h=await headers();return (h.get('x-forwarded-for')||'').split(',')[0].trim()||h.get('x-real-ip')||'unknown'}
/** Sliding-window limit stored in Postgres so it holds across serverless instances. */
export async function rateLimited(scope:string,limit:number,minutes:number,extra=''){
 const key=`${scope}:${await clientIp()}${extra?':'+extra:''}`;
 const [{count}]=await query<{count:string}>("select count(*) from ticker_auth_attempts where key=$1 and at>now()-make_interval(mins=>$2)",[key,minutes]);
 if(Number(count)>=limit)return true;
 await query('insert into ticker_auth_attempts(key) values($1)',[key]);
 return false;
}
export async function clearAttempts(scope:string,extra=''){
 await query('delete from ticker_auth_attempts where key=$1',[`${scope}:${await clientIp()}${extra?':'+extra:''}`]);
}

/** Mutating routes require JSON from this origin, which blocks cross-site form posts. */
export function sameOrigin(request:Request){
 const origin=request.headers.get('origin'),host=request.headers.get('host');
 if(!request.headers.get('content-type')?.includes('application/json')||!origin||!host)return false;
 try{return new URL(origin).host===host}catch{return false}
}
