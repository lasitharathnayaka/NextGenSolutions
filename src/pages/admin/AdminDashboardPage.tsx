import { useMemo, useState, type FormEvent } from 'react';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

type AdminTab = 'inventory' | 'vault' | 'tickets' | 'orders';
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
    price: 1499,
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
    price: 169,
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
    price: 799,
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
    price: 3499,
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
    price: 115,
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
    price: 899,
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
    price: 2499,
    warranty: '2 Yr Warranty',
    image: '/images/hp-omen-45l.jpg',
  },
];

const VAULT_KEYS = [
  {
    id: 'vk-1',
    product: 'Windows 11 Pro (Retail)',
    batch: 'BATCH-2026-W11',
    available: 640,
    assigned: 185,
    status: 'Healthy',
  },
  {
    id: 'vk-2',
    product: 'Microsoft Office 2024 Pro Plus',
    batch: 'BATCH-2026-OFF',
    available: 412,
    assigned: 94,
    status: 'Healthy',
  },
  {
    id: 'vk-3',
    product: 'Kaspersky Total Security (5-Device)',
    batch: 'BATCH-2026-KSP',
    available: 290,
    assigned: 62,
    status: 'Healthy',
  },
  {
    id: 'vk-4',
    product: 'Visual Studio 2022 Enterprise',
    batch: 'BATCH-2026-VS',
    available: 78,
    assigned: 19,
    status: 'Low Stock',
  },
];

const SERVICE_TICKETS = [
  {
    id: 'NGS-4092',
    customer: 'Alex Miller',
    device: 'Dell XPS 15 9530',
    issue: 'Thermal Repaste & SSD Upgrade',
    engineer: 'Marcus Vance',
    stage: 'In Repair',
    estimate: '$45.00',
  },
  {
    id: 'NGS-4098',
    customer: 'Priya Silva',
    device: 'MacBook Pro 14" M2',
    issue: 'USB-C Controller Diagnostics',
    engineer: 'Elena Rostova',
    stage: 'Diagnosing',
    estimate: '$25.00',
  },
  {
    id: 'NGS-4104',
    customer: 'David Chen',
    device: 'Custom RTX 4080 Workstation',
    issue: 'Liquid Cooler Pump Replacement',
    engineer: 'Marcus Vance',
    stage: 'Ready for Pickup',
    estimate: '$135.00',
  },
];

const CUSTOMER_ORDERS = [
  {
    id: 'NGS-8842',
    customer: 'Alex Miller',
    items: 'Dell XPS 15 Creator Edition',
    total: '$1,499.00',
    payment: 'Paid',
    fulfillment: 'Shipped (FedEx)',
  },
  {
    id: 'NGS-8845',
    customer: 'Nadia Fernando',
    items: 'Kingston Fury Beast 32GB DDR5 × 2',
    total: '$258.00',
    payment: 'Paid',
    fulfillment: 'Processing',
  },
  {
    id: 'NGS-8710',
    customer: 'Alex Miller',
    items: 'Samsung 990 PRO 2TB NVMe',
    total: '$189.00',
    payment: 'Paid',
    fulfillment: 'Delivered',
  },
];

const ITEMS_PER_PAGE = 5;

