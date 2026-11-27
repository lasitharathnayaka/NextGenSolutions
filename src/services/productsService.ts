import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
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

export function subscribeProducts(
  onUpdate: (products: DbProduct[]) => void,
): () => void {
  if (!isFirebaseConfigured || !db) {
    onUpdate([]);
    return () => {};
  }
  const q = query(collection(db, 'products'));
  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<DbProduct, 'id'>),
      }));
      onUpdate(rows);
    },
    (err) => {
      console.error('Failed to subscribe to products:', err);
    },
  );
}

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as
  | string
  | undefined;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env
  .VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined;

export async function uploadProductImage(file: File): Promise<string | null> {
  // Primary: Cloudinary unsigned upload (Free tier, no credit card needed)
  if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      formData.append('folder', 'nextgensolutions/products');

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        },
      );
      if (!res.ok) {
        throw new Error(`Cloudinary upload failed (${res.status})`);
      }
      const data = (await res.json()) as { secure_url?: string };
      if (data.secure_url) {
        // Inject automatic format & quality optimization for fast loading
        return data.secure_url.replace('/upload/', '/upload/f_auto,q_auto/');
      }
    } catch (err) {
      console.error('Failed to upload image to Cloudinary:', err);
    }
  }

  // Fallback: Firebase Storage (if Blaze plan is enabled)
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
