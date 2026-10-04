import { createContext, useContext, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export type SvgScreen = 'home'|'checkout'|'feedback'|'dashboard'|'add'|'map'|'logo'|'onboarding'|'location'|'detail'|'stock'|'login'|'orders'|'saved'|'intro'|'error'|'gallery'|'artifacts'|'components'|'collection'|'support';
export const svgScreens: Record<SvgScreen,string> = {
  home:'01_home_discovery_feed',checkout:'02_quick_order_modal',feedback:'03_feedback_popup',dashboard:'04_business_dashboard',add:'05_add_edit_food_item',map:'06_walk_in_map_modal',logo:'07_mascot_logo',onboarding:'08_splash_onboarding',location:'09_location_permission',detail:'10_food_item_detail',stock:'11_menu_stock_management',login:'12_access_login',orders:'13_buyer_orders',saved:'14_saved_items',intro:'15_brand_intro',error:'16_error_404',gallery:'17_screen_gallery',artifacts:'18_design_deliverables',components:'19_component_showcase',collection:'20_collection_confirmation',support:'21_help_requests',
};
const ControllerContext = createContext(false);
const markupCache = new Map<string,Promise<string>>();
const modalScreens = new Set<SvgScreen>(['checkout','feedback','add','map','login','collection']);
type Box = { x:number; y:number; width:number; height:number };
type Control = { key:number; element:HTMLElement; box:Box; label:string };
const normalize = (value:string) => value.toLowerCase().replace(/[\s·×+₹#():–—.,]/g,'');
const aliases:Record<string,string[]> = {
  'Add food item':['+ Add Item','Add new food item','Add food item','Add new item'],
  'Add item':['+ Add Item','Add food item'],
  'Back to dashboard':['Back to dashboard','Back'],
  'Liked it':['Liked it','Yes, I liked it'],
  'Could be better':['Could be better','Not really'],
  'Use my location':['Allow location','Use my location'],
  'Browse food':['Explore food','Browse food'],
  'Canteen sign-in':['Business Portal'],
};

/** SVG is the presentation layer; React's existing controls remain the state/action layer.
 * Transparent native controls at the SVG coordinates provide keyboard, form and touch
 * interactions. The source files are never re-rasterized or approximated with CSS.
 */
export function SvgScreenFrame({ screen, children, visible=true }: {screen:SvgScreen|null;children:ReactNode;visible?:boolean}) {
  const nested = useContext(ControllerContext);
  const id = 'svg-view-'+useId().replace(/:/g,'');
  const controller = useRef<HTMLDivElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const artwork = useRef<HTMLDivElement>(null);
  const [markup,setMarkup] = useState('');
  const [failed,setFailed] = useState(false);
  const [controls,setControls] = useState<Control[]>([]);
  const [size,setSize] = useState({width:400,height:812});
  const [nativeState,setNativeState] = useState(false);
  const [showIntroVideo,setShowIntroVideo] = useState(()=>!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const previousLabels = useRef(new WeakMap<HTMLElement,string>());
  const previousValues = useRef(new WeakMap<HTMLElement,string>());
  const previousRating = useRef<number|null>(null);
  const template = useRef({text:'',cards:40});
  const isModal = !!screen && modalScreens.has(screen);
  const skip = !screen || (nested && !isModal);

  useEffect(() => {
    if (skip || !visible || !screen) return;
    let stopped=false; setFailed(false); setMarkup('');
    const file=svgScreens[screen];
    if (!markupCache.has(file)) markupCache.set(file,fetch(`/svgs/${file}.svg`).then(response=>{if(!response.ok)throw Error('SVG unavailable');return response.text();}));
    void markupCache.get(file)!.then(text=>{
      if(stopped)return;
      const document=new DOMParser().parseFromString(text,'image/svg+xml');
      const svg=document.documentElement;
      if(svg.localName!=='svg'||document.querySelector('parsererror'))throw Error('Invalid SVG');
      const width=Number(svg.getAttribute('width')),height=Number(svg.getAttribute('height'));
      if(!width||!height)throw Error('SVG dimensions missing');
      template.current={text:normalize([...svg.querySelectorAll('text')].map(node=>node.textContent).join('')),cards:[...svg.querySelectorAll('rect')].filter(node=>node.getAttribute('width')==='176'&&node.getAttribute('height')==='314').length};
      svg.setAttribute('viewBox',`0 0 ${width} ${height}`);
      // Scope clip/filter IDs when a modal is rendered above another SVG screen.
      const ids=new Map([...svg.querySelectorAll('[id]')].map(node=>[node.id,isModal?`${id}-${node.id}`:node.id]));
      for(const node of svg.querySelectorAll('*')) {
        if(node.id)node.id=ids.get(node.id)!;
        for(const attr of [...node.attributes]) {
          const next=attr.value.replace(/url\(#([^)]*)\)/g,(_,key)=>`url(#${ids.get(key)??key})`).replace(/^#(.+)$/,(_,key)=>ids.has(key)?`#${ids.get(key)}`:`#${key}`);
          if(next!==attr.value)node.setAttribute(attr.name,next);
        }
      }
      setSize({width,height});setMarkup(new XMLSerializer().serializeToString(svg));
    }).catch(()=>{if(!stopped)setFailed(true);});
    return()=>{stopped=true;};
  },[screen,skip,visible,id]);

  useLayoutEffect(()=>{
    if(!markup||!controller.current||skip)return;
    const source=controller.current;
    const hasError=!['gallery','artifacts','components'].includes(screen??'')&&!!source.querySelector('[role=alert], .saved-sync-notice');
    const hasConfirmation=['checkout','feedback','add'].includes(screen??'')&&!!source.querySelector('[role=status]');
    const hasLogin=screen==='dashboard'&&!source.querySelector('.business-screen');
    const differentDetail=screen==='detail'&&(source.querySelector('.detail-screen h1')?.textContent!=='Samosa'||source.querySelector('.detail-screen strong')?.textContent!=='₹0');
    const differentMap=screen==='map'&&source.querySelector('h3')?.textContent!=='MITS Canteen';
    const headings=screen==='dashboard'?[...source.querySelectorAll('.business-order-item h3')]:screen==='orders'?[...source.querySelectorAll('.order-card-food h4')]:[];
    const wrongOrders=headings.some(heading=>!template.current.text.includes(normalize(heading.textContent??'')));
    const count=source.querySelectorAll('.food-card:not(.food-skeleton)').length;
    const savedMatches= count===1 && source.querySelector('.food-name-row h3')?.textContent==='Samosa' && source.querySelector('.discovery-group-heading h2')?.textContent==='MITS Canteen' && !!source.querySelector('.food-action:disabled');
    const notTemplateData=(screen==='home'&&count!==template.current.cards)||(screen==='saved'&&!savedMatches)||(screen==='orders'&&(source.querySelectorAll('.order-card').length!==3||wrongOrders))||(screen==='dashboard'&&(source.querySelectorAll('.business-order').length!==2||wrongOrders))||(screen==='stock'&&source.querySelectorAll('.stock-item').length!==16);
    const hasMenuActions=screen==='stock'&&!!source.querySelector('.stock-item-delete');
    const useNative=hasError||hasConfirmation||hasLogin||differentDetail||differentMap||notTemplateData||hasMenuActions;
    if(useNative!==nativeState){setNativeState(useNative);return;}
    if(useNative||!artwork.current)return;
    const art=artwork.current;
    const svg=art.querySelector('svg')!;
    const bounds=art.getBoundingClientRect(), scale=bounds.width/size.width;
    if(!scale)return;
    const texts=[...svg.querySelectorAll('text')];
    const rectangles=[...svg.querySelectorAll('rect')];
    if(screen==='feedback') {
      const selected=source.querySelector('.feedback-rating [aria-pressed="true"]');
      const rating=Number(selected?.getAttribute('aria-label')?.match(/\d/)?.[0]??5);
      if(previousRating.current!==null&&previousRating.current!==rating) {
        [...svg.querySelectorAll('svg[y="386"]')].forEach((star,index)=>star.setAttribute('fill',index<rating?'#EAA02B':'none'));
      }
      previousRating.current=rating;
    }
    const at=(x:number,y:number)=>texts.find(t=>Math.abs(Number(t.getAttribute('x'))-x)<.05&&Math.abs(Number(t.getAttribute('y'))-y)<.05);
    const update=(x:number,y:number,value:string)=>{const text=at(x,y);if(text&&text.textContent!==value)text.textContent=value;};
    if(screen==='checkout') {
      const summary=source.querySelector('.checkout-form>div:first-child');
      const item=summary?.querySelector('div>p:first-child')?.textContent??'Samosa';
      const unit=(summary?.querySelector('div>p:last-child')?.textContent??'₹0').match(/₹\s*(\d+)/)?.[1]??'0';
      const vendor=summary?.querySelector(':scope>p')?.textContent??'MITS Canteen';
      const total=source.querySelector('.checkout-total strong')?.textContent??'₹0';
      update(32,317,item);update(368,317,'₹'+unit);update(32,344,vendor);update(368,658,total);
      const submit=source.querySelector<HTMLButtonElement>('form button[type=submit]');
      if(submit){update(200,711,submit.textContent?.trim()??'');const group=at(200,711)?.parentElement;if(group?.tagName.toLowerCase()==='g')group.setAttribute('opacity',submit.disabled?'.6':'1');}
      const value=source.querySelector('[aria-label="Increase value"]')?.previousElementSibling?.textContent?.trim();
      if(value)update(305,433,value);
    }
    if(screen==='detail') {
      const name=source.querySelector('.detail-screen h1')?.textContent??'Samosa';
      if(name!=='Samosa') {
        update(16,408.7,name);
        const price=source.querySelector('.detail-screen strong')?.textContent??'';
        const priceNode=at(350.53,408.7);if(priceNode){priceNode.textContent=price;priceNode.setAttribute('x','384');priceNode.setAttribute('text-anchor','end');}at(367,408.7)?.setAttribute('display','none');
        const photo=source.querySelector('.detail-screen>img');const image=svg.querySelector('image');if(photo&&image)image.setAttribute('href',photo.getAttribute('src')??'');
      }
    }
    const used=new Set<SVGTextElement>();
    const boxFor=(node:Element):Box=>{const b=node.getBoundingClientRect();return{x:(b.left-bounds.left)/scale,y:(b.top-bounds.top)/scale,width:b.width/scale,height:b.height/scale};};
    const padded=(node:Element):Box=>{const b=boxFor(node);return{x:b.x-8,y:b.y-6,width:Math.max(24,b.width+16),height:Math.max(24,b.height+12)};};
    const buttonBox=(text:Element):Box=>{
      const b=boxFor(text),cx=b.x+b.width/2,cy=b.y+b.height/2;
      const candidates=rectangles.map(boxFor).filter(r=>r.width>=24&&r.height>=20&&r.width<size.width*.98&&cx>=r.x&&cx<=r.x+r.width&&cy>=r.y&&cy<=r.y+r.height).sort((a,b)=>a.width*a.height-b.width*b.height);
      return candidates[0]??padded(text);
    };
    const elements=[...source.querySelectorAll<HTMLElement>('button,[role=button],a[href],input:not([type=hidden]):not([type=file]),select,textarea')];
    const cards=[...source.querySelectorAll('.food-card')];
    const cardRects=rectangles.filter(r=>Number(r.getAttribute('width'))===176&&Number(r.getAttribute('height'))===314).map(boxFor);
    const stockRects=rectangles.filter(r=>Number(r.getAttribute('width'))===46&&Number(r.getAttribute('height'))===26).map(boxFor);
    const next:Control[]=[];
    let stockIndex=0;
    const find=(names:string[])=>texts.find(t=>!used.has(t)&&names.some(name=>normalize(t.textContent??'')===normalize(name)));
    const cardBox=(element:HTMLElement):Box|undefined=>{
      const card=element.closest('.food-card'),index=cards.indexOf(card!);const r=cardRects[index];if(!r)return;
      if(element.matches('.food-photo-open'))return{x:r.x+10,y:r.y+10,width:156,height:138};
      if(element.matches('.food-save'))return{x:r.x+133,y:r.y+18,width:25,height:25};
      if(element.matches('.food-action'))return{x:r.x+10,y:r.y+268,width:156,height:36};
      if(element.getAttribute('aria-label')?.startsWith('Like '))return{x:r.x+10,y:r.y+238,width:70,height:24};
      if(element.getAttribute('aria-label')?.startsWith('Review '))return{x:r.x+113,y:r.y+238,width:53,height:24};
    };
    for(const [key,element]of elements.entries()) {
      if(element.closest('[data-svg-controller]')!==source)continue;
      let label=element.getAttribute('aria-label')||element.textContent?.trim()||element.getAttribute('placeholder')||'';
      let box=cardBox(element);
      const names=[element.textContent?.trim()??'',previousLabels.current.get(element)??'',label,...(aliases[element.textContent?.trim()??'']??[])].filter(Boolean);
      let text=find(names);
      if(text){used.add(text);box??=buttonBox(text);}
      if(element.getAttribute('role')==='switch')box=stockRects[stockIndex++]??box;
      const close=/^close/i.test(label);
      if(close&&isModal) {
        const closeRect=rectangles.map(boxFor).filter(r=>r.width>=24&&r.width<=40&&r.height>=24&&r.height<=40&&r.x>size.width-80&&r.y>150).sort((a,b)=>a.y-b.y)[0];
        box=closeRect??{x:size.width-56,y:220,width:32,height:32};
      }
      if(screen==='home'||screen==='saved') {
        if(element.matches('.discovery-brand'))box={x:20,y:22,width:190,height:40};
        if(/cart|orders/i.test(label)&&element.closest('.discovery-search-row'))box={x:334,y:82,width:46,height:48};
        if(element.matches('input[aria-label="Search food or shops"]'))box={x:56,y:86,width:250,height:38};
        if(element.matches('input[aria-label="Maximum price"]'))box={x:32,y:278,width:60,height:32};
        if(element.matches('input[type=checkbox]')) {
          const name=element.parentElement?.textContent?.trim()??'';text=find([name]);if(text)box=buttonBox(text);
        }
      }
      if(screen==='dashboard') {
        if(label==='Sign out')box={x:352,y:30,width:32,height:40};
        if(element.matches('select[aria-label=Language]'))box={x:264,y:30,width:48,height:40};
      }
      if(screen==='intro'&&element.getAttribute('role')==='button')box={x:0,y:0,width:size.width,height:size.height};
      if(element.matches('input,select,textarea')&&!box) {
        const field=element.closest('label');const fieldLabel=field?.firstChild?.textContent?.trim()??'';
        text=find([fieldLabel,element.getAttribute('placeholder')??'',element instanceof HTMLSelectElement?element.selectedOptions[0]?.textContent??'':'']);
        if(text) {
          const b=boxFor(text);
          used.add(text);
          const r=rectangles.map(boxFor).filter(r=>r.width>70&&r.height>=30&&r.height<=110&&r.y>=b.y-10&&r.y<=b.y+40).sort((ra,rb)=>Math.abs(ra.y-b.y)-Math.abs(rb.y-b.y))[0];
          box=r??buttonBox(text);
        }
      }
      if(screen==='checkout') {
        if(label==='Decrease value')box={x:246,y:411,width:32,height:32};
        if(label==='Increase value')box={x:332,y:411,width:32,height:32};
      }
      if(screen==='feedback'&&/^Rate \d star/.test(label)) {
        const n=Number(label.match(/\d/)?.[0])||1;
        box={x:32+(n-1)*64,y:380,width:44,height:40};
      }
      if(screen==='feedback'&&element instanceof HTMLTextAreaElement)box={x:32,y:568,width:336,height:116};
      if(screen==='feedback'&&text&&['Liked it','Could be better'].includes(label)) {
        const value=element.getAttribute('aria-pressed')??'false',old=previousValues.current.get(element);
        if(old!==undefined&&old!==value&&box) {
          const rect=rectangles.find(r=>Math.abs(Number(r.getAttribute('x'))-box!.x)<.1&&Math.abs(Number(r.getAttribute('y'))-box!.y)<.1);
          rect?.setAttribute('fill',value==='true'?'#F06A05':'#E8ECEF');
          text.setAttribute('fill',value==='true'?'#FFFFFF':'#1F140A');
        }
        previousValues.current.set(element,value);
      }
      if(screen==='add') {
        if(element.id==='aef-title')box={x:32,y:191,width:336,height:41};
        if(element.id==='aef-price')box={x:206,y:427,width:162,height:41};
        if(label==='Decrease value')box={x:36,y:431,width:32,height:33};
        if(label==='Increase value')box={x:158,y:431,width:32,height:33};
        if(element.matches('.add-stock-control'))box={x:32,y:589,width:336,height:41};
        const price=source.querySelector<HTMLInputElement>('#aef-price')?.value;if(price)update(113,454,'₹'+price);
      }
      if(box&&(element instanceof HTMLInputElement||element instanceof HTMLSelectElement||element instanceof HTMLTextAreaElement)) {
        const value=element instanceof HTMLInputElement&&element.type==='checkbox'?String(element.checked):element.value;
        const old=previousValues.current.get(element);
        if(old!==undefined&&old!==value&&element.type!=='checkbox') {
          const target=texts.find(t=>{const b=boxFor(t);return b.x>=box!.x&&b.x<=box!.x+box!.width&&b.y>=box!.y&&b.y<=box!.y+box!.height;});
          if(target)target.textContent=element instanceof HTMLSelectElement?element.selectedOptions[0]?.textContent??'':value||element.getAttribute('placeholder')||'';
        }
        previousValues.current.set(element,value);
      }
      if(box&&element.getAttribute('role')==='switch') {
        const value=element.getAttribute('aria-checked')??'false', old=previousValues.current.get(element);
        if(old!==undefined&&old!==value) {
          const track=rectangles.find(r=>{const b=boxFor(r);return Math.abs(b.width-46)<.1&&Math.abs(b.height-26)<.1&&b.y>=box!.y-.1&&b.y<=box!.y+box!.height;});
          if(track){track.setAttribute('fill',value==='true'?'#F06A05':'#A3AEBB');const r=boxFor(track);const thumb=[...svg.querySelectorAll('circle')].find(c=>Math.abs(Number(c.getAttribute('cy'))-(r.y+13))<1&&Number(c.getAttribute('r'))===10);if(thumb)thumb.setAttribute('cx',String(r.x+(value==='true'?33:13)));}
        }
        previousValues.current.set(element,value);
      }
      if(box&&element.matches('.food-save')) {
        const value=element.getAttribute('aria-pressed')??'false',old=previousValues.current.get(element);
        const path=[...svg.querySelectorAll('path')].find(path=>{const b=boxFor(path);return b.x>=box!.x&&b.x<=box!.x+box!.width&&b.y>=box!.y&&b.y<=box!.y+box!.height;});
        if(old!==undefined&&old!==value)path?.setAttribute('fill',value==='true'?'#1F140A':'none');
        previousValues.current.set(element,value);
      }
      if(!box)continue;
      // Keep the original reference state intact; subsequent actions update its label.
      const old=previousLabels.current.get(element);
      if(text&&old!==undefined&&old!==element.textContent?.trim()&&element.matches('button'))text.textContent=element.textContent?.trim()??'';
      previousLabels.current.set(element,element.textContent?.trim()??'');
      next.push({key,element,box,label:label||'Control'});
    }
    setControls(next);
  },[markup,children,screen,skip,size,isModal,nativeState]);

  const native=skip||failed||nativeState||!markup||!visible;
  useEffect(()=>{
    if(native||!isModal||!controls.length)return;
    const root=document.getElementById(id);
    if(root&&!root.contains(document.activeElement))root.focus({preventScroll:true});
  },[native,isModal,controls.length,id]);

  const activate=(control:Control)=>{
    if(control.element.matches(':disabled'))return;
    const form=control.element.closest('form');
    if(control.element.matches('button[type=submit]')&&form&&!form.checkValidity()) {
      const invalid=form.querySelector('input:invalid,select:invalid,textarea:invalid');
      const projected=controls.find(item=>item.element===invalid);
      const field=projected?document.getElementById(id)?.querySelector<HTMLInputElement>(`[data-svg-key="${projected.key}"]`):null;
      field?.focus();field?.reportValidity();return;
    }
    control.element.click();
  };
  const change=(control:Control,value:string|boolean)=>{
    const element=control.element;
    if(element instanceof HTMLInputElement&&element.type==='checkbox') {element.click();return;}
    const prototype=element instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:element instanceof HTMLSelectElement?HTMLSelectElement.prototype:HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(prototype,'value')?.set?.call(element,String(value));
    element.dispatchEvent(new Event('input',{bubbles:true}));element.dispatchEvent(new Event('change',{bubbles:true}));
  };
  const localBox=host.current?.getBoundingClientRect();
  const ancestorId=host.current?.parentElement?.closest('[data-svg-root-id]')?.getAttribute('data-svg-root-id');
  const hostBox=localBox?.width?localBox:(ancestorId?document.getElementById(ancestorId)?.getBoundingClientRect():localBox);
  const modalWidth=hostBox?.width?Math.min(size.width,hostBox.width):size.width;
  const visual=<div id={id} data-svg-visual={screen} className={`svg-screen-visual${isModal?' svg-screen-modal':''}`} style={{maxWidth:size.width,...(isModal?{left:hostBox?.left??0,width:modalWidth}: {})}} role={isModal?'dialog':undefined} aria-modal={isModal||undefined} aria-label={screen?svgScreens[screen].replace(/^\d+_/,'').replaceAll('_',' '):undefined} tabIndex={isModal?-1:undefined} onKeyDown={event=>{if(event.key==='Tab')event.currentTarget.dataset.keyboard='true';}} onPointerMove={event=>{event.currentTarget.dataset.pointer='true';}} onPointerDown={event=>{delete event.currentTarget.dataset.keyboard;}}>
    <div className="svg-screen-canvas" style={{aspectRatio:`${size.width}/${size.height}`}}>
      <div ref={artwork} className="svg-screen-art" dangerouslySetInnerHTML={{__html:markup}}/>
      {screen==='intro'&&showIntroVideo&&<video className="svg-intro-video" src="/videos/yemunnai_intro_clean.mp4" poster="/videos/preview_intro.png" autoPlay muted playsInline onEnded={()=>setShowIntroVideo(false)}/>}
      {controls.map(control=>{
        const {element,box,label,key}=control;
        const style={left:box.x/size.width*100+'%',top:box.y/size.height*100+'%',width:box.width/size.width*100+'%',height:box.height/size.height*100+'%'};
        const disabled=element.matches(':disabled');
        if(element instanceof HTMLSelectElement)return<select key={key} aria-label={label} className="svg-screen-field" style={style} value={element.value} disabled={disabled} onChange={e=>change(control,e.target.value)}>{[...element.options].map(option=><option key={option.value} value={option.value}>{option.textContent}</option>)}</select>;
        if(element instanceof HTMLTextAreaElement)return<textarea key={key} aria-label={label} className="svg-screen-field" style={style} value={element.value} placeholder={element.placeholder} onChange={e=>change(control,e.target.value)}/>;
        if(element instanceof HTMLInputElement) {
          if(element.type==='checkbox')return<button key={key} type="button" role="checkbox" aria-checked={element.checked} aria-label={label} className="svg-screen-control" style={style} onClick={()=>change(control,!element.checked)}/>;
          return<input key={key} data-svg-key={key} type={element.type} aria-label={label} className="svg-screen-field" style={style} value={element.value} placeholder={element.placeholder} min={element.min} max={element.max} required={element.required} disabled={disabled} onChange={e=>change(control,e.target.value)} onKeyDown={event=>{if(event.key==='Enter'){event.preventDefault();const submit=controls.find(item=>item.element.closest('form')===element.closest('form')&&item.element.matches('button[type=submit]'));if(submit)activate(submit);}}}/>;
        }
        return<button key={key} type="button" role={element.getAttribute('role')??undefined} aria-label={label} aria-pressed={element.getAttribute('aria-pressed')===null?undefined:element.getAttribute('aria-pressed')==='true'} aria-checked={element.getAttribute('role')==='switch'?element.getAttribute('aria-checked')==='true':undefined} disabled={disabled} className="svg-screen-control" style={style} onClick={()=>activate(control)}><span className="sr-only">{element.textContent?.trim()||label}</span></button>;
      })}
    </div>
  </div>;
  return <div ref={host} className="svg-screen-frame" data-svg-root-id={native?undefined:id}>
    <div ref={controller} data-svg-controller={native?undefined:''} className={native?'svg-screen-native':'svg-screen-controller'} aria-hidden={native?undefined:true}><ControllerContext.Provider value={!native}>{children}</ControllerContext.Provider></div>
    {!native&&(isModal?createPortal(visual,document.body):visual)}
  </div>;
}
