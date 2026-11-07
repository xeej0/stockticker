'use client';
import {useEffect,useRef,useState} from 'react';
import {Cloud,CloudOff,Eye,EyeOff,LoaderCircle,LogOut,Trash2,UserRound,X} from 'lucide-react';
import type {Account} from '../lib/use-account';
type Props={account:Account;signIn:(mode:'login'|'signup',username:string,password:string)=>Promise<string>;signOut:()=>Promise<void>;deleteAccount:(password:string)=>Promise<void>;onNotice:(text:string)=>void};

function syncLabel(account:Account){
 if(account.sync==='saving')return 'Saving…';
 if(account.sync==='error')return 'Couldn’t sync. Changes are kept here and will retry.';
 if(account.syncedAt)return `Synced ${new Date(account.syncedAt).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})}`;
 return 'Synced';
}

export default function AccountMenu({account,signIn,signOut,deleteAccount,onNotice}:Props){
 const [dialog,setDialog]=useState<'login'|'signup'|'delete'|null>(null),[menu,setMenu]=useState(false),menuRef=useRef<HTMLDivElement>(null);
 useEffect(()=>{if(!menu)return;const close=(e:MouseEvent)=>{if(!menuRef.current?.contains(e.target as Node))setMenu(false)};const key=(e:KeyboardEvent)=>{if(e.key==='Escape')setMenu(false)};document.addEventListener('mousedown',close);document.addEventListener('keydown',key);return()=>{document.removeEventListener('mousedown',close);document.removeEventListener('keydown',key)}},[menu]);
 if(account.status==='loading'||account.status==='unavailable')return null;
 if(account.status==='signed-out')return <><button className="sign-in-button" onClick={()=>setDialog('login')}><UserRound size={16}/><span>Sign in</span></button>{dialog&&<AuthDialog mode={dialog} setMode={setDialog} signIn={signIn} deleteAccount={deleteAccount} onDone={text=>{setDialog(null);onNotice(text)}}/>}</>;
 const name=account.username||'';
 return <div className="account" ref={menuRef}>
  <button className={'avatar'+(account.sync==='error'?' sync-error':'')} aria-label={`Account: ${name}`} aria-expanded={menu} onClick={()=>setMenu(m=>!m)}>{name.slice(0,1).toUpperCase()}{account.sync==='saving'&&<span className="avatar-sync"/>}</button>
  {menu&&<div className="account-menu" role="menu">
   <div className="account-head"><span className="avatar large">{name.slice(0,1).toUpperCase()}</span><div><strong>{name}</strong><small className={account.sync==='error'?'negative':''}>{account.sync==='error'?<CloudOff size={12}/>:<Cloud size={12}/>}{syncLabel(account)}</small></div></div>
   <p>Your watchlist and alerts sync to this account on every device you sign in on.</p>
   <button role="menuitem" onClick={()=>{setMenu(false);void signOut().then(()=>onNotice('Signed out. Your list stays on this browser.'))}}><LogOut size={15}/> Sign out</button>
   <button role="menuitem" className="danger" onClick={()=>{setMenu(false);setDialog('delete')}}><Trash2 size={15}/> Delete account…</button>
  </div>}
  {dialog&&<AuthDialog mode={dialog} setMode={setDialog} signIn={signIn} deleteAccount={deleteAccount} onDone={text=>{setDialog(null);onNotice(text)}}/>}
 </div>;
}

