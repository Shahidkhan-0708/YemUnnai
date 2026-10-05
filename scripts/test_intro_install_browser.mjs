import {runPickupBrowser,mockPickupTransport} from './test_pickup_browser.mjs';
const bootstrap = function(){
 localStorage.removeItem('yemunnai-intro-seen');sessionStorage.removeItem('yem-install-dismissed');
 window.__installCalls=0;
 window.__yemDeferredInstall={prompt:async()=>{window.__installCalls++;},userChoice:Promise.resolve({outcome:'dismissed'})};
 window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();e.stopImmediatePropagation();});
 window.WebSocket=class{close(){}send(){}addEventListener(){}removeEventListener(){}};
};
const journey=async function(){
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 const until=async(f,label)=>{for(let i=0;i<300;i++){if(f())return;await wait(30);}throw Error(label);};
 const check=(v,label)=>{if(!v)throw Error(label);};
 const dialog=()=>document.querySelector('[aria-label="Install YEMUNNAI"]');
 try{
  await until(()=>document.querySelector('.brand-intro'),'Intro shown');
  check(!dialog(),'Install sheet does not cover the intro');
  document.querySelector('.brand-intro').click();
  await until(dialog,'Install offer automatically appears after intro, without login');
  check(!document.querySelector('.brand-intro')&&document.querySelectorAll('[role=dialog]').length===1,'Intro ended and one install sheet visible');
  check(window.__installCalls===0,'Native installer waits for user gesture');
  check(dialog().contains(document.activeElement),'Install sheet receives keyboard focus');
  [...dialog().querySelectorAll('button')].find(b=>b.textContent.trim()==='Not now').click();
  await until(()=>!dialog(),'Dismissal closes prompt');
  window.dispatchEvent(new Event('yem-login-success'));await wait(700);
  check(!dialog(),'Dismissal prevents repeat prompts during this visit');
  check(document.documentElement.scrollWidth<=innerWidth,'Portrait layout fits screen');
  await fetch('/__result',{method:'POST',body:JSON.stringify({result:'pass',steps:['Intro remains unobstructed','Automatic install offer after intro without login','Native installation requires a tap','One focused dialog','Session dismissal respected','Portrait layout']})});
 }catch(e){await fetch('/__result',{method:'POST',body:JSON.stringify({result:'fail',message:e.message})});}
};
const result=await runPickupBrowser({bootstrap:`(${mockPickupTransport.toString()})();(${bootstrap.toString()})();`,exercise:`(${journey.toString()})()`,output:'.tmp/intro-install-browser',reducedMotion:false});
console.log('PASS: '+result.steps.join('; '));
