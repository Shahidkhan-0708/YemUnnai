import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import {createHash} from 'node:crypto';
const configurations=[
 {directory:'.tmp/p2-menu',hotel:'HOTEL1',prefix:'H1-',name:'Pizza And Pasta (P2)',vendor:'a0000000-0000-4000-8000-000000000010',count:89},
 {directory:'.tmp/mits-menu',hotel:'HOTEL2',prefix:'H2-',name:'MITS Canteen',vendor:'a0000000-0000-4000-8000-000000000001',count:53},
];
const images=JSON.parse(await fs.readFile('src/lib/catalog-images.json','utf8'));
const rows=[],reports=[];
const fail=message=>{throw Error(message);};
for(const config of configurations){
 const manifest=JSON.parse(await fs.readFile(path.join(config.directory,'menu_manifest.json'),'utf8'));
 if(manifest.hotel_code!==config.hotel||manifest.items.length!==config.count||manifest.menu_item_count!==config.count)fail('Unexpected package identity/count: '+config.hotel);
 const seen=new Set(),names=new Set(),photos=new Set();
 const output=path.resolve('public/images/menus',config.hotel.toLowerCase());
 await fs.mkdir(output,{recursive:true});
 await fs.mkdir('data/restaurant-menus/'+config.hotel.toLowerCase(),{recursive:true});
 await fs.copyFile(path.join(config.directory,'menu_manifest.json'),'data/restaurant-menus/'+config.hotel.toLowerCase()+'/menu_manifest.json');
 for(const [position,item] of manifest.items.entries()){
  if(!item.item_id?.startsWith(config.prefix)||seen.has(item.item_id)||names.has(item.name))fail('Duplicate or cross-hotel item: '+item.item_id);
  seen.add(item.item_id);names.add(item.name);
  if(!item.name?.trim()||!item.category?.trim()||!Array.isArray(item.price_variants)||typeof item.available!=='boolean')fail('Invalid fields: '+item.item_id);
  if(item.price!==null&&(!Number.isSafeInteger(item.price)||item.price<0))fail('Invalid price: '+item.item_id);
  if(item.price_variants.some(v=>!v.name||!Number.isSafeInteger(v.price)||v.price<0||v.currency!=='INR'))fail('Invalid variants: '+item.item_id);
  if(!['Veg','Non-Veg','Unknown'].includes(item.food_type)||item.is_vegetarian!==({Veg:true,'Non-Veg':false,Unknown:null}[item.food_type]))fail('Inconsistent food type: '+item.item_id);
  const relative=item.image_path||item.image_url;
  if(!relative||relative.replaceAll('\\','/')!==`images/${item.image_file}`||!item.image_file.startsWith(config.hotel.toLowerCase()+'_')||photos.has(item.image_file))fail('Invalid/cross-hotel image mapping: '+item.item_id);
  const input=path.resolve(config.directory,relative);
  if(!input.startsWith(path.resolve(config.directory,'images')+path.sep))fail('Image path escapes package');
  let buffer;try{buffer=await fs.readFile(input);}catch{fail('Missing image: '+relative);}
  photos.add(item.image_file);
  const metadata=await sharp(buffer).metadata();if(!metadata.width||!metadata.height)fail('Unreadable image: '+relative);
  await fs.writeFile(path.join(output,item.image_file),buffer);
  const url='/images/menus/'+config.hotel.toLowerCase()+'/'+item.image_file;
  const hash=createHash('sha256').update(buffer).digest('hex').slice(0,10);
  const variants=[];
  for(const width of [...new Set([Math.min(320,metadata.width),Math.min(640,metadata.width)])]){
   const file=path.parse(item.image_file).name+'-'+hash+'-'+width+'.webp';
   const optimized=await sharp(buffer).rotate().resize({width,withoutEnlargement:true}).webp({quality:85}).toBuffer();
   await fs.writeFile(path.join(output,file),optimized);variants.push({src:'/images/menus/'+config.hotel.toLowerCase()+'/'+file,width});
  }
  images[url]={width:metadata.width,height:metadata.height,variants};
  const number=Number(item.item_id.slice(3));
  rows.push({id:`c${config.hotel==='HOTEL1'?'1':'2'}000000-0000-4000-8000-${String(number).padStart(12,'0')}`,vendor_id:config.vendor,name:item.name,price:item.price,category:'cooked',action_type:'walkin',image_url:url,in_stock:item.available,is_vegetarian:item.is_vegetarian,source_item_id:item.item_id,source_hotel_code:config.hotel,menu_category:item.category,food_type:item.food_type,description:item.description,details:item.details,price_display:item.price_display,price_variants:item.price_variants,source_image_file:item.image_file,menu_position:position});
 }
 const actual=(await fs.readdir(path.join(config.directory,'images'))).filter(f=>/\.(jpg|jpeg|png)$/i.test(f));
 if(actual.length!==config.count||actual.some(f=>!photos.has(f)))fail('Unreferenced/extra image in '+config.hotel);
 reports.push({hotel:config.hotel,restaurant:config.name,menuItems:seen.size,imagesFound:photos.size,imagesMissing:0,importErrors:0,missingPrices:manifest.items.filter(i=>i.price===null&&!i.price_variants.length).length,variantItems:manifest.items.filter(i=>i.price_variants.length).length});
}
await fs.writeFile('src/lib/catalog-images.json',JSON.stringify(images));
await fs.writeFile('.tmp/restaurant-import-rows.json',JSON.stringify(rows,null,2));
await fs.mkdir('docs/import-reports',{recursive:true});
await fs.writeFile('docs/import-reports/restaurant-menu-packages.json',JSON.stringify({stage:'validated-and-prepared',reports},null,2));
const schema=await fs.readFile('supabase/migrations/20261005082955_restaurant_menu_manifest.sql','utf8');
const literal=value=>"'"+value.replaceAll("'","''")+"'";
const data=literal(JSON.stringify(rows));
const sql=`begin;
${schema}
create temporary table import_rows on commit drop as select * from jsonb_populate_recordset(null::public.food_items, ${data}::jsonb);
create temporary table preserved_receipts on commit drop as select id,item_name,unit_price,quantity,total,status from public.orders;
create temporary table preserved_other_foods on commit drop as select * from public.food_items where vendor_id not in ('${configurations[0].vendor}','${configurations[1].vendor}');
insert into public.vendors(id,name,image_url,is_active,is_online) values ('${configurations[0].vendor}','Pizza And Pasta (P2)','/images/shop_p2.svg',true,true) on conflict(id) do nothing;
do $$ begin
 assert (select name='Pizza And Pasta (P2)' from public.vendors where id='${configurations[0].vendor}'), 'P2 vendor identity mismatch';
 assert (select name='MITS Canteen' from public.vendors where id='${configurations[1].vendor}'), 'MITS vendor identity mismatch';
end $$;
-- Authorized replacement applies only to MITS's old menu. Order snapshots survive via ON DELETE SET NULL.
delete from public.food_items where vendor_id='${configurations[1].vendor}' and source_item_id is null;
insert into public.food_items(id,vendor_id,name,price,category,action_type,image_url,in_stock,is_vegetarian,source_item_id,source_hotel_code,menu_category,food_type,description,details,price_display,price_variants,source_image_file,menu_position,created_at)
 select id,vendor_id,name,price,category,action_type,image_url,in_stock,is_vegetarian,source_item_id,source_hotel_code,menu_category,food_type,description,details,price_display,price_variants,source_image_file,menu_position,now()+menu_position*interval '1 millisecond' from import_rows on conflict(id) do nothing;
do $$ begin
 assert (select count(*)=89 from public.food_items where vendor_id='${configurations[0].vendor}'), 'P2 expected 89 items';
 assert (select count(*)=53 from public.food_items where vendor_id='${configurations[1].vendor}'), 'MITS expected 53 items';
 assert not exists(select 1 from import_rows r left join public.food_items f on f.id=r.id where f.id is null or row(f.vendor_id,f.name,f.price,f.source_item_id,f.source_hotel_code,f.menu_category,f.food_type,f.description,f.details,f.price_display,f.price_variants,f.image_url,f.is_vegetarian,f.in_stock) is distinct from row(r.vendor_id,r.name,r.price,r.source_item_id,r.source_hotel_code,r.menu_category,r.food_type,r.description,r.details,r.price_display,r.price_variants,r.image_url,r.is_vegetarian,r.in_stock)), 'Manifest fields must match exactly';
 assert not exists(select * from preserved_receipts except select id,item_name,unit_price,quantity,total,status from public.orders), 'All existing receipts preserved';
 assert not exists(select * from preserved_other_foods except select * from public.food_items), 'Other restaurant menus unchanged';
 assert not exists(select 1 from public.food_items where source_hotel_code='HOTEL1' and vendor_id<>'${configurations[0].vendor}' or source_hotel_code='HOTEL2' and vendor_id<>'${configurations[1].vendor}'), 'Restaurant isolation';
end $$;
insert into supabase_migrations.schema_migrations(version,name,statements) values ('20261005082955','restaurant_menu_manifest',array[${literal(schema)}]) on conflict(version) do nothing;
notify pgrst,'reload schema';
commit;
select source_hotel_code,count(*) as menu_items,count(distinct image_url) as distinct_images,count(*) filter(where price is null and price_variants='[]') as missing_prices from public.food_items where source_hotel_code in ('HOTEL1','HOTEL2') group by source_hotel_code order by source_hotel_code;
`;
await fs.writeFile('.tmp/import-restaurant-menus.sql',sql);
console.log(JSON.stringify(reports,null,2));
