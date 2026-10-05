import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

// Server-only setup. Secrets are passed to the CLI in its environment, never argv.
const env = { ...process.env };
try {
  for (const line of (await fs.readFile('.env.staging.local', 'utf8')).split(/\r?\n/)) {
    const match = line.match(/^\s*(BREVO_[A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (match) env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
  }
} catch (error) { if (error.code !== 'ENOENT') throw error; }
const required = ['BREVO_SMTP_LOGIN', 'BREVO_SMTP_KEY', 'BREVO_SENDER_EMAIL'];
const missing = required.filter(key => !env[key]?.trim());
if (missing.length) {
  console.error(`Not configured. Add ${missing.join(', ')} to ignored .env.staging.local. No production changes made.`);
  process.exit(2);
}
for (const key of ['BREVO_SMTP_LOGIN', 'BREVO_SENDER_EMAIL']) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(env[key])) throw Error(`${key} must be an email address.`);
}
const rate = Number(env.BREVO_EMAILS_PER_HOUR ?? 60);
if (!Number.isInteger(rate) || rate < 1 || rate > 10000) throw Error('BREVO_EMAILS_PER_HOUR must be an integer from 1 to 10000 within your provider quota.');
const workdir = '.tmp/brevo-smtp-setup';
await fs.mkdir(path.join(workdir, 'supabase'), { recursive: true });
await fs.writeFile(path.join(workdir, 'supabase/config.toml'), `project_id = "YemEmUnnai"
[auth.email.smtp]
enabled = true
host = "smtp-relay.brevo.com"
port = 587
user = ${JSON.stringify(env.BREVO_SMTP_LOGIN)}
pass = "env(BREVO_SMTP_KEY)"
admin_email = ${JSON.stringify(env.BREVO_SENDER_EMAIL)}
sender_name = "YEMUNNAI"
[auth.rate_limit]
email_sent = ${rate}
`);
// Use the existing CLI login that was verified against this production project.
for (const key of Object.keys(env)) if (key.toUpperCase() === 'SUPABASE_ACCESS_TOKEN') delete env[key];
const pathKey = Object.keys(env).find(key => key.toUpperCase() === 'PATH') ?? 'PATH';
env[pathKey] = path.dirname(process.execPath) + path.delimiter + (env[pathKey] ?? '');
const redact = output => String(output ?? '').split(env.BREVO_SMTP_KEY).join('[REDACTED]');
const run = args => {
  const result = spawnSync('supabase.exe', args, { env, windowsHide: true, encoding: 'utf8', timeout: 60000 });
  if (result.error) throw Error(`Supabase CLI failed: ${result.error.code}`);
  process.stdout.write(redact(result.stdout));
  process.stderr.write(redact(result.stderr));
  if (result.status !== 0) process.exit(result.status ?? 1);
};
const common = ['--project-ref', 'hdwpaxgbdrmezwkwumwk', '--workdir', workdir];
run(['config', 'diff', ...common]);
if (!process.argv.includes('--apply')) {
  console.log('Preview only. Run with --apply to configure the reviewed Brevo settings.');
} else {
  run(['config', 'push', ...common, '--yes']);
  console.log('Brevo SMTP configuration applied. Inbox delivery still requires a sign-in email test.');
}
