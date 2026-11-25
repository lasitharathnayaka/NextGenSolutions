import { CATALOG_PRODUCTS } from '@/data/catalogProducts';
import { FEATURED_DEALS } from '@/data/featuredProducts';

export interface ConditionTier {
  id: 'brand-new' | 'grade-a' | 'grade-b';
  title: string;
  subtitle: string;
  badgeTag?: string;
  price: number;
  photoBadge: string;
  batteryHealth: string;
  cosmeticGrade: string;
  warrantyTitle: string;
  warrantySubtitle: string;
}

export interface ProductSpecRow {
  label: string;
  value: string;
}

export interface ProductReview {
  id: string;
  initials: string;
  author: string;
  date: string;
  rating: number;
  comment: string;
  verified: boolean;
}

export interface DockOption {
  id: string;
  name: string;
  compatible: boolean;
  badgeText: string;
  headline: string;
  details: string;
}

export interface ProductDetailData {
  id: string;
  sku: string;
  categoryLabel: string;
  breadcrumbName: string;
  title: string;
  rating: number;
  reviewCount: number;
  gallery: { src: string; alt: string; objectPosition?: string }[];
  defaultConditionId: 'brand-new' | 'grade-a' | 'grade-b';
  conditions: ConditionTier[];
  thermalStatus: string;
  osInstallation: string;
  specs: ProductSpecRow[];
  docks: DockOption[];
  reviews: ProductReview[];
}

export const DEFAULT_DOCK_OPTIONS: DockOption[] = [
  {
    id: 'wd22tb4',
    name: 'Dell Thunderbolt Dock - WD22TB4',
    compatible: true,
    badgeText: '100% Compatible',
    headline: 'Full Power Delivery & Display Passthrough Verified',
    details:
      'Supports dual 4K displays at 60Hz and 130W power delivery through single Thunderbolt 4 cable.',
  },
  {
    id: 'ud22',
    name: 'Dell Universal Dock - UD22',
    compatible: true,
    badgeText: '100% Compatible',
    headline: 'USB-C Alt-Mode & 96W Host Charging Verified',
    details:
      'Supports up to triple FHD displays, Gigabit Ethernet, and 96W charging over a single USB-C cable.',
  },
  {
    id: 'caldigit-ts4',
    name: 'CalDigit TS4 Thunderbolt 4 Dock',
    compatible: true,
    badgeText: '100% Compatible',
    headline: 'Full 40Gb/s Bandwidth & 98W Delivery Verified',
    details:
      'Verified 2.5GbE networking, dual 4K@60Hz output, UHS-II SD card reader, and 98W continuous host charging.',
  },
  {
    id: 'travel-hub-45w',
    name: 'Generic USB-C 45W Travel Hub',
    compatible: false,
    badgeText: 'Partial Fit',
    headline: 'Reduced Power Delivery Under Peak Load',
    details:
      'HDMI output and USB peripherals work normally, but 45W passthrough may trigger slow-charge alerts under sustained load.',
  },
];

export const DEFAULT_REVIEWS: ProductReview[] = [
  {
    id: 'rev-1',
    initials: 'JD',
    author: 'Jonathan D.',
    date: '2 days ago',
    rating: 5,
    comment:
      '"Arrived in immaculate condition. Battery health reported at 96% which exceeded the advertised 95%. Saved over $400 compared to brand new."',
    verified: true,
  },
  {
    id: 'rev-2',
    initials: 'SM',
    author: 'Sarah M.',
    date: '1 week ago',
    rating: 5,
    comment:
      '"The inspection report transparency is unmatched. Got exactly what was described, clean OS install with zero bloatware. Works flawlessly with my dock."',
    verified: true,
  },
  {
    id: 'rev-3',
    initials: 'RK',
    author: 'Robert K.',
    date: '3 weeks ago',
    rating: 5,
    comment:
      '"Very solid machine. Minor scuff on the underside as noted in Grade A description, screen and keyboard are pristine. Fast shipping too."',
    verified: true,
  },
];

