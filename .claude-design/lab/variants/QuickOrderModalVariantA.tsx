// Quick Order Modal - Variant A: Information Hierarchy Focus
// Clear visual hierarchy with prominent order summary, sticky actions, progressive disclosure
// Swiggy-style: bottom sheet with handle, clear sections, quantity controls inline

import React, { useState } from 'react';
import { MOCK_FOOD_ITEMS, MOCK_VENDORS, FoodItem, Vendor } from '../data/fixtures';

const item = MOCK_FOOD_ITEMS[0]; // Chicken Biryani
const vendor = MOCK_VENDORS.find(v => v.id === item.vendorId)!;
const dietary = item.dietary;

export function QuickOrderModalVariantA({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) {
  const [quantity, setQuantity] = useState(1);
  const [selectedPortion, setSelectedPortion] = useState(item.portionSizes?.[0] || 'Regular');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [showPortions, setShowPortions] = useState(item.portionSizes && item.portionSizes.length > 1);

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(31,20,10,0.5)',
      backdropFilter: 'blur(4px)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'flex-end',
      animation: 'fadeIn 200ms ease-out'
    }}>
      <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(100%); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div className="modal-sheet" style={{
        width: '100%',
        maxWidth: '375px',
        background: 'white',
        borderRadius: '24px 24px 0 0',
        boxShadow: '0 -8px 32px rgba(31,20,10,0.15)',
        animation: 'slideUp 300ms cubic-bezier(.23,1,.32,1)',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Drag Handle */}
        <div style={{
          width: '40px',
          height: '5px',
          margin: '12px auto 8px',
          borderRadius: '3px',
          background: '#D6DCE2'
        }} />

        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px 16px',
          borderBottom: '1px solid #F0E8E0'
        }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1F140A' }}>Quick Order</h2>
          <button
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: '#F5F1ED',
              color: '#1F140A',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 150ms ease'
            }}
            aria-label="Close modal"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {/* Item Card */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', padding: '12px', background: '#F8F9FA', borderRadius: '16px', border: '1px solid #F0E8E0' }}>
            <div style={{
              position: 'relative',
              width: '64px',
              height: '64px',
              borderRadius: '12px',
              flexShrink: 0,
              overflow: 'hidden',
              background: dietary === 'veg' ? '#E6F5ED' : dietary === 'nonveg' ? '#FCEAE4' : '#F5F1ED'
            }}>
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={dietary === 'veg' ? '#007A55' : '#F06A05'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <span className="dietary-badge" style={{
                position: 'absolute',
                left: '6px',
                top: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                fontSize: '8px',
                fontWeight: '600',
                color: dietary === 'veg' ? '#006B49' : dietary === 'nonveg' ? '#9A3C13' : '#6F6258',
                padding: '2px 6px',
                borderRadius: '4px',
                background: 'white'
              }}>
                <span className="dietary-symbol" style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '8px',
                  height: '8px',
                  border: `1px solid ${dietary === 'veg' ? '#007A55' : dietary === 'nonveg' ? '#B45309' : '#6F6258'}`,
                  borderRadius: '2px',
                  flexShrink: 0
                }}>
                  {dietary === 'veg' ? <i style={{ width: '3px', height: '3px', background: '#007A55', borderRadius: '50%' }} /> : dietary === 'nonveg' ? <i style={{ width: '0', height: '0', borderLeft: '2px solid transparent', borderRight: '2px solid transparent', borderBottom: '3px solid #9A3C13' }} /> : <i style={{ width: '3px', height: '3px', background: '#6F6258', borderRadius: '50%' }} />}
                </span>
                <span style={{ textTransform: 'capitalize', fontSize: '7px' }}>{dietary}</span>
              </span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: '600', color: '#1F140A' }}>{item.name}</h3>
              <p style={{ margin: '0 0 6px', fontSize: '12px', color: '#7A6658' }}>{vendor.name}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#7A6658' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                  {item.prepTime}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#C87809' }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="#C87809">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                  {item.rating.toFixed(1)}
                </span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '18px', fontWeight: '700', fontVariantNumeric: 'tabular-nums', color: '#1F140A' }}>₹{item.price}</div>
              <div style={{ fontSize: '11px', color: '#7A6658', marginTop: '2px' }}>× {quantity}</div>
            </div>
          </div>

          {/* Portion Selector */}
          {item.portionSizes && item.portionSizes.length > 1 && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#1F140A', cursor: 'pointer' }}>
                  Portion
                  <span style={{ color: '#7A6658', fontWeight: '400', marginLeft: '6px' }}>{selectedPortion}</span>
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
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '4px' }}>
                  {item.portionSizes.map((portion: string) => (
                    <button
                      key={portion}
                      onClick={() => { setSelectedPortion(portion); setShowPortions(false); }}
                      style={{
                        flex: '0 0 auto',
                        minWidth: '90px',
                        padding: '10px 16px',
                        borderRadius: '12px',
                        background: selectedPortion === portion ? '#FFF0E3' : 'white',
                        border: selectedPortion === portion ? '2px solid #F06A05' : '1px solid #F0E8E0',
                        color: selectedPortion === portion ? '#A23D00' : '#1F140A',
                        fontSize: '13px',
                        fontWeight: selectedPortion === portion ? '600' : '500',
                        cursor: 'pointer',
                        transition: 'all 150ms ease',
                        whiteSpace: 'nowrap'
                      }}
                      aria-pressed={selectedPortion === portion}
                    >
                      {portion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Quantity Selector */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#1F140A', display: 'block', marginBottom: '10px' }}>Quantity</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0', background: '#F5F1ED', borderRadius: '12px', border: '1px solid #E8ECEF', width: 'fit-content' }}>
              <button
                onClick={() => setQuantity(q => Math.max(q - 1, 1))}
                disabled={quantity <= 1}
                style={{
                  width: '48px',
                  height: '48px',
                  border: 'none',
                  background: quantity <= 1 ? 'transparent' : 'white',
                  color: quantity <= 1 ? '#D6DCE2' : '#1F140A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: quantity <= 1 ? 'not-allowed' : 'pointer',
                  borderRadius: '12px 0 0 12px'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </button>
              <span style={{ padding: '0 24px', fontSize: '20px', fontWeight: '700', fontVariantNumeric: 'tabular-nums', color: '#1F140A', minWidth: '40px', textAlign: 'center' }}>
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(q => Math.min(q + 1, 10))}
                disabled={quantity >= 10}
                style={{
                  width: '48px',
                  height: '48px',
                  border: 'none',
                  background: quantity >= 10 ? 'transparent' : 'white',
                  color: quantity >= 10 ? '#D6DCE2' : '#1F140A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: quantity >= 10 ? 'not-allowed' : 'pointer',
                  borderRadius: '0 12px 12px 0'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Special Instructions */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#1F140A', display: 'block', marginBottom: '10px' }}>Special Instructions (Optional)</label>
            <textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="Less spicy, extra rice, no onions..."
              style={{
                width: '100%',
                minHeight: '80px',
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid #F0E8E0',
                background: 'white',
                fontFamily: 'inherit',
                fontSize: '13px',
                lineHeight: '20px',
                color: '#1F140A',
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              aria-label="Special instructions"
            />
          </div>

          {/* Price Breakdown */}
          <div style={{ padding: '16px', background: '#F8F9FA', borderRadius: '16px', border: '1px solid #F0E8E0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', color: '#7A6658' }}>{item.name} × {quantity}</span>
              <span style={{ fontSize: '13px', fontWeight: '500', color: '#1F140A' }}>₹{item.price * quantity}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: '#7A6658' }}>
              <span>Packing charges</span>
              <span>₹5</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: '#7A6658' }}>
              <span>Delivery fee</span>
              <span>₹0 <span style={{ color: '#007A55', fontWeight: '500' }}>(Free)</span></span>
            </div>
            <div style={{ height: '1px', background: '#F0E8E0', margin: '10px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: '700', color: '#1F140A' }}>
              <span>Total</span>
              <span>₹{item.price * quantity + 5}</span>
            </div>
          </div>
        </div>

        {/* Sticky Action Bar */}
        <div style={{
          padding: '16px 20px',
          background: 'white',
          borderTop: '1px solid #F0E8E0',
          display: 'flex',
          gap: '12px'
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
              transition: 'all 150ms ease'
            }}
          >
            Edit Order
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 2,
              height: '52px',
              borderRadius: '14px',
              background: '#F06A05',
              color: 'white',
              border: 'none',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(240,106,5,0.35)',
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

export default QuickOrderModalVariantA;