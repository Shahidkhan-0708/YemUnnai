import React from 'react';

export interface CategoryItem {
  id: string;
  name: string;
  nameTe: string;
  image: string;
}

export const CIRCULAR_DISH_CATEGORIES: CategoryItem[] = [
  {
    id: 'tiffin',
    name: 'Tiffin & Dosa',
    nameTe: 'టిఫిన్ & దోశ',
    image: '/images/item_masala_dosa.png',
  },
  {
    id: 'meals',
    name: 'Meals & Thali',
    nameTe: 'భోజనం & మీల్స్',
    image: '/images/item_meals.png',
  },
  {
    id: 'biryani',
    name: 'Biryani & Rice',
    nameTe: 'బిర్యానీ & రైస్',
    image: '/images/item_special_chicken_rice.png',
  },
  {
    id: 'beverages',
    name: 'Chai & Coffee',
    nameTe: 'టీ & కాఫీ',
    image: '/images/item_tea.jpg',
  },
  {
    id: 'fast_food',
    name: 'Fast Food',
    nameTe: 'ఫాస్ట్ ఫుడ్',
    image: '/images/item_french_fries.jpg',
  },
  {
    id: 'snacks',
    name: 'Snacks & Samosa',
    nameTe: 'స్నాక్స్ & సమోసా',
    image: '/images/item_samosa_chicken.jpg',
  },
  {
    id: 'coolers',
    name: 'Juices & Shakes',
    nameTe: 'జ్యూస్ & కూలర్స్',
    image: '/images/item_juice.jpg',
  },
  {
    id: 'bakery',
    name: 'Puffs & Bakery',
    nameTe: 'పఫ్స్ & బేకరీ',
    image: '/images/item_veg_puff.jpg',
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
    <section className="w-full bg-white mt-4 py-4 border-y border-gray-100">
      {/* Category Heading without Emoji Clutter */}
      <div className="px-4 mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">
            What&apos;s on your mind?
          </h2>
          <p className="text-[11px] text-gray-400 font-medium">
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

      {/* Horizontal Circular Category Track - Unified Clean Sans & Borderless Fluid Curves */}
      <div className="flex gap-4 overflow-x-auto px-4 pb-1 scrollbar-none snap-x snap-mandatory">
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
              {/* Unbordered Circular Bubble */}
              <div
                className={`w-16 h-16 rounded-full overflow-hidden bg-gray-50 border shadow-xs transition-all duration-200 group-hover:scale-105 active:scale-95 ${
                  isSelected
                    ? 'border-orange-500 ring-2 ring-orange-500/30 scale-105 shadow-sm'
                    : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  loading="lazy"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/images/item_meals.png';
                  }}
                />
              </div>

              {/* Clean Plain Text Category Label */}
              <span
                className={`mt-1.5 text-[11px] font-bold tracking-tight text-center transition-colors line-clamp-1 max-w-[80px] ${
                  isSelected ? 'text-orange-600 font-black' : 'text-gray-600 group-hover:text-gray-900'
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
