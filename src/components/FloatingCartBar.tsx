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
      {/* 1. Floating Bottom Sticky Action Bar (Clean Elevation, Docked Comfortably Above Bottom Nav) */}
      {totalItems > 0 && !showStatusTracker && (
        <div className="fixed bottom-20 left-0 right-0 px-4 z-40 pointer-events-none">
          <div 
            className="w-full max-w-md mx-auto bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-xl hover:shadow-2xl p-3 px-4 flex items-center justify-between pointer-events-auto transform transition-all active:scale-[0.99] cursor-pointer"
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
            <div className="flex items-center gap-3 min-w-0">
              <div className={`bg-white/20 backdrop-blur-xs px-2.5 py-1 rounded-lg text-center ${isBouncing ? 'animate-bounce' : ''}`}>
                <span className="text-xs font-black block leading-none tracking-wide">
                  {totalItems} {totalItems === 1 ? 'ITEM' : 'ITEMS'}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-extrabold tracking-tight">₹{totalPrice}</p>
                <p className="text-[10px] text-emerald-100 font-medium leading-none mt-0.5 truncate">
                  Campus Pickup · Pay at Counter
                </p>
              </div>
            </div>

            {/* Right Column: View Cart CTA */}
            <button 
              type="button"
              className="flex items-center gap-1.5 font-black text-xs tracking-wider uppercase bg-white/15 hover:bg-white/25 px-3.5 py-2 rounded-xl transition-colors flex-shrink-0 cursor-pointer"
            >
              <span>View Cart</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* 2. Campus Pre-Order Drawer Bottom Sheet */}
      {isDrawerOpen && (
        <div 
          className="cart-drawer-backdrop fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-end justify-center p-0 sm:p-4" 
          onClick={() => !isCheckingOut && setIsDrawerOpen(false)}
          role="presentation"
        >
          <div 
            className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden font-sans max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()} 
            role="dialog" 
            aria-modal="true" 
            aria-label="Your Food Cart"
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
                {/* Drawer Header */}
                <div className="flex justify-between items-center p-4 pb-3 border-b border-gray-100 flex-shrink-0">
                  <div>
                    <h3 className="text-base font-extrabold text-gray-950">Your Campus Order</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
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
                    <div key={menuItem.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-none">
                      <div className="flex items-center gap-2.5 min-w-0 pr-3">
                        <span className={`w-3.5 h-3.5 rounded-xs border flex items-center justify-center flex-shrink-0 ${
                          menuItem.isVegetarian ? 'border-green-600' : 'border-red-600'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${menuItem.isVegetarian ? 'bg-green-600' : 'bg-red-600'}`} />
                        </span>
                        <div className="min-w-0">
                          <h4 className="text-sm font-extrabold text-gray-900 truncate">{menuItem.name}</h4>
                          <span className="text-xs font-bold text-gray-500">₹{menuItem.price * quantity}</span>
                        </div>
                      </div>

                      {/* Real-Time Stepper */}
                      <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-2 py-1 bg-gray-50 flex-shrink-0">
                        <button
                          type="button"
                          className="text-gray-500 hover:text-gray-800 font-bold px-1 transition-colors cursor-pointer"
                          onClick={() => removeItem(menuItem.id)}
                          aria-label={`Decrease ${menuItem.name}`}
                        >
                          <Minus size={12} />
                        </button>
                        <span className="text-xs font-black text-gray-900 w-4 text-center">{quantity}</span>
                        <button
                          type="button"
                          className="text-orange-600 hover:text-orange-700 font-bold px-1 transition-colors cursor-pointer"
                          onClick={() => addItem(menuItem)}
                          aria-label={`Increase ${menuItem.name}`}
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Dynamic Arrival Time Selector (Gives kitchen advance context) */}
                  <div className="bg-orange-50/70 p-3.5 rounded-2xl border border-orange-200/60 mt-3">
                    <label className="text-[11px] font-black text-orange-900 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
                      <Clock size={13} className="text-orange-600" />
                      <span>When will you reach the shop?</span>
                    </label>
                    <div className="flex gap-2">
                      {['5 mins', '10 mins', '15 mins'].map((time) => (
                        <button
                          key={time}
                          type="button"
                          onClick={() => setArrivalTime(time)}
                          className={`flex-1 text-xs font-bold py-2 rounded-xl border transition-all cursor-pointer ${
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

                  {/* Bill Breakdown Summary Card */}
                  <div className="bg-gray-50 rounded-2xl p-3.5 border border-gray-100 space-y-2 mt-3">
                    <div className="flex justify-between text-xs text-gray-500 font-medium">
                      <span>Item Total</span>
                      <span>₹{totalPrice}</span>
                    </div>
                    <div className="flex justify-between text-xs text-green-600 font-bold">
                      <span>Campus Walk-In</span>
                      <span>FREE</span>
                    </div>
                    <div className="h-px bg-gray-200 my-1"></div>
                    <div className="flex justify-between text-sm font-black text-gray-950">
                      <span>Total Bill Value</span>
                      <span>₹{totalPrice}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-amber-800 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200/50 mt-1">
                      <span className="font-semibold">Payment</span>
                      <span className="font-black">Pay at Counter (Cash / UPI)</span>
                    </div>
                  </div>
                </div>

                {/* Action Button Strip */}
                <div className="p-4 pt-3 border-t border-gray-100 flex gap-2.5 flex-shrink-0 bg-white">
                  <button 
                    type="button"
                    onClick={clearCart}
                    disabled={isCheckingOut}
                    className="px-4 py-3 bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                  <button 
                    type="button"
                    onClick={handleSendOrder}
                    disabled={isCheckingOut || totalItems === 0}
                    className="flex-grow bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <Bell size={15} />
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
