import React from 'react';
import { ArrowLeft, MapPin, Clock, Star } from 'lucide-react';
import type { ShopEntry } from '../lib/types';

export interface ShopProfileHeaderProps {
  restaurant: ShopEntry | undefined;
  onBack?: () => void;
  headingRef?: React.RefObject<HTMLHeadingElement | null>;
}

export const ShopProfileHeader: React.FC<ShopProfileHeaderProps> = ({
  restaurant,
  onBack,
  headingRef,
}) => {
  const isOnline = restaurant?.isOnline ?? true;
  const tag = restaurant?.locationLandmark ? 'Food Court' : 'Campus Eatery';

  return (
    <header className="bg-white border-b border-gray-100">
      {/* Top Navigation Row */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to Homepage Discovery"
          className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 active:scale-95 transition-all flex items-center justify-center text-gray-700 cursor-pointer"
        >
          <ArrowLeft size={18} />
        </button>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-lg font-black text-gray-950 tracking-tight flex-1 truncate"
        >
          {restaurant?.name ?? 'Restaurant Menu'}
        </h1>
        <span
          className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase ${
            isOnline ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
          }`}
        >
          {isOnline ? 'Open Now' : 'Closed'}
        </span>
      </div>

      {/* Symmetrical Merchant Profile Card (Swiggy / Zomato Pattern) */}
      <div className="px-4 pb-3">
        <div className="w-full bg-gradient-to-br from-gray-50 to-white border border-gray-150 rounded-2xl p-4 shadow-xs mt-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-black tracking-widest text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-md border border-orange-100/60">
              {tag}
            </span>
            <div className="flex items-center gap-1 bg-green-600 text-white font-black text-xs px-2.5 py-0.5 rounded-lg shadow-2xs">
              <Star size={11} className="fill-white" />
              <span>4.4</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-gray-600 font-semibold mt-2.5">
            <MapPin size={13} className="text-orange-500 shrink-0" />
            <span className="truncate">
              {restaurant?.locationLandmark || 'Campus Food Court, Ground Floor'}
            </span>
            <span>·</span>
            <span className="text-gray-400 font-medium">
              {restaurant?.isOnCampus ? 'Inside MITS' : 'Campus Vicinity'}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-2 pt-2 border-t border-gray-100 text-[11px] text-gray-500 font-medium">
            <span className="flex items-center gap-1">
              <Clock size={12} className="text-gray-400" />
              <span>Avg prep: <strong>5-10 mins</strong></span>
            </span>
            <span>•</span>
            <span className="text-emerald-700 font-bold">Pay-on-Pickup Verified</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default ShopProfileHeader;
