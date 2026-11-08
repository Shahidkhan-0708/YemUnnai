// Quick Order Modal - Variant B: Layout Model Exploration
// Card-based layout with horizontal swipeable sections, persistent summary sidebar
// Zomato-style: segmented sections, visual cards, sticky price summary

import { useState } from 'react';
import { MOCK_FOOD_ITEMS, MOCK_VENDORS } from '../data/fixtures';

const item = MOCK_FOOD_ITEMS[0];
const vendor = MOCK_VENDORS.find(v => v.id === item.vendorId)!;
const dietary = item.dietary;

export function QuickOrderModalVariantB({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) {
  const [quantity, setQuantity] = useState(1);
  const [selectedPortion, setSelectedPortion] = useState(item.portionSizes?.[0] || 'Regular');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [activeSection, setActiveSection] = useState<'item' | 'options' | 'summary'>('item');

  const sections = [
    { id: 'item', label: 'Item', icon: 'item' },
    { id: 'options', label: 'Options', icon: 'options' },
    { id: 'summary', label: 'Summary', icon: 'summary' }
  ];

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

        {/* Section Tabs - Sticky */}
        <div style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          display: 'flex',
          background: 'white',
          borderBottom: '1px solid #F0E8E0',
          padding: '0 16px'
        }}>
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id as typeof activeSection)}
              style={{
                flex: 1,
                padding: '14px 8px',
                border: 'none',
                background: 'transparent',
                color: activeSection === section.id ? '#F06A05' : '#7A6658',
                fontSize: '12px',
                fontWeight: activeSection === section.id ? '600' : '500',
                cursor: 'pointer',
                position: 'relative',
                transition: 'color 150ms ease'
              }}
              aria-selected={activeSection === section.id}
            >
              {section.label}
              {activeSection === section.id && (
                <div style={{
                  position: 'absolute',
                  bottom: '-1px',
                  left: '25%',
                  right: '25%',
                  height: '3px',
                  borderRadius: '3px 3px 0 0',
                  background: 'linear-gradient(90deg, #F06A05 0%, #FF8618 100%)'
                }} />
              )}
            </button>
          ))}
        </div>

        {/* Close Button - Top Right */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '8px',
            right: '12px',
            zIndex: 20,
            width: '36px',
            height: '36px',
            borderRadius: '10px',
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
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        {/* Section Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 100px' }}>
          {activeSection === 'item' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Item Card - Large Visual */}
              <div style={{
                display: 'flex',
                gap: '16px',
                padding: '16px',
                background: '#F8F9FA',
                borderRadius: '20px',
                border: '1px solid #F0E8E0'
              }}>
                <div style={{
                  position: 'relative',
                  width: '80px',
                  height: '80px',
                  borderRadius: '16px',
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
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={dietary === 'veg' ? '#007A55' : '#F06A05'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                    </svg>
                  </div>
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
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: 'white'
                  }}>
                    <span className="dietary-symbol" style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '10px',
                      height: '10px',
                      border: `1px solid ${dietary === 'veg' ? '#007A55' : dietary === 'nonveg' ? '#B45309' : '#6F6258'}`,
                      borderRadius: '2px',
                      flexShrink: 0
                    }}>
                      {dietary === 'veg' ? <i style={{ width: '4px', height: '4px', background: '#007A55', borderRadius: '50%' }} /> : dietary === 'nonveg' ? <i style={{ width: '0', height: '0', borderLeft: '2.5px solid transparent', borderRight: '2.5px solid transparent', borderBottom: '4px solid #9A3C13' }} /> : <i style={{ width: '4px', height: '4px', background: '#6F6258', borderRadius: '50%' }} />}
                    </span>
                    <span style={{ textTransform: 'capitalize', fontSize: '8px' }}>{dietary}</span>
                  </span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '8px' }}>
                    <div style={{ minWidth: 0 }}>
                      <h3 style={{ margin: '0 0 4px', fontSize: '17px', fontWeight: '600', color: '#1F140A' }}>{item.name}</h3>
                      <p style={{ margin: 0, fontSize: '13px', color: '#7A6658' }}>{vendor.name}</p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '22px', fontWeight: '700', fontVariantNumeric: 'tabular-nums', color: '#1F140A' }}>₹{item.price}</div>
                      <div style={{ fontSize: '12px', color: '#7A6658', marginTop: '2px' }}>× {quantity}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: '#7A6658' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                      </svg>
                      {item.prepTime}
                    </span>
                    <span style={{ color: '#D6DCE2' }}>•</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#C87809' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="#C87809">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                      {item.rating.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quantity Selector Card */}
              <div style={{
                padding: '16px',
                background: 'white',
                borderRadius: '16px',
                border: '1px solid #F0E8E0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '600', color: '#1F140A' }}>Quantity</label>
                  <span style={{ fontSize: '13px', color: '#7A6658' }}>Max 10 per order</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0', background: '#F5F1ED', borderRadius: '14px', border: '1px solid #E8ECEF', width: 'fit-content' }}>
                  <button
                    onClick={() => setQuantity(q => Math.max(q - 1, 1))}
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
                      borderRadius: '14px 0 0 14px'
                    }}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  </button>
                  <span style={{ padding: '0 28px', fontSize: '22px', fontWeight: '700', fontVariantNumeric: 'tabular-nums', color: '#1F140A', minWidth: '48px', textAlign: 'center' }}>
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(q => Math.min(q + 1, 10))}
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
                      borderRadius: '0 14px 14px 0'
                    }}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Quick Add Button */}
              <button style={{
                width: '100%',
                padding: '14px',
                borderRadius: '14px',
                background: '#F06A05',
                color: 'white',
                border: 'none',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(240,106,5,0.35)',
                transition: 'all 150ms ease'
              }}>
                Add to Order
              </button>
            </div>
          )}

          {activeSection === 'options' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Portion Selector */}
              {item.portionSizes && item.portionSizes.length > 1 && (
                <div>
                  <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: '#1F140A' }}>Portion Size</h4>
                  <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '4px' }}>
                    {item.portionSizes.map((portion: string) => (
                      <button
                        key={portion}
                        onClick={() => setSelectedPortion(portion)}
                        style={{
                          flex: '0 0 auto',
                          minWidth: '100px',
                          padding: '14px 20px',
                          borderRadius: '14px',
                          background: selectedPortion === portion ? '#FFF0E3' : 'white',
                          border: selectedPortion === portion ? '2px solid #F06A05' : '1px solid #F0E8E0',
                          color: selectedPortion === portion ? '#A23D00' : '#1F140A',
                          fontSize: '14px',
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
                </div>
              )}

              {/* Customization Options */}
              <div>
                <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: '#1F140A' }}>Customize</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {[
                    { label: 'Spice Level', options: ['Mild', 'Medium', 'Hot', 'Extra Hot'] },
                    { label: 'Rice Type', options: ['Basmati', 'Brown Rice', 'Jeera Rice'] }
                  ].map((custom, idx) => (
                    <div key={idx} style={{ padding: '16px', background: 'white', borderRadius: '14px', border: '1px solid #F0E8E0' }}>
                      <span style={{ fontSize: '13px', fontWeight: '500', color: '#1F140A', display: 'block', marginBottom: '10px' }}>{custom.label}</span>
                      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '4px' }}>
                        {custom.options.map((opt: string) => (
                          <button
                            key={opt}
                            style={{
                              flex: '0 0 auto',
                              padding: '10px 16px',
                              borderRadius: '10px',
                              background: '#F8F9FA',
                              border: '1px solid #F0E8E0',
                              color: '#1F140A',
                              fontSize: '12px',
                              fontWeight: '500',
                              cursor: 'pointer',
                              transition: 'all 150ms ease',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Special Instructions */}
              <div>
                <label style={{ fontSize: '14px', fontWeight: '600', color: '#1F140A', display: 'block', marginBottom: '10px' }}>Special Instructions (Optional)</label>
                <textarea
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="Less spicy, extra rice, no onions..."
                  style={{
                    width: '100%',
                    minHeight: '100px',
                    padding: '14px',
                    borderRadius: '14px',
                    border: '1px solid #F0E8E0',
                    background: 'white',
                    fontFamily: 'inherit',
                    fontSize: '14px',
                    lineHeight: '22px',
                    color: '#1F140A',
                    resize: 'vertical',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          )}

          {activeSection === 'summary' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Order Summary Card */}
              <div style={{ padding: '20px', background: 'white', borderRadius: '16px', border: '1px solid #F0E8E0' }}>
                <h4 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: '600', color: '#1F140A' }}>Order Summary</h4>

                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', padding: '12px', background: '#F8F9FA', borderRadius: '12px', border: '1px solid #F0E8E0' }}>
                  <div style={{
                    position: 'relative',
                    width: '56px',
                    height: '56px',
                    borderRadius: '12px',
                    flexShrink: 0,
                    overflow: 'hidden',
                    background: dietary === 'veg' ? '#E6F5ED' : dietary === 'nonveg' ? '#FCEAE4' : '#F5F1ED'
                  }}>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={dietary === 'veg' ? '#007A55' : '#F06A05'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                      </svg>
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h5 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: '600', color: '#1F140A' }}>{item.name}</h5>
                    <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#7A6658' }}>{selectedPortion} • {vendor.name}</p>
                    <div style={{ fontSize: '11px', color: '#7A6658' }}>
                      {specialInstructions && `Note: ${specialInstructions}`}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '18px', fontWeight: '700', fontVariantNumeric: 'tabular-nums', color: '#1F140A' }}>₹{item.price * quantity}</div>
                    <div style={{ fontSize: '11px', color: '#7A6658', marginTop: '2px' }}>Qty: {quantity}</div>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div style={{ borderTop: '1px solid #F0E8E0', paddingTop: '16px' }}>
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
                  <div style={{ height: '1px', background: '#F0E8E0', margin: '12px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: '700', color: '#1F140A' }}>
                    <span>Total</span>
                    <span>₹{item.price * quantity + 5}</span>
                  </div>
                </div>
              </div>

              {/* Confirm Button */}
              <button
                onClick={onConfirm}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #F06A05 0%, #E05C00 100%)',
                  color: 'white',
                  border: 'none',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(240,106,5,0.4)',
                  transition: 'all 150ms ease'
                }}
              >
                Confirm & Pay ₹{item.price * quantity + 5}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default QuickOrderModalVariantB;