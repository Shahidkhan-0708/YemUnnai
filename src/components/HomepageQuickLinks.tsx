import React from 'react';
import { HOMEPAGE_QUICK_LINKS, type QuickLink } from '../lib/homepageMenu';
import { useLanguage } from '../lib/language';
import { playTapSound } from '../lib/celebration';

interface Props {
  activeQuickLinkId: string;
  onSelectQuickLink: (quickLink: QuickLink) => void;
  itemCounts?: Record<string, number>;
}

export const HomepageQuickLinks: React.FC<Props> = ({
  activeQuickLinkId,
  onSelectQuickLink,
  itemCounts = {}
}) => {
  const { lang } = useLanguage();

  return (
    <nav className="homepage-quick-links-wrap" aria-label="Quick food categories">
      <div className="homepage-quick-links-scroll">
        {HOMEPAGE_QUICK_LINKS.map(link => {
          const isSelected = activeQuickLinkId === link.id;
          const count = itemCounts[link.id];

          return (
            <button
              key={link.id}
              type="button"
              className={`quick-link-pill ${isSelected ? 'is-active' : ''}`}
              onClick={() => {
                playTapSound();
                onSelectQuickLink(link);
              }}
              aria-pressed={isSelected}
            >
              <span className="quick-link-icon" aria-hidden="true">{link.icon}</span>
              <span className="quick-link-text">{lang === 'te' ? link.nameTe : link.name}</span>
              {typeof count === 'number' && count > 0 && link.id !== 'all' && (
                <span className="quick-link-count">{count}</span>
              )}
              {link.badge && (
                <span className={`quick-link-badge badge-${link.badge.toLowerCase()}`}>
                  {link.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
