// Google Analytics (GA4) Integration Helper
import { isTestTraffic, recordPortalEvent } from './telemetry';
// Measurement ID: G-JCXFNM71JQ

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export const GA_MEASUREMENT_ID = 'G-JCXFNM71JQ';

/**
 * Generic wrapper to send any GA4 event safely (handles SSR, blockers, or delayed script loading)
 */
export function trackEvent(eventName: string, params?: Record<string, unknown>): void {
  if (isTestTraffic() || new URLSearchParams(location.search).get('portal') === 'admin') return;
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, params);
  } else if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push({ event: eventName, ...params });
  }
}

/**
 * Track SPA virtual page views (e.g. switching between Discover, Orders, Profile, or Seller portals)
 */
export function trackPageView(pageTitle: string, pagePath?: string): void {
  const path = pagePath || (typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/');
  trackEvent('page_view', {
    page_title: pageTitle,
    page_location: typeof window !== 'undefined' ? window.location.href : '',
    page_path: path,
  });
  void recordPortalEvent('page', { route: path.slice(0,160) });
}

/**
 * Track user viewing an item's details modal
 */
export function trackViewItem(item: {
  id: string;
  name: string;
  price: number | null;
  category?: string;
  vendor?: string;
}): void {
  trackEvent('view_item', {
    currency: 'INR',
    value: item.price,
    items: [
      {
        item_id: item.id,
        item_name: item.name,
        item_category: item.category,
        item_brand: item.vendor,
        price: item.price,
        quantity: 1,
      },
    ],
  });
  if (/^[a-f0-9-]{36}$/i.test(item.id)) void recordPortalEvent('item', { itemId: item.id });
}

/**
 * Track opening the quick checkout sheet
 */
export function trackBeginCheckout(
  item: { id: string; name: string; price: number | null; category?: string; vendor?: string },
  quantity: number
): void {
  if (item.price == null) return;
  const total = item.price * quantity;
  trackEvent('begin_checkout', {
    currency: 'INR',
    value: total,
    items: [
      {
        item_id: item.id,
        item_name: item.name,
        item_category: item.category,
        item_brand: item.vendor,
        price: item.price,
        quantity,
      },
    ],
  });
}

/**
 * Track successful order confirmation (Conversion / Purchase event in GA4)
 */
export function trackPurchase(order: {
  id: string;
  pickupNumber?: string | number;
  name: string;
  itemId?: string;
  price: number | null;
  quantity: number;
  total: number;
  vendor?: string;
  category?: string;
}): void {
  trackEvent('purchase', {
    transaction_id: order.id,
    value: order.total,
    currency: 'INR',
    pickup_number: order.pickupNumber,
    items: [
      {
        item_id: order.itemId || order.id,
        item_name: order.name,
        item_category: order.category,
        item_brand: order.vendor,
        price: order.price,
        quantity: order.quantity,
      },
    ],
  });
}

/**
 * Track food search in discovery feed
 */
export function trackSearch(searchQuery: string): void {
  if (!searchQuery.trim()) return;
  trackEvent('search', {
    search_term: searchQuery.trim(),
  });
}

/**
 * Track category filter selection (e.g. cooked, packed, drinks)
 */
export function trackSelectCategory(category: string): void {
  trackEvent('select_content', {
    content_type: 'category',
    item_id: category,
  });
}

/**
 * Track saving or unsaving an item to bookmarks
 */
export function trackSaveItem(itemId: string, itemName: string, isSaved: boolean): void {
  trackEvent(isSaved ? 'add_to_wishlist' : 'remove_from_wishlist', {
    currency: 'INR',
    items: [
      {
        item_id: itemId,
        item_name: itemName,
      },
    ],
  });
}

/**
 * Track user feedback / review submission
 */
export function trackSubmitFeedback(params: {
  foodItemId: string;
  rating: number;
  isLiked: boolean;
  hasComment: boolean;
}): void {
  trackEvent('submit_feedback', {
    food_item_id: params.foodItemId,
    rating: params.rating,
    is_liked: params.isLiked,
    has_comment: params.hasComment,
  });
}
