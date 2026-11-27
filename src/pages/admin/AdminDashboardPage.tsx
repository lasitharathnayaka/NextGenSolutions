import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  Download,
  Plus,
  Wallet,
  AlertTriangle,
  KeyRound,
  Wrench,
  Package,
  Gauge,
  ShoppingCart,
  Search,
  List,
  LayoutGrid,
  Pencil,
  Trash2,
  X,
  Check,
  TrendingUp,
  Sparkles,
  Upload,
  ImagePlus,
  Link2,
  Mail,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { isFirebaseConfigured } from '@/lib/firebase';
import {
  deleteProductById,
  fetchProducts,
  uploadProductImage,
  upsertProduct,
  type DbProduct,
} from '@/services/productsService';
import { createSoftwareProductWithKeys } from '@/services/softwareService';
import { fetchRepairBookings, updateRepairStage } from '@/services/repairsService';
import { fetchOrders, updateOrderFulfillment } from '@/services/ordersService';
import {
  fetchNewsletterSubscribers,
  type DbSubscriber,
} from '@/services/supportService';

type AdminTab = 'inventory' | 'vault' | 'tickets' | 'orders' | 'subscribers';
type ConditionFilter = 'All' | 'Brand New' | 'Used - Grade A' | 'Used - Grade B';

interface AdminInventoryItem {
  id: string;
  name: string;
  subtitle: string;
  category: 'Laptops' | 'Storage' | 'Components' | 'Desktops';
  condition: 'Brand New' | 'Used - Grade A' | 'Used - Grade B';
  sku: string;
  serial: string;
  stock: number;
  price: number;
  warranty: string;
  image: string;
}

interface ServiceTicketItem {
  id: string;
  customer: string;
  device: string;
  issue: string;
  engineer: string;
  stage: 'Received' | 'Diagnosing' | 'In Repair' | 'Ready for Pickup';
  estimate: string;
}

interface CustomerOrderItem {
  id: string;
  customer: string;
  items: string;
  total: string;
  payment: string;
  fulfillment: 'Processing' | 'Shipped (FedEx)' | 'Delivered';
}

const INITIAL_INVENTORY: AdminInventoryItem[] = [
  {
    id: 'inv-1',
    name: 'Dell XPS 15 Creator Edition',
    subtitle: 'Intel i7-13700H, 32GB RAM',
    category: 'Laptops',
    condition: 'Brand New',
    sku: 'NGS-8842',
    serial: 'C02G901NMD6R',
    stock: 14,
    price: 449000,
    warranty: '1 Yr Warranty',
    image: '/images/dell-xps-15.jpg',
  },
  {
    id: 'inv-2',
    name: 'Samsung 990 PRO 2TB NVMe',
    subtitle: 'PCIe 4.0 M.2 SSD w/ Heatsink',
    category: 'Storage',
    condition: 'Used - Grade A',
    sku: 'NGS-3310',
    serial: 'S6XYNL0W20149',
    stock: 3,
    price: 51000,
    warranty: '6 Mo Seller',
    image: '/images/quantum-nvme.jpg',
  },
  {
    id: 'inv-3',
    name: 'NVIDIA GeForce RTX 4070 Ti',
    subtitle: '12GB GDDR6X Graphics Card',
    category: 'Components',
    condition: 'Brand New',
    sku: 'NGS-9921',
    serial: 'NV4070TI-8812',
    stock: 0,
    price: 239000,
    warranty: '3 Yr Warranty',
    image: '/images/titan-x-pro.jpg',
  },
  {
    id: 'inv-4',
    name: 'Apple MacBook Pro 16" M3 Max',
    subtitle: '36GB Unified Memory, 1TB SSD',
    category: 'Laptops',
    condition: 'Brand New',
    sku: 'NGS-1102',
    serial: 'FVFCX0XYZQ6L',
    stock: 8,
    price: 1049000,
    warranty: '1 Yr Warranty',
    image: '/images/apex-ultrabook.jpg',
  },
  {
    id: 'inv-5',
    name: 'Corsair Vengeance 32GB DDR5',
    subtitle: 'DDR5-5600MHz Desktop Memory Kit',
    category: 'Components',
    condition: 'Used - Grade A',
    sku: 'NGS-5540',
    serial: 'CR5600K-9901',
    stock: 22,
    price: 34500,
    warranty: 'Lifetime',
    image: '/images/kingston-fury-ram.jpg',
  },
  {
    id: 'inv-6',
    name: 'Lenovo ThinkPad X1 Carbon Gen 11',
    subtitle: '32GB LPDDR5, 1TB NVMe',
    category: 'Laptops',
    condition: 'Used - Grade A',
    sku: 'NGS-4412',
    serial: 'LNX1C11-4402',
    stock: 5,
    price: 269000,
    warranty: '6 Mo Seller',
    image: '/images/thinkpad-x1.jpg',
  },
  {
    id: 'inv-7',
    name: 'HP Omen 45L Gaming Workstation',
    subtitle: '32GB DDR5, 2TB NVMe, RTX 4080',
    category: 'Desktops',
    condition: 'Brand New',
    sku: 'NGS-9011',
    serial: 'HP45L-9011A',
    stock: 2,
    price: 749000,
    warranty: '2 Yr Warranty',
    image: '/images/hp-omen-45l.jpg',
  },
];

interface VaultBatchItem {
  id: string;
  product: string;
  platform: string;
  price: number;
  batch: string;
  available: number;
  assigned: number;
  status: 'Healthy' | 'Low Stock';
  keys: string[];
}

const INITIAL_VAULT_KEYS: VaultBatchItem[] = [
  {
    id: 'vk-1',
    product: 'Windows 11 Pro (Retail)',
    platform: 'Windows Platform',
    price: 14500,
    batch: 'BATCH-2026-W11',
    available: 640,
    assigned: 185,
    status: 'Healthy',
    keys: ['W11P8-9K4M2-7Q9X3-89A2F'],
  },
  {
    id: 'vk-2',
    product: 'Microsoft Office 2024 Pro Plus',
    platform: 'Win / Mac',
    price: 18500,
    batch: 'BATCH-2026-OFF',
    available: 412,
    assigned: 94,
    status: 'Healthy',
    keys: ['OFF24-7N2V9-5P8C1-4419B'],
  },
  {
    id: 'vk-3',
    product: 'Kaspersky Total Security (5-Device)',
    platform: 'Multi-Platform',
    price: 9500,
    batch: 'BATCH-2026-KSP',
    available: 290,
    assigned: 62,
    status: 'Healthy',
    keys: ['KASP3-4M8Q2-1R6T5-9912X'],
  },
  {
    id: 'vk-4',
    product: 'Visual Studio 2022 Enterprise',
    platform: 'Windows Enterprise',
    price: 295000,
    batch: 'BATCH-2026-VS',
    available: 78,
    assigned: 19,
    status: 'Low Stock',
    keys: ['VS22E-8P3M1-6K9W4-77D2A'],
  },
];

