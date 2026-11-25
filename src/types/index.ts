export type UserRole = 'customer' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  avatar_url?: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image_url?: string | null;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compare_at_price?: number | null;
  stock: number;
  category_id: string | null;
  image_urls: string[];
  is_featured?: boolean;
  is_active: boolean;
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
