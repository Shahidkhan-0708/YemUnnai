// Deterministic source-pixel extraction. No generative models or replacement photographs.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import sharp from 'sharp';

const target=1536;
const restoration=process.argv.includes('--superres')
 ? JSON.parse(await fs.readFile('.tmp/menu-upscale/restoration.json','utf8')) : null;
const layouts=[
 {hotel:'hotel1',source:'image copy 19.png',expected:89,left:0,right:1536,rows:[0,125,253,380,508,636,764,891,1024],columns:[12,12,12,12,12,12,12,11]},
 {hotel:'hotel2',source:'image copy 20.png',expected:53,left:904,right:1535,rows:[42,161,267,383,495,598,706,811,911,1018],columns:[6,6,6,6,6,6,5,6,6]},
];
const registry=JSON.parse(await fs.readFile('src/lib/catalog-images.json','utf8'));
const allImages=[];
const slug=name=>name.toLowerCase().replace(/[^a-z0-9\s]/g,'').trim().replace(/\s+/g,'_');
const gold=(r,g,b)=>r>65&&r<220&&g>40&&g<165&&b>20&&b<115&&r>g*1.13&&g>b*1.15&&r<g*2.4;
for(const layout of layouts){
 const dataset=JSON.parse(await fs.readFile(`data/restaurant-menus/${layout.hotel}/menu_manifest.json`,'utf8'));
 assert.equal(dataset.items.length,layout.expected);
 const sourceBuffer=await fs.readFile(layout.source);
 const {data,info}=await sharp(sourceBuffer).removeAlpha().raw().toBuffer({resolveWithObject:true});
 const pixel=(x,y)=>{const n=(y*info.width+x)*info.channels;return [data[n],data[n+1],data[n+2]];};
 const slots=[];
 for(let row=0;row<layout.columns.length;row++){
  const top=layout.rows[row]+2,bottom=layout.rows[row+1]-2,count=layout.columns[row];
  // Detect each frame independently: several rows have uneven card widths.
  const frames=[];let frame;
  for(let x=layout.left;x<layout.right;x++){
   let matches=0;for(let y=top;y<bottom;y++)matches+=gold(...pixel(x,y));
   const fraction=matches/(bottom-top);
   if(fraction>.65){
    if(frame&&x-frame.end<=6){frame.end=x;if(fraction>frame.score){frame.x=x;frame.score=fraction;}}
    else{frame={x,end:x,score:fraction};frames.push(frame);}
   }
  }
  const interior=frames.filter(frame=>frame.x>layout.left+12&&frame.x<layout.right-12);
  const pitch=(layout.right-layout.left)/count;
  const edges=layout.hotel==='hotel1'&&row===7
   ? [layout.left,...interior.map(frame=>frame.x),layout.right]
   : Array.from({length:count+1},(_,column)=>{
      if(column===count)return layout.right;
      const expected=layout.left+pitch*column;
      // Reject isolated gold food/utensil edges far from the regular grid.
      return frames.filter(frame=>Math.abs(frame.x-expected)<pitch*.18)
       .sort((a,b)=>b.score-a.score||Math.abs(a.x-expected)-Math.abs(b.x-expected))[0]?.x??Math.round(expected);
     });
  assert.equal(edges.length,count+1,'Unexpected frame count: '+layout.source+' row '+row+' '+JSON.stringify(edges));
  for(let column=0;column<count;column++){
   const left=edges[column]+4,right=edges[column+1]-4;
   assert(right>left&&bottom>top,'Invalid detected tile');
   // The last white text cluster on a dark caption band locates the product label.
   const groups=[];let group;
   for(let y=Math.max(top,Math.floor(bottom-(bottom-top)*.28));y<bottom;y++){
    let whites=0,dark=0;
    for(let x=left;x<right;x++){const [r,g,b]=pixel(x,y);whites+=Math.min(r,g,b)>165&&Math.max(r,g,b)-Math.min(r,g,b)<55;dark+=Math.max(r,g,b)<48;}
    if(whites>=2&&dark/(right-left)>.2){
     if(group&&y-group.end<=2)group.end=y;else{group={start:y,end:y};groups.push(group);}
    }
   }
   const caption=groups.filter(g=>g.end-g.start>=2).at(-1);
   assert(caption,'Missing detectable caption: '+layout.source+' '+row+','+column);
   let photoBottom=caption.start-2;
   // Trim the caption's empty black band while retaining actual photographic background.
   for(let y=photoBottom-1;y>=Math.max(top,caption.start-10);y--){
    let dark=0;for(let x=left;x<right;x++)dark+=Math.max(...pixel(x,y))<48;
    if(dark/(right-left)<.85)break;
    photoBottom=y;
   }
   assert(photoBottom-top>45,'Photo extraction too small');
   slots.push({row,column,x:left,y:top,width:right-left,height:photoBottom-top,caption_start:caption.start,tile_bottom:bottom});
  }
 }
 const items=[],hashes=[];
 const outputDirectory=`menu_assets/${layout.hotel}/images`;
 const publicDirectory=`public/menu-assets/${layout.hotel}/images`;
 await fs.mkdir(outputDirectory,{recursive:true});await fs.mkdir(publicDirectory,{recursive:true});
 for(const [index,item] of dataset.items.entries()){
  // Hotel 1's source contains two additional pastas after item 32; neither is in the dataset.
  const slotIndex=layout.hotel==='hotel1'&&index>=32?index+2:index;
  const box=slots[slotIndex];assert(box,'Missing source photo: '+item.item_id);
  const crop={left:box.x,top:box.y,width:box.width,height:box.height};
  const outputWidth=Math.round(box.width*target/Math.min(box.width,box.height));
  const outputHeight=Math.round(box.height*target/Math.min(box.width,box.height));
  const file=`${layout.hotel}_${item.item_id.slice(3)}_${slug(item.name)}.jpg`;
  const native=await sharp(sourceBuffer).extract(crop).png().toBuffer();
  const croppedStats=await sharp(native).stats();
  assert(croppedStats.channels.some(channel=>channel.stdev>12),'Blank/flat photo: '+item.item_id);
  const pixels=await sharp(native).removeAlpha().raw().toBuffer();
  let black=0,white=0;for(let i=0;i<pixels.length;i+=3){black+=Math.max(pixels[i],pixels[i+1],pixels[i+2])<24;white+=Math.min(pixels[i],pixels[i+1],pixels[i+2])>240;}
  assert(black/(pixels.length/3)<.8&&white/(pixels.length/3)<.8,'Mostly blank photo: '+item.item_id);
  const hashPixels=await sharp(native).greyscale().resize(9,8,{fit:'fill'}).raw().toBuffer();
  let dHash=0n;for(let y=0;y<8;y++)for(let x=0;x<8;x++)dHash=(dHash<<1n)|BigInt(hashPixels[y*9+x]>hashPixels[y*9+x+1]);
  const restored=restoration?.items.find(record=>record.item_id===item.item_id&&record.hotel===layout.hotel);
  if(restoration){
   assert(restored,'Missing restored photo: '+item.item_id);
   assert.deepEqual(restored.source_bbox,{x:box.x,y:box.y,width:box.width,height:box.height});
   assert.equal(restored.source_sha256,createHash('sha256').update(sourceBuffer).digest('hex'));
  }
  const restoredPixels=restored ? await fs.readFile(restored.image_path) : null;
  if(restored)assert.equal(createHash('sha256').update(restoredPixels).digest('hex'),restored.sha256);
  const jpeg=restoredPixels
   ? await sharp(restoredPixels).resize(outputWidth,outputHeight,{kernel:'lanczos3'}).jpeg({quality:96,chromaSubsampling:'4:4:4'}).toBuffer()
   : await sharp(native).blur(.3).resize(outputWidth,outputHeight,{kernel:'lanczos3'})
     .linear(1.015,-1.5).sharpen({sigma:.5,m1:.3,m2:.5}).jpeg({quality:95,chromaSubsampling:'4:4:4'}).toBuffer();
  const metadata=await sharp(jpeg).metadata();assert(metadata.width>=1024&&metadata.height>=1024&&jpeg.length>8000);
  await fs.writeFile(`${outputDirectory}/${file}`,jpeg);await fs.writeFile(`${publicDirectory}/${file}`,jpeg);
  const url=`/menu-assets/${layout.hotel}/images/${file}`,variants=[];
  for(const width of [320,640,960]){
   const fingerprint=createHash('sha256').update(jpeg).digest('hex').slice(0,10);
   const optimized=file.replace('.jpg',`-${fingerprint}-${width}.webp`);
   await sharp(restoredPixels??jpeg).resize({width,kernel:'lanczos3'}).webp({quality:92,effort:6,smartSubsample:true}).toFile(`${publicDirectory}/${optimized}`);
   variants.push({src:`/menu-assets/${layout.hotel}/images/${optimized}`,width});
  }
  registry[url]={width:outputWidth,height:outputHeight,variants,extracted:true,fit:'contain'};
  const record={...item,image_file:file,image_path:`images/${file}`,image_url:url,image_status:'extracted',
   source_image:layout.source,source_bbox:{x:box.x,y:box.y,width:box.width,height:box.height},
   source_tile:{row:box.row,column:box.column,caption_start:box.caption_start,tile_bottom:box.tile_bottom},
   output_width:outputWidth,output_height:outputHeight,native_resolution:`${box.width}x${box.height}`,
   processing:restored ? 'original crop; FSRCNN 4x luminance restoration blended with source interpolation; Lanczos3 final resize; no dish regeneration' : 'source crop; light Gaussian denoise; Lanczos3 upscale; mild contrast; mild sharpening',
   perceptual_hash:dHash.toString(16).padStart(16,'0'),sha256:createHash('sha256').update(jpeg).digest('hex')};
  items.push(record);hashes.push({id:item.item_id,hash:dHash,sha:record.sha256});allImages.push(record);
 }
 const duplicates=[],similar=[];
 for(let a=0;a<hashes.length;a++)for(let b=a+1;b<hashes.length;b++){
  const distance=(hashes[a].hash^hashes[b].hash).toString(2).replaceAll('0','').length;
  if(hashes[a].sha===hashes[b].sha)duplicates.push([hashes[a].id,hashes[b].id]);
  else if(distance<=5)similar.push({items:[hashes[a].id,hashes[b].id],distance});
 }
 const files=(await fs.readdir(outputDirectory)).filter(name=>name.endsWith('.jpg'));
 assert.equal(files.length,layout.expected);assert.equal(new Set(items.map(i=>i.image_file)).size,layout.expected);
 const report={hotel:layout.hotel,expected_items:layout.expected,image_records:items.length,images_extracted:files.length,
  images_missing:0,images_failed:0,images_duplicate:duplicates.length,duplicates,perceptually_similar_candidates:similar,
  min_resolution:'1024x1024',target_resolution:'1536px minimum on the shorter side; natural aspect ratio preserved',
  method:restoration ? 'FSRCNN 4x luminance super-resolution (80%) blended with Lanczos4 source interpolation (20%); original source chroma; Lanczos3 final resize; no regenerated dishes' : 'Lanczos3 fallback; no generative model, new pixels are interpolated exclusively from source pixels',
  ...(restoration ? {restoration_model:{name:restoration.model,url:restoration.model_url,sha256:restoration.model_sha256},max_native_restoration_rmse:Math.max(...restoration.items.filter(record=>record.hotel===layout.hotel).map(record=>record.source_pixel_rmse))} : {}),
  inspected_sources:[19,20,21,22,23,24].map(i=>`image copy ${i}.png`),selected_source:layout.source,
  source_sha256:createHash('sha256').update(sourceBuffer).digest('hex'),
  excluded_source_tiles:layout.hotel==='hotel1'?['Romeno Chicken Pasta','Aglio Prawns Pasta','Hotel 2 tiles in last row']:[],
  quality_limit:'Source photos are approximately 100px across. Larger dimensions cannot recover absent photographic detail.'};
 await fs.writeFile(`menu_assets/${layout.hotel}/manifest.json`,JSON.stringify({hotel_id:layout.hotel,items},null,2));
 await fs.writeFile(`menu_assets/${layout.hotel}/extraction_report.json`,JSON.stringify(report,null,2));
 console.log(JSON.stringify({hotel:layout.hotel,images:files.length,duplicates:duplicates.length,similarCandidates:similar.length}));
}
assert.equal(allImages.length,142);
await fs.writeFile('src/lib/catalog-images.json',JSON.stringify(registry));
await fs.writeFile('.tmp/extracted-menu-mapping.json',JSON.stringify(allImages,null,2));
