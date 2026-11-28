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

export interface SavedAddress {
  id: string;
  user_id: string;
  label: string;
  recipient_name: string;
  phone: string;
  street_address: string;
  city: string;
  is_default: boolean;
  created_at?: Timestamp | null;
}

function localKey(userId: string) {
  return `nextgen_saved_addresses_${userId}`;
}

function readLocalAddresses(userId: string): SavedAddress[] {
  try {
    const raw = window.localStorage.getItem(localKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedAddress[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalAddresses(userId: string, list: SavedAddress[]) {
  try {
    window.localStorage.setItem(localKey(userId), JSON.stringify(list));
  } catch {
    // ignore storage errors
  }
}

export function subscribeUserAddresses(
  userId: string,
  onUpdate: (addresses: SavedAddress[]) => void,
): () => void {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  onUpdate(readLocalAddresses(userId));

  if (!isFirebaseConfigured || !db) {
    return () => {};
  }

  const q = query(
    collection(db, 'saved_addresses'),
    where('user_id', '==', userId),
  );

  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs
        .map((d) => ({
          id: d.id,
          ...(d.data() as Omit<SavedAddress, 'id'>),
        }))
        .sort((a, b) => {
          if (a.is_default !== b.is_default) return a.is_default ? -1 : 1;
          const ta = a.created_at?.toMillis?.() ?? 0;
          const tb = b.created_at?.toMillis?.() ?? 0;
          return tb - ta;
        });
      writeLocalAddresses(userId, rows);
      onUpdate(rows);
    },
    (err) => {
      console.error('Failed to subscribe to saved_addresses:', err);
      onUpdate(readLocalAddresses(userId));
    },
  );
}

export async function saveUserAddress(
  address: Omit<SavedAddress, 'created_at'>,
  existingList: SavedAddress[],
): Promise<{ error: string | null }> {
  const nextList = existingList.some((a) => a.id === address.id)
    ? existingList.map((a) =>
        a.id === address.id
          ? address
          : address.is_default
            ? { ...a, is_default: false }
            : a,
      )
    : [
        ...(address.is_default
          ? existingList.map((a) => ({ ...a, is_default: false }))
          : existingList),
        address,
      ];

  writeLocalAddresses(address.user_id, nextList);

  if (!isFirebaseConfigured || !db) return { error: null };

  try {
    if (address.is_default) {
      const others = existingList.filter(
        (a) => a.id !== address.id && a.is_default,
      );
      await Promise.all(
        others.map((other) =>
          setDoc(
            doc(db!, 'saved_addresses', other.id),
            { is_default: false, updated_at: serverTimestamp() },
            { merge: true },
          ),
        ),
      );
    }

    await setDoc(
      doc(db, 'saved_addresses', address.id),
      {
        user_id: address.user_id,
        label: address.label,
        recipient_name: address.recipient_name,
        phone: address.phone,
        street_address: address.street_address,
        city: address.city,
        is_default: address.is_default,
        updated_at: serverTimestamp(),
        ...(existingList.some((a) => a.id === address.id)
          ? {}
          : { created_at: serverTimestamp() }),
      },
      { merge: true },
    );
    return { error: null };
  } catch (err) {
    return { error: (err as Error).message };
  }
}

export async function deleteUserAddress(
  userId: string,
  addressId: string,
  existingList: SavedAddress[],
): Promise<{ error: string | null }> {
  writeLocalAddresses(
    userId,
    existingList.filter((a) => a.id !== addressId),
  );
  if (!isFirebaseConfigured || !db) return { error: null };
  try {
    await deleteDoc(doc(db, 'saved_addresses', addressId));
    return { error: null };
  } catch (err) {
    return { error: (err as Error).message };
  }
}
