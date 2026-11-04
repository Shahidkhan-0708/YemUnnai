import type { FoodItem } from './types';

export interface QuickLink {
  id: string;
  name: string;
  nameTe: string;
  icon: string;
  badge?: string;
  type: 'all' | 'category' | 'under50' | 'veg' | 'popular';
  categoryValue?: string;
}

export const HOMEPAGE_QUICK_LINKS: QuickLink[] = [
  { id: 'all', name: 'All Dishes', nameTe: 'అన్ని వంటకాలు', icon: '🍽️', type: 'all' },
  { id: 'popular', name: 'Campus Hits', nameTe: 'పాపులర్', icon: '🔥', type: 'popular', badge: 'Top' },
  { id: 'tiffin', name: 'Tiffin', nameTe: 'టిఫిన్ & బ్రేక్‌ఫాస్ట్', icon: '🥞', type: 'category', categoryValue: 'Tiffin' },
  { id: 'chai_coffee', name: 'Chai & Coffee', nameTe: 'టీ & కాఫీ', icon: '☕', type: 'category', categoryValue: 'Tea & Coffee' },
  { id: 'meals_biryani', name: 'Meals & Biryani', nameTe: 'బిర్యానీ & భోజనం', icon: '🍛', type: 'category', categoryValue: 'Meals & Biryani' },
  { id: 'fast_food', name: 'Fast Food', nameTe: 'ఫాస్ట్ ఫుడ్ & స్నాక్స్', icon: '🍔', type: 'category', categoryValue: 'Fast Food & Snacks' },
  { id: 'pizza_pasta', name: 'Pizza & Pasta', nameTe: 'పిజ్జా & పాస్తా', icon: '🍕', type: 'category', categoryValue: 'Pizza & Italian' },
  { id: 'coolers', name: 'Mojitos & Shakes', nameTe: 'కూలర్స్ & షేక్స్', icon: '🥤', type: 'category', categoryValue: 'Drinks & Coolers' },
  { id: 'bakery', name: 'Puffs & Bakery', nameTe: 'పఫ్స్ & బేకరీ', icon: '🥟', type: 'category', categoryValue: 'Puffs & Bakery' },
  { id: 'under50', name: 'Under ₹50', nameTe: '₹50 లోపు', icon: '⚡', type: 'under50', badge: 'Budget' },
  { id: 'pure_veg', name: 'Pure Veg', nameTe: 'శాకాహారం', icon: '🌿', type: 'veg' },
];

/**
 * Standard menu category categories used for homepage grouping.
 */
export const HOMEPAGE_MENU_SECTIONS = [
  { key: 'Tiffin', title: 'Tiffin & Breakfast', titleTe: 'టిఫిన్ & ఉదయం అల్పాహారం', icon: '🥞', desc: 'Fresh dosas, idlis, pooris & South Indian classics' },
  { key: 'Tea & Coffee', title: 'Chai, Coffee & Hot Beverages', titleTe: 'టీ, కాఫీ మరియు వేడి పానీయాలు', icon: '☕', desc: 'Special chai, filter coffee, badam milk & teas' },
  { key: 'Meals & Biryani', title: 'Biryani, Thali & Full Meals', titleTe: 'బిర్యానీ, థాలి మరియు పూర్తి భోజనం', icon: '🍛', desc: 'Aromatic Hyderabadi biryani, Andhra thalis & rice' },
  { key: 'Fast Food & Snacks', title: 'Burgers, Maggi & Quick Bites', titleTe: 'బర్గర్స్, మ్యాగీ మరియు ఫాస్ట్ ఫుడ్', icon: '🍔', desc: 'Crispy fries, hot Maggi noodles, burgers & sandwiches' },
  { key: 'Pizza & Italian', title: 'Pizzas, Pastas & Italian Bites', titleTe: 'పిజ్జాలు, పాస్తా మరియు ఇటాలియన్', icon: '🍕', desc: 'Woodfired pizzas, cheesy garlic bread & pasta' },
  { key: 'Drinks & Coolers', title: 'Mojitos, Shakes & Fresh Coolers', titleTe: 'మోజిటోలు, షేక్స్ మరియు శీతల పానీయాలు', icon: '🥤', desc: 'Chilled watermelon mojitos, thick lassi & fruit shakes' },
  { key: 'Puffs & Bakery', title: 'Crispy Puffs & Bakery Snacks', titleTe: 'పఫ్స్ మరియు బేకరీ స్నాక్స్', icon: '🥟', desc: 'Golden samosas, egg puffs, chicken puffs & cookies' },
  { key: 'Desserts', title: 'Desserts & Ice Creams', titleTe: 'డెజర్ట్స్ మరియు ఐస్ క్రీములు', icon: '🍨', desc: 'Scoops, sweet lassi and after-meal treats' },
] as const;

