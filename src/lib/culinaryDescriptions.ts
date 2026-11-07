/**
 * Culinary descriptions for campus dishes to provide uniform 1-2 sentence
 * descriptions under dish prices, achieving authentic Swiggy/Zomato visual symmetry.
 */

const EXACT_DESCRIPTIONS: Record<string, string> = {
  // South Indian Breakfast & Tiffin
  'Masala Dosa': 'Crispy golden fermented crepe layered with spiced potato masala, served with fresh coconut chutney & hot sambar.',
  'Dosa': 'Traditional crispy fermented crepe made from aged rice and lentil batter, served with house chutneys & piping hot sambar.',
  'Onion Dosa': 'Thin crispy crepe roasted with finely chopped sautéed onions, served with coconut chutney & hot sambar.',
  'Poori': 'Fluffy golden puffed whole-wheat pooris served with homestyle spiced potato kurma & freshly ground coconut chutney.',
  'Pongal': 'Classic South Indian ghee-rich rice and moong dal porridge tempered with black pepper, cumin & roasted cashews.',
  'Chapathi': 'Soft, freshly made whole wheat flatbreads served with seasoned vegetable kurma or homestyle lentil curry.',
  
  // Meals & Rice
  'Meals': 'Wholesome South Indian thali featuring steamed rice, sambar, rasam, fresh curd, daily vegetable curries & crisp papad.',
  'Curd Rice': 'Comforting tempered rice with fresh thick curd, mustard seeds, green chilies, curry leaves & ginger.',
  'Chicken Fried Rice': 'Wok-tossed fragrant basmati rice with marinated chicken cubes, scrambled egg & fresh garden vegetables.',
  'Egg Fried Rice': 'Stir-fried basmati rice tossed with fluffy scrambled eggs, shredded cabbage, carrots & Asian seasonings.',
  'Veg Fried Rice': 'Wok-tossed long-grain basmati rice with crunchy carrots, green beans, bell peppers & scallions.',
  'Special Chicken Rice': 'Chef’s signature spiced chicken preparation tossed with aromatic seasoned rice and fresh garden herbs.',
  'Special Chicken Biryani': 'Fragrant basmati rice slow-cooked with whole spices and tender marinated chicken pieces, served with raita.',
  'Chicken Biryani': 'Aromatic basmati rice layered with spiced chicken, caramelized onions, and mint, served with cool raita.',

  // Snacks & Fast Food
  'Samosa': 'Crispy golden triangular pastry stuffed with mildly spiced potatoes, green peas & fresh coriander.',
  'Alu Samosa': 'Crispy pastry pocket filled with savory cumin-spiced mashed potatoes and green peas.',
  'Onion Samosa (3 pcs)': 'Trio of bite-sized crisp samosas filled with crunchy spiced onions, served with mint chutney.',
  'Corn Samosa': 'Golden triangular puffs stuffed with sweet corn kernels, melted cheese, and aromatic herbs.',
  'Gobi Samosa': 'Crisp pastry shell packed with spiced grated cauliflower, onions, and garam masala.',
  'Chicken Samosa': 'Flaky pastry filled with minced spiced chicken, onions, green chilies, and aromatic herbs.',
  'Veg Puff': 'Layered flaky puff pastry stuffed with seasoned diced potatoes, carrots, and garden peas.',
  'Egg Puff': 'Golden baked flaky puff filled with hard-boiled egg spiced with onion-tomato masala.',
  'Chicken Puff': 'Crisp bakery puff pastry filled with tender shredded chicken in rich savory spices.',
  'French Fries': 'Crispy golden potato fingers tossed with sea salt, served hot with tangy tomato ketchup.',
  'Plain French Fries': 'Lightly salted golden potato fries fried to a crunchy finish, served hot.',
  'Peri Peri Fries': 'Crispy golden fries dusted with fiery, zesty peri peri spice blend for an extra kick.',

  // Burgers & Sandwiches
  'Veg Burger': 'Crispy spiced vegetable patty topped with crunchy lettuce, sliced onions & creamy sauce in a toasted bun.',
  'Veg Cheese Burger': 'Golden vegetable patty layered with melted cheese, fresh tomato, and signature burger sauce.',
  'Chicken Burger': 'Juicy seasoned chicken patty layered with crisp lettuce, onion rings & creamy mayonnaise.',
  'Chicken Extra Cheese Burger': 'Tender chicken patty loaded with double melted cheese, pickles & special garlic sauce.',
  'Paneer Burger': 'Crispy crumb-coated cottage cheese patty with lettuce, tomatoes, and spicy herb mayo.',
  'Veg Sandwich': 'Fresh toasted bread filled with thinly sliced cucumber, tomato, onion & green chutney.',
  'Corn Sandwich': 'Toasted sandwich layered with sweet corn kernels, bell peppers, and creamy mayonnaise.',
  'Paneer Sandwich': 'Grilled bread stuffed with marinated spiced cottage cheese cubes, capsicum, and mint sauce.',
  'Cheese Sandwich': 'Classic golden toasted sandwich loaded with melted cheddar and mozzarella cheese.',
  'Egg Sandwich': 'Toasted bread filled with fluffy spiced egg omelette, crisp lettuce & black pepper.',

  // Maggie & Noodles
  'Veg Maggie': 'Classic street-style Maggi noodles cooked with chopped onions, juicy tomatoes & signature spices.',
  'Egg Maggie': 'Spicy instant noodles stir-cooked with scrambled eggs, onions, and aromatic masala.',
  'Paneer Maggie': 'Comforting Maggi noodles tossed with soft paneer cubes, green peas, and extra butter.',
  'Cheese Maggie': 'Steaming hot Maggi noodles topped with generous melted processed cheese.',
  'Corn Maggie': 'Classic noodles cooked with sweet corn kernels, butter, and mild herb seasoning.',

  // Eggs & Omelettes
  'Egg Omelette': 'Two-egg fluffy omelette whisked with chopped onions, green chilies, tomatoes, and black pepper.',
  'Bread Omelette': 'Golden fluffy omelette folded neatly between two slices of butter-toasted sandwich bread.',
  'Bread Omelette Cheese': 'Butter-toasted bread layered around a seasoned omelette and melted cheese slice.',
  'Masala Omelette': 'Spicy Indian-style omelette loaded with chopped green chilies, red onions, and fresh cilantro.',
  'Egg Burji': 'Spiced Indian scrambled eggs tossed with sautéed onions, tomatoes, ginger, and curry leaves.',

  // Beverages & Hot Drinks
  'Tea': 'Freshly brewed hot milk tea infused with aromatic tea leaves, crushed ginger & green cardamom.',
  'Ginger Tea': 'Piping hot strong milk tea brewed with fresh crushed ginger root for a warm, soothing sip.',
  'Lemon Tea': 'Light and refreshing black tea infused with fresh lemon juice and a touch of honey.',
  'Green Tea': 'Antioxidant-rich delicate green tea brewed light and clean, served piping hot.',
  'Coffee': 'Authentic South Indian filter coffee brewed from roasted chicory-coffee beans with frothed milk.',
  'Black Coffee': 'Strong, aromatic black brew made from dark roasted coffee beans without milk.',
  'Cold Coffee': 'Creamy, frothy iced coffee blended with chilled whole milk, rich coffee syrup & cocoa.',
  'Badam Milk': 'Sweetened hot milk flavored with real crushed almonds, saffron strands & cardamom.',
  'Milk': 'Pure farm-fresh boiled hot milk served plain or with a light touch of sugar.',
  'Boost': 'Nutritious malt-chocolate drink blended hot with creamy whole milk for an instant energy kick.',
  'Horlicks': 'Classic wholesome malt drink mixed with steaming hot milk for comforting nutrition.',
  'Jaggery Tea - Full': 'Traditional country tea brewed with pure organic jaggery and crushed ginger.',
  'Jaggery Tea - Half': 'Half portion of authentic country jaggery tea with warm spices and soothing ginger.',

  // Fresh Juices & Shakes
  'Apple Fresh Juice': 'Cold-pressed crisp apple juice extracted fresh with natural sweetness, served chilled.',
  'Orange Juice': 'Freshly squeezed citrus orange juice loaded with vitamin C, made without artificial syrup.',
  'Pineapple Juice': 'Sweet and tangy tropical pineapple juice freshly pressed and served over ice.',
  'Pomegranate Juice': 'Rich ruby-red pomegranate juice freshly pressed from ripe arils, loaded with antioxidants.',
  'Watermelon Juice': 'Hydrating and naturally sweet fresh watermelon juice, served ice cold.',
  'Mango Juice': 'Thick and luscious mango juice made from ripe sweet mangoes, served chilled.',
  'Oreo Milkshake': 'Thick creamy milkshake blended with crunchy Oreo cookies, vanilla ice cream & chocolate fudge.',
  'Chocolate Milkshake': 'Decadent chocolate milkshake made with rich cocoa, ice cream & whole milk.',
  'Vanilla Milkshake': 'Classic smooth milkshake blended with fragrant vanilla bean ice cream and chilled milk.',
  'Strawberry Milkshake': 'Fruity and creamy milkshake prepared with sweet strawberry essence and rich ice cream.',
};

