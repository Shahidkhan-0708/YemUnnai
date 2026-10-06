import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import sharp from 'sharp';

const restaurants=[];
for(const code of ['paradise','mallikarjuna']) {
 const manifest=JSON.parse(await fs.readFile(`menu_assets/${code}/manifest.json`,'utf8'));
 assert.equal(manifest.items.length,code==='paradise'?16:34);
 assert.equal(new Set(manifest.items.map(i=>i.image_url)).size,manifest.items.length);
 for(const item of manifest.items) {
  assert.equal(item.image_status,'generated',`${item.item_id}: photo not ready`);
  assert.equal(typeof item.price,'number');
  assert(item.price_display.startsWith('₹'),'Price text encoding');
  const img=await sharp(`public${item.image_url}`).metadata();
  assert(img.width>=1024&&img.height>=1024);
 }
 restaurants.push(manifest);
}
const rows=restaurants.flatMap((d,hotelIndex)=>d.items.map((item,index)=>({id:`c${hotelIndex+3}000000-0000-4000-8000-${String(index+1).padStart(12,'0')}`,vendor_id:d.vendor_id,name:item.name,price:item.price,category:'cooked',action_type:'walkin',image_url:item.image_url,in_stock:item.available,is_vegetarian:item.is_vegetarian,source_item_id:item.item_id,source_hotel_code:d.code.toUpperCase(),menu_category:item.category,food_type:item.food_type,description:item.description,details:null,price_display:item.price_display,price_variants:item.price_variants,source_image_file:item.image_file,menu_position:index})));
const columns=Object.keys(rows[0]);
const json=JSON.stringify(rows).replaceAll("'","''");
const sql=`begin;
create temporary table preserved_other_foods on commit drop as select * from public.food_items where vendor_id not in ('${restaurants.map(d=>d.vendor_id).join("','")}');
create temporary table incoming_menu on commit drop as select * from jsonb_populate_recordset(null::public.food_items,'${json}'::jsonb);
insert into public.food_items(${columns.join(',')}) select ${columns.join(',')} from incoming_menu on conflict(id) do nothing;
do $$ begin
assert (select count(*)=50 from incoming_menu), 'Expected fifty menu items';
assert (select count(*)=16 from public.food_items where vendor_id='${restaurants[0].vendor_id}'), 'Paradise count mismatch';
assert (select count(*)=34 from public.food_items where vendor_id='${restaurants[1].vendor_id}'), 'Mallikarjuna count mismatch';
assert not exists(select 1 from incoming_menu r left join public.food_items f on f.id=r.id where f.id is null or row(${columns.map(c=>'f.'+c).join(',')}) is distinct from row(${columns.map(c=>'r.'+c).join(',')})), 'Menu mapping mismatch';
assert not exists(select * from preserved_other_foods except select * from public.food_items), 'Other hotels must remain unchanged';
assert (select count(*)=2 from public.vendors v join private.vendor_pins p on p.outlet_id=v.id and p.user_id=v.owner_id where v.id in ('${restaurants.map(d=>d.vendor_id).join("','")}')), 'Seller accounts missing';
end $$;
update public.vendors set is_active=true where id in ('${restaurants.map(d=>d.vendor_id).join("','")}');
select v.name,count(*) as menu_items,count(distinct f.image_url) as product_images from public.food_items f join public.vendors v on v.id=f.vendor_id where v.id in ('${restaurants.map(d=>d.vendor_id).join("','")}') group by v.name;
commit;`;
await fs.writeFile('.tmp/import-new-restaurants.sql',sql);
await fs.writeFile('docs/import-reports/paradise-mallikarjuna.json',JSON.stringify({restaurants:restaurants.map(d=>({name:d.name,menu_items:d.items.length,images:d.items.length,source_images:d.source_images,unknown_food_types:d.items.filter(i=>i.is_vegetarian===null).map(i=>i.name)})),photos:'AI-generated at user request, not photographs supplied by these restaurants',existing_menus_preserved:true},null,2));
console.log('PASS: fifty menu items, distinct generated images, exact source prices, restaurant isolation. Production import prepared.');
