import React from 'react';
import { Clock, Navigation } from 'lucide-react';

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
  onTrackRoute?: (canteen: CanteenData) => void;
}

export const CanteenSwipeSlider: React.FC<CanteenSwipeSliderProps> = ({ canteens, onViewMenu, onTrackRoute }) => {
  return (
    <section className="w-full py-4 bg-white border-b-8 border-gray-50">
      {/* Section Header - Clean Typography Superfamily, Zero Emojis */}
      <div className="px-4 mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">
            Campus Spots Near You
          </h2>
          <p className="text-[11px] text-gray-400 font-medium">
            Active canteens &amp; cafes in walking distance
          </p>
        </div>
        {onTrackRoute && (
          <button
            type="button"
            onClick={() => canteens[0] && onTrackRoute(canteens[0])}
            className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
          >
            <Navigation size={12} />
            <span>Track Route</span>
          </button>
        )}
      </div>

      {/* Snap-Scrolling Track */}
      <div className="flex gap-3.5 overflow-x-auto px-4 pb-2 scrollbar-none snap-x snap-mandatory">
        {canteens.map((spot) => (
          <div 
            key={spot.id} 
            className="w-[290px] sm:w-[310px] flex-shrink-0 bg-white rounded-2xl border border-gray-150 shadow-2xs p-3 flex gap-3 snap-start transition-all hover:shadow-xs"
          >
            {/* Visual Focal Point: Compact Photo + Badge Overlay */}
            <div className="relative w-22 h-22 sm:w-24 sm:h-24 flex-shrink-0 bg-gray-50 rounded-xl overflow-hidden">
              <img 
                src={spot.imageUrl} 
                alt={spot.name} 
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/images/shop_mits_canteen.jpg';
                }}
              />
              <span className="absolute bottom-1 left-1 bg-black/75 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md tracking-wide flex items-center gap-1">
                <Clock size={9} className="text-white" />
                <span>{spot.walkingTime}</span>
              </span>
            </div>

            {/* Symmetrical Information Cluster */}
            <div className="flex flex-col justify-between flex-grow min-w-0">
              <div>
                <div className="flex items-center justify-between gap-1.5">
                  <h3 className="text-xs sm:text-sm font-black text-gray-950 truncate">{spot.name}</h3>
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-xs flex-shrink-0 uppercase tracking-wider ${
                    spot.isOpen ? 'bg-green-50 text-green-700 border border-green-200/60' : 'bg-red-50 text-red-700 border border-red-200/60'
                  }`}>
                    {spot.isOpen ? 'OPEN' : 'CLOSED'}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 truncate mt-0.5 font-medium">{spot.locationDetails}</p>
                
                <div className="flex items-center gap-1.5 mt-1 text-[11px] font-bold text-gray-600">
                  <span className="text-amber-500 font-black">★ {spot.rating.toFixed(1)}</span>
                  <span className="text-gray-300">•</span>
                  <span className="text-gray-500 font-medium">{spot.priceRange}</span>
                </div>
              </div>

              {/* Action Buttons: View Menu & Route */}
              <div className="flex items-center gap-2 mt-2">
                <button 
                  type="button"
                  onClick={() => onViewMenu(spot.id, spot.name)}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-[11px] font-black py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 shadow-2xs cursor-pointer uppercase tracking-wider"
                >
                  View Menu
                </button>
                {onTrackRoute && (
                  <button
                    type="button"
                    onClick={() => onTrackRoute(spot)}
                    className="p-1.5 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-lg transition-colors cursor-pointer flex-shrink-0"
                    title="Track walking route"
                    aria-label={`Track route to ${spot.name}`}
                  >
                    <Navigation size={13} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default CanteenSwipeSlider;
