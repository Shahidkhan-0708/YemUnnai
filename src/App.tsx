import { SvgScreenFrame } from './components/SvgScreenFrame';
import { useState, useEffect, lazy, Suspense } from 'react';
import { HomeDiscoveryScreen } from './components/HomeDiscoveryScreen';
import type { FoodItem } from './lib/types';
import { QuickOrderModal } from './components/QuickOrderModal';
import { BrandIntroSplash } from './components/BrandIntroSplash';
import { InstallPrompt } from './components/InstallPrompt';
import { MobileDeviceShell } from './components/MobileDeviceShell';
import { playTapSound, playSuccessChime } from './lib/celebration';
import { OrdersScreen, useBuyerOrders } from './components/OrdersScreen';
import { BuyerTabBar, type BuyerTab } from './components/BuyerTabBar';
import { Tabs, TabsContent } from './components/watermelon/tabs';
import { MotionConfig } from '@watermelon-motion';
import { useVendorSession } from './lib/hooks';
import { safeStorage } from './lib/storage';
import { trackPageView, trackViewItem } from './lib/analytics';
import { Download, ExternalLink, Eye, X } from 'lucide-react';
import { useModalA11y } from './lib/useModalA11y';
import { Toaster, toast } from './components/ui/sonner';
import { reportAppError } from './lib/telemetry';

// Lazy-loaded modal & non-critical routes for fast initial bundle & 300+ user scalability
const FeedbackModal = lazy(() => import('./components/FeedbackModal').then(m => ({ default: m.FeedbackModal })));
const WalkInMapModal = lazy(() => import('./components/WalkInMapModal').then(m => ({ default: m.WalkInMapModal })));
const BusinessDashboardScreen = lazy(() => import('./components/BusinessDashboardScreen').then(m => ({ default: m.BusinessDashboardScreen })));
const BuyerProfileScreen = lazy(() => import('./components/BuyerProfileScreen').then(m => ({ default: m.BuyerProfileScreen })));
const AddEditFoodItemScreen = lazy(() => import('./components/AddEditFoodItemScreen').then(m => ({ default: m.AddEditFoodItemScreen })));
const LocationPermissionScreen = lazy(() => import('./components/LocationPermissionScreen').then(m => ({ default: m.LocationPermissionScreen })));
const FoodItemDetailScreen = lazy(() => import('./components/FoodItemDetailScreen').then(m => ({ default: m.FoodItemDetailScreen })));
const MenuStockManagementScreen = lazy(() => import('./components/MenuStockManagementScreen').then(m => ({ default: m.MenuStockManagementScreen })));
const VendorLoginModal = lazy(() => import('./components/VendorLoginModal').then(m => ({ default: m.VendorLoginModal })));
const ErrorPage = lazy(() => import('./components/ErrorPage'));
const AdminPortalScreen = lazy(() => import('./components/AdminPortalScreen').then(m => ({ default: m.AdminPortalScreen })));
const SaveToggleDemo = lazy(() => import('./components/SaveToggleDemo'));
const StepperDemo = lazy(() => import('./components/StepperDemo'));
const InlineDisclosureMenuDemo = lazy(() => import('./components/InlineDisclosureMenuDemo'));
const Alert3 = lazy(() => import('./components/Alert3'));
const Popover6 = lazy(() => import('./components/Popover6'));
const RunActionButtonDemo = lazy(() => import('./components/RunActionButtonDemo'));
const FamilyReceiveComponentDemo = lazy(() => import('./components/FamilyReceiveComponentDemo'));
const MorphingButtonDemo = lazy(() => import('./components/MorphingButtonDemo'));

function ScreenFallback() {
  return (
    <div className="w-full min-h-115 flex flex-col items-center justify-center gap-3 bg-[#E8ECEF] text-[#7A6658]">
      <div className="w-8 h-8 rounded-full border-2 border-[#F06A05] border-t-transparent animate-spin" />
      <span className="text-xs font-bold text-[#7A6658] tracking-wide">Loading…</span>
    </div>
  );
}

