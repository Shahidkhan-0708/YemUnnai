import React, { useState, useEffect, useRef } from 'react';

export interface PromoDeal {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  code: string;
  shopName: string;
  bgGradient: string;
  emoji: string;
  imageUrl?: string;
}

export const PROMO_DEALS: PromoDeal[] = [
  {
    id: 'deal-1',
    badge: 'MITS CANTEEN EXCLUSIVE',
    title: 'FLAT 20% OFF',
    subtitle: 'On hot Masala Dosas, Idlis & Filter...',
    code: 'CAMPUS20',
    shopName: 'MITS Canteen',
    bgGradient: 'from-orange-500 to-amber-600',
    emoji: '🍲',
    imageUrl: '/images/item_masala_dosa.png',
  },
  {
    id: 'deal-2',
    badge: 'STUDENT SNACK COMBO',
    title: 'CHAI & SAMOSA',
    subtitle: 'Fresh ginger chai with crispy...',
    code: 'HAPPYTEA',
    shopName: 'Happy Tea',
    bgGradient: 'from-teal-600 to-emerald-700',
    emoji: '☕',
    imageUrl: '/images/item_samosa_chicken.jpg',
  },
  {
    id: 'deal-3',
    badge: 'BEST STUDENT VALUE',
    title: 'UNLIMITED MEALS ₹60',
    subtitle: 'Steaming Andhra rice, hot sambar, ghee...',
    code: 'THALI60',
    shopName: 'Mallikarjuna Mess',
    bgGradient: 'from-purple-600 to-indigo-700',
    emoji: '🍱',
    imageUrl: '/images/item_meals.png',
  },
  {
    id: 'deal-4',
    badge: 'AFTERNOON REFRESH',
    title: 'COOLERS & SHAKES ₹40',
    subtitle: 'Chilled watermelon mojito & thick fruit shakes',
    code: 'CHILLOUT',
    shopName: 'ACS Cafe',
    bgGradient: 'from-sky-600 to-blue-700',
    emoji: '🍹',
    imageUrl: '/images/item_juice.jpg',
  },
];

interface HeroPromoBannerCarouselProps {
  onSelectShop?: (shopName: string) => void;
}

export const HeroPromoBannerCarousel: React.FC<HeroPromoBannerCarouselProps> = ({ onSelectShop }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInteractingRef = useRef(false);

  // Auto-advance banner every 4.5 seconds when not interacting
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isInteractingRef.current && containerRef.current) {
        const nextIndex = (currentIndex + 1) % PROMO_DEALS.length;
        setCurrentIndex(nextIndex);
        const cardWidth = 316; // width + gap
        containerRef.current.scrollTo({
          left: nextIndex * cardWidth,
          behavior: 'smooth'
        });
      }
    }, 4500);

    return () => clearInterval(timer);
  }, [currentIndex]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollLeft } = containerRef.current;
    const index = Math.round(scrollLeft / 316);
    if (index >= 0 && index < PROMO_DEALS.length && index !== currentIndex) {
      setCurrentIndex(index);
    }
  };

  const scrollToIndex = (index: number) => {
    if (!containerRef.current) return;
    setCurrentIndex(index);
    containerRef.current.scrollTo({
      left: index * 316,
      behavior: 'smooth'
    });
  };

  return (
    <div className="w-full font-sans">
      {/* 1. HORIZONTAL PROMO TRACK */}
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        onTouchStart={() => { isInteractingRef.current = true; }}
        onTouchEnd={() => { setTimeout(() => { isInteractingRef.current = false; }, 2000); }}
        onMouseEnter={() => { isInteractingRef.current = true; }}
        onMouseLeave={() => { isInteractingRef.current = false; }}
        className="flex gap-4 overflow-x-auto px-4 pt-4 pb-2 scrollbar-none snap-x snap-mandatory"
        role="region"
        aria-label="Campus promotional deals"
      >
        {PROMO_DEALS.map((promo) => (
          <div 
            key={promo.id} 
            onClick={() => onSelectShop?.(promo.shopName)}
            className={`w-[300px] h-36 bg-gradient-to-br ${promo.bgGradient} rounded-2xl p-4 text-white flex-shrink-0 snap-start relative overflow-hidden shadow-xs flex justify-between items-center cursor-pointer`}
          >
            <div className="max-w-[65%] flex flex-col justify-between h-full relative z-10">
              <div>
                <span className="text-[9px] font-black tracking-widest text-white/80 block uppercase">
                  {promo.badge}
                </span>
                <h3 className="text-xl font-black tracking-tight mt-1 leading-none text-white">
                  {promo.title}
                </h3>
                <p className="text-[10px] text-white/75 font-semibold mt-1.5 line-clamp-1">
                  {promo.subtitle}
                </p>
              </div>
              
              <div className="flex items-center gap-2 mt-auto">
                <span className="text-[9px] font-mono font-semibold tracking-wider text-white bg-black/15 border border-white/20 px-2 py-1 rounded-md">
                  CODE: {promo.code}
                </span>
                <button 
                  type="button"
                  className="bg-white text-gray-950 text-[10px] font-black px-3 py-1 rounded-md shadow-xs active:scale-95 transition-transform flex items-center gap-0.5 cursor-pointer"
                >
                  Claim <span>→</span>
                </button>
              </div>
            </div>

            {/* Seamless Borderless Image Mask */}
            <div className="relative w-20 h-20 flex-shrink-0">
              <div className="absolute w-20 h-20 bg-black/20 rounded-full blur-md bottom-0" />
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/95 shadow-md relative z-10 flex items-center justify-center bg-white/10">
                {promo.imageUrl ? (
                  <img 
                    src={promo.imageUrl} 
                    alt={promo.title} 
                    className="w-full h-full object-cover" 
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/images/item_meals.png';
                    }}
                  />
                ) : (
                  <span className="text-3xl select-none">{promo.emoji}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Symmetrical Pagination Dot Indicators */}
      <div className="flex justify-center items-center gap-1.5 mt-2" aria-hidden="true">
        {PROMO_DEALS.map((deal, idx) => (
          <button
            key={deal.id}
            type="button"
            className={`w-1.5 h-1.5 rounded-full transition-all duration-200 cursor-pointer ${
              idx === currentIndex ? 'bg-orange-600 w-4' : 'bg-gray-300'
            }`}
            onClick={() => scrollToIndex(idx)}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroPromoBannerCarousel;
