import {runPickupBrowser,mockPickupTransport} from './test_pickup_browser.mjs';
const exercise=async function(){
  const pause=ms=>new Promise(r=>setTimeout(r,ms));
  const until=async(f,label)=>{for(let i=0;i<300;i++){if(f())return;await pause(30);}throw Error(label);};
  try{
    const walk=()=>[...document.querySelectorAll('.food-action')].find(e=>e.textContent.trim()==='Walk In');
    await until(walk,'Walk In loads');walk().click();
    await until(()=>document.querySelector('[aria-label="Close loading dialog"]'),'Loading sheet is closable');
    if(!document.querySelector('.food-card')?.getClientRects().length)throw Error('Loading map hides the food feed');
    document.querySelector('[aria-label="Close loading dialog"]').click();
    await until(()=>!document.querySelector('[role=dialog]'),'Loading map can be cancelled');
    if(!walk()?.getClientRects().length)throw Error('Food feed does not recover after cancellation');
    walk().click();await until(()=>document.querySelector('.canteen-map-destination')?.textContent.includes('MITS Canteen'),'Reopened map finishes loading with correct business');
    document.querySelector('[aria-label="Close map"]').click();await until(()=>!document.querySelector('[role=dialog]'),'Loaded map closes');
    await fetch('/__result',{method:'POST',body:JSON.stringify({result:'pass',steps:['slow map uses a closable sheet','discovery stays visible during code loading','cancel and reopen works','loaded map retains correct business']})});
  }catch(e){await fetch('/__result',{method:'POST',body:JSON.stringify({result:'fail',message:e.stack})});}
};
const result=await runPickupBrowser({bootstrap:`(${mockPickupTransport.toString()})();`,exercise:`(${exercise.toString()})();`,delayMapAssets:true,output:'.tmp/modal-loading-browser'});
console.log('PASS: '+result.steps.join('; '));
