import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import sharp from 'sharp';
import assert from 'node:assert/strict';

const photos=JSON.parse(await readFile('.tmp/generated-restaurant-photos.json','utf8'));
const registry=JSON.parse(await readFile('src/lib/catalog-images.json','utf8'));
for(const code of ['paradise','mallikarjuna']) {
 const root=`menu_assets/${code}`;
 const manifest=JSON.parse(await readFile(`${root}/manifest.json`,'utf8'));
 await mkdir(`${root}/images`,{recursive:true});
 await mkdir(`public/menu-assets/${code}/images`,{recursive:true});
 for(const item of manifest.items) {
  const photo=photos.find(p=>p.item_id===item.item_id);
  if(!photo) continue;
  if(item.image_status==='generated' && registry[item.image_url]?.variants?.every(v=>v.src)) {
   registry[item.image_url].fit='contain';
   continue;
  }
  const master=`${root}/images/${item.image_file}`;
  await sharp(photo.source_path).resize(1536,1536,{fit:'inside',withoutEnlargement:true}).jpeg({quality:92,chromaSubsampling:'4:4:4'}).toFile(master);
  const bytes=await readFile(master);
  await writeFile(`public${item.image_url}`,bytes);
  const metadata=await sharp(bytes).metadata();
  assert(metadata.width>=1024 && metadata.height>=1024,'Generated photos must be large enough');
  const variants=[];
  for(const width of [320,640,960]) {
   const url=item.image_url.replace(/\.jpg$/,`-${width}.webp`);
   await sharp(bytes).resize(width).webp({quality:88}).toFile(`public${url}`);
   variants.push({width,src:url});
  }
  registry[item.image_url]={width:metadata.width,height:metadata.height,variants,fit:'contain'};
  Object.assign(item,{image_status:'generated',image_generation_provider:'built-in image_gen',generation_prompt:photo.prompt,output_width:metadata.width,output_height:metadata.height});
 }
 await writeFile(`${root}/manifest.json.tmp`,JSON.stringify(manifest,null,2));
 await rename(`${root}/manifest.json.tmp`,`${root}/manifest.json`);
 console.log(code,manifest.items.filter(i=>i.image_status==='generated').length,'/',manifest.items.length,'photos saved');
}
await writeFile('src/lib/catalog-images.json.tmp',JSON.stringify(registry));
await rename('src/lib/catalog-images.json.tmp','src/lib/catalog-images.json');
