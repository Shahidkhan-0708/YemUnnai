// Splash Onboarding - Variant A: Information Hierarchy Focus
// Hero value prop, four onboarding steps with clear hierarchy, minimal noise
// Inspired by Swiggy: bold hero, clean step indicators

import React, { useEffect, useState } from 'react';
import { ONBOARDING_STEPS, MOCK_USER, MOCK_VENDORS } from '../data/fixtures';

export function SplashOnboardingVariantA() {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => Math.min(prev + 5, 100));
    }, 200);
    return () => clearInterval(interval);
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
      overflow: 'hidden',
      background: 'linear-gradient(180deg, #FFF8F2 0%, #FFF3E8 100%)',
      fontFamily: 'Plus Jakarta Sans, sans-serif',
    }}>
      {/* Animated progress bar */}
      <style>{`
        @keyframes progressFill { from { width: 0%; } to { width: 100%; } }
        .progress-bar-bg { position: absolute; bottom: 0; left: 0; right: 0; height: 6px; background: transparent; }
        .progress-fill { height: 6px; background: linear-gradient(90deg, #F06A05, #E0520C); borderRadius: 3px; animation: progressFill 1.2s ease-out forwards; }
      `}</style>
      <div className="progress-bar-bg">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Logo area */}
      <div style={{ paddingTop: '60px', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '72px',
          height: '72px',
          borderRadius: '20px',
          background: '#F06A05',
          boxShadow: '0 6px 20px rgba(240,106,5,0.3)',
          marginBottom: '16px',
          animation: 'pulseLogo 2s ease-in-out infinite',
        }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 7l3 3v12l3-3 3 3 3-3 3 3V7l-3-3-3 3-3-3-3 3-3-3V7l3 3z"/>
            <path d="M9 14l-3 4"/>
            <path d="M15 14l3 4"/>
          </svg>
        </div>
        <h1 style={{ margin: '0 0 6px', fontSize: '28px', fontWeight: '800', color: '#1F140A', letterSpacing: '-0.5px' }}>Yemunnai</h1>
        <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#7A6658' }}>Nearby Food, Zero Friction</p>
      </div>

      {/* Swipeable onboarding card */}
      <div style={{
        position: 'relative',
        transform: `translateX(-${currentStep * 100}%)`,
        transition: 'transform 300ms cubic-bezier(.23,1,.32,1)',
        paddingBottom: '60px',
      }}>
        {steps.map((step, index) => (
          <div key={step.title} style={{
            flex: 1,
            padding: '32px 24px',
            opacity: index === currentStep ? 1 : 0,
            pointerEvents: index === currentStep ? 'auto' : 'none',
            transform: index === currentStep ? 'scale(1)' : 'scale(0.95)',
            transition: index < currentStep ? `all 250ms cubic-bezier(.23,1,.32,1)` : `0s cubic-bezier(.23,1,.32,1)`,
          }}>
            {/* Step indicator */}
            {index > 0 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '20px',
              }}>
                {steps.slice(0, index).map((_, si) => (
                  <div key={si} style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '3px',
                    background: si < currentStep ? '#F06A05' : '#D6DCE2',
                    transition: 'all 200ms ease',
                  }} />
                ))}
              </div>
            )}

            {/* Icon */}
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#FFF0E3',
              color: '#F06A05',
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                {index === 0 && <><path d="M12 2C8 2 5 5 5 9c0 3 2 5 5 5h4c3 0 5-2 5-5 0-4-3-7-7-7z"/><polyline points="12 16 9 19 6 16"/></>}
                {index === 1 && <><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/><polyline points="12 16 12 12 16 8"/></>}
                {index === 2 && <><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/><line x1="12" y1="13" x2="12" y2="22"/></>}
                {index === 3 && <><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.24l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></>}
              </svg>
            </div>

            <h2 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: '700', color: '#1F140A' }}>{step.title}</h2>
            <p style={{ margin: '0 0 20px', fontSize: '14px', lineHeight: '1.5', color: '#7A6658' }}>{step.description}</p>

            {/* Quick statistic */}
            <div style={{ marginTop: '12px', padding: '10px 14px', background: '#FFF8F2', borderRadius: '12px', border: '1px solid #F0E8E0' }}>
              <span style={{ fontSize: '11px', fontWeight: '600', color: '#7A6658' }}>{vendorNames[index]} near you</span>
              <span style={{ fontSize: '18px', fontWeight: '700', color: '#F06A05', marginLeft: '4px' }}>{ratings[index]}% Happy</span>
            </div>
          </div>
        ))}

        {/* Divider for last step */}
        {currentStep === steps.length - 1 && (
          <div style={{
            position: 'absolute',
            top: '32px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '3px',
            height: '3px',
            borderRadius: '2px',
            background: '#D6DCE2',
          }} />
        )}
      </div>

      {/* CTA Button */}
      <div style={{ position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)', width: '100%' }}>
        <button style={{
          width: '100%',
          padding: '14px',
          borderRadius: '14px',
          background: '#F06A05',
          color: 'white',
          border: 'none',
          fontSize: '15px',
          fontWeight: '700',
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(240,106,5,0.35)',
          transition: 'all 200ms ease',
        }} onClick={() => { setCurrentStep(currentStep + 1); setProgress(0); }}>
          Get Started →
        </button>
      </div>
    </div>
  );
}

const vendorNames = ['2+ canteens', '5+ canteens', 'Walk-in supported', '250+ saved items'];
const ratings = [92, 94, 91, 88];

export default SplashOnboardingVariantA;
