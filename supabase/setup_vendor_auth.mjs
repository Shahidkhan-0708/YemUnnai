/** Run after the migration: node --env-file=supabase/.env.server.local supabase/setup_vendor_auth.mjs */
import { createClient } from '@supabase/supabase-js';
import { randomBytes, randomInt } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { VENDOR_OUTLETS } from '../src/lib/vendorAuth.ts';

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the server environment.');
const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const pinFile = new URL('./vendor-pins.local', import.meta.url);
const emails = { 'MITS Canteen':'mitscanteen', 'MITS Cafe':'mitscafe', 'MITS Hub':'newcafe', 'Pizza And Pasta (P2)':'p2', 'Paradise':'paradise', 'Mallikarjuna Mess':'mallikarjuna' };
const requested = process.argv.slice(2);
const outlets = requested.length ? VENDOR_OUTLETS.filter(outlet => requested.includes(outlet.id)) : VENDOR_OUTLETS;
if (requested.length && outlets.length !== new Set(requested).size) throw new Error('Unknown outlet ID');
let pins;
try { pins = JSON.parse(await readFile(pinFile, 'utf8')); }
catch (error) {
  if (error.code !== 'ENOENT') throw error;
  pins = VENDOR_OUTLETS.map(outlet => ({ ...outlet, pin: String(randomInt(10000)).padStart(4, '0') }));
  await writeFile(pinFile, JSON.stringify(pins, null, 2), { flag: 'wx', mode: 0o600 });
}
const users = [];
for (const outlet of outlets) {
  const existing=pins.find(entry => entry.id === outlet.id);
  if (existing) existing.name=outlet.name;
  else pins.push({ ...outlet, pin: String(randomInt(10000)).padStart(4, '0') });
}
await writeFile(pinFile, JSON.stringify(pins, null, 2), { mode: 0o600 });
for (let page = 1; ; page++) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
  if (error) throw new Error('Could not list vendor accounts.');
  users.push(...data.users);
  if (data.users.length < 100) break;
}
for (const outlet of outlets) {
  const pin = pins.find(entry => entry.id === outlet.id)?.pin;
  if (typeof pin !== 'string' || !/^\d{4}$/.test(pin)) throw new Error(`Invalid private PIN for ${outlet.name}.`);
  const email = `${emails[outlet.name]}@yemunnai.app`;
  const password = randomBytes(32).toString('base64url');
  let user = users.find(candidate => candidate.email === email);
  if (!user) {
    const result = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    if (result.error || !result.data.user) throw new Error(`Could not provision ${outlet.name}.`);
    user = result.data.user;
  } else {
    const result = await admin.auth.admin.updateUserById(user.id, { password, email_confirm: true });
    if (result.error) throw new Error(`Could not retire the old password for ${outlet.name}.`);
  }
  const { error } = await admin.rpc('provision_vendor_pin', { p_outlet_id: outlet.id, p_user_id: user.id, p_pin: pin });
  if (error) throw new Error(`Could not link ${outlet.name}; check ownership before retrying.`);
  console.log(`${outlet.name}: account linked and private PIN configured.`);
}
console.log('Private PINs are in supabase/vendor-pins.local (ignored by git). Keep this file private.');