export function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('inventory');
  const [inventory, setInventory] = useState<AdminInventoryItem[]>(INITIAL_INVENTORY);
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

  const openAddModal = () => {
    setEditingItem(null);
    setFormName('');
    setFormSubtitle('');
    setFormCategory('Laptops');
    setFormCondition('Brand New');
    setFormSku(`NGS-${Math.floor(1000 + Math.random() * 9000)}`);
    setFormSerial(`SN-${Math.floor(100000 + Math.random() * 900000)}`);
    setFormStock('10');
    setFormPrice('999');
    setFormWarranty('1 Yr Warranty');
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
    setProductModalOpen(true);
  };

  const handleSaveProduct = (e: FormEvent) => {
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
      image: editingItem?.image ?? '/images/dell-xps-15.jpg',
    };

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

  const handleDeleteProduct = (id: string) => {
    setInventory((prev) => prev.filter((item) => item.id !== id));
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
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Top Title & Action Buttons */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Enterprise Control Center
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">
            Admin &amp; Technician Operations
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
          >
            {exportSuccess ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span>Exported CSV</span>
              </>
            ) : (
              <>
                <Download className="h-3.5 w-3.5 text-slate-500" />
                <span>Export Reports</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0284c7] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#0369a1] transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Summary Cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Revenue */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-2xs">
          <div className="flex items-start justify-between">
            <p className="text-xs font-medium text-slate-500">Total Revenue</p>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-[#0284c7]">
              <Wallet className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2.5 text-2xl font-extrabold tracking-tight text-slate-900">
            $128,450
          </p>
          <div className="mt-2.5 flex items-center gap-2 text-[11px]">
            <span className="inline-flex items-center gap-0.5 rounded bg-emerald-50 px-1.5 py-0.5 font-semibold text-emerald-600">
              <TrendingUp className="h-3 w-3" />
              <span>+14%</span>
            </span>
            <span className="text-slate-400">vs last month</span>
          </div>
        </div>

        {/* Card 2: Hardware Stock Alerts */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-2xs">
          <div className="flex items-start justify-between">
            <p className="text-xs font-medium text-slate-500">
              Hardware Stock Alerts
            </p>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <AlertTriangle className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2.5 text-2xl font-extrabold tracking-tight text-slate-900">
            {lowStockCount} Items
          </p>
          <div className="mt-2.5 flex items-center gap-2 text-[11px]">
            <span className="rounded bg-amber-50 px-1.5 py-0.5 font-semibold text-amber-700">
              Low Stock / Out
            </span>
            <span className="text-slate-400">Action required</span>
          </div>
        </div>

        {/* Card 3: Software Key Vault */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-2xs">
          <div className="flex items-start justify-between">
            <p className="text-xs font-medium text-slate-500">
              Software Key Vault
            </p>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <KeyRound className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2.5 text-2xl font-extrabold tracking-tight text-slate-900">
            1,420
          </p>
          <div className="mt-2.5 flex items-center gap-2 text-[11px]">
            <span className="rounded bg-sky-50 px-1.5 py-0.5 font-semibold text-[#0284c7]">
              Available
            </span>
            <span className="text-slate-400">Unassigned retail keys</span>
          </div>
        </div>

        {/* Card 4: Open Repair Tickets */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-2xs">
          <div className="flex items-start justify-between">
            <p className="text-xs font-medium text-slate-500">
              Open Repair Tickets
            </p>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-[#0284c7]">
              <Wrench className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2.5 text-2xl font-extrabold tracking-tight text-slate-900">
            18 Active
          </p>
          <div className="mt-2.5 flex items-center gap-2 text-[11px]">
            <span className="rounded bg-emerald-50 px-1.5 py-0.5 font-semibold text-emerald-600">
              On Track
            </span>
            <span className="text-slate-400">Customer repairs</span>
          </div>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="mt-7 flex flex-wrap items-center gap-6 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('inventory')}
          className={cn(
            'inline-flex items-center gap-2 border-b-2 -mb-px pb-3 text-xs font-semibold transition cursor-pointer',
            activeTab === 'inventory'
              ? 'border-[#0284c7] text-[#0284c7]'
              : 'border-transparent text-slate-500 hover:text-slate-900',
          )}
        >
          <Package className="h-3.5 w-3.5" />
          <span>Inventory (Hardware)</span>
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-[10px] font-bold',
              activeTab === 'inventory'
                ? 'bg-sky-50 text-[#0284c7]'
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
            'inline-flex items-center gap-2 border-b-2 -mb-px pb-3 text-xs font-semibold transition cursor-pointer',
            activeTab === 'vault'
              ? 'border-[#0284c7] text-[#0284c7]'
              : 'border-transparent text-slate-500 hover:text-slate-900',
          )}
        >
          <KeyRound className="h-3.5 w-3.5" />
          <span>Software Key Vault</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tickets')}
          className={cn(
            'inline-flex items-center gap-2 border-b-2 -mb-px pb-3 text-xs font-semibold transition cursor-pointer',
            activeTab === 'tickets'
              ? 'border-[#0284c7] text-[#0284c7]'
              : 'border-transparent text-slate-500 hover:text-slate-900',
          )}
        >
          <Gauge className="h-3.5 w-3.5" />
          <span>Service Tickets</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={cn(
            'inline-flex items-center gap-2 border-b-2 -mb-px pb-3 text-xs font-semibold transition cursor-pointer',
            activeTab === 'orders'
              ? 'border-[#0284c7] text-[#0284c7]'
              : 'border-transparent text-slate-500 hover:text-slate-900',
          )}
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          <span>Customer Orders</span>
        </button>
      </div>

      {/* Tab 1: Hardware Inventory Table Card */}
      {activeTab === 'inventory' && (
        <div className="mt-5 rounded-xl border border-slate-200/90 bg-white shadow-2xs">
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
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/70 py-2 pl-8.5 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <select
                aria-label="Filter by condition"
                value={conditionFilter}
                onChange={(e) => {
                  setConditionFilter(e.target.value as ConditionFilter);
                  setCurrentPage(1);
                }}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-sky-500 focus:outline-none cursor-pointer"
              >
                <option value="All">Condition: All</option>
                <option value="Brand New">Condition: Brand New</option>
                <option value="Used - Grade A">Condition: Used - Grade A</option>
                <option value="Used - Grade B">Condition: Used - Grade B</option>
              </select>
            </div>

            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <span className="text-[11px] text-slate-400">
                Showing {filteredInventory.length === 0 ? 0 : startIndex + 1}-
                {Math.min(startIndex + ITEMS_PER_PAGE, filteredInventory.length)}{' '}
                of {filteredInventory.length} items
              </span>

              <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  aria-label="Table view"
                  className={cn(
                    'rounded p-1.5 transition cursor-pointer',
                    viewMode === 'list'
                      ? 'bg-slate-100 text-slate-900'
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
                    'rounded p-1.5 transition cursor-pointer',
                    viewMode === 'grid'
                      ? 'bg-slate-100 text-slate-900'
                      : 'text-slate-400 hover:text-slate-700',
                  )}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Table or Grid */}
          {viewMode === 'list' ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-semibold text-slate-400">
                    <th className="px-5 py-3">Thumbnail &amp; Product Name</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Condition</th>
                    <th className="px-4 py-3">Serial / SKU</th>
                    <th className="px-4 py-3">Stock Qty</th>
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
                        className="hover:bg-slate-50/60 transition"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="h-10 w-10 shrink-0 rounded-lg border border-slate-200 object-cover bg-slate-100"
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
                        <td className="px-4 py-3.5 text-slate-600">
                          {item.category}
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={cn(
                              'inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold',
                              item.condition === 'Brand New'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-amber-50 text-amber-700',
                            )}
                          >
                            {item.condition}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-semibold text-slate-700">
                            SKU: {item.sku}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            S/N: {item.serial}
                          </p>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={cn(
                              'inline-block rounded-md px-2.5 py-0.5 text-[10px] font-semibold',
                              isOut
                                ? 'bg-rose-50 text-rose-600'
                                : isLow
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-sky-50 text-[#0284c7]',
                            )}
                          >
                            {isOut ? '0 units (Alert)' : `${item.stock} units`}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-bold text-slate-900">
                          $
                          {item.price.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-4 py-3.5 text-slate-500">
                          {item.warranty}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditModal(item)}
                              aria-label={`Edit ${item.name}`}
                              className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(item.id)}
                              aria-label={`Delete ${item.name}`}
                              className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
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
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
              {paginatedInventory.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-200/80 p-4 flex flex-col gap-3"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-12 w-12 rounded-lg border border-slate-200 object-cover"
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
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900">
                      ${item.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {item.stock} units · {item.warranty}
                    </span>
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
                className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
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
                      'h-8 min-w-8 rounded-md px-2.5 text-xs font-semibold transition cursor-pointer',
                      page === safePage
                        ? 'bg-[#0284c7] text-white'
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
                className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Software Key Vault */}
      {activeTab === 'vault' && (
        <div className="mt-5 rounded-xl border border-slate-200/90 bg-white p-5 shadow-2xs">
          <h2 className="text-sm font-bold text-slate-900">
            Digital License Inventory Batches
          </h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-semibold text-slate-400">
                  <th className="px-4 py-3">Software Product</th>
                  <th className="px-4 py-3">Batch ID</th>
                  <th className="px-4 py-3">Available Keys</th>
                  <th className="px-4 py-3">Assigned</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {VAULT_KEYS.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3.5 font-bold text-slate-900">
                      {row.product}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-500">
                      {row.batch}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-[#0284c7]">
                      {row.available} keys
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">
                      {row.assigned} keys
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          'rounded-md px-2 py-0.5 text-[10px] font-semibold',
                          row.status === 'Healthy'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700',
                        )}
                      >
                        {row.status}
                      </span>
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
        <div className="mt-5 rounded-xl border border-slate-200/90 bg-white p-5 shadow-2xs">
          <h2 className="text-sm font-bold text-slate-900">
            Active Technician Repair Queue
          </h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-semibold text-slate-400">
                  <th className="px-4 py-3">Ticket</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Device &amp; Issue</th>
                  <th className="px-4 py-3">Lead Engineer</th>
                  <th className="px-4 py-3">Stage</th>
                  <th className="px-4 py-3">Estimate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {SERVICE_TICKETS.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3.5 font-mono font-bold text-[#0284c7]">
                      #{t.id}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-900">
                      {t.customer}
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-slate-800">{t.device}</p>
                      <p className="text-[11px] text-slate-400">{t.issue}</p>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">{t.engineer}</td>
                    <td className="px-4 py-3.5">
                      <span className="rounded-md bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-[#0284c7]">
                        {t.stage}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-900">
                      {t.estimate}
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
        <div className="mt-5 rounded-xl border border-slate-200/90 bg-white p-5 shadow-2xs">
          <h2 className="text-sm font-bold text-slate-900">
            Recent Customer Orders
          </h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-semibold text-slate-400">
                  <th className="px-4 py-3">Order ID</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Fulfillment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {CUSTOMER_ORDERS.map((o) => (
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
                      <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                        {o.payment}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">
                      {o.fulfillment}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h3 className="text-sm font-bold text-slate-900">
                {editingItem ? 'Edit Hardware Product' : 'Add New Hardware Product'}
              </h3>
              <button
                type="button"
                onClick={() => setProductModalOpen(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3.5 p-5 text-xs">
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
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-sky-500 focus:outline-none"
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
                    placeholder="e.g. Intel i7-13700H, 32GB RAM"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700">
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) =>
                      setFormCategory(
                        e.target.value as AdminInventoryItem['category'],
                      )
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-sky-500 focus:outline-none"
                  >
                    <option value="Laptops">Laptops</option>
                    <option value="Desktops">Desktops</option>
                    <option value="Storage">Storage</option>
                    <option value="Components">Components</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700">
                    Condition
                  </label>
                  <select
                    value={formCondition}
                    onChange={(e) =>
                      setFormCondition(
                        e.target.value as AdminInventoryItem['condition'],
                      )
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-sky-500 focus:outline-none"
                  >
                    <option value="Brand New">Brand New</option>
                    <option value="Used - Grade A">Used - Grade A</option>
                    <option value="Used - Grade B">Used - Grade B</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700">
                    SKU
                  </label>
                  <input
                    type="text"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-sky-500 focus:outline-none"
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
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-sky-500 focus:outline-none"
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
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700">
                    Price ($)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-sky-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700">
                    Warranty
                  </label>
                  <input
                    type="text"
                    value={formWarranty}
                    onChange={(e) => setFormWarranty(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#0284c7] px-4 py-2 font-semibold text-white hover:bg-[#0369a1] cursor-pointer"
                >
                  {editingItem ? 'Save Changes' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
