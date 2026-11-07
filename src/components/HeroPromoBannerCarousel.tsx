import React, { useState, useEffect, useRef } from 'react';
import { Tag, Sparkles, ArrowRight } from 'lucide-react';

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
    imageUrl: '/menu-assets/hotel1/images/hotel1_004_masala_dosa.jpg',
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
    imageUrl: '/images/shop_happy_tea_uploaded.jpg',
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
    imageUrl: '/menu-assets/mallikarjuna/images/015_meals.jpg',
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
    imageUrl: '/images/shop_acs_cafe.png',
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
      {/* Scrollable Track */}
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
            className="promo-banner-card relative overflow-hidden"
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
            {/* Subtle Radial Ambient Highlight */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_70%)] pointer-events-none" />

            {/* Left Content Column */}
            <div className="promo-banner-content relative z-10 max-w-[65%]">
              <span className="promo-banner-badge">
                <Sparkles size={10} />
                <span>{deal.badge}</span>
              </span>

              <h3 className="promo-banner-title">{deal.title}</h3>
              <p className="promo-banner-subtitle line-clamp-1">{deal.subtitle}</p>

              <div className="promo-banner-cta-row mt-3">
                <span className="promo-coupon-pill font-mono">
                  <Tag size={10} />
                  <span>{deal.code}</span>
                </span>
                <span className="promo-claim-btn">
                  <span>Claim</span>
                  <ArrowRight size={11} />
                </span>
              </div>
            </div>

            {/* Clean Graphical Cutout Asset Slot (Glassmorphic + Never Breaks) */}
            <div className="w-20 h-20 sm:w-22 sm:h-22 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/25 shadow-inner flex-shrink-0 relative z-10 transform hover:scale-105 transition-transform">
              <span className="text-3xl sm:text-4xl filter drop-shadow-md select-none">{deal.emoji}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Dot Indicators */}
      <div className="promo-carousel-dots" aria-hidden="true">
        {PROMO_DEALS.map((deal, idx) => (
          <button
            key={deal.id}
            type="button"
            className={`promo-dot ${idx === currentIndex ? 'active' : ''}`}
            onClick={() => scrollToIndex(idx)}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroPromoBannerCarousel;
