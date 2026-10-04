import React, { useEffect, useRef } from 'react';
import { playSuccessChime, playTapSound } from '../lib/celebration';

interface BrandIntroSplashProps {
  onStart: () => void;
  onSkip?: () => void;
  onVendorPortal?: () => void;
}

/**
 * Brand Intro Splash Screen — 9:16 pure mascot logo animation.
 * Plays the YEMUNNAI logo and current discovery tagline in 9:16 ratio,
 * auto-advancing into the app on completion with zero visual clutter.
 */
export const BrandIntroSplash: React.FC<BrandIntroSplashProps> = ({
  onStart,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const entered = useRef(false);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay handled
      });
    }

  }, []);

  const handleEnter = () => {
    if (entered.current) return;
    entered.current = true;
    playSuccessChime();
    playTapSound();
    onStart();
  };

  return (
    <div
      onClick={handleEnter}
      onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); handleEnter(); } }}
      role="button"
      tabIndex={0}
      aria-label="Enter YEMUNNAI"
      className="brand-intro fixed inset-0 z-50 flex items-center justify-center bg-[#F06A05] select-none p-0 cursor-pointer"
    >
      {/* 9:16 Aspect Ratio Viewport */}
      <div className="relative w-full h-full overflow-hidden bg-[#F06A05] flex items-center justify-center">
        <video
          ref={videoRef}
          src="/videos/yemunnai_intro_discovery.mp4"
          autoPlay
          muted
          playsInline
          onEnded={handleEnter}
          onError={handleEnter}
          className="w-full h-full" poster="/videos/preview_intro_discovery.webp"
        />
        
        {/* Subtle skip prompt */}
        <div className="absolute bottom-5 z-20 text-[10px] font-bold text-white/50 tracking-widest uppercase pointer-events-none">
          Tap anywhere to continue
        </div>
      </div>
    </div>
  );
};

export default BrandIntroSplash;
