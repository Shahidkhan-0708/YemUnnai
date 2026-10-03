// Export-only entry point. Never included in the application build.
import React from 'react';
import { createRoot } from 'react-dom/client';
import '../../src/index.css';
import { HomeDiscoveryScreen } from '../../src/components/HomeDiscoveryScreen';
import { QuickOrderModal } from '../../src/components/QuickOrderModal';
import { FeedbackModal } from '../../src/components/FeedbackModal';
import { BusinessDashboardScreen } from '../../src/components/BusinessDashboardScreen';
import { AddEditFoodItemScreen } from '../../src/components/AddEditFoodItemScreen';
import { WalkInMapModal } from '../../src/components/WalkInMapModal';
import { SplashOnboardingScreen } from '../../src/components/SplashOnboardingScreen';
import { LocationPermissionScreen } from '../../src/components/LocationPermissionScreen';
import { FoodItemDetailScreen } from '../../src/components/FoodItemDetailScreen';
import { MenuStockManagementScreen } from '../../src/components/MenuStockManagementScreen';
import { VendorLoginModal } from '../../src/components/VendorLoginModal';
import { OrdersScreen, SupportPanel } from '../../src/components/OrdersScreen';
import { BrandIntroSplash } from '../../src/components/BrandIntroSplash';
import { FamilyReceiveComponent } from '../../src/components/FamilyReceiveComponent';
import App from '../../src/App';
import ErrorPage from '../../src/components/ErrorPage';
import { DEFAULT_FOOD_ITEMS, LOCAL_SHOPS } from '../../src/lib/mockData';
import { bootstrap, capture } from './render-svg.js';

const noop = () => {};
const screen = new URLSearchParams(location.search).get('screen') || 'home';
const audit = new URLSearchParams(location.search).has('pixelAudit');
const item = DEFAULT_FOOD_ITEMS.find(x => audit ? x.name === 'Samosa' : x.actionType === 'order' && x.price > 0)!;
bootstrap(DEFAULT_FOOD_ITEMS, LOCAL_SHOPS, item, screen);
// Initialize modules with local fixture storage already set up by the HTML prelude.
const orders = (window as any).__svgOrders;
const home = <HomeDiscoveryScreen onOrderNow={noop} onWalkIn={noop} onReview={noop} onSelectItem={noop} />;
const screens: Record<string, React.ReactNode> = {
  home,
  checkout: <>{home}<QuickOrderModal isOpen item={item} onClose={noop} /></>,
  feedback: <>{home}<FeedbackModal isOpen item={item} onClose={noop} /></>,
  dashboard: <BusinessDashboardScreen />,
  add: <><BusinessDashboardScreen /><AddEditFoodItemScreen isOpen onClose={noop} /></>,
  map: <>{home}<WalkInMapModal isOpen item={item} onClose={noop} /></>,
  onboarding: <SplashOnboardingScreen onExplore={noop} onBusinessPortal={noop} />,
  location: <LocationPermissionScreen onAllow={noop} onManual={noop} />,
  detail: <FoodItemDetailScreen item={item} onBack={noop} />,
  stock: <MenuStockManagementScreen />,
  login: <VendorLoginModal isOpen onClose={noop} />,
  orders: <OrdersScreen orders={orders} loading={false} error="" retry={noop} onReorder={noop} />,
  saved: <HomeDiscoveryScreen savedOnly onOrderNow={noop} onWalkIn={noop} onReview={noop} />,
  intro: <BrandIntroSplash onStart={noop} />,
  error: <ErrorPage />,
  gallery: <App />,
  artifacts: <App />,
  components: <App />,
  collection: <FamilyReceiveComponent triggerLabel="Confirm collection" title="Confirm collection" description="Confirm the student has collected the order and paid at pickup." confirmLabel="Collected and paid" />,
  support: <SupportPanel />,
};
createRoot(document.getElementById('root')!).render(screens[screen] ?? home);
if (audit) {
  // Pixel comparisons use native browser screenshots, without DOM serialization.
  void (async () => {
    await new Promise(resolve => setTimeout(resolve, 1800));
    if (screen === 'collection') document.querySelector('button')?.click();
    await document.fonts.ready;
    for (const image of document.images) image.loading = 'eager';
    await Promise.all([...document.images].map(image => image.decode().catch(() => {})));
    if (screen === 'intro') {
      const video = document.querySelector('video');
      if (video) { video.pause(); video.currentTime = Math.min(4, Math.max(0, (video.duration || 5) - .1)); }
    }
    await new Promise(resolve => setTimeout(resolve, 400));
    await fetch('/__svg-result', { method: 'POST', body: JSON.stringify({ screen, height: Math.ceil(document.getElementById('root')!.getBoundingClientRect().height), text: document.body.innerText }) });
  })();
} else capture(screen);
