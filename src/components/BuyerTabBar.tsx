import React from 'react';
import { Compass, Bookmark, UserRound } from 'lucide-react';
import { useLanguage } from '../lib/language';
import { playTapSound } from '../lib/celebration';

export type BuyerTab = 'discover' | 'saved' | 'profile';

export interface BuyerTabBarProps {
  activeTab: BuyerTab;
  onTabChange?: (tab: BuyerTab) => void;
}

export function BuyerTabBar({ activeTab, onTabChange }: BuyerTabBarProps) {
  const { t } = useLanguage();

  const handleSelectTab = (tab: BuyerTab) => {
    playTapSound();
    onTabChange?.(tab);
  };

  const navItems = [
    {
      id: 'discover' as const,
      en: 'Discover',
      te: 'కనుగొనండి',
      Icon: Compass,
    },
    {
      id: 'saved' as const,
      en: 'Saved',
      te: 'భద్రపరచినవి',
      Icon: Bookmark,
    },
    {
      id: 'profile' as const,
      en: 'Profile',
      te: 'ప్రొఫైల్',
      Icon: UserRound,
    },
  ];

  return (
    <div className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom,0px))] left-0 right-0 px-4 z-40 pointer-events-none max-w-md mx-auto">
      {/* Floating Pill Dock Container — Matches exact screenshot curve & ambient glow */}
      <nav
        role="tablist"
        aria-label={t('Buyer navigation', 'కొనుగోలుదారు నావిగేషన్')}
        className="w-full bg-white/95 backdrop-blur-md border border-gray-100 rounded-[2.25rem] py-2 px-3 flex justify-between items-center shadow-[0_12px_32px_-4px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)] pointer-events-auto select-none font-sans"
      >
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const { Icon } = item;

          return (
            <button
              key={item.id}
              role="tab"
              id={`buyer-tab-${item.id}`}
              aria-selected={isActive}
              aria-controls={`buyer-panel-${item.id}`}
              type="button"
              onClick={() => handleSelectTab(item.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-2 min-h-[48px] rounded-2xl transition-all duration-200 active:scale-95 cursor-pointer relative ${
                isActive
                  ? 'bg-[#FFF4EC] text-orange-600 font-extrabold shadow-2xs'
                  : 'text-stone-400 hover:text-stone-600 font-semibold'
              }`}
            >
              <div className="relative flex items-center justify-center mb-0.5">
                {isActive ? (
                  // Active Pill Icon: Signature circular boundary matching Image 1
                  <div className="w-7 h-7 rounded-full border border-orange-500/80 bg-white/80 flex items-center justify-center text-orange-600 shadow-2xs">
                    <Icon size={16} strokeWidth={2.4} />
                  </div>
                ) : (
                  // Inactive Icon: Minimal clean line
                  <div className="w-7 h-7 flex items-center justify-center text-stone-500 hover:text-stone-700">
                    <Icon size={20} strokeWidth={1.75} />
                  </div>
                )}
              </div>

              <span
                className={`text-[11px] tracking-tight block leading-none ${
                  isActive ? 'text-orange-600 font-black' : 'text-stone-500 font-semibold'
                }`}
              >
                {t(item.en, item.te)}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export default BuyerTabBar;
