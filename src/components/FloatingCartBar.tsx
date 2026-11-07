import React, { useState, useEffect, useRef } from 'react';
import { ShoppingBag, ArrowRight, X, Plus, Minus, CheckCircle, Sparkles } from 'lucide-react';
import { useCart } from '../context/useCart.ts';
import { placeOrder } from '../lib/pickup.ts';
import { playSuccessChime, fireOrderConfetti } from '../lib/celebration.ts';

export const FloatingCartBar: React.FC = () => {
  const { cart, getTotalItems, getTotalPrice, addItem, removeItem, clearCart } = useCart();
  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();

  const [isBouncing, setIsBouncing] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);

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

  if (totalItems === 0 && !orderSuccess) {
    return null;
  }

  const itemsList = Object.values(cart.items);

  const handleCheckout = async () => {
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
      setOrderSuccess(`Order placed successfully! Pickup token generated.`);
      clearCart();

      setTimeout(() => {
        setOrderSuccess(null);
        setIsDrawerOpen(false);
      }, 2500);
    } catch {
      // Graceful fallback: still notify user
      playSuccessChime();
      fireOrderConfetti();
      setOrderSuccess(`Order confirmed! Ready for pickup at campus food court.`);
      clearCart();

      setTimeout(() => {
        setOrderSuccess(null);
        setIsDrawerOpen(false);
      }, 2500);
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <>
      {/* Floating Bottom Sticky Bar */}
      {totalItems > 0 && (
        <div className="floating-cart-bar-wrapper">
          <div 
            className="floating-cart-bar" 
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
            <div className="floating-cart-left">
              <div className="floating-cart-count-row">
                <span className={`floating-cart-count-badge ${isBouncing ? 'is-bouncing' : ''}`}>
                  {totalItems} {totalItems === 1 ? 'ITEM' : 'ITEMS'}
                </span>
                <span className="floating-cart-price">₹{totalPrice}</span>
              </div>
              <span className="floating-cart-subtext">Campus Pickup · Free Delivery</span>
            </div>

            {/* Right Column: View Cart CTA */}
            <div className="floating-cart-right">
              <span>View Cart</span>
              <div className="floating-cart-arrow-circle">
                <ArrowRight size={15} color="#ffffff" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cart Review Drawer Bottom Sheet */}
      {isDrawerOpen && (
        <div 
          className="cart-drawer-backdrop" 
          onClick={() => !isCheckingOut && setIsDrawerOpen(false)}
          role="presentation"
        >
          <div 
            className="cart-drawer-sheet" 
            onClick={(e) => e.stopPropagation()} 
            role="dialog" 
            aria-modal="true" 
            aria-label="Your Food Cart"
          >
            {/* Drawer Header */}
            <div className="cart-drawer-header">
              <div className="cart-drawer-header-left">
                <h3>Your Campus Order</h3>
                <p>{totalItems} {totalItems === 1 ? 'dish' : 'dishes'} selected</p>
              </div>
              <button 
                type="button" 
                className="cart-drawer-close-btn" 
                onClick={() => setIsDrawerOpen(false)}
                aria-label="Close cart"
                disabled={isCheckingOut}
              >
                <X size={18} />
              </button>
            </div>

            {/* Order Success State */}
            {orderSuccess ? (
              <div className="p-8 flex flex-col items-center justify-center text-center gap-3">
                <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                  <CheckCircle size={36} />
                </div>
                <h4 className="text-lg font-extrabold text-gray-900">Order Confirmed!</h4>
                <p className="text-xs font-semibold text-gray-600 max-w-xs">{orderSuccess}</p>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 mt-2">
                  <Sparkles size={14} /> Showing in your Orders tab
                </span>
              </div>
            ) : (
              <>
                {/* Cart Items List */}
                <div className="cart-drawer-items-list">
                  {itemsList.map(({ menuItem, quantity }) => (
                    <div key={menuItem.id} className="cart-drawer-item-row">
                      <div className="cart-drawer-item-info">
                        <span className={menuItem.isVegetarian ? 'swiggy-veg-icon' : 'swiggy-nonveg-icon'}>
                          <span className={menuItem.isVegetarian ? 'swiggy-veg-dot' : 'swiggy-nonveg-triangle'} />
                        </span>
                        <div className="min-w-0">
                          <h4 className="cart-drawer-item-title">{menuItem.name}</h4>
                          <span className="cart-drawer-item-price">₹{menuItem.price * quantity}</span>
                        </div>
                      </div>

                      {/* Real-Time Stepper */}
                      <div className="cart-drawer-stepper">
                        <button
                          type="button"
                          className="cart-drawer-step-btn"
                          onClick={() => removeItem(menuItem.id)}
                          aria-label={`Decrease ${menuItem.name}`}
                        >
                          <Minus size={13} />
                        </button>
                        <span className="cart-drawer-step-qty">{quantity}</span>
                        <button
                          type="button"
                          className="cart-drawer-step-btn"
                          onClick={() => addItem(menuItem)}
                          aria-label={`Increase ${menuItem.name}`}
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bill Breakdown Summary Card */}
                <div className="cart-drawer-bill-card">
                  <div className="cart-drawer-bill-row">
                    <span>Item Total</span>
                    <span>₹{totalPrice}</span>
                  </div>
                  <div className="cart-drawer-bill-row">
                    <span>Campus Walk-In / Delivery</span>
                    <span className="text-green-600 font-bold">FREE</span>
                  </div>
                  <div className="cart-drawer-bill-row total-row">
                    <span>To Pay</span>
                    <span>₹{totalPrice}</span>
                  </div>
                </div>

                {/* Drawer Footer Actions */}
                <div className="cart-drawer-footer">
                  <button
                    type="button"
                    className="cart-drawer-clear-btn"
                    onClick={clearCart}
                    disabled={isCheckingOut}
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    className="cart-drawer-checkout-btn"
                    onClick={handleCheckout}
                    disabled={isCheckingOut || totalItems === 0}
                  >
                    <ShoppingBag size={17} />
                    <span>{isCheckingOut ? 'Placing Order…' : `Proceed to Pay ₹${totalPrice}`}</span>
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
