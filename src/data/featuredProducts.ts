export type DealCategory = 'all' | 'workstations' | 'components';

export interface FeaturedDealProduct {
  id: string;
  sku: string;
  name: string;
  badge: string;
  badgeVariant: 'emerald' | 'amber';
  category: 'workstations' | 'components' | 'software';
  image: string;
  specs: string[];
  warranty: string;
  price: number;
  priceSuffix?: string;
}

export const FEATURED_DEALS: FeaturedDealProduct[] = [
  {
    id: 'nextgen-titan-x-pro',
    sku: 'NGS-9940',
    name: 'NextGen Titan X Pro',
    badge: 'Brand New',
    badgeVariant: 'emerald',
    category: 'workstations',
    image: '/images/titan-x-pro.jpg',
    specs: [
      'AMD Ryzen Threadripper 7970X',
      '64GB DDR5 ECC RAM',
      '2TB Gen5 NVMe + RTX 4090',
    ],
    warranty: '3-Year Global Warranty',
    price: 749000,
  },
  {
    id: 'apex-ultrabook-15-6',
    sku: 'NGS-6510',
    name: 'Apex UltraBook 15.6',
    badge: 'Used - Grade A',
    badgeVariant: 'amber',
    category: 'workstations',
    image: '/images/apex-ultrabook.jpg',
    specs: [
      'Intel Core i7-13700H',
      '32GB LPDDR5 RAM',
      '1TB High-Speed SSD',
    ],
    warranty: '1-Year Certified Warranty',
    price: 345000,
  },
  {
    id: 'quantum-nvme-2tb-gen4',
    sku: 'NGS-7721',
    name: 'Quantum NVMe 2TB Gen4',
    badge: 'Brand New',
    badgeVariant: 'emerald',
    category: 'components',
    image: '/images/quantum-nvme.jpg',
    specs: [
      'Read: 7450 MB/s',
      'Write: 6500 MB/s',
      'DRAM Cache Included',
    ],
    warranty: '5-Year Global Warranty',
    price: 56500,
  },
  {
    id: 'cybercraft-pro-studio',
    sku: 'NGS-SW-006',
    name: 'CyberCraft Pro Studio',
    badge: 'Instant Delivery',
    badgeVariant: 'emerald',
    category: 'software',
    image: '/images/cybercraft-studio.jpg',
    specs: [
      'Annual Enterprise License',
      'Priority Cloud Rendering',
      '24/7 Dedicated Support',
    ],
    warranty: 'Official License Key',
    price: 89500,
    priceSuffix: '/yr',
  },
];
