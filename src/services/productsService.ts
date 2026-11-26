import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, isFirebaseConfigured, storage } from '@/lib/firebase';

export interface DbProduct {
  id: string;
  slug: string;
  sku: string;
  serial_number: string | null;
  name: string;
  subtitle: string | null;
  category: 'Laptops' | 'Desktops' | 'RAM' | 'SSD / Storage' | 'Components';
  brand: string;
  condition: 'Brand New' | 'Used - Grade A' | 'Used - Grade B';
  condition_label: string;
  ram_capacity: '16GB' | '32GB' | '64GB' | null;
  price: number;
  stock: number;
  warranty: string;
  warranty_tone: 'official' | 'seller';
  specs: string[];
  image_urls: string[];
  is_featured: boolean;
  is_active: boolean;
}

export async function fetchProducts(): Promise<DbProduct[] | null> {
  if (!isFirebaseConfigured || !db) return null;
  try {
    const q = query(collection(db, 'products'), orderBy('created_at', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<DbProduct, 'id'>),
    }));
  } catch (err) {
    console.error('Failed to fetch products from Firestore:', err);
    return null;
  }
}

export async function uploadProductImage(file: File): Promise<string | null> {
  if (!isFirebaseConfigured || !storage) return null;
  try {
    const ext = file.name.split('.').pop() || 'jpg';
    const fileRef = ref(
      storage,
      `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`,
    );
    await uploadBytes(fileRef, file);
    return await getDownloadURL(fileRef);
  } catch (err) {
    console.error('Failed to upload image to Firebase Storage:', err);
    return null;
  }
}

export async function upsertProduct(
  product: Omit<DbProduct, 'id'> & { id?: string },
): Promise<{ data: DbProduct | null; error: string | null }> {
  if (!isFirebaseConfigured || !db) return { data: null, error: null };
  try {
    const docId = product.id || product.slug;
    const isEditing = Boolean(product.id);
    const { id: _ignored, ...fields } = product;
    const productRef = doc(db, 'products', docId);
    await setDoc(
      productRef,
      {
        ...fields,
        updated_at: serverTimestamp(),
        ...(isEditing ? {} : { created_at: serverTimestamp() }),
      },
      { merge: true },
    );
    return {
      data: { id: docId, ...fields },
      error: null,
    };
  } catch (err) {
    return { data: null, error: (err as Error).message };
  }
}

export async function deleteProductById(
  id: string,
): Promise<{ error: string | null }> {
  if (!isFirebaseConfigured || !db) return { error: null };
  try {
    await deleteDoc(doc(db, 'products', id));
    return { error: null };
  } catch (err) {
    return { error: (err as Error).message };
  }
}

export async function createProductReview(payload: {
  product_id: string;
  user_id?: string | null;
  author_name: string;
  author_initials: string;
  rating: number;
  comment: string;
}): Promise<{ error: string | null }> {
  if (!isFirebaseConfigured || !db) return { error: null };
  try {
    await addDoc(collection(db, 'product_reviews'), {
      ...payload,
      is_verified_buyer: true,
      created_at: serverTimestamp(),
    });
    return { error: null };
  } catch (err) {
    return { error: (err as Error).message };
  }
}
