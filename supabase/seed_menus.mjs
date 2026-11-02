/**
 * Seed the real menus for MITS Canteen and MITS Cafe.
 * Prices from the canteen committee list. Idempotent — safe to re-run.
 *
 * Run: node supabase/seed_menus.mjs
 */
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the server environment.');

const HEADERS = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
};

const CANTEEN = 'a0000000-0000-4000-8000-000000000001';
const CAFE = 'a0000000-0000-4000-8000-000000000006';
const EKDANT = 'a0000000-0000-4000-8000-000000000007';
const LICKIES = 'a0000000-0000-4000-8000-000000000008';
const NEWCAFE = 'a0000000-0000-4000-8000-000000000009';

// MITS Canteen: Tea ₹10 · Coffee ₹10 · Samosa ₹15
// MITS Cafe: Tea ₹15 · Coffee ₹20 · Black coffee ₹30 · Sonti coffee ₹30 · Milk ₹15 · Batanees ₹20/pack
// Ekdant's Cafe: Tea ₹10 · Coffee ₹10 · Samosa ₹15 · Mirchi bajji 3 for ₹20
// Lickies: Tea ₹10 · Coffee ₹10 · Samosa ₹15 · Popsicles from ₹10
// New Cafe: Tea ₹10 · Coffee ₹10 · Samosa ₹15
const MENU = [
  // --- MITS Canteen ---
  { vendor_id: CANTEEN, name: 'Tea', price: 10, category: 'cooked', action_type: 'walkin', image_url: '/images/item_tea.jpg', liked: 64, disliked: 0, reviews: 21, rating: 4.6 },
  { vendor_id: CANTEEN, name: 'Coffee', price: 10, category: 'cooked', action_type: 'walkin', image_url: '/images/item_coffee.jpg', liked: 71, disliked: 0, reviews: 25, rating: 4.7 },
  { vendor_id: CANTEEN, name: 'Dosa', price: 35, category: 'cooked', action_type: 'order', image_url: '/images/item_dosa.png', liked: 82, disliked: 0, reviews: 29, rating: 4.8 },
  { vendor_id: CANTEEN, name: 'Masala Dosa', price: 40, category: 'cooked', action_type: 'order', image_url: '/images/item_masala_dosa.png', liked: 91, disliked: 0, reviews: 38, rating: 4.9 },
  { vendor_id: CANTEEN, name: 'Onion Dosa', price: 50, category: 'cooked', action_type: 'order', image_url: '/images/item_onion_dosa.png', liked: 77, disliked: 0, reviews: 26, rating: 4.7 },
  { vendor_id: CANTEEN, name: 'Pongal', price: 40, category: 'cooked', action_type: 'order', image_url: '/images/item_pongal.jpg', liked: 85, disliked: 0, reviews: 31, rating: 4.8 },
  { vendor_id: CANTEEN, name: 'Poori', price: 40, category: 'cooked', action_type: 'order', image_url: '/images/item_poori.png', liked: 88, disliked: 0, reviews: 34, rating: 4.8 },
  { vendor_id: CANTEEN, name: 'Meals', price: 60, category: 'cooked', action_type: 'order', image_url: '/images/item_meals.png', liked: 95, disliked: 0, reviews: 42, rating: 4.9 },
  { vendor_id: CANTEEN, name: 'Chapathi', price: 40, category: 'cooked', action_type: 'order', image_url: '/images/item_chapathi.png', liked: 80, disliked: 0, reviews: 28, rating: 4.7 },
  { vendor_id: CANTEEN, name: 'Chicken Fried Rice', price: 60, category: 'cooked', action_type: 'order', image_url: '/images/item_chicken_fried_rice.png', liked: 94, disliked: 0, reviews: 45, rating: 4.9 },
  { vendor_id: CANTEEN, name: 'Egg Fried Rice', price: 60, category: 'cooked', action_type: 'order', image_url: '/images/item_egg_fried_rice.png', liked: 89, disliked: 0, reviews: 37, rating: 4.8 },
  { vendor_id: CANTEEN, name: 'Veg Fried Rice', price: 60, category: 'cooked', action_type: 'order', image_url: '/images/item_veg_fried_rice.png', liked: 86, disliked: 0, reviews: 33, rating: 4.8 },
  { vendor_id: CANTEEN, name: 'Curd Rice', price: 40, category: 'cooked', action_type: 'order', image_url: '/images/item_curd_rice.png', liked: 79, disliked: 0, reviews: 25, rating: 4.7 },
  { vendor_id: CANTEEN, name: 'Special Chicken Rice', price: 90, category: 'cooked', action_type: 'order', image_url: '/images/item_special_chicken_rice.png', liked: 96, disliked: 0, reviews: 48, rating: 4.9 },
  { vendor_id: CANTEEN, name: 'Egg Omelette', price: 25, category: 'cooked', action_type: 'order', image_url: '/images/item_egg_omelette.png', liked: 84, disliked: 0, reviews: 30, rating: 4.8 },
  { vendor_id: CANTEEN, name: 'Samosa', price: 0, category: 'cooked', action_type: 'order', image_url: '/images/item_samosa_chicken.jpg', liked: 88, disliked: 0, reviews: 34, rating: 4.8 },
  // --- MITS Cafe ---
  { vendor_id: CAFE, name: 'Tea', price: 15, category: 'cooked', action_type: 'walkin', image_url: '/images/item_tea.jpg', liked: 52, disliked: 0, reviews: 18, rating: 4.5 },
  { vendor_id: CAFE, name: 'Coffee', price: 20, category: 'cooked', action_type: 'walkin', image_url: '/images/item_coffee.jpg', liked: 60, disliked: 0, reviews: 22, rating: 4.6 },
  { vendor_id: CAFE, name: 'Black Coffee', price: 30, category: 'cooked', action_type: 'walkin', image_url: '/images/item_black_coffee.jpg', liked: 34, disliked: 0, reviews: 11, rating: 4.4 },
  { vendor_id: CAFE, name: 'Sonti Coffee', price: 30, category: 'cooked', action_type: 'walkin', image_url: '/images/item_sonti_coffee.jpg', liked: 41, disliked: 0, reviews: 14, rating: 4.7 },
  { vendor_id: CAFE, name: 'Milk', price: 0, category: 'cooked', action_type: 'walkin', image_url: '/images/item_milk.jpg', liked: 29, disliked: 0, reviews: 9, rating: 4.3 },
  { vendor_id: CAFE, name: 'Batanees', price: 0, category: 'packed', action_type: 'order', image_url: '/images/item_batanees.jpg', liked: 55, disliked: 0, reviews: 19, rating: 4.6 },
  { vendor_id: CAFE, name: 'Gobi Samosa', price: 0, category: 'cooked', action_type: 'order', image_url: '/images/item_samosa_gobi.jpg', liked: 58, disliked: 0, reviews: 24, rating: 4.8 },
  { vendor_id: CAFE, name: 'Corn Samosa', price: 0, category: 'cooked', action_type: 'order', image_url: '/images/item_samosa_corn.jpg', liked: 62, disliked: 0, reviews: 28, rating: 4.9 },
  { vendor_id: CAFE, name: 'Chicken Samosa', price: 0, category: 'cooked', action_type: 'order', image_url: '/images/item_samosa_chicken.jpg', liked: 79, disliked: 0, reviews: 36, rating: 4.9 },
  // --- Ekdant's Cafe ---
  { vendor_id: EKDANT, name: 'Tea', price: 10, category: 'cooked', action_type: 'walkin', image_url: '/images/item_tea.jpg', liked: 47, disliked: 0, reviews: 15, rating: 4.5 },
  { vendor_id: EKDANT, name: 'Coffee', price: 10, category: 'cooked', action_type: 'walkin', image_url: '/images/item_coffee.jpg', liked: 51, disliked: 0, reviews: 17, rating: 4.5 },
  { vendor_id: EKDANT, name: 'Samosa', price: 0, category: 'cooked', action_type: 'order', image_url: '/images/item_ekdant_samosa.jpg', liked: 66, disliked: 0, reviews: 23, rating: 4.7 },
  { vendor_id: EKDANT, name: 'Gobi Manchurian', price: 0, category: 'cooked', action_type: 'order', image_url: '/images/item_gobi_manchurian.png', liked: 74, disliked: 0, reviews: 29, rating: 4.8 },
  { vendor_id: EKDANT, name: 'Mirchi Bajji (3 pcs)', price: 0, category: 'cooked', action_type: 'walkin', image_url: '/images/item_mirchi_bajji.png', liked: 73, disliked: 0, reviews: 27, rating: 4.8 },
  // --- Lickies ---
  { vendor_id: LICKIES, name: 'Tea', price: 10, category: 'cooked', action_type: 'walkin', image_url: '/images/item_tea.jpg', liked: 39, disliked: 0, reviews: 12, rating: 4.4 },
  { vendor_id: LICKIES, name: 'Coffee', price: 10, category: 'cooked', action_type: 'walkin', image_url: '/images/item_coffee.jpg', liked: 44, disliked: 0, reviews: 14, rating: 4.5 },
  { vendor_id: LICKIES, name: 'Samosa', price: 0, category: 'cooked', action_type: 'order', image_url: '/images/item_samosa_chicken.jpg', liked: 58, disliked: 0, reviews: 20, rating: 4.6 },
  { vendor_id: LICKIES, name: 'Popsicle', price: 0, category: 'packed', action_type: 'walkin', image_url: '/images/item_popsicle.svg', liked: 82, disliked: 0, reviews: 31, rating: 4.8 },
  { vendor_id: LICKIES, name: 'Cone-Ice', price: 0, category: 'packed', action_type: 'walkin', image_url: '/images/item_cone_ice.jpg', liked: 76, disliked: 0, reviews: 28, rating: 4.8 },
  { vendor_id: LICKIES, name: 'Choco-Bar', price: 0, category: 'packed', action_type: 'walkin', image_url: '/images/item_choco_bar.jpg', liked: 85, disliked: 0, reviews: 32, rating: 4.9 },
  { vendor_id: LICKIES, name: 'Juice', price: 0, category: 'packed', action_type: 'walkin', image_url: '/images/item_juice.jpg', liked: 68, disliked: 0, reviews: 25, rating: 4.7 },
  { vendor_id: LICKIES, name: 'Kurkure', price: 0, category: 'packed', action_type: 'walkin', image_url: '/images/item_kurkure.jpg', liked: 92, disliked: 0, reviews: 35, rating: 4.8 },
  // --- MITS Hub ---
  { vendor_id: NEWCAFE, name: "Tea", price: 15, category: "cooked", action_type: "walkin", image_url: "/images/01_tea.jpg", liked: 36, disliked: 0, reviews: 11, rating: 4.4 },
  { vendor_id: NEWCAFE, name: "Boost", price: 20, category: "cooked", action_type: "walkin", image_url: "/images/02_boost.jpg", liked: 28, disliked: 0, reviews: 9, rating: 4.3 },
  { vendor_id: NEWCAFE, name: "Horlicks", price: 20, category: "cooked", action_type: "walkin", image_url: "/images/03_horlicks.jpg", liked: 24, disliked: 0, reviews: 8, rating: 4.2 },
  { vendor_id: NEWCAFE, name: "Coffee", price: 20, category: "cooked", action_type: "walkin", image_url: "/images/04_coffee.jpg", liked: 40, disliked: 0, reviews: 13, rating: 4.4 },
  { vendor_id: NEWCAFE, name: "Lemon Tea", price: 15, category: "cooked", action_type: "walkin", image_url: "/images/05_lemon_tea.jpg", liked: 32, disliked: 0, reviews: 10, rating: 4.3 },
  { vendor_id: NEWCAFE, name: "Green Tea", price: 20, category: "cooked", action_type: "walkin", image_url: "/images/06_green_tea.jpg", liked: 29, disliked: 0, reviews: 9, rating: 4.3 },
  { vendor_id: NEWCAFE, name: "Badam Milk", price: 20, category: "cooked", action_type: "walkin", image_url: "/images/07_badam_milk.jpg", liked: 35, disliked: 0, reviews: 12, rating: 4.5 },
  { vendor_id: NEWCAFE, name: "Ginger Tea", price: 20, category: "cooked", action_type: "walkin", image_url: "/images/08_ginger_tea.jpg", liked: 38, disliked: 0, reviews: 12, rating: 4.5 },
  { vendor_id: NEWCAFE, name: "Veg Puff", price: 15, category: "cooked", action_type: "order", image_url: "/images/09_veg_puff.jpg", liked: 68, disliked: 0, reviews: 22, rating: 4.7 },
  { vendor_id: NEWCAFE, name: "Chicken Puff", price: 30, category: "cooked", action_type: "order", image_url: "/images/10_chicken_puff.jpg", liked: 72, disliked: 0, reviews: 26, rating: 4.8 },
  { vendor_id: NEWCAFE, name: "Egg Puff", price: 25, category: "cooked", action_type: "order", image_url: "/images/11_egg_puff.jpg", liked: 81, disliked: 0, reviews: 31, rating: 4.9 },
  { vendor_id: NEWCAFE, name: "Alu Samosa", price: 15, category: "cooked", action_type: "order", image_url: "/images/12_alu_samosa.jpg", liked: 54, disliked: 0, reviews: 18, rating: 4.6 },
  { vendor_id: NEWCAFE, name: "Onion Samosa (3 pcs)", price: 20, category: "cooked", action_type: "order", image_url: "/images/13_onion_samosa_3pc.jpg", liked: 61, disliked: 0, reviews: 20, rating: 4.6 },
  { vendor_id: NEWCAFE, name: "Egg Samosa", price: 20, category: "cooked", action_type: "order", image_url: "/images/14_egg_samosa.jpg", liked: 59, disliked: 0, reviews: 19, rating: 4.6 },
  { vendor_id: NEWCAFE, name: "Chicken Samosa", price: 20, category: "cooked", action_type: "order", image_url: "/images/15_chicken_samosa.jpg", liked: 65, disliked: 0, reviews: 22, rating: 4.7 },
  { vendor_id: NEWCAFE, name: "Veg Samosa", price: 15, category: "cooked", action_type: "order", image_url: "/images/16_veg_samosa.jpg", liked: 57, disliked: 0, reviews: 19, rating: 4.6 },
  { vendor_id: NEWCAFE, name: "Apple Fresh Juice", price: 60, category: "cooked", action_type: "order", image_url: "/images/17_apple_fresh_juice.jpg", liked: 45, disliked: 0, reviews: 15, rating: 4.5 },
  { vendor_id: NEWCAFE, name: "Date Juice", price: 60, category: "cooked", action_type: "order", image_url: "/images/18_date_juice.jpg", liked: 38, disliked: 0, reviews: 13, rating: 4.5 },
  { vendor_id: NEWCAFE, name: "Pineapple Juice", price: 50, category: "cooked", action_type: "order", image_url: "/images/19_pineapple_juice.jpg", liked: 42, disliked: 0, reviews: 14, rating: 4.5 },
  { vendor_id: NEWCAFE, name: "Orange Juice", price: 60, category: "cooked", action_type: "order", image_url: "/images/20_orange_juice.jpg", liked: 50, disliked: 0, reviews: 17, rating: 4.6 },
  { vendor_id: NEWCAFE, name: "Pomegranate Juice", price: 70, category: "cooked", action_type: "order", image_url: "/images/21_pomegranate_juice.jpg", liked: 55, disliked: 0, reviews: 18, rating: 4.7 },
  { vendor_id: NEWCAFE, name: "Banana Juice", price: 50, category: "cooked", action_type: "order", image_url: "/images/22_banana_juice.jpg", liked: 40, disliked: 0, reviews: 13, rating: 4.4 },
  { vendor_id: NEWCAFE, name: "Sapota Juice", price: 60, category: "cooked", action_type: "order", image_url: "/images/23_sapota_juice.jpg", liked: 36, disliked: 0, reviews: 11, rating: 4.4 },
  { vendor_id: NEWCAFE, name: "Mango Juice", price: 60, category: "cooked", action_type: "order", image_url: "/images/24_mango_juice.jpg", liked: 62, disliked: 0, reviews: 21, rating: 4.7 },
  { vendor_id: NEWCAFE, name: "Paneer Pizza (Medium)", price: 150, category: "cooked", action_type: "order", image_url: "/images/25_paneer_pizza_medium.jpg", liked: 88, disliked: 0, reviews: 36, rating: 4.9 },
  { vendor_id: NEWCAFE, name: "Veg Pizza (Medium)", price: 150, category: "cooked", action_type: "order", image_url: "/images/26_veg_pizza_medium.jpg", liked: 87, disliked: 0, reviews: 36, rating: 4.9 },
  { vendor_id: NEWCAFE, name: "Sweet Corn Pizza (Medium)", price: 150, category: "cooked", action_type: "order", image_url: "/images/27_sweet_corn_pizza_medium.jpg", liked: 83, disliked: 0, reviews: 34, rating: 4.8 },
  { vendor_id: NEWCAFE, name: "Veg Sandwich", price: 60, category: "cooked", action_type: "order", image_url: "/images/28_veg_sandwich.jpg", liked: 52, disliked: 0, reviews: 17, rating: 4.5 },
  { vendor_id: NEWCAFE, name: "Corn Sandwich", price: 60, category: "cooked", action_type: "order", image_url: "/images/29_corn_sandwich.jpg", liked: 48, disliked: 0, reviews: 16, rating: 4.5 },
  { vendor_id: NEWCAFE, name: "Paneer Sandwich", price: 60, category: "cooked", action_type: "order", image_url: "/images/30_paneer_sandwich.jpg", liked: 51, disliked: 0, reviews: 17, rating: 4.5 },
  { vendor_id: NEWCAFE, name: "Veg Burger", price: 80, category: "cooked", action_type: "order", image_url: "/images/31_veg_burger.jpg", liked: 74, disliked: 0, reviews: 28, rating: 4.7 },
  { vendor_id: NEWCAFE, name: "Chicken Burger", price: 100, category: "cooked", action_type: "order", image_url: "/images/32_chicken_burger.jpg", liked: 91, disliked: 0, reviews: 38, rating: 4.9 },
  { vendor_id: NEWCAFE, name: "French Fries", price: 70, category: "cooked", action_type: "order", image_url: "/images/33_french_fries.jpg", liked: 93, disliked: 0, reviews: 40, rating: 4.8 },
];

