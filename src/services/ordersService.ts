import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Timestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';

export interface PlaceOrderInput {
  orderNumber: string;
  userId?: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress: string;
  subtotal: number;
  shippingFee: number;
  tax: number;
  total: number;
  items: {
    productId?: string;
    name: string;
    quantity: number;
    unitPrice: number;
  }[];
}

export interface DbOrderRecord {
  id: string;
  order_number: string;
  user_id?: string | null;
  customer_name: string;
  customer_email: string;
  shipping_address?: string;
  total: number;
  payment_status: string;
  fulfillment_status: 'Processing' | 'Shipped (FedEx)' | 'Delivered' | 'Cancelled';
  order_items?: {
    product_id?: string | null;
    item_name: string;
    quantity: number;
    unit_price: number;
  }[];
  created_at?: Timestamp | null;
}

export async function placeOrder(
  input: PlaceOrderInput,
): Promise<{ error: string | null }> {
  if (!isFirebaseConfigured || !db) return { error: null };
  try {
    await setDoc(doc(db, 'orders', input.orderNumber), {
      order_number: input.orderNumber,
      user_id: input.userId ?? null,
      customer_name: input.customerName,
      customer_email: input.customerEmail,
      customer_phone: input.customerPhone ?? null,
      shipping_address: input.shippingAddress,
      subtotal: input.subtotal,
      shipping_fee: input.shippingFee,
      tax: input.tax,
      total: input.total,
      payment_status: 'Pending (WhatsApp)',
      fulfillment_status: 'Processing',
      order_items: input.items.map((item) => ({
        product_id: item.productId ?? null,
        item_name: item.name,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        line_total: Number((item.unitPrice * item.quantity).toFixed(2)),
      })),
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
    return { error: null };
  } catch (err) {
    return { error: (err as Error).message };
  }
}

export async function fetchOrders(): Promise<DbOrderRecord[] | null> {
  if (!isFirebaseConfigured || !db) return null;
  try {
    const q = query(collection(db, 'orders'), orderBy('created_at', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<DbOrderRecord, 'id'>),
    }));
  } catch (err) {
    console.error('Failed to fetch orders:', err);
    return null;
  }
}

export function subscribeUserOrders(
  userId: string,
  onUpdate: (orders: DbOrderRecord[]) => void,
): () => void {
  if (!isFirebaseConfigured || !db || !userId) {
    onUpdate([]);
    return () => {};
  }
  const q = query(collection(db, 'orders'), where('user_id', '==', userId));
  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<DbOrderRecord, 'id'>),
      }));
      rows.sort((a, b) => {
        const ta = a.created_at?.toMillis?.() ?? 0;
        const tb = b.created_at?.toMillis?.() ?? 0;
        return tb - ta;
      });
      onUpdate(rows);
    },
    (err) => {
      console.error('Failed to subscribe to user orders:', err);
    },
  );
}

export async function updateOrderFulfillment(
  orderNumber: string,
  fulfillmentStatus: DbOrderRecord['fulfillment_status'],
): Promise<{ error: string | null }> {
  if (!isFirebaseConfigured || !db) return { error: null };
  try {
    await updateDoc(doc(db, 'orders', orderNumber), {
      fulfillment_status: fulfillmentStatus,
      updated_at: serverTimestamp(),
    });
    return { error: null };
  } catch (err) {
    return { error: (err as Error).message };
  }
}
