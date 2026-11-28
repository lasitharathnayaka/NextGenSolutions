import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
  type Timestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';

export interface DbProductReview {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  user_id: string | null;
  author: string;
  initials: string;
  rating: number;
  comment: string;
  image_url?: string | null;
  date_label: string;
  verified: boolean;
  created_at?: Timestamp | null;
}

const ALL_REVIEWS_LOCAL_KEY = 'nextgen_all_product_reviews_v1';

function readAllLocalReviews(): DbProductReview[] {
  try {
    const raw = window.localStorage.getItem(ALL_REVIEWS_LOCAL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DbProductReview[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAllLocalReviews(list: DbProductReview[]) {
  try {
    window.localStorage.setItem(ALL_REVIEWS_LOCAL_KEY, JSON.stringify(list));
  } catch {
    // ignore storage quota errors
  }
}

export function subscribeProductReviews(
  productId: string,
  onUpdate: (reviews: DbProductReview[]) => void,
): () => void {
  const emitLocal = () => {
    onUpdate(readAllLocalReviews().filter((r) => r.product_id === productId));
  };
  emitLocal();

  if (!isFirebaseConfigured || !db) {
    return () => {};
  }

  const q = query(
    collection(db, 'product_reviews'),
    where('product_id', '==', productId),
  );

  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs
        .map((d) => ({
          id: d.id,
          ...(d.data() as Omit<DbProductReview, 'id'>),
        }))
        .sort((a, b) => {
          const ta = a.created_at?.toMillis?.() ?? 0;
          const tb = b.created_at?.toMillis?.() ?? 0;
          return tb - ta;
        });
      onUpdate(rows);
    },
    (err) => {
      console.error('Failed to subscribe to product reviews:', err);
      emitLocal();
    },
  );
}

export function subscribeAllReviews(
  onUpdate: (reviews: DbProductReview[]) => void,
): () => void {
  onUpdate(readAllLocalReviews());

  if (!isFirebaseConfigured || !db) {
    return () => {};
  }

  return onSnapshot(
    collection(db, 'product_reviews'),
    (snap) => {
      const rows = snap.docs
        .map((d) => ({
          id: d.id,
          ...(d.data() as Omit<DbProductReview, 'id'>),
        }))
        .sort((a, b) => {
          const ta = a.created_at?.toMillis?.() ?? 0;
          const tb = b.created_at?.toMillis?.() ?? 0;
          return tb - ta;
        });
      writeAllLocalReviews(rows);
      onUpdate(rows);
    },
    (err) => {
      console.error('Failed to subscribe to all product reviews:', err);
      onUpdate(readAllLocalReviews());
    },
  );
}

export async function createProductReview(
  review: Omit<DbProductReview, 'created_at'>,
): Promise<{ error: string | null }> {
  const existing = readAllLocalReviews();
  writeAllLocalReviews([review, ...existing.filter((r) => r.id !== review.id)]);

  if (!isFirebaseConfigured || !db) return { error: null };

  try {
    await setDoc(doc(db, 'product_reviews', review.id), {
      product_id: review.product_id,
      product_name: review.product_name,
      product_sku: review.product_sku,
      user_id: review.user_id,
      author: review.author,
      initials: review.initials,
      rating: review.rating,
      comment: review.comment,
      image_url: review.image_url ?? null,
      date_label: review.date_label,
      verified: review.verified,
      created_at: serverTimestamp(),
    });
    return { error: null };
  } catch (err) {
    return { error: (err as Error).message };
  }
}

export async function deleteProductReview(
  reviewId: string,
): Promise<{ error: string | null }> {
  const existing = readAllLocalReviews();
  writeAllLocalReviews(existing.filter((r) => r.id !== reviewId));

  if (!isFirebaseConfigured || !db) return { error: null };

  try {
    await deleteDoc(doc(db, 'product_reviews', reviewId));
    return { error: null };
  } catch (err) {
    return { error: (err as Error).message };
  }
}
