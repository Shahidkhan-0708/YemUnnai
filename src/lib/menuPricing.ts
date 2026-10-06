import type { FoodItem } from './types';
export function menuPrices(item: FoodItem): number[] {
  return item.priceVariants?.length ? item.priceVariants.map(v => v.price) : item.price != null ? [item.price] : [];
}
export function menuPriceText(item: FoodItem): string {
  if (!item.sourceItemId && item.price === 0) return '—';
  if (item.priceVariants?.length) return item.priceVariants.map(v => `${v.name} · ₹${v.price}`).join(' / ');
  return item.price != null ? `₹${item.price}${item.priceDisplay?.match(/ \/ per (piece|plate)$/)?.[0] ?? ''}` : item.priceDisplay || 'Price not specified';
}
