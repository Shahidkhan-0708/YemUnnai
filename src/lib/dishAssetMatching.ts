/**
 * Contextual food image and emoji matching to ensure high-fidelity UI rendering.
 * Prevents hardcoded photo reuse (e.g. Samosa image appearing for Meals/Chapathi).
 */

export function getContextualDishImage(name: string, existingImage?: string | null): string {
  if (existingImage && !existingImage.includes('item_samosa_chicken.jpg')) {
    return existingImage;
  }
  const n = (name || '').toLowerCase();
  
  if (n.includes('chapathi') || n.includes('roti') || n.includes('paratha')) return '/images/item_chapathi.png';
  if (n.includes('meal') || n.includes('thali') || n.includes('lunch') || n.includes('rice sambar')) return '/images/item_meals.png';
  if (n.includes('masala dosa')) return '/images/item_masala_dosa.png';
  if (n.includes('onion dosa')) return '/images/item_onion_dosa.png';
  if (n.includes('dosa')) return '/images/item_dosa.png';
  if (n.includes('poori') || n.includes('puri')) return '/images/item_poori.png';
  if (n.includes('pongal')) return '/images/item_pongal.jpg';
  if (n.includes('curd rice')) return '/images/item_curd_rice.png';
  if (n.includes('special chicken') || n.includes('biryani')) return '/images/item_special_chicken_rice.png';
  if (n.includes('chicken fried rice')) return '/images/item_chicken_fried_rice.png';
  if (n.includes('egg fried rice')) return '/images/item_egg_fried_rice.png';
  if (n.includes('veg fried rice') || n.includes('fried rice')) return '/images/item_veg_fried_rice.png';
  if (n.includes('omelette') || n.includes('egg omelet') || n.includes('omelet')) return '/images/item_egg_omelette.png';
  if (n.includes('tea') || n.includes('chai')) return '/images/item_tea.jpg';
  if (n.includes('black coffee')) return '/images/item_black_coffee.jpg';
  if (n.includes('sonti coffee')) return '/images/item_sonti_coffee.jpg';
  if (n.includes('coffee') || n.includes('kaapi')) return '/images/item_coffee.jpg';
  if (n.includes('milk')) return '/images/item_milk.jpg';
  if (n.includes('juice') || n.includes('shake') || n.includes('cooler') || n.includes('mojito')) return '/images/item_juice.jpg';
  if (n.includes('french fries') || n.includes('fries')) return '/images/item_french_fries.jpg';
  if (n.includes('manchurian') || n.includes('gobi')) return '/images/item_gobi_manchurian.png';
  if (n.includes('bajji') || n.includes('mirchi') || n.includes('pakoda')) return '/images/item_mirchi_bajji.jpg';
  if (n.includes('batanees') || n.includes('peas')) return '/images/item_batanees.jpg';
  if (n.includes('egg puff')) return '/images/item_egg_puff.jpg';
  if (n.includes('chicken puff')) return '/images/item_chicken_puff.jpg';
  if (n.includes('veg puff') || n.includes('puff')) return '/images/item_veg_puff.jpg';
  if (n.includes('pizza') || n.includes('pasta')) return '/images/item_veg_pizza.jpg';
  if (n.includes('ice') || n.includes('choco')) return '/images/item_choco_bar.jpg';
  if (n.includes('samosa')) return '/images/item_ekdant_samosa.jpg';

  if (existingImage) return existingImage;
  return '/images/item_meals.png';
}

export function getContextualDishEmoji(name: string): string {
  const n = (name || '').toLowerCase();
  if (n.includes('chapathi') || n.includes('roti') || n.includes('paratha')) return '🫓';
  if (n.includes('meal') || n.includes('thali') || n.includes('rice')) return '🍱';
  if (n.includes('dosa') || n.includes('poori') || n.includes('idli') || n.includes('pongal')) return '🥞';
  if (n.includes('tea') || n.includes('chai') || n.includes('coffee') || n.includes('kaapi')) return '☕';
  if (n.includes('juice') || n.includes('shake') || n.includes('cooler')) return '🍹';
  if (n.includes('pizza') || n.includes('burger')) return '🍔';
  if (n.includes('fries') || n.includes('puff') || n.includes('samosa') || n.includes('bajji')) return '🥟';
  return '🍲';
}
