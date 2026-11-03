// Quick Order Modal - Variant C: Density Variation (Compact)
// More information visible, tighter spacing - tradeoff: more visible data vs easier scanning
// Optimized for quick decisions with minimal scrolling

import React, { useState } from 'react';
import { MOCK_FOOD_ITEMS, MOCK_VENDORS, FoodItem, Vendor } from '../data/fixtures';

const item = MOCK_FOOD_ITEMS[0];
const vendor = MOCK_VENDORS.find(v => v.id === item.vendorId)!;
const dietary = item.dietary;

export function QuickOrderModalVariantC({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) {
  const [quantity, setQuantity] = useState(1);
  const [selectedPortion, setSelectedPortion] = useState(item.portionSizes?.[0] || 'Regular');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [showPortions, setShowPortions] = useState(item.portionSizes && item.portionSizes.length > 1);

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(31,20,10,0.4)',
      backdropFilter: 'blur(4px)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'flex-end',
      animation: 'fadeIn 150ms ease-out'
    }}>
      <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(100%); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div className="modal-sheet" style={{
        width: '100%',
        maxWidth: '375px',
        background: 'white',
        borderRadius: '20px 20px 0 0',
        boxShadow: '0 -6px 24px rgba(31,20,10,0.12)',
        animation: 'slideUp 250ms cubic-bezier(.23,1,.32,1)',
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Drag Handle */}
        <div style={{
          width: '36px',
          height: '4px',
          margin: '10px auto 6px',
          borderRadius: '2px',
          background: '#D6DCE2'
        }} />

        {/* Compact Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px 10px',
          borderBottom: '1px solid #F0E8E0'
        }}>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1F140A' }}>Quick Order</h2>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '9px',
              background: '#F5F1ED',
              color: '#1F140A',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            aria-label="Close modal"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Scrollable Content - Compact */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
          {/* Item Row - Inline */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', padding: '10px', background: '#F8F9FA', borderRadius: '12px', border: '1px solid #F0E8E0' }}>
            <div style={{
              position: 'relative',
              width: '52px',
              height: '52px',
              borderRadius: '10px',
              flexShrink: 0,
              overflow: 'hidden',
              background: dietary === 'veg' ? '#E6F5ED' : dietary === 'nonveg' ? '#FCEAE4' : '#F5F1ED'
            }}>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={dietary === 'veg' ? '#007A55' : '#F06A05'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <span className="dietary-badge" style={{
                position: 'absolute',
                left: '4px',
                top: '4px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px',
                fontSize: '7px',
                fontWeight: '600',
                color: dietary === 'veg' ? '#006B49' : dietary === 'nonveg' ? '#9A3C13' : '#6F6258',
                padding: '1px 5px',
                borderRadius: '3px',
                background: 'white'
              }}>
                <span className="dietary-symbol" style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '7px',
                  height: '7px',
                  border: `1px solid ${dietary === 'veg' ? '#007A55' : dietary === 'nonveg' ? '#B45309' : '#6F6258'}`,
                  borderRadius: '1px',
                  flexShrink: 0
                }}>
                  {dietary === 'veg' ? <i style={{ width: '2px', height: '2px', background: '#007A55', borderRadius: '50%' }} /> : dietary === 'nonveg' ? <i style={{ width: '0', height: '0', borderLeft: '1.5px solid transparent', borderRight: '1.5px solid transparent', borderBottom: '2.5px solid #9A3C13' }} /> : <i style={{ width: '2px', height: '2px', background: '#6F6258', borderRadius: '50%' }} />}
                </span>
                <span style={{ textTransform: 'capitalize', fontSize: '6px' }}>{dietary}</span>
              </span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: '600', color: '#1F140A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</h3>
              <p style={{ margin: '0 0 4px', fontSize: '10px', color: '#7A6658', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{vendor.name}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '9.5px', color: '#7A6658' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                  {item.prepTime}
                </span>
                <span style={{ color: '#D6DCE2' }}>•</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#C87809' }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="#C87809">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                  {item.rating.toFixed(1)}
                </span>
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0, minWidth: '70px' }}>
              <div style={{ fontSize: '16px', fontWeight: '700', fontVariantNumeric: 'tabular-nums', color: '#1F140A' }}>₹{item.price}</div>
              <div style={{ fontSize: '10px', color: '#7A6658', marginTop: '1px' }}>× {quantity}</div>
            </div>
          </div>

          {/* Inline Controls Row */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
            {/* Portion - Compact */}
            {item.portionSizes && item.portionSizes.length > 1 && (
              <div style={{ flex: 1, minWidth: '140px' }}>
                <label style={{ fontSize: '10px', fontWeight: '600', color: '#7A6658', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '4px' }}>Portion</label>
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setShowPortions(!showPortions)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'white',
                      border: '1px solid #F0E8E0',
                      color: '#1F140A',
                      fontSize: '12px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      textAlign: 'left',
                      transition: 'all 150ms ease'
                    }}
                    aria-expanded={showPortions}
                    aria-haspopup="listbox"
                  >
                    <span>{selectedPortion}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7A6658" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: showPortions ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 150ms ease' }}>
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>
                  {showPortions && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      marginTop: '4px',
                      background: 'white',
                      borderRadius: '8px',
                      border: '1px solid #F0E8E0',
                      boxShadow: '0 8px 24px rgba(31,20,10,0.12)',
                      zIndex: 10,
                      overflow: 'hidden'
                    }}>
                      {item.portionSizes.map((portion: string) => (
                        <button
                          key={portion}
                          onClick={() => { setSelectedPortion(portion); setShowPortions(false); }}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: 'none',
                            background: selectedPortion === portion ? '#FFF0E3' : 'white',
                            color: selectedPortion === portion ? '#A23D00' : '#1F140A',
                            fontSize: '12px',
                            fontWeight: selectedPortion === portion ? '600' : '500',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 150ms ease'
                          }}
                          role="option"
                          aria-selected={selectedPortion === portion}
                        >
                          {portion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quantity - Compact */}
            <div style={{ flex: 1, minWidth: '120px' }}>
              <label style={{ fontSize: '10px', fontWeight: '600', color: '#7A6658', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '4px' }}>Qty</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0', background: '#F5F1ED', borderRadius: '8px', border: '1px solid #E8ECEF', width: 'fit-content' }}>
                <button
                  onClick={() => setQuantity(q => Math.max(q - 1, 1))}
                  disabled={quantity <= 1}
                  style={{
                    width: '36px',
                    height: '36px',
                    border: 'none',
                    background: quantity <= 1 ? 'transparent' : 'white',
                    color: quantity <= 1 ? '#D6DCE2' : '#1F140A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: quantity <= 1 ? 'not-allowed' : 'pointer',
                    borderRadius: '8px 0 0 8px'
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </button>
                <span style={{ padding: '0 16px', fontSize: '16px', fontWeight: '600', fontVariantNumeric: 'tabular-nums', color: '#1F140A', minWidth: '28px', textAlign: 'center' }}>
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(q => Math.min(q + 1, 10))}
                  disabled={quantity >= 10}
                  style={{
                    width: '36px',
                    height: '36px',
                    border: 'none',
                    background: quantity >= 10 ? 'transparent' : 'white',
                    color: quantity >= 10 ? '#D6DCE2' : '#1F140A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: quantity >= 10 ? 'not-allowed' : 'pointer',
                    borderRadius: '0 8px 8px 0'
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Special Instructions - Compact */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '10px', fontWeight: '600', color: '#7A6658', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '4px' }}>Special Instructions (Optional)</label>
            <textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="Less spicy, extra rice, no onions..."
              style={{
                width: '100%',
                minHeight: '60px',
                padding: '10px',
                borderRadius: '10px',
                border: '1px solid #F0E8E0',
                background: 'white',
                fontFamily: 'inherit',
                fontSize: '12px',
                lineHeight: '18px',
                color: '#1F140A',
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Price Breakdown - Compact */}
          <div style={{ padding: '12px', background: '#F8F9FA', borderRadius: '12px', border: '1px solid #F0E8E0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px' }}>
              <span style={{ color: '#7A6658' }}>{item.name} × {quantity}</span>
              <span style={{ fontWeight: '600', color: '#1F140A' }}>₹{item.price * quantity}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px', color: '#7A6658' }}>
              <span>Packing</span>
              <span>₹5</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px', color: '#7A6658' }}>
              <span>Delivery</span>
              <span>₹0 <span style={{ color: '#007A55', fontWeight: '500' }}>(Free)</span></span>
            </div>
            <div style={{ height: '1px', background: '#F0E8E0', margin: '8px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '700', color: '#1F140A' }}>
              <span>Total</span>
              <span>₹{item.price * quantity + 5}</span>
            </div>
          </div>
        </div>

        {/* Compact Sticky Action Bar */}
        <div style={{
          padding: '10px 16px',
          background: 'white',
          borderTop: '1px solid #F0E8E0',
          display: 'flex',
          gap: '10px'
        }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              height: '44px',
              borderRadius: '12px',
              background: 'white',
              color: '#F06A05',
              border: '2px solid #F06A05',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 150ms ease'
            }}
          >
            Edit
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 2,
              height: '44px',
              borderRadius: '12px',
              background: '#F06A05',
              color: 'white',
              border: 'none',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 3px 12px rgba(240,106,5,0.35)',
              transition: 'all 150ms ease'
            }}
          >
            Confirm Order
          </button>
        </div>
      </div>
    </div>
  );
}

export default QuickOrderModalVariantC;