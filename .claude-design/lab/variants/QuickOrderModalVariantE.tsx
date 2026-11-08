// Quick Order Modal - Variant E: Expressive Direction
// Premium brand feel with enhanced motion, layered shadows, depth, and delightful micro-interactions
// Inspired by Swiggy's premium polish, Zomato's vibrant depth, Toing's playful energy

import { useState, useEffect, useRef } from 'react';
import { MOCK_FOOD_ITEMS, MOCK_VENDORS } from '../data/fixtures';

const item = MOCK_FOOD_ITEMS[0];
const vendor = MOCK_VENDORS.find(v => v.id === item.vendorId)!;
const dietary = item.dietary;

export function QuickOrderModalVariantE({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) {
  const [quantity, setQuantity] = useState(1);
  const [selectedPortion, setSelectedPortion] = useState(item.portionSizes?.[0] || 'Regular');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [showPortions, setShowPortions] = useState(item.portionSizes && item.portionSizes.length > 1);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [confettiParticles, setConfettiParticles] = useState<number[]>([]);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => {
      if (modalRef.current) {
        modalRef.current.style.animation = 'slideUpPremium 400ms cubic-bezier(.23,1,.32,1) forwards';
      }
    }, 10);
    return () => clearTimeout(timer);
  }, []);

  const increment = () => {
    setQuantity(q => Math.min(q + 1, 10));
    // Haptic feedback would trigger here
  };

  const decrement = () => setQuantity(q => Math.max(q - 1, 1));

  const handleConfirm = () => {
    setIsConfirmed(true);
    // Generate confetti particles
    const particles = Array.from({ length: 12 }, (_, i) => i);
    setConfettiParticles(particles);
    setTimeout(() => {
      onConfirm();
    }, 600);
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(31,20,10,0.5)',
      backdropFilter: 'blur(8px)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'flex-end',
      animation: 'fadeInPremium 250ms ease-out'
    }}>
      <style jsx global>{`
        @keyframes fadeInPremium { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUpPremium {
          from { opacity: 0; transform: translateY(100%) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes floatGentle {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-4px) rotate(0.5deg); }
        }
        @keyframes confettiFall {
          0% { opacity: 1; transform: translateY(0) rotate(0deg) scale(1); }
          100% { opacity: 0; transform: translateY(200px) rotate(720deg) scale(0.5); }
        }
        @keyframes pulseRing {
          0% { transform: scale(1); opacity: 0.4; }
          100% { transform: scale(2); opacity: 0; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>

      {/* Ambient Glow Behind Modal */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '200px',
        height: '100px',
        background: 'radial-gradient(ellipse at center, rgba(240,106,5,0.15) 0%, transparent 70%)',
        filter: 'blur(30px)',
        pointerEvents: 'none',
        zIndex: -1
      }} />

      <div
        ref={modalRef}
        className="modal-sheet"
        style={{
          width: '100%',
          maxWidth: '375px',
          background: 'white',
          borderRadius: '28px 28px 0 0',
          boxShadow: `
            0 -16px 48px rgba(31,20,10,0.15),
            0 -4px 16px rgba(31,20,10,0.08),
            inset 0 1px 0 rgba(255,255,255,0.8)
          `,
          animation: 'slideUpPremium 400ms cubic-bezier(.23,1,.32,1) forwards',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Decorative Top Accent */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, #F06A05 0%, #FF8618 50%, #F06A05 100%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 3s ease-in-out infinite'
        }} />

        {/* Drag Handle */}
        <div style={{
          width: '44px',
          height: '5px',
          margin: '14px auto 10px',
          borderRadius: '3px',
          background: 'linear-gradient(90deg, #F06A05 0%, #FF8618 100%)',
          boxShadow: '0 2px 8px rgba(240,106,5,0.3)'
        }} />

        {/* Header with Premium Styling */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px 16px',
          borderBottom: '1px solid #F0E8E0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #FFF0E3 0%, #FFE3CB 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5)'
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F06A05" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
            </div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1F140A', letterSpacing: '-0.3px' }}>
              Quick Order
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: '#F8F9FA',
              color: '#1F140A',
              border: '1px solid #F0E8E0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 200ms cubic-bezier(.23,1,.32,1)',
              boxShadow: '0 2px 8px rgba(31,20,10,0.05)'
            }}
            aria-label="Close modal"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', paddingBottom: '100px' }}>
          {/* Premium Item Card */}
          <div style={{
            display: 'flex',
            gap: '14px',
            marginBottom: '20px',
            padding: '16px',
            background: 'linear-gradient(135deg, #FFFFFF 0%, #FAFCFD 100%)',
            borderRadius: '20px',
            border: '1px solid #F0E8E0',
            boxShadow: '0 4px 16px rgba(31,20,10,0.05), inset 0 1px 0 rgba(255,255,255,0.8)',
            position: 'relative',
            overflow: 'hidden',
            animation: 'floatGentle 4s ease-in-out infinite'
          }}>
            {/* Shimmer overlay */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(90deg, transparent, rgba(240,106,5,0.02), transparent)',
              animation: 'shimmer 3s ease-in-out infinite'
            }} />

            <div style={{
              position: 'relative',
              width: '72px',
              height: '72px',
              borderRadius: '16px',
              flexShrink: 0,
              overflow: 'hidden',
              background: dietary === 'veg' ? '#E6F5ED' : dietary === 'nonveg' ? '#FCEAE4' : '#F5F1ED',
              boxShadow: 'inset 0 2px 8px rgba(31,20,10,0.06)'
            }}>
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={dietary === 'veg' ? '#007A55' : '#F06A05'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.08))' }}>
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>

              {/* Premium Dietary Badge */}
              <span className="dietary-badge" style={{
                position: 'absolute',
                left: '8px',
                top: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '9px',
                fontWeight: '600',
                color: dietary === 'veg' ? '#006B49' : dietary === 'nonveg' ? '#9A3C13' : '#6F6258',
                padding: '4px 9px',
                borderRadius: '6px',
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(8px)',
                border: `1px solid ${dietary === 'veg' ? 'rgba(0,122,85,0.3)' : dietary === 'nonveg' ? 'rgba(240,106,5,0.3)' : 'rgba(111,98,88,0.3)'}`,
                boxShadow: '0 2px 8px rgba(31,20,10,0.08)'
              }}>
                <span className="dietary-symbol" style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '10px',
                  height: '10px',
                  border: `1.5px solid ${dietary === 'veg' ? '#007A55' : dietary === 'nonveg' ? '#B45309' : '#6F6258'}`,
                  borderRadius: '2px',
                  flexShrink: 0,
                  background: dietary === 'veg' ? 'rgba(0,122,85,0.1)' : dietary === 'nonveg' ? 'rgba(240,106,5,0.1)' : 'rgba(111,98,88,0.1)'
                }}>
                  {dietary === 'veg' ? <i style={{ width: '4px', height: '4px', background: '#007A55', borderRadius: '50%' }} /> : dietary === 'nonveg' ? <i style={{ width: '0', height: '0', borderLeft: '3px solid transparent', borderRight: '3px solid transparent', borderBottom: '5px solid #9A3C13' }} /> : <i style={{ width: '4px', height: '4px', background: '#6F6258', borderRadius: '50%' }} />}
                </span>
                <span style={{ textTransform: 'capitalize', fontSize: '8px' }}>{dietary}</span>
              </span>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: '600', color: '#1F140A' }}>{item.name}</h3>
              <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#7A6658' }}>{vendor.name}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px', color: '#7A6658' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                  {item.prepTime}
                </span>
                <span style={{ color: '#D6DCE2' }}>•</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#C87809' }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="#C87809" style={{ filter: 'drop-shadow(0 1px 2px rgba(200,120,9,0.2))' }}>
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                  {item.rating.toFixed(1)}
                </span>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '22px', fontWeight: '700', fontVariantNumeric: 'tabular-nums', color: '#1F140A', background: 'linear-gradient(180deg, #1F140A 0%, #7A6658 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>₹{item.price}</div>
              <div style={{ fontSize: '11px', color: '#7A6658', marginTop: '2px' }}>× {quantity}</div>
            </div>
          </div>

          {/* Portion Selector - Premium */}
          {item.portionSizes && item.portionSizes.length > 1 && (
            <div style={{ marginBottom: '20px', animation: 'slideUp 500ms cubic-bezier(.23,1,.32,1) 100ms both' }}>
              <style jsx global>{`
                @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
              `}</style>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#1F140A', cursor: 'pointer' }}>
                  Portion Size
                  <span style={{ color: '#7A6658', fontWeight: '400', marginLeft: '8px' }}>{selectedPortion}</span>
                </label>
                <button
                  onClick={() => setShowPortions(!showPortions)}
                  style={{ background: 'none', border: 'none', color: '#F06A05', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  {showPortions ? 'Hide' : 'Change'}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: showPortions ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 150ms ease' }}>
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
              </div>
              {showPortions && (
                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '4px' }}>
                  {item.portionSizes.map((portion: string) => (
                    <button
                      key={portion}
                      onClick={() => { setSelectedPortion(portion); setShowPortions(false); }}
                      style={{
                        flex: '0 0 auto',
                        minWidth: '100px',
                        padding: '12px 18px',
                        borderRadius: '14px',
                        background: selectedPortion === portion ? 'linear-gradient(135deg, #FFF0E3 0%, #FFF8F0 100%)' : '#FFFFFF',
                        border: selectedPortion === portion ? '2px solid #F06A05' : '1px solid #F0E8E0',
                        color: selectedPortion === portion ? '#A23D00' : '#1F140A',
                        fontSize: '13px',
                        fontWeight: selectedPortion === portion ? '600' : '500',
                        cursor: 'pointer',
                        transition: 'all 200ms cubic-bezier(.23,1,.32,1)',
                        whiteSpace: 'nowrap',
                        boxShadow: selectedPortion === portion ? '0 4px 16px rgba(240,106,5,0.2)' : '0 2px 8px rgba(31,20,10,0.04)',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                      aria-pressed={selectedPortion === portion}
                    >
                      {portion}
                      {selectedPortion === portion && (
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
              )}
            </div>
          )}

          {/* Quantity Selector - Premium */}
          <div style={{ marginBottom: '20px', animation: 'slideUp 500ms cubic-bezier(.23,1,.32,1) 150ms both' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#1F140A', display: 'block', marginBottom: '12px' }}>Quantity</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0', background: '#F5F1ED', borderRadius: '16px', border: '1px solid #E8ECEF', width: 'fit-content', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)' }}>
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
                  borderRadius: '16px 0 0 16px',
                  transition: 'all 150ms ease',
                  boxShadow: quantity <= 1 ? 'none' : '0 2px 8px rgba(31,20,10,0.06)'
                }}
                aria-label="Decrease quantity"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </button>
              <span style={{ padding: '0 28px', fontSize: '22px', fontWeight: '700', fontVariantNumeric: 'tabular-nums', color: '#1F140A', minWidth: '48px', textAlign: 'center' }}>
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
                  borderRadius: '0 16px 16px 0',
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

          {/* Special Instructions - Premium */}
          <div style={{ marginBottom: '20px', animation: 'slideUp 500ms cubic-bezier(.23,1,.32,1) 200ms both' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#1F140A', display: 'block', marginBottom: '10px' }}>Special Instructions (Optional)</label>
            <textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="Less spicy, extra rice, no onions..."
              style={{
                width: '100%',
                minHeight: '90px',
                padding: '14px',
                borderRadius: '16px',
                border: '1px solid #F0E8E0',
                background: 'white',
                fontFamily: 'inherit',
                fontSize: '14px',
                lineHeight: '22px',
                color: '#1F140A',
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box',
                boxShadow: 'inset 0 2px 6px rgba(31,20,10,0.04)',
                transition: 'all 200ms ease'
              }}
            />
          </div>

          {/* Price Breakdown - Premium Card */}
          <div style={{ animation: 'slideUp 500ms cubic-bezier(.23,1,.32,1) 250ms both' }}>
            <div style={{
              padding: '20px',
              background: 'linear-gradient(135deg, #FFFFFF 0%, #FAFCFD 100%)',
              borderRadius: '20px',
              border: '1px solid #F0E8E0',
              boxShadow: '0 4px 16px rgba(31,20,10,0.05), inset 0 1px 0 rgba(255,255,255,0.8)'
            }}>
              <h4 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: '600', color: '#1F140A' }}>Order Summary</h4>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', color: '#7A6658' }}>{item.name} × {quantity}</span>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#1F140A' }}>₹{item.price * quantity}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px', color: '#7A6658' }}>
                <span>Packing charges</span>
                <span>₹5</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px', color: '#7A6658' }}>
                <span>Delivery fee</span>
                <span>₹0 <span style={{ color: '#007A55', fontWeight: '600' }}>(Free)</span></span>
              </div>
              <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, #F0E8E0, transparent)', margin: '14px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: '15px', fontWeight: '600', color: '#1F140A' }}>Total</span>
                <span style={{ fontSize: '24px', fontWeight: '800', fontVariantNumeric: 'tabular-nums', color: '#1F140A', background: 'linear-gradient(180deg, #F06A05 0%, #E05C00 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  ₹{item.price * quantity + 5}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Confetti Particles */}
        {confettiParticles.map((_, idx) => (
          <div
            key={idx}
            style={{
              position: 'absolute',
              bottom: '140px',
              left: '50%',
              transform: `translateX(-50%) rotate(${idx * 30}deg)`,
              width: '8px',
              height: '8px',
              borderRadius: idx % 2 === 0 ? '50%' : '2px',
              background: ['#F06A05', '#FF8618', '#C87809', '#007A55', '#FFFFFF'][idx % 5],
              animation: `confettiFall ${0.8 + idx * 0.1}s cubic-bezier(.23,1,.32,1) forwards`,
              pointerEvents: 'none',
              zIndex: 20
            }}
          />
        ))}

        {/* Success Pulse Ring */}
        {isConfirmed && (
          <div style={{
            position: 'absolute',
            bottom: '140px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            border: '3px solid #007A55',
            pointerEvents: 'none',
            animation: 'pulseRing 600ms ease-out forwards',
            zIndex: 19
          }} />
        )}

        {/* Premium Sticky Action Bar */}
        <div style={{
          padding: '16px 20px',
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid #F0E8E0',
          display: 'flex',
          gap: '12px',
          position: 'relative',
          zIndex: 10
        }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              height: '52px',
              borderRadius: '14px',
              background: 'white',
              color: '#F06A05',
              border: '2px solid #F06A05',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 200ms cubic-bezier(.23,1,.32,1)',
              boxShadow: '0 2px 8px rgba(240,106,5,0.15)'
            }}
          >
            Edit Order
          </button>
          <button
            onClick={handleConfirm}
            disabled={isConfirmed}
            style={{
              flex: 2,
              height: '52px',
              borderRadius: '14px',
              background: isConfirmed ? 'linear-gradient(135deg, #007A55 0%, #006B49 100%)' : 'linear-gradient(135deg, #F06A05 0%, #E05C00 100%)',
              color: 'white',
              border: 'none',
              fontSize: '16px',
              fontWeight: '600',
              cursor: isConfirmed ? 'not-allowed' : 'pointer',
              boxShadow: isConfirmed
                ? '0 4px 16px rgba(0,122,85,0.4), inset 0 1px 0 rgba(255,255,255,0.2)'
                : '0 8px 24px rgba(240,106,5,0.4), 0 2px 8px rgba(31,20,10,0.1), inset 0 1px 0 rgba(255,255,255,0.2)',
              transition: 'all 200ms cubic-bezier(.23,1,.32,1)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <span style={{ position: 'relative', zIndex: 1 }}>
              {isConfirmed ? 'Order Confirmed!' : `Confirm & Pay ₹${item.price * quantity + 5}`}
            </span>
            {isConfirmed && (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'relative', zIndex: 1, animation: 'checkPop 400ms cubic-bezier(.23,1,.32,1)' }}>
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            )}
            <style jsx global>{`
              @keyframes checkPop {
                0% { transform: scale(0) rotate(-45deg); }
                50% { transform: scale(1.3) rotate(0deg); }
                100% { transform: scale(1) rotate(0deg); }
              }
            `}</style>
            <span style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
              animation: 'shimmer 2s ease-in-out infinite'
            }} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default QuickOrderModalVariantE;