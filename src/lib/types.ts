// ============================================================
// Database row shapes (snake_case — mirrors supabase/schema.sql)
// ============================================================

export type FoodCategory = 'cooked' | 'packed';
export type ActionType = 'walkin' | 'order';
export type OrderStatus = 'pending' | 'accepted' | 'preparing' | 'ready' | 'collected' | 'declined' | 'cancelled' | 'completed';
export type ReactionValue = 'like' | 'dislike';
export interface PriceVariant { name: string; price: number; currency: string }

export interface VendorRow {
  id: string;
  name: string;
  image_url: string | null;
  is_active: boolean;
  is_online: boolean;
  owner_id: string | null;
  latitude?: number | null;
  longitude?: number | null;
  location_landmark?: string | null;
  is_on_campus?: boolean | null;
  created_at: string;
}

export interface FoodItemRow {
  id: string;
  vendor_id: string;
  name: string;
  price: number | null;
  category: FoodCategory;
  action_type: ActionType;
  image_url: string | null;
  in_stock: boolean;
  is_vegetarian: boolean | null;
  remaining_quantity: number | null;
  likes_count: number;
  dislikes_count: number;
  reviews_count: number;
  created_at: string;
  vendors: {
    name: string;
    latitude?: number | null;
    longitude?: number | null;
    location_landmark?: string | null;
    is_on_campus?: boolean | null;
    is_online?: boolean | null;
  } | null;
  reviews?: { rating: number }[] | null;
  source_item_id?: string | null;
  source_hotel_code?: string | null;
  menu_category?: string | null;
  food_type?: string | null;
  description?: string | null;
  details?: string | null;
  price_display?: string | null;
  price_variants?: PriceVariant[];
  menu_position?: number | null;
}

export interface OrderRow {
  id: string;
  vendor_id: string;
  food_item_id: string | null;
  item_name: string;
  unit_price: number;
  buyer_id: string | null;
  attempt_id: string | null;
  quantity: number | null;
  total: number;
  pickup_number: number | null;
  operating_date: string | null;
  shop_name: string | null;
  pickup_location: string | null;
  is_legacy: boolean;
  cancellation_requested: boolean;
  cancellation_result: 'approved' | 'rejected' | null;
  preparation_minutes: number | null;
  accepted_at: string | null;
  ready_at: string | null;
  collected_at: string | null;
  expires_at: string | null;
  payment_method: 'cash' | 'counter_upi' | null;
  outcome_reason: string | null;
  vendors?: { name: string; latitude?: number | null; longitude?: number | null; location_landmark?: string | null };
  customer_mobile: string;
  delivery_address: string;
  status: OrderStatus;
  created_at: string;
  food_items: { image_url: string | null } | null;
}

// ============================================================
// UI shapes (camelCase — consumed by components)
// ============================================================

export interface FoodItem {
  id: string;
  vendorId: string;
  name: string;
  vendor: string;
  price: number | null;
  sourceItemId?: string;
  sourceHotelCode?: string;
  menuCategory?: string;
  foodType?: string;
  description?: string;
  details?: string;
  priceDisplay?: string;
  priceVariants?: PriceVariant[];
  originalPrice?: number;
  category: FoodCategory;
  image: string;
  likes: number;
  dislikes: number;
  reviews: number;
  rating: number | null;
  freshnessTag?: string;
  stockLeft?: number;
  walkTime: string;
  actionType: ActionType;
  inStock: boolean;
  isVeg?: boolean;
  latitude?: number;
  longitude?: number;
  locationLandmark?: string;
  isOnCampus?: boolean;
  isShopOnline?: boolean;
}

export interface ShopEntry {
  id: string;
  name: string;
  image: string;
  isActive: boolean;
  isOnline: boolean;
  tag?: string;
  latitude?: number;
  longitude?: number;
  locationLandmark?: string;
  isOnCampus?: boolean;
}

export interface DashboardOrder {
  id: string;
  item: string;
  price: number;
  quantity?: number;
  vendor: string;
  phone: string;
  location: string;
  image: string;
  status: OrderStatus;
  row: OrderRow;
}

export interface VendorStats {
  ordersToday: number;
  totalLikes: number;
  avgRating: number | null;
}

export interface NewFoodItemInput {
  name: string;
  price: number | null;
  priceVariants?: PriceVariant[];
  category: FoodCategory;
  actionType: ActionType;
  inStock: boolean;
  imageUrl: string | null;
  isVeg?: boolean;
  remainingQuantity?: number | null;
}

export interface SupportRequest {
  id: string;
  order_id: string;
  buyer_id: string;
  vendor_id: string;
  message: string;
  status: 'open' | 'escalated' | 'resolved';
  response: string | null;
  created_at: string;
}
