import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface SimpleCartItem {
  id: string;
  name: string;
  price: number;
  priceSuffix?: string;
  image: string;
  quantity: number;
}

interface CartContextValue {
  items: SimpleCartItem[];
  totalItems: number;
  addToCart: (item: Omit<SimpleCartItem, 'quantity'>) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

function getCartStorageKey(uid?: string | null) {
  return `ngs_cart_${uid || 'guest'}`;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const storageKey = getCartStorageKey(user?.uid);

  const [items, setItems] = useState<SimpleCartItem[]>(() => {
    try {
      const raw = localStorage.getItem(getCartStorageKey(user?.uid));
      return raw ? (JSON.parse(raw) as SimpleCartItem[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      setItems(raw ? (JSON.parse(raw) as SimpleCartItem[]) : []);
    } catch {
      setItems([]);
    }
  }, [storageKey]);

  const persist = (next: SimpleCartItem[]) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // Ignore storage quota errors
    }
  };

  const addToCart = (item: Omit<SimpleCartItem, 'quantity'>) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      const next = existing
        ? prev.map((i) =>
            i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i,
          )
        : [...prev, { ...item, quantity: 1 }];
      persist(next);
      return next;
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    setItems((prev) => {
      const next =
        quantity <= 0
          ? prev.filter((i) => i.id !== id)
          : prev.map((i) => (i.id === id ? { ...i, quantity } : i));
      persist(next);
      return next;
    });
  };

  const removeFromCart = (id: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.id !== id);
      persist(next);
      return next;
    });
  };

  const clearCart = () => {
    setItems([]);
    persist([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return ctx;
}
