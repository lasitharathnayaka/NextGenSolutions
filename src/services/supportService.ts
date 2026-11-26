import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
  type Timestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';

export interface DbSupportTicket {
  id: string;
  ticket_number: string;
  user_id?: string | null;
  full_name: string;
  email: string;
  topic: string;
  reference_id?: string | null;
  message: string;
  status: 'Open' | 'In Progress' | 'Resolved';
  created_at?: Timestamp | null;
}

export async function submitSupportTicket(payload: {
  ticketNumber: string;
  userId?: string | null;
  fullName: string;
  email: string;
  topic: string;
  referenceId?: string;
  message: string;
}): Promise<{ error: string | null }> {
  if (!isFirebaseConfigured || !db) return { error: null };
  try {
    await setDoc(doc(db, 'support_tickets', payload.ticketNumber), {
      ticket_number: payload.ticketNumber,
      user_id: payload.userId ?? null,
      full_name: payload.fullName,
      email: payload.email,
      topic: payload.topic,
      reference_id: payload.referenceId || null,
      message: payload.message,
      status: 'Open',
      created_at: serverTimestamp(),
    });
    return { error: null };
  } catch (err) {
    return { error: (err as Error).message };
  }
}

export function subscribeUserSupportTickets(
  userId: string,
  onUpdate: (tickets: DbSupportTicket[]) => void,
): () => void {
  if (!isFirebaseConfigured || !db || !userId) {
    onUpdate([]);
    return () => {};
  }
  const q = query(
    collection(db, 'support_tickets'),
    where('user_id', '==', userId),
  );
  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<DbSupportTicket, 'id'>),
      }));
      rows.sort((a, b) => {
        const ta = a.created_at?.toMillis?.() ?? 0;
        const tb = b.created_at?.toMillis?.() ?? 0;
        return tb - ta;
      });
      onUpdate(rows);
    },
    (err) => {
      console.error('Failed to subscribe to support tickets:', err);
    },
  );
}

export async function subscribeNewsletter(
  email: string,
): Promise<{ error: string | null }> {
  if (!isFirebaseConfigured || !db) return { error: null };
  try {
    const normalized = email.trim().toLowerCase();
    await setDoc(
      doc(db, 'newsletter_subscribers', normalized),
      {
        email: normalized,
        created_at: serverTimestamp(),
      },
      { merge: true },
    );
    return { error: null };
  } catch (err) {
    return { error: (err as Error).message };
  }
}
