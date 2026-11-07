import React from 'react';

export interface CategoryItem {
  id: string;
  name: string;
  nameTe: string;
  image: string;
  emoji: string;
}

export const CIRCULAR_DISH_CATEGORIES: CategoryItem[] = [
  {
    id: 'tiffin',
    name: 'Tiffin & Dosa',
    nameTe: 'టిఫిన్ & దోశ',
    image: '/images/item_masala_dosa.png',
    emoji: '🥞',
  },
  {
    id: 'meals',
    name: 'Meals & Thali',
    nameTe: 'భోజనం & మీల్స్',
    image: '/images/item_meals.png',
    emoji: '🍱',
  },
  {
    id: 'biryani',
    name: 'Biryani & Rice',
    nameTe: 'బిర్యానీ & రైస్',
    image: '/images/item_special_chicken_rice.png',
    emoji: '🍗',
  },
  {
    id: 'beverages',
    name: 'Chai & Coffee',
    nameTe: 'టీ & కాఫీ',
    image: '/images/item_tea.jpg',
    emoji: '☕',
  },
  {
    id: 'fast_food',
    name: 'Fast Food',
    nameTe: 'ఫాస్ట్ ఫుడ్',
    image: '/images/item_french_fries.jpg',
    emoji: '🍔',
  },
  {
    id: 'snacks',
    name: 'Snacks & Samosa',
    nameTe: 'స్నాక్స్ & సమోసా',
    image: '/images/item_samosa_chicken.jpg',
    emoji: '🥟',
  },
  {
    id: 'coolers',
    name: 'Juices & Shakes',
    nameTe: 'జ్యూస్ & కూలర్స్',
    image: '/images/item_juice.jpg',
    emoji: '🍹',
  },
  {
    id: 'bakery',
    name: 'Puffs & Bakery',
    nameTe: 'పఫ్స్ & బేకరీ',
    image: '/images/item_veg_puff.jpg',
    emoji: '🥐',
  },
];

export interface CircularCategoriesProps {
  selectedCategoryId?: string;
  onSelectCategory: (categoryId: string) => void;
}

export const CircularCategories: React.FC<CircularCategoriesProps> = ({
  selectedCategoryId,
  onSelectCategory,
}) => {
  return (
    <section className="w-full py-4 bg-white border-b-8 border-gray-50">
      {/* Category Heading */}
      <div className="px-4 mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-gray-950 tracking-tight flex items-center gap-2">
            <span>✨</span> What&apos;s on your mind?
          </h2>
          <p className="text-[11px] font-medium text-gray-500">
            Explore popular campus food categories &amp; cuisines
          </p>
        </div>
        {selectedCategoryId && selectedCategoryId !== 'all' && (
          <button
            type="button"
            onClick={() => onSelectCategory('all')}
            className="text-xs font-bold text-orange-600 hover:text-orange-700 cursor-pointer"
          >
            Reset
          </button>
        )}
      </div>

      {/* Horizontal Circular Category Track */}
      <div className="flex gap-4 overflow-x-auto px-4 pb-2 scrollbar-none snap-x snap-mandatory">
        {CIRCULAR_DISH_CATEGORIES.map((cat) => {
          const isSelected = selectedCategoryId === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(isSelected ? 'all' : cat.id)}
              className="group flex flex-col items-center flex-shrink-0 cursor-pointer focus:outline-hidden snap-start"
              aria-pressed={isSelected}
            >
              {/* Outer Circular Ring with Soft Hover/Active Feedback */}
              <div
                className={`relative w-18 h-18 sm:w-20 sm:h-20 rounded-full p-0.5 transition-all duration-200 ${
                  isSelected
                    ? 'bg-gradient-to-tr from-orange-500 to-amber-500 ring-3 ring-orange-500/30 scale-105 shadow-md'
                    : 'bg-gradient-to-tr from-orange-100 to-amber-50 hover:scale-105 shadow-xs hover:shadow-sm'
                }`}
              >
                <div className="w-full h-full rounded-full overflow-hidden bg-white p-1 flex items-center justify-center">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-300"
                    loading="lazy"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/images/item_meals.png';
                    }}
                  />
                </div>

                {/* Floating Micro Emoji Badge */}
                <span className="absolute -bottom-1 -right-1 text-xs bg-white rounded-full p-0.5 shadow-xs border border-gray-100">
                  {cat.emoji}
                </span>
              </div>

              {/* Category Name Label */}
              <span
                className={`text-[11.5px] tracking-tight text-center mt-2 font-bold transition-colors line-clamp-1 max-w-[80px] ${
                  isSelected ? 'text-orange-600 font-black' : 'text-gray-800 group-hover:text-orange-600'
                }`}
              >
                {cat.name}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default CircularCategories;
