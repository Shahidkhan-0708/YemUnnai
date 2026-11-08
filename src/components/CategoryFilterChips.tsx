import React, { useEffect, useRef } from 'react';

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
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll active chip into horizontal center view
  useEffect(() => {
    if (!containerRef.current) return;
    const activeChip = containerRef.current.querySelector<HTMLElement>(`[data-chip-id="${selectedCategory}"]`);
    if (activeChip) {
      activeChip.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [selectedCategory]);

  return (
    <div className="w-full bg-white/95 backdrop-blur-md border-b border-gray-100 py-2 sticky top-[53px] z-20 shadow-2xs font-sans">
      <div 
        ref={containerRef}
        className="flex items-center gap-2 overflow-x-auto px-4 scrollbar-none snap-x"
      >
        {/* Pure Veg Quick Toggle Pill */}
        <button
          type="button"
          onClick={() => onToggleVegOnly(!isVegOnly)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black border transition-all flex-shrink-0 cursor-pointer snap-start ${
            isVegOnly
              ? 'bg-emerald-50 border-emerald-600 text-emerald-700 shadow-2xs'
              : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
          }`}
          aria-pressed={isVegOnly}
        >
          <span className="w-2.5 h-2.5 rounded-xs border border-emerald-600 flex items-center justify-center bg-white">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
          </span>
          <span>Pure Veg</span>
        </button>

        {/* Category Anchor Pills with Dynamic Item Counts */}
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              data-chip-id={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black border transition-all flex-shrink-0 cursor-pointer snap-start ${
                isSelected
                  ? 'bg-gray-950 border-gray-950 text-white shadow-xs'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }`}
              aria-pressed={isSelected}
            >
              <span>{cat.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
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
