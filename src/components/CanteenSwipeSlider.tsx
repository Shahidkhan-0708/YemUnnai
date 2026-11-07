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
  onTrackRoute?: (canteen: CanteenData) => void;
}

export const CanteenSwipeSlider: React.FC<CanteenSwipeSliderProps> = ({ canteens, onViewMenu, onTrackRoute }) => {
  return (
    <section className="w-full py-4 bg-white border-b-8 border-gray-50">
      {/* Section Header */}
      <div className="px-4 mb-3 flex items-center justify-between">
        <h2 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
          <span>🍽️</span> Campus Spots Near You
        </h2>
        {onTrackRoute && (
          <button
            type="button"
            onClick={() => canteens[0] && onTrackRoute(canteens[0])}
            className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
          >
            <span>🧭</span> Track Route
          </button>
        )}
      </div>

      {/* Snap-Scrolling Track */}
      <div className="flex gap-4 overflow-x-auto px-4 pb-4 scrollbar-none snap-x snap-mandatory">
        {canteens.map((spot) => (
          <div 
            key={spot.id} 
            className="w-[320px] flex-shrink-0 bg-white rounded-2xl border border-gray-100 shadow-xs p-3 flex gap-3 snap-start transition-all hover:shadow-sm"
          >
            {/* Visual Focal Point: Compact Photo + Badge Overlay */}
            <div className="relative w-24 h-24 flex-shrink-0 bg-gray-50 rounded-xl overflow-hidden">
              <img 
                src={spot.imageUrl} 
                alt={spot.name} 
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <span className="absolute bottom-1.5 left-1.5 bg-black/75 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md tracking-wide flex items-center gap-1">
                <span>🚶</span> {spot.walkingTime}
              </span>
            </div>

            {/* Symmetrical Information Cluster */}
            <div className="flex flex-col justify-between flex-grow min-w-0">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-extrabold text-gray-950 truncate">{spot.name}</h3>
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-xs flex-shrink-0 ${
                    spot.isOpen ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {spot.isOpen ? 'OPEN' : 'CLOSED'}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 truncate mt-0.5">{spot.locationDetails}</p>
                
                <div className="flex items-center gap-1.5 mt-1.5 text-[11px] font-bold text-gray-600">
                  <span className="text-amber-500">★ {spot.rating.toFixed(1)}</span>
                  <span className="text-gray-300">•</span>
                  <span>{spot.priceRange}</span>
                </div>
              </div>

              {/* Action Buttons: View Menu & Track Route */}
              <div className="flex items-center gap-2 mt-2">
                <button 
                  type="button"
                  onClick={() => onViewMenu(spot.id, spot.name)}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-extrabold py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-xs shadow-orange-500/10 cursor-pointer"
                >
                  View Menu
                </button>
                {onTrackRoute && (
                  <button
                    type="button"
                    onClick={() => onTrackRoute(spot)}
                    className="px-2.5 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-600 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                    title="Track walking route"
                    aria-label={`Track route to ${spot.name}`}
                  >
                    🧭
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
