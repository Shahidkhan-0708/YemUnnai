// Splash Onboarding - Variant D: Interaction Model
// Bottom sheet drawer with progressive disclosure, expandable sections
// Inspired by Toing: drawers slide from bottom, reveal more as user interacts

import { useEffect, useState } from 'react';
import { ONBOARDING_STEPS } from '../data/fixtures';

export function SplashOnboardingVariantD() {
  const [stepIndex, setStepIndex] = useState(0);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [drawerY, setDrawerY] = useState(0);
  const [velocity, setVelocity] = useState(0);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setStepIndex(1), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      setDragging(true);
      setVelocity(0);
      setDrawerY(e.touches[0].clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!dragging) return;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const delta = e.touches[0].clientY - drawerY;
      setVelocity(delta);
      setDrawerY(drawerY + delta);
    };

    const handleTouchEnd = () => {
      setDragging(false);
      const shouldExpand = velocity > 60 || drawerY > 300;
      if (shouldExpand) {
        setExpandedStep(stepIndex);
      }
      // Snap to positions
      const snapTo = stepIndex === 0 ? 0 : expandedStep === stepIndex ? 300 : -100;
      setTimeout(() => setDrawerY(snapTo), 100);
    };

    const handleMouseDown = (e: MouseEvent) => {
      setDragging(true);
      setVelocity(0);
      setDrawerY(e.clientY);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging) return;
      const delta = e.clientY - drawerY;
      setVelocity(delta);
      setDrawerY(drawerY + delta);
    };

    const handleMouseUp = () => {
      setDragging(false);
      const shouldExpand = velocity > 50 || drawerY > 250;
      setExpandedStep(shouldExpand ? stepIndex : null);
      setTimeout(() => setDrawerY(-100), 100);
    };

    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    // Intentionally not including dragging, drawerY, velocity in deps - they are read
    // synchronously during drag events for proper gesture handling
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex, expandedStep]);

  const steps = ONBOARDING_STEPS;

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      maxWidth: '375px',
      height: '100dvh',
      minHeight: '640px',
      margin: '0 auto',
      overflow: 'hidden',
      fontFamily: 'Plus Jakarta Sans, sans-serif',
    }}>
      {/* Ambient background blobs */}
      <div style={{
        position: 'absolute',
        top: -50,
        left: -50,
        width: '200px',
        height: '200px',
        borderRadius: '50%',
        background: 'rgba(240,106,5,0.15)',
        filter: 'blur(60px)',
      }} />
      <div style={{
        position: 'absolute',
        bottom: -30,
        right: -30,
        width: '150px',
        height: '150px',
        borderRadius: '50%',
        background: 'rgba(240,106,5,0.1)',
        filter: 'blur(40px)',
      }} />

      {/* Scrollable content */}
      <div style={{
        height: '85vh',
        padding: '30px 16px 20px',
        overflowY: 'auto',
      }}>

        {/* Step cards with progressive disclosure */}
        {steps.map((step, index) => {
          const isExpanded = expandedStep === index;
          const drawerHeight = isExpanded ? '520px' : '80px';

          return (
            <div key={step.title} style={{
              marginBottom: '20px',
              opacity: index <= stepIndex ? 1 : 0.4,
              transform: index <= stepIndex ? 'translateY(0)' : 'translateY(12px)',
              transition: 'all 250ms cubic-bezier(.23,1,.32,1)',
            }}>
              {/* Step header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#1F140A' }}>{step.title}</h3>
                <button
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    background: isExpanded ? '#F0F1ED' : '#FFF',
                    border: `1px solid ${isExpanded ? '#F0E8E0' : '#F06A05'}`,
                    color: isExpanded ? '#7A6658' : '#F06A05',
                    fontSize: '10px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 150ms ease',
                  }}
                  onClick={() => setExpandedStep(prev => prev === index ? null : index)}
                >
                  {isExpanded ? 'Collapse' : 'Learn more'}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    {isExpanded && <polyline points="6 9 12 15 18 9"/>}
                  </svg>
                </button>
              </div>

              {/* Drawer content or quick view */}
              <div style={{
                height: drawerHeight,
                background: '#FFFFFF',
                borderRadius: '16px 16px 0 0',
                border: '1px solid #F0E8E0',
                borderTop: 'none',
                overflow: 'hidden',
                boxShadow: '0 -4px 20px rgba(31,20,10,0.1)',
                transition: 'height 250ms ease',
              }}>
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  {/* Scrollable description */}
                  <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
                    <p style={{ margin: '0 0 12px', fontSize: '11px', color: '#7A6658', lineHeight: '1.5' }}>
                      {step.description}
                    </p>

                    {/* Actionable items */}
                    {index === 0 && (
                      <div style={{ marginTop: '8px' }}>
                        <button style={{
                          width: '100%', padding: '8px',
                          borderRadius: '10px', background: '#F06A05', color: 'white',
                          border: 'none', fontSize: '11px', fontWeight: '600', marginBottom: '4px',
                        }}>Discover nearby canteens</button>
                        <button style={{
                          width: '100%', padding: '8px',
                          borderRadius: '10px', background: 'transparent', border: '1px solid #F06A05', color: '#F06A05', fontSize: '11px', fontWeight: '600',
                        }}>Open MITS Canteen</button>
                      </div>
                    )}
                    {index === 1 && (
                      <div style={{ marginTop: '8px' }}>
                        <button style={{
                          width: '100%', padding: '8px',
                          borderRadius: '10px', background: '#F06A05', color: 'white',
                          border: 'none', fontSize: '11px', fontWeight: '600', marginBottom: '4px',
                        }}>Place quick order</button>
                        <button style={{
                          width: '100%', padding: '8px',
                          borderRadius: '10px', background: 'transparent', border: '1px solid #F06A05', color: '#F06A05', fontSize: '11px', fontWeight: '600',
                        }}>Order Masala Dosa</button>
                      </div>
                    )}
                    {index === 2 && (
                      <div style={{ marginTop: '8px' }}>
                        <button style={{
                          width: '100%', padding: '8px',
                          borderRadius: '10px', background: '#F06A05', color: 'white',
                          border: 'none', fontSize: '11px', fontWeight: '600', marginBottom: '4px',
                        }}>Navigate to ACS Cafe</button>
                        <button style={{
                          width: '100%', padding: '8px',
                          borderRadius: '10px', background: 'transparent', border: '1px solid #F06A05', color: '#F06A05', fontSize: '11px', fontWeight: '600',
                        }}>3 min walk</button>
                      </div>
                    )}
                    {index === 3 && (
                      <div style={{ marginTop: '8px' }}>
                        <button style={{
                          width: '100%', padding: '8px',
                          borderRadius: '10px', background: '#F06A05', color: 'white',
                          border: 'none', fontSize: '11px', fontWeight: '600', marginBottom: '4px',
                        }}>Save as favorite</button>
                        <button style={{
                          width: '100%', padding: '8px',
                          borderRadius: '10px', background: 'transparent', border: '1px solid #F06A05', color: '#F06A05', fontSize: '11px', fontWeight: '600',
                        }}>Save Samosa</button>
                      </div>
                    )}
                  </div>

                  {/* Bottom action bar in expanded view */}
                  {isExpanded && (
                    <div style={{
                      padding: '12px 16px',
                      background: '#F8F9FA',
                      borderTop: '1px solid #F0E8E0',
                      marginTop: 'auto',
                    }}>
                      <button style={{
                        flex: 1, padding: '8px',
                        borderRadius: '10px', background: '#F06A05', color: 'white',
                        border: 'none', fontSize: '11px', fontWeight: '600', marginRight: '8px',
                      }}>
                        Continue
                      </button>
                      <button style={{
                        flex: 1, padding: '8px',
                        borderRadius: '10px', background: 'white', border: '1px solid #F06A05', color: '#F06A05', fontSize: '11px', fontWeight: '600',
                      }}>
                        Skip
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Initial swipe hint */}
        {!dragging && stepIndex === 0 && (
          <div style={{
            position: 'absolute',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: '#7A6658',
            fontSize: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
            <span>Swipe up to explore</span>
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div style={{
        position: 'absolute',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
      }}>
        <button style={{
          padding: '12px 24px',
          borderRadius: '14px',
          background: '#F06A05',
          color: 'white',
          border: 'none',
          fontSize: '13px',
          fontWeight: '700',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          transition: 'all 150ms ease',
        }}>
          {stepIndex === steps.length - 1 ? 'Get Started' : 'Continue →'}
        </button>
      </div>
    </div>
  );
}

export default SplashOnboardingVariantD;