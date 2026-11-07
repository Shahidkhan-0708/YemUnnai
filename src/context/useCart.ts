import { useContext } from 'react';
import { CartContext } from './cartContextInstance.ts';
import type { CartContextType } from '../types/menu.ts';

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used inside a structured CartProvider');
  }
  return context;
};
