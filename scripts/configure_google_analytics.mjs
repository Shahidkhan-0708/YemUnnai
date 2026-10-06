// Produces an ignored Supabase secret file; never prints the Google private key.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const propertyId=process.argv[2],file=process.argv[3]??'supabase/google-analytics-credentials.local';
assert(/^\d{1,20}$/.test(propertyId??''),'Provide the numeric GA4 Property ID.');
const source=JSON.parse(await readFile(file,'utf8'));
assert(source.type==='service_account'&&typeof source.client_email==='string'&&source.client_email.endsWith('.iam.gserviceaccount.com'),'Use the Google service-account JSON key.');
assert(typeof source.private_key==='string'&&source.private_key.includes('-----BEGIN PRIVATE KEY-----'),'The JSON key must contain its private key.');
const account={type:source.type,client_email:source.client_email,private_key:source.private_key};
await mkdir('.tmp',{recursive:true});
await writeFile('.tmp/google-analytics-secrets.local',`GA_PROPERTY_ID=${propertyId}\nGA_SERVICE_ACCOUNT_JSON=${JSON.stringify(account)}\n`,{mode:0o600});
console.log('Private configuration saved to .tmp/google-analytics-secrets.local.');
console.log('Grant Viewer access to the service-account email in the original JSON key.');
