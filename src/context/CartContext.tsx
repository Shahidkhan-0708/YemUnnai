import React, { useEffect, useState } from 'react';
import type { MenuItem, CartState } from '../types/menu.ts';
import { CartContext } from './cartContextInstance.ts';

const CART_STORAGE_KEY = 'mits_campus_cart';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartState>(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      return savedCart ? JSON.parse(savedCart) : { items: {} };
    } catch {
      return { items: {} };
    }
  });

  // Automatically persist cart changes in background
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // Storage quota or sandboxed iframe fallback
    }
  }, [cart]);

  const getItemQuantity = (id: string): number => {
    return cart.items[id]?.quantity || 0;
  };

  const addItem = (item: MenuItem) => {
    setCart((prevCart) => {
      const existing = prevCart.items[item.id];
      const updatedItems = { ...prevCart.items };

      if (existing) {
        updatedItems[item.id] = {
          ...existing,
          quantity: existing.quantity + 1,
        };
      } else {
        updatedItems[item.id] = {
          menuItem: item,
          quantity: 1,
        };
      }

      return { items: updatedItems };
    });
  };

  const removeItem = (id: string) => {
    setCart((prevCart) => {
      const existing = prevCart.items[id];
      if (!existing) return prevCart;

      const updatedItems = { ...prevCart.items };
      if (existing.quantity <= 1) {
        delete updatedItems[id];
      } else {
        updatedItems[id] = {
          ...existing,
          quantity: existing.quantity - 1,
        };
      }

      return { items: updatedItems };
    });
  };

  const clearCart = () => {
    setCart({ items: {} });
  };

  const getTotalItems = (): number => {
    return Object.values(cart.items).reduce((acc, item) => acc + item.quantity, 0);
  };

  const getTotalPrice = (): number => {
    return Object.values(cart.items).reduce((acc, item) => acc + (item.menuItem.price * item.quantity), 0);
  };

  return (
    <CartContext.Provider value={{
      cart,
      getItemQuantity,
      addItem,
      removeItem,
      clearCart,
      getTotalItems,
      getTotalPrice
    }}>
      {children}
    </CartContext.Provider>
  );
};
