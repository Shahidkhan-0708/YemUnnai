import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import ts from 'typescript';
const source=await fs.readFile('src/lib/pickup.ts','utf8');
let sequence=0;
globalThis.window={location:{origin:'https://yemunnai.test'},dispatchEvent(){}};
async function harness({session=null,error=null,paused=null}={}){
 const calls=[];
 const auth={getSession:async()=>({data:{session},error:null}),updateUser:async(...args)=>{calls.push(['update',...args]);if(paused)await paused;return{error};},signInWithOtp:async(...args)=>{calls.push(['otp',...args]);if(paused)await paused;return{error};}};
 globalThis.__emailEnv={client:{auth},storage:new Map()};
 const modified=source.replace(/^import .*;\r?\n/gm,'');
 const code=ts.transpileModule(`const env=globalThis.__emailEnv;const buyerSupabase=env.client,supabase=null,safeStorage={getItem:k=>env.storage.get(k)??null};\n${modified}\n// ${sequence++}`,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2023}}).outputText;
 const module=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
 return{module,calls};
}
let h=await harness();await h.module.requestBuyerEmail('  person@example.test  ',false);assert.equal(h.calls[0][0],'otp');assert.equal(h.calls[0][1].options.shouldCreateUser,true,'A new visitor registers without anonymous sign-in');assert.equal(h.calls[0][1].email,'person@example.test');await assert.rejects(h.module.requestBuyerEmail('person@example.test',false),e=>e.code==='email_rate_limited');assert.equal(h.calls.length,1);
h=await harness({session:{user:{id:'guest',is_anonymous:true}}});await h.module.requestBuyerEmail('person@example.test',false);assert.equal(h.calls[0][0],'update','Link preserves the existing guest account');
h=await harness();await h.module.requestBuyerEmail('person@example.test',true);assert.equal(h.calls[0][1].options.shouldCreateUser,false,'Existing-account sign in cannot silently create a new account');
for(const [code,expected,status] of [['signup_disabled','email_account_not_found',422],['email_address_not_authorized','email_delivery_unavailable',403],['email_address_invalid','email_invalid',422],['email_exists','email_already_linked',422],['otp_disabled','email_signin_unavailable',403],['over_email_send_rate_limit','email_rate_limited',429]]){
 h=await harness({error:{code,status}});await assert.rejects(h.module.requestBuyerEmail('person@example.test',true),e=>e.code===expected);
}
let release;h=await harness({paused:new Promise(resolve=>release=resolve)});const pending=h.module.requestBuyerEmail('person@example.test',true);await assert.rejects(h.module.requestBuyerEmail('other@example.test',true),e=>e.code==='email_request_in_progress');release();await pending;assert.equal(h.calls.length,1);
h=await harness();await assert.rejects(h.module.requestBuyerEmail('invalid',false),e=>e.code==='email_invalid');assert.equal(h.calls.length,0);
console.log('PASS: email registration without anonymous Auth, guest identity preservation, existing-only sign-in, delivery/registration/rate-limit errors, cooldown, validation and cross-form submission lock.');
