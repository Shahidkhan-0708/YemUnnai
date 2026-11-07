import React from 'react';

export interface CategoryCount {
  id: string;
  label: string;
  count: number;
}

export interface CategoryFilterChipsProps {
  categories: CategoryCount[];
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
  isVegOnly: boolean;
  onToggleVegOnly: (vegOnly: boolean) => void;
}

export const CategoryFilterChips: React.FC<CategoryFilterChipsProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  isVegOnly,
  onToggleVegOnly,
}) => {
  return (
    <div className="w-full bg-white border-b border-gray-100 py-2.5">
      <div className="flex items-center gap-2 overflow-x-auto px-4 scrollbar-none snap-x">
        {/* Pure Veg Quick Toggle Pill */}
        <button
          type="button"
          onClick={() => onToggleVegOnly(!isVegOnly)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black border transition-all flex-shrink-0 cursor-pointer snap-start ${
            isVegOnly
              ? 'bg-green-50 border-green-600 text-green-700 shadow-xs'
              : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
          }`}
          aria-pressed={isVegOnly}
        >
          <span className="w-2.5 h-2.5 rounded-xs border border-green-600 flex items-center justify-center bg-white">
            <span className="w-1.5 h-1.5 rounded-full bg-green-600" />
          </span>
          <span>Pure Veg</span>
        </button>

        {/* Category Filter Pills with Item Counts */}
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-black border transition-all flex-shrink-0 cursor-pointer snap-start ${
                isSelected
                  ? 'bg-gray-900 border-gray-900 text-white shadow-xs'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }`}
              aria-pressed={isSelected}
            >
              <span>{cat.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isSelected ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryFilterChips;