function ModalFallback({ title, onClose }: { title: string; onClose: () => void }) {
  const ref = useModalA11y<HTMLDivElement>(true, onClose);
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 p-3">
    <div ref={ref} role="dialog" aria-modal="true" aria-label={title} className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
      <div className="flex items-center justify-between gap-4"><h2 className="text-lg font-semibold">{title}</h2><button type="button" onClick={onClose} aria-label="Close loading dialog" className="flex size-11 items-center justify-center rounded-xl border border-[#D6DEE4]"><X size={18}/></button></div>
      <p role="status" className="mt-5 flex items-center gap-3 text-sm text-[#7A6658]"><span className="size-5 animate-spin rounded-full border-2 border-[#F06A05] border-t-transparent"/>Loading…</p>
    </div>
  </div>;
}

/** Stand-in item used by the Screen Gallery to open modals/screens without the grid.
 *  Mirrors the real MITS Canteen Samosa (see src/lib/mockData.ts) so demo
 *  screens never show a name/price/photo that contradicts the live menu. */
const DEFAULT_ORDER_ITEM: FoodItem = {
  id: 'gallery-demo',
  vendorId: 'a0000000-0000-4000-8000-000000000001',
  name: 'Samosa',
  vendor: 'MITS Canteen',
  price: 15,
  category: 'cooked',
  image: '/images/item_samosa_chicken.jpg',
  likes: 88,
  dislikes: 2,
  reviews: 34,
  rating: 4.8,
  walkTime: '2 min walk',
  actionType: 'order',
  inStock: true,
  isShopOnline: true
};

