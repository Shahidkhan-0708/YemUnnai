import React from 'react';

export interface PremiumAssetSlotProps {
  emoji?: string;
  image?: string;
  alt?: string;
  bgGradient?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const PremiumAssetSlot: React.FC<PremiumAssetSlotProps> = ({
  emoji = '🍲',
  image,
  alt = 'Food Graphic',
  bgGradient = 'from-orange-400 to-orange-500',
  className = '',
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'w-16 h-16 p-2 rounded-xl',
    md: 'w-20 h-20 sm:w-24 sm:h-24 p-2.5 rounded-2xl',
    lg: 'w-28 h-28 p-3 rounded-2xl'
  }[size];

  const iconSizes = {
    sm: 'text-2xl',
    md: 'text-3xl sm:text-4xl',
    lg: 'text-4xl sm:text-5xl'
  }[size];

  return (
    <div 
      className={`relative bg-gradient-to-br ${bgGradient} ${sizeClasses} shadow-md flex items-center justify-center overflow-hidden group active:scale-95 transition-transform duration-150 flex-shrink-0 ${className}`}
    >
      {/* Dynamic Background Polish Polish Effect */}
      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      
      {/* Sleek, Continuous Uniform Internal Frame Mask (Smooth rounded curves, zero diagonal sub-corners) */}
      <div className="w-full h-full border border-white/25 rounded-xl flex items-center justify-center bg-white/15 backdrop-blur-xs p-1 shadow-inner">
        {image ? (
          <img 
            src={image} 
            alt={alt} 
            className="w-12 h-12 object-contain filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.15)] transform group-hover:scale-105 transition-transform duration-200"
            onError={(e) => {
              const target = e.currentTarget;
              target.style.display = 'none';
              if (target.parentElement) {
                target.parentElement.innerHTML = `<span class="${iconSizes} filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.15)] select-none">${emoji}</span>`;
              }
            }}
          />
        ) : (
          <span className={`${iconSizes} filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.15)] transform group-hover:scale-105 transition-transform duration-200 select-none`}>
            {emoji}
          </span>
        )}
      </div>
    </div>
  );
};

export default PremiumAssetSlot;
