import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const CART_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours (1 day)

export interface SimpleCartItem {
  id: string;
  sku?: string;
  name: string;
  price: number;
  priceSuffix?: string;
  image: string;
  quantity: number;
  addedAt?: number;
}

interface CartContextValue {
  items: SimpleCartItem[];
  totalItems: number;
  expiredRemovedCount: number;
  dismissExpiredNotice: () => void;
  addToCart: (item: Omit<SimpleCartItem, 'quantity' | 'addedAt'>) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

function getCartStorageKey(uid?: string | null) {
  return `ngs_cart_${uid || 'guest'}`;
}

function pruneExpiredCartItems(list: SimpleCartItem[]): {
  active: SimpleCartItem[];
  removedCount: number;
} {
  const now = Date.now();
  const active: SimpleCartItem[] = [];
  let removedCount = 0;

  for (const item of list) {
    const timestamp = item.addedAt ?? now;
    if (now - timestamp >= CART_EXPIRY_MS) {
      removedCount += item.quantity;
    } else {
      active.push({ ...item, addedAt: timestamp });
    }
  }

  return { active, removedCount };
}

function readAndPruneCart(key: string): {
  active: SimpleCartItem[];
  removedCount: number;
} {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { active: [], removedCount: 0 };
    const parsed = JSON.parse(raw) as SimpleCartItem[];
    const result = pruneExpiredCartItems(parsed);
    if (result.removedCount > 0) {
      localStorage.setItem(key, JSON.stringify(result.active));
    }
    return result;
  } catch {
    return { active: [], removedCount: 0 };
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const storageKey = getCartStorageKey(user?.uid);

  const [items, setItems] = useState<SimpleCartItem[]>(
    () => readAndPruneCart(getCartStorageKey(user?.uid)).active,
  );
  const [expiredRemovedCount, setExpiredRemovedCount] = useState<number>(0);

  const persist = (next: SimpleCartItem[]) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // Ignore storage quota errors
    }
  };

  // Load & prune when user changes
  useEffect(() => {
    const { active, removedCount } = readAndPruneCart(storageKey);
    setItems(active);
    if (removedCount > 0) {
      setExpiredRemovedCount(removedCount);
    }
  }, [storageKey]);

  // Periodically prune expired items (every 60s and when tab regains focus)
  useEffect(() => {
    const checkExpiry = () => {
      setItems((prev) => {
        const { active, removedCount } = pruneExpiredCartItems(prev);
        if (removedCount > 0) {
          persist(active);
          setExpiredRemovedCount((c) => c + removedCount);
          return active;
        }
        return prev;
      });
    };

    const interval = window.setInterval(checkExpiry, 60_000);
    window.addEventListener('focus', checkExpiry);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', checkExpiry);
    };
  }, [storageKey]);

  const addToCart = (item: Omit<SimpleCartItem, 'quantity' | 'addedAt'>) => {
    const now = Date.now();
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      const next = existing
        ? prev.map((i) =>
            i.id === item.id
              ? { ...i, quantity: i.quantity + 1, addedAt: now }
              : i,
          )
        : [...prev, { ...item, quantity: 1, addedAt: now }];
      persist(next);
      return next;
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    const now = Date.now();
    setItems((prev) => {
      const next =
        quantity <= 0
          ? prev.filter((i) => i.id !== id)
          : prev.map((i) =>
              i.id === id ? { ...i, quantity, addedAt: now } : i,
            );
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
        expiredRemovedCount,
        dismissExpiredNotice: () => setExpiredRemovedCount(0),
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
