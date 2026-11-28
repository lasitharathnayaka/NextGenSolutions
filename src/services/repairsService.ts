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

export interface CreateRepairBookingInput {
  ticketNumber: string;
  userId?: string | null;
  customerId?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  customerAddress?: string | null;
  deviceType: 'laptop' | 'desktop';
  servicePackage: string;
  brandModel: string;
  serialNumber?: string;
  issueDescription: string;
  logisticsType: 'drop-off' | 'courier';
  pickupAddress?: string;
  preferredDate: string;
  timeSlot: string;
  subtotal: number;
  tax: number;
  totalDue: number;
}

export interface DbRepairBooking {
  id: string;
  ticket_number: string;
  customer_id?: string | null;
  customer_name: string | null;
  customer_phone?: string | null;
  customer_address?: string | null;
  brand_model: string;
  service_package: string;
  issue_description: string;
  lead_engineer: string;
  technician_notes: string | null;
  stage: 'Received' | 'Diagnosing' | 'In Repair' | 'Ready for Pickup' | 'Completed';
  total_due: number;
  estimate_approved: boolean;
  created_at?: Timestamp | null;
}

export async function createRepairBooking(
  input: CreateRepairBookingInput,
): Promise<{ error: string | null }> {
  if (!isFirebaseConfigured || !db) return { error: null };
  try {
    await setDoc(doc(db, 'repair_bookings', input.ticketNumber), {
      ticket_number: input.ticketNumber,
      user_id: input.userId ?? null,
      customer_id: input.customerId ?? null,
      customer_name: input.customerName ?? null,
      customer_email: input.customerEmail ?? null,
      customer_phone: input.customerPhone ?? null,
      customer_address: input.customerAddress ?? null,
      device_type: input.deviceType,
      service_package: input.servicePackage,
      brand_model: input.brandModel,
      serial_number: input.serialNumber || null,
      issue_description: input.issueDescription,
      logistics_type: input.logisticsType,
      pickup_address: input.pickupAddress || null,
      preferred_date: input.preferredDate,
      time_slot: input.timeSlot,
      subtotal: input.subtotal,
      tax: input.tax,
      total_due: input.totalDue,
      stage: 'Received',
      lead_engineer: 'Marcus Vance',
      technician_notes:
        'Device booked at Piliyandala Service Hub. Queued for diagnostic bench test.',
      estimate_approved: false,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
    return { error: null };
  } catch (err) {
    return { error: (err as Error).message };
  }
}

export async function fetchRepairBookings(): Promise<DbRepairBooking[] | null> {
  if (!isFirebaseConfigured || !db) return null;
  try {
    const q = query(
      collection(db, 'repair_bookings'),
      orderBy('created_at', 'desc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<DbRepairBooking, 'id'>),
    }));
  } catch (err) {
    console.error('Failed to fetch repair bookings:', err);
    return null;
  }
}

export function subscribeUserRepairs(
  userId: string,
  onUpdate: (repairs: DbRepairBooking[]) => void,
): () => void {
  if (!isFirebaseConfigured || !db || !userId) {
    onUpdate([]);
    return () => {};
  }
  const q = query(
    collection(db, 'repair_bookings'),
    where('user_id', '==', userId),
  );
  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<DbRepairBooking, 'id'>),
      }));
      rows.sort((a, b) => {
        const ta = a.created_at?.toMillis?.() ?? 0;
        const tb = b.created_at?.toMillis?.() ?? 0;
        return tb - ta;
      });
      onUpdate(rows);
    },
    (err) => {
      console.error('Failed to subscribe to user repairs:', err);
    },
  );
}

export async function updateRepairStage(
  ticketNumber: string,
  stage: DbRepairBooking['stage'],
): Promise<{ error: string | null }> {
  if (!isFirebaseConfigured || !db) return { error: null };
  try {
    await updateDoc(doc(db, 'repair_bookings', ticketNumber), {
      stage,
      updated_at: serverTimestamp(),
    });
    return { error: null };
  } catch (err) {
    return { error: (err as Error).message };
  }
}

export async function approveRepairEstimate(
  ticketNumber: string,
): Promise<{ error: string | null }> {
  if (!isFirebaseConfigured || !db) return { error: null };
  try {
    await updateDoc(doc(db, 'repair_bookings', ticketNumber), {
      estimate_approved: true,
      updated_at: serverTimestamp(),
    });
    return { error: null };
  } catch (err) {
    return { error: (err as Error).message };
  }
}
