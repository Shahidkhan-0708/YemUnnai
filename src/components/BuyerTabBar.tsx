import { Bookmark, Compass, ShoppingBag, UserRound } from 'lucide-react';
import { TabsList, TabsTrigger } from './watermelon/tabs';
import { useLanguage } from '../lib/language';

export type BuyerTab = 'discover' | 'saved' | 'orders' | 'profile';

const tabs = [
  { value: 'discover', en: 'Discover', te: 'కనుగొనండి', Icon: Compass },
  { value: 'saved', en: 'Saved', te: 'భద్రపరచినవి', Icon: Bookmark },
  { value: 'orders', en: 'Orders', te: 'ఆర్డర్లు', Icon: ShoppingBag },
  { value: 'profile', en: 'Profile', te: 'ప్రొఫైల్', Icon: UserRound },
] as const;

export function BuyerTabBar({ activeTab }: { activeTab: BuyerTab }) {
  const { t } = useLanguage();
  return (
    <nav className="buyer-dock pickup-nav" aria-label={t('Buyer navigation', 'కొనుగోలుదారు నావిగేషన్')}>
      <div className="buyer-dock-surface">
        <TabsList className="buyer-tab-list" aria-label={t('Browse food', 'ఆహారం చూడండి')}>
          {tabs.map(({ value, en, te, Icon }) => (
            <TabsTrigger key={value} value={value} className="buyer-tab" id={`buyer-tab-${value}`}
              aria-controls={`buyer-panel-${value}`} aria-current={activeTab === value ? 'page' : undefined}>
              <Icon aria-hidden="true" strokeWidth={activeTab === value ? 2.1 : 1.7} />
              <span>{t(en, te)}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      <div className="buyer-home-indicator" aria-hidden="true" />
    </nav>
  );
}
