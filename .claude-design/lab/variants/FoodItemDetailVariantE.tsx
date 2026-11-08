// Food Item Detail - Variant E: Expressive Direction
// Premium brand feel with enhanced motion, layered shadows, depth, and delightful micro-interactions
// Inspired by Swiggy's premium polish, Zomato's vibrant depth, Toing's playful energy

import { useState, useEffect, useRef } from 'react';
import { MOCK_FOOD_ITEMS, MOCK_VENDORS } from '../data/fixtures';

const item = MOCK_FOOD_ITEMS[0];
const vendor = MOCK_VENDORS.find(v => v.id === item.vendorId)!;
const dietary = item.dietary;

type PortionSize = { name: string; price: number };

export function FoodItemDetailVariantE() {
  const [quantity, setQuantity] = useState(1);
  const [selectedPortion, setSelectedPortion] = useState<PortionSize | undefined>(item.portionSizes?.[0]);
  const [isSaved, setIsSaved] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [hoveredAddBtn, setHoveredAddBtn] = useState(false);
  const [recentlyAdded, setRecentlyAdded] = useState(false);
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

  const increment = () => {
    setQuantity(q => Math.min(q + 1, 10));
    // Haptic feedback would trigger here
  };
  const decrement = () => setQuantity(q => Math.max(q - 1, 1));

  const handleAddToCart = () => {
    setRecentlyAdded(true);
    setTimeout(() => setRecentlyAdded(false), 1000);
  };

  return (
    <div className="detail-screen" style={{
      minHeight: '812px',
      width: '375px',
      margin: '0 auto',
      background: '#E8ECEF',
      position: 'relative',
      fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
      overflow: 'hidden'
    }}>
      {/* Ambient Background Blobs */}
      <div className="ambient-blobs" style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-100px',
          right: '-60px',
          width: '240px',
          height: '240px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 30%, rgba(240,106,5,0.08) 0%, transparent 70%)',
          filter: 'blur(50px)',
          animation: 'float 20s ease-in-out infinite'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-80px',
          left: '-50px',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 70% 70%, rgba(240,106,5,0.06) 0%, transparent 70%)',
          filter: 'blur(40px)',
          animation: 'float 25s ease-in-out infinite reverse'
        }} />
        <style jsx global>{`
          @keyframes float {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            33% { transform: translate(12px, -8px) rotate(1deg); }
            66% { transform: translate(-8px, 12px) rotate(-1deg); }
          }
        `}</style>
      </div>

      {/* Premium Hero with Parallax */}
      <div className="detail-hero" ref={heroRef} style={{
        position: 'relative',
        zIndex: 10,
        height: '300px',
        background: `
          linear-gradient(135deg, #F06A05 0%, #E05C00 50%, #D05000 100%),
          radial-gradient(ellipse at 85% 15%, rgba(255,255,255,0.12) 0%, transparent 50%),
          radial-gradient(ellipse at 15% 85%, rgba(255,180,50,0.08) 0%, transparent 50%)
        `,
        borderRadius: '0 0 32px 32px',
        boxShadow: `
          0 8px 32px rgba(208,80,0,0.25),
          0 2px 8px rgba(31,20,10,0.1),
          inset 0 1px 0 rgba(255,255,255,0.1)
        `,
        transform: `translateY(${scrollY * -20}px)`,
        transition: 'transform 0.1s linear'
      }}>
        {/* Floating Particles */}
        <div className="hero-particles" style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
          borderRadius: '0 0 32px 32px'
        }}>
          {[1,2,3,4,5,6].map((i) => (
            <div key={i} style={{
              position: 'absolute',
              left: `${8 + i * 15}%`,
              top: `${15 + (i % 3) * 22}%`,
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.25)',
              animation: `sparkle ${2.5 + i * 0.4}s ease-in-out infinite`,
              animationDelay: `${i * 0.2}s`
            }} />
          ))}
          <style jsx global>{`
            @keyframes sparkle {
              0%, 100% { opacity: 0.2; transform: scale(1) translateY(0); }
              50% { opacity: 1; transform: scale(1.8) translateY(-12px); }
            }
          `}</style>
        </div>

        {/* Top Bar */}
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          right: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 5
        }}>
          <button style={{
            width: '44px',
            height: '44px',
            borderRadius: '14px',
            background: 'rgba(255,255,255,0.18)',
            color: '#FFFFFF',
            border: '1px solid rgba(255,255,255,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            backdropFilter: 'blur(12px)',
            boxShadow: `
              0 4px 16px rgba(0,0,0,0.1),
              inset 0 1px 0 rgba(255,255,255,0.2)
            `,
            transition: 'all 200ms cubic-bezier(.23,1,.32,1)'
          }} aria-label="Go back">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setIsSaved(!isSaved)}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '14px',
                background: isSaved ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.18)',
                color: isSaved ? '#FFFFFF' : '#FFFFFF',
                border: isSaved ? '2px solid rgba(255,255,255,0.5)' : '1px solid rgba(255,255,255,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                backdropFilter: 'blur(12px)',
                transition: 'all 200ms cubic-bezier(.23,1,.32,1)',
                boxShadow: isSaved ? '0 4px 16px rgba(240,106,5,0.3)' : '0 4px 16px rgba(0,0,0,0.1)'
              }}
              aria-label={isSaved ? 'Remove from saved' : 'Save item'}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
              </svg>
            </button>
            <button style={{
              width: '44px',
              height: '44px',
              borderRadius: '14px',
              background: 'rgba(255,255,255,0.18)',
              color: '#FFFFFF',
              border: '1px solid rgba(255,255,255,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.2)',
              transition: 'all 200ms cubic-bezier(.23,1,.32,1)'
            }} aria-label="Share">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Centered Food Illustration with Depth */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${1 - scrollY * 0.15})`,
          transition: 'transform 0.1s linear',
          zIndex: 1
        }}>
          <div style={{
            width: '160px',
            height: '160px',
            borderRadius: '50%',
            background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.15) 0%, transparent 70%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `
              0 20px 60px rgba(0,0,0,0.15),
              inset 0 -2px 10px rgba(0,0,0,0.05)
            `
          }}>
            <svg width="90" height="90" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" style={{
              filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.2))',
              animation: 'gentleFloat 4s ease-in-out infinite'
            }}>
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            <style jsx global>{`
              @keyframes gentleFloat {
                0%, 100% { transform: translateY(0) rotate(0deg); }
                50% { transform: translateY(-6px) rotate(1deg); }
              }
            `}</style>
          </div>

          {/* Dietary Badge Floating */}
          <div className="dietary-badge" style={{
            position: 'absolute',
            bottom: '-20px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            lineHeight: '16px',
            fontWeight: '600',
            color: dietary === 'veg' ? '#006B49' : dietary === 'nonveg' ? '#9A3C13' : '#6F6258',
            padding: '6px 14px',
            borderRadius: '20px',
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(12px)',
            border: `1px solid ${dietary === 'veg' ? 'rgba(0,122,85,0.3)' : dietary === 'nonveg' ? 'rgba(240,106,5,0.3)' : 'rgba(111,98,88,0.3)'}`,
            boxShadow: '0 8px 24px rgba(31,20,10,0.12), inset 0 1px 0 rgba(255,255,255,0.8)',
            zIndex: 2,
            animation: 'badgePop 500ms cubic-bezier(.23,1,.32,1) 300ms both'
          }}>
            <span className="dietary-symbol" style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '14px',
              height: '14px',
              border: `1.5px solid ${dietary === 'veg' ? '#007A55' : dietary === 'nonveg' ? '#B45309' : '#6F6258'}`,
              borderRadius: '3px',
              flexShrink: 0,
              background: dietary === 'veg' ? 'rgba(0,122,85,0.1)' : dietary === 'nonveg' ? 'rgba(240,106,5,0.1)' : 'rgba(111,98,88,0.1)'
            }}>
              {dietary === 'veg' ? (
                <i style={{ width: '6px', height: '6px', background: '#007A55', borderRadius: '50%' }} />
              ) : dietary === 'nonveg' ? (
                <i style={{ width: '0', height: '0', borderLeft: '3.5px solid transparent', borderRight: '3.5px solid transparent', borderBottom: '6px solid #9A3C13', borderRadius: '0', background: 'none' }} />
              ) : (
                <i style={{ width: '6px', height: '6px', background: '#6F6258', borderRadius: '50%' }} />
              )}
            </span>
            <span style={{ textTransform: 'capitalize' }}>{dietary}</span>
            <style jsx global>{`
              @keyframes badgePop {
                0% { opacity: 0; transform: translateX(-50%) scale(0.8) translateY(10px); }
                100% { opacity: 1; transform: translateX(-50%) scale(1) translateY(0); }
              }
            `}</style>
          </div>
        </div>

        {/* Vendor Info Bar - Bottom of Hero */}
        <div style={{
          position: 'absolute',
          bottom: '16px',
          left: '16px',
          right: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 16px',
          background: 'rgba(255,255,255,0.15)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '16px',
          zIndex: 2
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'rgba(255,255,255,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '14px', fontWeight: '600', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {vendor.name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', opacity: 0.9, marginTop: '2px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v4"/><polyline points="17 14 12 19 7 14"/><line x1="12" y1="2" x2="12" y2="22"/>
                </svg>
                {vendor.walkTime}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
                {vendor.rating.toFixed(1)}
              </span>
            </div>
          </div>
          <span style={{ fontSize: '11px', fontWeight: '600', color: 'white', background: 'rgba(0,122,85,0.9)', padding: '4px 12px', borderRadius: '20px' }}>
            {vendor.isOnline ? 'Open now' : 'Closed'}
          </span>
        </div>
      </div>

      {/* Content Area */}
      <div className="detail-content" style={{ padding: '16px', paddingBottom: '120px', position: 'relative', zIndex: 5 }}>
        {/* Item Header with Premium Typography */}
        <div style={{ marginBottom: '20px', animation: 'slideUp 500ms cubic-bezier(.23,1,.32,1) 200ms both' }}>
          <style jsx global>{`
            @keyframes slideUp {
              from { opacity: 0; transform: translateY(20px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
          <h1 style={{ margin: '0 0 10px', fontSize: '28px', lineHeight: '36px', fontWeight: '800', color: '#1F140A', letterSpacing: '-0.8px' }}>
            {item.name}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#C87809" style={{ filter: 'drop-shadow(0 2px 4px rgba(200,120,9,0.2))' }}>
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              <span style={{ fontSize: '16px', fontWeight: '700', color: '#1F140A' }}>{item.rating.toFixed(1)}</span>
              <span style={{ fontSize: '14px', color: '#7A6658' }}>({item.reviewCount} reviews)</span>
            </div>
            <span style={{ color: '#D6DCE2' }}>•</span>
            <span style={{ fontSize: '14px', color: '#7A6658', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              {item.prepTime}
            </span>
          </div>
        </div>

        {/* Description Card - Premium */}
        <div style={{ marginBottom: '16px', animation: 'slideUp 500ms cubic-bezier(.23,1,.32,1) 300ms both' }}>
          <div style={{
            padding: '20px',
            background: 'white',
            borderRadius: '20px',
            border: '1px solid #F0E8E0',
            boxShadow: '0 4px 16px rgba(31,20,10,0.05), inset 0 1px 0 rgba(255,255,255,0.8)'
          }}>
            <p style={{ margin: 0, fontSize: '15px', lineHeight: '24px', color: '#1F140A', display: showFullDescription ? 'block' : '-webkit-box', WebkitLineClamp: showFullDescription ? 'unset' : 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {item.description}
            </p>
            {!showFullDescription && item.description.length > 150 && (
              <button
                onClick={() => setShowFullDescription(true)}
                style={{ marginTop: '12px', background: 'none', border: 'none', color: '#F06A05', fontSize: '13px', fontWeight: '600', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                Show more
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Portion Selector - Premium */}
        {item.portionSizes && item.portionSizes.length > 1 && (
          <div style={{ marginBottom: '16px', animation: 'slideUp 500ms cubic-bezier(.23,1,.32,1) 400ms both' }}>
            <h4 style={{ margin: '0 0 14px', fontSize: '14px', fontWeight: '600', color: '#1F140A' }}>Select portion</h4>
            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '4px' }}>
              {item.portionSizes.map((portion: PortionSize) => (
                <button
                  key={portion.name}
                  onClick={() => setSelectedPortion(portion)}
                  style={{
                    flex: '0 0 auto',
                    minWidth: '100px',
                    padding: '14px 20px',
                    borderRadius: '14px',
                    background: selectedPortion?.name === portion.name ? 'linear-gradient(135deg, #FFF0E3 0%, #FFF8F0 100%)' : '#FFFFFF',
                    border: selectedPortion?.name === portion.name ? '2px solid #F06A05' : '1px solid #F0E8E0',
                    color: selectedPortion?.name === portion.name ? '#A23D00' : '#1F140A',
                    fontSize: '14px',
                    fontWeight: selectedPortion?.name === portion.name ? '600' : '500',
                    cursor: 'pointer',
                    transition: 'all 200ms cubic-bezier(.23,1,.32,1)',
                    whiteSpace: 'nowrap',
                    boxShadow: selectedPortion?.name === portion.name ? '0 4px 16px rgba(240,106,5,0.2)' : '0 2px 8px rgba(31,20,10,0.04)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  aria-pressed={selectedPortion?.name === portion.name}
                >
                  {portion.name}
                  {selectedPortion?.name === portion.name && (
                    <span style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                      animation: 'shimmer 1.5s ease-in-out infinite'
                    }} />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Price & Quantity - Premium Card */}
        <div style={{ marginBottom: '16px', animation: 'slideUp 500ms cubic-bezier(.23,1,.32,1) 450ms both' }}>
          <div style={{
            padding: '20px',
            background: 'white',
            borderRadius: '20px',
            border: '1px solid #F0E8E0',
            boxShadow: '0 4px 16px rgba(31,20,10,0.05), inset 0 1px 0 rgba(255,255,255,0.8)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '13px', color: '#7A6658', fontWeight: '500', display: 'block', marginBottom: '6px' }}>Price per portion</span>
                <strong style={{ fontSize: '32px', lineHeight: '40px', fontWeight: '800', fontVariantNumeric: 'tabular-nums', color: '#1F140A', background: 'linear-gradient(180deg, #1F140A 0%, #7A6658 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  ₹{item.price}
                </strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0', background: '#F5F1ED', borderRadius: '14px', border: '1px solid #E8ECEF', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)' }}>
                <button
                  onClick={decrement}
                  disabled={quantity <= 1}
                  style={{
                    width: '52px',
                    height: '52px',
                    border: 'none',
                    background: quantity <= 1 ? 'transparent' : 'white',
                    color: quantity <= 1 ? '#D6DCE2' : '#1F140A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: quantity <= 1 ? 'not-allowed' : 'pointer',
                    borderRadius: '14px 0 0 14px',
                    transition: 'all 150ms ease',
                    boxShadow: quantity <= 1 ? 'none' : '0 2px 8px rgba(31,20,10,0.06)'
                  }}
                  aria-label="Decrease quantity"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </button>
                <span style={{ padding: '0 24px', fontSize: '20px', fontWeight: '700', fontVariantNumeric: 'tabular-nums', color: '#1F140A', minWidth: '40px', textAlign: 'center' }}>
                  {quantity}
                </span>
                <button
                  onClick={increment}
                  disabled={quantity >= 10}
                  style={{
                    width: '52px',
                    height: '52px',
                    border: 'none',
                    background: quantity >= 10 ? 'transparent' : 'white',
                    color: quantity >= 10 ? '#D6DCE2' : '#1F140A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: quantity >= 10 ? 'not-allowed' : 'pointer',
                    borderRadius: '0 14px 14px 0',
                    transition: 'all 150ms ease',
                    boxShadow: quantity >= 10 ? 'none' : '0 2px 8px rgba(31,20,10,0.06)'
                  }}
                  aria-label="Increase quantity"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Highlights & Nutrition - Premium Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px', animation: 'slideUp 500ms cubic-bezier(.23,1,.32,1) 500ms both' }}>
          {/* Highlights */}
          <div style={{
            padding: '16px',
            background: 'white',
            borderRadius: '16px',
            border: '1px solid #F0E8E0',
            boxShadow: '0 2px 8px rgba(31,20,10,0.04), inset 0 1px 0 rgba(255,255,255,0.6)'
          }}>
            <h4 style={{ margin: '0 0 12px', fontSize: '12px', fontWeight: '600', color: '#7A6658', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Highlights</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {item.tags.map((tag: string) => (
                <span key={tag} style={{
                  fontSize: '11px',
                  fontWeight: '500',
                  color: '#F06A05',
                  background: 'linear-gradient(135deg, #FFF0E3 0%, #FFF8F0 100%)',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  border: '1px solid #FFE3CB',
                  boxShadow: '0 1px 3px rgba(240,106,5,0.1)'
                }}>{tag}</span>
              ))}
            </div>
          </div>

          {/* Nutrition Preview */}
          <div style={{
            padding: '16px',
            background: 'white',
            borderRadius: '16px',
            border: '1px solid #F0E8E0',
            boxShadow: '0 2px 8px rgba(31,20,10,0.04), inset 0 1px 0 rgba(255,255,255,0.6)'
          }}>
            <h4 style={{ margin: '0 0 12px', fontSize: '12px', fontWeight: '600', color: '#7A6658', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nutrition</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { label: 'Calories', value: '485 kcal', color: '#F06A05', icon: '🔥' },
                { label: 'Protein', value: '28g', color: '#007A55', icon: '💪' },
                { label: 'Carbs', value: '52g', color: '#C87809', icon: '🌾' },
                { label: 'Fat', value: '18g', color: '#9A3C13', icon: '🧈' }
              ].map((nutrient, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px', background: '#F8F9FA', borderRadius: '10px', border: '1px solid #F0E8E0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px' }}>{nutrient.icon}</span>
                    <span style={{ fontSize: '12px', color: '#7A6658' }}>{nutrient.label}</span>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: nutrient.color, fontVariantNumeric: 'tabular-nums' }}>{nutrient.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Allergens */}
        <div style={{ marginBottom: '20px', animation: 'slideUp 500ms cubic-bezier(.23,1,.32,1) 550ms both' }}>
          <div style={{
            padding: '16px',
            background: 'white',
            borderRadius: '16px',
            border: '1px solid #F0E8E0',
            boxShadow: '0 2px 8px rgba(31,20,10,0.04), inset 0 1px 0 rgba(255,255,255,0.6)'
          }}>
            <h4 style={{ margin: '0 0 12px', fontSize: '12px', fontWeight: '600', color: '#7A6658', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Allergens</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {['Gluten', 'Dairy', 'Soy'].map((allergen) => (
                <span key={allergen} style={{
                  fontSize: '11px',
                  fontWeight: '500',
                  color: '#9A3C13',
                  background: 'linear-gradient(135deg, #FCEAE4 0%, #FDF5F0 100%)',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  border: '1px solid #F5D0C0',
                  boxShadow: '0 1px 3px rgba(154,60,19,0.1)'
                }}>{allergen}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div style={{ animation: 'slideUp 500ms cubic-bezier(.23,1,.32,1) 600ms both' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1F140A' }}>Reviews</h4>
            <button style={{ background: 'none', border: 'none', color: '#F06A05', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              View all
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { user: 'Priya S.', time: '2 days ago', rating: 5, text: 'Best biryani on campus! Perfect spice level and generous portion.' },
              { user: 'Arjun K.', time: '5 days ago', rating: 4, text: 'Good taste, but rice was a bit dry. Chicken was tender though.' },
              { user: 'Meera P.', time: '1 week ago', rating: 5, text: 'Ordered this 3 times this week. Consistently delicious!' },
              { user: 'Rohan M.', time: '2 weeks ago', rating: 4, text: 'Quick delivery, hot food. Will order again.' }
            ].map((review, idx) => (
              <div key={idx} style={{
                background: 'white',
                borderRadius: '16px',
                padding: '16px',
                border: '1px solid #F0E8E0',
                boxShadow: '0 2px 8px rgba(31,20,10,0.04), inset 0 1px 0 rgba(255,255,255,0.6)',
                transition: 'all 200ms cubic-bezier(.23,1,.32,1)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #F06A05 0%, #FF8618 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '13px',
                    fontWeight: '600',
                    boxShadow: '0 2px 8px rgba(240,106,5,0.3)'
                  }}>
                    {review.user.charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#1F140A' }}>{review.user}</div>
                    <div style={{ fontSize: '11px', color: '#7A6658' }}>{review.time}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#C87809' }}>
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill={i < review.rating ? '#C87809' : '#F0E8E0'} style={i < review.rating ? { filter: 'drop-shadow(0 1px 2px rgba(200,120,9,0.2))' } : {}}>
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                    ))}
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: '13px', lineHeight: '20px', color: '#1F140A' }}>{review.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Add to Cart Button - Premium */}
      <div style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50,
        width: 'calc(100% - 32px)',
        maxWidth: '375px',
        pointerEvents: 'none',
        animation: 'slideUp 500ms cubic-bezier(.23,1,.32,1) 700ms both'
      }}>
        <style jsx global>{`
          @keyframes slideUp {
            from { opacity: 0; transform: translateX(-50%) translateY(30px); }
            to { opacity: 1; transform: translateX(-50%) translateY(0); }
          }
        `}</style>
        <button
          onMouseEnter={() => setHoveredAddBtn(true)}
          onMouseLeave={() => setHoveredAddBtn(false)}
          onClick={handleAddToCart}
          style={{
            pointerEvents: 'auto',
            width: '100%',
            height: '56px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #F06A05 0%, #E05C00 100%)',
            color: 'white',
            border: 'none',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: hoveredAddBtn
              ? '0 16px 40px rgba(240,106,5,0.5), 0 4px 12px rgba(31,20,10,0.15), inset 0 1px 0 rgba(255,255,255,0.2)'
              : '0 12px 32px rgba(240,106,5,0.4), 0 3px 10px rgba(31,20,10,0.1), inset 0 1px 0 rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            transition: 'all 200ms cubic-bezier(.23,1,.32,1)',
            transform: hoveredAddBtn ? 'translateY(-2px)' : 'translateY(0)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <span style={{ position: 'relative', zIndex: 1 }}>Add {quantity} item{quantity !== 1 ? 's' : ''} to Order</span>
          <span style={{ position: 'relative', zIndex: 1, fontSize: '18px', fontWeight: '700', fontVariantNumeric: 'tabular-nums', background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '10px' }}>
            ₹{item.price * quantity}
          </span>

          {/* Shimmer Effect */}
          <span style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
            animation: 'shimmer 2s ease-in-out infinite'
          }} />
          <style jsx global>{`
            @keyframes shimmer {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(100%); }
            }
          `}</style>

          {/* Added Animation Overlay */}
          {recentlyAdded && (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,122,85,0.2)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2,
              animation: 'fadeInOut 1000ms ease-in-out'
            }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#007A55" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'checkPop 500ms cubic-bezier(.23,1,.32,1)' }}>
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <style jsx global>{`
                @keyframes fadeInOut {
                  0% { opacity: 0; }
                  15% { opacity: 1; }
                  85% { opacity: 1; }
                  100% { opacity: 0; }
                }
                @keyframes checkPop {
                  0% { transform: scale(0) rotate(-45deg); }
                  50% { transform: scale(1.3) rotate(0deg); }
                  100% { transform: scale(1) rotate(0deg); }
                }
              `}</style>
            </div>
          )}
        </button>
      </div>
    </div>
  );
}

export default FoodItemDetailVariantE;