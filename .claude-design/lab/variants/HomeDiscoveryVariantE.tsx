// Home Discovery - Variant E: Expressive Direction
// Premium brand feel with enhanced motion, layered shadows, depth, and delightful micro-interactions
// Inspired by Swiggy's premium polish, Zomato's vibrant depth, Toing's playful energy

import React, { useState, useEffect, useRef } from 'react';
import { MOCK_VENDORS, MOCK_CATEGORIES, MOCK_FOOD_ITEMS, Vendor, FoodItem, Category } from '../data/fixtures';

const ONLINE_VENDORS = MOCK_VENDORS.filter(v => v.isOnline);
const DISPLAY_ITEMS = MOCK_FOOD_ITEMS.filter(item => item.inStock).slice(0, 8);

export function HomeDiscoveryVariantE() {
  const [cartCount, setCartCount] = useState(2);
  const [savedItems, setSavedItems] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [scrollY, setScrollY] = useState(0);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [recentlyAdded, setRecentlyAdded] = useState<string | null>(null);

  // Parallax effect for hero
  const heroRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        const scrollProgress = Math.max(0, Math.min(1, -rect.top / rect.height));
        setScrollY(scrollProgress);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const addToCart = (item: FoodItem) => {
    setCartCount(c => c + 1);
    setRecentlyAdded(item.id);
    setTimeout(() => setRecentlyAdded(null), 800);
  };

  const toggleSave = (itemId: string) => {
    setSavedItems(prev => prev.includes(itemId)
      ? prev.filter(id => id !== itemId)
      : [...prev, itemId]);
  };

  const filteredItems = DISPLAY_ITEMS.filter(item =>
    activeCategory === 'all' || item.category === activeCategory
  );

  // Premium shadow layers
  const cardShadow = hoveredCard
    ? '0 20px 40px rgba(31,20,10,0.12), 0 8px 16px rgba(31,20,10,0.08), 0 2px 4px rgba(31,20,10,0.05)'
    : '0 4px 12px rgba(31,20,10,0.06), 0 1px 3px rgba(31,20,10,0.04)';

  const cardTransform = hoveredCard ? 'translateY(-4px) scale(1.01)' : 'translateY(0) scale(1)';

  return (
    <div className="discovery-screen" style={{
      minHeight: '812px',
      width: '375px',
      margin: '0 auto',
      background: '#E8ECEF',
      position: 'relative',
      fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
      overflow: 'hidden'
    }}>
      {/* Ambient Background Blobs - Subtle brand color atmosphere */}
      <div className="ambient-blobs" style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-120px',
          right: '-80px',
          width: '280px',
          height: '280px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 30%, rgba(240,106,5,0.08) 0%, transparent 70%)',
          filter: 'blur(60px)',
          animation: 'float 20s ease-in-out infinite'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-100px',
          left: '-60px',
          width: '240px',
          height: '240px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 70% 70%, rgba(240,106,5,0.06) 0%, transparent 70%)',
          filter: 'blur(50px)',
          animation: 'float 25s ease-in-out infinite reverse'
        }} />
        <style jsx global>{`
          @keyframes float {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            33% { transform: translate(15px, -10px) rotate(2deg); }
            66% { transform: translate(-10px, 15px) rotate(-1deg); }
          }
        `}</style>
      </div>

      {/* Premium Hero with Layered Depth */}
      <header className="discovery-hero" ref={heroRef} style={{
        position: 'relative',
        zIndex: 10,
        height: '180px',
        padding: '18px 20px 16px',
        color: '#FFFFFF',
        background: `
          linear-gradient(135deg, #F06A05 0%, #E05C00 50%, #D05000 100%),
          radial-gradient(ellipse at 85% 15%, rgba(255,255,255,0.15) 0%, transparent 50%),
          radial-gradient(ellipse at 15% 85%, rgba(255,180,50,0.1) 0%, transparent 50%)
        `,
        borderRadius: '0 0 28px 28px',
        boxShadow: `
          0 4px 24px rgba(208,80,0,0.25),
          0 1px 3px rgba(31,20,10,0.1),
          inset 0 1px 0 rgba(255,255,255,0.1)
        `,
        transform: `translateY(${scrollY * -15}px)`,
        transition: 'transform 0.1s linear'
      }}>
        {/* Floating particles in hero */}
        <div className="hero-particles" style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
          borderRadius: '0 0 28px 28px'
        }}>
          {[1,2,3,4,5].map((i) => (
            <div key={i} style={{
              position: 'absolute',
              left: `${10 + i * 18}%`,
              top: `${20 + (i % 3) * 25}%`,
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.3)',
              animation: `sparkle ${3 + i * 0.5}s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`
            }} />
          ))}
          <style jsx global>{`
            @keyframes sparkle {
              0%, 100% { opacity: 0.3; transform: scale(1) translateY(0); }
              50% { opacity: 1; transform: scale(1.5) translateY(-8px); }
            }
          `}</style>
        </div>

        <div className="discovery-brand-row" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          height: '48px',
          position: 'relative',
          zIndex: 1
        }}>
          <div className="discovery-brand" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            minWidth: 0
          }}>
            {/* Premium Logo with Inner Glow */}
            <div style={{
              position: 'relative',
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              flexShrink: 0,
              background: 'rgba(255,255,255,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.25)',
              boxShadow: `
                0 4px 16px rgba(0,0,0,0.1),
                inset 0 1px 0 rgba(255,255,255,0.2),
                inset 0 -1px 0 rgba(255,255,255,0.05)
              `
            }}>
              <div style={{
                position: 'absolute',
                inset: '-2px',
                borderRadius: '16px',
                background: 'conic-gradient(from 0deg, transparent, rgba(255,255,255,0.15), transparent)',
                animation: 'rotate 8s linear infinite',
                zIndex: -1
              }} />
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
              <style jsx global>{`
                @keyframes rotate { to { transform: rotate(360deg); } }
              `}</style>
            </div>
            <div style={{ minWidth: 0 }}>
              <strong style={{
                display: 'block',
                fontSize: '20px',
                lineHeight: '26px',
                fontWeight: '800',
                letterSpacing: '1.2px',
                textShadow: '0 2px 8px rgba(0,0,0,0.15)',
                background: 'linear-gradient(180deg, #FFFFFF 0%, #FFF3E8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>YEMUNNAI</strong>
              <small style={{
                display: 'block',
                marginTop: '2px',
                fontSize: '11px',
                lineHeight: '16px',
                fontWeight: '600',
                color: '#FFF7EF',
                letterSpacing: '0.5px'
              }}>Food between lectures</small>
            </div>
          </div>

          {/* Premium Cart Button with Micro-interaction */}
          <button className="discovery-cart" style={{
            display: 'grid',
            placeItems: 'center',
            position: 'relative',
            flexShrink: 0,
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: 'rgba(255,255,255,0.18)',
            color: '#FFF',
            border: '1px solid rgba(255,255,255,0.25)',
            backdropFilter: 'blur(12px)',
            cursor: 'pointer',
            transition: 'all 200ms cubic-bezier(.23,1,.32,1)',
            boxShadow: `
              0 4px 16px rgba(0,0,0,0.1),
              inset 0 1px 0 rgba(255,255,255,0.2)
            `
          }} aria-label={`Cart: ${cartCount} items`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            {cartCount > 0 && (
              <span style={{
                position: 'absolute',
                right: '-5px',
                top: '-5px',
                background: '#FFFFFF',
                color: '#F06A05',
                border: '2px solid #F06A05',
                borderRadius: '12px',
                minWidth: '22px',
                padding: '0 5px',
                fontSize: '10px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(240,106,5,0.4)',
                animation: recentlyAdded === 'cart' ? 'popIn 300ms cubic-bezier(.23,1,.32,1)' : 'none'
              }}>{cartCount}</span>
            )}
          </button>
        </div>

        {/* Premium Search with Focus Ring */}
        <div className="discovery-search-row" style={{
          display: 'flex',
          marginTop: '14px',
          position: 'relative',
          zIndex: 1
        }}>
          <div className="discovery-search" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flex: 1,
            minWidth: 0,
            height: '52px',
            padding: '0 16px',
            background: '#FFFFFF',
            borderRadius: '16px',
            color: '#746052',
            boxShadow: `
              0 8px 24px rgba(208,80,0,0.12),
              0 2px 6px rgba(31,20,10,0.06),
              inset 0 1px 0 rgba(255,255,255,0.8)
            `,
            transition: 'all 200ms cubic-bezier(.23,1,.32,1)'
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: '#746052' }}>
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              type="search"
              placeholder="What are you craving today?"
              style={{
                flex: 1,
                width: 0,
                minWidth: 0,
                border: 'none',
                background: 'transparent',
                fontFamily: 'inherit',
                fontSize: '16px',
                lineHeight: '24px',
                fontWeight: '400',
                color: '#1F140A',
                outline: 'none'
              }}
              aria-label="Search food items"
            />
            <button style={{
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
              width: '40px',
              height: '40px',
              marginInlineEnd: '-8px',
              borderRadius: '12px',
              background: '#FFF0E3',
              color: '#A23D00',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 150ms ease'
            }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div className="discovery-content" style={{ padding: '16px 16px 0', paddingBottom: '120px', position: 'relative', zIndex: 5 }}>
        {/* Animated Category Pills */}
        <div className="discovery-categories" style={{
          display: 'flex',
          gap: '6px',
          padding: '4px',
          marginBottom: '20px',
          borderRadius: '14px',
          background: 'linear-gradient(135deg, #FFFFFF 0%, #F8F9FA 100%)',
          border: '1px solid #F0E8E0',
          boxShadow: '0 2px 8px rgba(31,20,10,0.04), inset 0 1px 0 rgba(255,255,255,0.6)'
        }}>
          {MOCK_CATEGORIES.map((cat: Category) => (
            <button
              key={cat.id}
              style={{
                flex: 1,
                borderRadius: '10px',
                color: activeCategory === cat.id ? 'white' : '#7A6658',
                fontSize: '12px',
                fontWeight: activeCategory === cat.id ? '600' : '500',
                background: activeCategory === cat.id
                  ? 'linear-gradient(135deg, #F06A05 0%, #E05C00 100%)'
                  : 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '8px 12px',
                transition: 'all 200ms cubic-bezier(.23,1,.32,1)',
                boxShadow: activeCategory === cat.id
                  ? '0 4px 16px rgba(240,106,5,0.35), inset 0 1px 0 rgba(255,255,255,0.2)'
                  : 'none',
                position: 'relative',
                overflow: 'hidden'
              }}
              aria-pressed={activeCategory === cat.id}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.name}
              {activeCategory === cat.id && (
                <span style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
                  animation: 'shimmer 1.5s ease-in-out infinite'
                }} />
              )}
            </button>
          ))}
        </div>

        {/* Premium Food Grid with Staggered Entrance */}
        <div className="food-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: '14px'
        }}>
          {filteredItems.map((item: FoodItem, index) => (
            <article
              key={item.id}
              className="food-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                padding: '12px',
                minWidth: 0,
                borderRadius: '20px',
                background: '#FFFFFF',
                border: '1px solid #F0E8E0',
                boxShadow: cardShadow,
                transform: cardTransform,
                transition: 'all 300ms cubic-bezier(.23,1,.32,1)',
                position: 'relative',
                overflow: 'visible',
                animation: `cardEntrance 500ms cubic-bezier(.23,1,.32,1) ${index * 60}ms both`,
                cursor: 'pointer'
              }}
              onMouseEnter={() => setHoveredCard(item.id)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <style jsx global>{`
                @keyframes cardEntrance {
                  from { opacity: 0; transform: translateY(20px) scale(0.95); }
                  to { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes popIn {
                  0% { transform: scale(0.5); opacity: 0; }
                  50% { transform: scale(1.2); }
                  100% { transform: scale(1); opacity: 1; }
                }
                @keyframes shimmer {
                  0% { transform: translateX(-100%); }
                  100% { transform: translateX(100%); }
                }
              `}</style>

              {/* Premium Photo with Inner Shadow & Shimmer */}
              <div className="food-photo" style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '1/1',
                borderRadius: '14px',
                overflow: 'hidden',
                background: 'linear-gradient(135deg, #F8F9FA 0%, #E8ECEF 100%)',
                boxShadow: 'inset 0 2px 8px rgba(31,20,10,0.06)'
              }}>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  background: `
                    radial-gradient(ellipse at 30% 30%, ${item.dietary === 'veg' ? 'rgba(0,122,85,0.15)' : item.dietary === 'nonveg' ? 'rgba(240,106,5,0.15)' : 'rgba(111,98,88,0.1)'} 0%, transparent 60%),
                    ${item.dietary === 'veg' ? '#E6F5ED' : item.dietary === 'nonveg' ? '#FCEAE4' : '#F5F1ED'}
                  `,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'transform 400ms cubic-bezier(.23,1,.32,1)'
                }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={item.dietary === 'veg' ? '#007A55' : '#F06A05'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{
                    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.08))',
                    transform: hoveredCard === item.id ? 'scale(1.1)' : 'scale(1)',
                    transition: 'transform 300ms cubic-bezier(.23,1,.32,1)'
                  }}>
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                </div>

                {/* Save Button with Premium Styling */}
                <button
                  className="food-save"
                  onClick={(e) => { e.stopPropagation(); toggleSave(item.id); }}
                  style={{
                    position: 'absolute !important',
                    right: '8px',
                    top: '8px',
                    width: '32px !important',
                    height: '32px !important',
                    padding: '0 !important',
                    borderRadius: '10px !important',
                    background: '#FFFFFF !important',
                    color: savedItems.includes(item.id) ? '#F06A05' : '#1F140A !important',
                    border: savedItems.includes(item.id) ? '2px solid #F06A05 !important' : '0 !important',
                    boxShadow: `
                      0 4px 12px rgba(31,20,10,0.12) !important,
                      inset 0 1px 0 rgba(255,255,255,0.8) !important
                    `,
                    fontSize: '0 !important',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 200ms cubic-bezier(.23,1,.32,1)',
                    zIndex: 2
                  }}
                  aria-label={savedItems.includes(item.id) ? 'Remove from saved' : 'Save item'}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill={savedItems.includes(item.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                  </svg>
                </button>

                {/* Premium Dietary Badge with Glass Effect */}
                <span className={`dietary-badge`} data-diet={item.dietary} style={{
                  position: 'absolute',
                  left: '8px',
                  top: '8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '10px',
                  lineHeight: '14px',
                  fontWeight: '600',
                  color: item.dietary === 'veg' ? '#006B49' : item.dietary === 'nonveg' ? '#9A3C13' : '#6F6258',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: 'rgba(255,255,255,0.9)',
                  backdropFilter: 'blur(8px)',
                  border: `1px solid ${item.dietary === 'veg' ? 'rgba(0,122,85,0.3)' : item.dietary === 'nonveg' ? 'rgba(240,106,5,0.3)' : 'rgba(111,98,88,0.3)'}`,
                  boxShadow: '0 2px 8px rgba(31,20,10,0.08)'
                }}>
                  <span className="dietary-symbol" style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '12px',
                    height: '12px',
                    border: `1.5px solid ${item.dietary === 'veg' ? '#007A55' : item.dietary === 'nonveg' ? '#B45309' : '#6F6258'}`,
                    borderRadius: '3px',
                    flexShrink: 0,
                    background: item.dietary === 'veg' ? 'rgba(0,122,85,0.1)' : item.dietary === 'nonveg' ? 'rgba(240,106,5,0.1)' : 'rgba(111,98,88,0.1)'
                  }}>
                    {item.dietary === 'veg' ? (
                      <i style={{ width: '5px', height: '5px', background: '#007A55', borderRadius: '50%' }} />
                    ) : item.dietary === 'nonveg' ? (
                      <i style={{ width: '0', height: '0', borderLeft: '3px solid transparent', borderRight: '3px solid transparent', borderBottom: '5px solid #9A3C13', borderRadius: '0', background: 'none' }} />
                    ) : (
                      <i style={{ width: '5px', height: '5px', background: '#6F6258', borderRadius: '50%' }} />
                    )}
                  </span>
                  <span style={{ textTransform: 'capitalize', fontSize: '9px' }}>{item.dietary}</span>
                </span>

                {/* Added to Cart Animation Overlay */}
                {recentlyAdded === item.id && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0,122,85,0.15)',
                    borderRadius: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 3,
                    animation: 'fadeInOut 800ms ease-in-out'
                  }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#007A55" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'checkPop 400ms cubic-bezier(.23,1,.32,1)' }}>
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <style jsx global>{`
                      @keyframes fadeInOut {
                        0% { opacity: 0; }
                        20% { opacity: 1; }
                        80% { opacity: 1; }
                        100% { opacity: 0; }
                      }
                      @keyframes checkPop {
                        0% { transform: scale(0) rotate(-45deg); }
                        50% { transform: scale(1.2) rotate(0deg); }
                        100% { transform: scale(1) rotate(0deg); }
                      }
                    `}</style>
                  </div>
                )}
              </div>

              {/* Name & Vendor */}
              <div className="food-name-row" style={{
                display: 'flex',
                alignItems: 'flexStart',
                gap: '6px',
                minHeight: '38px',
                flexShrink: 0,
                margin: '10px 2px 0'
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{
                    display: '-webkit-box',
                    WebkitBoxOrient: 'vertical',
                    WebkitLineClamp: 2,
                    overflow: 'hidden',
                    minWidth: 0,
                    margin: 0,
                    fontSize: '13px',
                    lineHeight: '18px',
                    fontWeight: '600',
                    overflowWrap: 'anywhere',
                    color: '#1F140A'
                  }}>{item.name}</h3>
                  <p className="food-vendor" style={{ margin: '2px 2px 0', fontSize: '10px', lineHeight: '14px', color: '#7A6658', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.vendor}
                  </p>
                </div>
              </div>

              {/* Premium Price & Action */}
              <div className="food-price-row" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                minHeight: '40px',
                margin: '8px 2px 0'
              }}>
                <div className="menu-price-variants" style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  minWidth: 0
                }}>
                  <span style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '6px' }}>
                    <strong style={{ fontSize: '18px', lineHeight: '24px', fontWeight: '700', fontVariantNumeric: 'tabular-nums', color: '#1F140A' }}>₹{item.price}</strong>
                    {item.portionSizes && item.portionSizes.length > 1 && (
                      <small style={{ fontSize: '10px', fontWeight: '400', color: '#7A6658', marginTop: '2px' }}>+{item.portionSizes.length - 1} more</small>
                    )}
                  </span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                  className="food-action"
                  style={{
                    flexShrink: 0,
                    height: '40px !important',
                    minHeight: '40px !important',
                    padding: '0 18px !important',
                    marginTop: '0',
                    borderRadius: '12px !important',
                    fontSize: '12px !important',
                    fontWeight: '600 !important',
                    background: 'linear-gradient(135deg, #F06A05 0%, #E05C00 100%)',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: `
                      0 4px 16px rgba(240,106,5,0.35),
                      inset 0 1px 0 rgba(255,255,255,0.2)
                    `,
                    transition: 'all 150ms cubic-bezier(.23,1,.32,1)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <span style={{ position: 'relative', zIndex: 1 }}>Add</span>
                  <span style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(135deg, #E05C00 0%, #D05000 100%)',
                    opacity: 0,
                    transition: 'opacity 150ms ease'
                  }} />
                </button>
              </div>

              {/* Premium Rating with Review Count */}
              <div className="food-social" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                margin: '8px 2px 2px',
                padding: '6px 0 0',
                borderTop: '1px solid #F5F1ED'
              }}>
                <div className="food-rating" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  flexShrink: 0,
                  minHeight: '20px',
                  lineHeight: '16px',
                  fontVariantNumeric: 'tabular-nums',
                  color: '#C87809'
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#C87809" style={{ filter: 'drop-shadow(0 1px 2px rgba(200,120,9,0.2))' }}>
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#1F140A' }}>{item.rating.toFixed(1)}</span>
                  <span style={{ fontSize: '10px', color: '#7A6658' }}>({item.reviewCount})</span>
                </div>
                <div className="food-prep" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '10px',
                  color: '#7A6658'
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                  <span>{item.prepTime}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Floating Cart Bar - Premium */}
      {cartCount > 0 && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100,
          width: 'calc(100% - 32px)',
          maxWidth: '375px',
          pointerEvents: 'none',
          animation: 'slideUp 400ms cubic-bezier(.23,1,.32,1)'
        }}>
          <style jsx global>{`
            @keyframes slideUp {
              from { opacity: 0; transform: translateX(-50%) translateY(20px); }
              to { opacity: 1; transform: translateX(-50%) translateY(0); }
            }
          `}</style>
          <div style={{
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            padding: '16px 20px',
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            boxShadow: `
              0 16px 48px rgba(31,20,10,0.15),
              0 4px 16px rgba(31,20,10,0.08),
              inset 0 1px 0 rgba(255,255,255,0.8)
            `,
            border: '1px solid rgba(240,106,5,0.15)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #FFF0E3 0%, #FFE3CB 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5)'
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F06A05" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#1F140A' }}>{cartCount} item{cartCount !== 1 ? 's' : ''} in cart</div>
                <div style={{ fontSize: '11px', color: '#7A6658' }}>Swipe up to view order</div>
              </div>
            </div>
            <button style={{
              padding: '12px 24px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #F06A05 0%, #E05C00 100%)',
              color: 'white',
              border: 'none',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: `
                0 4px 16px rgba(240,106,5,0.4),
                inset 0 1px 0 rgba(255,255,255,0.2)
              `,
              transition: 'all 150ms cubic-bezier(.23,1,.32,1)'
            }}>
              Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default HomeDiscoveryVariantE;