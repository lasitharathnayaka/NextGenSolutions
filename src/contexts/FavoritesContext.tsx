import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface FavoriteItem {
  id: string;
  name: string;
  price: number;
  priceSuffix?: string;
  image: string;
  badge?: string;
  category?: string;
  warranty?: string;
  href: string;
}

interface FavoritesContextValue {
  favorites: FavoriteItem[];
  totalFavorites: number;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (item: FavoriteItem) => void;
  removeFavorite: (id: string) => void;
  clearFavorites: () => void;
}

const FavoritesContext = createContext<FavoritesContextValue | undefined>(
  undefined,
);

function getStorageKey(uid?: string | null) {
  return `ngs_favorites_${uid || 'guest'}`;
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const storageKey = getStorageKey(user?.uid);

  const [favorites, setFavorites] = useState<FavoriteItem[]>(() => {
    try {
      const raw = localStorage.getItem(getStorageKey(user?.uid));
      return raw ? (JSON.parse(raw) as FavoriteItem[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      setFavorites(raw ? (JSON.parse(raw) as FavoriteItem[]) : []);
    } catch {
      setFavorites([]);
    }
  }, [storageKey]);

  const persist = (next: FavoriteItem[]) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // Ignore storage quota errors
    }
  };

  const isFavorite = (id: string) => favorites.some((item) => item.id === id);

  const toggleFavorite = (item: FavoriteItem) => {
    setFavorites((prev) => {
      const exists = prev.some((f) => f.id === item.id);
      const next = exists
        ? prev.filter((f) => f.id !== item.id)
        : [item, ...prev];
      persist(next);
      return next;
    });
  };

  const removeFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = prev.filter((f) => f.id !== id);
      persist(next);
      return next;
    });
  };

  const clearFavorites = () => {
    setFavorites([]);
    persist([]);
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        totalFavorites: favorites.length,
        isFavorite,
        toggleFavorite,
        removeFavorite,
        clearFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return ctx;
}
