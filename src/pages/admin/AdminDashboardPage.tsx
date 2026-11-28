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
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { isFirebaseConfigured } from '@/lib/firebase';
import {
  deleteProductById,
  subscribeProducts,
  uploadProductImage,
  upsertProduct,
  type DbProduct,
} from '@/services/productsService';
import {
  createSoftwareProductWithKeys,
  deleteSoftwareProductByBatch,
  subscribeSoftwareProducts,
} from '@/services/softwareService';
import { fetchRepairBookings, updateRepairStage } from '@/services/repairsService';
import { fetchOrders, updateOrderFulfillment } from '@/services/ordersService';
import { CATALOG_PRODUCTS } from '@/data/catalogProducts';
import { FEATURED_DEALS } from '@/data/featuredProducts';
import {
  fetchNewsletterSubscribers,
  type DbSubscriber,
} from '@/services/supportService';
import {
  DEFAULT_REPAIR_SERVICES,
  deleteRepairService,
  formatServicePriceDisplay,
  generateNextServiceId,
  subscribeRepairServices,
  upsertRepairService,
  type RepairServicePackage,
  type ServiceDeviceScope,
} from '@/services/repairServicesCatalog';
import {
  deleteProductReview,
  subscribeAllReviews,
  type DbProductReview,
} from '@/services/reviewsService';

type AdminTab =
  | 'inventory'
  | 'vault'
  | 'services'
  | 'tickets'
  | 'orders'
  | 'reviews'
  | 'subscribers';
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
  batteryHealth?: string;
  osInstallation?: string;
  description?: string;
  image: string;
}

interface ServiceTicketItem {
  id: string;
  customer: string;
  customerId?: string;
  customerAddress?: string;
  device: string;
  issue: string;
  engineer: string;
  stage: 'Received' | 'Diagnosing' | 'In Repair' | 'Ready for Pickup';
  estimate: string;
}

interface CustomerOrderLineItem {
  productId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

interface CustomerOrderItem {
  id: string;
  customer: string;
  customerEmail?: string;
  shippingAddress?: string;
  createdAt?: string;
  productIds: string[];
  items: string;
  orderItems?: CustomerOrderLineItem[];
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
    batch: 'NGS-SW-001',
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
    batch: 'NGS-SW-002',
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
    batch: 'NGS-SW-003',
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
    batch: 'NGS-SW-005',
    available: 78,
    assigned: 19,
    status: 'Low Stock',
    keys: ['VS22E-8P3M1-6K9W4-77D2A'],
  },
];