const DELL_LATITUDE_DETAIL: ProductDetailData = {
  id: 'dell-latitude-7430',
  sku: 'NGS-2231',
  categoryLabel: 'Laptops & Desktops',
  breadcrumbName: 'Dell Latitude 7430 Business Ultrabook',
  title: 'Dell Latitude 7430 Business Ultrabook - 14" FHD+',
  rating: 4.8,
  reviewCount: 124,
  gallery: [
    {
      src: '/images/dell-latitude-7430.jpg',
      alt: 'Dell Latitude 7430 front three-quarter view',
      objectPosition: 'center center',
    },
    {
      src: '/images/apex-ultrabook.jpg',
      alt: 'Dell Latitude 7430 aluminum chassis & workspace angle',
      objectPosition: 'center center',
    },
    {
      src: '/images/dell-xps-15.jpg',
      alt: 'Dell Latitude 7430 keyboard and trackpad detail',
      objectPosition: 'center 65%',
    },
    {
      src: '/images/thinkpad-x1.jpg',
      alt: 'Dell Latitude 7430 side profile and Thunderbolt ports',
      objectPosition: 'left center',
    },
  ],
  defaultConditionId: 'grade-a',
  conditions: [
    {
      id: 'brand-new',
      title: 'Brand New',
      subtitle: 'Original factory sealed box',
      price: 1099,
      photoBadge: 'Brand New · 100% Battery Health',
      batteryHealth: '100% Factory New Capacity',
      cosmeticGrade: 'Brand New (Factory Sealed Box)',
      warrantyTitle: '1-Year Official Manufacturer Warranty Included',
      warrantySubtitle: 'Extendable to 3-Year ProSupport Coverage for $129 at checkout',
    },
    {
      id: 'grade-a',
      title: 'Used - Grade A Certified',
      subtitle: 'Thoroughly tested & fully restored',
      badgeTag: 'Best Value',
      price: 649,
      photoBadge: 'Used - Grade A Certified · 95% Battery Health',
      batteryHealth: '95% Original Capacity',
      cosmeticGrade: 'Grade A (Minimal micro-scratches on lid)',
      warrantyTitle: '6-Month NextGenSolutions Hardware Warranty Included',
      warrantySubtitle: 'Extendable to 2-Year Full Coverage for $89 at checkout',
    },
    {
      id: 'grade-b',
      title: 'Used - Grade B',
      subtitle: 'Minor cosmetic wear, fully functional',
      price: 529,
      photoBadge: 'Used - Grade B Certified · 86% Battery Health',
      batteryHealth: '86% Original Capacity',
      cosmeticGrade: 'Grade B (Light scuffs on lid & palm rest)',
      warrantyTitle: '3-Month NextGenSolutions Hardware Warranty Included',
      warrantySubtitle: 'Extendable to 1-Year Full Coverage for $59 at checkout',
    },
  ],
  thermalStatus: 'Passed 100%',
  osInstallation: 'Clean Windows 11 Pro Install',
  specs: [
    { label: 'Processor', value: 'Intel Core i7-13700H (14 Cores, up to 5.0 GHz)' },
    { label: 'Memory (RAM)', value: '32GB LPDDR5 5200MHz (Integrated)' },
    { label: 'Storage', value: '1TB NVMe Gen4 M.2 SSD (Read 7000MB/s)' },
    { label: 'Display', value: '14" FHD+ (1920 x 1200) IPS Anti-Glare, 400 nits' },
    { label: 'Graphics', value: 'Intel Iris Xe Graphics' },
    { label: 'Ports & Connectivity', value: '2x Thunderbolt 4, HDMI 2.0, USB-A 3.2, Wi-Fi 6E' },
    { label: 'Security', value: 'Fingerprint Reader, IR Camera for Windows Hello, TPM 2.0' },
  ],
  docks: DEFAULT_DOCK_OPTIONS,
  reviews: DEFAULT_REVIEWS,
};