const ITEM_IDS = {
  'MITS Canteen|Tea': 'b0000000-0000-4000-8000-000000000001',
  'MITS Canteen|Coffee': 'b0000000-0000-4000-8000-000000000002',
  'MITS Canteen|Samosa': 'b0000000-0000-4000-8000-000000000003',
  'MITS Canteen|Dosa': 'b0000000-0000-4000-8000-000000000004',
  'MITS Canteen|Masala Dosa': 'b0000000-0000-4000-8000-000000000005',
  'MITS Canteen|Onion Dosa': 'b0000000-0000-4000-8000-000000000006',
  'MITS Canteen|Pongal': 'b0000000-0000-4000-8000-000000000007',
  'MITS Canteen|Poori': 'b0000000-0000-4000-8000-000000000008',
  'MITS Canteen|Meals': 'b0000000-0000-4000-8000-000000000009',
  'MITS Canteen|Chapathi': 'b0000000-0000-4000-8000-000000000010',
  'MITS Canteen|Chicken Fried Rice': 'b0000000-0000-4000-8000-000000000081',
  'MITS Canteen|Egg Fried Rice': 'b0000000-0000-4000-8000-000000000082',
  'MITS Canteen|Veg Fried Rice': 'b0000000-0000-4000-8000-000000000083',
  'MITS Canteen|Curd Rice': 'b0000000-0000-4000-8000-000000000084',
  'MITS Canteen|Special Chicken Rice': 'b0000000-0000-4000-8000-000000000085',
  'MITS Canteen|Egg Omelette': 'b0000000-0000-4000-8000-000000000086',
  'MITS Cafe|Tea': 'b0000000-0000-4000-8000-000000000011',
  'MITS Cafe|Coffee': 'b0000000-0000-4000-8000-000000000012',
  'MITS Cafe|Black Coffee': 'b0000000-0000-4000-8000-000000000013',
  'MITS Cafe|Sonti Coffee': 'b0000000-0000-4000-8000-000000000014',
  'MITS Cafe|Milk': 'b0000000-0000-4000-8000-000000000015',
  'MITS Cafe|Batanees': 'b0000000-0000-4000-8000-000000000016',
  'MITS Cafe|Gobi Samosa': 'b0000000-0000-4000-8000-000000000017',
  'MITS Cafe|Corn Samosa': 'b0000000-0000-4000-8000-000000000018',
  'MITS Cafe|Chicken Samosa': 'b0000000-0000-4000-8000-000000000019',
  "Ekdant's Cafe|Tea": 'b0000000-0000-4000-8000-000000000021',
  "Ekdant's Cafe|Coffee": 'b0000000-0000-4000-8000-000000000022',
  "Ekdant's Cafe|Samosa": 'b0000000-0000-4000-8000-000000000023',
  "Ekdant's Cafe|Gobi Manchurian": 'b0000000-0000-4000-8000-000000000025',
  "Ekdant's Cafe|Mirchi Bajji (3 pcs)": 'b0000000-0000-4000-8000-000000000024',
  'Lickies|Tea': 'b0000000-0000-4000-8000-000000000031',
  'Lickies|Coffee': 'b0000000-0000-4000-8000-000000000032',
  'Lickies|Samosa': 'b0000000-0000-4000-8000-000000000033',
  'Lickies|Popsicle': 'b0000000-0000-4000-8000-000000000034',
  'Lickies|Cone-Ice': 'b0000000-0000-4000-8000-000000000035',
  'Lickies|Choco-Bar': 'b0000000-0000-4000-8000-000000000036',
  'Lickies|Juice': 'b0000000-0000-4000-8000-000000000037',
  'Lickies|Kurkure': 'b0000000-0000-4000-8000-000000000038',
  'MITS Hub|Tea': 'b0000000-0000-4000-8000-000000000041',
  'MITS Hub|Boost': 'b0000000-0000-4000-8000-000000000042',
  'MITS Hub|Horlicks': 'b0000000-0000-4000-8000-000000000043',
  'MITS Hub|Coffee': 'b0000000-0000-4000-8000-000000000044',
  'MITS Hub|Lemon Tea': 'b0000000-0000-4000-8000-000000000045',
  'MITS Hub|Green Tea': 'b0000000-0000-4000-8000-000000000046',
  'MITS Hub|Badam Milk': 'b0000000-0000-4000-8000-000000000047',
  'MITS Hub|Ginger Tea': 'b0000000-0000-4000-8000-000000000048',
  'MITS Hub|Veg Puff': 'b0000000-0000-4000-8000-000000000049',
  'MITS Hub|Chicken Puff': 'b0000000-0000-4000-8000-000000000050',
  'MITS Hub|Egg Puff': 'b0000000-0000-4000-8000-000000000051',
  'MITS Hub|Alu Samosa': 'b0000000-0000-4000-8000-000000000052',
  'MITS Hub|Onion Samosa (3 pcs)': 'b0000000-0000-4000-8000-000000000053',
  'MITS Hub|Egg Samosa': 'b0000000-0000-4000-8000-000000000054',
  'MITS Hub|Chicken Samosa': 'b0000000-0000-4000-8000-000000000055',
  'MITS Hub|Veg Samosa': 'b0000000-0000-4000-8000-000000000056',
  'MITS Hub|Apple Fresh Juice': 'b0000000-0000-4000-8000-000000000057',
  'MITS Hub|Date Juice': 'b0000000-0000-4000-8000-000000000058',
  'MITS Hub|Pineapple Juice': 'b0000000-0000-4000-8000-000000000059',
  'MITS Hub|Orange Juice': 'b0000000-0000-4000-8000-000000000060',
  'MITS Hub|Pomegranate Juice': 'b0000000-0000-4000-8000-000000000061',
  'MITS Hub|Banana Juice': 'b0000000-0000-4000-8000-000000000062',
  'MITS Hub|Sapota Juice': 'b0000000-0000-4000-8000-000000000063',
  'MITS Hub|Mango Juice': 'b0000000-0000-4000-8000-000000000064',
  'MITS Hub|Paneer Pizza (Medium)': 'b0000000-0000-4000-8000-000000000065',
  'MITS Hub|Veg Pizza (Medium)': 'b0000000-0000-4000-8000-000000000066',
  'MITS Hub|Sweet Corn Pizza (Medium)': 'b0000000-0000-4000-8000-000000000067',
  'MITS Hub|Veg Sandwich': 'b0000000-0000-4000-8000-000000000068',
  'MITS Hub|Corn Sandwich': 'b0000000-0000-4000-8000-000000000069',
  'MITS Hub|Paneer Sandwich': 'b0000000-0000-4000-8000-000000000070',
  'MITS Hub|Veg Burger': 'b0000000-0000-4000-8000-000000000071',
  'MITS Hub|Chicken Burger': 'b0000000-0000-4000-8000-000000000072',
  'MITS Hub|French Fries': 'b0000000-0000-4000-8000-000000000073',
};

