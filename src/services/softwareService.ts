import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
  writeBatch,
  doc,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';

export interface DbSoftwareProduct {
  id: string;
  slug: string;
  name: string;
  vendor: string;
  category: 'OS' | 'Productivity' | 'Security' | 'Creative & Dev';
  platform: string;
  description: string;
  features: string[];
  price_label: string;
  price: number;
  icon: string;
  batch_code: string;
  is_wide_featured: boolean;
}

export interface DbAssignedLicenseKey {
  id: string;
  license_key: string;
  batch_code: string;
  status: string;
  hardware_id: string | null;
  software_name?: string;
}

export async function fetchSoftwareProducts(): Promise<DbSoftwareProduct[] | null> {
  if (!isFirebaseConfigured || !db) return null;
  try {
    const q = query(
      collection(db, 'software_products'),
      where('is_active', '==', true),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<DbSoftwareProduct, 'id'>),
    }));
  } catch (err) {
    console.error('Failed to fetch software products:', err);
    return null;
  }
}

export async function addSoftwareKeysToBatch(payload: {
  software_product_id: string;
  software_name?: string;
  batch_code: string;
  keys: string[];
}): Promise<{ error: string | null }> {
  if (!isFirebaseConfigured || !db) return { error: null };
  const firestore = db;
  try {
    const batch = writeBatch(firestore);
    payload.keys.forEach((key) => {
      const keyRef = doc(collection(firestore, 'software_license_keys'));
      batch.set(keyRef, {
        software_product_id: payload.software_product_id,
        software_name: payload.software_name ?? '',
        batch_code: payload.batch_code,
        license_key: key,
        status: 'available',
        assigned_to_user_id: null,
        created_at: serverTimestamp(),
      });
    });
    await batch.commit();
    return { error: null };
  } catch (err) {
    return { error: (err as Error).message };
  }
}

export async function createSoftwareProductWithKeys(payload: {
  name: string;
  platform: string;
  price: number;
  batch_code: string;
  keys: string[];
}): Promise<{ error: string | null }> {
  if (!isFirebaseConfigured || !db) return { error: null };
  try {
    const slug = payload.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const docRef = await addDoc(collection(db, 'software_products'), {
      slug: `${slug}-${Date.now().toString().slice(-4)}`,
      name: payload.name,
      vendor: 'Enterprise Retail',
      category: 'Productivity',
      platform: payload.platform,
      description: `Verified digital retail license for ${payload.name}.`,
      features: ['Instant Key Delivery', 'Official Updates', '24/7 Support'],
      price_label: 'Retail Price',
      price: payload.price,
      icon: 'monitor',
      batch_code: payload.batch_code,
      is_active: true,
      created_at: serverTimestamp(),
    });

    return await addSoftwareKeysToBatch({
      software_product_id: docRef.id,
      software_name: payload.name,
      batch_code: payload.batch_code,
      keys: payload.keys,
    });
  } catch (err) {
    return { error: (err as Error).message };
  }
}

export async function fetchCustomerAssignedKeys(
  userId: string,
): Promise<DbAssignedLicenseKey[] | null> {
  if (!isFirebaseConfigured || !db) return null;
  try {
    const q = query(
      collection(db, 'software_license_keys'),
      where('assigned_to_user_id', '==', userId),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<DbAssignedLicenseKey, 'id'>),
    }));
  } catch (err) {
    console.error('Failed to fetch assigned license keys:', err);
    return null;
  }
}
