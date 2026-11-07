import { createContext } from 'react';
import type { CartContextType } from '../types/menu.ts';

export const CartContext = createContext<CartContextType | undefined>(undefined);
