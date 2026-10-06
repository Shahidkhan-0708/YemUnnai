// Only run with the owner's explicitly designated email and the ignored server env.
import {createClient} from '@supabase/supabase-js';
import {randomBytes} from 'node:crypto';
import {writeFile,access} from 'node:fs/promises';
const email=process.argv[2]?.trim().toLowerCase();
if(!email||!/^\S+@\S+\.\S+$/.test(email))throw Error('Provide the designated admin email only.');
const {SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY}=process.env;
if(!SUPABASE_URL||!SUPABASE_SERVICE_ROLE_KEY)throw Error('Use the ignored server env file.');
const service=createClient(SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const checked=r=>{if(r.error)throw r.error;return r.data;};
let user;
for(let page=1;;page++){const batch=checked(await service.auth.admin.listUsers({page,perPage:1000})).users;user=batch.find(u=>u.email?.toLowerCase()===email);if(user||batch.length<1000)break;}
if(user?.is_anonymous)throw Error('Admin access requires a permanent account.');
if(user){const owned=checked(await service.from('vendors').select('id').eq('owner_id',user.id));if(owned.length)throw Error('Use a separate admin email: this account can be entered through a four-digit seller PIN.');}
let password;
if(!user){
  try{await access(new URL('./admin-credentials.local',import.meta.url));throw Error('A private credential file already exists; review it before creating another admin.');}catch(e){if(e.code!=='ENOENT')throw e;}
  password=randomBytes(24).toString('base64url');user=checked(await service.auth.admin.createUser({email,password,email_confirm:true})).user;
  try{await writeFile(new URL('./admin-credentials.local',import.meta.url),JSON.stringify({url:'https://yemunnai.me/?portal=admin',email,password},null,2),{flag:'wx',mode:0o600});}
  catch(e){await service.auth.admin.deleteUser(user.id);throw e;}
}
checked(await service.from('app_admins').upsert({user_id:user.id}));
console.log(password?'Admin access enabled. Credentials are in ignored supabase/admin-credentials.local.':'Admin access enabled for the existing account. Its password was preserved.');
