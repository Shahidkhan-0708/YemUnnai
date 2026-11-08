// Splash Onboarding - Variant B: Layout Model Exploration
// List-based layout with expandable vendor sections, horizontal category scroll tabs
// Inspired by Zomato: category tabs below hero, vertical step cards below each step

import { useEffect, useState } from 'react';
import { ONBOARDING_STEPS, MOCK_USER } from '../data/fixtures';

export function SplashOnboardingVariantB() {
  const [currentStep, setCurrentStep] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [activeVendor, setActiveVendor] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showPanels, setShowPanels] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setCurrentStep(1), 3000);
    return () => clearTimeout(timer);
  }, []);

  const steps = ONBOARDING_STEPS;

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      maxWidth: '375px',
      height: '100dvh',
      minHeight: '640px',
      margin: '0 auto',
      overflowX: 'hidden',
      overflowY: 'auto',
      background: 'linear-gradient(180deg, #FFFFFF 0%, #F8F9FA 100%)',
      fontFamily: 'Plus Jakarta Sans, sans-serif',
    }}>
      {/* Hero with category tabs */}
      <div style={{
        position: 'relative',
        height: '180px',
        marginBottom: '20px',
        borderRadius: '24px 24px 0 0',
        background: 'linear-gradient(180deg, #F06A05 0%, #E0520C 100%)',
        overflow: 'hidden',
      }}>
        {/* Category scroll tabs */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          display: 'flex',
          gap: '2px',
          padding: '8px 12px',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}>
          <span
            style={{
              padding: '10px 16px',
              borderRadius: '12px',
              background: currentStep === 0 ? 'rgba(255,255,255,0.3)' : 'transparent',
              color: currentStep === 0 ? '#1F140A' : 'rgba(255,255,255,0.5)',
              fontSize: '12px',
              fontWeight: '600',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              transition: 'all 200ms ease',
            }}
            onClick={() => setCurrentStep(0)}
          >
            Discover
          </span>
          <span
            style={{
              padding: '10px 16px',
              borderRadius: '12px',
              background: currentStep === 1 ? 'rgba(255,255,255,0.3)' : 'transparent',
              color: currentStep === 1 ? '#1F140A' : 'rgba(255,255,255,0.5)',
              fontSize: '12px',
              fontWeight: '600',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              transition: 'all 200ms ease',
            }}
            onClick={() => setCurrentStep(1)}
          >
            Order
          </span>
          <span
            style={{
              padding: '10px 16px',
              borderRadius: '12px',
              background: currentStep === 2 ? 'rgba(255,255,255,0.3)' : 'transparent',
              color: currentStep === 2 ? '#1F140A' : 'rgba(255,255,255,0.5)',
              fontSize: '12px',
              fontWeight: '600',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              transition: 'all 200ms ease',
            }}
            onClick={() => setCurrentStep(2)}
          >
            Navigate
          </span>
          <span
            style={{
              padding: '10px 16px',
              borderRadius: '12px',
              background: currentStep === 3 ? 'rgba(255,255,255,0.3)' : 'transparent',
              color: currentStep === 3 ? '#1F140A' : 'rgba(255,255,255,0.5)',
              fontSize: '12px',
              fontWeight: '600',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              transition: 'all 200ms ease',
            }}
            onClick={() => setCurrentStep(3)}
          >
            Save
          </span>
        </div>

        {/* Hero title */}
        <div style={{ position: 'absolute', bottom: '24px', left: '24px', right: '24px' }}>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '800', color: '#1F140A' }}>Find Your Favorite Food</h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#7A6658' }}>
            {currentStep === 0 && 'Discover what\'s nearby •'}
          </p>
        </div>
      </div>

      {/* Step cards in vertical list */}
      <div style={{ marginBottom: '40px' }}>
        {steps.map((step, index) => (
          <div key={step.title} style={{
            marginBottom: '24px',
            opacity: index < currentStep ? 1 : 0.6,
            transform: index < currentStep ? 'translateY(0)' : 'translateY(12px)',
            transition: 'all 250ms cubic-bezier(.23,1,.32,1)',
          }}>
            {/* Step header with icon + vendor count */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '12px',
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: '#FFF8F2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  {index === 0 && <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>}
                  {index === 1 && <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>}
                  {index === 2 && <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>}
                  {index === 3 && <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>}
                </svg>
              </div>

              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: '600', color: '#1F140A' }}>{step.title}</h3>
                <p style={{ margin: '0', fontSize: '11px', color: '#7A6658', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{step.description}</p>
              </div>
            </div>

            {/* Vendor cards with expandable details */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))',
              gap: '12px',
            }}>
              {[MOCK_VENDORS[0], MOCK_VENDORS[2], MOCK_VENDORS[4]].map((vendor, _vi) => (
                <div key={vendor.id} style={{
                  padding: '12px',
                  background: '#FFFFFF',
                  borderRadius: '14px',
                  border: '1px solid #F0E8E0',
                  boxShadow: '0 2px 8px rgba(31,20,10,0.08)',
                  transition: 'all 150ms ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#F06A05'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(240,106,5,0.15)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#F0E8E0'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(31,20,10,0.08)'; }}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#F5F1ED', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="6" width="20" height="12" rx="2" ry="2"/><line x1="6" y2="6" x2="6" y1="18"/><line x1="14" y2="6" x2="14" y1="18"/>
                    </svg>
                  </div>
                  <div style={{ fontSize: '10px', fontWeight: '600', color: '#1F140A', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{vendor.name}</div>
                  <div style={{ fontSize: '10px', color: '#7A6658', marginTop: '2px' }}>{vendor.walkTime}</div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Expandable details panel */}
        {showPanels && currentStep >= 0 && (
          <div style={{
            background: '#F0E8E0',
            borderRadius: '16px',
            padding: '16px 20px',
            marginTop: '12px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
          }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', color: '#7A6658', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Steps Completed</label>
              <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#1F140A' }}>Swipe to complete all 4 steps</p>
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', color: '#7A6658', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Your Profile</label>
              <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#1F140A' }}>{MOCK_USER.name}</p>
            </div>
          </div>
        )}
      </div>

      {/* CTA */}
      <div style={{
        position: 'absolute',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
      }}>
        <button style={{
          padding: '12px 24px',
          borderRadius: '12px',
          background: '#F06A05',
          color: 'white',
          border: 'none',
          fontSize: '13px',
          fontWeight: '600',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          transition: 'all 150ms ease',
        }}>
          {currentStep === 3 ? 'All Set!' : 'Continue →'}
        </button>
      </div>
    </div>
  );
}

export default SplashOnboardingVariantB;