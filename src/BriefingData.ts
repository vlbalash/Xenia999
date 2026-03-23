export interface ServicePackage {
  id: string;
  name: string;
  price: number;
  features: string[];
  description: string;
  recommended?: boolean;
  badgeText?: string;
  colorVariant?: 'starter' | 'corporate' | 'ecommerce' | 'premium' | 'extra';
}

export interface AddOn {
  id: string;
  name: string;
  priceMin: number;
  priceMax: number;
  description: string;
  selected?: boolean;
}

export interface DesignLevel {
  id: string;
  name: string;
  description: string;
  multiplier: number;
}

export const SERVICE_PACKAGES: ServicePackage[] = [
  {
    id: 'starter',
    name: 'Foundation / Strategic Landing',
    price: 1200,
    description: 'High-conversion single-page architecture with precise animations.',
    features: [
      '1–5 optimized sections',
      'Strategic responsive design',
      'Fluid micro-interactions',
      'Neural contact nodes',
      'Rapid deployment protocol',
      'SEO core integration'
    ],
    colorVariant: 'starter'
  },
  {
    id: 'corporate',
    name: 'Enterprise Architecture',
    price: 2800,
    description: 'Scalable multi-layered ecosystems for established market leaders.',
    features: [
      'Dynamic multi-page framework',
      'Headless CMS infrastructure',
      'Intelligent content systems',
      'Elite UI/UX engineering',
      'Next-gen performance tuning',
      'Deep API integrations'
    ],
    colorVariant: 'corporate'
  },
  {
    id: 'ecommerce',
    name: 'Commercial Ecosystem',
    price: 4800,
    description: 'Revenue-centric digital storefronts engineered for maximum conversion.',
    features: [
      'Full-scale digital commerce',
      'Intelligent product discovery',
      'Optimized checkout pipelines',
      'Global payment orchestration',
      'Enterprise CMS / Admin power',
      'Conversion-DNA strategy'
    ],
    recommended: true,
    badgeText: 'TOP CHOICE',
    colorVariant: 'ecommerce'
  },
  {
    id: 'premium',
    name: 'Elite Digital Genesis',
    price: 8500,
    description: 'Fully bespoke WebGL, 3D, and AI-native product architecture.',
    features: [
      'Bespoke artistic direction',
      'Immersive WebGL environments',
      'Native AI-agent integration',
      'Cinematic motion graphics',
      'Unique digital logic',
      'Full product engineering',
      'Strategic vision consulting'
    ],
    colorVariant: 'premium'
  },
  {
    id: 'extra',
    name: 'Xenia∞ / Venture Scale',
    price: 15000,
    description: 'Full-spectrum digital venture: brand identity, multi-product ecosystem, and dedicated senior team retainer.',
    features: [
      'Full brand identity system',
      'Multi-product digital ecosystem',
      'Dedicated senior team',
      'Ongoing strategy partnership',
      'Custom venture roadmap',
      'Priority 24/7 support SLA',
      'Exclusive creative direction',
      'White-glove onboarding'
    ],
    badgeText: 'XENIA∞',
    colorVariant: 'extra'
  }
];

export const ADD_ONS: AddOn[] = [
  {
    id: 'ai_automation',
    name: 'Neural AI Integration',
    priceMin: 1200,
    priceMax: 3500,
    description: 'Custom AI agents and autonomous workflow automation.'
  },
  {
    id: 'motion_design',
    name: 'Motion Design & Animation',
    priceMin: 800,
    priceMax: 2500,
    description: 'Cinematic intro sequences, scroll-driven reveals, branded lottie animations.'
  },
  {
    id: 'telegram_bot',
    name: 'Telegram Bot Integration',
    priceMin: 600,
    priceMax: 2000,
    description: 'Custom bots for customer support, lead gen, or CRM automation.'
  },
  {
    id: 'headless_cms',
    name: 'Headless CMS',
    priceMin: 1200,
    priceMax: 3500,
    description: 'Decoupled content management for maximum flexibility and speed.'
  },
  {
    id: 'analytics_dashboard',
    name: 'Analytics & Reporting',
    priceMin: 600,
    priceMax: 1800,
    description: 'Custom dashboards with real-time KPIs, funnels, and event tracking.'
  },
  {
    id: 'seo_performance',
    name: 'SEO & Performance',
    priceMin: 500,
    priceMax: 1400,
    description: 'Core Web Vitals, structured data, and search rankings optimization.'
  },
  {
    id: 'cro_optimization',
    name: 'Conversion Optimization',
    priceMin: 700,
    priceMax: 2000,
    description: 'A/B testing and data-driven UI tweaks to maximize revenue.'
  },
  {
    id: 'custom_3d',
    name: 'Immersive Visual Engines',
    priceMin: 1500,
    priceMax: 5500,
    description: 'Bespoke 3D models, WebGL shaders, and interactive particle worlds.'
  },
  {
    id: 'crm_integration',
    name: 'CRM Integration',
    priceMin: 900,
    priceMax: 2500,
    description: 'Sync with HubSpot, Notion, Salesforce, or custom CRM.'
  },
  {
    id: 'ongoing_support',
    name: 'Ongoing Support',
    priceMin: 700,
    priceMax: 2500,
    description: 'Monthly retainer: updates, monitoring, and technical iterations.'
  }
];

export const DESIGN_LEVELS: DesignLevel[] = [
  {
    id: 'standard',
    name: 'Minimalist / Clean',
    description: 'Standard high-quality design focusing on clarity and whitespace.',
    multiplier: 1
  },
  {
    id: 'premium',
    name: 'High-End / Modern',
    description: 'Premium aesthetics with custom layouts and smooth transitions.',
    multiplier: 1.5
  },
  {
    id: 'exclusive',
    name: 'Avant-Garde / WebGL',
    description: 'Exclusive immersive experiences with specialized WebGL / 3D effects.',
    multiplier: 2.2
  }
];

export interface Timeline {
  id: string;
  label: string;
  time: string;
  note: string;
  urgencyTag?: string;
  surcharge: number; // multiplier applied on top of design multiplier (1 = no surcharge)
}

export const TIMELINES: Timeline[] = [
  {
    id: 'standard',
    label: 'Standard',
    time: '4–6 Weeks',
    note: 'Optimal balance of cost and production speed.',
    urgencyTag: 'BALANCED',
    surcharge: 1.0,
  },
  {
    id: 'accelerated',
    label: 'Accelerated',
    time: '2–3 Weeks',
    note: 'Priority queue. Dedicated sprint capacity. +25% rush fee.',
    urgencyTag: 'PRIORITY',
    surcharge: 1.25,
  },
  {
    id: 'vanguard',
    label: 'Vanguard',
    time: 'ASAP',
    note: 'Full dedicated team from day one. +50% rush fee.',
    urgencyTag: 'CRITICAL',
    surcharge: 1.5,
  },
];