const INITIAL_TICKETS: ServiceTicketItem[] = [
  {
    id: 'NGS-ORD-4092',
    customer: 'Alex Miller',
    device: 'Dell XPS 15 9530',
    issue: 'Thermal Repaste & SSD Upgrade',
    engineer: 'Marcus Vance',
    stage: 'In Repair',
    estimate: 'Rs. 13,500.00',
  },
  {
    id: 'NGS-ORD-4098',
    customer: 'Priya Silva',
    device: 'MacBook Pro 14" M2',
    issue: 'USB-C Controller Diagnostics',
    engineer: 'Elena Rostova',
    stage: 'Diagnosing',
    estimate: 'Rs. 7,500.00',
  },
  {
    id: 'NGS-ORD-4104',
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
    productIds: ['NGS-8842'],
    items: 'Dell XPS 15 Creator Edition',
    total: 'Rs. 449,000.00',
    payment: 'Paid',
    fulfillment: 'Shipped (FedEx)',
  },
  {
    id: 'NGS-8845',
    customer: 'Nadia Fernando',
    productIds: ['NGS-8810'],
    items: 'Kingston Fury Beast 32GB DDR5 × 2',
    total: 'Rs. 77,000.00',
    payment: 'Paid',
    fulfillment: 'Processing',
  },
  {
    id: 'NGS-8710',
    customer: 'Alex Miller',
    productIds: ['NGS-7721'],
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
  const [inventory, setInventory] = useState<AdminInventoryItem[]>(
    isFirebaseConfigured ? [] : INITIAL_INVENTORY,
  );
  const [vaultBatches, setVaultBatches] = useState<VaultBatchItem[]>(
    isFirebaseConfigured ? [] : INITIAL_VAULT_KEYS,
  );
  const [tickets, setTickets] = useState<ServiceTicketItem[]>(
    isFirebaseConfigured ? [] : INITIAL_TICKETS,
  );
  const [orders, setOrders] = useState<CustomerOrderItem[]>(
    isFirebaseConfigured ? [] : INITIAL_ORDERS,
  );
  const [orderStatusFilter, setOrderStatusFilter] = useState<
    'All' | CustomerOrderItem['fulfillment']
  >('All');
  const [orderIdSearch, setOrderIdSearch] = useState('');
  const [productIdSearch, setProductIdSearch] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [subscribers, setSubscribers] = useState<DbSubscriber[]>([]);

  // Repair Services Catalog (Admin-controlled sub-parts with auto-generated Service IDs)
  const [repairServices, setRepairServices] = useState<RepairServicePackage[]>(
    isFirebaseConfigured ? [] : DEFAULT_REPAIR_SERVICES,
  );
  const [serviceIdSearch, setServiceIdSearch] = useState('');
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [editingService, setEditingService] =
    useState<RepairServicePackage | null>(null);
  const [srvId, setSrvId] = useState('');
  const [srvName, setSrvName] = useState('');
  const [srvDesc, setSrvDesc] = useState('');
  const [srvPrice, setSrvPrice] = useState('');
  const [srvPlusParts, setSrvPlusParts] = useState(false);
  const [srvTurnaround, setSrvTurnaround] = useState('');
  const [srvScope, setSrvScope] = useState<ServiceDeviceScope>('All Devices');
  const [srvActive, setSrvActive] = useState(true);
  const [serviceBanner, setServiceBanner] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    const unsub = subscribeSoftwareProducts((rows) => {
      if (!isFirebaseConfigured && rows.length === 0) return;
      const mapped: VaultBatchItem[] = rows.map((r) => {
        const stockCount = typeof r.stock === 'number' ? r.stock : 50;
        return {
          id: r.id,
          product: r.name,
          platform: r.platform || 'Multi-Platform',
          price: Number(r.price) || 0,
          batch: r.batch_code || r.id,
          available: stockCount,
          assigned: 0,
          status: stockCount < 100 ? 'Low Stock' : 'Healthy',
          keys: [],
        };
      });
      if (isFirebaseConfigured) {
        setVaultBatches(mapped);
        return;
      }
      const liveBatches = new Set(mapped.map((m) => m.batch.toLowerCase()));
      setVaultBatches([
        ...mapped,
        ...INITIAL_VAULT_KEYS.filter(
          (k) => !liveBatches.has(k.batch.toLowerCase()),
        ),
      ]);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = subscribeRepairServices((list) => {
      setRepairServices(list);
    });
    return unsub;
  }, []);

  const filteredRepairServices = useMemo(() => {
    const q = serviceIdSearch.trim().toLowerCase();
    if (!q) return repairServices;
    return repairServices.filter(
      (s) =>
        s.service_id.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q),
    );
  }, [repairServices, serviceIdSearch]);

  const openAddServiceModal = () => {
    setEditingService(null);
    setSrvId(generateNextServiceId(repairServices));
    setSrvName('');
    setSrvDesc('');
    setSrvPrice('');
    setSrvPlusParts(false);
    setSrvTurnaround('');
    setSrvScope('All Devices');
    setSrvActive(true);
    setServiceModalOpen(true);
  };

  const openEditServiceModal = (service: RepairServicePackage) => {
    setEditingService(service);
    setSrvId(service.service_id);
    setSrvName(service.name);
    setSrvDesc(service.description);
    setSrvPrice(String(service.price));
    setSrvPlusParts(service.plus_parts);
    setSrvTurnaround(service.turnaround);
    setSrvScope(service.device_scope);
    setSrvActive(service.is_active);
    setServiceModalOpen(true);
  };

  const handleSaveService = async (e: FormEvent) => {
    e.preventDefault();
    if (!srvName.trim()) return;
    const numericPrice = Math.max(0, Number(srvPrice) || 0);
    const serviceCode = srvId.trim() || generateNextServiceId(repairServices);
    const docId =
      editingService?.id ??
      srvName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') +
        '-' +
        serviceCode.toLowerCase();

    const payload: RepairServicePackage = {
      id: docId,
      service_id: serviceCode,
      name: srvName.trim(),
      description:
        srvDesc.trim() || 'Certified technician hardware & diagnostic service.',
      price: numericPrice,
      price_display: formatServicePriceDisplay(numericPrice, srvPlusParts),
      plus_parts: srvPlusParts,
      turnaround: srvTurnaround.trim() || 'Est. 24–48 Hours',
      device_scope: srvScope,
      is_active: srvActive,
    };

    const nextList = editingService
      ? repairServices.map((s) => (s.id === editingService.id ? payload : s))
      : [...repairServices, payload];
    setRepairServices(nextList);
    setServiceModalOpen(false);
    setServiceBanner(null);

    const { error } = await upsertRepairService(payload, repairServices);
    if (error) {
      setServiceBanner({
        type: 'success',
        text: `Service ${payload.service_id} saved locally for this browser. Publish updated firestore.rules to sync across all devices.`,
      });
    } else {
      setServiceBanner({
        type: 'success',
        text: `Service ${payload.service_id} ("${payload.name}") saved and synced to Book Repair.`,
      });
    }
  };

  const handleToggleServiceActive = async (service: RepairServicePackage) => {
    const updated: RepairServicePackage = {
      ...service,
      is_active: !service.is_active,
    };
    setRepairServices((prev) =>
      prev.map((s) => (s.id === service.id ? updated : s)),
    );
    await upsertRepairService(updated, repairServices);
  };

  const handleDeleteService = async (service: RepairServicePackage) => {
    setRepairServices((prev) => prev.filter((s) => s.id !== service.id));
    await deleteRepairService(service.id, repairServices);
  };

  // Customer Reviews Moderation
  const [customerReviews, setCustomerReviews] = useState<DbProductReview[]>([]);
  const [reviewSearch, setReviewSearch] = useState('');
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
  const [reviewBanner, setReviewBanner] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    const unsub = subscribeAllReviews((rows) => {
      setCustomerReviews(rows);
    });
    return unsub;
  }, []);

  const filteredReviews = useMemo(() => {
    const q = reviewSearch.trim().toLowerCase();
    if (!q) return customerReviews;
    return customerReviews.filter(
      (r) =>
        r.product_sku.toLowerCase().includes(q) ||
        r.product_name.toLowerCase().includes(q) ||
        r.author.toLowerCase().includes(q) ||
        r.comment.toLowerCase().includes(q),
    );
  }, [customerReviews, reviewSearch]);

  const handleDeleteReview = async (review: DbProductReview) => {
    setReviewBanner(null);
    setDeletingReviewId(review.id);
    setCustomerReviews((prev) => prev.filter((r) => r.id !== review.id));
    const { error } = await deleteProductReview(review.id);
    setDeletingReviewId(null);
    if (error) {
      setCustomerReviews((prev) => [review, ...prev]);
      setReviewBanner({
        type: 'error',
        text: `Failed to delete review by ${review.author}: ${error}`,
      });
    } else {
      setReviewBanner({
        type: 'success',
        text: `Deleted review by ${review.author} on ${review.product_name}.`,
      });
    }
  };

  const filteredOrders = useMemo(() => {
    const swMap: Record<string, string> = {
      'windows 11 pro': 'NGS-SW-001',
      'microsoft office 2024 pro plus': 'NGS-SW-002',
      'kaspersky total security': 'NGS-SW-003',
      'adobe creative cloud suite': 'NGS-SW-004',
      'visual studio 2022 enterprise': 'NGS-SW-005',
      'cybercraft pro studio': 'NGS-SW-006',
    };

    const enriched = orders.map((order) => {
      if (order.productIds.length > 0) return order;
      const itemNames = order.items
        .split(',')
        .map((part) => part.split('×')[0].split(' (')[0].trim().toLowerCase())
        .filter(Boolean);

      const matchedIds = itemNames
        .map((cleanName) => {
          const liveInvMatch = inventory.find(
            (p) =>
              p.name.toLowerCase() === cleanName ||
              cleanName.includes(p.name.toLowerCase()) ||
              p.name.toLowerCase().includes(cleanName),
          );
          if (liveInvMatch) return liveInvMatch.sku;

          const featMatch = FEATURED_DEALS.find(
            (p) =>
              p.name.toLowerCase() === cleanName ||
              cleanName.includes(p.name.toLowerCase()),
          );
          if (featMatch) return featMatch.sku;

          const catalogMatch = CATALOG_PRODUCTS.find(
            (p) =>
              p.name.toLowerCase() === cleanName ||
              cleanName.includes(p.name.toLowerCase()),
          );
          if (catalogMatch) return catalogMatch.sku;

          const swEntry = Object.entries(swMap).find(([k]) =>
            cleanName.includes(k),
          );
          if (swEntry) return swEntry[1];

          return null;
        })
        .filter((id): id is string => Boolean(id));

      return { ...order, productIds: Array.from(new Set(matchedIds)) };
    });

    const orderQuery = orderIdSearch.trim().replace(/^#/, '').toLowerCase();
    const productQuery = productIdSearch.trim().toLowerCase();

    return enriched.filter((o) => {
      if (orderStatusFilter !== 'All' && o.fulfillment !== orderStatusFilter) {
        return false;
      }
      if (orderQuery && !o.id.toLowerCase().includes(orderQuery)) {
        return false;
      }
      if (
        productQuery &&
        !o.productIds.some((pid) => pid.toLowerCase().includes(productQuery))
      ) {
        return false;
      }
      return true;
    });
  }, [orders, inventory, orderStatusFilter, orderIdSearch, productIdSearch]);

  // Sync live data from Supabase when .env credentials are configured
  useEffect(() => {
    if (!isFirebaseConfigured) return;

    const unsubProducts = subscribeProducts((rows) => {
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
          batteryHealth: r.battery_health ?? undefined,
          osInstallation: r.os_installation ?? undefined,
          description: r.description ?? undefined,
          image: r.image_urls[0] ?? '/images/dell-xps-15.jpg',
        })),
      );
    });

    fetchRepairBookings().then((rows) => {
      if (rows) {
        setTickets(
          rows.map((r) => ({
            id: r.ticket_number,
            customer: r.customer_name ?? 'Customer',
            customerId: r.customer_id ?? undefined,
            customerAddress: r.customer_address ?? undefined,
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
      if (rows) {
        setOrders(
          rows.map((r) => {
            const resolvedProductIds =
              r.order_items
                ?.map((i) => {
                  if (i.product_id) return i.product_id;
                  const cleanName = i.item_name.split(' (')[0].trim().toLowerCase();
                  const catalogMatch = CATALOG_PRODUCTS.find(
                    (p) =>
                      p.name.toLowerCase() === cleanName ||
                      cleanName.includes(p.name.toLowerCase()) ||
                      p.name.toLowerCase().includes(cleanName),
                  );
                  if (catalogMatch) return catalogMatch.sku;
                  const invMatch = INITIAL_INVENTORY.find(
                    (p) =>
                      p.name.toLowerCase() === cleanName ||
                      cleanName.includes(p.name.toLowerCase()),
                  );
                  if (invMatch) return invMatch.sku;
                  return null;
                })
                .filter((id): id is string => Boolean(id)) ?? [];

            return {
              id: r.order_number,
              customer: r.customer_name,
              customerEmail: r.customer_email,
              shippingAddress: r.shipping_address,
              createdAt: r.created_at?.toDate
                ? r.created_at.toDate().toLocaleString()
                : undefined,
              productIds: Array.from(new Set(resolvedProductIds)),
              items:
                r.order_items?.map((i) => `${i.item_name} × ${i.quantity}`).join(', ') ||
                'Hardware Order',
              orderItems: r.order_items?.map((i) => ({
                productId: i.product_id ?? undefined,
                name: i.item_name,
                quantity: i.quantity,
                unitPrice: Number(i.unit_price),
              })),
              total: `Rs. ${Number(r.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
              payment: r.payment_status,
              fulfillment:
                r.fulfillment_status === 'Cancelled' ? 'Processing' : r.fulfillment_status,
            };
          }),
        );
      }
    });

    fetchNewsletterSubscribers().then((rows) => {
      if (rows) setSubscribers(rows);
    });

    return () => {
      unsubProducts();
    };
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [inventoryProductIdSearch, setInventoryProductIdSearch] = useState('');
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
  const [formBatteryHealth, setFormBatteryHealth] =
    useState('100% Factory New');
  const [formOsInstallation, setFormOsInstallation] = useState(
    'Windows 11 Pro (Licensed)',
  );
  const [formDescription, setFormDescription] = useState('');
  const [formImages, setFormImages] = useState<string[]>(['/images/dell-xps-15.jpg']);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // Add Software & Stock Modal State
  const [softwareProductIdSearch, setSoftwareProductIdSearch] = useState('');
  const [softwareModalOpen, setSoftwareModalOpen] = useState(false);
  const [targetBatchId, setTargetBatchId] = useState<string | null>(null);
  const [swProductName, setSwProductName] = useState('');
  const [swPlatform, setSwPlatform] = useState('Windows Platform');
  const [swPrice, setSwPrice] = useState('14500');
  const [swBatchCode, setSwBatchCode] = useState('');
  const [swStockQty, setSwStockQty] = useState('50');
  const [swDescription, setSwDescription] = useState('');
  const [savingSoftware, setSavingSoftware] = useState(false);

  const filteredInventory = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const pidQ = inventoryProductIdSearch.trim().toLowerCase();
    return inventory.filter((item) => {
      if (conditionFilter !== 'All' && item.condition !== conditionFilter) {
        return false;
      }
      if (pidQ && !item.sku.toLowerCase().includes(pidQ)) {
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
  }, [inventory, searchQuery, inventoryProductIdSearch, conditionFilter]);

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

  const filteredVaultBatches = useMemo(() => {
    const q = softwareProductIdSearch.trim().toLowerCase();
    if (!q) return vaultBatches;
    return vaultBatches.filter((b) => b.batch.toLowerCase().includes(q));
  }, [vaultBatches, softwareProductIdSearch]);

  const generateNextSoftwareId = (existing: VaultBatchItem[]): string => {
    const pattern = /^NGS-SW-(\d+)$/i;
    let maxNum = 0;
    for (const item of existing) {
      const m = item.batch.trim().match(pattern);
      if (m) {
        const n = parseInt(m[1], 10);
        if (!Number.isNaN(n) && n > maxNum) maxNum = n;
      }
    }
    return `NGS-SW-${String(maxNum + 1).padStart(3, '0')}`;
  };

  const openAddSoftwareModal = (existingBatch?: VaultBatchItem) => {
    if (existingBatch) {
      setTargetBatchId(existingBatch.id);
      setSwProductName(existingBatch.product);
      setSwPlatform(existingBatch.platform);
      setSwPrice(String(existingBatch.price));
      setSwBatchCode(existingBatch.batch);
      setSwStockQty('');
      setSwDescription('');
    } else {
      setTargetBatchId(null);
      setSwProductName('');
      setSwPlatform('');
      setSwPrice('');
      setSwBatchCode(generateNextSoftwareId(vaultBatches));
      setSwStockQty('');
      setSwDescription('');
    }
    setSoftwareModalOpen(true);
  };

  const handleDeleteSoftwareBatch = async (row: VaultBatchItem) => {
    setVaultBatches((prev) => prev.filter((b) => b.id !== row.id));
    await deleteSoftwareProductByBatch(row.batch);
  };

  const handleSaveSoftwareKeys = async (e: FormEvent) => {
    e.preventDefault();
    if (savingSoftware) return;
    const qty = Math.max(0, Math.floor(Number(swStockQty) || 0));
    if (!swProductName.trim() || qty <= 0) return;

    const productId = swBatchCode.trim() || generateNextSoftwareId(vaultBatches);

    if (!targetBatchId && isFirebaseConfigured) {
      setSavingSoftware(true);
      await createSoftwareProductWithKeys({
        name: swProductName.trim(),
        platform: swPlatform.trim() || 'Multi-Platform',
        price: Math.max(0, Number(swPrice) || 0),
        batch_code: productId,
        description: swDescription.trim() || undefined,
        keys: Array.from(
          { length: Math.min(qty, 200) },
          (_, idx) => `${productId}-${String(idx + 1).padStart(3, '0')}`,
        ),
      });
      setSavingSoftware(false);
      setSoftwareModalOpen(false);
      return;
    }

    if (targetBatchId) {
      setVaultBatches((prev) =>
        prev.map((b) => {
          if (b.id !== targetBatchId) return b;
          const nextAvailable = b.available + qty;
          return {
            ...b,
            available: nextAvailable,
            status: nextAvailable < 100 ? 'Low Stock' : 'Healthy',
          };
        }),
      );
    } else {
      const newBatch: VaultBatchItem = {
        id: `vk-${Date.now()}`,
        product: swProductName.trim(),
        platform: swPlatform.trim() || 'Multi-Platform',
        price: Math.max(0, Number(swPrice) || 0),
        batch: productId,
        available: qty,
        assigned: 0,
        status: qty < 100 ? 'Low Stock' : 'Healthy',
        keys: [],
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
    setFormBatteryHealth('100% Factory New');
    setFormOsInstallation('Windows 11 Pro (Licensed)');
    setFormDescription('');
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
    setFormBatteryHealth(
      item.batteryHealth ||
        (item.category !== 'Laptops'
          ? 'N/A (Desktop / Component)'
          : item.condition === 'Brand New'
            ? '100% Factory New'
            : item.condition === 'Used - Grade A'
              ? '95%+ Original Capacity'
              : '85% Original Capacity'),
    );
    setFormOsInstallation(
      item.osInstallation ||
        (item.category === 'Storage' || item.category === 'Components'
          ? 'N/A (Component / Storage)'
          : 'Windows 11 Pro (Licensed)'),
    );
    setFormDescription(item.description ?? '');
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
      batteryHealth: formBatteryHealth,
      osInstallation: formOsInstallation,
      description: formDescription.trim() || undefined,
      image: formImages[0] ?? '/images/dell-xps-15.jpg',
    };

    if (isFirebaseConfigured) {
      const slug = payload.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      const { error } = await upsertProduct({
        ...(editingItem ? { id: editingItem.id } : {}),
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
        battery_health: payload.batteryHealth ?? null,
        os_installation: payload.osInstallation ?? null,
        description: payload.description ?? null,
        specs: payload.subtitle.split(',').map((s) => s.trim()).filter(Boolean),
        image_urls: formImages.length > 0 ? formImages : [payload.image],
        is_featured: false,
        is_active: true,
      });
      if (error) {
        setInventoryBanner({
          type: 'error',
          text: `Could not save "${payload.name}": ${error}`,
        });
        return;
      }
      if (!editingItem) {
        setCurrentPage(1);
      }
      setProductModalOpen(false);
      return;
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
    const target = inventory.find((item) => item.id === id);
    setInventoryBanner(null);
    setInventory((prev) => prev.filter((item) => item.id !== id));
    const { error } = await deleteProductById(id);
    if (error) {
      if (target) {
        setInventory((prev) => [target, ...prev]);
      }
      setInventoryBanner({
        type: 'error',
        text: `Failed to delete product: ${error}`,
      });
    } else if (target) {
      setInventoryBanner({
        type: 'success',
        text: `Deleted "${target.name}" (${target.sku}) permanently from inventory.`,
      });
    }
  };

  const [savingTicketId, setSavingTicketId] = useState<string | null>(null);
  const [ticketOrderIdSearch, setTicketOrderIdSearch] = useState('');
  const [ticketStatusBanner, setTicketStatusBanner] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const filteredTickets = useMemo(() => {
    const q = ticketOrderIdSearch.trim().replace(/^#/, '').toLowerCase();
    if (!q) return tickets;
    return tickets.filter((t) => {
      const displayId = t.id.replace(/^NGS-REP-/i, 'NGS-ORD-').toLowerCase();
      return displayId.includes(q) || t.id.toLowerCase().includes(q);
    });
  }, [tickets, ticketOrderIdSearch]);

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
        text: `Failed to update order #${id.replace(/^NGS-REP-/i, 'NGS-ORD-')}: ${error}`,
      });
    } else {
      setTicketStatusBanner({
        type: 'success',
        text: `Repair order #${id.replace(/^NGS-REP-/i, 'NGS-ORD-')} updated to "${nextStageValue}" and synced to customer dashboard.`,
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
              Rs.{' '}
              {orders
                .reduce((sum, o) => {
                  const cleaned = o.total
                    .replace(/^Rs\.?\s*/i, '')
                    .replace(/[^0-9.]/g, '');
                  const num = Number(cleaned) || 0;
                  return sum + num;
                }, 0)
                .toLocaleString('en-US')}
            </p>
            <div className="mt-3 flex items-center gap-2 text-[11px]">
              <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 font-bold text-emerald-600">
                <TrendingUp className="h-3 w-3" />
                <span>{orders.length} Orders</span>
              </span>
              <span className="text-slate-400">Live sales total</span>
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
              {tickets.filter((t) => t.stage !== 'Ready for Pickup').length} Active
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
              {inventory.length}
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
            onClick={() => setActiveTab('services')}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition cursor-pointer',
              activeTab === 'services'
                ? 'bg-[#0284c7] text-white shadow-xs'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
            )}
          >
            <Wrench className="h-3.5 w-3.5" />
            <span>Services</span>
            <span
              className={cn(
                'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                activeTab === 'services'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 text-slate-600',
              )}
            >
              {repairServices.length}
            </span>
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
            onClick={() => setActiveTab('reviews')}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition cursor-pointer',
              activeTab === 'reviews'
                ? 'bg-[#0284c7] text-white shadow-xs'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
            )}
          >
            <Star className="h-3.5 w-3.5" />
            <span>Reviews</span>
            <span
              className={cn(
                'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                activeTab === 'reviews'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 text-slate-600',
              )}
            >
              {customerReviews.length}
            </span>
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
                {/* Product ID Search (same compact sm:w-56 width & PID badge as Customer Orders) */}
                <div className="relative flex w-full items-center sm:w-56">
                  <span className="pointer-events-none absolute left-2 flex h-5 items-center rounded bg-emerald-50 px-1.5 font-mono text-[10px] font-bold text-emerald-700">
                    PID
                  </span>
                  <input
                    type="text"
                    aria-label="Search Inventory by Product ID"
                    value={inventoryProductIdSearch}
                    onChange={(e) => {
                      setInventoryProductIdSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="NGS-LAP-001"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-12 pr-7 font-mono text-xs text-slate-900 placeholder:font-sans placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  {inventoryProductIdSearch ? (
                    <button
                      type="button"
                      aria-label="Clear Product ID search"
                      onClick={() => {
                        setInventoryProductIdSearch('');
                        setCurrentPage(1);
                      }}
                      className="absolute right-2 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <Search className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-slate-300" />
                  )}
                </div>

                <div className="relative w-full sm:w-56">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Search name or serial..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2 pl-8.5 pr-7 text-xs text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      aria-label="Clear search"
                      onClick={() => {
                        setSearchQuery('');
                        setCurrentPage(1);
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
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
                      <th className="px-5 py-3">Product ID</th>
                      <th className="px-4 py-3">Thumbnail &amp; Product Name</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Condition</th>
                      <th className="px-4 py-3">Serial Number</th>
                      <th className="px-4 py-3">Stock &amp; Availability</th>
                      <th className="px-4 py-3">Price</th>
                      <th className="px-4 py-3">Warranty</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedInventory.length === 0 ? (
                      <tr>
                        <td
                          colSpan={9}
                          className="px-5 py-10 text-center text-xs text-slate-400"
                        >
                          {inventory.length === 0
                            ? 'No hardware products in inventory yet. Click "+ Add New Product" above to publish your first item.'
                            : 'No products match your search or filter.'}
                        </td>
                      </tr>
                    ) : (
                      paginatedInventory.map((item) => {
                      const isOut = item.stock === 0;
                      const isLow = item.stock > 0 && item.stock <= 3;

                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-50/70 transition"
                        >
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-700">
                              {item.sku}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
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
                          <td className="px-4 py-3.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                            {item.serial}
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
                    })
                    )}
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
                          ID: {item.sku} · {item.category}
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
                  <span>{totalVaultKeys.toLocaleString('en-US')} Units in Stock</span>
                </span>
                <button
                  type="button"
                  onClick={() => openAddSoftwareModal()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#0284c7] to-[#0ea5e9] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:from-[#0369a1] hover:to-[#0284c7] transition cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Software</span>
                </button>
              </div>
            </div>

            {/* Product ID Search Bar */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex w-full items-center sm:w-56">
                <span className="pointer-events-none absolute left-2 flex h-5 items-center rounded bg-emerald-50 px-1.5 font-mono text-[10px] font-bold text-emerald-700">
                  PID
                </span>
                <input
                  type="text"
                  aria-label="Search Software by Product ID"
                  value={softwareProductIdSearch}
                  onChange={(e) => setSoftwareProductIdSearch(e.target.value)}
                  placeholder="NGS-SW-001"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-12 pr-7 font-mono text-xs text-slate-900 placeholder:font-sans placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                {softwareProductIdSearch ? (
                  <button
                    type="button"
                    aria-label="Clear Product ID search"
                    onClick={() => setSoftwareProductIdSearch('')}
                    className="absolute right-2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <Search className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-slate-300" />
                )}
              </div>

              <span className="text-[11px] font-medium text-slate-400">
                Showing {filteredVaultBatches.length} of {vaultBatches.length}{' '}
                products
              </span>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="px-4 py-3">Product ID</th>
                    <th className="px-4 py-3">Software Product</th>
                    <th className="px-4 py-3">Stock</th>
                    <th className="px-4 py-3">Sold</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredVaultBatches.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-10 text-center text-xs text-slate-400"
                      >
                        No software products match Product ID &ldquo;
                        {softwareProductIdSearch}&rdquo;.
                      </td>
                    </tr>
                  ) : (
                    filteredVaultBatches.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-700">
                          {row.batch}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-slate-900">{row.product}</p>
                        <p className="text-[11px] text-slate-400">
                          {row.platform} · Rs. {row.price.toFixed(2)}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-[#0284c7]">
                        {row.available} units
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        {row.assigned} units
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
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openAddSoftwareModal(row)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:border-sky-300 hover:text-[#0284c7] transition cursor-pointer"
                          >
                            <Plus className="h-3 w-3" />
                            <span>Add Stock</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSoftwareBatch(row)}
                            aria-label={`Delete ${row.product}`}
                            title={`Delete ${row.product}`}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2.5: Services Catalog */}
        {activeTab === 'services' && (
          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Repair &amp; Technical Service Packages
                </h2>
                <p className="text-xs text-slate-400">
                  Manage sub-part services, pricing, and availability shown on
                  the Book a Repair page.
                </p>
              </div>
              <button
                type="button"
                onClick={openAddServiceModal}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#0284c7] to-[#0ea5e9] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:from-[#0369a1] hover:to-[#0284c7] transition cursor-pointer self-start sm:self-auto"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Service</span>
              </button>
            </div>

            {/* Compact Service ID Search Bar */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex w-full items-center sm:w-56">
                <span className="pointer-events-none absolute left-2 flex h-5 items-center rounded bg-sky-50 px-1.5 font-mono text-[10px] font-bold text-[#0284c7]">
                  SRV
                </span>
                <input
                  type="text"
                  aria-label="Search Services by Service ID"
                  value={serviceIdSearch}
                  onChange={(e) => setServiceIdSearch(e.target.value)}
                  placeholder="NGS-SRV-001"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-13 pr-7 font-mono text-xs text-slate-900 placeholder:font-sans placeholder:text-slate-400 focus:border-[#0284c7] focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                />
                {serviceIdSearch ? (
                  <button
                    type="button"
                    aria-label="Clear Service ID search"
                    onClick={() => setServiceIdSearch('')}
                    className="absolute right-2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <Search className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-slate-300" />
                )}
              </div>

              <span className="text-[11px] font-medium text-slate-400">
                Showing {filteredRepairServices.length} of{' '}
                {repairServices.length} services
              </span>
            </div>

            {serviceBanner && (
              <div
                className={cn(
                  'mt-4 rounded-xl border px-4 py-2.5 text-xs font-semibold',
                  serviceBanner.type === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-rose-200 bg-rose-50 text-rose-700',
                )}
              >
                {serviceBanner.text}
              </div>
            )}

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="px-4 py-3">Service ID</th>
                    <th className="px-4 py-3">Service Package</th>
                    <th className="px-4 py-3">Device Scope</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Turnaround</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRepairServices.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-10 text-center text-xs text-slate-400"
                      >
                        No services match &ldquo;{serviceIdSearch}&rdquo;.
                      </td>
                    </tr>
                  ) : (
                    filteredRepairServices.map((srv) => (
                      <tr key={srv.id} className="hover:bg-slate-50/60">
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-900">
                            {srv.service_id}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-bold text-slate-900">{srv.name}</p>
                          <p className="text-[11px] text-slate-400">
                            {srv.description}
                          </p>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">
                          {srv.device_scope}
                        </td>
                        <td className="px-4 py-3.5 font-bold text-slate-900 whitespace-nowrap">
                          {srv.price_display}
                        </td>
                        <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">
                          {srv.turnaround}
                        </td>
                        <td className="px-4 py-3.5">
                          <button
                            type="button"
                            onClick={() => handleToggleServiceActive(srv)}
                            title={
                              srv.is_active
                                ? 'Click to hide from Book Repair'
                                : 'Click to show on Book Repair'
                            }
                            className={cn(
                              'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold transition cursor-pointer',
                              srv.is_active
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                : 'border-slate-200 bg-slate-100 text-slate-500 hover:bg-slate-200',
                            )}
                          >
                            <span
                              className={cn(
                                'h-1.5 w-1.5 rounded-full',
                                srv.is_active
                                  ? 'bg-emerald-500'
                                  : 'bg-slate-400',
                              )}
                            />
                            <span>{srv.is_active ? 'Active' : 'Hidden'}</span>
                          </button>
                        </td>
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEditServiceModal(srv)}
                              aria-label={`Edit ${srv.name}`}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-sky-50 hover:text-[#0284c7] transition cursor-pointer"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteService(srv)}
                              aria-label={`Delete ${srv.name}`}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
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

            {/* Order ID Search Bar */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex w-full items-center sm:w-56">
                <span className="pointer-events-none absolute left-2 flex h-5 items-center rounded bg-sky-50 px-1.5 font-mono text-[10px] font-bold text-[#0284c7]">
                  #ORD
                </span>
                <input
                  type="text"
                  aria-label="Search Repair Queue by Order ID"
                  value={ticketOrderIdSearch}
                  onChange={(e) => setTicketOrderIdSearch(e.target.value)}
                  placeholder="NGS-ORD-1711"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-14 pr-7 font-mono text-xs text-slate-900 placeholder:font-sans placeholder:text-slate-400 focus:border-[#0284c7] focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                />
                {ticketOrderIdSearch ? (
                  <button
                    type="button"
                    aria-label="Clear Order ID search"
                    onClick={() => setTicketOrderIdSearch('')}
                    className="absolute right-2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <Search className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-slate-300" />
                )}
              </div>

              <span className="text-[11px] font-medium text-slate-400">
                Showing {filteredTickets.length} of {tickets.length} orders
              </span>
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
                    <th className="px-4 py-3">Order ID</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Device &amp; Issue</th>
                    <th className="px-4 py-3">Lead Engineer</th>
                    <th className="px-4 py-3">Stage</th>
                    <th className="px-4 py-3">Estimate</th>
                    <th className="px-4 py-3 text-right">Workflow</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTickets.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-10 text-center text-xs text-slate-400"
                      >
                        No repair orders match Order ID &ldquo;
                        {ticketOrderIdSearch}&rdquo;.
                      </td>
                    </tr>
                  ) : (
                    filteredTickets.map((t) => {
                      const displayOrderId = t.id.replace(
                        /^NGS-REP-/i,
                        'NGS-ORD-',
                      );
                      return (
                        <tr key={t.id} className="hover:bg-slate-50/60">
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-900">
                              #{displayOrderId}
                            </span>
                          </td>
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-slate-900">
                          {t.customer}
                        </p>
                        {t.customerId && (
                          <p className="font-mono text-[10px] font-semibold text-[#0284c7]">
                            ID: {t.customerId}
                          </p>
                        )}
                        {t.customerAddress && (
                          <p className="mt-0.5 text-[10px] text-slate-400">
                            {t.customerAddress}
                          </p>
                        )}
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
                      <td
                        className="px-4 py-3.5 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
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
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Customer Orders */}
        {activeTab === 'orders' && (
          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Recent Customer Orders
                </h2>
                <p className="text-xs text-slate-400">
                  Track payment status and update order fulfillment stages directly.
                </p>
              </div>

              {/* Fulfillment Status Filter Pills */}
              <div className="inline-flex flex-wrap items-center gap-1 rounded-xl border border-slate-200/80 bg-slate-50 p-1">
                {(
                  [
                    { value: 'All', label: 'All' },
                    { value: 'Processing', label: 'Processing' },
                    { value: 'Shipped (FedEx)', label: 'Shipped' },
                    { value: 'Delivered', label: 'Delivered' },
                  ] as const
                ).map((opt) => {
                  const count =
                    opt.value === 'All'
                      ? orders.length
                      : orders.filter((o) => o.fulfillment === opt.value).length;
                  const isActive = orderStatusFilter === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setOrderStatusFilter(opt.value)}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition cursor-pointer',
                        isActive
                          ? opt.value === 'Delivered'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : opt.value === 'Processing'
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'bg-[#0284c7] text-white shadow-xs'
                          : 'text-slate-600 hover:bg-white hover:text-slate-900',
                      )}
                    >
                      <span>{opt.label}</span>
                      <span
                        className={cn(
                          'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-200/80 text-slate-600',
                        )}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Separate Order ID & Product ID Search Bars */}
            <div className="mt-4 flex flex-wrap items-end justify-between gap-3 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3">
              <div className="flex flex-wrap items-end gap-3">
                {/* Order ID Search */}
                <div className="w-full space-y-1 sm:w-56">
                  <label
                    htmlFor="order-id-search"
                    className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500"
                  >
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#0284c7]" />
                    <span>Order ID</span>
                  </label>
                  <div className="relative flex items-center">
                    <span className="pointer-events-none absolute left-2 flex h-5 items-center rounded bg-sky-50 px-1.5 font-mono text-[10px] font-bold text-[#0284c7]">
                      #ORD
                    </span>
                    <input
                      id="order-id-search"
                      type="text"
                      value={orderIdSearch}
                      onChange={(e) => setOrderIdSearch(e.target.value)}
                      placeholder="NGS-ORD-7513"
                      className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-14 pr-7 font-mono text-xs text-slate-900 shadow-2xs placeholder:font-sans placeholder:text-slate-400 focus:border-[#0284c7] focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                    />
                    {orderIdSearch ? (
                      <button
                        type="button"
                        aria-label="Clear Order ID search"
                        onClick={() => setOrderIdSearch('')}
                        className="absolute right-2 text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <Search className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-slate-300" />
                    )}
                  </div>
                </div>

                {/* Product ID Search */}
                <div className="w-full space-y-1 sm:w-56">
                  <label
                    htmlFor="product-id-search"
                    className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500"
                  >
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span>Product ID</span>
                  </label>
                  <div className="relative flex items-center">
                    <span className="pointer-events-none absolute left-2 flex h-5 items-center rounded bg-emerald-50 px-1.5 font-mono text-[10px] font-bold text-emerald-700">
                      PID
                    </span>
                    <input
                      id="product-id-search"
                      type="text"
                      value={productIdSearch}
                      onChange={(e) => setProductIdSearch(e.target.value)}
                      placeholder="NGS-2231"
                      className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-12 pr-7 font-mono text-xs text-slate-900 shadow-2xs placeholder:font-sans placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                    {productIdSearch ? (
                      <button
                        type="button"
                        aria-label="Clear Product ID search"
                        onClick={() => setProductIdSearch('')}
                        className="absolute right-2 text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <Search className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-slate-300" />
                    )}
                  </div>
                </div>
              </div>

              {/* Live Match Count & Reset */}
              <div className="flex items-center gap-3 pb-1">
                <span className="text-[11px] font-medium text-slate-500 whitespace-nowrap">
                  Showing{' '}
                  <strong className="font-bold text-slate-800">
                    {filteredOrders.length}
                  </strong>{' '}
                  of {orders.length}
                </span>
                {(orderIdSearch ||
                  productIdSearch ||
                  orderStatusFilter !== 'All') && (
                  <button
                    type="button"
                    onClick={() => {
                      setOrderIdSearch('');
                      setProductIdSearch('');
                      setOrderStatusFilter('All');
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 shadow-2xs hover:border-slate-300 hover:text-slate-900 transition cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                    <span>Clear</span>
                  </button>
                )}
              </div>
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
                    <th className="px-4 py-3">Product ID</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Items</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Payment</th>
                    <th className="px-4 py-3">Fulfillment</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-10 text-center text-xs text-slate-400"
                      >
                        No matching orders found
                        {orderStatusFilter !== 'All'
                          ? ` with status "${orderStatusFilter}"`
                          : ''}
                        .
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((o) => (
                    <tr
                      key={o.id}
                      onClick={() => setSelectedOrderId(o.id)}
                      title="Click to view ordered products & customer details"
                      className="hover:bg-sky-50/40 transition cursor-pointer"
                    >
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-900 hover:bg-sky-100 hover:text-[#0284c7] transition">
                          #{o.id}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        {o.productIds.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {o.productIds.map((pid) => (
                              <span
                                key={pid}
                                className="inline-block whitespace-nowrap rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-700"
                              >
                                {pid}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="font-mono text-[11px] text-slate-400">—</span>
                        )}
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
                      <td
                        className="px-4 py-3.5 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
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
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4.5: Customer Reviews Moderation */}
        {activeTab === 'reviews' && (
          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Customer Product Reviews
                </h2>
                <p className="text-xs text-slate-400">
                  Review customer feedback and photos, and delete spam or
                  unnecessary reviews in real time.
                </p>
              </div>
              <span className="text-[11px] font-medium text-slate-400">
                Showing {filteredReviews.length} of {customerReviews.length}{' '}
                reviews
              </span>
            </div>

            {/* Compact Product ID / Customer Search Bar */}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="relative flex w-full items-center sm:w-56">
                <span className="pointer-events-none absolute left-2 flex h-5 items-center rounded bg-emerald-50 px-1.5 font-mono text-[10px] font-bold text-emerald-700">
                  PID
                </span>
                <input
                  type="text"
                  aria-label="Search Reviews by Product ID or customer"
                  value={reviewSearch}
                  onChange={(e) => setReviewSearch(e.target.value)}
                  placeholder="NGS-2231 or customer..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-12 pr-7 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                {reviewSearch ? (
                  <button
                    type="button"
                    aria-label="Clear review search"
                    onClick={() => setReviewSearch('')}
                    className="absolute right-2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <Search className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-slate-300" />
                )}
              </div>
            </div>

            {reviewBanner && (
              <div
                className={cn(
                  'mt-4 rounded-xl border px-4 py-2.5 text-xs font-semibold',
                  reviewBanner.type === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-rose-200 bg-rose-50 text-rose-700',
                )}
              >
                {reviewBanner.text}
              </div>
            )}

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="px-4 py-3">Product ID</th>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Rating</th>
                    <th className="px-4 py-3">Review &amp; Photo</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredReviews.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-10 text-center text-xs text-slate-400"
                      >
                        {customerReviews.length === 0
                          ? 'No customer-submitted reviews yet. New product reviews will appear here automatically.'
                          : `No reviews match "${reviewSearch}".`}
                      </td>
                    </tr>
                  ) : (
                    filteredReviews.map((rev) => (
                      <tr key={rev.id} className="hover:bg-slate-50/60">
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-700">
                            {rev.product_sku}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-slate-900">
                          {rev.product_name}
                        </td>
                        <td className="px-4 py-3.5 font-medium text-slate-700 whitespace-nowrap">
                          {rev.author}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="inline-flex items-center gap-0.5">
                            {Array.from({ length: 5 }, (_, i) => (
                              <Star
                                key={i}
                                className={cn(
                                  'h-3.5 w-3.5',
                                  i < rev.rating
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-slate-200',
                                )}
                              />
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 max-w-sm">
                          <p className="text-slate-600 line-clamp-2">
                            {rev.comment}
                          </p>
                          {rev.image_url && (
                            <a
                              href={rev.image_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-1.5 inline-block overflow-hidden rounded-lg border border-slate-200"
                            >
                              <img
                                src={rev.image_url}
                                alt={`Photo by ${rev.author}`}
                                className="h-12 w-16 object-cover hover:opacity-85 transition"
                              />
                            </a>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-slate-400 whitespace-nowrap">
                          {rev.date_label}
                        </td>
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <button
                            type="button"
                            disabled={deletingReviewId === rev.id}
                            onClick={() => handleDeleteReview(rev)}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50 transition cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>
                              {deletingReviewId === rev.id
                                ? 'Deleting...'
                                : 'Delete'}
                            </span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
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

      {/* Customer Order Details Modal (Products Breakdown) */}
      {(() => {
        const activeOrder = selectedOrderId
          ? filteredOrders.find((o) => o.id === selectedOrderId) ??
            orders.find((o) => o.id === selectedOrderId) ??
            null
          : null;
        if (!activeOrder) return null;

        const swMap: Record<string, string> = {
          'windows 11 pro': 'NGS-SW-001',
          'microsoft office 2024 pro plus': 'NGS-SW-002',
          'kaspersky total security': 'NGS-SW-003',
          'adobe creative cloud suite': 'NGS-SW-004',
          'visual studio 2022 enterprise': 'NGS-SW-005',
          'cybercraft pro studio': 'NGS-SW-006',
        };

        const lineItems: CustomerOrderLineItem[] =
          activeOrder.orderItems && activeOrder.orderItems.length > 0
            ? activeOrder.orderItems
            : activeOrder.items
                .split(',')
                .map((part) => {
                  const [rawName, rawQty] = part.split('×');
                  return {
                    name: rawName?.trim() || 'Hardware Item',
                    quantity: Math.max(1, parseInt(rawQty?.trim() || '1', 10) || 1),
                    unitPrice: 0,
                  };
                });

        const resolveItemMeta = (item: CustomerOrderLineItem) => {
          const cleanName = item.name.split(' (')[0].trim().toLowerCase();
          const liveInv = inventory.find(
            (p) =>
              (item.productId && p.sku.toLowerCase() === item.productId.toLowerCase()) ||
              p.name.toLowerCase() === cleanName ||
              cleanName.includes(p.name.toLowerCase()) ||
              p.name.toLowerCase().includes(cleanName),
          );
          if (liveInv) {
            return { sku: item.productId || liveInv.sku, image: liveInv.image, isSoftware: false };
          }
          const feat = FEATURED_DEALS.find(
            (p) =>
              (item.productId && p.sku.toLowerCase() === item.productId.toLowerCase()) ||
              p.name.toLowerCase() === cleanName ||
              cleanName.includes(p.name.toLowerCase()),
          );
          if (feat) {
            return { sku: item.productId || feat.sku, image: feat.image, isSoftware: feat.category === 'software' };
          }
          const cat = CATALOG_PRODUCTS.find(
            (p) =>
              (item.productId && p.sku.toLowerCase() === item.productId.toLowerCase()) ||
              p.name.toLowerCase() === cleanName ||
              cleanName.includes(p.name.toLowerCase()),
          );
          if (cat) {
            return { sku: item.productId || cat.sku, image: cat.image, isSoftware: false };
          }
          const swEntry = Object.entries(swMap).find(([k]) => cleanName.includes(k));
          return {
            sku: item.productId || swEntry?.[1] || null,
            image: null,
            isSoftware: Boolean(swEntry),
          };
        };

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-xs"
            onClick={() => setSelectedOrderId(null)}
          >
            <div
              className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Dark-Navy Modal Header */}
              <div className="flex items-center justify-between bg-[#0d1726] px-6 py-4 text-white">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/20 border border-sky-400/30 text-sky-400">
                    <ShoppingCart className="h-4.5 w-4.5" />
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-mono text-sm font-extrabold">
                        Order #{activeOrder.id}
                      </h3>
                      <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                        {activeOrder.payment}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {activeOrder.createdAt
                        ? `Placed on ${activeOrder.createdAt}`
                        : 'Customer Hardware & Software Order'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedOrderId(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-5 overflow-y-auto p-6 text-xs">
                {/* Customer & Delivery Info */}
                <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 sm:grid-cols-2">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Customer
                    </p>
                    <p className="mt-1 font-bold text-slate-900">
                      {activeOrder.customer}
                    </p>
                    {activeOrder.customerEmail && (
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {activeOrder.customerEmail}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Delivery Address
                    </p>
                    <p className="mt-1 text-slate-700">
                      {activeOrder.shippingAddress || 'Confirmed via WhatsApp'}
                    </p>
                  </div>
                </div>

                {/* Ordered Products Breakdown */}
                <div>
                  <div className="mb-2.5 flex items-center justify-between">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Ordered Products ({lineItems.length})
                    </h4>
                  </div>

                  <div className="divide-y divide-slate-100 rounded-xl border border-slate-200/80 bg-white">
                    {lineItems.map((item, idx) => {
                      const meta = resolveItemMeta(item);
                      const lineTotal = item.unitPrice * item.quantity;
                      return (
                        <div
                          key={`${item.name}-${idx}`}
                          className="flex items-center justify-between gap-4 p-3.5"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {meta.image ? (
                              <img
                                src={meta.image}
                                alt={item.name}
                                className="h-12 w-12 shrink-0 rounded-xl border border-slate-200 object-cover bg-slate-50"
                              />
                            ) : (
                              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-sky-200/80 bg-sky-50 text-[#0284c7]">
                                {meta.isSoftware ? (
                                  <KeyRound className="h-5 w-5" />
                                ) : (
                                  <Package className="h-5 w-5" />
                                )}
                              </span>
                            )}
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <p className="font-bold text-slate-900">
                                  {item.name}
                                </p>
                                {meta.sku && (
                                  <span className="inline-block rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-700">
                                    {meta.sku}
                                  </span>
                                )}
                              </div>
                              <p className="mt-0.5 text-[11px] text-slate-500">
                                Qty: <strong className="text-slate-700">{item.quantity}</strong>
                                {item.unitPrice > 0 && (
                                  <>
                                    {' · '}Unit Price: Rs.{' '}
                                    {item.unitPrice.toLocaleString('en-US', {
                                      minimumFractionDigits: 2,
                                    })}
                                  </>
                                )}
                              </p>
                            </div>
                          </div>

                          {lineTotal > 0 && (
                            <p className="shrink-0 font-bold text-slate-900">
                              Rs.{' '}
                              {lineTotal.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                              })}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer: Total + Direct Status Update */}
                <div className="flex flex-col justify-between gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Order Total
                    </p>
                    <p className="text-lg font-extrabold text-[#0284c7]">
                      {activeOrder.total}
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <select
                      aria-label={`Update status for order ${activeOrder.id}`}
                      value={activeOrder.fulfillment}
                      disabled={savingOrderId === activeOrder.id}
                      onChange={(e) =>
                        handleOrderStatusChange(
                          activeOrder.id,
                          e.target.value as CustomerOrderItem['fulfillment'],
                        )
                      }
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-sky-500 focus:outline-none disabled:opacity-50 cursor-pointer"
                    >
                      {ORDER_STAGE_ORDER.map((stage) => (
                        <option key={stage} value={stage}>
                          {savingOrderId === activeOrder.id &&
                          stage === activeOrder.fulfillment
                            ? 'Saving...'
                            : stage}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setSelectedOrderId(null)}
                      className="rounded-xl bg-[#0284c7] px-4 py-2 font-bold text-white hover:bg-[#0369a1] transition cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Add / Edit Repair Service Modal */}
      {serviceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-[#0d1726] px-6 py-4 text-white">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/20 border border-sky-400/30 text-sky-400">
                  <Wrench className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold">
                    {editingService
                      ? 'Edit Repair Service'
                      : 'Add New Repair Service'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Configure service package details shown on Book a Repair.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setServiceModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-4 p-6 text-xs">
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <div>
                  <div className="flex items-center justify-between">
                    <label className="block font-semibold text-slate-700">
                      Service ID
                    </label>
                    <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-[#0284c7]">
                      Auto-generated
                    </span>
                  </div>
                  <input
                    type="text"
                    readOnly
                    value={srvId}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 font-mono font-semibold text-slate-600 cursor-not-allowed focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700">
                    Device Scope
                  </label>
                  <select
                    value={srvScope}
                    onChange={(e) =>
                      setSrvScope(e.target.value as ServiceDeviceScope)
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-slate-900 focus:border-sky-500 focus:bg-white focus:outline-none cursor-pointer"
                  >
                    <option value="All Devices">All Devices</option>
                    <option value="Laptop & Notebook">Laptop &amp; Notebook</option>
                    <option value="Desktop & Workstation">
                      Desktop &amp; Workstation
                    </option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700">
                    Service Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={srvName}
                    onChange={(e) => setSrvName(e.target.value)}
                    placeholder="e.g. Motherboard Micro-Soldering & Repair"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700">
                    Description
                  </label>
                  <input
                    type="text"
                    value={srvDesc}
                    onChange={(e) => setSrvDesc(e.target.value)}
                    placeholder="e.g. IC replacement, power rail diagnostics, and thermal testing."
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700">
                    Price (Rs.) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step="1"
                    value={srvPrice}
                    onChange={(e) => setSrvPrice(e.target.value)}
                    placeholder="e.g. 7500"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700">
                    Turnaround Time
                  </label>
                  <input
                    type="text"
                    value={srvTurnaround}
                    onChange={(e) => setSrvTurnaround(e.target.value)}
                    placeholder="e.g. Est. 24–48 Hours"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2 flex flex-wrap items-center gap-5 pt-1">
                  <label className="inline-flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={srvPlusParts}
                      onChange={(e) => setSrvPlusParts(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-[#0284c7] focus:ring-sky-500"
                    />
                    <span>Show &ldquo;+ Parts&rdquo; next to price</span>
                  </label>

                  <label className="inline-flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={srvActive}
                      onChange={(e) => setSrvActive(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Active on Book Repair page</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setServiceModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-[#0284c7] to-[#0ea5e9] px-5 py-2 font-bold text-white shadow-sm shadow-sky-500/20 hover:from-[#0369a1] hover:to-[#0284c7] cursor-pointer"
                >
                  {editingService ? 'Save Changes' : 'Publish Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                      ? 'Add Stock to Software Product'
                      : 'Add New Software Product'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Set software details and available stock quantity.
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
                    placeholder="e.g. Windows Platform"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none disabled:opacity-70"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700">
                    Price (Rs.)
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step="0.01"
                    disabled={Boolean(targetBatchId)}
                    value={swPrice}
                    onChange={(e) => setSwPrice(e.target.value)}
                    placeholder="e.g. 14500"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none disabled:opacity-70"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="block font-semibold text-slate-700">
                      Product ID
                    </label>
                    <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-[#0284c7]">
                      Auto-generated
                    </span>
                  </div>
                  <input
                    type="text"
                    readOnly
                    value={swBatchCode}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 font-mono font-semibold text-slate-600 cursor-not-allowed focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700">
                    {targetBatchId ? 'Add Stock Qty *' : 'Stock Qty *'}
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={swStockQty}
                    onChange={(e) => setSwStockQty(e.target.value)}
                    placeholder="e.g. 50"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-slate-900 focus:border-sky-500 focus:bg-white focus:outline-none"
                  />
                </div>

                {!targetBatchId && (
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      value={swDescription}
                      onChange={(e) => setSwDescription(e.target.value)}
                      placeholder="e.g. 1-Year Subscription for up to 5 devices including Word, Excel, PowerPoint, Outlook & 1TB OneDrive."
                      className="mt-1 w-full resize-y rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                )}
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
                  disabled={savingSoftware}
                  className="rounded-xl bg-gradient-to-r from-[#0284c7] to-[#0ea5e9] px-5 py-2 font-bold text-white shadow-sm shadow-sky-500/20 hover:from-[#0369a1] hover:to-[#0284c7] disabled:opacity-60 cursor-pointer"
                >
                  {savingSoftware
                    ? 'Saving...'
                    : targetBatchId
                      ? `Add ${Number(swStockQty) || 0} to Stock`
                      : 'Save Software'}
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
                          Product ID
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

                    <div>
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

                    <div>
                      <label className="block font-semibold text-slate-700">
                        Battery Health
                      </label>
                      <select
                        aria-label="Battery Health"
                        value={formBatteryHealth}
                        onChange={(e) => setFormBatteryHealth(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-slate-900 focus:border-sky-500 focus:bg-white focus:outline-none cursor-pointer"
                      >
                        <option value="100% Factory New">100% Factory New</option>
                        <option value="95%+ Original Capacity">
                          95%+ Original Capacity
                        </option>
                        <option value="90% Original Capacity">
                          90% Original Capacity
                        </option>
                        <option value="85% Original Capacity">
                          85% Original Capacity
                        </option>
                        <option value="80% Original Capacity">
                          80% Original Capacity
                        </option>
                        <option value="75% Original Capacity">
                          75% Original Capacity
                        </option>
                        <option value="N/A (Desktop / Component)">
                          N/A (Desktop / Component)
                        </option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-slate-700">
                        OS Installation
                      </label>
                      <select
                        aria-label="OS Installation"
                        value={formOsInstallation}
                        onChange={(e) => setFormOsInstallation(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-slate-900 focus:border-sky-500 focus:bg-white focus:outline-none cursor-pointer"
                      >
                        <option value="Windows 11 Pro (Licensed)">
                          Windows 11 Pro (Licensed)
                        </option>
                        <option value="Windows 11 Home">Windows 11 Home</option>
                        <option value="Windows 10 Pro">Windows 10 Pro</option>
                        <option value="macOS (Latest Official)">
                          macOS (Latest Official)
                        </option>
                        <option value="Ubuntu Linux">Ubuntu Linux</option>
                        <option value="DOS / No OS">DOS / No OS</option>
                        <option value="N/A (Component / Storage)">
                          N/A (Component / Storage)
                        </option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-slate-700">
                        Device Description &amp; Detailed Specifications
                      </label>
                      <textarea
                        rows={4}
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                        placeholder="Add full device specifications, processor, GPU, display, ports, cooling, accessories included, etc..."
                        className="mt-1 w-full resize-y rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none"
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