export function getDishDescription(name: string, category?: string, isVeg?: boolean): string {
  if (!name) return 'Freshly prepared campus specialty made to order with authentic homestyle flavors.';
  const cleanName = name.trim();
  if (EXACT_DESCRIPTIONS[cleanName]) {
    return EXACT_DESCRIPTIONS[cleanName];
  }

  // Keyword-based fallback matching
  const lower = cleanName.toLowerCase();
  if (lower.includes('biryani')) {
    return lower.includes('chicken')
      ? 'Aromatic basmati rice slow-cooked with tender marinated chicken and secret campus spices.'
      : 'Fragrant basmati rice layered with spiced vegetables, caramelized onions, and fresh mint.';
  }
  if (lower.includes('dosa')) {
    return 'Crispy fermented crepe made from rice and lentil batter, served with fresh coconut chutney & sambar.';
  }
  if (lower.includes('fried rice')) {
    return 'Wok-tossed basmati rice seasoned with Asian spices, scallions, and fresh vegetables.';
  }
  if (lower.includes('samosa')) {
    return 'Golden crispy pastry triangle filled with seasoned spiced potatoes and garden herbs.';
  }
  if (lower.includes('burger')) {
    return 'Toasted bun layered with a flavorful seasoned patty, crisp lettuce, and creamy sauce.';
  }
  if (lower.includes('sandwich')) {
    return 'Fresh toasted bread packed with tasty seasoned fillings and creamy signature sauce.';
  }
  if (lower.includes('pizza')) {
    return 'Freshly baked crust topped with tangy tomato sauce, herbs, and melted mozzarella cheese.';
  }
  if (lower.includes('juice')) {
    return 'Freshly extracted fruit juice prepared to order for a pure, refreshing natural boost.';
  }
  if (lower.includes('shake') || lower.includes('milkshake')) {
    return 'Thick and frosty milkshake blended with rich ice cream, fresh milk & sweet toppings.';
  }
  if (lower.includes('tea') || lower.includes('chai')) {
    return 'Freshly brewed hot milk tea infused with aromatic spices and soothing whole herbs.';
  }
  if (lower.includes('coffee')) {
    return 'Aromatic rich coffee brewed strong with creamy milk and balanced sweetness.';
  }
  if (lower.includes('maggi') || lower.includes('maggie') || lower.includes('noodles')) {
    return 'Street-style spiced instant noodles cooked with chopped vegetables and special masala.';
  }
  if (lower.includes('ice cream') || lower.includes('scoop')) {
    return 'Creamy, rich dessert scoop crafted with premium dairy and luscious flavors.';
  }

  // Clean fallback by category / diet
  if (category === 'Beverages' || category === 'Drinks') {
    return 'Refreshing, chilled or warm beverage freshly prepared on campus.';
  }
  if (isVeg) {
    return 'Freshly prepared pure vegetarian dish cooked with quality ingredients & homestyle care.';
  }
  return 'Freshly cooked campus specialty prepared to order with authentic homestyle flavors.';
}