const INITIAL_TICKETS: ServiceTicketItem[] = [
  {
    id: 'NGS-4092',
    customer: 'Alex Miller',
    device: 'Dell XPS 15 9530',
    issue: 'Thermal Repaste & SSD Upgrade',
    engineer: 'Marcus Vance',
    stage: 'In Repair',
    estimate: 'Rs. 13,500.00',
  },
  {
    id: 'NGS-4098',
    customer: 'Priya Silva',
    device: 'MacBook Pro 14" M2',
    issue: 'USB-C Controller Diagnostics',
    engineer: 'Elena Rostova',
    stage: 'Diagnosing',
    estimate: 'Rs. 7,500.00',
  },
  {
    id: 'NGS-4104',
    customer: 'David Chen',
    device: 'Custom RTX 4080 Workstation',
    issue: 'Liquid Cooler Pump Replacement',
    engineer: 'Marcus Vance',
    stage: 'Ready for Pickup',
    estimate: 'Rs. 40,500.00',
  },
];

const INITIAL_ORDERS: CustomerOrderItem[] = [
  {
    id: 'NGS-8842',
    customer: 'Alex Miller',
    items: 'Dell XPS 15 Creator Edition',
    total: 'Rs. 449,000.00',
    payment: 'Paid',
    fulfillment: 'Shipped (FedEx)',
  },
  {
    id: 'NGS-8845',
    customer: 'Nadia Fernando',
    items: 'Kingston Fury Beast 32GB DDR5 × 2',
    total: 'Rs. 77,000.00',
    payment: 'Paid',
    fulfillment: 'Processing',
  },
  {
    id: 'NGS-8710',
    customer: 'Alex Miller',
    items: 'Samsung 990 PRO 2TB NVMe',
    total: 'Rs. 56,500.00',
    payment: 'Paid',
    fulfillment: 'Delivered',
  },
];

const TICKET_STAGE_ORDER: ServiceTicketItem['stage'][] = [
  'Received',
  'Diagnosing',
  'In Repair',
  'Ready for Pickup',
];

const ORDER_STAGE_ORDER: CustomerOrderItem['fulfillment'][] = [
  'Processing',
  'Shipped (FedEx)',
  'Delivered',
];

const ITEMS_PER_PAGE = 5;

