import { mockPickupTransport, runPickupBrowser } from './test_pickup_browser.mjs';
const bootstrap = function () {
  window.WebSocket = class { close() {} send() {} addEventListener() {} removeEventListener() {} };
  window.__emailCalls = 0; window.__emailFailure = true;
  const previous=window.fetch;
  window.fetch=async(resource,options={})=>{
    const url=typeof resource==='string'?resource:resource.url;
    if(url.includes('/auth/v1/user')&&options.method==='PUT'){
      window.__emailCalls++;await new Promise(resolve=>setTimeout(resolve,200));
      return window.__emailFailure ? Response.json({message:'Temporarily unavailable'},{status:503}) : Response.json({id:'10000000-0000-4000-8000-000000000001',is_anonymous:true,email:'guest@example.test'});
    }
    return previous(resource,options);
  };
};
const journey = async function () {
  const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  const until=async(test,label)=>{for(let i=0;i<250;i++){if(test())return;await wait(30);}throw Error(label);};
  const check=(value,label)=>{if(!value)throw Error(label);};
  const button=text=>[...document.querySelectorAll('button')].find(b=>b.checkVisibility()&&(b.textContent.trim()===text||b.querySelector('strong')?.textContent===text));
  const openProfile=async()=>{document.querySelector('#buyer-tab-profile').click();await until(()=>document.querySelector('.buyer-profile-identity h2')?.textContent.includes(window.__verifiedCase?'Your account':'Guest profile')&&button('My orders')&&button('Saved food'),'Profile session loads');};
  try{
    await until(()=>document.querySelector('.food-card:not(.food-skeleton)'),'Discover loads');
    const tabs=[...document.querySelectorAll('.buyer-tab')];
    check(tabs.length===4&&tabs.at(-1).id==='buyer-tab-profile','Profile is the fourth tab in the previous EN position');
    check(tabs.every(b=>{const r=b.getBoundingClientRect();return r.width>=44&&r.height>=44;}),'Four tabs have accessible touch targets');
    check(!document.querySelector('.buyer-language-control'),'No customer language control');
    await openProfile();
    check(document.querySelector('#buyer-tab-profile').getAttribute('aria-selected')==='true','Profile selected state');
    check(!document.querySelector('.discovery-header')&&!document.querySelector('[role=dialog]'),'Profile is a single tab screen');
    if(window.__verifiedCase){check(document.querySelector('.buyer-profile-identity').textContent.includes('buyer@example.test'),'Signed-in email displayed');}
    else{
      document.querySelector('.buyer-profile-account summary').click();
      const input=document.querySelector('#profile-email');
      const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;
      setter.call(input,'guest@example.test');input.dispatchEvent(new Event('input',{bubbles:true}));await wait(50);
      const form=document.querySelector('.buyer-profile-account form');form.requestSubmit();form.requestSubmit();
      await until(()=>document.querySelector('.buyer-profile-account [role=alert]'),'Email error reported with retry');
      check(window.__emailCalls===1&&!form.querySelector('button').disabled,'Single email request and unlock after failure');
      window.__emailFailure=false;form.requestSubmit();
      await until(()=>document.querySelector('.buyer-profile-account [role=status]')?.textContent.includes('Check your email'),'Email retry confirmation');
      check(window.__emailCalls===2,'Exactly one retry request');
    }
    button('Saved food').click();await until(()=>document.querySelector('#buyer-tab-saved').getAttribute('aria-selected')==='true','Saved shortcut works');
    await openProfile();button('My orders').click();await until(()=>document.querySelector('#buyer-tab-orders').getAttribute('aria-selected')==='true','Orders shortcut works');
    await openProfile();
    document.querySelector('#buyer-tab-profile').focus();document.querySelector('#buyer-tab-profile').dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowLeft',bubbles:true}));
    await until(()=>document.querySelector('#buyer-tab-orders').getAttribute('aria-selected')==='true','Keyboard tab navigation');
    check(document.documentElement.scrollWidth<=innerWidth,'No mobile overflow');
    await fetch('/__result',{method:'POST',body:JSON.stringify({result:'pass',steps:[window.__verifiedCase?'Verified customer profile':'Guest profile, single email request, failure and retry','Fourth tab, selected state, 44px targets, mobile layout','Saved and Orders shortcuts','Keyboard navigation']})});
  }catch(error){await fetch('/__result',{method:'POST',body:JSON.stringify({result:'fail',message:error.stack,text:document.body.innerText.slice(0,1500)})});}
};
for(const verified of [false,true]){
 const setup=verified?`const session=JSON.parse(localStorage.getItem('yemunnai-buyer-auth'));session.user.is_anonymous=false;session.user.email='buyer@example.test';session.user.email_confirmed_at=new Date().toISOString();localStorage.setItem('yemunnai-buyer-auth',JSON.stringify(session));window.__verifiedCase=true;`:'';
 const result=await runPickupBrowser({bootstrap:`(${mockPickupTransport.toString()})();${setup}(${bootstrap.toString()})();`,exercise:`(${journey.toString()})()`,output:'.tmp/buyer-profile-'+(verified?'verified':'guest')});
 console.log('PASS: '+result.steps.join('; '));
}