export function getProductDetailById(id?: string): ProductDetailData {
  if (!id || id === 'dell-latitude-7430') {
    return DELL_LATITUDE_DETAIL;
  }

  const catalogMatch = CATALOG_PRODUCTS.find((p) => p.id === id);
  if (catalogMatch) {
    const basePrice = catalogMatch.price;
    const isNew = catalogMatch.condition === 'Brand New';
    const isGradeB = catalogMatch.condition === 'Used - Grade B';

    const brandNewPrice = isNew ? basePrice : Math.round(basePrice * 1.45);
    const gradeAPrice = isNew ? Math.round(basePrice * 0.78) : basePrice;
    const gradeBPrice = Math.round(gradeAPrice * 0.82);

    return {
      id: catalogMatch.id,
      sku: catalogMatch.sku,
      categoryLabel:
        catalogMatch.category === 'Laptops' || catalogMatch.category === 'Desktops'
          ? 'Laptops & Desktops'
          : catalogMatch.category,
      breadcrumbName: catalogMatch.name,
      title: catalogMatch.name,
      rating: 4.8,
      reviewCount: 96,
      gallery: [
        { src: catalogMatch.image, alt: `${catalogMatch.name} main view` },
        { src: '/images/dell-xps-15.jpg', alt: `${catalogMatch.name} alternate view` },
        { src: '/images/thinkpad-x1.jpg', alt: `${catalogMatch.name} workspace angle` },
        { src: '/images/dell-latitude-7430.jpg', alt: `${catalogMatch.name} detail angle` },
      ],
      defaultConditionId: isNew ? 'brand-new' : isGradeB ? 'grade-b' : 'grade-a',
      conditions: [
        {
          id: 'brand-new',
          title: 'Brand New',
          subtitle: 'Original factory sealed box',
          price: brandNewPrice,
          photoBadge: 'Brand New · Factory Sealed',
          batteryHealth: '100% Factory New Capacity',
          cosmeticGrade: 'Brand New (Factory Sealed Box)',
          warrantyTitle: `${catalogMatch.warranty} Included`,
          warrantySubtitle: 'Extendable to 3-Year Enterprise Coverage at checkout',
        },
        {
          id: 'grade-a',
          title: 'Used - Grade A Certified',
          subtitle: 'Thoroughly tested & fully restored',
          badgeTag: 'Best Value',
          price: gradeAPrice,
          photoBadge: `${catalogMatch.conditionLabel === 'Brand New' ? 'Used - Grade A Certified · 95% Battery Health' : catalogMatch.conditionLabel}`,
          batteryHealth: '95% Original Capacity',
          cosmeticGrade: 'Grade A (Minimal micro-scratches on chassis)',
          warrantyTitle: '6-Month NextGenSolutions Hardware Warranty Included',
          warrantySubtitle: 'Extendable to 2-Year Full Coverage for $89 at checkout',
        },
        {
          id: 'grade-b',
          title: 'Used - Grade B',
          subtitle: 'Minor cosmetic wear, fully functional',
          price: gradeBPrice,
          photoBadge: 'Used - Grade B · 84% Battery Health',
          batteryHealth: '84% Original Capacity',
          cosmeticGrade: 'Grade B (Light cosmetic wear, 100% functional)',
          warrantyTitle: '3-Month NextGenSolutions Hardware Warranty Included',
          warrantySubtitle: 'Extendable to 1-Year Full Coverage for $59 at checkout',
        },
      ],
      thermalStatus: 'Passed 100%',
      osInstallation:
        catalogMatch.category === 'RAM' || catalogMatch.category === 'SSD / Storage'
          ? 'Diagnostic Burn-In Verified'
          : 'Clean Windows 11 Pro Install',
      specs: [
        { label: 'Brand', value: catalogMatch.brand },
        { label: 'Category', value: catalogMatch.category },
        { label: 'Key Configuration', value: catalogMatch.specs.join(' · ') },
        { label: 'SKU Reference', value: catalogMatch.sku },
        { label: 'Inspection Standard', value: 'NextGen 40-Point Hardware Diagnostics' },
        { label: 'Warranty Coverage', value: catalogMatch.warranty },
      ],
      docks: DEFAULT_DOCK_OPTIONS,
      reviews: DEFAULT_REVIEWS,
    };
  }

  const featuredMatch = FEATURED_DEALS.find((p) => p.id === id);
  if (featuredMatch) {
    const basePrice = featuredMatch.price;
    return {
      ...DELL_LATITUDE_DETAIL,
      id: featuredMatch.id,
      sku: `NGS-${featuredMatch.id.slice(0, 4).toUpperCase()}`,
      breadcrumbName: featuredMatch.name,
      title: featuredMatch.name,
      gallery: [
        { src: featuredMatch.image, alt: featuredMatch.name },
        { src: '/images/hero-workstation.jpg', alt: `${featuredMatch.name} setup view` },
        { src: '/images/dell-xps-15.jpg', alt: `${featuredMatch.name} close-up` },
        { src: '/images/quantum-nvme.jpg', alt: `${featuredMatch.name} internal storage` },
      ],
      defaultConditionId:
        featuredMatch.badge === 'Used - Grade A' ? 'grade-a' : 'brand-new',
      conditions: [
        {
          ...DELL_LATITUDE_DETAIL.conditions[0],
          price: basePrice,
          warrantyTitle: `${featuredMatch.warranty} Included`,
        },
        {
          ...DELL_LATITUDE_DETAIL.conditions[1],
          price: Math.round(basePrice * 0.8),
        },
        {
          ...DELL_LATITUDE_DETAIL.conditions[2],
          price: Math.round(basePrice * 0.68),
        },
      ],
      specs: featuredMatch.specs.map((spec, idx) => ({
        label: idx === 0 ? 'Primary Spec' : idx === 1 ? 'Memory / Detail' : 'Storage / Support',
        value: spec,
      })),
    };
  }

  return DELL_LATITUDE_DETAIL;
}
