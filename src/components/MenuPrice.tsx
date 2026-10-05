import type { FoodItem } from '../lib/types';
import { menuPriceText } from '../lib/menuPricing';
export function MenuPrice({item}: {item:FoodItem}) {
  return <span className={item.priceVariants?.length ? 'menu-price-variants' : undefined}>{item.priceVariants?.length ? item.priceVariants.map((variant,index)=><span key={index}><small>{variant.name}</small><strong>₹{variant.price}</strong></span>) : menuPriceText(item)}</span>;
}
