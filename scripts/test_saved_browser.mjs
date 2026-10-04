import { runPickupBrowser, mockPickupTransport } from './test_pickup_browser.mjs';

const bootstrap = function (mode) {
  localStorage.setItem('yemunnai-intro-seen', 'true');
  localStorage.setItem('yemunnai_saved_items', '["b0000000-0000-4000-8000-000000000003"]');
  const session = JSON.parse(localStorage.getItem('yemunnai-buyer-auth'));
  if (mode === 'account') {
    session.user.is_anonymous = false;
    session.user.email_confirmed_at = '2026-10-04T00:00:00Z';
  } else {
    session.expires_at = 1; session.refresh_token = 'invalid-refresh-token';
  }
  localStorage.setItem('yemunnai-buyer-auth', JSON.stringify(session));
  window.__savedReads = 0; window.__savedTablePresent = false; window.__savedCloud = [];
  const original = window.fetch;
  window.fetch = async (resource, options = {}) => {
    const url = typeof resource === 'string' ? resource : resource.url;
    const reply = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });
    if (mode === 'guest' && url.includes('/auth/v1/token')) return reply({ code: 'refresh_token_not_found', message: 'Invalid Refresh Token: Refresh Token Not Found' }, 400);
    if (url.includes('/rest/v1/saved_items')) {
      window.__savedReads++;
      if (!window.__savedTablePresent) return reply({ code: 'PGRST205', message: "Could not find the table 'public.saved_items' in the schema cache" }, 404);
      if (options.method === 'POST') { window.__savedCloud.push(...JSON.parse(options.body)); return reply(null); }
      return reply(window.__savedCloud);
    }
    return original(resource, options);
  };
  window.WebSocket = class { close() {} send() {} addEventListener() {} removeEventListener() {} };
};

const exercise = async function (mode) {
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  const until = async (check, label) => { for (let i = 0; i < 200; i++) { if (check()) return; await wait(50); } throw Error(label); };
  const check = (value, label) => { if (!value) throw Error(label); };
  const visible = node => node && node.getClientRects().length && !node.closest('[aria-hidden=true]');
  const button = label => [...document.querySelectorAll('button')].find(node => visible(node) && node.textContent.trim() === label);
  const cards = () => [...document.querySelectorAll('.food-card:not(.food-skeleton)')].filter(visible);
  const notice = () => [...document.querySelectorAll('.saved-sync-notice')].find(visible);
  try {
    await until(() => cards().length === 1 && button('Saved'), 'Menu not ready');
    await wait(300);
    check(!notice(), 'Sync notices must not obstruct discovery');
    check(!document.body.innerText.includes('Saved items could not sync'), 'Generic red sync banner remains');
    button('Saved').click();
    await until(() => cards().length === 1, 'Locally saved dish not visible');
    if (mode === 'account') {
      await until(() => notice()?.textContent.includes('Saved on this device'), 'Account fallback status missing');
      check(notice().getAttribute('role') === 'status', 'Durable local save is not a blocking alert');
      const reads = window.__savedReads;
      cards()[0].querySelector('.food-save').click();
      await until(() => cards().length === 0, 'Local removal failed');
      button('Discover').click(); await until(() => cards().length === 1, 'Return to discovery failed');
      cards()[0].querySelector('.food-save').click();
      button('Saved').click(); await until(() => cards().length === 1, 'Local addition failed');
      await until(() => notice()?.querySelector('button'), 'Saved status did not settle after local addition');
      check(window.__savedReads === reads, 'Missing table caused repeated failed requests');
      window.__savedTablePresent = true;
      notice().querySelector('button').click();
      await until(() => !notice() && window.__savedCloud.length === 1, 'Retry did not sync queued bookmarks after backend recovery');
    } else {
      check(!notice(), 'Stale guest session caused a false sync error');
      check(window.__savedReads === 0, 'Guest queried cloud bookmarks');
    }
    await fetch('/__result', { method: 'POST', body: JSON.stringify({ result: 'pass', steps: [mode === 'account' ? 'missing table/local Saved add-remove/quiet discovery/retry recovery' : 'expired guest session/local Saved/no false sync banner'] }) });
  } catch (error) {
    await fetch('/__result', { method: 'POST', body: JSON.stringify({ result: 'fail', message: error.message }) });
  }
};

for (const mode of ['account', 'guest']) {
  const result = await runPickupBrowser({
    bootstrap: `(${mockPickupTransport.toString()})(); (${bootstrap.toString()})(${JSON.stringify(mode)});`,
    exercise: `(${exercise.toString()})(${JSON.stringify(mode)});`,
    output: `.tmp/saved-browser-${mode}`,
  });
  console.log('PASS:', result.steps.join('; '));
}
