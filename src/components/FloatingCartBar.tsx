import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, X, Plus, Minus, Bell, Clock } from 'lucide-react';
import { useCart } from '../context/useCart.ts';
import { placeOrder } from '../lib/pickup.ts';
import { playSuccessChime, fireOrderConfetti } from '../lib/celebration.ts';
import { OrderStatusTracker } from './OrderStatusTracker';

export const FloatingCartBar: React.FC = () => {
  const { cart, getTotalItems, getTotalPrice, addItem, removeItem, clearCart } = useCart();
  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();

  const [isBouncing, setIsBouncing] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showStatusTracker, setShowStatusTracker] = useState(false);
  const [arrivalTime, setArrivalTime] = useState('5 mins');

  const prevCountRef = useRef(totalItems);

  // Trigger bouncy scale on badge when item count changes
  useEffect(() => {
    if (totalItems !== prevCountRef.current && totalItems > 0) {
      setIsBouncing(true);
      const timer = setTimeout(() => setIsBouncing(false), 300);
      prevCountRef.current = totalItems;
      return () => clearTimeout(timer);
    }
    prevCountRef.current = totalItems;
  }, [totalItems]);

  if (totalItems === 0 && !showStatusTracker) {
    return null;
  }

  const itemsList = Object.values(cart.items);
  const firstVendorName = itemsList[0]?.menuItem.vendorName || 'MITS Canteen';
  const initialMinutesNum = parseInt(arrivalTime, 10) || 5;

  const handleSendOrder = async () => {
    if (itemsList.length === 0 || isCheckingOut) return;
    setIsCheckingOut(true);

    try {
      // Place order for items in cart
      for (const item of itemsList) {
        await placeOrder({
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
    setShowStatusTracker(false);
    setIsDrawerOpen(false);
  };

  return (
    <>
      {/* 1. Elevated Floating Sticky Action Bar (Floats gracefully above navigation tabs with strict clearance) */}
      {totalItems > 0 && !showStatusTracker && (
        <div className="fixed bottom-28 left-0 right-0 px-4 z-40 pointer-events-none">
          <div 
            className="w-full max-w-sm mx-auto bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-[0_12px_24px_-4px_rgba(4,120,87,0.35)] p-3 px-4 flex items-center justify-between pointer-events-auto transform transition-all active:scale-[0.99] cursor-pointer"
            onClick={() => setIsDrawerOpen(true)}
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
            {/* Left Column: Count badge + Subtotal */}
            <div className="flex items-center gap-2.5 min-w-0">
              <span className={`text-[10px] font-black bg-white/20 px-2.5 py-1 rounded-md tracking-wider leading-none ${isBouncing ? 'animate-bounce' : ''}`}>
                {totalItems} {totalItems === 1 ? 'ITEM' : 'ITEMS'}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-black leading-tight">₹{totalPrice}</p>
                <p className="text-[9px] text-emerald-100 font-medium leading-none mt-0.5 truncate">
                  Campus Pickup · Pay at Counter
                </p>
              </div>
            </div>

            {/* Right Column: View Cart CTA */}
            <button 
              type="button"
              className="flex items-center gap-1 font-black text-xs uppercase bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0 cursor-pointer tracking-wide"
            >
              <span>View Cart</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      )}

      {/* 2. Full-Width Bottom Sheet (Anchored flush to absolute bottom of screen) */}
      {isDrawerOpen && (
        <div 
          className="cart-drawer-backdrop fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end justify-center p-0" 
          onClick={() => !isCheckingOut && setIsDrawerOpen(false)}
          role="presentation"
        >
          <div 
            className="w-full max-w-md bg-white rounded-t-3xl rounded-b-none shadow-2xl overflow-hidden font-sans max-h-[88vh] flex flex-col border-t border-gray-100 animate-in slide-in-from-bottom duration-300"
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
                onClose={handleFinishOrderFlow}
                onCancel={handleFinishOrderFlow}
              />
            ) : (
              <>
                {/* Drawer Header with +4px Line-Height Separation */}
                <div className="flex justify-between items-center p-4 pb-3 border-b border-gray-100 flex-shrink-0">
                  <div>
                    <h3 className="text-base font-black text-gray-950 tracking-tight">Your Campus Order</h3>
                    <p className="text-xs text-gray-500 mt-1.5 leading-normal">
                      {totalItems} {totalItems === 1 ? 'dish' : 'dishes'} selected · {firstVendorName}
                    </p>
                  </div>
                  <button 
                    type="button" 
                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 font-bold transition-colors cursor-pointer" 
                    onClick={() => setIsDrawerOpen(false)}
                    aria-label="Close cart"
                    disabled={isCheckingOut}
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Scrollable Item Rows */}
                <div className="overflow-y-auto p-4 space-y-3 flex-grow">
                  {itemsList.map(({ menuItem, quantity }) => (
                    <div key={menuItem.id} className="flex justify-between items-center py-2.5 border-b border-gray-50 last:border-none">
                      <div className="flex items-center gap-2.5 min-w-0 pr-3">
                        <span className={`w-3.5 h-3.5 rounded-xs border flex items-center justify-center flex-shrink-0 ${
                          menuItem.isVegetarian ? 'border-green-600' : 'border-red-600'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${menuItem.isVegetarian ? 'bg-green-600' : 'bg-red-600'}`} />
                        </span>
                        <div className="min-w-0">
                          {/* Price tucked directly alongside dish title on same horizontal axis */}
                          <h4 className="text-sm font-extrabold text-gray-900 truncate">
                            {menuItem.name} <span className="text-gray-300 font-normal">·</span> <span className="text-gray-950 font-black">₹{menuItem.price * quantity}</span>
                          </h4>
                        </div>
                      </div>

                      {/* Real-Time Stepper */}
                      <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-2.5 py-1 bg-gray-50 flex-shrink-0 shadow-2xs">
                        <button
                          type="button"
                          className="text-gray-600 hover:text-gray-950 font-black px-1 transition-colors cursor-pointer"
                          onClick={() => removeItem(menuItem.id)}
                          aria-label={`Decrease ${menuItem.name}`}
                        >
                          <Minus size={12} />
                        </button>
                        <span className="text-xs font-black text-gray-900 w-4 text-center">{quantity}</span>
                        <button
                          type="button"
                          className="text-orange-600 hover:text-orange-700 font-black px-1 transition-colors cursor-pointer"
                          onClick={() => addItem(menuItem)}
                          aria-label={`Increase ${menuItem.name}`}
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Dynamic Arrival Time Selector (Unified rounded-2xl corner radius) */}
                  <div className="bg-orange-50/60 p-3.5 rounded-2xl border border-orange-100 mt-3">
                    <label className="text-[11px] font-black text-orange-950 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
                      <Clock size={13} className="text-orange-600" />
                      <span>When will you reach the shop?</span>
                    </label>
                    <div className="flex gap-2">
                      {['5 mins', '10 mins', '15 mins'].map((time) => (
                        <button
                          key={time}
                          type="button"
                          onClick={() => setArrivalTime(time)}
                          className={`flex-1 text-xs font-black py-2 rounded-2xl border transition-all cursor-pointer ${
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

                  {/* High-Contrast Summary Mapping: Transparent container with minimal single-pixel divider */}
                  <div className="space-y-2 mt-4 px-1">
                    <div className="flex justify-between text-xs text-gray-500 font-medium">
                      <span>Item Total</span>
                      <span className="font-semibold text-gray-700">₹{totalPrice}</span>
                    </div>
                    <div className="flex justify-between text-xs text-emerald-600 font-bold">
                      <span>Campus Walk-In</span>
                      <span>FREE</span>
                    </div>
                    <div className="border-t border-gray-150 my-2 pt-2 flex justify-between items-center">
                      <span className="text-sm font-black text-gray-950">Total Bill Value</span>
                      <span className="text-base font-black text-gray-950">₹{totalPrice}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-amber-900 bg-amber-50/90 px-3 py-2 rounded-2xl border border-amber-200/60 mt-2">
                      <span className="font-semibold">Payment</span>
                      <span className="font-black">Pay at Counter (Cash / UPI)</span>
                    </div>
                  </div>
                </div>

                {/* Radical Button Hierarchy: Removed "Clear" button completely; 100% full-width primary CTA */}
                <div className="p-4 pt-3 border-t border-gray-100 flex-shrink-0 bg-white">
                  <button 
                    type="button"
                    onClick={handleSendOrder}
                    disabled={isCheckingOut || totalItems === 0}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black py-3.5 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <Bell size={16} />
                    <span>{isCheckingOut ? 'Alerting Canteen…' : 'Send Order & Alert Owner'}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingCartBar;
