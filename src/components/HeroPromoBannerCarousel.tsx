import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

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
    subtitle: 'On hot Masala Dosas, Idlis & Filter Kaapi',
    code: 'CAMPUS20',
    shopName: 'MITS Canteen',
    bgGradient: 'linear-gradient(135deg, #c43800 0%, #e65100 50%, #f57c00 100%)',
    emoji: '🍲',
    imageUrl: '/images/item_masala_dosa.png',
  },
  {
    id: 'deal-2',
    badge: 'STUDENT SNACK COMBO',
    title: 'CHAI & SAMOSA ₹25',
    subtitle: 'Fresh ginger chai with crispy golden samosa',
    code: 'HAPPYTEA',
    shopName: 'Happy Tea',
    bgGradient: 'linear-gradient(135deg, #005b4f 0%, #00796b 50%, #009688 100%)',
    emoji: '☕',
    imageUrl: '/images/item_samosa_chicken.jpg',
  },
  {
    id: 'deal-3',
    badge: 'BEST STUDENT VALUE',
    title: 'UNLIMITED MEALS ₹60',
    subtitle: 'Steaming Andhra rice, hot sambar, ghee & podi',
    code: 'THALI60',
    shopName: 'Mallikarjuna Mess',
    bgGradient: 'linear-gradient(135deg, #511378 0%, #6a1b9a 50%, #8e24aa 100%)',
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
    bgGradient: 'linear-gradient(135deg, #01579b 0%, #0277bd 50%, #0288d1 100%)',
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
        const cardWidth = containerRef.current.clientWidth;
        containerRef.current.scrollTo({
          left: nextIndex * (cardWidth - 24),
          behavior: 'smooth'
        });
      }
    }, 4500);

    return () => clearInterval(timer);
  }, [currentIndex]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollLeft, clientWidth } = containerRef.current;
    const index = Math.round(scrollLeft / (clientWidth - 24));
    if (index >= 0 && index < PROMO_DEALS.length && index !== currentIndex) {
      setCurrentIndex(index);
    }
  };

  const scrollToIndex = (index: number) => {
    if (!containerRef.current) return;
    setCurrentIndex(index);
    const cardWidth = containerRef.current.clientWidth;
    containerRef.current.scrollTo({
      left: index * (cardWidth - 24),
      behavior: 'smooth'
    });
  };

  return (
    <div className="promo-banner-carousel-container">
      {/* Symmetrical Viewport Masked Track */}
      <div 
        ref={containerRef}
        className="promo-banner-track"
        onScroll={handleScroll}
        onTouchStart={() => { isInteractingRef.current = true; }}
        onTouchEnd={() => { setTimeout(() => { isInteractingRef.current = false; }, 2000); }}
        onMouseEnter={() => { isInteractingRef.current = true; }}
        onMouseLeave={() => { isInteractingRef.current = false; }}
        role="region"
        aria-label="Campus promotional deals"
      >
        {PROMO_DEALS.map((deal) => (
          <div 
            key={deal.id}
            className="promo-banner-card relative overflow-hidden rounded-2xl group"
            style={{ background: deal.bgGradient }}
            onClick={() => onSelectShop?.(deal.shopName)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectShop?.(deal.shopName);
              }
            }}
          >
            {/* Subtle Ambient Radial Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_70%)] pointer-events-none" />

            {/* Left Content Column */}
            <div className="promo-banner-content relative z-10 max-w-[62%] sm:max-w-[65%] flex flex-col justify-between h-full">
              <div>
                {/* Clean Pure Text Badge (Zero heavy background box) */}
                <div className="flex items-center gap-1.5 text-amber-300 font-black text-[10px] tracking-widest uppercase">
                  <Sparkles size={11} className="fill-amber-300 text-amber-300" />
                  <span>{deal.badge}</span>
                </div>

                {/* High-Contrast Stacked Title */}
                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight leading-tight mt-1.5">
                  {deal.title}
                </h3>

                {/* Single-line uniform subtitle */}
                <p className="text-xs text-white/90 font-medium leading-normal mt-1 line-clamp-1">
                  {deal.subtitle}
                </p>
              </div>

              {/* Cleaned CTA Axis: Typographic Coupon Accent + Polished Dominant White Pill */}
              <div className="flex items-center gap-3 mt-4">
                <span className="text-[10.5px] font-mono font-bold text-white/85 tracking-wide uppercase">
                  Code: <strong className="text-white underline decoration-white/40">{deal.code}</strong>
                </span>

                <span className="inline-flex items-center gap-1.5 bg-white text-gray-950 font-black text-xs px-3.5 py-1.5 rounded-full shadow-sm hover:bg-white/90 active:scale-95 transition-all cursor-pointer">
                  <span>Claim</span>
                  <ArrowRight size={12} className="text-gray-950" />
                </span>
              </div>
            </div>

            {/* 1. Unbordered Circular Food Frame (Zero nested square box-in-box error) */}
            <div className="relative z-10 w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-white/10 backdrop-blur-xs border border-white/25 shadow-xl flex items-center justify-center p-1.5 flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
              {deal.imageUrl ? (
                <img 
                  src={deal.imageUrl} 
                  alt={deal.title}
                  className="w-full h-full object-cover rounded-full"
                  loading="lazy"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/images/item_meals.png';
                  }}
                />
              ) : (
                <span className="text-4xl select-none">{deal.emoji}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Symmetrical Pagination Dot Indicators */}
      <div className="promo-carousel-dots flex justify-center items-center gap-1.5 mt-2" aria-hidden="true">
        {PROMO_DEALS.map((deal, idx) => (
          <button
            key={deal.id}
            type="button"
            className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
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
