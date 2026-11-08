import React from 'react';

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
      <div className="px-4 mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-black text-gray-950 uppercase tracking-wider">
            Campus Spots Near You
          </h2>
          <p className="text-2xs text-gray-400 font-semibold">
            Active canteens &amp; cafes in walking distance
          </p>
        </div>
        {onOpenMap && (
          <button
            type="button"
            onClick={onOpenMap}
            className="text-2xs font-black text-orange-600 bg-orange-50 border border-orange-100/50 px-2.5 py-1 rounded-md active:scale-95 transition-all cursor-pointer"
          >
            MAP VIEW
          </button>
        )}
      </div>

      {/* 2. Symmetrical Destination Spots Grid / Swipe Track */}
      <div className="flex gap-4 overflow-x-auto px-4 pb-2 scrollbar-none snap-x snap-mandatory">
        {canteens.map((spot) => (
          <div 
            key={spot.id} 
            className="w-[285px] sm:w-[305px] bg-white rounded-2xl border border-gray-100/80 shadow-xs flex-shrink-0 snap-start overflow-hidden transition-all hover:shadow-sm flex flex-col justify-between"
          >
            {/* Visual Container */}
            <div className="relative w-full h-36 bg-gray-100 overflow-hidden">
              <img 
                src={spot.imageUrl} 
                alt={spot.name} 
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/images/shop_mits_canteen.jpg';
                }}
              />
              
              {/* Clean Symmetrical Badges */}
              <span
                className={`absolute top-3 left-3 text-white text-[9px] font-black px-2 py-0.5 rounded-md shadow-xs tracking-wider uppercase ${
                  spot.isOpen ? 'bg-emerald-600' : 'bg-rose-600'
                }`}
              >
                {spot.isOpen ? 'OPEN' : 'CLOSED'}
              </span>

              <span className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-xs text-white text-[9px] font-semibold px-2 py-0.5 rounded-md">
                🏃 {spot.walkingTime}
              </span>
            </div>

            {/* Information Block */}
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
                
                <p className="text-2xs text-gray-400 font-semibold mt-0.5 truncate">
                  {spot.locationDetails}
                </p>
              </div>

              {/* Symmetrical Bottom Axis: Price + View Menu Button */}
              <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-50">
                <p className="text-2xs font-semibold text-gray-500">
                  <span className="font-black text-gray-950">{spot.priceRange}</span> · Cost for one
                </p>
                <button 
                  type="button"
                  onClick={() => onViewMenu(spot.id, spot.name)}
                  className="text-2xs font-black text-white bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-lg shadow-2xs transition-colors active:scale-95 cursor-pointer"
                >
                  View Menu
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default CanteenSwipeSlider;
