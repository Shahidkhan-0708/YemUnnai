import React from 'react';
import { Navigation } from 'lucide-react';

export interface CanteenData {
  id: string;
  name: string;
  isOpen: boolean;
  locationDetails: string;
  rating: number;
  priceRange: string;
  walkingTime: string;
  imageUrl: string;
}

export interface CanteenSwipeSliderProps {
  canteens: CanteenData[];
  onViewMenu: (id: string, name?: string) => void;
  onOpenMap?: () => void;
}

export const CanteenSwipeSlider: React.FC<CanteenSwipeSliderProps> = ({ 
  canteens, 
  onViewMenu, 
  onOpenMap 
}) => {
  return (
    <section className="w-full bg-white py-4 font-sans">
      {/* 1. Clean, Clutter-Free Header Row (Single Explicit Action Link) */}
      <div className="px-4 mb-3.5 flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-gray-950 tracking-tight">
            Campus Spots Near You
          </h2>
          <p className="text-xs text-gray-400 font-medium">
            Active canteens &amp; cafes in walking distance
          </p>
        </div>
        {onOpenMap && (
          <button
            type="button"
            onClick={onOpenMap}
            className="text-xs font-black text-orange-600 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-full active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
          >
            <Navigation size={12} className="text-orange-600" />
            <span>Track Route</span>
          </button>
        )}
      </div>

      {/* 2. Seamless Floating Card Row (Zero heavy card-in-card nested borders) */}
      <div className="flex gap-4 overflow-x-auto px-4 pb-3 scrollbar-none snap-x snap-mandatory">
        {canteens.map((spot) => (
          <div 
            key={spot.id} 
            className="w-[290px] bg-white rounded-2xl border border-gray-100 shadow-xs flex-shrink-0 snap-start overflow-hidden transition-all hover:shadow-md flex flex-col justify-between"
          >
            {/* Main Visual: Clean Photo with Minimal Floating Badges */}
            <div className="relative w-full h-32 bg-gray-100 overflow-hidden">
              <img 
                src={spot.imageUrl} 
                alt={spot.name} 
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/images/shop_mits_canteen.jpg';
                }}
              />
              {/* Elegant rounded overlay status chip */}
              <div
                className={`absolute top-3 left-3 text-[10px] font-black px-2 py-0.5 rounded-md shadow-xs uppercase tracking-wider ${
                  spot.isOpen ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                }`}
              >
                {spot.isOpen ? 'OPEN' : 'CLOSED'}
              </div>

              {/* Minimal floating time badge */}
              <div className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                <span>{spot.walkingTime}</span>
              </div>
            </div>

            {/* Symmetrical Information Block */}
            <div className="p-3.5 flex flex-col justify-between flex-grow">
              <div>
                <div className="flex items-center justify-between gap-1.5">
                  <h3 className="text-sm font-black text-gray-950 truncate max-w-[70%]">
                    {spot.name}
                  </h3>
                  <div className="flex items-center gap-0.5 text-xs font-black text-orange-500">
                    <span>★</span>
                    <span>{spot.rating.toFixed(1)}</span>
                  </div>
                </div>
                
                <p className="text-[11px] text-gray-400 font-medium mt-0.5 truncate">
                  {spot.locationDetails}
                </p>
                
                <p className="text-[11px] font-bold text-gray-600 mt-1">
                  {spot.priceRange} <span className="text-gray-300 font-normal">· Cost for one</span>
                </p>
              </div>

              {/* SINGLE Unified Primary Action Button (Zero duplicate side arrows) */}
              <button 
                type="button"
                onClick={() => onViewMenu(spot.id, spot.name)}
                className="w-full mt-3.5 bg-orange-500 hover:bg-orange-600 active:scale-98 text-white text-xs font-black py-2.5 rounded-xl shadow-xs transition-all tracking-wide cursor-pointer"
              >
                View Menu
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default CanteenSwipeSlider;
