// Shared mock data for all Design Lab variants
// Matches the current Yemunnai frontend data structures

export interface FoodItem {
  id: string;
  vendorId: string;
  name: string;
  vendor: string;
  price: number;
  category: 'cooked' | 'snack' | 'drink' | 'sweet';
  image: string;
  likes: number;
  dislikes: number;
  reviews: number;
  rating: number;
  walkTime?: string;
  prepTime?: string;
  actionType?: 'order' | 'walkin';
  inStock?: boolean;
  isShopOnline?: boolean;
  dietary?: 'veg' | 'nonveg' | 'unknown';
  description?: string;
  tags?: string[];
  portionSizes?: Array<{ name: string; price: number }>;
  reviewCount?: number;
}

export interface Vendor {
  id: string;
  name: string;
  image: string;
  walkTime: string;
  isOnline: boolean;
  rating: number;
  categories: string[];
}

export interface Order {
  id: string;
  vendorId: string;
  vendor: string;
  vendorImage: string;
  items: Array<{ name: string; qty: number; price: number }>;
  total: number;
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'declined' | 'cancelled';
  timestamp: number;
  pickupCode?: string;
  walkTime?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

// ============================================
// VENDORS (Canteens/Shops)
// ============================================
export const MOCK_VENDORS: Vendor[] = [
  {
    id: 'a0000000-0000-4000-8000-000000000001',
    name: 'MITS Canteen',
    image: '/images/shop_mits_canteen.jpg',
    walkTime: '2 min walk',
    isOnline: true,
    rating: 4.8,
    categories: ['South Indian', 'North Indian', 'Snacks', 'Beverages']
  },
  {
    id: 'a0000000-0000-4000-8000-000000000002',
    name: 'P2 Canteen',
    image: '/images/shop_p2.jpg',
    walkTime: '5 min walk',
    isOnline: true,
    rating: 4.6,
    categories: ['Chinese', 'Fast Food', 'Beverages']
  },
  {
    id: 'a0000000-0000-4000-8000-000000000003',
    name: 'ACS Cafe',
    image: '/images/shop_acs_cafe.jpg',
    walkTime: '3 min walk',
    isOnline: false,
    rating: 4.7,
    categories: ['Coffee', 'Sandwiches', 'Desserts']
  },
  {
    id: 'a0000000-0000-4000-8000-000000000004',
    name: 'Paradise Biryani',
    image: '/images/shop_paradise.jpg',
    walkTime: '8 min walk',
    isOnline: true,
    rating: 4.9,
    categories: ['Biryani', 'Kebabs', 'Curries']
  },
  {
    id: 'a0000000-0000-4000-8000-000000000005',
    name: 'Mallikarjuna Mess',
    image: '/images/shop_mallikarjuna.jpg',
    walkTime: '4 min walk',
    isOnline: true,
    rating: 4.5,
    categories: ['Meals', 'Thali', 'Snacks']
  },
];

// ============================================
// FOOD ITEMS
// ============================================
export const MOCK_FOOD_ITEMS: FoodItem[] = [
  // MITS Canteen items
  {
    id: 'mits-samosa',
    vendorId: 'a0000000-0000-4000-8000-000000000001',
    name: 'Samosa',
    vendor: 'MITS Canteen',
    price: 15,
    category: 'snack',
    image: '/images/item_samosa_chicken.jpg',
    likes: 88,
    dislikes: 2,
    reviews: 34,
    rating: 4.8,
    walkTime: '2 min walk',
    actionType: 'order',
    inStock: true,
    isShopOnline: true,
    dietary: 'veg',
    description: 'Crispy golden triangles filled with spiced potato and peas filling',
    tags: ['veg', 'snack', 'popular'],
    portionSizes: [
      { name: '1 pc', price: 15 },
      { name: '2 pcs', price: 28 },
      { name: '4 pcs', price: 52 }
    ]
  },
  {
    id: 'mits-dosa',
    vendorId: 'a0000000-0000-4000-8000-000000000001',
    name: 'Masala Dosa',
    vendor: 'MITS Canteen',
    price: 45,
    category: 'cooked',
    image: '/images/item_dosa.jpg',
    likes: 156,
    dislikes: 3,
    reviews: 67,
    rating: 4.7,
    walkTime: '2 min walk',
    actionType: 'order',
    inStock: true,
    isShopOnline: true,
    dietary: 'veg',
    description: 'Crispy rice crepe filled with spiced potato filling, served with coconut chutney and sambar',
    tags: ['veg', 'south-indian', 'popular'],
    portionSizes: [
      { name: 'Regular', price: 45 },
      { name: 'Large', price: 60 }
    ]
  },
  {
    id: 'mits-idli',
    vendorId: 'a0000000-0000-4000-8000-000000000001',
    name: 'Idli Sambar',
    vendor: 'MITS Canteen',
    price: 30,
    category: 'cooked',
    image: '/images/item_idli.jpg',
    likes: 92,
    dislikes: 1,
    reviews: 41,
    rating: 4.9,
    walkTime: '2 min walk',
    actionType: 'order',
    inStock: true,
    isShopOnline: true,
    dietary: 'veg',
    description: 'Steamed rice cakes served with flavorful tamarind sambar and coconut chutney',
    tags: ['veg', 'south-indian', 'healthy'],
    portionSizes: [
      { name: '2 pcs', price: 30 },
      { name: '4 pcs', price: 55 }
    ]
  },
  {
    id: 'mits-vada',
    vendorId: 'a0000000-0000-4000-8000-000000000001',
    name: 'Medu Vada',
    vendor: 'MITS Canteen',
    price: 25,
    category: 'snack',
    image: '/images/item_vada.jpg',
    likes: 78,
    dislikes: 4,
    reviews: 28,
    rating: 4.5,
    walkTime: '2 min walk',
    actionType: 'order',
    inStock: true,
    isShopOnline: true,
    dietary: 'veg',
    description: 'Crispy lentil fritters with a golden crust, perfect with filter coffee',
    tags: ['veg', 'snack', 'south-indian'],
    portionSizes: [
      { name: '1 pc', price: 25 },
      { name: '2 pcs', price: 45 }
    ]
  },
  {
    id: 'mits-filter-coffee',
    vendorId: 'a0000000-0000-4000-8000-000000000001',
    name: 'Filter Coffee',
    vendor: 'MITS Canteen',
    price: 20,
    category: 'drink',
    image: '/images/item_filter_coffee.jpg',
    likes: 203,
    dislikes: 2,
    reviews: 89,
    rating: 4.9,
    walkTime: '2 min walk',
    actionType: 'order',
    inStock: true,
    isShopOnline: true,
    dietary: 'veg',
    description: 'Strong South Indian filter coffee with frothy milk foam',
    tags: ['veg', 'drink', 'popular']
  },
  {
    id: 'mits-lemon-rice',
    vendorId: 'a0000000-0000-4000-8000-000000000001',
    name: 'Lemon Rice',
    vendor: 'MITS Canteen',
    price: 35,
    category: 'cooked',
    image: '/images/item_lemon_rice.jpg',
    likes: 67,
    dislikes: 3,
    reviews: 22,
    rating: 4.6,
    walkTime: '2 min walk',
    actionType: 'order',
    inStock: true,
    isShopOnline: true,
    dietary: 'veg',
    description: 'Fragrant lemon rice with tempered mustard seeds and curry leaves',
    tags: ['veg', 'south-indian'],
    portionSizes: [
      { name: 'Half', price: 35 },
      { name: 'Full', price: 60 }
    ]
  },
  {
    id: 'mits-chicken-biryani',
    vendorId: 'a0000000-0000-4000-8000-000000000001',
    name: 'Chicken Biryani',
    vendor: 'MITS Canteen',
    price: 120,
    category: 'cooked',
    image: '/images/item_chicken_biryani.jpg',
    likes: 234,
    dislikes: 5,
    reviews: 112,
    rating: 4.8,
    walkTime: '2 min walk',
    actionType: 'order',
    inStock: true,
    isShopOnline: true,
    dietary: 'nonveg',
    portionSizes: [
      { name: 'Regular', price: 120 },
      { name: 'Large', price: 160 }
    ]
  },
  {
    id: 'mits-egg-roll',
    vendorId: 'a0000000-0000-4000-8000-000000000001',
    name: 'Egg Roll',
    vendor: 'MITS Canteen',
    price: 40,
    category: 'snack',
    image: '/images/item_egg_roll.jpg',
    likes: 89,
    dislikes: 3,
    reviews: 34,
    rating: 4.6,
    walkTime: '2 min walk',
    actionType: 'order',
    inStock: true,
    isShopOnline: true,
    dietary: 'nonveg'
  },
  // P2 Canteen items
  {
    id: 'p2-manchurian',
    vendorId: 'a0000000-0000-4000-8000-000000000002',
    name: 'Veg Manchurian',
    vendor: 'P2 Canteen',
    price: 80,
    category: 'cooked',
    image: '/images/item_manchurian.jpg',
    likes: 145,
    dislikes: 6,
    reviews: 52,
    rating: 4.5,
    walkTime: '5 min walk',
    actionType: 'order',
    inStock: true,
    isShopOnline: true,
    dietary: 'veg',
    portionSizes: [
      { name: 'Half', price: 80 },
      { name: 'Full', price: 140 }
    ]
  },
  {
    id: 'p2-hakka-noodles',
    vendorId: 'a0000000-0000-4000-8000-000000000002',
    name: 'Hakka Noodles',
    vendor: 'P2 Canteen',
    price: 70,
    category: 'cooked',
    image: '/images/item_hakka_noodles.jpg',
    likes: 123,
    dislikes: 4,
    reviews: 45,
    rating: 4.6,
    walkTime: '5 min walk',
    actionType: 'order',
    inStock: true,
    isShopOnline: true,
    dietary: 'veg',
    portionSizes: [
      { name: 'Half', price: 70 },
      { name: 'Full', price: 120 }
    ]
  },
  {
    id: 'p2-chilli-paneer',
    vendorId: 'a0000000-0000-4000-8000-000000000002',
    name: 'Chilli Paneer',
    vendor: 'P2 Canteen',
    price: 90,
    category: 'cooked',
    image: '/images/item_chilli_paneer.jpg',
    likes: 167,
    dislikes: 8,
    reviews: 61,
    rating: 4.7,
    walkTime: '5 min walk',
    actionType: 'order',
    inStock: true,
    isShopOnline: true,
    dietary: 'veg',
    portionSizes: [
      { name: 'Half', price: 90 },
      { name: 'Full', price: 160 }
    ]
  },
  {
    id: 'p2-spring-roll',
    vendorId: 'a0000000-0000-4000-8000-000000000002',
    name: 'Spring Roll',
    vendor: 'P2 Canteen',
    price: 50,
    category: 'snack',
    image: '/images/item_spring_roll.jpg',
    likes: 89,
    dislikes: 3,
    reviews: 28,
    rating: 4.5,
    walkTime: '5 min walk',
    actionType: 'order',
    inStock: true,
    isShopOnline: true,
    dietary: 'veg'
  },
  {
    id: 'p2-chicken-fried-rice',
    vendorId: 'a0000000-0000-4000-8000-000000000002',
    name: 'Chicken Fried Rice',
    vendor: 'P2 Canteen',
    price: 110,
    category: 'cooked',
    image: '/images/item_chicken_fried_rice.jpg',
    likes: 198,
    dislikes: 7,
    reviews: 87,
    rating: 4.7,
    walkTime: '5 min walk',
    actionType: 'order',
    inStock: true,
    isShopOnline: true,
    dietary: 'nonveg',
    portionSizes: [
      { name: 'Half', price: 110 },
      { name: 'Full', price: 180 }
    ]
  },
  // ACS Cafe items
  {
    id: 'acs-cold-coffee',
    vendorId: 'a0000000-0000-4000-8000-000000000003',
    name: 'Cold Coffee',
    vendor: 'ACS Cafe',
    price: 60,
    category: 'drink',
    image: '/images/item_cold_coffee.jpg',
    likes: 234,
    dislikes: 5,
    reviews: 102,
    rating: 4.8,
    walkTime: '3 min walk',
    actionType: 'order',
    inStock: true,
    isShopOnline: false,
    dietary: 'veg'
  },
  {
    id: 'acs-grilled-sandwich',
    vendorId: 'a0000000-0000-4000-8000-000000000003',
    name: 'Grilled Cheese Sandwich',
    vendor: 'ACS Cafe',
    price: 80,
    category: 'snack',
    image: '/images/item_grilled_sandwich.jpg',
    likes: 156,
    dislikes: 4,
    reviews: 58,
    rating: 4.7,
    walkTime: '3 min walk',
    actionType: 'order',
    inStock: true,
    isShopOnline: false,
    dietary: 'veg'
  },
  {
    id: 'acs-chocolate-brownie',
    vendorId: 'a0000000-0000-4000-8000-000000000003',
    name: 'Chocolate Brownie',
    vendor: 'ACS Cafe',
    price: 70,
    category: 'sweet',
    image: '/images/item_brownie.jpg',
    likes: 189,
    dislikes: 3,
    reviews: 74,
    rating: 4.9,
    walkTime: '3 min walk',
    actionType: 'order',
    inStock: true,
    isShopOnline: false,
    dietary: 'veg'
  },
  // Paradise Biryani items
  {
    id: 'paradise-chicken-biryani',
    vendorId: 'a0000000-0000-4000-8000-000000000004',
    name: 'Hyderabadi Chicken Biryani',
    vendor: 'Paradise Biryani',
    price: 180,
    category: 'cooked',
    image: '/images/item_paradise_biryani.jpg',
    likes: 456,
    dislikes: 12,
    reviews: 234,
    rating: 4.9,
    walkTime: '8 min walk',
    actionType: 'order',
    inStock: true,
    isShopOnline: true,
    dietary: 'nonveg',
    portionSizes: [
      { name: 'Half', price: 180 },
      { name: 'Full', price: 320 }
    ]
  },
  {
    id: 'paradise-mutton-biryani',
    vendorId: 'a0000000-0000-4000-8000-000000000004',
    name: 'Mutton Biryani',
    vendor: 'Paradise Biryani',
    price: 250,
    category: 'cooked',
    image: '/images/item_mutton_biryani.jpg',
    likes: 334,
    dislikes: 8,
    reviews: 167,
    rating: 4.9,
    walkTime: '8 min walk',
    actionType: 'order',
    inStock: true,
    isShopOnline: true,
    dietary: 'nonveg',
    portionSizes: [
      { name: 'Half', price: 250 },
      { name: 'Full', price: 450 }
    ]
  },
  {
    id: 'paradise-veg-biryani',
    vendorId: 'a0000000-0000-4000-8000-000000000004',
    name: 'Veg Biryani',
    vendor: 'Paradise Biryani',
    price: 140,
    category: 'cooked',
    image: '/images/item_veg_biryani.jpg',
    likes: 178,
    dislikes: 5,
    reviews: 89,
    rating: 4.7,
    walkTime: '8 min walk',
    actionType: 'order',
    inStock: true,
    isShopOnline: true,
    dietary: 'veg',
    portionSizes: [
      { name: 'Half', price: 140 },
      { name: 'Full', price: 240 }
    ]
  },
  // Mallikarjuna Mess items
  {
    id: 'mallikarjuna-thali',
    vendorId: 'a0000000-0000-4000-8000-000000000005',
    name: 'Complete Thali',
    vendor: 'Mallikarjuna Mess',
    price: 90,
    category: 'cooked',
    image: '/images/item_thali.jpg',
    likes: 245,
    dislikes: 6,
    reviews: 112,
    rating: 4.6,
    walkTime: '4 min walk',
    actionType: 'order',
    inStock: true,
    isShopOnline: true,
    dietary: 'veg',
    portionSizes: [
      { name: 'Regular', price: 90 },
      { name: 'Special', price: 130 }
    ]
  },
  {
    id: 'mallikarjuna-curd-rice',
    vendorId: 'a0000000-0000-4000-8000-000000000005',
    name: 'Curd Rice',
    vendor: 'Mallikarjuna Mess',
    price: 40,
    category: 'cooked',
    image: '/images/item_curd_rice.jpg',
    likes: 89,
    dislikes: 2,
    reviews: 34,
    rating: 4.7,
    walkTime: '4 min walk',
    actionType: 'order',
    inStock: true,
    isShopOnline: true,
    dietary: 'veg',
    portionSizes: [
      { name: 'Half', price: 40 },
      { name: 'Full', price: 70 }
    ]
  },
];

// ============================================
// ORDERS
// ============================================
export const MOCK_ORDERS: Order[] = [
  {
    id: 'ord-001',
    vendorId: 'a0000000-0000-4000-8000-000000000001',
    vendor: 'MITS Canteen',
    vendorImage: '/images/shop_mits_canteen.jpg',
    items: [
      { name: 'Masala Dosa', qty: 1, price: 45 },
      { name: 'Filter Coffee', qty: 1, price: 20 }
    ],
    total: 65,
    status: 'preparing',
    timestamp: Date.now() - 1000 * 60 * 5,
    pickupCode: 'A1B2',
    walkTime: '2 min walk'
  },
  {
    id: 'ord-002',
    vendorId: 'a0000000-0000-4000-8000-000000000002',
    vendor: 'P2 Canteen',
    vendorImage: '/images/shop_p2.jpg',
    items: [
      { name: 'Chilli Paneer', qty: 1, price: 90 },
      { name: 'Hakka Noodles', qty: 1, price: 70 }
    ],
    total: 160,
    status: 'ready',
    timestamp: Date.now() - 1000 * 60 * 15,
    pickupCode: 'C3D4',
    walkTime: '5 min walk'
  },
  {
    id: 'ord-003',
    vendorId: 'a0000000-0000-4000-8000-000000000004',
    vendor: 'Paradise Biryani',
    vendorImage: '/images/shop_paradise.jpg',
    items: [
      { name: 'Hyderabadi Chicken Biryani', qty: 1, price: 180 }
    ],
    total: 180,
    status: 'completed',
    timestamp: Date.now() - 1000 * 60 * 60 * 2,
    pickupCode: 'E5F6',
    walkTime: '8 min walk'
  },
];

// ============================================
// CATEGORIES
// ============================================
export const MOCK_CATEGORIES: Category[] = [
  { id: 'all', name: 'All', icon: 'grid' },
  { id: 'south-indian', name: 'South Indian', icon: 'utensils' },
  { id: 'north-indian', name: 'North Indian', icon: 'bowl-rice' },
  { id: 'chinese', name: 'Chinese', icon: 'bowl-rice' },
  { id: 'snacks', name: 'Snacks', icon: 'cookie' },
  { id: 'beverages', name: 'Beverages', icon: 'coffee' },
  { id: 'sweets', name: 'Sweets', icon: 'cake' },
  { id: 'biryani', name: 'Biryani', icon: 'bowl-rice' },
];

// ============================================
// USER PROFILE
// ============================================
export const MOCK_USER = {
  name: 'Arjun Kumar',
  email: 'arjun.kumar@mits.ac.in',
  phone: '+91 98765 43210',
  rollNumber: 'MIT21CS045',
  avatar: '/images/avatar_arjun.jpg',
  savedItems: ['mits-samosa', 'mits-filter-coffee', 'p2-chilli-paneer', 'paradise-chicken-biryani'],
  dietaryPreference: 'veg' as const,
};

// ============================================
// ONBOARDING STEPS
// ============================================
export const ONBOARDING_STEPS = [
  {
    icon: 'map-pin',
    title: 'Discover Nearby',
    description: 'Find the best food around campus in seconds'
  },
  {
    icon: 'zap',
    title: 'Quick Order',
    description: 'Tap, pay, pickup — no waiting in line'
  },
  {
    icon: 'navigation',
    title: 'Walk-in Navigation',
    description: 'Real-time directions to every canteen'
  },
  {
    icon: 'heart',
    title: 'Save Favorites',
    description: 'Bookmark your go-to meals for instant reorder'
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================
export function getItemsByVendor(vendorId: string): FoodItem[] {
  return MOCK_FOOD_ITEMS.filter(item => item.vendorId === vendorId);
}

export function getItemsByCategory(category: string): FoodItem[] {
  if (category === 'all') return MOCK_FOOD_ITEMS;
  return MOCK_FOOD_ITEMS.filter(item => item.category === category);
}

export function getItemById(id: string): FoodItem | undefined {
  return MOCK_FOOD_ITEMS.find(item => item.id === id);
}

export function getVendorById(id: string): Vendor | undefined {
  return MOCK_VENDORS.find(v => v.id === id);
}

export function getOnlineVendors(): Vendor[] {
  return MOCK_VENDORS.filter(v => v.isOnline);
}