export function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('inventory');
  const [inventory, setInventory] = useState<AdminInventoryItem[]>(INITIAL_INVENTORY);
  const [vaultBatches, setVaultBatches] = useState<VaultBatchItem[]>(INITIAL_VAULT_KEYS);
  const [tickets, setTickets] = useState<ServiceTicketItem[]>(INITIAL_TICKETS);
  const [orders, setOrders] = useState<CustomerOrderItem[]>(INITIAL_ORDERS);
  const [subscribers, setSubscribers] = useState<DbSubscriber[]>([]);

  // Sync live data from Supabase when .env credentials are configured
  useEffect(() => {
    if (!isFirebaseConfigured) return;

    fetchProducts().then((rows) => {
      if (rows && rows.length > 0) {
        setInventory(
          rows.map((r) => ({
            id: r.id,
            name: r.name,
            subtitle: r.subtitle ?? '',
            category: r.category === 'RAM' || r.category === 'SSD / Storage' ? 'Storage' : r.category,
            condition: r.condition,
            sku: r.sku,
            serial: r.serial_number ?? 'N/A',
            stock: r.stock,
            price: Number(r.price),
            warranty: r.warranty,
            image: r.image_urls[0] ?? '/images/dell-xps-15.jpg',
          })),
        );
      }
    });

    fetchRepairBookings().then((rows) => {
      if (rows && rows.length > 0) {
        setTickets(
          rows.map((r) => ({
            id: r.ticket_number,
            customer: r.customer_name ?? 'Customer',
            device: r.brand_model,
            issue: r.service_package,
            engineer: r.lead_engineer,
            stage: r.stage === 'Completed' ? 'Ready for Pickup' : r.stage,
            estimate: `Rs. ${Number(r.total_due).toFixed(2)}`,
          })),
        );
      }
    });

    fetchOrders().then((rows) => {
      if (rows && rows.length > 0) {
        setOrders(
          rows.map((r) => ({
            id: r.order_number,
            customer: r.customer_name,
            items:
              r.order_items?.map((i) => `${i.item_name} × ${i.quantity}`).join(', ') ||
              'Hardware Order',
            total: `Rs. ${Number(r.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
            payment: r.payment_status,
            fulfillment:
              r.fulfillment_status === 'Cancelled' ? 'Processing' : r.fulfillment_status,
          })),
        );
      }
    });

    fetchNewsletterSubscribers().then((rows) => {
      if (rows) setSubscribers(rows);
    });
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [conditionFilter, setConditionFilter] = useState<ConditionFilter>('All');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Add / Edit Product Modal State
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AdminInventoryItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formSubtitle, setFormSubtitle] = useState('');
  const [formCategory, setFormCategory] =
    useState<AdminInventoryItem['category']>('Laptops');
  const [formCondition, setFormCondition] =
    useState<AdminInventoryItem['condition']>('Brand New');
  const [formSku, setFormSku] = useState('');
  const [formSerial, setFormSerial] = useState('');
  const [formStock, setFormStock] = useState('10');
  const [formPrice, setFormPrice] = useState('999');
  const [formWarranty, setFormWarranty] = useState('1 Yr Warranty');
  const [formImages, setFormImages] = useState<string[]>(['/images/dell-xps-15.jpg']);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // Add Software & Keys Modal State
  const [softwareModalOpen, setSoftwareModalOpen] = useState(false);
  const [targetBatchId, setTargetBatchId] = useState<string | null>(null);
  const [swProductName, setSwProductName] = useState('');
  const [swPlatform, setSwPlatform] = useState('Windows Platform');
  const [swPrice, setSwPrice] = useState('199');
  const [swBatchCode, setSwBatchCode] = useState('');
  const [swKeysInput, setSwKeysInput] = useState('');

  const filteredInventory = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return inventory.filter((item) => {
      if (conditionFilter !== 'All' && item.condition !== conditionFilter) {
        return false;
      }
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.serial.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    });
  }, [inventory, searchQuery, conditionFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredInventory.length / ITEMS_PER_PAGE),
  );
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
  const paginatedInventory = filteredInventory.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  const lowStockCount = useMemo(
    () => inventory.filter((i) => i.stock <= 3).length,
    [inventory],
  );

  const totalVaultKeys = useMemo(
    () => vaultBatches.reduce((sum, b) => sum + b.available, 0),
    [vaultBatches],
  );

  const parsedNewKeys = useMemo(
    () =>
      swKeysInput
        .split(/[\n,]+/)
        .map((k) => k.trim())
        .filter(Boolean),
    [swKeysInput],
  );

  const openAddSoftwareModal = (existingBatch?: VaultBatchItem) => {
    if (existingBatch) {
      setTargetBatchId(existingBatch.id);
      setSwProductName(existingBatch.product);
      setSwPlatform(existingBatch.platform);
      setSwPrice(String(existingBatch.price));
      setSwBatchCode(existingBatch.batch);
    } else {
      setTargetBatchId(null);
      setSwProductName('');
      setSwPlatform('Windows Platform');
      setSwPrice('199');
      setSwBatchCode(`BATCH-2026-${Math.floor(100 + Math.random() * 900)}`);
    }
    setSwKeysInput('');
    setSoftwareModalOpen(true);
  };

  const handleSaveSoftwareKeys = async (e: FormEvent) => {
    e.preventDefault();
    if (!swProductName.trim() || parsedNewKeys.length === 0) return;

    if (!targetBatchId && isFirebaseConfigured) {
      await createSoftwareProductWithKeys({
        name: swProductName.trim(),
        platform: swPlatform.trim() || 'Multi-Platform',
        price: Math.max(0, Number(swPrice) || 0),
        batch_code: swBatchCode.trim() || `BATCH-${Date.now()}`,
        keys: parsedNewKeys,
      });
    }

    if (targetBatchId) {
      setVaultBatches((prev) =>
        prev.map((b) => {
          if (b.id !== targetBatchId) return b;
          const nextAvailable = b.available + parsedNewKeys.length;
          return {
            ...b,
            available: nextAvailable,
            status: nextAvailable < 100 ? 'Low Stock' : 'Healthy',
            keys: [...b.keys, ...parsedNewKeys],
          };
        }),
      );
    } else {
      const nextAvailable = parsedNewKeys.length;
      const newBatch: VaultBatchItem = {
        id: `vk-${Date.now()}`,
        product: swProductName.trim(),
        platform: swPlatform.trim() || 'Multi-Platform',
        price: Math.max(0, Number(swPrice) || 0),
        batch: swBatchCode.trim() || `BATCH-${Date.now()}`,
        available: nextAvailable,
        assigned: 0,
        status: nextAvailable < 100 ? 'Low Stock' : 'Healthy',
        keys: parsedNewKeys,
      };
      setVaultBatches((prev) => [newBatch, ...prev]);
    }
    setSoftwareModalOpen(false);
  };

  const generateNextSku = (
    category: AdminInventoryItem['category'],
    items: AdminInventoryItem[],
  ) => {
    const prefixMap: Record<AdminInventoryItem['category'], string> = {
      Laptops: 'NGS-LAP',
      Desktops: 'NGS-DSK',
      Storage: 'NGS-STG',
      Components: 'NGS-CMP',
    };
    const prefix = prefixMap[category];
    const existingNums = items
      .map((i) => {
        const match = i.sku.match(new RegExp(`^${prefix}-(\\d+)$`, 'i'));
        return match ? Number(match[1]) : 0;
      })
      .filter((n) => n > 0);
    const nextNum = (existingNums.length > 0 ? Math.max(...existingNums) : 0) + 1;
    return `${prefix}-${String(nextNum).padStart(3, '0')}`;
  };

  const openAddModal = () => {
    const defaultCategory: AdminInventoryItem['category'] = 'Laptops';
    setEditingItem(null);
    setFormName('');
    setFormSubtitle('');
    setFormCategory(defaultCategory);
    setFormCondition('Brand New');
    setFormSku(generateNextSku(defaultCategory, inventory));
    setFormSerial(`SN-${Math.floor(100000 + Math.random() * 900000)}`);
    setFormStock('10');
    setFormPrice('150000');
    setFormWarranty('1 Yr Warranty');
    setFormImages(['/images/dell-xps-15.jpg']);
    setImageUrlInput('');
    setProductModalOpen(true);
  };

  const openEditModal = (item: AdminInventoryItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormSubtitle(item.subtitle);
    setFormCategory(item.category);
    setFormCondition(item.condition);
    setFormSku(item.sku);
    setFormSerial(item.serial);
    setFormStock(String(item.stock));
    setFormPrice(String(item.price));
    setFormWarranty(item.warranty);
    setFormImages([item.image]);
    setImageUrlInput('');
    setProductModalOpen(true);
  };

  const handleImageFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;

      // Upload to Supabase Storage when configured; otherwise use local Data URL preview
      if (isFirebaseConfigured) {
        const publicUrl = await uploadProductImage(file);
        if (publicUrl) {
          setFormImages((prev) => [...prev, publicUrl]);
          continue;
        }
      }

      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setFormImages((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddImageUrl = () => {
    const trimmed = imageUrlInput.trim();
    if (!trimmed) return;
    setFormImages((prev) => [...prev, trimmed]);
    setImageUrlInput('');
  };

  const handleSetPrimaryImage = (idx: number) => {
    setFormImages((prev) => {
      if (idx === 0 || idx >= prev.length) return prev;
      const chosen = prev[idx];
      return [chosen, ...prev.filter((_, i) => i !== idx)];
    });
  };

  const handleRemoveFormImage = (idx: number) => {
    setFormImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSaveProduct = async (e: FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const payload: AdminInventoryItem = {
      id: editingItem ? editingItem.id : `inv-${Date.now()}`,
      name: formName.trim(),
      subtitle: formSubtitle.trim() || 'Enterprise Hardware Unit',
      category: formCategory,
      condition: formCondition,
      sku: formSku.trim() || 'NGS-0000',
      serial: formSerial.trim() || 'N/A',
      stock: Math.max(0, Number(formStock) || 0),
      price: Math.max(0, Number(formPrice) || 0),
      warranty: formWarranty.trim() || '1 Yr Warranty',
      image: formImages[0] ?? '/images/dell-xps-15.jpg',
    };

    if (isFirebaseConfigured) {
      const slug = payload.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      await upsertProduct({
        slug: `${slug}-${payload.sku.toLowerCase()}`,
        sku: payload.sku,
        serial_number: payload.serial,
        name: payload.name,
        subtitle: payload.subtitle,
        category: payload.category === 'Storage' ? 'SSD / Storage' : payload.category,
        brand: payload.name.split(' ')[0] || 'NextGen',
        condition: payload.condition,
        condition_label: payload.condition,
        ram_capacity: null,
        price: payload.price,
        stock: payload.stock,
        warranty: payload.warranty,
        warranty_tone: payload.condition === 'Brand New' ? 'official' : 'seller',
        specs: payload.subtitle.split(',').map((s) => s.trim()).filter(Boolean),
        image_urls: formImages.length > 0 ? formImages : [payload.image],
        is_featured: false,
        is_active: true,
      });
    }

    if (editingItem) {
      setInventory((prev) =>
        prev.map((i) => (i.id === editingItem.id ? payload : i)),
      );
    } else {
      setInventory((prev) => [payload, ...prev]);
      setCurrentPage(1);
    }
    setProductModalOpen(false);
  };

  const [togglingStockId, setTogglingStockId] = useState<string | null>(null);
  const [inventoryBanner, setInventoryBanner] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleToggleStock = async (item: AdminInventoryItem) => {
    const currentlyInStock = item.stock > 0;
    const nextStock = currentlyInStock ? 0 : 5;
    const slug = item.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const dbCategory: DbProduct['category'] =
      item.category === 'Storage' ? 'SSD / Storage' : item.category;

    setInventoryBanner(null);
    setTogglingStockId(item.id);
    setInventory((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, stock: nextStock } : i)),
    );

    const { error } = await upsertProduct({
      id: item.id,
      slug,
      sku: item.sku,
      serial_number: item.serial,
      name: item.name,
      subtitle: item.subtitle,
      category: dbCategory,
      brand: item.name.split(' ')[0] || 'NextGen',
      condition: item.condition,
      condition_label: item.condition,
      ram_capacity: null,
      price: item.price,
      stock: nextStock,
      warranty: item.warranty,
      warranty_tone: item.warranty.toLowerCase().includes('seller')
        ? 'seller'
        : 'official',
      specs: item.subtitle
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      image_urls: [item.image],
      is_featured: false,
      is_active: true,
    });

    setTogglingStockId(null);

    if (error) {
      setInventory((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, stock: item.stock } : i)),
      );
      setInventoryBanner({
        type: 'error',
        text: `Failed to update stock for ${item.name}: ${error}`,
      });
    } else {
      setInventoryBanner({
        type: 'success',
        text: `${item.name} marked as "${nextStock > 0 ? 'In Stock' : 'Out of Stock'}" and synced to customer store.`,
      });
    }
  };

  const handleDeleteProduct = async (id: string) => {
    setInventory((prev) => prev.filter((item) => item.id !== id));
    await deleteProductById(id);
  };

  const [savingTicketId, setSavingTicketId] = useState<string | null>(null);
  const [ticketStatusBanner, setTicketStatusBanner] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleTicketStageChange = async (
    id: string,
    nextStageValue: ServiceTicketItem['stage'],
  ) => {
    const previous = tickets.find((t) => t.id === id)?.stage;
    if (!previous || previous === nextStageValue) return;

    setTicketStatusBanner(null);
    setSavingTicketId(id);
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, stage: nextStageValue } : t)),
    );

    const { error } = await updateRepairStage(id, nextStageValue);
    setSavingTicketId(null);

    if (error) {
      setTickets((prev) =>
        prev.map((t) => (t.id === id ? { ...t, stage: previous } : t)),
      );
      setTicketStatusBanner({
        type: 'error',
        text: `Failed to update ticket #${id}: ${error}`,
      });
    } else {
      setTicketStatusBanner({
        type: 'success',
        text: `Repair ticket #${id} updated to "${nextStageValue}" and synced to customer dashboard.`,
      });
    }
  };

  const [savingOrderId, setSavingOrderId] = useState<string | null>(null);
  const [orderStatusBanner, setOrderStatusBanner] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleOrderStatusChange = async (
    id: string,
    nextStageValue: CustomerOrderItem['fulfillment'],
  ) => {
    const previous = orders.find((o) => o.id === id)?.fulfillment;
    if (!previous || previous === nextStageValue) return;

    setOrderStatusBanner(null);
    setSavingOrderId(id);
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, fulfillment: nextStageValue } : o)),
    );

    const { error } = await updateOrderFulfillment(id, nextStageValue);
    setSavingOrderId(null);

    if (error) {
      // Revert optimistic update if Firestore rejected the write
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, fulfillment: previous } : o)),
      );
      setOrderStatusBanner({
        type: 'error',
        text: `Failed to save #${id}: ${error}`,
      });
    } else {
      setOrderStatusBanner({
        type: 'success',
        text: `Order #${id} updated to "${nextStageValue}" and synced to customer dashboard.`,
      });
    }
  };

  const handleExportCsv = () => {
    const headers = [
      'Name',
      'Specs',
      'Category',
      'Condition',
      'SKU',
      'Serial',
      'Stock',
      'Price',
      'Warranty',
    ];
    const rows = filteredInventory.map((i) => [
      `"${i.name}"`,
      `"${i.subtitle}"`,
      i.category,
      i.condition,
      i.sku,
      i.serial,
      String(i.stock),
      i.price.toFixed(2),
      `"${i.warranty}"`,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nextgen-inventory-report.csv';
    a.click();
    URL.revokeObjectURL(url);

    setExportSuccess(true);
    window.setTimeout(() => setExportSuccess(false), 1800);
  };

  return (
    <div className="bg-[#f8fafc] pb-14">
      {/* Dark-Navy Enterprise Control Center Hero Header */}
      <section className="relative overflow-hidden bg-[#0a1220] border-b border-slate-800/80 pt-8 pb-20 sm:pt-10 sm:pb-24">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-sky-500/15 blur-3xl"
        />
        <div
          aria-hidden="true"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(56, 189, 248, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(56, 189, 248, 0.05) 1px, transparent 1px)',
            backgroundSize: '36px 36px',
          }}
          className="pointer-events-none absolute inset-0"
        />

        <div className="relative mx-auto flex max-w-7xl flex-col justify-between gap-5 px-4 sm:flex-row sm:items-end sm:px-6 lg:px-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Enterprise Control Center · Live</span>
            </div>
            <h1 className="mt-2.5 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Admin &amp; Technician Operations
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Piliyandala Service Hub · Manage hardware stock, digital license
              batches, repair queues, and customer fulfillment.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700/80 bg-[#121e31] px-4 py-2.5 text-xs font-semibold text-slate-200 hover:border-slate-600 hover:bg-[#182840] transition cursor-pointer"
            >
              {exportSuccess ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Exported CSV</span>
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5 text-sky-400" />
                  <span>Export Reports</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#0284c7] to-[#0ea5e9] px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-sky-500/20 hover:from-[#0369a1] hover:to-[#0284c7] transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add New Product</span>
            </button>
          </div>
        </div>
      </section>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Overlapping 4 KPI Summary Cards */}
        <div className="-mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Total Revenue */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm hover:shadow-md transition">
            <div className="flex items-start justify-between">
              <p className="text-xs font-semibold text-slate-500">
                Total Revenue
              </p>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-[#0284c7]">
                <Wallet className="h-4.5 w-4.5" />
              </span>
            </div>
            <p className="mt-2.5 text-2xl font-extrabold tracking-tight text-slate-900">
              Rs. 38,535,000
            </p>
            <div className="mt-3 flex items-center gap-2 text-[11px]">
              <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 font-bold text-emerald-600">
                <TrendingUp className="h-3 w-3" />
                <span>+14%</span>
              </span>
              <span className="text-slate-400">vs last month</span>
            </div>
          </div>

          {/* Card 2: Hardware Stock Alerts */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm hover:shadow-md transition">
            <div className="flex items-start justify-between">
              <p className="text-xs font-semibold text-slate-500">
                Hardware Stock Alerts
              </p>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <AlertTriangle className="h-4.5 w-4.5" />
              </span>
            </div>
            <p className="mt-2.5 text-2xl font-extrabold tracking-tight text-slate-900">
              {lowStockCount} Items
            </p>
            <div className="mt-3 flex items-center gap-2 text-[11px]">
              <span className="rounded-full bg-amber-50 px-2 py-0.5 font-bold text-amber-700">
                Low Stock / Out
              </span>
              <span className="text-slate-400">Action required</span>
            </div>
          </div>

          {/* Card 3: Software Key Vault */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm hover:shadow-md transition">
            <div className="flex items-start justify-between">
              <p className="text-xs font-semibold text-slate-500">
                Software Key Vault
              </p>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <KeyRound className="h-4.5 w-4.5" />
              </span>
            </div>
            <p className="mt-2.5 text-2xl font-extrabold tracking-tight text-slate-900">
              {totalVaultKeys.toLocaleString('en-US')}
            </p>
            <div className="mt-3 flex items-center gap-2 text-[11px]">
              <span className="rounded-full bg-sky-50 px-2 py-0.5 font-bold text-[#0284c7]">
                Available
              </span>
              <span className="text-slate-400">Unassigned retail keys</span>
            </div>
          </div>

          {/* Card 4: Open Repair Tickets */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm hover:shadow-md transition">
            <div className="flex items-start justify-between">
              <p className="text-xs font-semibold text-slate-500">
                Open Repair Tickets
              </p>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-[#0284c7]">
                <Wrench className="h-4.5 w-4.5" />
              </span>
            </div>
            <p className="mt-2.5 text-2xl font-extrabold tracking-tight text-slate-900">
              18 Active
            </p>
            <div className="mt-3 flex items-center gap-2 text-[11px]">
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-bold text-emerald-600">
                On Track
              </span>
              <span className="text-slate-400">Customer repairs</span>
            </div>
          </div>
        </div>

        {/* Modern Pill Section Tabs */}
        <div className="mt-7 inline-flex flex-wrap items-center gap-1 rounded-xl border border-slate-200/80 bg-white p-1.5 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab('inventory')}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition cursor-pointer',
              activeTab === 'inventory'
                ? 'bg-[#0284c7] text-white shadow-xs'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
            )}
          >
            <Package className="h-3.5 w-3.5" />
            <span>Inventory (Hardware)</span>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[10px] font-bold',
                activeTab === 'inventory'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 text-slate-500',
              )}
            >
              {inventory.length === INITIAL_INVENTORY.length
                ? 244
                : 244 + (inventory.length - INITIAL_INVENTORY.length)}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('vault')}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition cursor-pointer',
              activeTab === 'vault'
                ? 'bg-[#0284c7] text-white shadow-xs'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
            )}
          >
            <KeyRound className="h-3.5 w-3.5" />
            <span>Software Key Vault</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tickets')}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition cursor-pointer',
              activeTab === 'tickets'
                ? 'bg-[#0284c7] text-white shadow-xs'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
            )}
          >
            <Gauge className="h-3.5 w-3.5" />
            <span>Service Tickets</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition cursor-pointer',
              activeTab === 'orders'
                ? 'bg-[#0284c7] text-white shadow-xs'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
            )}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            <span>Customer Orders</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('subscribers')}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition cursor-pointer',
              activeTab === 'subscribers'
                ? 'bg-[#0284c7] text-white shadow-xs'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
            )}
          >
            <Mail className="h-3.5 w-3.5" />
            <span>Subscribers</span>
            <span
              className={cn(
                'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                activeTab === 'subscribers'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 text-slate-600',
              )}
            >
              {subscribers.length}
            </span>
          </button>
        </div>

        {/* Tab 1: Hardware Inventory Table Card */}
        {activeTab === 'inventory' && (
          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
            {/* Toolbar */}
            <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
              <div className="flex flex-1 flex-wrap items-center gap-3">
                <div className="relative w-full max-w-xs">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Search SKU, serial number, or product name..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2 pl-8.5 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>

                <select
                  aria-label="Filter by condition"
                  value={conditionFilter}
                  onChange={(e) => {
                    setConditionFilter(e.target.value as ConditionFilter);
                    setCurrentPage(1);
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-sky-500 focus:outline-none cursor-pointer"
                >
                  <option value="All">Condition: All</option>
                  <option value="Brand New">Condition: Brand New</option>
                  <option value="Used - Grade A">Condition: Used - Grade A</option>
                  <option value="Used - Grade B">Condition: Used - Grade B</option>
                </select>
              </div>

              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <span className="text-[11px] font-medium text-slate-400">
                  Showing {filteredInventory.length === 0 ? 0 : startIndex + 1}
                  -{Math.min(startIndex + ITEMS_PER_PAGE, filteredInventory.length)}{' '}
                  of {filteredInventory.length} items
                </span>

                <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    aria-label="Table view"
                    className={cn(
                      'rounded-md p-1.5 transition cursor-pointer',
                      viewMode === 'list'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-400 hover:text-slate-700',
                    )}
                  >
                    <List className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    aria-label="Grid view"
                    className={cn(
                      'rounded-md p-1.5 transition cursor-pointer',
                      viewMode === 'grid'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-400 hover:text-slate-700',
                    )}
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Table or Grid */}
            {inventoryBanner && (
              <div
                className={cn(
                  'mx-5 mt-4 rounded-xl border px-4 py-2.5 text-xs font-semibold',
                  inventoryBanner.type === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-rose-200 bg-rose-50 text-rose-700',
                )}
              >
                {inventoryBanner.text}
              </div>
            )}

            {viewMode === 'list' ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[940px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="px-5 py-3">Thumbnail &amp; Product Name</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Condition</th>
                      <th className="px-4 py-3">Serial / SKU</th>
                      <th className="px-4 py-3">Stock &amp; Availability</th>
                      <th className="px-4 py-3">Price</th>
                      <th className="px-4 py-3">Warranty</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedInventory.map((item) => {
                      const isOut = item.stock === 0;
                      const isLow = item.stock > 0 && item.stock <= 3;

                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-50/70 transition"
                        >
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="h-11 w-11 shrink-0 rounded-xl border border-slate-200 object-cover bg-slate-100"
                              />
                              <div>
                                <p className="font-bold text-slate-900">
                                  {item.name}
                                </p>
                                <p className="text-[11px] text-slate-400">
                                  {item.subtitle}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 font-medium text-slate-600">
                            {item.category}
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className={cn(
                                'inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold',
                                item.condition === 'Brand New'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-amber-50 text-amber-700',
                              )}
                            >
                              {item.condition}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <p className="font-mono font-semibold text-slate-700">
                              {item.sku}
                            </p>
                            <p className="font-mono text-[10px] text-slate-400">
                              S/N: {item.serial}
                            </p>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex flex-col items-start gap-1.5">
                              <button
                                type="button"
                                disabled={togglingStockId === item.id}
                                onClick={() => handleToggleStock(item)}
                                title={
                                  isOut
                                    ? 'Click to mark In Stock'
                                    : 'Click to mark Out of Stock'
                                }
                                className={cn(
                                  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold transition cursor-pointer disabled:opacity-50',
                                  isOut
                                    ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                                    : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
                                )}
                              >
                                <span
                                  className={cn(
                                    'h-1.5 w-1.5 rounded-full',
                                    isOut ? 'bg-rose-500' : 'bg-emerald-500',
                                  )}
                                />
                                <span>
                                  {togglingStockId === item.id
                                    ? 'Saving...'
                                    : isOut
                                      ? 'Out of Stock'
                                      : 'In Stock'}
                                </span>
                              </button>
                              <span
                                className={cn(
                                  'text-[10px] font-semibold',
                                  isOut
                                    ? 'text-rose-500'
                                    : isLow
                                      ? 'text-amber-600'
                                      : 'text-slate-400',
                                )}
                              >
                                {isOut ? '0 units' : `${item.stock} units`}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 font-extrabold text-slate-900">
                            Rs.{' '}
                            {item.price.toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td className="px-4 py-3.5 text-slate-500">
                            {item.warranty}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => openEditModal(item)}
                                aria-label={`Edit ${item.name}`}
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-sky-50 hover:text-[#0284c7] transition cursor-pointer"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteProduct(item.id)}
                                aria-label={`Delete ${item.name}`}
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
                {paginatedInventory.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-200/80 p-4 flex flex-col gap-3 hover:border-sky-200 hover:shadow-sm transition"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-12 w-12 rounded-xl border border-slate-200 object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-slate-900">
                          {item.name}
                        </p>
                        <p className="truncate text-[11px] text-slate-400">
                          SKU: {item.sku} · {item.category}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-xs border-t border-slate-100 pt-2.5">
                      <span className="font-extrabold text-slate-900">
                        Rs.{' '}
                        {item.price.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                      <button
                        type="button"
                        disabled={togglingStockId === item.id}
                        onClick={() => handleToggleStock(item)}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold transition cursor-pointer disabled:opacity-50',
                          item.stock === 0
                            ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                            : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
                        )}
                      >
                        <span
                          className={cn(
                            'h-1.5 w-1.5 rounded-full',
                            item.stock === 0 ? 'bg-rose-500' : 'bg-emerald-500',
                          )}
                        />
                        <span>
                          {togglingStockId === item.id
                            ? 'Saving...'
                            : item.stock === 0
                              ? 'Out of Stock'
                              : `In Stock (${item.stock})`}
                        </span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination Bar */}
            <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row">
              <p className="text-xs text-slate-400">
                Showing{' '}
                <span className="font-semibold text-slate-700">
                  {filteredInventory.length === 0 ? 0 : startIndex + 1}
                </span>{' '}
                to{' '}
                <span className="font-semibold text-slate-700">
                  {Math.min(startIndex + ITEMS_PER_PAGE, filteredInventory.length)}
                </span>{' '}
                of{' '}
                <span className="font-semibold text-slate-700">
                  {filteredInventory.length}
                </span>{' '}
                entries
              </p>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={safePage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(
                  (page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={cn(
                        'h-8 min-w-8 rounded-lg px-2.5 text-xs font-semibold transition cursor-pointer',
                        page === safePage
                          ? 'bg-[#0284c7] text-white shadow-xs'
                          : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                      )}
                    >
                      {page}
                    </button>
                  ),
                )}
                <button
                  type="button"
                  disabled={safePage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Software Key Vault */}
        {activeTab === 'vault' && (
          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Digital License Inventory Batches
                </h2>
                <p className="text-xs text-slate-400">
                  Verified OEM &amp; retail software key pools ready for instant
                  assignment.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1.5 text-[11px] font-bold text-[#0284c7]">
                  <Sparkles className="h-3 w-3" />
                  <span>{totalVaultKeys.toLocaleString('en-US')} Keys Ready</span>
                </span>
                <button
                  type="button"
                  onClick={() => openAddSoftwareModal()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#0284c7] to-[#0ea5e9] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:from-[#0369a1] hover:to-[#0284c7] transition cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Software &amp; Keys</span>
                </button>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="px-4 py-3">Software Product</th>
                    <th className="px-4 py-3">Batch ID</th>
                    <th className="px-4 py-3">Available Keys</th>
                    <th className="px-4 py-3">Assigned</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vaultBatches.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-slate-900">{row.product}</p>
                        <p className="text-[11px] text-slate-400">
                          {row.platform} · Rs. {row.price.toFixed(2)}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-slate-500">
                        {row.batch}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-[#0284c7]">
                        {row.available} keys
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        {row.assigned} keys
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={cn(
                            'rounded-full px-2.5 py-0.5 text-[10px] font-bold',
                            row.status === 'Healthy'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700',
                          )}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => openAddSoftwareModal(row)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:border-sky-300 hover:text-[#0284c7] transition cursor-pointer"
                        >
                          <Plus className="h-3 w-3" />
                          <span>Add Keys</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Service Tickets */}
        {activeTab === 'tickets' && (
          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Active Technician Repair Queue
                </h2>
                <p className="text-xs text-slate-400">
                  Select a stage to update repair progress in real time.
                </p>
              </div>
            </div>

            {ticketStatusBanner && (
              <div
                className={cn(
                  'mt-4 rounded-xl border px-4 py-2.5 text-xs font-semibold',
                  ticketStatusBanner.type === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-rose-200 bg-rose-50 text-rose-700',
                )}
              >
                {ticketStatusBanner.text}
              </div>
            )}

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="px-4 py-3">Ticket</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Device &amp; Issue</th>
                    <th className="px-4 py-3">Lead Engineer</th>
                    <th className="px-4 py-3">Stage</th>
                    <th className="px-4 py-3">Estimate</th>
                    <th className="px-4 py-3 text-right">Workflow</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tickets.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3.5 font-mono font-bold text-[#0284c7]">
                        #{t.id}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-900">
                        {t.customer}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-slate-800">
                          {t.device}
                        </p>
                        <p className="text-[11px] text-slate-400">{t.issue}</p>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        {t.engineer}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={cn(
                            'rounded-full px-2.5 py-0.5 text-[10px] font-bold',
                            t.stage === 'Ready for Pickup'
                              ? 'bg-emerald-50 text-emerald-700'
                              : t.stage === 'In Repair'
                                ? 'bg-sky-50 text-[#0284c7]'
                                : 'bg-amber-50 text-amber-700',
                          )}
                        >
                          {t.stage}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-900">
                        {t.estimate}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <select
                          aria-label={`Update repair stage for ticket ${t.id}`}
                          value={t.stage}
                          disabled={savingTicketId === t.id}
                          onChange={(e) =>
                            handleTicketStageChange(
                              t.id,
                              e.target.value as ServiceTicketItem['stage'],
                            )
                          }
                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 focus:border-sky-500 focus:outline-none disabled:opacity-50 cursor-pointer"
                        >
                          {TICKET_STAGE_ORDER.map((stage) => (
                            <option key={stage} value={stage}>
                              {savingTicketId === t.id && stage === t.stage
                                ? 'Saving...'
                                : stage}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Customer Orders */}
        {activeTab === 'orders' && (
          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Recent Customer Orders
              </h2>
              <p className="text-xs text-slate-400">
                Track payment status and update order fulfillment stages directly.
              </p>
            </div>

            {orderStatusBanner && (
              <div
                className={cn(
                  'mt-4 rounded-xl border px-4 py-2.5 text-xs font-semibold',
                  orderStatusBanner.type === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-rose-200 bg-rose-50 text-rose-700',
                )}
              >
                {orderStatusBanner.text}
              </div>
            )}

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="px-4 py-3">Order ID</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Items</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Payment</th>
                    <th className="px-4 py-3">Fulfillment</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3.5 font-mono font-bold text-slate-900">
                        #{o.id}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-800">
                        {o.customer}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">{o.items}</td>
                      <td className="px-4 py-3.5 font-bold text-slate-900">
                        {o.total}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                          {o.payment}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={cn(
                            'rounded-full px-2.5 py-0.5 text-[10px] font-bold',
                            o.fulfillment === 'Delivered'
                              ? 'bg-emerald-50 text-emerald-700'
                              : o.fulfillment === 'Shipped (FedEx)'
                                ? 'bg-sky-50 text-[#0284c7]'
                                : 'bg-amber-50 text-amber-700',
                          )}
                        >
                          {o.fulfillment}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <select
                          aria-label={`Update status for order ${o.id}`}
                          value={o.fulfillment}
                          disabled={savingOrderId === o.id}
                          onChange={(e) =>
                            handleOrderStatusChange(
                              o.id,
                              e.target.value as CustomerOrderItem['fulfillment'],
                            )
                          }
                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 focus:border-sky-500 focus:outline-none disabled:opacity-50 cursor-pointer"
                        >
                          {ORDER_STAGE_ORDER.map((stage) => (
                            <option key={stage} value={stage}>
                              {savingOrderId === o.id && stage === o.fulfillment
                                ? 'Saving...'
                                : stage}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 5: Newsletter Subscribers */}
        {activeTab === 'subscribers' && (
          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Restock &amp; Deals Subscribers ({subscribers.length})
                </h2>
                <p className="text-xs text-slate-400">
                  Customers who subscribed via the website footer for hardware restock &amp; deal alerts.
                </p>
              </div>
              {subscribers.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const csv = ['Email,Subscribed At', ...subscribers.map((s) => `${s.email},${s.created_at?.toDate ? s.created_at.toDate().toISOString() : ''}`)].join('\n');
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'nextgensolutions-subscribers.csv';
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:border-sky-300 hover:text-[#0284c7] transition cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Export Emails CSV</span>
                </button>
              )}
            </div>

            {subscribers.length === 0 ? (
              <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 py-10 text-center">
                <Mail className="mx-auto h-6 w-6 text-slate-400" />
                <p className="mt-2 text-xs font-bold text-slate-800">
                  No newsletter subscribers yet
                </p>
                <p className="mt-1 text-[11px] text-slate-500">
                  Emails entered in the website footer Subscribe box will appear here automatically.
                </p>
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="px-4 py-3">#</th>
                      <th className="px-4 py-3">Subscriber Email</th>
                      <th className="px-4 py-3">Subscribed Date</th>
                      <th className="px-4 py-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {subscribers.map((sub, idx) => (
                      <tr key={sub.id} className="hover:bg-slate-50/60">
                        <td className="px-4 py-3 text-slate-400 font-mono">
                          {idx + 1}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {sub.email}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {sub.created_at?.toDate
                            ? sub.created_at.toDate().toLocaleString()
                            : 'Just now'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                            Active
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Software & License Keys Modal */}
      {softwareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-[#0d1726] px-6 py-4 text-white">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/20 border border-sky-400/30 text-sky-400">
                  <KeyRound className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold">
                    {targetBatchId
                      ? 'Add License Keys to Batch'
                      : 'Add New Software & License Keys'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Paste retail or OEM keys (one per line) to add them to the
                    vault.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSoftwareModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={handleSaveSoftwareKeys}
              className="space-y-4 p-6 text-xs"
            >
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700">
                    Software Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={Boolean(targetBatchId)}
                    value={swProductName}
                    onChange={(e) => setSwProductName(e.target.value)}
                    placeholder="e.g. Windows 11 Pro (Retail)"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-slate-900 focus:border-sky-500 focus:bg-white focus:outline-none disabled:opacity-70"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700">
                    Platform
                  </label>
                  <input
                    type="text"
                    disabled={Boolean(targetBatchId)}
                    value={swPlatform}
                    onChange={(e) => setSwPlatform(e.target.value)}
                    placeholder="e.g. Windows / macOS"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-slate-900 focus:border-sky-500 focus:bg-white focus:outline-none disabled:opacity-70"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700">
                    Price (Rs.)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    disabled={Boolean(targetBatchId)}
                    value={swPrice}
                    onChange={(e) => setSwPrice(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-slate-900 focus:border-sky-500 focus:bg-white focus:outline-none disabled:opacity-70"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700">
                    Batch ID
                  </label>
                  <input
                    type="text"
                    disabled={Boolean(targetBatchId)}
                    value={swBatchCode}
                    onChange={(e) => setSwBatchCode(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 font-mono text-slate-900 focus:border-sky-500 focus:bg-white focus:outline-none disabled:opacity-70"
                  />
                </div>

                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="block font-semibold text-slate-700">
                      License Keys (One per line or comma-separated) *
                    </label>
                    <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-[#0284c7]">
                      {parsedNewKeys.length} key
                      {parsedNewKeys.length !== 1 ? 's' : ''} detected
                    </span>
                  </div>
                  <textarea
                    required
                    rows={5}
                    value={swKeysInput}
                    onChange={(e) => setSwKeysInput(e.target.value)}
                    placeholder={`W11P8-9K4M2-7Q9X3-89A2F\nW11P8-4H7J1-2L5M9-33B1C`}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5 font-mono text-[11px] text-slate-900 focus:border-sky-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setSoftwareModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-[#0284c7] to-[#0ea5e9] px-5 py-2 font-bold text-white shadow-sm shadow-sky-500/20 hover:from-[#0369a1] hover:to-[#0284c7] cursor-pointer"
                >
                  Save {parsedNewKeys.length || ''} Keys to Vault
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modern Add / Edit Product Modal with Image Uploader */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-xs">
          <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            {/* Dark-Navy Modal Header */}
            <div className="flex items-center justify-between bg-[#0d1726] px-6 py-4 text-white">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/20 border border-sky-400/30 text-sky-400">
                  <ImagePlus className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold">
                    {editingItem
                      ? 'Edit Hardware Product'
                      : 'Add New Hardware Product'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Upload product photos, set condition grade, and publish to
                    inventory.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setProductModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={handleSaveProduct}
              className="overflow-y-auto p-6 text-xs"
            >
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                {/* Left Column: Product Pictures Uploader */}
                <div className="space-y-3.5 lg:col-span-5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Product Pictures
                    </span>
                    <span className="text-[10px] font-medium text-slate-400">
                      {formImages.length} selected
                    </span>
                  </div>

                  {/* Primary Preview */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                    {formImages[0] ? (
                      <>
                        <img
                          src={formImages[0]}
                          alt="Primary product preview"
                          className="h-full w-full object-cover"
                        />
                        <span className="absolute left-2.5 top-2.5 rounded-full bg-[#0d1726]/85 px-2.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-xs">
                          Primary Cover
                        </span>
                      </>
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center text-slate-400">
                        <ImagePlus className="h-7 w-7" />
                        <span className="mt-1.5 text-[11px]">
                          No image selected
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Drag & Drop / File Browser Dropzone */}
                  <label
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      handleImageFiles(e.dataTransfer.files);
                    }}
                    className={cn(
                      'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-4 text-center transition',
                      isDragging
                        ? 'border-[#0284c7] bg-sky-50'
                        : 'border-slate-200 bg-slate-50/70 hover:border-sky-300 hover:bg-sky-50/40',
                    )}
                  >
                    <Upload className="h-5 w-5 text-[#0284c7]" />
                    <p className="mt-1.5 text-xs font-bold text-slate-800">
                      Click to upload or drag &amp; drop
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-400">
                      PNG, JPG, WebP (multiple allowed)
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleImageFiles(e.target.files)}
                      className="hidden"
                    />
                  </label>

                  {/* Paste Image URL */}
                  <div className="flex items-center gap-1.5">
                    <div className="relative flex-1">
                      <Link2 className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                      <input
                        type="url"
                        value={imageUrlInput}
                        onChange={(e) => setImageUrlInput(e.target.value)}
                        placeholder="Or paste image URL..."
                        className="w-full rounded-lg border border-slate-200 bg-slate-50/70 py-1.5 pl-8 pr-2.5 text-[11px] text-slate-900 focus:border-sky-500 focus:bg-white focus:outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddImageUrl}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      Add
                    </button>
                  </div>

                  {/* Selected Thumbnails Strip */}
                  {formImages.length > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                      {formImages.map((src, idx) => (
                        <div
                          key={`${src}-${idx}`}
                          className={cn(
                            'group relative aspect-square overflow-hidden rounded-lg border bg-slate-50',
                            idx === 0
                              ? 'border-2 border-[#0284c7]'
                              : 'border-slate-200',
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => handleSetPrimaryImage(idx)}
                            title="Set as primary image"
                            className="h-full w-full cursor-pointer"
                          >
                            <img
                              src={src}
                              alt={`Product ${idx + 1}`}
                              className="h-full w-full object-cover"
                            />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveFormImage(idx)}
                            aria-label="Remove image"
                            className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-slate-950/75 text-white opacity-0 group-hover:opacity-100 transition cursor-pointer"
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Column: Product Specifications */}
                <div className="space-y-3.5 lg:col-span-7">
                  <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-slate-700">
                        Product Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="e.g. Dell XPS 15 Creator Edition"
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-slate-900 focus:border-sky-500 focus:bg-white focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-slate-700">
                        Key Specifications
                      </label>
                      <input
                        type="text"
                        value={formSubtitle}
                        onChange={(e) => setFormSubtitle(e.target.value)}
                        placeholder="e.g. Intel i7-13700H, 32GB RAM, 1TB NVMe"
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-slate-900 focus:border-sky-500 focus:bg-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700">
                        Category
                      </label>
                      <select
                        value={formCategory}
                        onChange={(e) => {
                          const nextCategory =
                            e.target.value as AdminInventoryItem['category'];
                          setFormCategory(nextCategory);
                          if (!editingItem) {
                            setFormSku(generateNextSku(nextCategory, inventory));
                          }
                        }}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-slate-900 focus:border-sky-500 focus:bg-white focus:outline-none cursor-pointer"
                      >
                        <option value="Laptops">Laptops</option>
                        <option value="Desktops">Desktops</option>
                        <option value="Storage">Storage</option>
                        <option value="Components">Components</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700">
                        Condition Grade
                      </label>
                      <select
                        value={formCondition}
                        onChange={(e) =>
                          setFormCondition(
                            e.target.value as AdminInventoryItem['condition'],
                          )
                        }
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-slate-900 focus:border-sky-500 focus:bg-white focus:outline-none cursor-pointer"
                      >
                        <option value="Brand New">Brand New</option>
                        <option value="Used - Grade A">Used - Grade A</option>
                        <option value="Used - Grade B">Used - Grade B</option>
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <label className="block font-semibold text-slate-700">
                          SKU ID
                        </label>
                        <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-[#0284c7]">
                          Auto-generated
                        </span>
                      </div>
                      <input
                        type="text"
                        readOnly
                        value={formSku}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 font-mono font-semibold text-slate-600 cursor-not-allowed focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700">
                        Serial Number
                      </label>
                      <input
                        type="text"
                        value={formSerial}
                        onChange={(e) => setFormSerial(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 font-mono text-slate-900 focus:border-sky-500 focus:bg-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700">
                        Stock Qty
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={formStock}
                        onChange={(e) => setFormStock(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-slate-900 focus:border-sky-500 focus:bg-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700">
                        Price (Rs.)
                      </label>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={formPrice}
                        onChange={(e) => setFormPrice(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-slate-900 focus:border-sky-500 focus:bg-white focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-slate-700">
                        Warranty Coverage
                      </label>
                      <input
                        type="text"
                        value={formWarranty}
                        onChange={(e) => setFormWarranty(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-slate-900 focus:border-sky-500 focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2.5 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-[#0284c7] to-[#0ea5e9] px-5 py-2.5 font-bold text-white shadow-sm shadow-sky-500/20 hover:from-[#0369a1] hover:to-[#0284c7] cursor-pointer"
                >
                  {editingItem ? 'Save Changes' : 'Publish Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
