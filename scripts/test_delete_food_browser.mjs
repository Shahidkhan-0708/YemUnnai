import { runPickupBrowser, mockPickupTransport } from './test_pickup_browser.mjs';

const bootstrap = function (outlet) {
  history.replaceState(null, '', '/?portal=business');
  const shop = { id: outlet === 'cafe' ? 'a0000000-0000-4000-8000-000000000002' : 'a0000000-0000-4000-8000-000000000001', name: outlet === 'cafe' ? 'MITS Cafe' : 'MITS Canteen', owner_id: '10000000-0000-4000-8000-000000000002', is_active: true, is_online: true };
  const food = { id: 'b0000000-0000-4000-8000-000000000003', vendor_id: shop.id, name: 'Samosa', price: 15, category: 'cooked', action_type: 'order', in_stock: true, is_vegetarian: true, vendors: shop, reviews: [] };
  window.__delete = { requests: 0, fail: true, deleted: false };
  const original = window.fetch;
  window.fetch = async (resource, options = {}) => {
    const url = typeof resource === 'string' ? resource : resource.url;
    const reply = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });
    if (url.includes('/rest/v1/vendors')) return reply(new Headers(options.headers).get('accept')?.includes('object') ? shop : [shop]);
    if (url.includes('/rest/v1/food_items')) {
      if (options.method === 'DELETE') {
        window.__delete.requests++;
        const filters = new URL(url).searchParams;
        if (filters.get('id') !== 'eq.' + food.id || filters.get('vendor_id') !== 'eq.' + shop.id) return reply({ message: 'Wrong canteen filters' }, 403);
        if (window.__delete.fail) return reply({ message: 'Temporary failure' }, 503);
        await new Promise(resolve => setTimeout(resolve, 150));
        window.__delete.deleted = true;
        return reply({ id: food.id });
      }
      return reply(window.__delete.deleted ? [] : [food]);
    }
    return original(resource, options);
  };
  window.WebSocket = class { close() {} send() {} addEventListener() {} removeEventListener() {} };
};

const exercise = async function (outlet) {
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  const until = async (test, label) => { for (let i = 0; i < 250; i++) { if (test()) return; await wait(50); } throw Error(label); };
  const check = (value, label) => { if (!value) throw Error(label); };
  const visible = node => node && node.getClientRects().length && !node.closest('[aria-hidden=true]');
  const button = text => [...document.querySelectorAll('button')].find(node => visible(node) && node.textContent.trim() === text);
  const dialog = () => document.querySelector('.delete-food-dialog');
  try {
    await until(() => button('Menu & stock'), 'Dashboard did not load');
    button('Menu & stock').click();
    await until(() => document.querySelector('.stock-item-delete') && !document.querySelector('.stock-item-delete').disabled, 'Delete action missing');
    check(document.querySelector('.stock-heading p').textContent === (outlet === 'cafe' ? 'MITS Cafe' : 'MITS Canteen'), 'Wrong seller canteen');
    document.querySelector('.stock-item-delete').focus(); document.querySelector('.stock-item-delete').click(); await until(() => dialog()?.open, 'Confirmation did not open');
    check(dialog().textContent.includes('Samosa') && dialog().textContent.includes('15'), 'Confirmation must identify the dish and price');
    check(document.activeElement.textContent === 'Keep dish', 'Safe action must receive initial focus');
    check(dialog().getBoundingClientRect().width <= innerWidth, 'Dialog overflows phone width');
    button('Keep dish').click(); await until(() => !dialog(), 'Cancel failed');
    check(document.activeElement.classList.contains('stock-item-delete'), 'Cancel did not return focus to the dish action');
    check(window.__delete.requests === 0, 'Cancel sent a delete request');
    document.querySelector('.stock-item-delete').click(); await until(() => dialog()?.open, 'Second confirmation failed');
    dialog().querySelector('.delete-food-confirm').click(); await until(() => dialog()?.querySelector('[role=alert]'), 'Failure not shown in confirmation');
    check(document.querySelectorAll('.stock-item').length === 1, 'Failure removed the dish');
    window.__delete.fail = false;
    const confirm = dialog().querySelector('.delete-food-confirm'); confirm.click(); confirm.click();
    await until(() => !dialog() && document.querySelectorAll('.stock-item').length === 0, 'Successful delete did not remove item');
    check(document.activeElement === document.querySelector('.stock-heading h1'), 'Successful delete did not restore useful keyboard focus');
    check(window.__delete.requests === 2, 'Duplicate submission occurred');
    check(document.querySelector('.stock-delete-success')?.textContent.includes('Samosa'), 'Success confirmation missing');
    button('Refresh').click(); await wait(200);
    check(document.querySelectorAll('.stock-item').length === 0, 'Deleted dish reappeared after refresh');
    await fetch('/__result', { method: 'POST', body: JSON.stringify({ result: 'pass', steps: [outlet + ': own menu, phone dialog, safe focus/cancel, failed delete retained, retry, single submission, successful removal, refresh'] }) });
  } catch (error) { await fetch('/__result', { method: 'POST', body: JSON.stringify({ result: 'fail', message: error.message }) }); }
};

for (const outlet of ['canteen', 'cafe']) {
  const result = await runPickupBrowser({ bootstrap: `(${mockPickupTransport.toString()})(); (${bootstrap.toString()})(${JSON.stringify(outlet)});`, exercise: `(${exercise.toString()})(${JSON.stringify(outlet)});`, output: `.tmp/delete-food-browser-${outlet}` });
  console.log('PASS:', result.steps.join('; '));
}