/**
 * Intelligently classifies any food item into a primary category.
 */
export function getFoodItemCategory(item: FoodItem): string {
  if (item.menuCategory) {
    const raw = item.menuCategory.trim().toLowerCase();
    if (['tea', 'coffee', 'milks', 'tea & coffee', 'flavoured milk'].some(k => raw.includes(k))) return 'Tea & Coffee';
    if (['tiffin', 'breakfast', 'dosa', 'idly'].some(k => raw.includes(k))) return 'Tiffin';
    if (['biryani', 'meals', 'thali', 'lunch', 'rice'].some(k => raw.includes(k))) return 'Meals & Biryani';
    if (['pizza', 'pasta', 'italian'].some(k => raw.includes(k))) return 'Pizza & Italian';
    if (['mojitos', 'lassi', 'drinks', 'coolers', 'juice'].some(k => raw.includes(k))) return 'Drinks & Coolers';
    if (['puffs & bakery', 'bakery', 'puffs'].some(k => raw.includes(k))) return 'Puffs & Bakery';
    if (['maggi & fries', 'crispy snacks', 'sandwiches & omelette', 'fast food', 'snacks'].some(k => raw.includes(k))) return 'Fast Food & Snacks';
    if (['desserts', 'ice cream'].some(k => raw.includes(k))) return 'Desserts';
  }

  const name = item.name.toLowerCase();

  // Keyword-based classification fallback
  if (/\b(dosa|idly|idli|poori|puri|vada|upma|chapati|paratha|chutney|sambar)\b/.test(name)) {
    return 'Tiffin';
  }
  if (/\b(tea|chai|coffee|kaapi|milk|badam|pista|boost|horlicks|bournvita)\b/.test(name)) {
    return 'Tea & Coffee';
  }
  if (/\b(biryani|meals|thali|pulao|rice|curry|sambar rice|curd rice)\b/.test(name)) {
    return 'Meals & Biryani';
  }
  if (/\b(pizza|pasta|garlic bread|calzone)\b/.test(name)) {
    return 'Pizza & Italian';
  }
  if (/\b(mojito|shake|milkshake|lassi|juice|cooler|lime|soda)\b/.test(name)) {
    return 'Drinks & Coolers';
  }
  if (/\b(puff|samosa|biscuit|cookie|bajji|pakoda|bonda|mirchi)\b/.test(name)) {
    return 'Puffs & Bakery';
  }
  if (/\b(burger|sandwich|maggi|maggie|french fries|fries|nuggets|popcorn|omelette|omelet|wrap|roll)\b/.test(name)) {
    return 'Fast Food & Snacks';
  }
  if (/\b(ice cream|scoop|dessert|jamun|halwa|sweet)\b/.test(name)) {
    return 'Desserts';
  }

  return 'Fast Food & Snacks';
}

/**
 * Returns top campus favorites (sorted by rating and likes).
 */
export function getCampusFavorites(items: FoodItem[], count = 6): FoodItem[] {
  return [...items]
    .filter(item => item.inStock && (item.isShopOnline !== false))
    .sort((a, b) => {
      const scoreA = (a.rating ?? 4.5) * 10 + (a.likes ?? 0);
      const scoreB = (b.rating ?? 4.5) * 10 + (b.likes ?? 0);
      return scoreB - scoreA;
    })
    .slice(0, count);
}

/**
 * Returns student budget bites under ₹50.
 */
export function getBudgetBites(items: FoodItem[], maxPrice = 50, count = 8): FoodItem[] {
  return [...items]
    .filter(item => item.inStock && (item.isShopOnline !== false) && typeof item.price === 'number' && item.price > 0 && item.price <= maxPrice)
    .sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0))
    .slice(0, count);
}