function AuthDialog({mode,setMode,signIn,deleteAccount,onDone}:{mode:'login'|'signup'|'delete';setMode:(m:'login'|'signup'|'delete'|null)=>void;signIn:Props['signIn'];deleteAccount:Props['deleteAccount'];onDone:(text:string)=>void}){
 const [username,setUsername]=useState(''),[password,setPassword]=useState(''),[show,setShow]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),first=useRef<HTMLInputElement>(null),dialogRef=useRef<HTMLElement>(null);
 useEffect(()=>{setError('');first.current?.focus()},[mode]);
 useEffect(()=>{const prior=document.activeElement as HTMLElement|null;const key=(e:KeyboardEvent)=>{if(e.key==='Escape'&&!busy)setMode(null);if(e.key==='Tab'&&dialogRef.current){const nodes=[...dialogRef.current.querySelectorAll<HTMLElement>('button:not(:disabled),input')];const f=nodes[0],l=nodes[nodes.length-1];if(e.shiftKey&&document.activeElement===f){e.preventDefault();l?.focus()}else if(!e.shiftKey&&document.activeElement===l){e.preventDefault();f?.focus()}}};document.addEventListener('keydown',key);return()=>{document.removeEventListener('keydown',key);prior?.focus?.()}},[busy,setMode]);
 const signup=mode==='signup',del=mode==='delete';
 const clientError=del?(password?'':'Enter your password.'):!/^[a-zA-Z0-9][a-zA-Z0-9_.-]{2,23}$/.test(username.trim())?'Usernames are 3 to 24 characters: letters, numbers, dot, dash or underscore.':password.length<8?'Use at least 8 characters for your password.':'';
 async function submit(e:React.FormEvent){
  e.preventDefault();if(clientError){setError(clientError);return}
  setBusy(true);setError('');
  try{
   if(del){await deleteAccount(password);onDone('Account deleted. Your list stays on this browser.')}
   else{const name=await signIn(signup?'signup':'login',username.trim(),password);onDone(signup?`Welcome, ${name}. Your list now syncs.`:`Signed in as ${name}. Your list is synced.`)}
  }catch(err){setError((err as Error).message)}finally{setBusy(false)}
 }
 return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget&&!busy)setMode(null)}}>
  <section className="auth-dialog" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="auth-title">
   <div className="modal-heading"><div><h2 id="auth-title">{del?'Delete your account':signup?'Create an account':'Sign in'}</h2><p>{del?'This removes your account and its synced watchlist and alerts. The copy on this browser stays.':signup?'Optional. Syncs your watchlist and alerts across devices. Your current list comes with you.':'Load your synced watchlist and alerts on this device.'}</p></div><button className="icon-button" aria-label="Close" onClick={()=>setMode(null)} disabled={busy}><X size={19}/></button></div>
   {!del&&<div className="auth-tabs" role="tablist"><button role="tab" aria-selected={!signup} className={!signup?'active':''} onClick={()=>setMode('login')}>Sign in</button><button role="tab" aria-selected={signup} className={signup?'active':''} onClick={()=>setMode('signup')}>Create account</button></div>}
   <form onSubmit={submit} noValidate>
    {!del&&<label className="field"><span>Username</span><input ref={first} value={username} onChange={e=>{setUsername(e.target.value);setError('')}} autoComplete="username" autoCapitalize="none" spellCheck={false} maxLength={24} placeholder="e.g. jamie"/></label>}
    <label className="field"><span>Password</span><span className="password"><input ref={del?first:undefined} type={show?'text':'password'} value={password} onChange={e=>{setPassword(e.target.value);setError('')}} autoComplete={signup?'new-password':'current-password'} maxLength={200} placeholder={signup?'At least 8 characters':''}/><button type="button" className="icon-button" aria-label={show?'Hide password':'Show password'} onClick={()=>setShow(s=>!s)}>{show?<EyeOff size={16}/>:<Eye size={16}/>}</button></span></label>
    {signup&&<p className="auth-note">There’s no email and no password reset, so keep your password somewhere safe (a password manager works well).</p>}
    {error&&<p className="auth-error" role="alert">{error}</p>}
    <button className={'primary-button auth-submit'+(del?' danger':'')} disabled={busy}>{busy&&<LoaderCircle size={15} className="spin"/>}{del?'Delete account':signup?'Create account':'Sign in'}</button>
   </form>
  </section>
 </div>;
}
