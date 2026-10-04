import { runPickupBrowser, mockPickupTransport } from './test_pickup_browser.mjs';

const bootstrap = function () {
  window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); event.stopImmediatePropagation(); });
  window.__readFailures = { vendor_list: 1, support_list: 1 };
  window.__readCounts = {}; window.__installCalls = 0;
  window.__yemDeferredInstall = {
    prompt: async () => { window.__installCalls++; await new Promise(resolve => setTimeout(resolve, 200)); },
    userChoice: Promise.resolve({ outcome: 'accepted' }),
  };
  const previous = window.fetch;
  window.fetch = async (resource, options = {}) => {
    const url = typeof resource === 'string' ? resource : resource.url;
    if (url.includes('/functions/v1/pickup')) {
      const { action } = JSON.parse(options.body ?? '{}');
      window.__readCounts[action] = (window.__readCounts[action] ?? 0) + 1;
      if (window.__readFailures[action] > 0) {
        window.__readFailures[action]--;
        return Response.json({ error: 'unavailable' }, { status: 503 });
      }
    }
    return previous(resource, options);
  };
  window.WebSocket = class { close() {} send() {} addEventListener() {} removeEventListener() {} };
};

const journey = async function () {
  const steps = [], wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  const until = async (check, label) => { for (let i = 0; i < 300; i++) { if (check()) return; await wait(30); } throw Error(label); };
  const check = (value, label) => { if (!value) throw Error(label); };
  const visible = element => element?.checkVisibility();
  const button = text => [...document.querySelectorAll('button')].find(element => visible(element) && element.textContent.trim() === text);
  const noReadAlerts = () => !document.querySelector('.business-content [role=alert]');
  const coversViewport = overlay => { const b=overlay.getBoundingClientRect(); return b.left===0 && b.top===0 && b.width===innerWidth && b.height===innerHeight; };
  try {
    await until(() => document.querySelector('.food-card:not(.food-skeleton)'), 'Discover must load');
    await wait(150);
    document.querySelector('.discovery-brand').click();
    await until(() => button('Menu & stock'), 'Dashboard must open');
    await until(() => window.__readCounts.vendor_list===1, 'First read must start');
    check(noReadAlerts() && !document.querySelector('.business-orders .feed-notice'), 'No first-request error flash');
    await until(() => window.__readCounts.vendor_list>=2 && window.__readCounts.support_list>=2 && document.querySelector('.business-empty')?.textContent.includes('New orders'), 'Reads must recover automatically');
    check(noReadAlerts() && !document.querySelector('.feed-notice'), 'Transient failures must recover without warning');
    check(!document.querySelector('.business-header .lucide-download') && ![...document.querySelectorAll('.business-header button')].some(b=>b.textContent.includes('Sync')), 'Fake download/sync button removed');
    check(document.querySelector('.business-tools button').getBoundingClientRect().height>=44, 'Header controls need 44px touch targets');
    steps.push('quiet first-read retry and consistent dashboard controls');

    window.__pickupMock.orders = [{id:'c0000000-0000-4000-8000-000000000001', vendor_id:'a0000000-0000-4000-8000-000000000001', buyer_id:'10000000-0000-4000-8000-000000000001', item_name:'Fresh Samosa', unit_price:15,quantity:1,total:15,pickup_number:1002,shop_name:'MITS Canteen',status:'pending',is_legacy:false,created_at:new Date().toISOString()}];
    document.querySelector('.business-refresh').click();
    await until(() => document.querySelector('.business-order')?.textContent.includes('Fresh Samosa'), 'Fresh order must load');
    window.__readFailures.vendor_list = 2;
    document.querySelector('.business-refresh').click();
    await wait(100);
    check(document.querySelector('.business-order')?.textContent.includes('Fresh Samosa'), 'Refresh must preserve received orders');
    await until(() => document.querySelector('.business-orders .feed-notice'), 'Persistent failure needs a compact status');
    check(noReadAlerts() && document.querySelector('.business-orders .feed-notice').textContent.includes('last received'), 'Persistent failure must label stale orders without a red wall');
    button('Retry').click();
    await until(() => !document.querySelector('.business-orders .feed-notice') && !document.querySelector('.business-refresh').disabled, 'Retry must recover');
    steps.push('stale order preservation, bounded retries, truthful persistent status, and recovery');

    const add = button('Add item'); add.focus(); add.click();
    await until(() => document.querySelector('#aef-title'), 'Add form must open');
    const addOverlay = document.querySelector('.add-item-sheet').parentElement;
    check(coversViewport(addOverlay), 'Add item backdrop must cover the viewport');
    check(document.querySelector('.add-item-sheet').closest('.svg-screen-controller')===null, 'Add form cannot remain inside a hidden SVG controller');
    check(document.querySelectorAll('[role=dialog]').length===1, 'Only one visible add-item screen');
    const sheet=document.querySelector('.add-item-sheet'); sheet.scrollTop=sheet.scrollHeight;
    check(sheet.querySelector('button[type=submit]').getBoundingClientRect().bottom<=innerHeight, 'Publish button remains reachable');
    document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
    await until(() => !document.querySelector('#aef-title'), 'Escape closes add form');
    check(document.activeElement===add, 'Add form restores trigger focus');
    button('Menu & stock').click();
    await until(() => button('Add food item'), 'Stock screen must open');
    button('Add food item').click();
    await until(() => document.querySelector('#aef-title'), 'Add form opens from stock');
    check(coversViewport(document.querySelector('.add-item-sheet').parentElement), 'Stock add backdrop covers the entire screen');
    check(document.querySelectorAll('[role=dialog]').length===1, 'Stock add has no duplicate screen');
    document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
    await until(() => !document.querySelector('#aef-title'), 'Stock add closes');
    steps.push('dashboard and stock add-item sheets: one screen, full backdrop, scrolling, focus and Escape');

    button('Install app').click();
    await until(() => document.querySelector('[aria-label="Install YEMUNNAI"]'), 'Install sheet opens on explicit action');
    const installDialog=document.querySelector('[aria-label="Install YEMUNNAI"]');
    check(coversViewport(installDialog.parentElement), 'Install backdrop fills viewport');
    const installButton=[...installDialog.querySelectorAll('button')].find(b=>b.textContent.trim()==='Install app');
    installButton.click(); installButton.click();
    await until(() => !document.querySelector('[aria-label="Install YEMUNNAI"]'), 'Accepted installation closes sheet');
    check(window.__installCalls===1 && !button('Install app'), 'Real install prompt is called once and accepted entry disappears');
    steps.push('real installation prompt, single submission, full backdrop and accepted dismissal');
    await fetch('/__result',{method:'POST',body:JSON.stringify({result:'pass',steps})});
  } catch(error) { await fetch('/__result',{method:'POST',body:JSON.stringify({result:'fail',message:error.message,steps})}); }
};

const result=await runPickupBrowser({
  bootstrap:`(${mockPickupTransport.toString()})();(${bootstrap.toString()})();`,
  exercise:`(${journey.toString()})()`, output:'.tmp/vendor-dashboard-browser',timeout:45000,
});
console.log('PASS: '+result.steps.join('; '));
