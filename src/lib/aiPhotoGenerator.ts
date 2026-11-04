/**
 * Intelligent AI Food Photo Generator & OpenRouter AI Provider for YEMUNNAI.
 * Enables non-tech canteen owners and admins to instantly generate
 * mouthwatering culinary photos for any menu item in 1 click.
 */

interface PhotoMatch {
  keywords: string[];
  url: string;
}

const CULINARY_LIBRARY: PhotoMatch[] = [
  // Teas & Hot Drinks
  { keywords: ['bellam', 'jaggery tea', 'bellam tea'], url: '/images/acs_cafe/01_jaggery_tea_full.jpg' },
  { keywords: ['elachi', 'cardamom', 'elachi tea', 'chai', 'tea', 'cutting'], url: '/images/01_tea.jpg' },
  { keywords: ['ginger', 'ginger tea', 'adrak'], url: '/images/08_ginger_tea.jpg' },
  { keywords: ['lemon tea'], url: '/images/acs_cafe/09_lemon_tea.jpg' },
  { keywords: ['green tea'], url: '/images/acs_cafe/06_green_tea.jpg' },
  { keywords: ['black tea'], url: '/images/acs_cafe/12_black_tea.jpg' },
  { keywords: ['masala tea'], url: '/images/08_ginger_tea.jpg' },

  // Coffees
  { keywords: ['filter coffee', 'coffee', 'hot coffee', 'kaapi'], url: '/images/acs_cafe/03_coffee.jpg' },
  { keywords: ['black coffee', 'espresso'], url: '/images/acs_cafe/13_black_coffee.jpg' },
  { keywords: ['cold coffee', 'iced coffee', 'frappe'], url: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600&auto=format&fit=crop&q=80' },

  // Milks & Malts
  { keywords: ['badam milk', 'badam'], url: '/images/acs_cafe/04_badam_milk.jpg' },
  { keywords: ['pista milk', 'pista badam'], url: '/images/acs_cafe/05_pista_badam.jpg' },
  { keywords: ['rose milk'], url: '/images/acs_cafe/11_hot_rose_milk.jpg' },
  { keywords: ['boost'], url: '/images/acs_cafe/07_boost.jpg' },
  { keywords: ['horlicks'], url: '/images/acs_cafe/08_horlicks.jpg' },
  { keywords: ['bournvita'], url: '/images/03_horlicks.jpg' },
  { keywords: ['milk', 'plain milk'], url: '/images/item_milk.jpg' },

  // Bakery & Puffs
  { keywords: ['samosa', 'alu samosa', 'onion samosa'], url: '/images/acs_cafe/14_samosa.jpg' },
  { keywords: ['egg puff'], url: '/images/acs_cafe/15_egg_puff.jpg' },
  { keywords: ['chicken puff'], url: '/images/10_chicken_puff.jpg' },
  { keywords: ['veg puff'], url: '/images/09_veg_puff.jpg' },
  { keywords: ['biscuit', 'cookies', 'osmania'], url: '/images/acs_cafe/18_biscuit.jpg' },

  // Fries & Fast Food
  { keywords: ['peri peri fries'], url: '/images/acs_cafe/17_peri_peri_fries.jpg' },
  { keywords: ['french fries', 'fries'], url: '/images/acs_cafe/16_plain_french_fries.jpg' },
  { keywords: ['chicken nuggets', 'nuggets'], url: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=600&auto=format&fit=crop&q=80' },
  { keywords: ['veg popcorn', 'popcorn'], url: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=600&auto=format&fit=crop&q=80' },
  { keywords: ['veg nuggets'], url: '/images/item_veg_puff.jpg' },
  { keywords: ['kurkure', 'chat', 'masala chat'], url: '/images/item_kurkure.jpg' },

  // Maggi & Noodles
  { keywords: ['egg maggi', 'egg maggie'], url: '/images/acs_cafe/28_egg_maggie.jpg' },
  { keywords: ['paneer maggi'], url: '/images/acs_cafe/29_paneer_maggie.jpg' },
  { keywords: ['cheese maggi'], url: '/images/acs_cafe/30_cheese_maggie.jpg' },
  { keywords: ['corn maggi'], url: '/images/acs_cafe/27_corn_maggie.jpg' },
  { keywords: ['maggi', 'maggie', 'noodles'], url: '/images/acs_cafe/26_veg_maggie.jpg' },

  // Sandwiches & Omelettes
  { keywords: ['bread omelette', 'bread omelet'], url: '/images/acs_cafe/20_egg_sandwich.jpg' },
  { keywords: ['double egg omelette', 'double omelet', 'omelette', 'omelet'], url: '/images/acs_cafe/25_plain_omelette_single.jpg' },
  { keywords: ['cheese sandwich'], url: '/images/acs_cafe/21_cheese_sandwich.jpg' },
  { keywords: ['corn sandwich'], url: '/images/acs_cafe/22_corn_sandwich.jpg' },
  { keywords: ['paneer sandwich'], url: '/images/acs_cafe/23_paneer_sandwich.jpg' },
  { keywords: ['capsicum sandwich'], url: '/images/acs_cafe/24_capsicum_sandwich.jpg' },
  { keywords: ['egg sandwich'], url: '/images/acs_cafe/20_egg_sandwich.jpg' },
  { keywords: ['veg sandwich', 'sandwich'], url: '/images/acs_cafe/19_veg_sandwich.jpg' },

  // Burgers
  { keywords: ['chicken burger'], url: '/images/acs_cafe/35_chicken_burger.jpg' },
  { keywords: ['paneer burger'], url: '/images/acs_cafe/33_paneer_burger.jpg' },
  { keywords: ['veg cheese burger'], url: '/images/acs_cafe/32_veg_cheese_burger.jpg' },
  { keywords: ['veg burger', 'burger'], url: '/images/acs_cafe/31_veg_burger.jpg' },

  // Pizzas
  { keywords: ['paneer pizza'], url: '/images/25_paneer_pizza_medium.jpg' },
  { keywords: ['corn pizza', 'sweet corn pizza'], url: '/images/27_sweet_corn_pizza_medium.jpg' },
  { keywords: ['veg pizza', 'pizza'], url: '/images/26_veg_pizza_medium.jpg' },

  // South Indian Tiffins
  { keywords: ['masala dosa', 'dosa'], url: '/images/item_masala_dosa.png' },
  { keywords: ['onion dosa'], url: '/images/item_onion_dosa.png' },
  { keywords: ['idly', 'idli'], url: '/images/item_meals.png' },
  { keywords: ['poori', 'puri'], url: '/images/item_poori.png' },
  { keywords: ['mirchi', 'bajji', 'mirchi bajji'], url: '/images/item_mirchi_bajji.png' },
  { keywords: ['biryani', 'chicken biryani'], url: '/images/biryani.jpg' },
  { keywords: ['fried rice'], url: '/images/item_veg_fried_rice.png' },
  { keywords: ['manchurian', 'gobi'], url: '/images/item_gobi_manchurian.png' },

  // Mojitos & Coolers
  { keywords: ['watermelon', 'watermelon mojito'], url: 'https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?w=600&auto=format&fit=crop&q=80' },
  { keywords: ['blue', 'blue curacao', 'blue mojito'], url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80' },
  { keywords: ['lime & mint', 'lime mint', 'virgin mojito', 'mint mojito', 'mojito'], url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80' },
  { keywords: ['mango mojito', 'mango cooler'], url: 'https://images.unsplash.com/photo-1546173159-315724a31696?w=600&auto=format&fit=crop&q=80' },

  // Lassi & Shakes
  { keywords: ['sweet lassi', 'lassi'], url: 'https://images.unsplash.com/photo-1571006682893-ac20e0ec5be8?w=600&auto=format&fit=crop&q=80' },
  { keywords: ['mango lassi'], url: '/images/24_mango_juice.jpg' },
  { keywords: ['strawberry lassi'], url: '/images/acs_cafe/38_strawberry_scoop.jpg' },
  { keywords: ['pineapple lassi', 'pineapple juice'], url: '/images/19_pineapple_juice.jpg' },
  { keywords: ['rose milkshake', 'milkshake', 'shake'], url: 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=600&auto=format&fit=crop&q=80' },
  { keywords: ['apple juice'], url: '/images/17_apple_fresh_juice.jpg' },
  { keywords: ['orange juice'], url: '/images/20_orange_juice.jpg' },
  { keywords: ['pomegranate juice'], url: '/images/21_pomegranate_juice.jpg' },
  { keywords: ['banana juice'], url: '/images/22_banana_juice.jpg' },

  // Ice cream scoops
  { keywords: ['vanilla scoop', 'vanilla ice cream'], url: '/images/acs_cafe/37_vanilla_scoop.jpg' },
  { keywords: ['strawberry scoop', 'strawberry ice cream'], url: '/images/acs_cafe/38_strawberry_scoop.jpg' },
  { keywords: ['chocolate scoop', 'chocolate ice cream'], url: '/images/acs_cafe/41_chocolate_scoop.jpg' },
  { keywords: ['butterscotch'], url: '/images/acs_cafe/40_butterscotch_scoop.jpg' },
];

/**
 * Predefined fixed categories for non-tech friendly canteens
 */
export const PREDEFINED_MENU_CATEGORIES = [
  'Beverages',
  'Drinks',
  'Tiffin',
  'Lunch',
  'Fast Food',
  'Snacks',
  'Tea & Coffee',
  'Milks',
  'Maggi & Fries',
  'Sandwiches & Omelette',
  'Mojitos',
  'Lassi',
  'Crispy Snacks',
  'Puffs & Bakery',
  'Desserts',
  'Other'
] as const;

/**
 * OpenRouter AI Provider Integration
 */
export function getOpenRouterApiKey(): string {
  try {
    return localStorage.getItem('openrouter_api_key') || (import.meta as any).env?.VITE_OPENROUTER_API_KEY || '';
  } catch {
    return '';
  }
}

export function setOpenRouterApiKey(key: string): void {
  try {
    if (key.trim()) {
      localStorage.setItem('openrouter_api_key', key.trim());
    } else {
      localStorage.removeItem('openrouter_api_key');
    }
  } catch {
    // Ignore storage issues
  }
}

/**
 * Query OpenRouter AI for culinary keywords, culinary descriptions, or recommendations.
 */
export async function callOpenRouterAi(prompt: string, model = 'google/gemini-2.5-flash'): Promise<string | null> {
  const apiKey = getOpenRouterApiKey();
  if (!apiKey) return null;

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://yemunnai.me',
        'X-Title': 'Yemunnai Food Discovery'
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert culinary food visualizer for a campus food directory. Keep responses concise and focused.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 150
      })
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() ?? null;
  } catch {
    return null;
  }
}

/**
 * Generate an AI food image URL based on item name and category.
 * Integrates OpenRouter when configured and gracefully matches curated library / high-res imagery.
 */
export async function generateAiFoodPhoto(itemName: string, category?: string): Promise<string> {
  const query = `${itemName} ${category ?? ''}`.trim().toLowerCase();

  // 1. Direct or multi-keyword matching against curated culinary assets
  for (const match of CULINARY_LIBRARY) {
    if (match.keywords.some(kw => query.includes(kw))) {
      return match.url;
    }
  }

  // 2. If OpenRouter is configured, try querying OpenRouter for relevant search terms
  const apiKey = getOpenRouterApiKey();
  if (apiKey) {
    try {
      const openRouterKeywords = await callOpenRouterAi(
        `Given this Indian/campus food item "${itemName}" (category: "${category ?? ''}"), name the 1 most famous visually identical dish in English (e.g. for "Idli Sambar" return "idli", for "Badam Milk" return "badam milk"). Return ONLY the 1-2 words:`
      );
      if (openRouterKeywords) {
        const enriched = openRouterKeywords.toLowerCase();
        for (const match of CULINARY_LIBRARY) {
          if (match.keywords.some(kw => enriched.includes(kw))) {
            return match.url;
          }
        }
      }
    } catch {
      // Graceful fallback
    }
  }

  // 3. High quality culinary Unsplash fallback
  const cleanTerms = itemName
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .join(',');

  const fallbackUrl = `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80&sig=${encodeURIComponent(cleanTerms)}`;
  return fallbackUrl;
}
