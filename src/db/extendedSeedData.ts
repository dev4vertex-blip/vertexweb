import crypto from 'crypto';

// ============================================================================
// 1. SERVICES & CATEGORIES INTERFACES & INITIAL DATA
// ============================================================================

export interface ServiceCategoryRecord {
  id: number;
  name: string;
  slug?: string;
  code?: string;
  description?: string | null;
  icon?: string;
  sort_order?: number;
  active?: boolean;
  created_at: string;
  deleted_at?: string | null;
}

export interface ServiceRecord {
  id: string;
  public_id: string;
  name: string;
  slug?: string;
  category_id: number;
  category_name?: string;
  category_code?: string;
  description?: string | null;
  short_description?: string | null;
  price?: number;
  base_price?: number;
  discounted_price?: number;
  strike_price?: number | null;
  duration_minutes: number;
  requirements?: string[];
  availability?: string[];
  features?: string[];
  warranty_days?: number;
  sla_hours?: number;
  tax_rate?: number;
  tax_percent?: number;
  image_url?: string | null;
  status?: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  is_active?: boolean;
  sort_order?: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export const INITIAL_SERVICE_CATEGORIES: ServiceCategoryRecord[] = [
  {
    id: 1,
    name: 'Air Conditioner & HVAC',
    slug: 'ac-hvac',
    code: 'AC_HVAC',
    description: 'Split, Window, Cassette and Commercial HVAC preventive care, deep cleaning and repairs.',
    icon: '❄️',
    sort_order: 1,
    active: true,
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
  {
    id: 2,
    name: 'Refrigeration & Chillers',
    slug: 'refrigeration',
    code: 'REFRIGERATION',
    description: 'Inverter double door, side-by-side, deep freezers and commercial chillers diagnostics.',
    icon: '🧊',
    sort_order: 2,
    active: true,
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
  {
    id: 3,
    name: 'Electrical & Power Systems',
    slug: 'electrical',
    code: 'ELECTRICAL',
    description: 'Distribution boards, heavy load appliance wiring, earthing, surge protection and safety audit.',
    icon: '⚡',
    sort_order: 3,
    active: true,
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
  {
    id: 4,
    name: 'Water Purifiers & RO Systems',
    slug: 'water-purifiers',
    code: 'WATER_RO',
    description: 'Multi-stage RO membrane replacement, UV lamp checks, TDS tuning and booster pump repairs.',
    icon: '💧',
    sort_order: 4,
    active: true,
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
  {
    id: 5,
    name: 'Washing Machines & Dryers',
    slug: 'washing-machines',
    code: 'WASHING_MACHINE',
    description: 'Front load, top load, motor drum repair, inlet solenoid valve fix and descaling.',
    icon: '🔄',
    sort_order: 5,
    active: true,
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
];

export const INITIAL_SERVICES: ServiceRecord[] = [
  {
    id: 'srv-001',
    public_id: 'VXSRV-000001',
    name: 'Split AC Foam Jet Deep Service',
    slug: 'split-ac-foam-jet',
    category_id: 1,
    category_name: 'Air Conditioner & HVAC',
    description: '2x high pressure foam cleaning of cooling coil, blower barrel, drain tray disinfection and gas pressure inspection.',
    price: 699,
    discounted_price: 599,
    duration_minutes: 60,
    requirements: ['Water source within 10 meters', 'Standard electrical 16A wall outlet'],
    availability: ['Delhi', 'Gurgaon', 'Noida', 'Mumbai', 'Bangalore'],
    tax_percent: 18,
    status: 'ACTIVE',
    sort_order: 1,
    created_at: new Date(Date.now() - 45 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  },
  {
    id: 'srv-002',
    public_id: 'VXSRV-000002',
    name: 'AC Gas Charging (Complete R32/R410a)',
    slug: 'ac-gas-charging-full',
    category_id: 1,
    category_name: 'Air Conditioner & HVAC',
    description: 'Nitrogen leak identification, brazing fix, full vacuum evacuation and pure virgin refrigerant replenishment with warranty.',
    price: 2699,
    discounted_price: 2499,
    duration_minutes: 90,
    requirements: ['Outdoor unit must be physically accessible with safety provision'],
    availability: ['Delhi', 'Gurgaon', 'Noida', 'Mumbai', 'Bangalore', 'Pune'],
    tax_percent: 18,
    status: 'ACTIVE',
    sort_order: 2,
    created_at: new Date(Date.now() - 40 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  },
  {
    id: 'srv-003',
    public_id: 'VXSRV-000003',
    name: 'Double Door Refrigerator Diagnostics & Repair',
    slug: 'refrigerator-diagnostics-repair',
    category_id: 2,
    category_name: 'Refrigeration & Chillers',
    description: 'Comprehensive cooling failure diagnosis, defrost timer/bi-metal sensor check, compressor relay inspection.',
    price: 499,
    discounted_price: 449,
    duration_minutes: 45,
    requirements: ['Appliance unplugged 15 minutes before technician arrival'],
    availability: ['Delhi', 'Gurgaon', 'Noida', 'Mumbai', 'Bangalore'],
    tax_percent: 18,
    status: 'ACTIVE',
    sort_order: 3,
    created_at: new Date(Date.now() - 35 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  },
  {
    id: 'srv-004',
    public_id: 'VXSRV-000004',
    name: 'Commercial Cassette AC Chemical Wash',
    slug: 'cassette-ac-chemical-wash',
    category_id: 1,
    category_name: 'Air Conditioner & HVAC',
    description: 'Heavy duty motorized chemical flush for commercial ceiling cassettes, drain pump de-clogging and motor bearing lubrication.',
    price: 1499,
    discounted_price: 1299,
    duration_minutes: 75,
    requirements: ['Ladder provision for ceilings above 10 feet'],
    availability: ['Delhi', 'Gurgaon', 'Noida', 'Mumbai', 'Bangalore'],
    tax_percent: 18,
    status: 'ACTIVE',
    sort_order: 4,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  },
  {
    id: 'srv-005',
    public_id: 'VXSRV-000005',
    name: 'RO Purifier Complete Service & Mineral Cartridge',
    slug: 'ro-complete-service-filter',
    category_id: 4,
    category_name: 'Water Purifiers & RO Systems',
    description: 'Sediment, pre-carbon, post-carbon cartridge replacement, membrane TDS calibration and automatic leak shut-off test.',
    price: 1999,
    discounted_price: 1799,
    duration_minutes: 45,
    requirements: ['Continuous raw tap water supply during service check'],
    availability: ['Delhi', 'Gurgaon', 'Noida', 'Mumbai', 'Bangalore', 'Pune'],
    tax_percent: 18,
    status: 'ACTIVE',
    sort_order: 5,
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  },
  {
    id: 'srv-006',
    public_id: 'VXSRV-000006',
    name: 'Home Heavy Appliance Electrical Audit',
    slug: 'home-electrical-safety-audit',
    category_id: 3,
    category_name: 'Electrical & Power Systems',
    description: 'Thermal imaging of MCB board, earthing resistance megger test, neutral leakage assessment and socket load testing.',
    price: 1499,
    discounted_price: 1299,
    duration_minutes: 60,
    requirements: ['Full access to main distribution panel board'],
    availability: ['Delhi', 'Gurgaon', 'Noida', 'Mumbai'],
    tax_percent: 18,
    status: 'ACTIVE',
    sort_order: 6,
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  },
];

// ============================================================================
// 2. AMC PLANS INTERFACES & INITIAL DATA
// ============================================================================

export interface AmcPlanRecord {
  id: string;
  public_id?: string;
  name: string;
  code?: string;
  tier?: string;
  appliance_category?: string;
  slug?: string;
  description?: string;
  duration_months: number;
  price?: number;
  base_price?: number;
  strike_price?: number | null;
  tax_percent?: number;
  preventive_visits?: number;
  breakdown_visits?: number;
  spare_parts_discount_percent?: number;
  gas_charging_included?: boolean;
  priority_sla_hours?: number;
  coverage_details?: string | null;
  features?: string[];
  terms_conditions?: string | null;
  sort_order?: number;
  included_services?: string[];
  visit_frequency?: string;
  preventive_maintenance_visits?: number;
  emergency_coverage?: string;
  benefits?: string[];
  exclusions?: string[];
  service_limits?: string;
  renewal_rules?: string;
  eligibility?: string;
  terms?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  is_active?: boolean;
  active_subscriptions_count?: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export const INITIAL_AMC_PLANS: AmcPlanRecord[] = [
  {
    id: 'amc-plan-001',
    public_id: 'VXAMC-000001',
    name: 'Residential Dual AC Platinum Care',
    slug: 'residential-dual-ac-platinum',
    description: 'Year-round end-to-end coverage for 2 Split/Window AC units including scheduled cleanings and unlimited emergency breakdowns.',
    duration_months: 12,
    price: 3499,
    tax_percent: 18,
    included_services: ['Split AC Foam Jet Deep Service', 'AC Gas Charging (Complete R32/R410a)'],
    visit_frequency: 'Tri-annual (Pre-summer, Mid-summer, Post-season)',
    preventive_maintenance_visits: 3,
    emergency_coverage: 'Unlimited free breakdown visits within 4 hours SLA',
    benefits: [
      '3 Scheduled foam-jet preventive washes per AC',
      'Free breakdown inspection & labor included',
      '1 Free gas top-up up to 400g included',
      '15% Flat discount on genuine replacement spares',
      'VIP priority dispatch queue',
    ],
    exclusions: [
      'Compressor motor replacement parts cost (labor covered)',
      'Physical accidental damage or external casing breakage',
      'Repositioning or uninstallation to another premise',
    ],
    service_limits: 'Covers up to 2 AC units located at a single residential premises',
    renewal_rules: 'Auto-renewal eligible with 10% loyalty rebate upon expiry',
    eligibility: 'Inverter or non-inverter AC units aged under 7 years',
    terms: 'Standard VERTEX residential warranty terms apply. Spares provided are certified OEM with 90-day parts warranty.',
    status: 'ACTIVE',
    active_subscriptions_count: 142,
    created_at: new Date(Date.now() - 40 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  },
  {
    id: 'amc-plan-002',
    public_id: 'VXAMC-000002',
    name: 'Enterprise Facility Comprehensive HVAC AMC',
    slug: 'enterprise-facility-hvac-amc',
    description: 'Commercial maintenance contract tailored for offices, clinics and retail spaces with up to 12 cassette and ductable units.',
    duration_months: 12,
    price: 18500,
    tax_percent: 18,
    included_services: ['Commercial Cassette AC Chemical Wash', 'Home Heavy Appliance Electrical Audit'],
    visit_frequency: 'Bi-monthly (6 scheduled maintenance visits per year)',
    preventive_maintenance_visits: 6,
    emergency_coverage: '24/7 dedicated enterprise engineer SLA under 2 hours',
    benefits: [
      '6 Complete chemical coil and condenser deep flushes',
      'Dedicated enterprise key account manager & assigned fleet',
      'Comprehensive electrical load & thermal diagnostic reporting',
      '20% Discount on industrial compressors and blower fans',
      'Detailed quarterly energy consumption and efficiency audit',
    ],
    exclusions: [
      'Central chiller plant cooling towers exceeding 20 TR',
      'Custom duct re-insulation work exceeding 5 meters',
    ],
    service_limits: 'Up to 12 indoor units / 24 TR cumulative capacity at single facility',
    renewal_rules: 'Annual renewal with quarterly flexible billing option for GST compliance',
    eligibility: 'Commercial properties with operational 3-phase power infrastructure',
    terms: 'Enterprise SLA agreements with penalty clauses for delayed emergency dispatch.',
    status: 'ACTIVE',
    active_subscriptions_count: 38,
    created_at: new Date(Date.now() - 35 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  },
  {
    id: 'amc-plan-003',
    public_id: 'VXAMC-000003',
    name: 'PureGuard Whole-Home RO & Purifier AMC',
    slug: 'pureguard-home-ro-amc',
    description: 'All-inclusive water purifier annual maintenance covering all periodic filter replacements and pump maintenance.',
    duration_months: 12,
    price: 2499,
    tax_percent: 18,
    included_services: ['RO Purifier Complete Service & Mineral Cartridge'],
    visit_frequency: 'Quarterly (4 scheduled service visits per year)',
    preventive_maintenance_visits: 4,
    emergency_coverage: 'Same-day breakdown resolution for water leakage or pump shutoff',
    benefits: [
      'All sediment, pre-carbon and mineral cartridge replacements free',
      '1 Free RO membrane replacement included per contract cycle',
      'Quarterly laboratory-grade TDS and water hardness testing',
      'Free replacement of booster pump SMPS power adaptors',
    ],
    exclusions: [
      'Raw water storage tank cleaning (available as add-on)',
      'Water softening plant resination',
    ],
    service_limits: '1 Domestic RO unit up to 25 LPH capacity',
    renewal_rules: 'Annual renewal with complimentary filter replacement upon early payment',
    eligibility: 'Standard domestic RO systems with input TDS under 2500 ppm',
    terms: 'Filters and membranes used are NSF certified food-grade materials.',
    status: 'ACTIVE',
    active_subscriptions_count: 95,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  },
];

// ============================================================================
// 3. PARTNERS & COMMISSION MANAGEMENT INTERFACES & INITIAL DATA
// ============================================================================

export interface PartnerRecord {
  id: string;
  public_id: string;
  user_id?: string | null;
  company_name: string;
  contact_person: string;
  phone: string;
  email: string;
  status: 'ACTIVE' | 'INACTIVE';
  address?: string;
  city_id?: number;
  city_name?: string;
  commission_type?: 'PERCENTAGE' | 'FIXED' | 'TIERED';
  default_rate?: number;
  bank_account_masked?: string;
  pan_masked?: string;
  gstin?: string;
  pan_number?: string | null;
  gst_number?: string | null;
  bank_account_number?: string | null;
  bank_ifsc?: string | null;
  bank_name?: string | null;
  tier?: string;
  total_referrals?: number;
  total_commission_earned: number;
  total_commission_paid: number;
  pending_commission?: number;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CommissionRuleRecord {
  id: string;
  version: number;
  rule_name?: string;
  name?: string;
  effective_from: string;
  effective_to?: string | null;
  rule_type?: 'PERCENTAGE' | 'FIXED';
  commission_type?: 'PERCENTAGE' | 'FIXED';
  rate_value?: number;
  applies_to?: string;
  service_id?: string | null;
  category_id?: number | null;
  amc_plan_id?: string | null;
  partner_tier?: string;
  service_percentage?: number;
  amc_percentage?: number;
  lead_conversion_amount?: number;
  min_booking_value?: number | null;
  is_active?: boolean;
  status?: 'ACTIVE' | 'UPCOMING' | 'ARCHIVED';
  notes?: string | null;
  description?: string | null;
  created_by?: string;
  created_at: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface PartnerCommissionRecord {
  id: string;
  public_id: string;
  partner_id: string;
  partner_name?: string;
  booking_id?: string | null;
  lead_id?: string | null;
  commission_rule_id?: string | null;
  service_name?: string;
  rule_version?: number;
  base_amount?: number;
  booking_amount?: number;
  commission_amount: number;
  status: 'PENDING' | 'PENDING_APPROVAL' | 'APPROVED' | 'PAID' | 'DISPUTED';
  dispute_reason?: string | null;
  approved_by?: string | null;
  approved_at?: string | null;
  paid_at?: string | null;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const INITIAL_COMMISSION_RULES: CommissionRuleRecord[] = [
  {
    id: 'crule-001',
    version: 1,
    rule_name: 'Standard Channel Partner Rate (v1.0)',
    effective_from: '2025-01-01',
    effective_to: null,
    commission_type: 'PERCENTAGE',
    service_percentage: 10.0,
    amc_percentage: 12.5,
    lead_conversion_amount: 350,
    status: 'ACTIVE',
    notes: 'Base commission standard across all authorized retail and corporate partners.',
    created_by: 'SUPER_ADMIN',
    created_at: new Date(Date.now() - 100 * 86400000).toISOString(),
  },
  {
    id: 'crule-002',
    version: 2,
    rule_name: 'Q4 Festive Surge Growth Commission (v2.0 Draft)',
    effective_from: '2026-10-01',
    effective_to: '2026-12-31',
    commission_type: 'PERCENTAGE',
    service_percentage: 12.0,
    amc_percentage: 15.0,
    lead_conversion_amount: 500,
    status: 'UPCOMING',
    notes: 'Incentive surge for Diwali and pre-winter commercial HVAC conversions.',
    created_by: 'SUPER_ADMIN',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
];

export const INITIAL_PARTNERS: PartnerRecord[] = [
  {
    id: 'ptn-001',
    public_id: 'VXPTN-000001',
    user_id: 'usr-partner-1',
    company_name: 'Apex Retail Solutions Ltd',
    contact_person: 'Vikas Agarwal',
    phone: '+91 99000 00025',
    email: 'partner@apexsolutions.demo',
    status: 'ACTIVE',
    address: 'Unit 402, Trade Tower, Bandra Kurla Complex',
    city_id: 4,
    city_name: 'Mumbai',
    commission_type: 'PERCENTAGE',
    default_rate: 12.5,
    bank_account_masked: '•••• •••• •••• 4491',
    pan_masked: 'AAACP••••H',
    gstin: '27AAACP9921H1Z4',
    total_commission_earned: 48900,
    total_commission_paid: 42000,
    pending_commission: 6900,
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  },
  {
    id: 'ptn-002',
    public_id: 'VXPTN-000002',
    company_name: 'BlueSky Facility Solutions',
    contact_person: 'Sunil Bhatia',
    phone: '+91 98112 33445',
    email: 'sunil@blueskyfacility.in',
    status: 'ACTIVE',
    address: 'B-12, Sector 62',
    city_id: 3,
    city_name: 'Noida',
    commission_type: 'PERCENTAGE',
    default_rate: 12.5,
    bank_account_masked: '•••• •••• •••• 8820',
    pan_masked: 'AALCB••••K',
    gstin: '09AALCB3312K1Z9',
    total_commission_earned: 27500,
    total_commission_paid: 25000,
    pending_commission: 2500,
    created_at: new Date(Date.now() - 50 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  },
  {
    id: 'ptn-003',
    public_id: 'VXPTN-000003',
    company_name: 'Grandeur Condominiums RWA Alliance',
    contact_person: 'Harish Mehta',
    phone: '+91 98200 11998',
    email: 'alliance@grandeurrwa.org',
    status: 'ACTIVE',
    address: 'Golf Course Road, DLF Phase 5',
    city_id: 2,
    city_name: 'Gurgaon',
    commission_type: 'PERCENTAGE',
    default_rate: 10.0,
    bank_account_masked: '•••• •••• •••• 1209',
    pan_masked: 'AABTG••••E',
    gstin: '06AABTG7712E1Z2',
    total_commission_earned: 19400,
    total_commission_paid: 15000,
    pending_commission: 4400,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  },
];

export const INITIAL_PARTNER_COMMISSIONS: PartnerCommissionRecord[] = [
  {
    id: 'comm-001',
    public_id: 'VXCOM-000001',
    partner_id: 'ptn-001',
    partner_name: 'Apex Retail Solutions Ltd',
    booking_id: 'bk-101',
    service_name: 'Residential Dual AC Platinum Care (2 units)',
    rule_version: 1,
    base_amount: 3499,
    commission_amount: 437.38,
    status: 'APPROVED',
    approved_by: 'Suresh Narang (FINANCE)',
    approved_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    paid_at: null,
    notes: 'Channel referral confirmed through registered QR token.',
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'comm-002',
    public_id: 'VXCOM-000002',
    partner_id: 'ptn-002',
    partner_name: 'BlueSky Facility Solutions',
    booking_id: 'bk-102',
    service_name: 'Enterprise Facility Comprehensive HVAC AMC',
    rule_version: 1,
    base_amount: 18500,
    commission_amount: 2312.50,
    status: 'PENDING',
    approved_by: null,
    approved_at: null,
    paid_at: null,
    notes: 'Commercial installation verified; awaiting finance clearance of advance invoice.',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'comm-003',
    public_id: 'VXCOM-000003',
    partner_id: 'ptn-003',
    partner_name: 'Grandeur Condominiums RWA Alliance',
    booking_id: 'bk-103',
    service_name: 'Split AC Foam Jet Deep Service (5 units bundle)',
    rule_version: 1,
    base_amount: 2995,
    commission_amount: 299.50,
    status: 'PAID',
    approved_by: 'Suresh Narang (FINANCE)',
    approved_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    paid_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    notes: 'Disbursed via IMPS batch #IMPS998812',
    created_at: new Date(Date.now() - 16 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
];

// ============================================================================
// 4. HR MODULE (ON-ROLL STAFF) INTERFACES & INITIAL DATA
// ============================================================================

export interface DepartmentRecord {
  id: string;
  name: string;
  code: string;
  manager_id?: string | null;
  manager_name?: string | null;
  created_at: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface DesignationRecord {
  id: string;
  title: string;
  code?: string;
  department_id: string;
  department_name?: string;
  level: string;
  description?: string;
  is_active?: boolean;
  created_at: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface ShiftRecord {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  grace_period_mins: number;
  created_at: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface EmployeeRecord {
  id: string;
  employee_id?: string; // e.g. 'VXEMP-001'
  employee_code?: string;
  user_id?: string | null;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  profile_photo?: string | null;
  dob?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  personal_email?: string | null;
  work_email?: string | null;
  personal_phone?: string;
  phone?: string;
  emergency_contact?: {
    name: string;
    phone: string;
    relation: string;
  };
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  address?: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  joining_date?: string;
  date_of_joining?: string;
  employment_status?: 'ACTIVE' | 'PROBATION' | 'ON_NOTICE' | 'ON_LEAVE' | 'SUSPENDED' | 'RESIGNED' | 'TERMINATED' | 'INACTIVE';
  status?: string;
  department_id: string;
  department_name?: string;
  designation_id: string;
  designation_name?: string;
  reporting_manager_id?: string | null;
  reporting_manager_name?: string | null;
  work_location?: string;
  employment_type?: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | string;
  shift_id?: string;
  shift_name?: string;
  // Sensitive identity & banking info (masked in general queries):
  bank_account_number?: string | null;
  bank_name?: string | null;
  bank_ifsc?: string | null;
  pan_number?: string | null;
  aadhaar_masked?: string | null;
  uan_number?: string | null;
  pf_applicable?: boolean;
  esi_applicable?: boolean;
  pt_applicable?: boolean;
  salary_structure_id?: string;
  monthly_ctc?: number;
  base_salary?: number;
  exit_date?: string | null;
  exit_reason?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface EmployeeAttendanceRecord {
  id: string;
  employee_id: string;
  employee_name?: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE' | 'WEEKLY_OFF' | 'HOLIDAY' | 'LATE' | string;
  punch_in?: string | null;
  punch_out?: string | null;
  check_in?: string | null;
  check_out?: string | null;
  work_hours: number;
  overtime_hours?: number;
  correction_status?: 'NONE' | 'REQUESTED' | 'APPROVED' | 'REJECTED';
  correction_reason?: string | null;
  approved_by?: string | null;
  shift_id?: string;
  is_overridden?: boolean;
  notes?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface LeaveTypeRecord {
  id: string;
  code: 'CL' | 'SL' | 'EL' | 'OH' | 'LWP';
  name: string;
  yearly_quota: number;
  is_carry_forward: boolean;
  description: string;
}

export interface LeaveBalanceRecord {
  id: string;
  employee_id: string;
  leave_type_code?: string;
  leave_type_id?: string;
  total_allocated: number;
  used_days: number;
  pending_days?: number;
  balance_days?: number;
  remaining_days?: number;
}

export interface LeaveRequestRecord {
  id: string;
  public_id?: string;
  employee_id: string;
  employee_name?: string;
  reporting_manager_id?: string | null;
  leave_type_code?: string;
  leave_type_id?: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  applied_at: string;
  approved_by?: string | null;
  approved_at?: string | null;
  rejection_reason?: string | null;
  remarks?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface HolidayRecord {
  id: string;
  name: string;
  date: string;
  day: string;
  is_optional: boolean;
}

export interface EmployeeDocumentRecord {
  id: string;
  employee_id: string;
  category: 'JOINING' | 'AGREEMENT' | 'IDENTITY' | 'BANK' | 'TAX' | 'QUALIFICATION' | 'EXPERIENCE' | 'EXIT';
  title: string;
  file_name: string;
  file_url: string;
  file_size_kb: number;
  is_verified: boolean;
  uploaded_by: string;
  uploaded_at: string;
}

export interface RecruitmentJobRecord {
  id: string;
  title: string;
  department_id: string;
  department_name: string;
  positions_open: number;
  status: 'OPEN' | 'ON_HOLD' | 'CLOSED';
  experience_required: string;
  location: string;
  created_at: string;
  deleted_at?: string | null;
}

export interface CandidateRecord {
  id: string;
  job_id: string;
  job_title: string;
  full_name: string;
  email: string;
  phone: string;
  stage: 'APPLIED' | 'SCREENING' | 'INTERVIEW_ROUND_1' | 'INTERVIEW_ROUND_2' | 'OFFERED' | 'HIRED' | 'REJECTED';
  expected_salary?: number;
  offered_salary?: number;
  notes?: string;
  created_at: string;
  deleted_at?: string | null;
}

export interface EmployeeExitRecord {
  id: string;
  employee_id: string;
  employee_name: string;
  resignation_date: string;
  notice_period_days: number;
  last_working_day: string;
  reason: string;
  asset_return_status: 'PENDING' | 'PARTIAL' | 'COMPLETED';
  leave_settlement_days: number;
  final_settlement_amount: number;
  status: 'INITIATED' | 'IN_PROGRESS' | 'COMPLETED';
  created_at: string;
}

export const INITIAL_DEPARTMENTS: DepartmentRecord[] = [
  { id: 'dept-01', name: 'Human Resources & Talent', code: 'HR', manager_id: 'VXEMP-001', manager_name: 'Ananya Roy', created_at: new Date(Date.now() - 90 * 86400000).toISOString() },
  { id: 'dept-02', name: 'Payroll & Finance', code: 'FIN', manager_id: 'VXEMP-002', manager_name: 'Rohan Saxena', created_at: new Date(Date.now() - 90 * 86400000).toISOString() },
  { id: 'dept-03', name: 'Fleet Operations & Dispatch', code: 'OPS', manager_id: 'VXEMP-003', manager_name: 'Vikram Malhotra', created_at: new Date(Date.now() - 90 * 86400000).toISOString() },
  { id: 'dept-04', name: 'Commercial Sales & Growth', code: 'SLS', manager_id: 'VXEMP-004', manager_name: 'Neha Chawla', created_at: new Date(Date.now() - 90 * 86400000).toISOString() },
  { id: 'dept-05', name: 'Appliance Diagnostics & Engineering', code: 'ENG', manager_id: 'VXEMP-003', manager_name: 'Vikram Malhotra', created_at: new Date(Date.now() - 90 * 86400000).toISOString() },
  { id: 'dept-06', name: 'Customer Experience & Escalations', code: 'SUP', manager_id: 'VXEMP-001', manager_name: 'Ananya Roy', created_at: new Date(Date.now() - 90 * 86400000).toISOString() },
];

export const INITIAL_DESIGNATIONS: DesignationRecord[] = [
  { id: 'desig-01', title: 'HR Business Partner', department_id: 'dept-01', department_name: 'Human Resources & Talent', level: 'L3', created_at: new Date(Date.now() - 90 * 86400000).toISOString() },
  { id: 'desig-02', title: 'Senior Payroll & Tax Accountant', department_id: 'dept-02', department_name: 'Payroll & Finance', level: 'L3', created_at: new Date(Date.now() - 90 * 86400000).toISOString() },
  { id: 'desig-03', title: 'Field Operations & Dispatch Lead', department_id: 'dept-03', department_name: 'Fleet Operations & Dispatch', level: 'L4', created_at: new Date(Date.now() - 90 * 86400000).toISOString() },
  { id: 'desig-04', title: 'Enterprise Key Accounts Manager', department_id: 'dept-04', department_name: 'Commercial Sales & Growth', level: 'L3', created_at: new Date(Date.now() - 90 * 86400000).toISOString() },
  { id: 'desig-05', title: 'Senior HVAC & Refrigeration Specialist', department_id: 'dept-05', department_name: 'Appliance Diagnostics & Engineering', level: 'L3', created_at: new Date(Date.now() - 90 * 86400000).toISOString() },
  { id: 'desig-06', title: 'Senior Helpdesk Support Officer', department_id: 'dept-06', department_name: 'Customer Experience & Escalations', level: 'L2', created_at: new Date(Date.now() - 90 * 86400000).toISOString() },
];

export const INITIAL_SHIFTS: ShiftRecord[] = [
  { id: 'shf-01', name: 'General Office Shift', start_time: '09:30', end_time: '18:30', grace_period_mins: 15, created_at: new Date(Date.now() - 90 * 86400000).toISOString() },
  { id: 'shf-02', name: 'Morning Fleet Dispatch Shift', start_time: '08:00', end_time: '17:00', grace_period_mins: 15, created_at: new Date(Date.now() - 90 * 86400000).toISOString() },
  { id: 'shf-03', name: 'Evening Escalations Shift', start_time: '12:00', end_time: '21:00', grace_period_mins: 15, created_at: new Date(Date.now() - 90 * 86400000).toISOString() },
];

export const INITIAL_LEAVE_TYPES: LeaveTypeRecord[] = [
  { id: 'lt-01', code: 'CL', name: 'Casual Leave', yearly_quota: 12, is_carry_forward: false, description: 'Short planned or personal leaves' },
  { id: 'lt-02', code: 'SL', name: 'Sick Leave', yearly_quota: 10, is_carry_forward: false, description: 'Medical recovery and health emergencies' },
  { id: 'lt-03', code: 'EL', name: 'Earned / Privilege Leave', yearly_quota: 15, is_carry_forward: true, description: 'Annual vacation with carry-forward benefit' },
  { id: 'lt-04', code: 'OH', name: 'Optional Holiday', yearly_quota: 2, is_carry_forward: false, description: 'Restricted festive holidays from gazetted calendar' },
  { id: 'lt-05', code: 'LWP', name: 'Leave Without Pay', yearly_quota: 0, is_carry_forward: false, description: 'Approved leave deducting salary pro-rata' },
];

export const INITIAL_HOLIDAYS: HolidayRecord[] = [
  { id: 'hol-01', name: 'Republic Day', date: '2026-01-26', day: 'Monday', is_optional: false },
  { id: 'hol-02', name: 'Holi', date: '2026-03-04', day: 'Wednesday', is_optional: false },
  { id: 'hol-03', name: 'Eid-ul-Fitr', date: '2026-03-21', day: 'Saturday', is_optional: true },
  { id: 'hol-04', name: 'Independence Day', date: '2026-08-15', day: 'Saturday', is_optional: false },
  { id: 'hol-05', name: 'Gandhi Jayanti', date: '2026-10-02', day: 'Friday', is_optional: false },
  { id: 'hol-06', name: 'Diwali (Deepavali)', date: '2026-11-08', day: 'Sunday', is_optional: false },
  { id: 'hol-07', name: 'Christmas Day', date: '2026-12-25', day: 'Friday', is_optional: false },
];

export const INITIAL_EMPLOYEES: EmployeeRecord[] = [
  {
    id: 'emp-001',
    employee_id: 'VXEMP-001',
    user_id: 'usr-hr-1',
    full_name: 'Ananya Roy',
    dob: '1992-07-14',
    gender: 'FEMALE',
    personal_email: 'ananya.roy@delhicorp.com',
    personal_phone: '+91 99000 00021',
    emergency_contact: { name: 'Kunal Roy', phone: '+91 98112 00991', relation: 'Spouse' },
    address: { street: 'Flat 402, Lotus Greens, Sector 78', city: 'Noida', state: 'Uttar Pradesh', pincode: '201301' },
    joining_date: '2024-03-15',
    employment_status: 'ACTIVE',
    department_id: 'dept-01',
    department_name: 'Human Resources & Talent',
    designation_id: 'desig-01',
    designation_name: 'HR Business Partner',
    reporting_manager_id: null,
    reporting_manager_name: 'Board / Super Admin',
    work_location: 'Delhi Corporate HQ',
    employment_type: 'FULL_TIME',
    shift_id: 'shf-01',
    shift_name: 'General Office Shift',
    bank_account_number: '50100293849120',
    bank_name: 'HDFC Bank',
    bank_ifsc: 'HDFC0001202',
    pan_number: 'ABCDP8821F',
    aadhaar_masked: '•••• •••• 9921',
    uan_number: '101299384729',
    pf_applicable: true,
    esi_applicable: false,
    pt_applicable: true,
    salary_structure_id: 'sal-struct-01',
    monthly_ctc: 65000,
    created_at: new Date(Date.now() - 75 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  },
  {
    id: 'emp-002',
    employee_id: 'VXEMP-002',
    user_id: 'usr-pay-1',
    full_name: 'Rohan Saxena',
    dob: '1990-11-23',
    gender: 'MALE',
    personal_email: 'rohan.saxena@vertex.demo',
    personal_phone: '+91 99000 00022',
    emergency_contact: { name: 'Sunita Saxena', phone: '+91 98200 44551', relation: 'Mother' },
    address: { street: 'B-304, DLF Phase 4', city: 'Gurgaon', state: 'Haryana', pincode: '122002' },
    joining_date: '2024-01-10',
    employment_status: 'ACTIVE',
    department_id: 'dept-02',
    department_name: 'Payroll & Finance',
    designation_id: 'desig-02',
    designation_name: 'Senior Payroll & Tax Accountant',
    reporting_manager_id: 'VXEMP-001',
    reporting_manager_name: 'Ananya Roy',
    work_location: 'Gurgaon Tech Hub',
    employment_type: 'FULL_TIME',
    shift_id: 'shf-01',
    shift_name: 'General Office Shift',
    bank_account_number: '91201004829103',
    bank_name: 'Axis Bank',
    bank_ifsc: 'UTIB0000492',
    pan_number: 'ASDFP4492K',
    aadhaar_masked: '•••• •••• 4410',
    uan_number: '101994829102',
    pf_applicable: true,
    esi_applicable: false,
    pt_applicable: true,
    salary_structure_id: 'sal-struct-01',
    monthly_ctc: 60000,
    created_at: new Date(Date.now() - 70 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  },
  {
    id: 'emp-003',
    employee_id: 'VXEMP-003',
    user_id: 'usr-emp-1',
    full_name: 'Vikram Malhotra',
    dob: '1988-04-05',
    gender: 'MALE',
    personal_email: 'vikram.malhotra@vertex.demo',
    personal_phone: '+91 99000 00023',
    emergency_contact: { name: 'Pooja Malhotra', phone: '+91 97110 33221', relation: 'Spouse' },
    address: { street: 'Tower C, South City 1', city: 'Gurgaon', state: 'Haryana', pincode: '122001' },
    joining_date: '2023-06-01',
    employment_status: 'ACTIVE',
    department_id: 'dept-03',
    department_name: 'Fleet Operations & Dispatch',
    designation_id: 'desig-03',
    designation_name: 'Field Operations & Dispatch Lead',
    reporting_manager_id: null,
    reporting_manager_name: 'Operations Director',
    work_location: 'Gurgaon Central Depot',
    employment_type: 'FULL_TIME',
    shift_id: 'shf-02',
    shift_name: 'Morning Fleet Dispatch Shift',
    bank_account_number: '20394819203948',
    bank_name: 'State Bank of India',
    bank_ifsc: 'SBIN0004921',
    pan_number: 'BKWPM3301L',
    aadhaar_masked: '•••• •••• 7712',
    uan_number: '101482910294',
    pf_applicable: true,
    esi_applicable: false,
    pt_applicable: true,
    salary_structure_id: 'sal-struct-01',
    monthly_ctc: 72000,
    created_at: new Date(Date.now() - 80 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  },
  {
    id: 'emp-004',
    employee_id: 'VXEMP-004',
    user_id: 'usr-emp-2',
    full_name: 'Neha Chawla',
    dob: '1995-09-19',
    gender: 'FEMALE',
    personal_email: 'neha.chawla@vertex.demo',
    personal_phone: '+91 99000 00024',
    emergency_contact: { name: 'Sanjay Chawla', phone: '+91 98111 88772', relation: 'Father' },
    address: { street: 'D-14, Green Park Extension', city: 'Delhi', state: 'Delhi', pincode: '110016' },
    joining_date: '2024-04-18',
    employment_status: 'ACTIVE',
    department_id: 'dept-04',
    department_name: 'Commercial Sales & Growth',
    designation_id: 'desig-04',
    designation_name: 'Enterprise Key Accounts Manager',
    reporting_manager_id: 'VXEMP-003',
    reporting_manager_name: 'Vikram Malhotra',
    work_location: 'Delhi Corporate HQ',
    employment_type: 'FULL_TIME',
    shift_id: 'shf-01',
    shift_name: 'General Office Shift',
    bank_account_number: '00392019482910',
    bank_name: 'ICICI Bank',
    bank_ifsc: 'ICIC0000104',
    pan_number: 'CHWPN1190M',
    aadhaar_masked: '•••• •••• 3341',
    uan_number: '101748291029',
    pf_applicable: true,
    esi_applicable: false,
    pt_applicable: true,
    salary_structure_id: 'sal-struct-01',
    monthly_ctc: 55000,
    created_at: new Date(Date.now() - 65 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  },
  {
    id: 'emp-005',
    employee_id: 'VXEMP-005',
    user_id: null,
    full_name: 'Rajesh Varma',
    dob: '1987-02-12',
    gender: 'MALE',
    personal_email: 'rajesh.varma@vertexservices.in',
    personal_phone: '+91 98102 99334',
    emergency_contact: { name: 'Kavita Varma', phone: '+91 98102 11223', relation: 'Spouse' },
    address: { street: 'Plot 12, Palam Vihar', city: 'Gurgaon', state: 'Haryana', pincode: '122017' },
    joining_date: '2023-08-20',
    employment_status: 'ACTIVE',
    department_id: 'dept-05',
    department_name: 'Appliance Diagnostics & Engineering',
    designation_id: 'desig-05',
    designation_name: 'Senior HVAC & Refrigeration Specialist',
    reporting_manager_id: 'VXEMP-003',
    reporting_manager_name: 'Vikram Malhotra',
    work_location: 'Gurgaon Central Depot',
    employment_type: 'FULL_TIME',
    shift_id: 'shf-02',
    shift_name: 'Morning Fleet Dispatch Shift',
    bank_account_number: '62019482910294',
    bank_name: 'Punjab National Bank',
    bank_ifsc: 'PUNB0029100',
    pan_number: 'VRMPR9912Q',
    aadhaar_masked: '•••• •••• 8823',
    uan_number: '101648291023',
    pf_applicable: true,
    esi_applicable: false,
    pt_applicable: true,
    salary_structure_id: 'sal-struct-01',
    monthly_ctc: 48000,
    created_at: new Date(Date.now() - 85 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  },
  {
    id: 'emp-006',
    employee_id: 'VXEMP-006',
    user_id: null,
    full_name: 'Priya Sundaram',
    dob: '1996-12-08',
    gender: 'FEMALE',
    personal_email: 'priya.sundaram@vertexservices.in',
    personal_phone: '+91 97412 55667',
    emergency_contact: { name: 'Sundaram K', phone: '+91 97412 11229', relation: 'Father' },
    address: { street: 'Flat 102, Shanti Niketan', city: 'Delhi', state: 'Delhi', pincode: '110021' },
    joining_date: '2024-07-01',
    employment_status: 'PROBATION',
    department_id: 'dept-06',
    department_name: 'Customer Experience & Escalations',
    designation_id: 'desig-06',
    designation_name: 'Senior Helpdesk Support Officer',
    reporting_manager_id: 'VXEMP-001',
    reporting_manager_name: 'Ananya Roy',
    work_location: 'Delhi Corporate HQ',
    employment_type: 'FULL_TIME',
    shift_id: 'shf-03',
    shift_name: 'Evening Escalations Shift',
    bank_account_number: '39201948291029',
    bank_name: 'Kotak Mahindra Bank',
    bank_ifsc: 'KKBK0000192',
    pan_number: 'SNDPP7721R',
    aadhaar_masked: '•••• •••• 5590',
    uan_number: null,
    pf_applicable: true,
    esi_applicable: true,
    pt_applicable: true,
    salary_structure_id: 'sal-struct-01',
    monthly_ctc: 42500,
    created_at: new Date(Date.now() - 40 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  },
];

export const INITIAL_LEAVE_BALANCES: LeaveBalanceRecord[] = [
  { id: 'lb-01', employee_id: 'VXEMP-001', leave_type_code: 'CL', total_allocated: 12, used_days: 2, pending_days: 0, balance_days: 10 },
  { id: 'lb-02', employee_id: 'VXEMP-001', leave_type_code: 'SL', total_allocated: 10, used_days: 1, pending_days: 0, balance_days: 9 },
  { id: 'lb-03', employee_id: 'VXEMP-001', leave_type_code: 'EL', total_allocated: 15, used_days: 3, pending_days: 0, balance_days: 12 },
  { id: 'lb-04', employee_id: 'VXEMP-002', leave_type_code: 'CL', total_allocated: 12, used_days: 1, pending_days: 1, balance_days: 10 },
  { id: 'lb-05', employee_id: 'VXEMP-002', leave_type_code: 'SL', total_allocated: 10, used_days: 0, pending_days: 0, balance_days: 10 },
  { id: 'lb-06', employee_id: 'VXEMP-002', leave_type_code: 'EL', total_allocated: 15, used_days: 2, pending_days: 0, balance_days: 13 },
  { id: 'lb-07', employee_id: 'VXEMP-003', leave_type_code: 'CL', total_allocated: 12, used_days: 4, pending_days: 0, balance_days: 8 },
  { id: 'lb-08', employee_id: 'VXEMP-003', leave_type_code: 'SL', total_allocated: 10, used_days: 2, pending_days: 0, balance_days: 8 },
  { id: 'lb-09', employee_id: 'VXEMP-003', leave_type_code: 'EL', total_allocated: 15, used_days: 5, pending_days: 0, balance_days: 10 },
  { id: 'lb-10', employee_id: 'VXEMP-004', leave_type_code: 'CL', total_allocated: 12, used_days: 1, pending_days: 0, balance_days: 11 },
  { id: 'lb-11', employee_id: 'VXEMP-004', leave_type_code: 'SL', total_allocated: 10, used_days: 1, pending_days: 0, balance_days: 9 },
  { id: 'lb-12', employee_id: 'VXEMP-004', leave_type_code: 'EL', total_allocated: 15, used_days: 0, pending_days: 0, balance_days: 15 },
  { id: 'lb-13', employee_id: 'VXEMP-005', leave_type_code: 'CL', total_allocated: 12, used_days: 3, pending_days: 0, balance_days: 9 },
  { id: 'lb-14', employee_id: 'VXEMP-005', leave_type_code: 'SL', total_allocated: 10, used_days: 2, pending_days: 0, balance_days: 8 },
  { id: 'lb-15', employee_id: 'VXEMP-005', leave_type_code: 'EL', total_allocated: 15, used_days: 4, pending_days: 0, balance_days: 11 },
  { id: 'lb-16', employee_id: 'VXEMP-006', leave_type_code: 'CL', total_allocated: 6, used_days: 1, pending_days: 0, balance_days: 5 },
  { id: 'lb-17', employee_id: 'VXEMP-006', leave_type_code: 'SL', total_allocated: 5, used_days: 0, pending_days: 0, balance_days: 5 },
  { id: 'lb-18', employee_id: 'VXEMP-006', leave_type_code: 'EL', total_allocated: 0, used_days: 0, pending_days: 0, balance_days: 0 },
];

export const INITIAL_LEAVE_REQUESTS: LeaveRequestRecord[] = [
  {
    id: 'lvr-001',
    public_id: 'VXLVR-000001',
    employee_id: 'VXEMP-002',
    employee_name: 'Rohan Saxena',
    reporting_manager_id: 'VXEMP-001',
    leave_type_code: 'CL',
    start_date: '2026-09-18',
    end_date: '2026-09-18',
    total_days: 1,
    reason: 'Family function in hometown',
    status: 'PENDING',
    applied_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    approved_by: null,
    rejection_reason: null,
  },
  {
    id: 'lvr-002',
    public_id: 'VXLVR-000002',
    employee_id: 'VXEMP-003',
    employee_name: 'Vikram Malhotra',
    reporting_manager_id: null,
    leave_type_code: 'EL',
    start_date: '2026-08-10',
    end_date: '2026-08-14',
    total_days: 5,
    reason: 'Annual family break',
    status: 'APPROVED',
    applied_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    approved_by: 'Ananya Roy (HR)',
    rejection_reason: null,
  },
  {
    id: 'lvr-003',
    public_id: 'VXLVR-000003',
    employee_id: 'VXEMP-004',
    employee_name: 'Neha Chawla',
    reporting_manager_id: 'VXEMP-003',
    leave_type_code: 'SL',
    start_date: '2026-09-02',
    end_date: '2026-09-02',
    total_days: 1,
    reason: 'Severe seasonal flu',
    status: 'APPROVED',
    applied_at: new Date(Date.now() - 6 * 86400000).toISOString(),
    approved_by: 'Vikram Malhotra (Manager)',
    rejection_reason: null,
  },
];

export const INITIAL_EMPLOYEE_ATTENDANCE: EmployeeAttendanceRecord[] = [
  // Today's attendance
  { id: 'att-01', employee_id: 'VXEMP-001', employee_name: 'Ananya Roy', date: '2026-09-08', status: 'PRESENT', punch_in: '09:28', punch_out: null, work_hours: 4.5, overtime_hours: 0, correction_status: 'NONE', created_at: new Date().toISOString() },
  { id: 'att-02', employee_id: 'VXEMP-002', employee_name: 'Rohan Saxena', date: '2026-09-08', status: 'PRESENT', punch_in: '09:34', punch_out: null, work_hours: 4.4, overtime_hours: 0, correction_status: 'NONE', created_at: new Date().toISOString() },
  { id: 'att-03', employee_id: 'VXEMP-003', employee_name: 'Vikram Malhotra', date: '2026-09-08', status: 'PRESENT', punch_in: '07:55', punch_out: null, work_hours: 6.0, overtime_hours: 0.5, correction_status: 'NONE', created_at: new Date().toISOString() },
  { id: 'att-04', employee_id: 'VXEMP-004', employee_name: 'Neha Chawla', date: '2026-09-08', status: 'PRESENT', punch_in: '09:20', punch_out: null, work_hours: 4.6, overtime_hours: 0, correction_status: 'NONE', created_at: new Date().toISOString() },
  { id: 'att-05', employee_id: 'VXEMP-005', employee_name: 'Rajesh Varma', date: '2026-09-08', status: 'PRESENT', punch_in: '08:02', punch_out: null, work_hours: 5.9, overtime_hours: 0, correction_status: 'NONE', created_at: new Date().toISOString() },
  { id: 'att-06', employee_id: 'VXEMP-006', employee_name: 'Priya Sundaram', date: '2026-09-08', status: 'PRESENT', punch_in: '11:58', punch_out: null, work_hours: 2.0, overtime_hours: 0, correction_status: 'NONE', created_at: new Date().toISOString() },
  // Yesterday's attendance
  { id: 'att-07', employee_id: 'VXEMP-001', employee_name: 'Ananya Roy', date: '2026-09-07', status: 'PRESENT', punch_in: '09:30', punch_out: '18:40', work_hours: 9.1, overtime_hours: 0.1, correction_status: 'NONE', created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: 'att-08', employee_id: 'VXEMP-002', employee_name: 'Rohan Saxena', date: '2026-09-07', status: 'PRESENT', punch_in: '09:32', punch_out: '18:45', work_hours: 9.2, overtime_hours: 0.2, correction_status: 'NONE', created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: 'att-09', employee_id: 'VXEMP-003', employee_name: 'Vikram Malhotra', date: '2026-09-07', status: 'PRESENT', punch_in: '07:58', punch_out: '17:30', work_hours: 9.5, overtime_hours: 0.5, correction_status: 'NONE', created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: 'att-10', employee_id: 'VXEMP-004', employee_name: 'Neha Chawla', date: '2026-09-07', status: 'PRESENT', punch_in: '09:25', punch_out: '18:35', work_hours: 9.1, overtime_hours: 0.1, correction_status: 'NONE', created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: 'att-11', employee_id: 'VXEMP-005', employee_name: 'Rajesh Varma', date: '2026-09-07', status: 'PRESENT', punch_in: '08:00', punch_out: '17:15', work_hours: 9.2, overtime_hours: 0.2, correction_status: 'NONE', created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: 'att-12', employee_id: 'VXEMP-006', employee_name: 'Priya Sundaram', date: '2026-09-07', status: 'PRESENT', punch_in: '12:05', punch_out: '21:10', work_hours: 9.0, overtime_hours: 0, correction_status: 'NONE', created_at: new Date(Date.now() - 86400000).toISOString() },
];

export const INITIAL_EMPLOYEE_DOCUMENTS: EmployeeDocumentRecord[] = [
  { id: 'doc-01', employee_id: 'VXEMP-001', category: 'IDENTITY', title: 'Aadhaar Card Copy', file_name: 'ananya_aadhaar.pdf', file_url: '/uploads/docs/ananya_aadhaar.pdf', file_size_kb: 420, is_verified: true, uploaded_by: 'HR Admin', uploaded_at: new Date(Date.now() - 60 * 86400000).toISOString() },
  { id: 'doc-02', employee_id: 'VXEMP-001', category: 'AGREEMENT', title: 'Signed Employment Agreement & NDA', file_name: 'ananya_employment_contract.pdf', file_url: '/uploads/docs/ananya_contract.pdf', file_size_kb: 890, is_verified: true, uploaded_by: 'HR Admin', uploaded_at: new Date(Date.now() - 60 * 86400000).toISOString() },
  { id: 'doc-03', employee_id: 'VXEMP-002', category: 'BANK', title: 'Cancelled Cheque & Bank Mandate', file_name: 'rohan_bank_proof.pdf', file_url: '/uploads/docs/rohan_bank.pdf', file_size_kb: 310, is_verified: true, uploaded_by: 'Payroll Admin', uploaded_at: new Date(Date.now() - 55 * 86400000).toISOString() },
  { id: 'doc-04', employee_id: 'VXEMP-003', category: 'IDENTITY', title: 'PAN Card Copy', file_name: 'vikram_pan.pdf', file_url: '/uploads/docs/vikram_pan.pdf', file_size_kb: 280, is_verified: true, uploaded_by: 'HR Admin', uploaded_at: new Date(Date.now() - 80 * 86400000).toISOString() },
];

export const INITIAL_RECRUITMENT_JOBS: RecruitmentJobRecord[] = [
  { id: 'job-01', title: 'Senior Commercial HVAC Diagnostic Specialist', department_id: 'dept-05', department_name: 'Appliance Diagnostics & Engineering', positions_open: 2, status: 'OPEN', experience_required: '4-7 Years', location: 'Delhi NCR', created_at: new Date(Date.now() - 20 * 86400000).toISOString() },
  { id: 'job-02', title: 'Enterprise AMC Sales Executive', department_id: 'dept-04', department_name: 'Commercial Sales & Growth', positions_open: 1, status: 'OPEN', experience_required: '2-5 Years', location: 'Mumbai BKC', created_at: new Date(Date.now() - 15 * 86400000).toISOString() },
  { id: 'job-03', title: 'Fleet Logistics & Route Optimization Dispatcher', department_id: 'dept-03', department_name: 'Fleet Operations & Dispatch', positions_open: 1, status: 'ON_HOLD', experience_required: '3+ Years', location: 'Gurgaon Tech Hub', created_at: new Date(Date.now() - 30 * 86400000).toISOString() },
];

export const INITIAL_CANDIDATES: CandidateRecord[] = [
  { id: 'cnd-01', job_id: 'job-01', job_title: 'Senior Commercial HVAC Diagnostic Specialist', full_name: 'Amitabh Sen', email: 'amitabh.sen@example.com', phone: '+91 98110 44921', stage: 'INTERVIEW_ROUND_2', expected_salary: 52000, notes: 'Strong expertise in Daikin & Voltas VRV/VRF commercial chiller setups.', created_at: new Date(Date.now() - 10 * 86400000).toISOString() },
  { id: 'cnd-02', job_id: 'job-02', job_title: 'Enterprise AMC Sales Executive', full_name: 'Shruti Kashyap', email: 'shruti.kashyap@example.com', phone: '+91 98201 88392', stage: 'OFFERED', expected_salary: 48000, offered_salary: 50000, notes: 'Proven B2B sales track record in facility AMC contracts across Mumbai.', created_at: new Date(Date.now() - 8 * 86400000).toISOString() },
];

export const INITIAL_EXITS: EmployeeExitRecord[] = [
  { id: 'exit-01', employee_id: 'VXEMP-005', employee_name: 'Rajesh Varma', resignation_date: '2026-08-25', notice_period_days: 30, last_working_day: '2026-09-25', reason: 'Relocating to hometown for personal family matters', asset_return_status: 'PARTIAL', leave_settlement_days: 11, final_settlement_amount: 56400, status: 'IN_PROGRESS', created_at: new Date(Date.now() - 14 * 86400000).toISOString() },
];

// ============================================================================
// 5. PAYROLL MODULE INTERFACES & INITIAL DATA
// ============================================================================

export interface SalaryStructureRecord {
  id: string;
  name?: string;
  description?: string;
  version?: number;
  effective_from: string;
  effective_to?: string | null;
  employee_id?: string;
  base_monthly?: number;
  basic_salary?: number;
  hra?: number;
  special_allowance?: number;
  provident_fund_employee?: number;
  provident_fund_employer?: number;
  professional_tax?: number;
  tds_monthly?: number;
  conveyance_allowance?: number;
  medical_allowance?: number;
  esi_employee?: number;
  basic_percent?: number; // e.g. 50%
  hra_percent?: number;   // e.g. 20%
  special_allowance_percent?: number; // e.g. 30%
  conveyance_monthly?: number;
  medical_monthly?: number;
  pf_employee_rate?: number; // default 12%
  pf_employer_rate?: number; // default 12%
  esi_employee_rate?: number; // default 0.75%
  esi_employer_rate?: number; // default 3.25%
  pt_monthly?: number;        // default 200
  tds_applicable?: boolean;
  active?: boolean;
  statutory_disclaimer?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PayrollRunRecord {
  id: string;
  public_id?: string;
  month_year?: string; // "2026-08"
  month?: number;
  year?: number;
  title?: string;
  status: 'DRAFT' | 'REVIEW' | 'APPROVED' | 'FINALIZED' | 'REOPENED' | 'PROCESSED' | 'PAID';
  total_gross: number;
  total_deductions: number;
  total_net: number;
  employee_count?: number;
  total_employees?: number;
  processed_by?: string | null;
  processed_at?: string | null;
  approved_by?: string | null;
  approved_at?: string | null;
  finalized_by?: string | null;
  finalized_at?: string | null;
  reopened_by?: string | null;
  reopened_reason?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PayslipRecord {
  id: string;
  public_id?: string;
  payroll_run_id: string;
  employee_id: string;
  user_id?: string | null;
  employee_code?: string;
  employee_name?: string;
  department?: string;
  designation?: string;
  month_year?: string;
  month?: number;
  year?: number;
  bank_name?: string;
  bank_account_masked?: string;
  account_number_masked?: string;
  pan_masked?: string;
  uan?: string | null;
  days_in_month?: number;
  payable_days?: number;
  leave_days?: number;
  absent_days?: number;
  basic_salary?: number;
  hra?: number;
  special_allowance?: number;
  conveyance?: number;
  medical?: number;
  bonus?: number;
  overtime_pay?: number;
  gross_salary?: number;
  pf_employee?: number;
  esi_employee?: number;
  professional_tax?: number;
  tds?: number;
  unpaid_leave_deduction?: number;
  other_deductions?: number;
  total_deductions?: number;
  net_salary: number;
  net_salary_words?: string;
  payment_status?: string;
  payment_mode?: string;
  payment_date?: string;
  generated_at?: string;
  status?: 'GENERATED' | 'PUBLISHED';
  statutory_note?: string;
  earnings?: {
    basic: number;
    hra: number;
    special_allowance: number;
    conveyance: number;
    bonus: number;
    overtime: number;
    total_earnings: number;
  };
  deductions?: {
    pf_employee: number;
    esi_employee: number;
    professional_tax: number;
    tds: number;
    loan_deduction: number;
    advance_deduction: number;
    total_deductions: number;
  };
  created_at?: string;
}

export const INITIAL_SALARY_STRUCTURES: SalaryStructureRecord[] = [
  {
    id: 'sal-struct-01',
    name: 'Standard On-Roll Staff Compensation Matrix',
    description: 'Compliant Indian compensation model with 50% Basic, 20% HRA, 30% Special Allowance, standard statutory PF (12%) and PT.',
    version: 1,
    effective_from: '2025-01-01',
    basic_percent: 50,
    hra_percent: 20,
    special_allowance_percent: 30,
    conveyance_monthly: 1600,
    medical_monthly: 1250,
    pf_employee_rate: 12.0,
    pf_employer_rate: 12.0,
    esi_employee_rate: 0.75,
    esi_employer_rate: 3.25,
    pt_monthly: 200,
    tds_applicable: true,
    active: true,
    statutory_disclaimer: 'Statutory deductions are system calculations based on configured rules. Final statutory compliance subject to professional validation.',
  },
  {
    id: 'sal-struct-02',
    name: 'Executive & Senior Leadership Compensation Plan',
    description: 'Executive structure with customized allowance flexibilities, annual variable bonus provisions and tailored tax optimization.',
    version: 1,
    effective_from: '2025-01-01',
    basic_percent: 45,
    hra_percent: 25,
    special_allowance_percent: 30,
    conveyance_monthly: 2500,
    medical_monthly: 1250,
    pf_employee_rate: 12.0,
    pf_employer_rate: 12.0,
    esi_employee_rate: 0.0, // ESI cap exceeded
    esi_employer_rate: 0.0,
    pt_monthly: 200,
    tds_applicable: true,
    active: true,
    statutory_disclaimer: 'Statutory deductions are system calculations based on configured rules. Final statutory compliance subject to professional validation.',
  },
];

export const INITIAL_PAYROLL_RUNS: PayrollRunRecord[] = [
  {
    id: 'prun-001',
    public_id: 'VXPR-202607',
    month_year: '2026-07',
    status: 'FINALIZED',
    total_gross: 342500,
    total_deductions: 48920,
    total_net: 293580,
    employee_count: 6,
    processed_by: 'Rohan Saxena (PAYROLL)',
    processed_at: new Date(Date.now() - 40 * 86400000).toISOString(),
    approved_by: 'Suresh Narang (FINANCE)',
    approved_at: new Date(Date.now() - 38 * 86400000).toISOString(),
    finalized_by: 'Aditya Vardhan (SUPER_ADMIN)',
    finalized_at: new Date(Date.now() - 37 * 86400000).toISOString(),
    reopened_by: null,
    reopened_reason: null,
    created_at: new Date(Date.now() - 42 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 37 * 86400000).toISOString(),
  },
  {
    id: 'prun-002',
    public_id: 'VXPR-202608',
    month_year: '2026-08',
    status: 'FINALIZED',
    total_gross: 342500,
    total_deductions: 48920,
    total_net: 293580,
    employee_count: 6,
    processed_by: 'Rohan Saxena (PAYROLL)',
    processed_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    approved_by: 'Suresh Narang (FINANCE)',
    approved_at: new Date(Date.now() - 8 * 86400000).toISOString(),
    finalized_by: 'Aditya Vardhan (SUPER_ADMIN)',
    finalized_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    reopened_by: null,
    reopened_reason: null,
    created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: 'prun-003',
    public_id: 'VXPR-202609',
    month_year: '2026-09',
    status: 'DRAFT',
    total_gross: 342500,
    total_deductions: 48920,
    total_net: 293580,
    employee_count: 6,
    processed_by: 'Rohan Saxena (PAYROLL)',
    processed_at: new Date().toISOString(),
    approved_by: null,
    approved_at: null,
    finalized_by: null,
    finalized_at: null,
    reopened_by: null,
    reopened_reason: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const INITIAL_PAYSLIPS: PayslipRecord[] = [
  {
    id: 'pslip-001',
    public_id: 'VXPS-202608-01',
    payroll_run_id: 'prun-002',
    employee_id: 'emp-001',
    user_id: 'usr-hr-1',
    employee_code: 'VXEMP-001',
    employee_name: 'Ananya Roy',
    department: 'Human Resources & Talent',
    designation: 'HR Business Partner',
    month_year: '2026-08',
    bank_name: 'HDFC Bank',
    bank_account_masked: '•••• •••• •••• 9120',
    pan_masked: 'ABCDP••••F',
    uan: '101299384729',
    days_in_month: 31,
    payable_days: 31,
    leave_days: 0,
    absent_days: 0,
    earnings: {
      basic: 32500,
      hra: 13000,
      special_allowance: 19500,
      conveyance: 1600,
      bonus: 0,
      overtime: 0,
      total_earnings: 66600,
    },
    deductions: {
      pf_employee: 3900,
      esi_employee: 0,
      professional_tax: 200,
      tds: 4800,
      loan_deduction: 0,
      advance_deduction: 0,
      total_deductions: 8900,
    },
    net_salary: 57700,
    net_salary_words: 'Fifty Seven Thousand Seven Hundred Rupees Only',
    status: 'PUBLISHED',
    statutory_note: 'Statutory deductions are system calculations based on configured rules. Final statutory compliance subject to professional validation.',
    created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
  },
  {
    id: 'pslip-002',
    public_id: 'VXPS-202608-02',
    payroll_run_id: 'prun-002',
    employee_id: 'emp-002',
    user_id: 'usr-pay-1',
    employee_code: 'VXEMP-002',
    employee_name: 'Rohan Saxena',
    department: 'Payroll & Finance',
    designation: 'Senior Payroll & Tax Accountant',
    month_year: '2026-08',
    bank_name: 'Axis Bank',
    bank_account_masked: '•••• •••• •••• 9103',
    pan_masked: 'ASDFP••••K',
    uan: '101994829102',
    days_in_month: 31,
    payable_days: 31,
    leave_days: 0,
    absent_days: 0,
    earnings: {
      basic: 30000,
      hra: 12000,
      special_allowance: 18000,
      conveyance: 1600,
      bonus: 0,
      overtime: 0,
      total_earnings: 61600,
    },
    deductions: {
      pf_employee: 3600,
      esi_employee: 0,
      professional_tax: 200,
      tds: 4200,
      loan_deduction: 0,
      advance_deduction: 0,
      total_deductions: 8000,
    },
    net_salary: 53600,
    net_salary_words: 'Fifty Three Thousand Six Hundred Rupees Only',
    status: 'PUBLISHED',
    statutory_note: 'Statutory deductions are system calculations based on configured rules. Final statutory compliance subject to professional validation.',
    created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
  },
  {
    id: 'pslip-003',
    public_id: 'VXPS-202608-03',
    payroll_run_id: 'prun-002',
    employee_id: 'emp-003',
    user_id: 'usr-emp-1',
    employee_code: 'VXEMP-003',
    employee_name: 'Vikram Malhotra',
    department: 'Fleet Operations & Dispatch',
    designation: 'Field Operations & Dispatch Lead',
    month_year: '2026-08',
    bank_name: 'State Bank of India',
    bank_account_masked: '•••• •••• •••• 3948',
    pan_masked: 'BKWPM••••L',
    uan: '101482910294',
    days_in_month: 31,
    payable_days: 31,
    leave_days: 0,
    absent_days: 0,
    earnings: {
      basic: 36000,
      hra: 14400,
      special_allowance: 21600,
      conveyance: 1600,
      bonus: 2500,
      overtime: 1200,
      total_earnings: 77300,
    },
    deductions: {
      pf_employee: 4320,
      esi_employee: 0,
      professional_tax: 200,
      tds: 6500,
      loan_deduction: 0,
      advance_deduction: 0,
      total_deductions: 11020,
    },
    net_salary: 66280,
    net_salary_words: 'Sixty Six Thousand Two Hundred Eighty Rupees Only',
    status: 'PUBLISHED',
    statutory_note: 'Statutory deductions are system calculations based on configured rules. Final statutory compliance subject to professional validation.',
    created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
  },
  {
    id: 'pslip-004',
    public_id: 'VXPS-202608-04',
    payroll_run_id: 'prun-002',
    employee_id: 'emp-004',
    user_id: 'usr-emp-2',
    employee_code: 'VXEMP-004',
    employee_name: 'Neha Chawla',
    department: 'Commercial Sales & Growth',
    designation: 'Enterprise Key Accounts Manager',
    month_year: '2026-08',
    bank_name: 'ICICI Bank',
    bank_account_masked: '•••• •••• •••• 2910',
    pan_masked: 'CHWPN••••M',
    uan: '101748291029',
    days_in_month: 31,
    payable_days: 31,
    leave_days: 0,
    absent_days: 0,
    earnings: {
      basic: 27500,
      hra: 11000,
      special_allowance: 16500,
      conveyance: 1600,
      bonus: 3000,
      overtime: 0,
      total_earnings: 59600,
    },
    deductions: {
      pf_employee: 3300,
      esi_employee: 0,
      professional_tax: 200,
      tds: 3500,
      loan_deduction: 0,
      advance_deduction: 0,
      total_deductions: 7000,
    },
    net_salary: 52600,
    net_salary_words: 'Fifty Two Thousand Six Hundred Rupees Only',
    status: 'PUBLISHED',
    statutory_note: 'Statutory deductions are system calculations based on configured rules. Final statutory compliance subject to professional validation.',
    created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
  },
  {
    id: 'pslip-005',
    public_id: 'VXPS-202608-05',
    payroll_run_id: 'prun-002',
    employee_id: 'emp-005',
    user_id: null,
    employee_code: 'VXEMP-005',
    employee_name: 'Rajesh Varma',
    department: 'Appliance Diagnostics & Engineering',
    designation: 'Senior HVAC & Refrigeration Specialist',
    month_year: '2026-08',
    bank_name: 'Punjab National Bank',
    bank_account_masked: '•••• •••• •••• 1029',
    pan_masked: 'VRMPR••••Q',
    uan: '101648291023',
    days_in_month: 31,
    payable_days: 31,
    leave_days: 0,
    absent_days: 0,
    earnings: {
      basic: 24000,
      hra: 9600,
      special_allowance: 14400,
      conveyance: 1600,
      bonus: 0,
      overtime: 1800,
      total_earnings: 51400,
    },
    deductions: {
      pf_employee: 2880,
      esi_employee: 0,
      professional_tax: 200,
      tds: 2100,
      loan_deduction: 0,
      advance_deduction: 0,
      total_deductions: 5180,
    },
    net_salary: 46220,
    net_salary_words: 'Forty Six Thousand Two Hundred Twenty Rupees Only',
    status: 'PUBLISHED',
    statutory_note: 'Statutory deductions are system calculations based on configured rules. Final statutory compliance subject to professional validation.',
    created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
  },
  {
    id: 'pslip-006',
    public_id: 'VXPS-202608-06',
    payroll_run_id: 'prun-002',
    employee_id: 'emp-006',
    user_id: null,
    employee_code: 'VXEMP-006',
    employee_name: 'Priya Sundaram',
    department: 'Customer Experience & Escalations',
    designation: 'Senior Helpdesk Support Officer',
    month_year: '2026-08',
    bank_name: 'Kotak Mahindra Bank',
    bank_account_masked: '•••• •••• •••• 1029',
    pan_masked: 'SNDPP••••R',
    uan: null,
    days_in_month: 31,
    payable_days: 31,
    leave_days: 0,
    absent_days: 0,
    earnings: {
      basic: 21250,
      hra: 8500,
      special_allowance: 12750,
      conveyance: 1600,
      bonus: 0,
      overtime: 0,
      total_earnings: 44100,
    },
    deductions: {
      pf_employee: 2550,
      esi_employee: 330.75,
      professional_tax: 200,
      tds: 1500,
      loan_deduction: 0,
      advance_deduction: 0,
      total_deductions: 4580.75,
    },
    net_salary: 39519.25,
    net_salary_words: 'Thirty Nine Thousand Five Hundred Nineteen Rupees Only',
    status: 'PUBLISHED',
    statutory_note: 'Statutory deductions are system calculations based on configured rules. Final statutory compliance subject to professional validation.',
    created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
  },
];
