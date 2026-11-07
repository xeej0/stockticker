import {Pool,type QueryResultRow} from 'pg';
// One small pool per serverless instance. DATABASE_URL is the pooled Neon URL set by
// the Vercel integration; locally, point it at any Postgres.
const globalForDb=globalThis as unknown as {tickerPool?:Pool;tickerMigrated?:Promise<void>};
export class AccountsUnavailable extends Error{constructor(){super('Accounts are not configured.')}}
function pool(){
 if(!process.env.DATABASE_URL)throw new AccountsUnavailable();
 if(!globalForDb.tickerPool){
  const url=new URL(process.env.DATABASE_URL);const local=['localhost','127.0.0.1'].includes(url.hostname);
  // TLS is configured explicitly below; drop libpq-only parameters node-postgres misreads.
  url.searchParams.delete('sslmode');url.searchParams.delete('channel_binding');
  globalForDb.tickerPool=new Pool({connectionString:url.toString(),max:3,idleTimeoutMillis:10_000,connectionTimeoutMillis:8_000,ssl:local?undefined:{rejectUnauthorized:true}});
 }
 return globalForDb.tickerPool;
}
const SCHEMA=`
create table if not exists ticker_users(
 id bigserial primary key,
 username text not null unique,
 password_hash text not null,
 created_at timestamptz not null default now()
);
create table if not exists ticker_sessions(
 token_hash text primary key,
 user_id bigint not null references ticker_users(id) on delete cascade,
 created_at timestamptz not null default now(),
 expires_at timestamptz not null
);
create index if not exists ticker_sessions_user on ticker_sessions(user_id);
create table if not exists ticker_user_data(
 user_id bigint primary key references ticker_users(id) on delete cascade,
 watchlist jsonb not null default '[]',
 alerts jsonb not null default '[]',
 updated_at timestamptz not null default now()
);
create table if not exists ticker_auth_attempts(
 key text not null,
 at timestamptz not null default now()
);
create index if not exists ticker_auth_attempts_key on ticker_auth_attempts(key,at);
`;
function migrate(){
 if(!globalForDb.tickerMigrated)globalForDb.tickerMigrated=pool().query(SCHEMA).then(()=>undefined).catch(error=>{globalForDb.tickerMigrated=undefined;throw error});
 return globalForDb.tickerMigrated;
}
export async function query<T extends QueryResultRow>(text:string,params:unknown[]=[]){
 await migrate();
 return (await pool().query<T>(text,params)).rows;
}
