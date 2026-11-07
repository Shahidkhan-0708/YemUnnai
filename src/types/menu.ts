export interface MenuItem {
  id: string;
  name: string;
  price: number;
  isVegetarian: boolean;
  imageUrl?: string;
  vendorId: string;
  vendorName: string;
  isAvailable: boolean;
  description?: string;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

export interface CartState {
  items: Record<string, CartItem>;
}

export interface CartContextType {
  cart: CartState;
  getItemQuantity: (id: string) => number;
  addItem: (item: MenuItem) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}
