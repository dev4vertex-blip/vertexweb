export type UserAppRole = 'login' | 'customer' | 'technician' | 'admin';

export type AdminRole = 'Super Admin' | 'Manager' | 'Sales Team' | 'Finance';

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'technician_assigned'
  | 'assigned'
  | 'accepted'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'rescheduled';

export interface CustomerUser {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatar?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  customerSince?: string;
  activeAddresses: CustomerAddress[];
  activeAmcId?: string;
}

export interface CustomerAddress {
  id: string;
  type: 'Home' | 'Office' | 'Other';
  tag: string;
  flat: string;
  area: string;
  city: string;
  pincode: string;
  isDefault: boolean;
}

export interface TechnicianUser {
  id: string;
  name: string;
  phone: string;
  email: string;
  specialization: string[];
  city: string;
  rating: number;
  totalJobs: number;
  kycStatus: 'Verified' | 'Pending' | 'Rejected';
  isOnDuty: boolean;
  status?: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';
  experience?: string;
  joinedDate?: string;
  avatar?: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  avatar?: string;
}

export interface ServiceItem {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  originalPrice?: number;
  durationMinutes: number;
  rating: number;
  reviewsCount: number;
  iconName: string;
  inclusions: string[];
  exclusions: string[];
  warranty: string;
  isPopular?: boolean;
}

export type AMCStatus =
  | 'PENDING'
  | 'ACTIVE'
  | 'EXPIRING_SOON'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'SUSPENDED';

export type AMCVisitStatus =
  | 'SCHEDULED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export interface AMCPlan {
  id: string;
  name: string;
  title: string; // backwards compatibility alias for name
  description: string;
  category: string;
  durationMonths: number;
  validityMonths: number; // alias for durationMonths
  price: number;
  priceAnnual: number; // alias for price
  servicesIncluded: string[];
  visitsIncluded: number;
  visitsPerYear: number; // alias for visitsIncluded
  responseTime: string;
  prioritySupport: boolean;
  partsCoverage: string;
  laborCoverage: string;
  features: string[];
  active: boolean;
  target?: 'Residential' | 'Commercial' | 'Specialized';
  tagline?: string;
  benefits?: string[];
  coverageList?: string[];
  emergencyResponseHours?: number;
  discountOnSparesPercent?: number;
  popular?: boolean;
}

export interface AMCContract {
  id: string;
  contractNumber: string;
  customerId: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  planId: string;
  planName: string;
  serviceCategory: string;
  addressId: string;
  address: CustomerAddress | string;
  startDate: string;
  endDate: string;
  price: number;
  status: AMCStatus;
  assignedTechnicianId?: string;
  assignedTechnicianName?: string;
  assignedTechnicianPhone?: string;
  visitsIncluded: number;
  visitsUsed: number;
  visitsRemaining: number;
  nextServiceDate?: string;
  createdAt: string;
  notes?: string;
}

export interface AMCServiceVisit {
  id: string;
  contractId: string;
  contractNumber?: string;
  bookingId: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  serviceName?: string;
  serviceCategory?: string;
  address?: string;
  technicianId?: string;
  technicianName?: string;
  technicianPhone?: string;
  scheduledDate: string;
  timeSlot: string;
  status: AMCVisitStatus;
  serviceNotes?: string;
  workPerformed?: string;
  partsUsed?: string;
  customerRemarks?: string;
  completedAt?: string;
  visitNumber: number;
  totalVisits: number;
  createdAt?: string;
}

export interface BookingTimelineItem {
  status: BookingStatus;
  title: string;
  timestamp: string;
  description: string;
  completed: boolean;
}

export interface Booking {
  id: string;
  serviceId: string;
  serviceName: string;
  category: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  address: CustomerAddress;
  scheduledDate: string;
  scheduledSlot: string;
  amount: number;
  paymentStatus: 'Paid Online' | 'Pending' | 'Cash After Service';
  status: BookingStatus;
  technicianId?: string;
  technicianName?: string;
  technicianPhone?: string;
  technicianRating?: number;
  otp?: string;
  notes?: string;
  problemDescription?: string;
  createdAt: string;
  statusHistory?: {
    status: BookingStatus;
    timestamp: string;
    updatedBy?: string;
    note?: string;
  }[];
  bookingType?: 'REGULAR' | 'AMC';
  amcContractId?: string;
  amcVisitId?: string;
  visitNumber?: number;
}

export interface TechnicianJob {
  id: string;
  bookingId: string;
  customerName: string;
  customerPhone: string;
  serviceName: string;
  address: string;
  city: string;
  scheduledTime: string;
  date: string;
  status: 'Assigned' | 'En Route' | 'In Progress' | 'Completed';
  amount: number;
  technicianCut: number;
  requiredParts?: string[];
  instructions: string;
  otp: string;
  bookingType?: 'REGULAR' | 'AMC';
  amcContractId?: string;
  amcContractNumber?: string;
  amcPlanName?: string;
  visitNumber?: number;
  totalVisits?: number;
  workPerformed?: string;
  partsUsed?: string;
  serviceNotes?: string;
  customerRemarks?: string;
}

export interface AttendanceRecord {
  date: string;
  day: string;
  checkIn: string;
  checkOut?: string;
  status: 'Present' | 'Half Day' | 'On Leave' | 'Weekend';
  hoursWorked: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  type: 'booking' | 'system' | 'payout' | 'amc';
}

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type?: 'success' | 'error' | 'info' | 'warning';
}
