import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {createHash} from 'node:crypto';
let total=0;
const registry=JSON.parse(await fs.readFile('src/lib/catalog-images.json','utf8'));
for(const [hotel,expected] of [['hotel1',89],['hotel2',53]]){
 const original=JSON.parse(await fs.readFile(`data/restaurant-menus/${hotel}/menu_manifest.json`,'utf8'));
 const manifest=JSON.parse(await fs.readFile(`menu_assets/${hotel}/manifest.json`,'utf8'));
 const report=JSON.parse(await fs.readFile(`menu_assets/${hotel}/extraction_report.json`,'utf8'));
 const files=await fs.readdir(`menu_assets/${hotel}/images`);
 assert.equal(files.length,expected);assert.equal(manifest.items.length,expected);assert.equal(report.images_extracted,expected);
 assert.equal(manifest.hotel_id,hotel);
 let largestPixelError=0;
 let cardBytes=0,maxCardBytes=0;
 for(const item of manifest.items){
  const source=original.items.find(product=>product.item_id===item.item_id);assert(source,'Unknown item ID');
  for(const key of ['name','category','food_type','is_vegetarian','price','price_variants','description','details'])assert.deepEqual(item[key],source[key],`Changed dataset field: ${item.item_id} ${key}`);
  assert(files.includes(item.image_file)&&item.image_file.startsWith(hotel+'_'+item.item_id.slice(3)+'_'));
  assert.equal(item.image_status,'extracted');assert(item.image_url.startsWith('/menu-assets/'+hotel+'/images/'));
  const image=await fs.readFile(`menu_assets/${hotel}/${item.image_path}`);
  const metadata=await sharp(image).metadata();assert(metadata.width>=1024&&metadata.height>=1024&&image.length>8000);
  assert.equal(createHash('sha256').update(image).digest('hex'),item.sha256);
  assert.deepEqual(image,await fs.readFile('public'+item.image_url),'Public image differs from delivery');
  const entry=registry[item.image_url];assert(entry?.extracted&&entry.fit==='contain','Source photo must fit without clipping');
  assert.deepEqual(entry.variants.map(variant=>variant.width),[320,640,960]);
  for(const variant of entry.variants){
   assert(variant.src.startsWith(`/menu-assets/${hotel}/images/${item.image_file.replace('.jpg','-')}${item.sha256.slice(0,10)}-`),'Stale image fingerprint or wrong dish');
   const bytes=await fs.readFile('public'+variant.src),data=await sharp(bytes).metadata();
   assert.equal(data.width,variant.width);assert.equal(data.format,'webp');assert(bytes.length>1000);
   if(variant.width===320){assert(bytes.length<100000,'Card photo exceeds mobile download budget');cardBytes+=bytes.length;maxCardBytes=Math.max(maxCardBytes,bytes.length);}
  }
  const box=item.source_bbox;assert(box.y+box.height<=item.source_tile.caption_start-2,'Caption enters crop');
  const crop=await sharp(item.source_image).extract({left:box.x,top:box.y,width:box.width,height:box.height}).removeAlpha().raw().toBuffer();
  const restored=await sharp(image).resize(box.width,box.height,{fit:'fill',kernel:'lanczos3'}).removeAlpha().raw().toBuffer();
  assert.equal(crop.length,restored.length);
  let error=0;for(let i=0;i<crop.length;i++)error+=(crop[i]-restored[i])**2;
  const rmse=Math.sqrt(error/crop.length);assert(rmse<12,`Output no longer resembles original pixels: ${item.item_id} (${rmse})`);
  largestPixelError=Math.max(largestPixelError,rmse);
 }
 console.log(JSON.stringify({hotel,menuItems:expected,imageRecords:manifest.items.length,imageFiles:files.length,maxSourcePixelRMSE:+largestPixelError.toFixed(3),averageCardBytes:Math.round(cardBytes/expected),maxCardBytes}));
 total+=files.length;
}
assert.equal(total,142);console.log('PASS: 142 source-derived individual photos, unchanged products and correct restaurant ownership.');
