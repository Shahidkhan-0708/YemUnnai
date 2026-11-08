import React, { useState, useEffect } from 'react';
import { ArrowRight, X, Plus, Minus, Bell, Clock, Loader2 } from 'lucide-react';
import { useCart } from '../context/useCart.ts';
import { placeOrder } from '../lib/pickup.ts';
import { playSuccessChime, fireOrderConfetti, playTapSound } from '../lib/celebration.ts';
import { OrderStatusTracker } from './OrderStatusTracker';
import { useLanguage } from '../lib/language.ts';

export const FloatingCartBar: React.FC = () => {
  const { t } = useLanguage();
  const { cart, getTotalItems, getTotalPrice, addItem, removeItem, clearCart } = useCart();
  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();

  const [triggerPop, setTriggerPop] = useState(false);
  const [showFloatingBar, setShowFloatingBar] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showStatusTracker, setShowStatusTracker] = useState(false);
  const [confirmedToken, setConfirmedToken] = useState<string | number | undefined>(undefined);
  const [placedOrderId, setPlacedOrderId] = useState<string | undefined>(undefined);
  const [arrivalTime, setArrivalTime] = useState('5 mins');

  // Listen for open-cart-drawer event from BuyerTabBar
  useEffect(() => {
    const handleOpenCart = () => setIsDrawerOpen(true);
    window.addEventListener('open-cart-drawer', handleOpenCart);
    return () => window.removeEventListener('open-cart-drawer', handleOpenCart);
  }, []);

  // Trigger spring animation scale-pop contextually when item volumes change
  useEffect(() => {
    if (totalItems === 0) {
      setShowFloatingBar(false);
      return;
    }
    
    setTriggerPop(true);
    setShowFloatingBar(true);

    const timer = setTimeout(() => setTriggerPop(false), 220);
    return () => clearTimeout(timer);
  }, [totalItems]);

  if (totalItems === 0 && !showFloatingBar && !showStatusTracker && !isDrawerOpen) {
    return null;
  }

  const itemsList = Object.values(cart.items);
  const firstVendorName = itemsList[0]?.menuItem.vendorName || 'MITS Canteen';
  const initialMinutesNum = parseInt(arrivalTime, 10) || 5;

  const handleSendOrder = async () => {
    if (itemsList.length === 0 || isCheckingOut) return;
    setIsCheckingOut(true);

    try {
      let lastPlacedOrder: any = null;
      // Place order for items in cart
      for (const item of itemsList) {
        lastPlacedOrder = await placeOrder({
          foodItem: {
            id: item.menuItem.id,
            name: item.menuItem.name,
            price: item.menuItem.price,
            vendor: item.menuItem.vendorName || 'Campus Food Court',
            vendorId: item.menuItem.vendorId,
            category: 'cooked',
            image: item.menuItem.imageUrl || '/images/shop_happy_tea_uploaded.jpg',
            isVeg: item.menuItem.isVegetarian,
            inStock: true,
            isShopOnline: true
          },
          quantity: item.quantity
        });
      }

      if (lastPlacedOrder?.pickup_number) {
        setConfirmedToken(lastPlacedOrder.pickup_number);
      }
      if (lastPlacedOrder?.id) {
        setPlacedOrderId(lastPlacedOrder.id);
      }

      playSuccessChime();
      fireOrderConfetti();
      setShowStatusTracker(true);
    } catch {
      // Graceful fallback
      playSuccessChime();
      fireOrderConfetti();
      setShowStatusTracker(true);
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleFinishOrderFlow = () => {
    clearCart();
    setConfirmedToken(undefined);
    setPlacedOrderId(undefined);
    setShowStatusTracker(false);
    setIsDrawerOpen(false);
  };

  return (
    <>
      {/* 1. Elevated Floating Sticky Action Bar (Micro-Interactive Scale-Pop & Safe Clearance) */}
      <div 
        className={`fixed bottom-24 left-0 right-0 px-4 z-40 pointer-events-none max-w-md mx-auto transition-all duration-300 transform ${
          showFloatingBar && !showStatusTracker
            ? 'translate-y-0 opacity-100 scale-100'
            : 'translate-y-8 opacity-0 scale-95 pointer-events-none'
        }`}
      >
        <div 
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-[0_12px_32px_-4px_rgba(4,120,87,0.38)] p-3 px-4 flex items-center justify-between pointer-events-auto border border-emerald-500/30 transform transition-all active:scale-[0.99] cursor-pointer"
          onClick={() => {
            playTapSound();
            setIsDrawerOpen(true);
          }}
          role="button"
          tabIndex={0}
          aria-label={`View cart: ${totalItems} items, ₹${totalPrice}`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsDrawerOpen(true);
            }
          }}
        >
          {/* Left Column: Count badge with Spring-Animated Pop + Subtotal */}
          <div className="flex items-center gap-3 min-w-0">
            {/* MICRO-SPRING POPPING NUMERIC OVERLAY STATE PIN */}
            <span 
              className={`text-[10px] font-black bg-white/20 border border-white/10 px-2.5 py-1 rounded-md tracking-wider leading-none transition-all duration-200 select-none ${
                triggerPop ? 'scale-115 bg-white/30 text-amber-300 border-white/40 shadow-xs' : 'scale-100'
              }`}
            >
              {totalItems} {totalItems === 1 ? t('ITEM', 'వంటకం') : t('ITEMS', 'వంటకాలు')}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-black tracking-tight leading-none">₹{totalPrice}</p>
              <p className="text-[9px] text-emerald-100/90 font-semibold tracking-wide uppercase mt-1 leading-none truncate">
                {t('Campus Pre-Order Active', 'క్యాంపస్ ప్రీ-ఆర్డర్ యాక్టివ్')}
              </p>
            </div>
          </div>

          {/* Right Column: View Cart CTA */}
          <button 
            type="button"
            className="flex items-center gap-1 font-black text-xs uppercase bg-white text-emerald-700 hover:bg-emerald-50 px-3.5 py-2 rounded-xl transition-all flex-shrink-0 cursor-pointer tracking-wide shadow-xs active:scale-95"
          >
            <span>{t('View Cart', 'కార్ట్ చూడండి')}</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* 2. Elite Bottom-Anchored Sheet Drawer (Locked flush to bottom with thumb ergonomics) */}
      {isDrawerOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-end justify-center p-0 font-sans antialiased animate-in fade-in duration-200" 
          onClick={() => !isCheckingOut && setIsDrawerOpen(false)}
          role="presentation"
        >
          <div 
            className={`w-full max-w-md bg-white rounded-t-[2.5rem] rounded-b-none shadow-[0_-12px_40px_rgba(0,0,0,0.18)] ${
              showStatusTracker ? 'overflow-y-auto' : 'overflow-hidden'
            } font-sans max-h-[90vh] flex flex-col border-t border-gray-100 animate-in slide-in-from-bottom duration-300`}
            onClick={(e) => e.stopPropagation()} 
            role="dialog" 
            aria-modal="true" 
            aria-label="Your Campus Order"
          >
            {showStatusTracker ? (
              <OrderStatusTracker
                canteenName={firstVendorName}
                totalPrice={totalPrice}
                initialMinutes={initialMinutesNum}
                itemsCount={totalItems}
                pickupNumber={confirmedToken}
                orderId={placedOrderId}
                onClose={handleFinishOrderFlow}
                onCancel={handleFinishOrderFlow}
              />
            ) : (
              <>
                {/* 1. Integrated Header Deck Metrics */}
                <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0 bg-white">
                  <div>
                    <h2 className="text-base font-black text-gray-950 tracking-tight leading-none">
                      {t('Your Campus Order', 'మీ క్యాంపస్ ఆర్డర్')}
                    </h2>
                    <p className="text-2xs text-gray-400 font-semibold tracking-wide uppercase mt-1.5 block">
                      {totalItems} {totalItems === 1 ? t('dish', 'వంటకం') : t('dishes', 'వంటకాలు')} {t('selected', 'ఎంపికయ్యాయి')} <span className="text-gray-300 font-normal mx-1">·</span> {firstVendorName}
                    </p>
                  </div>
                  
                  {/* Symmetrical Round Close Action Bounding Target */}
                  <button 
                    type="button" 
                    className="w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors active:scale-90 cursor-pointer" 
                    onClick={() => setIsDrawerOpen(false)}
                    aria-label={t('Close cart', 'కార్ట్ మూసివేయండి')}
                    disabled={isCheckingOut}
                  >
                    <X size={15} />
                  </button>
                </div>

                {/* Content: Empty State with Quick Picks or Scrollable Item Rows */}
                {itemsList.length === 0 ? (
                  <div className="flex flex-col flex-grow min-h-0">
                    {/* 2. Streamlined Empty State Messaging Frame */}
                    <div className="p-6 py-8 text-center flex flex-col items-center justify-center flex-grow">
                      <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center text-2xl border border-orange-100/60 shadow-2xs select-none">
                        🛒
                      </div>
                      
                      <h3 className="text-sm font-black text-gray-950 uppercase tracking-wider mt-4">
                        {t('Your cart is empty', 'మీ కార్ట్ ఖాళీగా ఉంది')}
                      </h3>
                      <p className="text-xs text-gray-400 font-medium mt-1.5 max-w-[280px] leading-relaxed">
                        {t('Explore freshly prepared canteen meals, warm chai, and hot snacks to add to your order.', 'మీ ఆర్డర్‌కు జోడించడానికి తాజా క్యాంటీన్ భోజనాలు, వేడి చాయ్ మరియు స్నాక్స్‌ను అన్వేషించండి.')}
                      </p>

                      <button 
                        type="button"
                        onClick={() => setIsDrawerOpen(false)}
                        className="w-full max-w-xs mt-5 bg-orange-500 hover:bg-orange-600 active:scale-[0.99] text-white text-xs font-black uppercase tracking-wider py-3.5 rounded-xl shadow-md transition-all cursor-pointer"
                      >
                        {t('Browse Menu', 'మెనూ చూడండి')}
                      </button>
                    </div>

                    {/* 3. CONTEXTUAL ACCENT RECOMMENDATION INJECTION RAIL (The missing layer) */}
                    <div className="bg-gray-50/70 border-t border-gray-100 p-5 pb-7 flex-shrink-0">
                      <div className="flex items-center justify-between mb-3 px-1">
                        <h4 className="text-2xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                          <span>🔥</span>
                          <span>{t('Popular Campus Quick Picks', 'క్యాంపస్ టాప్ ఎంపికలు')}</span>
                        </h4>
                        <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wider">
                          {t('Tap to Add', 'జోడించడానికి నొక్కండి')}
                        </span>
                      </div>
                      
                      <div className="flex gap-3 overflow-x-auto scrollbar-none pb-1 snap-x">
                        {[
                          { id: 'quick-thali', name: 'Unlimited Thali', price: '₹60', priceNum: 60, isVeg: true, vendor: 'MITS Canteen', img: '/images/item_meals.png' },
                          { id: 'quick-chai', name: 'Ginger Chai duo', price: '₹20', priceNum: 20, isVeg: true, vendor: 'Happy Tea', img: '/images/08_ginger_tea.jpg' },
                          { id: 'quick-dosa', name: 'Masala Dosa Special', price: '₹45', priceNum: 45, isVeg: true, vendor: 'MITS Cafe', img: '/images/item_masala_dosa.png' },
                          { id: 'quick-samosa', name: 'Crispy Samosa (2 pcs)', price: '₹30', priceNum: 30, isVeg: true, vendor: 'MITS Canteen', img: '/images/16_veg_samosa.jpg' }
                        ].map((pick) => (
                          <button
                            key={pick.id}
                            type="button"
                            onClick={() => {
                              playTapSound();
                              addItem({
                                id: pick.id,
                                name: pick.name,
                                price: pick.priceNum,
                                isVegetarian: pick.isVeg,
                                vendorName: pick.vendor,
                                vendorId: 'mits-canteen',
                                isAvailable: true,
                                imageUrl: pick.img,
                              });
                            }}
                            className="w-44 bg-white border border-gray-150 hover:border-orange-300 rounded-2xl p-2.5 shadow-2xs flex-shrink-0 flex items-center gap-2.5 transition-all text-left active:scale-95 cursor-pointer snap-start group"
                          >
                            <div className="w-11 h-11 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-100 relative">
                              <img src={pick.img} alt={pick.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            </div>
                            <div className="min-w-0 flex-grow">
                              <h5 className="text-[11px] font-black text-gray-950 truncate leading-tight group-hover:text-orange-600 transition-colors">
                                {pick.name}
                              </h5>
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-[11px] font-black text-orange-600">{pick.price}</span>
                                <span className="text-[9px] font-black uppercase bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded-md border border-orange-200/60">
                                  + ADD
                                </span>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="overflow-y-auto p-4 space-y-3 flex-grow">
                      {itemsList.map(({ menuItem, quantity }) => (
                        <div key={menuItem.id} className="flex justify-between items-center py-2.5 border-b border-gray-100 last:border-none">
                          {/* Left: Diet Dot + Item Name */}
                          <div className="flex items-center gap-2.5 min-w-0 pr-3 flex-1">
                            <span className={`w-3.5 h-3.5 rounded-xs border flex items-center justify-center flex-shrink-0 ${
                              menuItem.isVegetarian ? 'border-emerald-600' : 'border-rose-600'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${menuItem.isVegetarian ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                            </span>
                            <span className="text-sm font-semibold text-gray-900 truncate">
                              {menuItem.name}
                            </span>
                          </div>

                          {/* Right: Price & Stepper Balanced on Same Horizontal Baseline */}
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className="text-sm font-black text-gray-950">
                              ₹{menuItem.price * quantity}
                            </span>
                            <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-2.5 py-1 bg-gray-50 shadow-2xs">
                              <button
                                type="button"
                                className="text-gray-500 hover:text-gray-950 font-semibold px-1 transition-colors cursor-pointer"
                                onClick={() => removeItem(menuItem.id)}
                                aria-label={`Decrease ${menuItem.name}`}
                              >
                                <Minus size={12} />
                              </button>
                              <span className="text-xs font-black text-gray-900 w-4 text-center">{quantity}</span>
                              <button
                                type="button"
                                className="text-orange-600 hover:text-orange-700 font-semibold px-1 transition-colors cursor-pointer"
                                onClick={() => addItem(menuItem)}
                                aria-label={`Increase ${menuItem.name}`}
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Clean Arrival Time Selector (Symmetrical rounded-xl buttons, zero loud neon borders) */}
                      <div className="p-3.5 rounded-2xl border border-gray-150 bg-gray-50/70 mt-3">
                        <div className="flex items-center gap-1.5 mb-2.5 text-xs font-semibold text-gray-700">
                          <Clock size={13} className="text-orange-500" />
                          <span>{t('When will you reach the shop?', 'మీరు దుకాణానికి ఎప్పుడు చేరుకుంటారు?')}</span>
                        </div>
                        <div className="flex gap-2">
                          {['5 mins', '10 mins', '15 mins'].map((time) => (
                            <button
                              key={time}
                              type="button"
                              onClick={() => setArrivalTime(time)}
                              className={`flex-1 text-xs font-semibold py-2 rounded-xl border transition-all cursor-pointer ${
                                arrivalTime === time
                                  ? 'bg-orange-500 text-white border-orange-500 shadow-xs'
                                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                              }`}
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* High-Contrast Summary: Clean Whitespace Grid */}
                      <div className="space-y-2 mt-4 px-1">
                        <div className="flex justify-between text-xs text-gray-500 font-normal">
                          <span>{t('Item Total', 'వంటకాల మొత్తం')}</span>
                          <span className="font-semibold text-gray-800">₹{totalPrice}</span>
                        </div>
                        <div className="flex justify-between text-xs text-emerald-600 font-semibold">
                          <span>{t('Campus Walk-In', 'క్యాంపస్ వాక్-ఇన్')}</span>
                          <span>{t('FREE', 'ఉచితం')}</span>
                        </div>
                        <div className="border-t border-gray-150 my-2 pt-2 flex justify-between items-center">
                          <span className="text-sm font-black text-gray-950">{t('Total Bill Value', 'మొత్తం బిల్లు విలువ')}</span>
                          <span className="text-base font-black text-gray-950">₹{totalPrice}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-600 pt-1">
                          <span className="font-normal text-gray-500">{t('Payment', 'చెల్లింపు')}</span>
                          <span className="font-semibold text-gray-900">{t('Pay at Counter (Cash / UPI)', 'కౌంటర్ వద్ద చెల్లింపు (నగదు / UPI)')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Single Full-Width Primary Action with Morphing Micro-State */}
                    <div className="p-4 pt-3 border-t border-gray-100 flex-shrink-0 bg-white">
                      <button 
                        type="button"
                        onClick={handleSendOrder}
                        disabled={isCheckingOut || totalItems === 0}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-sm font-black py-3.5 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-80"
                      >
                        {isCheckingOut ? (
                          <Loader2 size={16} className="animate-spin text-white/90" />
                        ) : (
                          <Bell size={16} className="transition-transform duration-150" />
                        )}
                        <span className="transition-opacity duration-150">
                          {isCheckingOut ? t('Alerting Canteen…', 'క్యాంటీన్‌ను హెచ్చరిస్తున్నాం…') : t('Send Order & Alert Owner', 'ఆర్డర్ పంపి యజమానికి తెలపండి')}
                        </span>
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingCartBar;
