// Splash Onboarding - Variant C: Density Variation (Compact)
// More information visible, tighter spacing - tradeoff: more visible data vs easier scanning
// Optimized for quick decisions with minimal scrolling

import React, { useEffect, useState } from 'react';
import { ONBOARDING_STEPS, MOCK_USER, MOCK_VENDORS } from '../data/fixtures';

export function SplashOnboardingVariantC() {
  const [stepIndex, setStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<{ [key: number]: boolean }>({});
  const [progress] = useState(75); // compact shows more progress visually

  useEffect(() => {
    const timer = setTimeout(() => setCompletedSteps(prev => ({ ...prev, [stepIndex]: true })), 1500);
    return () => clearTimeout(timer);
  }, [stepIndex]);

  const steps = ONBOARDING_STEPS;

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      maxWidth: '375px',
      height: '100dvh',
      minHeight: '640px',
      margin: '0 auto',
      overflowY: 'auto',
      background: 'linear-gradient(180deg, #FFFFFF 0%, #FFF8F2 100%)',
      fontFamily: 'Plus Jakarta Sans, sans-serif',
    }}>
      {/* Ultra-compact hero header */}
      <div style={{
        padding: '16px',
        background: '#F06A05',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Ambient dot pattern */}
        <div style={{
          position: 'absolute',
          top: -40,
          right: -40,
          width: '80px',
          height: '80px',
          borderRadius: '40px',
          background: 'rgba(255,255,255,0.2)',
          filter: 'blur(20px)',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ margin: '0 0 4px', fontSize: '24px', fontWeight: '800', color: '#1F140A' }}>Yemunnai</h1>
          <p style={{ margin: '0', fontSize: '11px', color: '#FFF8F2', fontWeight: '500' }}>Campus Food Delivery</p>
        </div>

        {/* Compact progress indicator */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'rgba(255,255,255,0.3)',
          borderRadius: '2px',
        }}>
          <div style={{
            width: `${Math.round(progress / steps.length * (stepIndex + 1))}%`,
            height: '4px',
            background: 'rgba(255,255,255,0.9)',
            borderRadius: '2px',
            transition: 'width 250ms ease',
          }} />
        </div>
      </div>

      {/* Compact step cards - more visible per screen */}
      <div style={{ padding: '16px' }}>
        {steps.map((step, index) => {
          const done = completedSteps[index];
          return (
            <div key={step.title} style={{
              padding: '12px',
              background: '#FFFFFF',
              borderRadius: '12px',
              border: `1px solid ${done ? '#007A55' : '#F0E8E0'}`,
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: done ? '0 2px 8px rgba(0,122,85,0.12)' : 'none',
              transition: 'all 150ms ease',
            }}>
              {/* Completion status */}
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: done ? '#E6F5ED' : '#FFF8F2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={done ? '#007A55' : '#F0E8E0'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>

              {/* Step content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: '700', color: '#1F140A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{step.title}</h4>
                <p style={{ margin: '0', fontSize: '10px', color: '#7A6658', lineHeight: '1.4', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{step.description}</p>
              </div>

              {/* Quick stat */}
              <div style={{ flexShrink: 0, width: '44px', textAlign: 'right' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#F06A05' }}>
                  {done ? '✓' : vendorStats[index]}
                </span>
                <span style={{ fontSize: '8px', color: '#D6DCE2', marginTop: '2px', display: 'block' }}>{done ? 'done' : ''}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Inline action buttons */}
      <div style={{
        padding: '16px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '8px',
      }}>
        <button style={{
          padding: '10px 14px',
          borderRadius: '10px',
          background: '#FFFFFF',
          border: '1px solid #F0E8E0',
          color: '#F06A05',
          fontSize: '11px',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 150ms ease',
          whiteSpace: 'nowrap',
        }} onClick={() => { setStepIndex((stepIndex + 1) % steps.length); setCompletedSteps({}); }}>
          Skip
        </button>
        <button style={{
          padding: '10px 14px',
          borderRadius: '10px',
          background: '#F06A05',
          color: 'white',
          border: 'none',
          fontSize: '11px',
          fontWeight: '700',
          cursor: 'pointer',
          transition: 'all 150ms ease',
          whiteSpace: 'nowrap',
          boxShadow: '0 2px 8px rgba(240,106,5,0.3)',
        }} onClick={() => setStepIndex((stepIndex + 1) % steps.length)}>
          {stepIndex === steps.length - 1 ? 'Done' : 'Next →'}
        </button>
      </div>
    </div>
  );
}

const vendorStats = ['48+', '60+', '30+', '200+'];

export default SplashOnboardingVariantC;