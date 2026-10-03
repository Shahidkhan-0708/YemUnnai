import { SvgScreenFrame } from './SvgScreenFrame';
import React, { useEffect, useRef } from 'react';
import { playSuccessChime, playTapSound } from '../lib/celebration';

interface BrandIntroSplashProps {
  onStart: () => void;
  onSkip?: () => void;
  onVendorPortal?: () => void;
}

/**
 * Brand Intro Splash Screen — 9:16 pure mascot logo animation.
 * Plays the watermark-free YEMUNNAI logo animation seamlessly in 9:16 ratio,
 * auto-advancing into the app on completion with zero visual clutter.
 */
export const BrandIntroSplash: React.FC<BrandIntroSplashProps> = ({
  onStart,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay handled
      });
    }

    // Auto-advance fallback when sleek video duration ends (3.2s)
    const autoAdvanceTimer = setTimeout(() => {
      onStart();
    }, 3300);

    return () => {
      clearTimeout(autoAdvanceTimer);
    };
  }, [onStart]);

  const handleEnter = () => {
    playSuccessChime();
    playTapSound();
    onStart();
  };

  return <SvgScreenFrame screen={'intro'}>(
    <div
      onClick={handleEnter}
      onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); handleEnter(); } }}
      role="button"
      tabIndex={0}
      aria-label="Enter YEMUNNAI"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#F06A05] select-none p-0 cursor-pointer"
    >
      {/* 9:16 Aspect Ratio Viewport */}
      <div className="relative w-full max-w-[400px] min-h-dvh h-full overflow-hidden bg-[#F06A05] flex items-center justify-center">
        <video
          ref={videoRef}
          src="/videos/yemunnai_intro_clean.mp4"
          autoPlay
          muted
          playsInline
          onEnded={handleEnter}
          className="w-full h-dvh object-contain" poster="/videos/preview_intro.png"
        />
        
        {/* Subtle skip prompt */}
        <div className="absolute bottom-5 z-20 text-[10px] font-bold text-white/50 tracking-widest uppercase pointer-events-none">
          Tap anywhere to continue
        </div>
      </div>
    </div>
  )</SvgScreenFrame>;
};

export default BrandIntroSplash;
