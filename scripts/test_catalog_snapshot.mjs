import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import ts from 'typescript';
let sequence=0;
const source=await fs.readFile('src/lib/catalogSnapshot.ts','utf8');
async function store(initial,blocked=false){
 const storage=new Map(initial?[['yem-public-menu-v1',JSON.stringify(initial)]]:[]);
 globalThis.__snapshotEnv={storage,blocked};
 const code=ts.transpileModule(`const env=globalThis.__snapshotEnv;const safeStorage={getItem:k=>env.blocked?null:env.storage.get(k)??null,setItem:(k,v)=>{if(!env.blocked)env.storage.set(k,v);},removeItem:k=>env.storage.delete(k)};\n`+source.replace(/^import .*;\r?\n/gm,'')+`\n// ${sequence++}`,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2023}}).outputText;
 return await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
}
const row={id:'real-food',name:'Tea',vendor:'Cafe',price:10,category:'cooked',actionType:'walkin',inStock:true,image:'/images/item_tea.jpg'};
let module=await store();assert.deepEqual(module.cachedFoods(),[]);module.saveFoodSnapshot([row]);assert.equal(module.cachedFoods()[0].id,row.id);module.clearCatalogSnapshot();assert.equal(module.cachedFoods().length,0);
module=await store({foods:{at:Date.now(),rows:[row]}});assert.equal(module.cachedFoods().length,1);
module=await store({foods:{at:Date.now()-300001,rows:[row]}});assert.equal(module.cachedFoods().length,0,'Expired data is not displayed');
module=await store({foods:{at:Date.now()+10000,rows:[row]}});assert.equal(module.cachedFoods().length,0,'Future timestamps rejected');
module=await store({foods:{at:Date.now(),rows:[{id:'bad',name:'Bad',image:'x'}]}});assert.equal(module.cachedFoods().length,0,'Invalid cached rows rejected');
module=await store(null,true);module.saveFoodSnapshot([row]);assert.equal(module.cachedFoods().length,1,'Memory cache still works with blocked storage');
console.log('PASS: cached real menu, expiry, corruption checks, seller invalidation and storage-blocked fallback.');