export function App() {
  const { vendor } = useVendorSession();
  const [buyerTab, setBuyerTab] = useState<BuyerTab>('discover');
  const [activePortal, setActivePortal] = useState<'consumer' | 'business' | 'admin' | 'artifacts' | 'gallery' | 'components' | '404'>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('portal');
      if (p === 'business' || p === 'admin' || p === 'gallery' || p === 'artifacts' || p === 'components' || p === '404') return p;
    }
    return 'consumer';
  });

  // Consumer flow opens straight into discovery; the location radar stays reachable from the home screen.
  const [consumerFlow, setConsumerFlow] = useState<'location' | 'discovery'>(() => {
    if (typeof window !== 'undefined') {
      const f = new URLSearchParams(window.location.search).get('flow');
      if (f === 'location') return 'location';
    }
    return 'discovery';
  });

  // Modals state
  const [selectedOrderFood, setSelectedOrderFood] = useState<FoodItem | null>(null);
  const [selectedOrderQty, setSelectedOrderQty] = useState(1);
  const [selectedWalkInFood, setSelectedWalkInFood] = useState<FoodItem | null>(null);
  const [selectedReviewFood, setSelectedReviewFood] = useState<FoodItem | null>(null);
  const [selectedDetailFood, setSelectedDetailFood] = useState<FoodItem | null>(null);
  const [buyerRestaurantId, setBuyerRestaurantId] = useState<string | null>(() => new URLSearchParams(window.location.search).get('restaurant'));
  useEffect(() => {
    const restoreRestaurant = () => {
      setBuyerRestaurantId(new URLSearchParams(window.location.search).get('restaurant'));
      setSelectedDetailFood(null);
      setBuyerTab('discover');
      window.scrollTo(0, 0);
    };
    window.addEventListener('popstate', restoreRestaurant);
    return () => window.removeEventListener('popstate', restoreRestaurant);
  }, []);
  const openRestaurant = (id: string | null) => {
    setSelectedDetailFood(null);
    setBuyerTab('discover');
    window.scrollTo(0, 0);
    if (id === buyerRestaurantId) return;
    const url = new URL(window.location.href);
    if (id) url.searchParams.set('restaurant', id);
    else url.searchParams.delete('restaurant');
    window.history.pushState(window.history.state, '', url);
    setBuyerRestaurantId(id);
  };
  const [editingFood, setEditingFood] = useState<FoodItem | null>(null);
  const [isAddEditOpen, setIsAddEditOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('add') === '1';
    }
    return false;
  });
  const [showMenuStock, setShowMenuStock] = useState(false);
  const [sellerLoginOpen, setSellerLoginOpen] = useState(false);
  const buyerOrders = useBuyerOrders(activePortal === 'consumer');
  const [showLaunchSplash, setShowLaunchSplash] = useState(() => safeStorage.getItem('yemunnai-intro-seen') !== 'true');
  useEffect(() => {
    const failure = () => reportAppError('javascript', 'A script failed while using the app.', vendor?.vendorId);
    window.addEventListener('error', failure);
    window.addEventListener('unhandledrejection', failure);
    return () => { window.removeEventListener('error', failure); window.removeEventListener('unhandledrejection', failure); };
  }, [vendor?.vendorId]);
  useEffect(() => {
    setShowMenuStock(false);
    setIsAddEditOpen(false);
    setEditingFood(null);
  }, [vendor?.vendorId]);

  // Track virtual page views for SPA navigation in Google Analytics
  useEffect(() => {
    if (activePortal === 'consumer' && buyerTab === 'discover' && buyerRestaurantId) return;
    const pageTitle = activePortal === 'consumer' 
      ? `Yemunnai - ${buyerTab.charAt(0).toUpperCase() + buyerTab.slice(1)}`
      : `Yemunnai - ${activePortal.charAt(0).toUpperCase() + activePortal.slice(1)}`;
    document.title = activePortal === 'consumer' && buyerTab === 'discover'
      ? 'Yemunnai — Food between lectures'
      : pageTitle;
    trackPageView(pageTitle, `/?portal=${activePortal}&tab=${buyerTab}`);
  }, [activePortal, buyerTab, buyerRestaurantId]);

  const showToast = (msg: string) => {
    toast(msg);
  };

  // Splash first: a clean brand animation, then straight into the app (no buttons needed).
  if (activePortal === 'admin') return <Suspense fallback={<ScreenFallback />}><AdminPortalScreen /></Suspense>;
  if (showLaunchSplash && activePortal !== '404') {
    return (
      <div className="h-dvh overflow-hidden bg-[#F06A05]">
        <BrandIntroSplash onStart={() => { safeStorage.setItem('yemunnai-intro-seen', 'true'); setShowLaunchSplash(false); }} />
      </div>
    );
  }

  return <SvgScreenFrame screen={activePortal==='gallery'?'gallery':activePortal==='artifacts'?'artifacts':activePortal==='components'?'components':null}>
    <div className="min-h-screen bg-[#E8ECEF] text-[#1F140A]">
      <Toaster />
      {/* Main Content Area */}
      <a className="skip-content" href="#main-content">Skip to menu</a>
      <main id="main-content" tabIndex={-1} className="w-full flex justify-center">
        {/* 1. CONSUMER APP SCREEN */}
        {activePortal === 'consumer' && (
          <MobileDeviceShell>
            <Suspense fallback={<ScreenFallback />}>
              <MotionConfig reducedMotion="user">
              <Tabs className="relative everyday-consumer" value={buyerTab} onValueChange={value => {
                setBuyerTab(value as BuyerTab); setSelectedDetailFood(null); setConsumerFlow('discovery');
              }}>
                <TabsContent className="buyer-tab-panel" value={buyerTab} id={`buyer-panel-${buyerTab}`} aria-labelledby={`buyer-tab-${buyerTab}`}>
                
                {buyerTab === 'profile' ? <BuyerProfileScreen onNavigate={setBuyerTab} /> : buyerTab === 'orders' ? <OrdersScreen {...buyerOrders} onDiscover={() => setBuyerTab('discover')} onReorder={item => { setSelectedOrderQty(1); setSelectedOrderFood(item); }} /> : consumerFlow === 'location' ? (
                  <div className="relative">
                    <LocationPermissionScreen
                      onAllow={() => {
                        playSuccessChime();
                        setConsumerFlow('discovery');
                        showToast('Campus location enabled');
                      }}
                      onManual={() => {
                        playTapSound();
                        setConsumerFlow('discovery');
                        showToast('📍 Campus Center Selected');
                      }}
                    />
                  </div>
                ) : selectedDetailFood ? (
                  <FoodItemDetailScreen
                    item={selectedDetailFood}
                    onBack={() => setSelectedDetailFood(null)}
                    onMap={() => {
                      setSelectedWalkInFood(selectedDetailFood);
                      setSelectedDetailFood(null);
                    }}
                    onOrder={(qty, current) => {
                      setSelectedOrderQty(qty);
                      setSelectedOrderFood(current ?? selectedDetailFood);
                      setSelectedDetailFood(null);
                    }}
                  />
                ) : (
                  <HomeDiscoveryScreen
                    key={`${buyerTab}:${buyerTab === 'saved' ? 'all' : buyerRestaurantId ?? 'all'}`}
                    restaurantId={buyerTab === 'saved' ? null : buyerRestaurantId}
                    onBack={() => openRestaurant(null)}
                    savedOnly={buyerTab === 'saved'}
                    cartCount={buyerOrders.orders.filter(o => ['pending','preparing','ready'].includes(o.status)).length}
                    onBusinessPortal={() => {
                      playTapSound();
                      if (vendor) setActivePortal('business');
                      else setSellerLoginOpen(true);
                    }}
                    onOrderNow={(item) => {
                      playTapSound();
                      setSelectedOrderQty(1);
                      setSelectedOrderFood(item);
                    }}
                    onWalkIn={(item) => {
                      playTapSound();
                      setSelectedWalkInFood(item);
                    }}
                    onReview={(item) => {
                      playTapSound();
                      setSelectedReviewFood(item);
                    }}
                    onCartClick={() => setBuyerTab('orders')}
                    onSelectShop={(name, id) => {
                      if (name !== 'All' && !id) return;
                      openRestaurant(name === 'All' ? null : id!);
                      playTapSound();
                    }}
                    onSelectItem={(item) => {
                      playTapSound();
                      trackViewItem(item);
                      setSelectedDetailFood(item);
                    }}
                  />
                )}

                </TabsContent>
                <BuyerTabBar activeTab={buyerTab} />
                {/* Quick Order Modal — sits stably on top of screen with synced quantity */}
                {selectedOrderFood && <QuickOrderModal
                  isOpen={!!selectedOrderFood}
                  item={selectedOrderFood}
                  initialQty={selectedOrderQty}
                  onClose={() => setSelectedOrderFood(null)}
                  onSuccess={() => { buyerOrders.retry(); }}
                />}

                {/* Walk-in Map Modal */}
                {selectedWalkInFood && <Suspense fallback={<ModalFallback title={`Walk-in map for ${selectedWalkInFood.vendor}`} onClose={() => setSelectedWalkInFood(null)} />}><WalkInMapModal
                  isOpen={!!selectedWalkInFood}
                  item={selectedWalkInFood}
                  onClose={() => setSelectedWalkInFood(null)}
                /></Suspense>}

                {/* Feedback Modal */}
                {selectedReviewFood && <Suspense fallback={<ModalFallback title="Food feedback" onClose={() => setSelectedReviewFood(null)} />}><FeedbackModal
                  isOpen={!!selectedReviewFood}
                  item={selectedReviewFood}
                  onClose={() => setSelectedReviewFood(null)}
                  onSubmitSuccess={() => {
                    showToast(`Review published for ${selectedReviewFood?.name}!`);
                  }}
                /></Suspense>}
              </Tabs>
              </MotionConfig>
            </Suspense>
            <Suspense fallback={<ModalFallback title="Business sign in" onClose={() => setSellerLoginOpen(false)} />}>
              {sellerLoginOpen && <VendorLoginModal isOpen onClose={() => setSellerLoginOpen(false)} onSignedIn={() => setActivePortal('business')} />}
            </Suspense>
          </MobileDeviceShell>
        )}

        {/* 2. BUSINESS PORTAL SCREEN — reachable via ?portal=business (vendor login) */}
        {activePortal === 'business' && (
          <MobileDeviceShell>
            <Suspense fallback={<ScreenFallback />}>
              <div className="relative">
                {vendor && showMenuStock ? (
                  <div className="relative">
                    <MenuStockManagementScreen
                      onBack={() => setShowMenuStock(false)}
                      onAddNewItem={() => { setEditingFood(null); setIsAddEditOpen(true); }}
                      onEditItem={(item) => { setEditingFood(item); setIsAddEditOpen(true); }}
                      onToggleStock={(id, inStock) => {
                        showToast(`Item #${id} stock ${inStock ? 'on' : 'off'}`);
                      }}
                    />
                  </div>
                ) : (
                  <BusinessDashboardScreen
                    onDiscover={() => setActivePortal('consumer')}
                    onAddNewItem={() => { setEditingFood(null); setIsAddEditOpen(true); }}
                    onManageStock={() => setShowMenuStock(true)}
                  />
                )}

                {/* Add/Edit Food Item Modal */}
                {vendor && isAddEditOpen && <Suspense fallback={<ModalFallback title={editingFood ? 'Edit food item' : 'Add food item'} onClose={() => setIsAddEditOpen(false)} />}><AddEditFoodItemScreen
                  item={editingFood}
                  isOpen={!!vendor && isAddEditOpen}
                  onClose={() => setIsAddEditOpen(false)}
                  onPublished={(item) => {
                    showToast(`${editingFood ? 'Saved changes to' : 'Published'} ${item.name}${item.price == null ? '' : ` (₹${item.price})`}.`);
                  }}
                /></Suspense>}
              </div>
            </Suspense>
          </MobileDeviceShell>
        )}

        {/* 3. DESIGN ARTIFACTS & DELIVERABLES */}
        {/* 4. SCREEN GALLERY — all 12 SVG screens built as live React components */}
        {activePortal === 'gallery' && (
          <div className="w-full max-w-4xl bg-[#1A2620] rounded-3xl p-6 border border-emerald-900/50 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-emerald-900/60">
              <div>
                <h2 className="text-base font-black text-white">Live Screen Gallery</h2>
                <p className="text-xs text-slate-400">Every Figma screen rebuilt 1:1 as interactive React — tap through each one.</p>
              </div>
              <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300">
                12 screens
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {([
                {
                  n: '01 · Home Discovery',
                  d: 'Category pills, tactile deals, vendor cards — the live consumer home.',
                  action: () => setActivePortal('consumer'),
                  cta: 'Open screen'
                },
                {
                  n: '02 · Quick Order Modal',
                  d: 'Bottom sheet: order summary, mobile + address, confirm CTA.',
                  action: () => { setActivePortal('consumer'); setTimeout(() => setSelectedOrderFood(DEFAULT_ORDER_ITEM), 60); },
                  cta: 'Open modal'
                },
                {
                  n: '03 · Feedback Popup',
                  d: 'Star rating, like/dislike toggle, review textarea.',
                  action: () => { setActivePortal('consumer'); setTimeout(() => setSelectedReviewFood(DEFAULT_ORDER_ITEM), 60); },
                  cta: 'Open modal'
                },
                {
                  n: '04 · Business Dashboard',
                  d: 'Live stats, online toggle, realtime incoming orders.',
                  action: () => setActivePortal('business'),
                  cta: 'Open screen'
                },
                {
                  n: '05 · Add/Edit Food Item',
                  d: 'Title, category, price, veg toggle, photo upload, publish.',
                  action: () => { setActivePortal('business'); setTimeout(() => setIsAddEditOpen(true), 60); },
                  cta: 'Open sheet'
                },
                {
                  n: '06 · Walk-In Map Modal',
                  d: 'Real interactive map, canteen logo pins, and walking directions.',
                  action: () => { setActivePortal('consumer'); setTimeout(() => setSelectedWalkInFood(DEFAULT_ORDER_ITEM), 60); },
                  cta: 'Open modal'
                },
                {
                  n: '07 · Mascot Logo',
                  d: 'Official mascot badge + wordmark (extracted to /images/NewLogo.svg).',
                  action: () => setActivePortal('artifacts'),
                  cta: 'View asset'
                },
                {
                  n: '10 · Food Item Detail',
                  d: 'Hero photo, vendor bar, portion selector, sticky order bar.',
                  action: () => { setActivePortal('consumer'); setTimeout(() => setSelectedDetailFood(DEFAULT_ORDER_ITEM), 60); },
                  cta: 'Open screen'
                },
                {
                  n: '11 · Menu & Stock Management',
                  d: 'Vendor console: stat strip, category pills, stock toggles, FAB.',
                  action: () => { setActivePortal('business'); setShowMenuStock(true); },
                  cta: 'Open screen'
                },
                {
                  n: '12 · Access Login & Keypad',
                  d: 'Role tabs, roll/email field, PIN boxes, tactile numpad.',
                  action: () => { setActivePortal('business'); setTimeout(() => document.dispatchEvent(new CustomEvent('open-vendor-login')), 60); },
                  cta: 'Open screen'
                }
              ] as Array<{ n: string; d: string; action: () => void; cta: string }>).map(card => (
                <div key={card.n} className="p-4 bg-[#131D17] border border-emerald-900/40 rounded-2xl flex flex-col justify-between hover:border-emerald-700/60 transition-colors">
                  <div>
                    <span className="text-xs font-bold text-[#FFEAD9] block">{card.n}</span>
                    <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{card.d}</p>
                  </div>
                  <button
                    onClick={card.action}
                    className="mt-3 w-full py-2 rounded-lg bg-[#F06A05] hover:bg-[#0B5422] text-white text-[11px] font-bold cursor-pointer transition-colors"
                  >
                    {card.cta}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activePortal === 'artifacts' && (
          <div className="w-full max-w-4xl bg-[#1A2620] rounded-3xl p-6 border border-emerald-900/50 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-emerald-900/60">
              <div>
                <h2 className="text-base font-black text-white">Official Design Deliverables (SVG Pack)</h2>
                <p className="text-xs text-slate-400">7 self-contained vector assets with embedded typography and reference imagery (375 × 812).</p>
              </div>
              <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300">
                Official Pack v1.0
              </span>
            </div>

            {/* Master Overview Preview */}
            <div className="bg-[#121A15] p-4 rounded-[18px] border border-emerald-950 flex flex-col items-center">
              <div className="w-full flex items-center justify-between mb-3 px-1">
                <span className="text-xs font-bold text-slate-300">Full Design Artboard Overview</span>
                <a 
                  href="/svgs/preview.png" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-[11px] text-[#FFEAD9] hover:underline flex items-center gap-1 font-semibold"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View Full Res
                </a>
              </div>
              <img 
                src="/svgs/preview.png" 
                alt="YEMEMUNNAI SVG Pack Preview" 
                className="rounded-xl shadow-lg max-w-full border border-emerald-950/80"
              />
            </div>

            {/* Standalone SVG Deliverables */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-extrabold text-white">Standalone SVG Screens &amp; Assets</h3>
                <span className="text-[11px] text-slate-400 font-mono">figma_svgs/ &amp; public/svgs/</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {[
                  { name: '01_home_discovery_feed.svg', preview: '01_home_discovery_feed.png', label: '01. Home Discovery Feed', desc: 'Category pills, tactile deals, vendor cards' },
                  { name: '02_quick_order_modal.svg', preview: '02_quick_order_modal.png', label: '02. Quick Order Modal', desc: 'Portion selector, live total & checkout' },
                  { name: '03_feedback_popup.svg', preview: '03_feedback_popup.png', label: '03. Feedback Popup', desc: 'Star rating, tags, comment submission' },
                  { name: '04_business_dashboard.svg', preview: '04_business_dashboard.png', label: '04. Business Dashboard', desc: 'Live stats, toggle stock, item listings' },
                  { name: '05_add_edit_food_item.svg', preview: '05_add_edit_food_item.png', label: '05. Add/Edit Food Item', desc: 'Title, price, category form sheet' },
                  { name: '06_walk_in_map_modal.svg', preview: '06_walk_in_map_modal.png', label: '06. Walk-In Map Modal', desc: 'Campus buildings, walking route & time' },
                  { name: '07_mascot_logo.svg', preview: '07_mascot_logo.png', label: '07. Official Mascot Logo', desc: 'Preserved sage badge & illustration' },
                  { name: '08_splash_onboarding.svg', preview: '08_splash_onboarding.png', label: '08. Splash & Onboarding', desc: 'Brand mascot, campus selector, quick-start CTA' },
                  { name: '09_location_permission.svg', preview: '09_location_permission.png', label: '09. Location & Geofence', desc: 'Campus radar dialog, walking time calculations' },
                  { name: '10_food_item_detail.svg', preview: '10_food_item_detail.png', label: '10. Food Item Detail', desc: 'Hero photo, portion size, live pot status' },
                  { name: '11_menu_stock_management.svg', preview: '11_menu_stock_management.png', label: '11. Live Menu & Stock', desc: 'Stock toggles, sold out badges, metric strip' },
                  { name: '12_access_login.svg', preview: '12_access_login.png', label: '12. Access Login & Keypad', desc: 'Role switcher, roll number OTP & tactile numpad' },
                ].map((file) => (
                  <div key={file.name} className="p-3.5 bg-[#131D17] border border-emerald-900/40 rounded-2xl flex flex-col justify-between hover:border-emerald-700/60 transition-colors">
                    <div>
                      <div className="w-full h-40 bg-[#0B120E] rounded-xl overflow-hidden mb-3 border border-emerald-950/60 flex items-center justify-center p-1.5">
                        <img 
                          src={`/svgs/previews/${file.preview}`} 
                          alt={file.label} 
                          className="max-h-full max-w-full object-contain rounded-lg"
                        />
                      </div>
                      <span className="text-xs font-bold text-[#FFEAD9] block">{file.label}</span>
                      <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">{file.desc}</p>
                      <span className="text-[9px] text-slate-500 font-mono block mt-1">{file.name}</span>
                    </div>

                    <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-emerald-950/60">
                      <a
                        href={`/svgs/${file.name}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-1.5 px-2.5 rounded-lg bg-emerald-900/40 hover:bg-emerald-800/50 text-[#FFEAD9] text-[10px] font-bold flex items-center justify-center gap-1 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Open SVG</span>
                      </a>
                      <a
                        href={`/svgs/${file.name}`}
                        download={file.name}
                        className="p-1.5 rounded-lg bg-emerald-900/30 hover:bg-emerald-800/40 text-slate-300 hover:text-white transition-colors"
                        title="Download SVG"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activePortal === 'components' && (
          <div className="w-full max-w-4xl bg-[#1A2620] rounded-3xl p-6 border border-emerald-900/50 shadow-2xl space-y-6 pb-20">
            <div className="flex items-center justify-between pb-4 border-b border-emerald-900/60">
              <div>
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  <span>🧩 Interactive Component Showcase</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                    10 Custom Components
                  </span>
                </h2>
                <p className="text-xs text-slate-400">All components created from specifications, accessible via <code>@/components/original</code>.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* 1. SaveToggle */}
              <div className="bg-[#121A15] p-4 rounded-2xl border border-emerald-950 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">01. SaveToggle</span>
                    <span className="text-[9px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded font-mono">SaveToggle.tsx</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Multi-state bookmark toggle with idle, loading, and saved states.</p>
                </div>
                <div className="my-4 py-3 bg-[#0D1410] rounded-xl flex items-center justify-center border border-white/5">
                  <Suspense fallback={<ScreenFallback />}>
                    <SaveToggleDemo />
                  </Suspense>
                </div>
                <span className="text-[9px] text-slate-500">Integrated in: FoodItemDetailScreen, HomeDiscoveryScreen</span>
              </div>

              {/* 2. Stepper */}
              <div className="bg-[#121A15] p-4 rounded-2xl border border-emerald-950 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">02. Stepper</span>
                    <span className="text-[9px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded font-mono">Stepper.tsx</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Tactile quantity stepper with min/max clamps, rapid press, and keyboard support.</p>
                </div>
                <div className="my-4 py-3 bg-[#0D1410] rounded-xl flex items-center justify-center border border-white/5">
                  <Suspense fallback={<ScreenFallback />}>
                    <StepperDemo />
                  </Suspense>
                </div>
                <span className="text-[9px] text-slate-500">Integrated in: QuickOrderModal, FoodItemDetailScreen, AddEditFoodItemScreen</span>
              </div>

              {/* 3. InlineDisclosureMenu */}
              <div className="bg-[#121A15] p-4 rounded-2xl border border-emerald-950 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">03. InlineDisclosureMenu</span>
                    <span className="text-[9px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded font-mono">InlineDisclosureMenu.tsx</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Inline expandable disclosure menu with icons, labels, and delete confirmation.</p>
                </div>
                <div className="my-4 py-3 bg-[#0D1410] rounded-xl flex items-center justify-center border border-white/5 min-h-20">
                  <Suspense fallback={<ScreenFallback />}>
                    <InlineDisclosureMenuDemo />
                  </Suspense>
                </div>
                <span className="text-[9px] text-slate-500">Integrated in: MenuStockManagementScreen (canteen quick actions)</span>
              </div>

              {/* 5. Alert3 */}
              <div className="bg-[#121A15] p-4 rounded-2xl border border-emerald-950 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">05. Alert3</span>
                    <span className="text-[9px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded font-mono">Alert3.tsx</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Dismissible base-ui alert banner with unread counter, icon, and close button.</p>
                </div>
                <div className="my-4 py-3 px-3 bg-[#0D1410] rounded-xl border border-white/5">
                  <Suspense fallback={<ScreenFallback />}>
                    <Alert3 />
                  </Suspense>
                </div>
                <span className="text-[9px] text-slate-500">Integrated in: BusinessDashboardScreen (real-time notification ribbon)</span>
              </div>

              {/* 6. Popover6 */}
              <div className="bg-[#121A15] p-4 rounded-2xl border border-emerald-950 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">06. Popover6</span>
                    <span className="text-[9px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded font-mono">Popover6.tsx</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Download & export progress popover with animated percentage, pause, resume, and cancel.</p>
                </div>
                <div className="my-4 py-3 bg-[#0D1410] rounded-xl flex items-center justify-center border border-white/5">
                  <Suspense fallback={<ScreenFallback />}>
                    <Popover6 />
                  </Suspense>
                </div>
                <span className="text-[9px] text-slate-500">Integrated in: BusinessDashboardScreen (sales report export)</span>
              </div>

              {/* 7. RunActionButton */}
              <div className="bg-[#121A15] p-4 rounded-2xl border border-emerald-950 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">07. RunActionButton</span>
                    <span className="text-[9px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded font-mono">RunActionButton.tsx</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Multi-step action sequence runner with live progress bar and status feedback.</p>
                </div>
                <div className="my-4 py-3 bg-[#0D1410] rounded-xl flex items-center justify-center border border-white/5">
                  <Suspense fallback={<ScreenFallback />}>
                    <RunActionButtonDemo />
                  </Suspense>
                </div>
                <span className="text-[9px] text-slate-500">Integrated in: BusinessDashboardScreen (daily settlement & kitchen pipeline)</span>
              </div>

              {/* 8. FamilyReceiveComponent */}
              <div className="bg-[#121A15] p-4 rounded-2xl border border-emerald-950 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">08. FamilyReceiveComponent</span>
                    <span className="text-[9px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded font-mono">FamilyReceiveComponent.tsx</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Biometric/PIN confirmation modal for secure payment reception.</p>
                </div>
                <div className="my-4 py-3 bg-[#0D1410] rounded-xl flex items-center justify-center border border-white/5">
                  <Suspense fallback={<ScreenFallback />}>
                    <FamilyReceiveComponentDemo />
                  </Suspense>
                </div>
                <span className="text-[9px] text-slate-500">Integrated in: BusinessDashboardScreen (student pickup settlement)</span>
              </div>

              {/* 9. MorphingButton */}
              <div className="bg-[#121A15] p-4 rounded-2xl border border-emerald-950 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">09. MorphingButton</span>
                    <span className="text-[9px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded font-mono">MorphingButton.tsx</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Button that smoothly morphs into an email input form upon click.</p>
                </div>
                <div className="my-4 py-3 bg-[#0D1410] rounded-xl flex items-center justify-center border border-white/5 min-h-16">
                  <Suspense fallback={<ScreenFallback />}>
                    <MorphingButtonDemo />
                  </Suspense>
                </div>
                <span className="text-[9px] text-slate-500">Integrated in: FoodItemDetailScreen (restock / offline notifications)</span>
              </div>

              {/* 10. ErrorPage (404) */}
              <div className="bg-[#121A15] p-4 rounded-2xl border border-emerald-950 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">10. ErrorPage (404)</span>
                    <span className="text-[9px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded font-mono">ErrorPage.tsx</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">A simple portrait page in our orange theme, with a direct path back to Discover.</p>
                </div>
                <div className="my-4 py-3 bg-[#0D1410] rounded-xl flex items-center justify-center border border-white/5">
                  <button
                    type="button"
                    onClick={() => setActivePortal('404')}
                    className="px-4 py-2 rounded-xl bg-lime-500/20 text-lime-400 border border-lime-500/30 text-xs font-black hover:bg-lime-500/30 cursor-pointer transition-all"
                  >
                    View 404 Error Screen →
                  </button>
                </div>
                <span className="text-[9px] text-slate-500">Integrated in: ErrorBoundary & /?portal=404</span>
              </div>
            </div>
          </div>
        )}

        {activePortal === '404' && (
          <Suspense fallback={<ScreenFallback />}>
            <ErrorPage />
          </Suspense>
        )}
      </main>


      {/* PWA install sheet — appears when the browser offers install */}
      {activePortal !== '404' && <InstallPrompt autoOffer={activePortal === 'consumer'} />}
    </div>
  </SvgScreenFrame>;
}

export default App;
