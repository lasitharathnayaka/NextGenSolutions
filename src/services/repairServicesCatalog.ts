import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';

export type ServiceDeviceScope =
  | 'All Devices'
  | 'Laptop & Notebook'
  | 'Desktop & Workstation';

export interface RepairServicePackage {
  id: string;
  service_id: string;
  name: string;
  description: string;
  price: number;
  price_display: string;
  plus_parts: boolean;
  turnaround: string;
  device_scope: ServiceDeviceScope;
  is_active: boolean;
}

export const DEFAULT_REPAIR_SERVICES: RepairServicePackage[] = [
  {
    id: 'thermal-repaste',
    service_id: 'NGS-SRV-001',
    name: 'Full Thermal Repaste & Deep Clean',
    description:
      'Removes dust, replaces liquid metal/paste, lowers temps up to 15°C.',
    price: 7500,
    price_display: 'Rs. 7,500',
    plus_parts: false,
    turnaround: 'Est. 24–48 Hours',
    device_scope: 'All Devices',
    is_active: true,
  },
  {
    id: 'ssd-ram-upgrade',
    service_id: 'NGS-SRV-002',
    name: 'SSD/RAM Hardware Upgrade',
    description: 'Professional component installation and stress testing.',
    price: 4500,
    price_display: 'Rs. 4,500 + Parts',
    plus_parts: true,
    turnaround: 'Same Day (4–6 Hrs)',
    device_scope: 'All Devices',
    is_active: true,
  },
  {
    id: 'os-install-backup',
    service_id: 'NGS-SRV-003',
    name: 'OS Install & Data Backup',
    description:
      'Clean OS reinstallation, driver updates, and user data migration.',
    price: 6000,
    price_display: 'Rs. 6,000',
    plus_parts: false,
    turnaround: 'Est. 12–24 Hours',
    device_scope: 'All Devices',
    is_active: true,
  },
  {
    id: 'advanced-diagnostics',
    service_id: 'NGS-SRV-004',
    name: 'Advanced Hardware Diagnostics',
    description:
      'Full component bench test, motherboard short detection & report.',
    price: 3000,
    price_display: 'Rs. 3,000',
    plus_parts: false,
    turnaround: 'Est. 24 Hours',
    device_scope: 'All Devices',
    is_active: true,
  },
];

const LOCAL_STORAGE_KEY = 'nextgen_repair_services_v1';

function readLocalServices(): RepairServicePackage[] {
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return DEFAULT_REPAIR_SERVICES;
    const parsed = JSON.parse(raw) as RepairServicePackage[];
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : DEFAULT_REPAIR_SERVICES;
  } catch {
    return DEFAULT_REPAIR_SERVICES;
  }
}

function writeLocalServices(items: RepairServicePackage[]) {
  try {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore storage quota errors
  }
}

export function formatServicePriceDisplay(
  price: number,
  plusParts: boolean,
): string {
  const formatted = `Rs. ${Number(price).toLocaleString('en-US')}`;
  return plusParts ? `${formatted} + Parts` : formatted;
}

export function generateNextServiceId(
  existing: RepairServicePackage[],
): string {
  const pattern = /^NGS-SRV-(\d+)$/i;
  let maxNum = 0;
  for (const item of existing) {
    const m = item.service_id.trim().match(pattern);
    if (m) {
      const n = parseInt(m[1], 10);
      if (!Number.isNaN(n) && n > maxNum) maxNum = n;
    }
  }
  return `NGS-SRV-${String(maxNum + 1).padStart(3, '0')}`;
}

export function subscribeRepairServices(
  onUpdate: (services: RepairServicePackage[]) => void,
): () => void {
  // Emit local/default list immediately so UI never flashes empty
  onUpdate(readLocalServices());

  if (!isFirebaseConfigured || !db) {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === LOCAL_STORAGE_KEY) onUpdate(readLocalServices());
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }

  return onSnapshot(
    collection(db, 'repair_services'),
    (snap) => {
      if (snap.empty) {
        onUpdate(readLocalServices());
        return;
      }
      const rows = snap.docs
        .map((d) => ({
          id: d.id,
          ...(d.data() as Omit<RepairServicePackage, 'id'>),
        }))
        .sort((a, b) => a.service_id.localeCompare(b.service_id));
      writeLocalServices(rows);
      onUpdate(rows);
    },
    (err) => {
      console.error('Failed to subscribe to repair_services:', err);
      onUpdate(readLocalServices());
    },
  );
}

export async function upsertRepairService(
  service: RepairServicePackage,
  currentList: RepairServicePackage[],
): Promise<{ error: string | null }> {
  const nextList = currentList.some((s) => s.id === service.id)
    ? currentList.map((s) => (s.id === service.id ? service : s))
    : [...currentList, service];
  writeLocalServices(nextList);

  if (!isFirebaseConfigured || !db) return { error: null };
  try {
    await setDoc(
      doc(db, 'repair_services', service.id),
      {
        service_id: service.service_id,
        name: service.name,
        description: service.description,
        price: service.price,
        price_display: service.price_display,
        plus_parts: service.plus_parts,
        turnaround: service.turnaround,
        device_scope: service.device_scope,
        is_active: service.is_active,
        updated_at: serverTimestamp(),
      },
      { merge: true },
    );
    return { error: null };
  } catch (err) {
    return { error: (err as Error).message };
  }
}

export async function deleteRepairService(
  id: string,
  currentList: RepairServicePackage[],
): Promise<{ error: string | null }> {
  const nextList = currentList.filter((s) => s.id !== id);
  writeLocalServices(nextList);

  if (!isFirebaseConfigured || !db) return { error: null };
  try {
    await deleteDoc(doc(db, 'repair_services', id));
    return { error: null };
  } catch (err) {
    return { error: (err as Error).message };
  }
}
