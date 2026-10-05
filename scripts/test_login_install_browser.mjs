import { runPickupBrowser, mockPickupTransport } from './test_pickup_browser.mjs';

const bootstrap = function () {
  sessionStorage.removeItem('yem-install-dismissed');
  const session = JSON.parse(localStorage.getItem('yemunnai-vendor-auth'));
  localStorage.removeItem('yemunnai-vendor-auth');
  window.__yemDeferredInstall = undefined;
  window.__installCalls = 0;
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); e.stopImmediatePropagation(); });
  const previous = window.fetch;
  window.fetch = async (resource, options = {}) => {
    const url = typeof resource === 'string' ? resource : resource.url;
    if (url.includes('/functions/v1/vendor-pin-login')) return window.__pinSuccess ? Response.json({ token_hash:'test-token-hash' }) : Response.json({ error:'Invalid PIN' }, { status:401 });
    if (url.includes('/auth/v1/verify')) return Response.json(session);
    const response = await previous(resource, options);
    if (url.includes('/rest/v1/vendors') && new Headers(options.headers).get('accept')?.includes('object')) return Response.json((await response.json())[0]);
    return response;
  };
  window.WebSocket = class { close() {} send() {} addEventListener() {} removeEventListener() {} };
};
const journey = async function () {
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  const until = async (test, label) => { for(let i=0;i<300;i++){if(test())return;await wait(30);}throw Error(label); };
  const check = (value, label) => { if(!value)throw Error(label); };
  const dialog = () => document.querySelector('[aria-label="Install YEMUNNAI"]');
  const clickPin = async () => { for(const n of ['1','2','3','4']) { document.querySelector(`.vendor-login button[aria-label="${n}"]`).click(); await wait(25); } };
  try {
    await until(()=>document.querySelector('.food-card:not(.food-skeleton)'), 'Discover loads');
    check(!document.querySelector('.buyer-language-control') && document.querySelectorAll('.buyer-tab').length===4 && document.querySelector('#buyer-tab-profile'),'Customer navigation has four tabs including Profile and no language selector');
    document.querySelector('.discovery-brand').click();
    await until(()=>document.querySelector('.vendor-login'), 'Login opens');
    await clickPin();
    await until(()=>document.querySelector('.vendor-login [role=alert]'),'Failed login reports error');
    check(!dialog(),'Failed login does not offer installation');
    window.__pinSuccess = true;
    await clickPin();
    await until(()=>document.querySelector('.business-header')&&!document.querySelector('.vendor-login'),'Successful login closes login screen');
    await wait(600); check(!dialog(),'No unsupported install button before browser eligibility');
    window.__yemDeferredInstall = { prompt: async()=>{ window.__installCalls++; await wait(250); }, userChoice:Promise.resolve({outcome:'accepted'}) };
    window.dispatchEvent(new Event('yem-install-available'));
    await until(dialog,'Late browser install offer opens automatically after login');
    check(document.querySelectorAll('[role=dialog]').length===1,'No overlapping login and install screens');
    check(dialog().classList.contains('install-sheet'),'Animated sheet styling present');
    if(matchMedia('(prefers-reduced-motion: reduce)').matches) check(getComputedStyle(dialog()).animationName==='none','Reduced motion respected');
    else check(getComputedStyle(dialog()).animationName==='install-enter','Smooth entrance animation enabled');
    check(window.__installCalls===0,'Native installer requires explicit user action');
    [...dialog().querySelectorAll('button')].find(b=>b.textContent.trim()==='Not now').click();
    window.dispatchEvent(new Event('yem-login-success')); await wait(700);
    check(!dialog(),'Dismissal prevents repeat automatic prompts');
    [...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Install app').click();
    await until(dialog,'Manual installation remains available after dismissal');
    const install=[...dialog().querySelectorAll('button')].find(b=>b.textContent.trim()==='Install app');
    install.click(); install.click();
    document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
    check(!!dialog(),'Pending installation cannot be dismissed midway');
    await until(()=>!dialog(),'Accepted installation closes dialog');
    check(window.__installCalls===1&&!document.querySelector('.app-install-entry'),'Single installation and installed entry hidden');
    check(document.documentElement.scrollWidth<=innerWidth,'Narrow dashboard has no horizontal overflow');
    await fetch('/__result',{method:'POST',body:JSON.stringify({result:'pass',steps:['Four customer tabs including Profile','Failed and successful login','Late install eligibility','One modal at a time','Reduced motion','Session dismissal and manual retry','Native gesture, single submission and pending guard','Installed suppression','320px dashboard layout']})});
  }catch(error){await fetch('/__result',{method:'POST',body:JSON.stringify({result:'fail',message:error.message})});}
};
const result = await runPickupBrowser({ bootstrap:`(${mockPickupTransport.toString()})();(${bootstrap.toString()})();`,exercise:`(${journey.toString()})()`,output:'.tmp/login-install-browser' });
console.log('PASS: '+result.steps.join('; '));
const animated = await runPickupBrowser({ bootstrap:`(${mockPickupTransport.toString()})();(${bootstrap.toString()})();`,exercise:`(${journey.toString()})()`,output:'.tmp/login-install-animated',reducedMotion:false });
console.log('PASS: normal-motion login install entrance; '+animated.steps.length+' behavior checks');
const alternative = async function () {
  const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  const dialog=()=>document.querySelector('[aria-label="Install YEMUNNAI"]');
  try {
    for(let i=0;i<200&&!document.querySelector('.food-card:not(.food-skeleton)');i++)await wait(30);
    await wait(250);
    window.dispatchEvent(new Event('yem-login-success'));
    await wait(1000);
    if(window.__installedCase){ if(dialog()||document.querySelector('.app-install-entry'))throw Error('Installed app must never offer installation'); }
    else { if(!dialog()?.textContent.includes('Add to Home Screen'))throw Error('iOS must offer home screen instructions: '+(dialog()?.textContent??'no dialog')); if(document.querySelectorAll('[role=dialog]').length!==1)throw Error('Single iOS dialog'); }
    await fetch('/__result',{method:'POST',body:JSON.stringify({result:'pass',steps:[window.__installedCase?'Standalone suppression':'iOS home screen instructions with storage unavailable']})});
  }catch(error){await fetch('/__result',{method:'POST',body:JSON.stringify({result:'fail',message:error.message})});}
};
for(const installed of [true,false]){
  const setup=installed
    ? `window.__installedCase=true;Object.defineProperty(navigator,'standalone',{value:true});`
    : `window.__yemDeferredInstall=undefined;Object.defineProperty(navigator,'userAgent',{value:'iPhone Safari'});const get=Storage.prototype.getItem,set=Storage.prototype.setItem;Storage.prototype.getItem=function(key){if(key==='yem-install-dismissed')throw new Error('Storage unavailable');return get.call(this,key);};Storage.prototype.setItem=function(key,value){if(key==='yem-install-dismissed')throw new Error('Storage unavailable');return set.call(this,key,value);};`;
  const result=await runPickupBrowser({bootstrap:`(${mockPickupTransport.toString()})();window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();e.stopImmediatePropagation();});${setup}`,exercise:`(${alternative.toString()})()`,output:'.tmp/install-'+(installed?'standalone':'ios')});
  console.log('PASS: '+result.steps.join('; '));
}
