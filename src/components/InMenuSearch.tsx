import React from 'react';
import { Search, X } from 'lucide-react';

export interface InMenuSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const InMenuSearch: React.FC<InMenuSearchProps> = ({
  value,
  onChange,
  placeholder = 'Search this menu for dishes, drinks...',
}) => {
  return (
    <div className="px-4 py-2.5 bg-white border-b border-gray-100">
      <div className="relative flex items-center">
        <Search size={16} className="absolute left-3.5 text-gray-400" />
        <input
          type="search"
          aria-label="Search within this restaurant menu"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium placeholder-gray-400 focus:outline-hidden focus:border-orange-500 focus:bg-white transition-all shadow-inner"
        />
        {value && (
          <button
            type="button"
            aria-label="Clear in-menu search"
            onClick={() => onChange('')}
            className="absolute right-3 text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <X size={15} />
          </button>
        )}
      </div>
    </div>
  );
};

export default InMenuSearch;
