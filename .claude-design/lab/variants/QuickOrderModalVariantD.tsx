// Quick Order Modal - Variant D: Interaction Model
// Stepper/Progressive Disclosure Pattern - guided flow with clear steps
// Toing-inspired: step-by-step wizard, contextual actions, animated transitions

import { useState } from 'react';
import { MOCK_FOOD_ITEMS, MOCK_VENDORS } from '../data/fixtures';

const item = MOCK_FOOD_ITEMS[0];
const vendor = MOCK_VENDORS.find(v => v.id === item.vendorId)!;
const dietary = item.dietary;

const steps = [
  { id: 'item', label: 'Item', icon: 'item' },
  { id: 'options', label: 'Options', icon: 'options' },
  { id: 'confirm', label: 'Confirm', icon: 'confirm' }
];

export function QuickOrderModalVariantD({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedPortion, setSelectedPortion] = useState(item.portionSizes?.[0] || 'Regular');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);

  const currentStepData = steps[currentStep];
  const canGoNext = currentStep < steps.length - 1;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const isLastStep = currentStep === steps.length - 1;

  const goNext = () => {
    if (canGoNext && !isAnimating) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        setIsAnimating(false);
      }, 200);
    }
  };

  const goBack = () => {
    if (currentStep > 0 && !isAnimating) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(prev => prev - 1);
        setIsAnimating(false);
      }, 200);
    }
  };

  const handleConfirm = () => {
    onConfirm();
  };

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
        @keyframes stepEnter { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes stepExit { from { opacity: 1; transform: translateX(0); } to { opacity: 0; transform: translateX(-20px); } }
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
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Progress Indicator */}
        <div style={{
          padding: '16px 20px 8px',
          borderBottom: '1px solid #F0E8E0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1F140A' }}>
              {currentStepData.label}
            </h2>
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

          {/* Step Progress Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
            {steps.map((step, idx) => (
              <div key={step.id} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <div style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: '4px'
                }}>
                  {/* Connecting Line */}
                  {idx < steps.length - 1 && (
                    <div style={{
                      position: 'absolute',
                      top: '11px',
                      left: '50%',
                      right: '-50%',
                      height: '2px',
                      background: idx < currentStep ? '#F06A05' : '#F0E8E0',
                      zIndex: 0
                    }} />
                  )}

                  {/* Step Circle */}
                  <div style={{
                    position: 'relative',
                    zIndex: 1,
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: idx <= currentStep ? '#F06A05' : 'white',
                    border: idx <= currentStep ? 'none' : '2px solid #F0E8E0',
                    color: idx <= currentStep ? 'white' : '#D6DCE2',
                    fontSize: '11px',
                    fontWeight: '600',
                    transition: 'all 200ms cubic-bezier(.23,1,.32,1)'
                  }}>
                    {idx < currentStep && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </div>

                  {/* Step Label */}
                  <span style={{
                    fontSize: '10px',
                    fontWeight: idx === currentStep ? '600' : '500',
                    color: idx <= currentStep ? '#F06A05' : '#7A6658',
                    whiteSpace: 'nowrap',
                    textAlign: 'center'
                  }}>
                    {step.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content - Animated */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          position: 'relative'
        }}>
          {/* Step 1: Item Selection */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              opacity: currentStep === 0 ? 1 : 0,
              pointerEvents: currentStep === 0 ? 'auto' : 'none',
              transform: currentStep === 0 ? 'translateX(0)' : currentStep > 0 ? 'translateX(-30px)' : 'translateX(30px)',
              transition: 'all 300ms cubic-bezier(.23,1,.32,1)',
              padding: '20px',
              paddingBottom: '100px'
            }}
            aria-hidden={currentStep !== 0}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Item Card */}
              <div style={{
                display: 'flex',
                gap: '14px',
                padding: '16px',
                background: '#F8F9FA',
                borderRadius: '20px',
                border: '1px solid #F0E8E0'
              }}>
                <div style={{
                  position: 'relative',
                  width: '72px',
                  height: '72px',
                  borderRadius: '14px',
                  flexShrink: 0,
                  overflow: 'hidden',
                  background: dietary === 'veg' ? '#E6F5ED' : dietary === 'nonveg' ? '#FCEAE4' : '#F5F1ED'
                }}>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={dietary === 'veg' ? '#007A55' : '#F06A05'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                    </svg>
                  </div>
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
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="#C87809">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                      {item.rating.toFixed(1)}
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '20px', fontWeight: '700', fontVariantNumeric: 'tabular-nums', color: '#1F140A' }}>₹{item.price}</div>
                </div>
              </div>

              {/* Quantity Selector */}
              <div style={{ padding: '16px', background: 'white', borderRadius: '16px', border: '1px solid #F0E8E0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '600', color: '#1F140A' }}>Quantity</label>
                  <span style={{ fontSize: '12px', color: '#7A6658' }}>Max 10</span>
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

              {/* Quick Action */}
              <button
                onClick={goNext}
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
                Continue to Options
              </button>
            </div>
          </div>

          {/* Step 2: Options */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              opacity: currentStep === 1 ? 1 : 0,
              pointerEvents: currentStep === 1 ? 'auto' : 'none',
              transform: currentStep === 1 ? 'translateX(0)' : currentStep < 1 ? 'translateX(30px)' : 'translateX(-30px)',
              transition: 'all 300ms cubic-bezier(.23,1,.32,1)',
              padding: '20px',
              paddingBottom: '100px'
            }}
            aria-hidden={currentStep !== 1}
          >
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

              {/* Customization */}
              <div>
                <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: '#1F140A' }}>Customize</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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

              {/* Navigation */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button
                  onClick={goBack}
                  style={{
                    flex: 1,
                    padding: '14px',
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
                  Back
                </button>
                <button
                  onClick={goNext}
                  style={{
                    flex: 1,
                    padding: '14px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #F06A05 0%, #E05C00 100%)',
                    color: 'white',
                    border: 'none',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(240,106,5,0.4)',
                    transition: 'all 150ms ease'
                  }}
                >
                  Review Order
                </button>
              </div>
            </div>
          </div>

          {/* Step 3: Confirm */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              opacity: currentStep === 2 ? 1 : 0,
              pointerEvents: currentStep === 2 ? 'auto' : 'none',
              transform: currentStep === 2 ? 'translateX(0)' : currentStep < 2 ? 'translateX(30px)' : 'translateX(-30px)',
              transition: 'all 300ms cubic-bezier(.23,1,.32,1)',
              padding: '20px',
              paddingBottom: '100px'
            }}
            aria-hidden={currentStep !== 2}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Order Summary */}
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

              {/* Final Actions */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={goBack}
                  style={{
                    flex: 1,
                    padding: '16px',
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
                  Edit Options
                </button>
                <button
                  onClick={handleConfirm}
                  style={{
                    flex: 2,
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuickOrderModalVariantD;