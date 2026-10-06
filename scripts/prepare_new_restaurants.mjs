import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const definitions = [
  { code: 'paradise', name: 'Paradise', vendor_id: 'a0000000-0000-4000-8000-000000000011', source_images: ['WhatsApp Image 2026-10-05 at 10.50.37 PM.jpeg'], rows: [
    ['Chicken Biryani',100,false,'Biryani & Rice'], ['Biryani Rice',50,null,'Biryani & Rice'], ['Chicken Rice',100,false,'Biryani & Rice'], ['Egg Rice',60,false,'Biryani & Rice'], ['Veg Rice',60,true,'Biryani & Rice'], ['Gobi Rice',60,true,'Biryani & Rice'], ['Egg Gobi Rice',70,false,'Biryani & Rice'],
    ['Chilli Chicken',100,false,'Starters'], ['Pepper Chicken',100,false,'Starters'], ['Chicken 65',100,false,'Starters'], ['Lemon Chicken',100,false,'Starters'], ['Schezwan Chicken',100,false,'Starters'], ['Chicken Manchurian',100,false,'Starters'], ['Chicken Curry',100,false,'Starters'], ['Chicken Fry',100,false,'Starters'], ['Chicken Kebab',100,false,'Starters'],
  ] },
  { code: 'mallikarjuna', name: 'Mallikarjuna Mess', vendor_id: 'a0000000-0000-4000-8000-000000000012', source_images: ['image copy 25.png','image copy 26.png'], rows: [
    ['Idly',10,true,'Morning','per piece'], ['Vada',10,true,'Morning','per piece'], ['Poori',20,true,'Morning','per piece'], ['Lemon Rice',50,true,'Morning','per plate'], ['Pongal',40,true,'Morning','per plate'], ['Plain Dosa',25,true,'Morning','per piece'], ['Karam Dosa',25,true,'Morning','per piece'], ['Masala Dosa',40,true,'Morning'], ['Egg Dosa',35,false,'Morning'], ['Double Egg Dosa',50,false,'Morning'], ['Onion Dosa',50,true,'Morning'], ['Uthappam',50,true,'Morning'], ['Ghee Karam Dosa',60,true,'Morning'], ['Ghee Masala Dosa',70,true,'Morning'],
    ['Meals',70,true,'Afternoon'], ['Ragi Mudda',30,true,'Afternoon'], ['Kushka',50,null,'Afternoon'], ['Biryani',110,false,'Afternoon'], ['Parota',50,true,'Afternoon'], ['Chapathi',50,true,'Afternoon'], ['Egg Rice',60,false,'Afternoon'], ['Gobi Rice',70,true,'Afternoon'], ['Jeera Rice',70,true,'Afternoon'], ['Vegetable Rice',70,true,'Afternoon'], ['Tomato Rice',70,true,'Afternoon'], ['Chicken Rice',100,false,'Afternoon'], ['Egg Noodles',70,false,'Afternoon'], ['Gobi Noodles',70,true,'Afternoon'], ['Chicken Noodles',100,false,'Afternoon'], ['Gobi Manchurian',70,true,'Afternoon'], ['Chicken Curry',120,false,'Afternoon'], ['Chicken Fry',120,false,'Afternoon'], ['Kaju Rice',120,true,'Afternoon'], ['Ghee Rice',100,true,'Afternoon'],
  ] },
];
for (const d of definitions) {
  const items = d.rows.map(([name,price,veg,category,unit],index) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
    return { item_id: `${d.code.toUpperCase()}-${String(index+1).padStart(3,'0')}`, name, price, price_display: `₹${price}${unit ? ` / ${unit}` : ''}`, price_variants: unit ? [{name:unit,price,currency:'INR'}] : [], category, food_type: veg === null ? 'Not specified' : veg ? 'Veg' : 'Non-Veg', is_vegetarian: veg, description: unit ? `Price ${unit}.` : '', image_file: `${String(index+1).padStart(3,'0')}_${slug}.jpg`, image_url: `/menu-assets/${d.code}/images/${String(index+1).padStart(3,'0')}_${slug}.jpg`, image_status: 'pending_generation', available: true };
  });
  assert.equal(new Set(items.map(i=>i.item_id)).size,items.length);
  assert(items.every(i=>Number.isFinite(i.price)&&i.price>0));
  await mkdir(`menu_assets/${d.code}`,{recursive:true});
  await writeFile(`menu_assets/${d.code}/manifest.json`,JSON.stringify({...d,rows:undefined,items},null,2));
  console.log(d.name,items.length,'source-menu records prepared');
}