const VENDOR_NAMES = {
  [CANTEEN]: 'MITS Canteen',
  [CAFE]: 'MITS Cafe',
  [EKDANT]: "Ekdant's Cafe",
  [LICKIES]: 'Lickies',
  [NEWCAFE]: 'MITS Hub',
};

async function main() {
  // 1. Retire the old demo rows (QA Paneer Roll placeholder, old Biryani/Lays demo items)
  const listRes = await fetch(`${SUPABASE_URL}/rest/v1/food_items?select=id,name,vendor_id`, { headers: HEADERS });
  const existing = await listRes.json();
  const retire = existing.filter(
    r => r.name === 'QA Paneer Roll' || r.name === 'Biryani' || r.name === 'Lays'
  );
  for (const row of retire) {
    const del = await fetch(`${SUPABASE_URL}/rest/v1/food_items?id=eq.${row.id}`, {
      method: 'DELETE', headers: HEADERS,
    });
    if (del.ok) console.log(`🗑️  Retired demo item: ${row.name} (${VENDOR_NAMES[row.vendor_id] ?? row.vendor_id})`);
  }

  // 2. Seed each menu item: PATCH when (vendor_id, name) already exists,
  //    POST with a fixed UUID otherwise (reactions/orders stay stable).
  const fields = m => ({
    price: m.price,
    category: m.category,
    action_type: m.action_type,
    image_url: m.image_url,
    in_stock: true,
    likes_count: m.liked,
    dislikes_count: m.disliked,
    reviews_count: m.reviews,
  });

  let created = 0, updated = 0;
  for (const m of MENU) {
    const match = existing.find(r => r.vendor_id === m.vendor_id && r.name === m.name);
    if (match) {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/food_items?id=eq.${match.id}`, {
        method: 'PATCH', headers: HEADERS, body: JSON.stringify(fields(m)),
      });
      if (!res.ok) { console.error(`❌ PATCH ${m.name} failed:`, res.status, await res.text()); process.exit(1); }
      updated++;
      console.log(`♻️  Updated: ${VENDOR_NAMES[m.vendor_id]} · ${m.name} → ₹${m.price}`);
    } else {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/food_items`, {
        method: 'POST',
        headers: { ...HEADERS, Prefer: 'return=representation' },
        body: JSON.stringify({
          id: ITEM_IDS[`${VENDOR_NAMES[m.vendor_id]}|${m.name}`],
          vendor_id: m.vendor_id,
          name: m.name,
          ...fields(m),
        }),
      });
      if (!res.ok) { console.error(`❌ POST ${m.name} failed:`, res.status, await res.text()); process.exit(1); }
      created++;
      console.log(`➕ Created: ${VENDOR_NAMES[m.vendor_id]} · ${m.name} — ₹${m.price}`);
    }
  }
  console.log(`\n✅ ${created} created, ${updated} updated`);

  // 3. Show the final menu by canteen
  const listRes2 = await fetch(`${SUPABASE_URL}/rest/v1/food_items?select=name,price,category,action_type,vendor_id&order=vendor_id,name`, { headers: HEADERS });
  const finalItems = await listRes2.json();
  console.log('\nFinal menu:');
  let lastVendor = '';
  for (const item of finalItems) {
    if (item.vendor_id !== lastVendor) {
      lastVendor = item.vendor_id;
      console.log(`\n${VENDOR_NAMES[item.vendor_id] ?? item.vendor_id}:`);
    }
    console.log(`  • ${item.name} — ₹${item.price} (${item.category}, ${item.action_type})`);
  }
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
