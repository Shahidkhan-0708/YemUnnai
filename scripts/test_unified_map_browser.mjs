import { mockPickupTransport, runPickupBrowser } from './test_pickup_browser.mjs';
const bootstrap = function () {
  window.WebSocket = class { close() {} send() {} addEventListener() {} removeEventListener() {} };
  const previous = window.fetch; window.__locationWrites = []; window.__locationFailure = false; window.__geoCalls = 0;
  Object.defineProperty(navigator, 'geolocation', { value: { getCurrentPosition(success) { window.__geoCalls++; success({ coords: { latitude: 13.6299, longitude: 78.4787, accuracy: 8 } }); } } });
  window.fetch = async (resource, options = {}) => {
    const url = typeof resource === 'string' ? resource : resource.url;
    if (url.includes('/rest/v1/vendors')) {
      if (!window.__locationShop) window.__locationShop = (await (await previous(resource, {})).json())[0];
      if (options.method === 'PATCH') {
        if (!url.includes('id=eq.a0000000-0000-4000-8000-000000000001')) throw Error('Missing shop scope');
        const body = JSON.parse(options.body); window.__locationWrites.push(body); await new Promise(r => setTimeout(r, 180));
        if (window.__locationFailure) return Response.json({ message: 'offline' }, { status: 503 });
        Object.assign(window.__locationShop, body); return Response.json({ id: window.__locationShop.id });
      }
      return Response.json([window.__locationShop]);
    }
    if (url.includes('/rest/v1/food_items') && (!options.method || options.method === 'GET')) {
      const rows = await (await previous(resource, options)).json();
      return Response.json(rows.map(row => ({ ...row, action_type: 'walkin', image_url: '/images/samosa.jpg', vendors: window.__locationShop ?? row.vendors })));
    }
    return previous(resource, options);
  };
};
const journey = async function () {
  const pause = ms => new Promise(r => setTimeout(r, ms));
  const until = async (test, label) => { for (let i = 0; i < 300; i++) { if (test()) return; await pause(25); } throw Error(label); };
  const check = (value, label) => { if (!value) throw Error(label); };
  const button = text => [...document.querySelectorAll('button')].find(b => b.checkVisibility() && b.textContent.trim() === text);
  const input = (name, value) => { const node = document.querySelector(`[aria-label="${name}"]`); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(node, value); node.dispatchEvent(new Event('input', { bubbles: true })); };
  try {
    await until(() => button('Walk In') && !button('Walk In').disabled, 'Walk-in food loaded'); button('Walk In').click();
    await until(() => document.querySelector('.canteen-real-map .leaflet-tile'), 'Real map tiles requested');
    check(!document.querySelector('.canteen-map-logo'), 'Wrong old coordinates never become canteen markers');
    check(!document.querySelector('[role=tablist]')?.textContent.includes('GPS'), 'No GPS/campus switcher');
    check(window.__geoCalls === 0, 'No automatic GPS permission');
    const zoom = () => document.querySelector('.canteen-real-map .leaflet-tile-container:last-child img')?.src.split('/').at(-3);
    const initialZoom = zoom(); document.querySelector('.leaflet-control-zoom-in').click();
    await until(() => zoom() && zoom() !== initialZoom, 'Map can zoom');
    const chosenZoom = zoom(); window.dispatchEvent(new Event('online')); await pause(650);
    check(zoom() === chosenZoom, 'Catalog refresh preserves the chosen map zoom');
    document.querySelector('[aria-label="Close map"]').click();
    await until(() => !document.querySelector('[role=dialog]'), 'Map closes without second screen');
    document.querySelector('.discovery-brand').click(); await until(() => button('Menu & stock'), 'Seller dashboard opens');
    check(!document.querySelector('.vendor-location-card') && !document.querySelector('.vendor-location-trigger'), 'Dashboard has no location setup or prompt');
    button('Menu & stock').click(); await until(() => document.querySelector('.vendor-location-trigger'), 'Optional location icon in menu settings');
    check(!document.querySelector('.vendor-location-card'), 'Location setup stays hidden until requested');
    const trigger = document.querySelector('.vendor-location-trigger'); trigger.focus(); trigger.click();
    await until(() => document.querySelector('.vendor-location-card form'), 'Location sheet opens explicitly');
    check(document.querySelector('[role=dialog]').contains(document.activeElement), 'Focus moves into location settings');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await until(() => !document.querySelector('[role=dialog]'), 'Escape closes settings');
    check(document.activeElement === trigger, 'Focus returns to location icon'); trigger.click();
    await until(() => document.querySelector('.vendor-location-card form'), 'Location sheet reopens');
    input('Canteen latitude', '13.56'); input('Canteen longitude', '78.49'); await pause(30); button('Save location').click();
    await until(() => document.querySelector('.vendor-location-message')?.textContent.includes('Check the coordinates'), 'Bad campus pin rejected');
    check(window.__locationWrites.length === 0, 'Invalid coordinate never written');
    button('Use my location at the canteen').click(); await until(() => document.querySelector('[aria-label="Canteen latitude"]').value === '13.6299000', 'Seller explicitly captures location');
    button('Save location').click(); button('Save location')?.click();
    await until(() => document.querySelector('.vendor-location-message')?.textContent.includes('Location saved'), 'Location saved');
    check(window.__locationWrites.length === 1 && window.__locationWrites[0].latitude === 13.6299, 'One scoped numeric write');
    input('Canteen latitude', '13.6298'); window.__locationFailure = true; await pause(30); button('Save location').click();
    await until(() => document.querySelector('.vendor-location-message')?.textContent.includes('Could not save'), 'Failed save reported');
    check(window.__locationShop.latitude === 13.6299, 'Failed write preserves previous pin'); window.__locationFailure = false;
    document.querySelector('[aria-label="Close location settings"]').click(); document.querySelector('.stock-back').click(); await until(() => document.querySelector('.business-back'), 'Return to dashboard'); document.querySelector('.business-back').click(); await until(() => button('Walk In') && !button('Walk In').disabled, 'Customer catalog updates'); button('Walk In').click();
    await until(() => document.querySelector('.canteen-map-logo.is-selected img'), 'Saved location becomes logo marker');
    check(document.querySelector('.canteen-map-logo span').textContent === 'MITS Canteen', 'Marker uses correct canteen name');
    check(document.querySelector('.canteen-map-directions').href.includes('13.6299%2C78.4787'), 'Walking destination uses saved coordinates');
    check(document.documentElement.scrollWidth <= innerWidth, 'Portrait map has no page overflow');
    check(document.querySelectorAll('[role=dialog]').length === 1, 'One unified map dialog');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await until(() => !document.querySelector('[role=dialog]'), 'Escape closes map');
    await fetch('/__result', { method: 'POST', body: JSON.stringify({ result: 'pass', steps: ['Real geographic tiles', 'Invalid seed pins suppressed', 'No automatic GPS prompt', 'Catalog refresh preserves map zoom', 'Seller prompted for missing coordinates', 'Invalid pin rejected', 'Single scoped location write', 'Failed save preserves pin', 'Customer logo marker updates', 'Correct walking destination', 'Portrait layout and modal dismissal'] }) });
  } catch (error) { await fetch('/__result', { method: 'POST', body: JSON.stringify({ result: 'fail', message: error.stack, text: document.body.innerText.slice(0, 1500) }) }); }
};
const result = await runPickupBrowser({ bootstrap: `(${mockPickupTransport.toString()})();(${bootstrap.toString()})();`, exercise: `(${journey.toString()})()`, output: '.tmp/unified-map-browser' });
console.log('PASS: optional menu location icon, no dashboard prompt, focus restoration and Escape; ' + result.steps.join('; '));
