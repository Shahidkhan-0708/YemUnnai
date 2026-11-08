// Splash Onboarding - Variant E: Expressive Direction (Premium)
// Premium brand feel with parallax hero, floating particles, drop-shadows, micro-interactions, confetti
// Brand adjectives: Premium, Trustworthy, Playful, Energetic

import { useEffect, useState } from 'react';
import { ONBOARDING_STEPS } from '../data/fixtures';

export function SplashOnboardingVariantE() {
  const [currentStep, setCurrentStep] = useState(0);
  const [particles, setParticles] = useState<{ x: number; y: number; size: number; speedX: number; speedY: number; color: string }[]>([]);
  const [confetti, setConfetti] = useState<{ x: number; y: number; color: string; speed: number }[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [stepScale, setStepScale] = useState(1);

  const steps = ONBOARDING_STEPS;

  // Generate floating particles on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const p = Array.from({ length: 20 }, () => ({
      // eslint-disable-next-line react-hooks/exhaustive-deps
      x: Math.random() * 375,
      // eslint-disable-next-line react-hooks/exhaustive-deps
      y: Math.random() * 640,
      // eslint-disable-next-line react-hooks/exhaustive-deps
      size: Math.random() * 8 + 4,
      // eslint-disable-next-line react-hooks/exhaustive-deps
      speedX: (Math.random() - 0.5) * 0.5,
      // eslint-disable-next-line react-hooks/exhaustive-deps
      speedY: (Math.random() - 0.5) * 0.5,
      // eslint-disable-next-line react-hooks/exhaustive-deps
      color: ['#F06A05', '#FFF0E3', '#D6DCE2', '#E0520C'][Math.floor(Math.random() * 4)],
    }));
    setParticles(p);

    const animation = requestAnimationFrame(() => {
      // particle loop handled by CSS classes
    });
    return () => cancelAnimationFrame(animation);
  }, []);

  // Confetti explosion on complete
  const triggerConfetti = () => {
    const particles = Array.from({ length: 50 }, () => ({
      x: Math.random() * 300 + 40,
      y: Math.random() * -200,
      color: ['#F06A05', '#E0520C', '#FFF8F2', '#F0F1ED'][Math.floor(Math.random() * 4)],
      speed: Math.random() * 4 + 2,
    }));
    setConfetti(particles);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 1200);
  };

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      maxWidth: '375px',
      height: '100dvh',
      minHeight: '640px',
      margin: '0 auto',
      overflow: 'hidden',
      background: 'linear-gradient(180deg, #FFF8F2 0%, #FDF1E4 100%)',
      fontFamily: 'Plus Jakarta Sans, sans-serif',
    }}>
      {/* Ambient background blobs */}
      <div style={{
        position: 'absolute',
        top: -120,
        left: -80,
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'rgba(240,106,5,0.12)',
        filter: 'blur(60px)',
        transform: 'translateX(-30px)',
        animation: 'floatBlob 8s ease-in-out infinite alternate',
      }} />
      <div style={{
        position: 'absolute',
        bottom: -100,
        right: -100,
        width: '350px',
        height: '350px',
        borderRadius: '50%',
        background: 'rgba(240,106,5,0.08)',
        filter: 'blur(80px)',
        transform: 'translateX(40px)',
        animation: 'floatBlob 10s ease-in-out infinite alternate-reverse',
      }} />
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: '200px',
        height: '200px',
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.4)',
        filter: 'blur(40px)',
        animation: 'floatBlob 6s ease-in-out infinite alternate',
      }} />

      <style>{`
        @keyframes floatBlob { from { transform: translate3d(0,0,0); } to { transform: translate3d(40px, -40px, 0); } }
        @keyframes confettiFall { from { transform: translateY(-100px) rotate(0deg); opacity: 1; } to { transform: translateY(640px) rotate(720deg); opacity: 0; } }
      `}</style>

      {/* Floating particles */}
      {particles.map((p, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: p.x,
          top: p.y,
          width: p.size,
          height: p.size,
          borderRadius: '50%',
          background: p.color,
          opacity: 0.4,
          pointerEvents: 'none',
          animation: `floatParticle ${4 + Math.random() * 4}s ease-in-out infinite alternate-delay-${Math.random() * 2}s`,
        }} />
      ))}

      {/* Confetti */}
      {showConfetti && confetti.map((c, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: c.x,
          top: c.y,
          width: '8px',
          height: '8px',
          background: c.color,
          borderRadius: '2px',
          pointerEvents: 'none',
          animation: `confettiFall ${c.speed}s ease-in forwards`,
        }} />
      ))}

      {/* Hero area with parallax */}
      <div style={{
        padding: '40px 24px',
        textAlign: 'center',
        position: 'relative',
        zIndex: 10,
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '76px',
          height: '76px',
          borderRadius: '22px',
          background: '#F06A05',
          boxShadow: '0 8px 24px rgba(240,106,5,0.35)',
          marginBottom: '20px',
          transform: 'scale(1)',
          transition: 'transform 300ms cubic-bezier(.23,1,.32,1)',
        }}>
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 7l3 3v12l3-3 3 3 3-3 3 3V7l-3-3-3 3-3-3-3 3-3-3V7l3 3z"/>
            <path d="M9 14l-3 4"/>
            <path d="M15 14l3 4"/>
          </svg>
        </div>

        <h1 style={{ margin: '0 0 12px', fontSize: '32px', fontWeight: '800', color: '#1F140A', letterSpacing: '-0.5px' }}>
          Yemunnai
        </h1>
        <p style={{ margin: '0 0 30px', fontSize: '15px', color: '#7A6658', lineHeight: '1.5' }}>
          Campus food, delivered to your doorstep. Discover, order, savor.
        </p>

        {/* Premium hero image placeholder */}
        <div style={{
          position: 'relative',
          width: '100%',
          height: '180px',
          borderRadius: '24px',
          background: 'linear-gradient(135deg, #F06A05 0%, #E0520C 100%)',
          overflow: 'hidden',
          marginBottom: '30px',
          boxShadow: '0 12px 40px rgba(240,106,5,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#1F140A',
          fontSize: '20px',
          fontWeight: '700',
        }}>
          🍲
        </div>
      </div>

      {/* Step indicators */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '8px',
        marginBottom: '40px',
        padding: '0 24px',
      }}>
        {steps.map((_, index) => (
          <div
            key={index}
            style={{
              width: index === currentStep ? '28px' : '10px',
              height: '10px',
              borderRadius: '5px',
              background: index <= currentStep ? '#F06A05' : '#D6DCE2',
              transition: 'all 300ms cubic-bezier(.23,1,.32,1)',
              transform: index === currentStep ? 'scale(1.1)' : 'scale(1)',
              boxShadow: index === currentStep ? '0 0 8px rgba(240,106,5,0.5)' : 'none',
            }}
          />
        ))}
      </div>

      {/* Step card */}
      <div style={{
        padding: '0 24px 20px',
        opacity: 1,
        transform: `scale(${stepScale})`,
        transition: 'all 400ms cubic-bezier(.23,1,.32,1)',
      }}>
        {steps.map((step, index) => (
          <div key={step.title} style={{
            opacity: index === currentStep ? 1 : 0,
            pointerEvents: index === currentStep ? 'auto' : 'none',
            transform: `translateY(${index < currentStep ? 0 : 20}px)`,
            transition: `all ${index < currentStep ? '0ms' : '400ms'} cubic-bezier(.23,1,.32,1)`,
          }}>
            {/* Step icon card */}
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '18px',
              background: '#FFFFFF',
              margin: '0 auto 20px',
              boxShadow: '0 8px 24px rgba(31,20,10,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid transparent',
            }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {index === 0 && <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>}
                {index === 1 && (<><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/><polyline points="12 16 12 12 16 8"/></>)}
                {index === 2 && (<><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/><line x1="12" y1="13" x2="12" y2="22"/></>)}
                {index === 3 && <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.24l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>}
              </svg>
            </div>

            <h2 style={{ margin: '0 0 10px', fontSize: '22px', fontWeight: '700', color: '#1F140A', textAlign: 'center' }}>{step.title}</h2>
            <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#7A6658', lineHeight: '1.6', textAlign: 'center' }}>{step.description}</p>

            {/* Explore button */}
            <button style={{
              width: '100%',
              padding: '16px',
              borderRadius: '16px',
              background: index === currentStep ? '#F06A05' : '#FFFFFF',
              color: index === currentStep ? '#1F140A' : '#F06A05',
              border: index === currentStep ? 'none' : '2px solid #F06A05',
              fontSize: '15px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: index === currentStep ? '0 4px 16px rgba(240,106,5,0.35)' : 'none',
              transition: 'all 200ms cubic-bezier(.23,1,.32,1)',
              onMouseDown: () => setStepScale(0.98),
              onMouseUp: () => setStepScale(1),
              onClick: () => {
                if (index === steps.length - 1) {
                  triggerConfetti();
                }
                setCurrentStep(Math.min(index + 1, steps.length - 1));
              },
            }}>
              {index === steps.length - 1 ? 'Get Started' : 'Explore →'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SplashOnboardingVariantE;