import React, { createContext, useContext, useState } from 'react';
import {
  UserAppRole,
  AdminRole,
  CustomerUser,
  TechnicianUser,
  AdminUser,
  Booking,
  BookingStatus,
  TechnicianJob,
  NotificationItem,
  ToastMessage,
  ServiceItem,
  AMCPlan,
  AMCContract,
  AMCStatus,
  AMCServiceVisit,
  CustomerAddress,
} from '../types';
import {
  DEMO_CUSTOMERS,
  DEMO_TECHNICIANS,
  DEMO_ADMINS,
  DEMO_BOOKINGS,
  DEMO_TECHNICIAN_JOBS,
  DEMO_NOTIFICATIONS,
  DEMO_SERVICES,
  DEMO_AMC_PLANS,
  DEMO_AMC_CONTRACTS,
  DEMO_AMC_VISITS,
} from '../data/mockData';

interface AppContextType {
  currentAppRole: UserAppRole;
  setAppRole: (role: UserAppRole) => void;
  // Customer state
  currentCustomer: CustomerUser;
  setCurrentCustomer: (customer: CustomerUser) => void;
  // Technician state
  currentTechnician: TechnicianUser;
  setCurrentTechnician: (technician: TechnicianUser) => void;
  allTechnicians: TechnicianUser[];
  updateTechnicianStatus: (technicianId: string, status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE') => void;
  technicianJobs: TechnicianJob[];
  updateJobStatus: (jobId: string, status: TechnicianJob['status']) => void;
  toggleTechnicianDuty: () => void;
  // Customer management
  allCustomers: CustomerUser[];
  updateCustomerStatus: (customerId: string, status: 'ACTIVE' | 'INACTIVE') => void;
  // Admin state
  currentAdmin: AdminUser;
  setAdminRole: (role: AdminRole) => void;
  allAdmins: AdminUser[];
  // Bookings state
  bookings: Booking[];
  createBooking: (booking: Omit<Booking, 'id' | 'createdAt' | 'status' | 'otp'>) => Booking;
  cancelBooking: (bookingId: string) => void;
  assignTechnicianToBooking: (bookingId: string, technicianId: string) => void;
  updateBookingStatus: (bookingId: string, status: BookingStatus, note?: string) => boolean;
  // AMC State
  amcPlans: AMCPlan[];
  amcContracts: AMCContract[];
  amcVisits: AMCServiceVisit[];
  createAMCContract: (plan: AMCPlan, address: CustomerAddress, paymentMethod?: string) => AMCContract;
  updateAMCContractStatus: (contractId: string, status: AMCStatus, notes?: string) => void;
  assignTechnicianToAMCContract: (contractId: string, technicianId: string) => void;
  requestAMCService: (
    contractId: string,
    details: {
      serviceName?: string;
      category?: string;
      scheduledDate: string;
      timeSlot: string;
      problemDescription?: string;
      notes?: string;
    }
  ) => { booking: Booking; visit: AMCServiceVisit };
  completeAMCVisit: (
    visitId: string,
    data?: {
      workPerformed?: string;
      partsUsed?: string;
      serviceNotes?: string;
      customerRemarks?: string;
    }
  ) => void;
  toggleAMCPlanStatus: (planId: string) => void;
  updateAMCPlan: (plan: AMCPlan) => void;
  createAMCPlan: (plan: Omit<AMCPlan, 'id'>) => AMCPlan;
  // Notifications
  notifications: NotificationItem[];
  markNotificationAsRead: (id: string) => void;
  clearNotifications: () => void;
  // Toasts
  toasts: ToastMessage[];
  addToast: (
    titleOrToast: string | { title: string; message?: string; description?: string; type?: ToastMessage['type'] },
    description?: string,
    type?: ToastMessage['type']
  ) => void;
  removeToast: (id: string) => void;
  // City selection
  selectedCity: string;
  setSelectedCity: (city: string) => void;
  // Quick service navigation helper
  selectedServiceForBooking: ServiceItem | null;
  setSelectedServiceForBooking: (service: ServiceItem | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentAppRole, setCurrentAppRole] = useState<UserAppRole>('login');
  const [selectedCity, setSelectedCity] = useState<string>('Gurgaon');

  // Customer
  const [currentCustomer, setCurrentCustomer] = useState<CustomerUser>(DEMO_CUSTOMERS[0]);
  const [allCustomers, setAllCustomers] = useState<CustomerUser[]>(DEMO_CUSTOMERS);

  // Technician
  const [currentTechnician, setCurrentTechnician] = useState<TechnicianUser>(DEMO_TECHNICIANS[0]);
  const [allTechnicians, setAllTechnicians] = useState<TechnicianUser[]>(DEMO_TECHNICIANS);
  const [technicianJobs, setTechnicianJobs] = useState<TechnicianJob[]>(DEMO_TECHNICIAN_JOBS);

  // Admin
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser>(DEMO_ADMINS[0]);

  // Bookings
  const [bookings, setBookings] = useState<Booking[]>(DEMO_BOOKINGS);

  // Notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>(DEMO_NOTIFICATIONS);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Selected Service for booking
  const [selectedServiceForBooking, setSelectedServiceForBooking] = useState<ServiceItem | null>(null);

  // AMC state
  const [amcPlans, setAmcPlans] = useState<AMCPlan[]>(DEMO_AMC_PLANS);
  const [amcContracts, setAmcContracts] = useState<AMCContract[]>(DEMO_AMC_CONTRACTS);
  const [amcVisits, setAmcVisits] = useState<AMCServiceVisit[]>(DEMO_AMC_VISITS);

  const addToast = (
    titleOrToast: string | { title: string; message?: string; description?: string; type?: ToastMessage['type'] },
    description?: string,
    type: ToastMessage['type'] = 'info'
  ) => {
    const id = Math.random().toString(36).substring(2, 9);
    if (typeof titleOrToast === 'object' && titleOrToast !== null) {
      const toastTitle = String(titleOrToast.title || '');
      const toastDescription = titleOrToast.description || titleOrToast.message || '';
      const toastType = titleOrToast.type || 'info';
      setToasts((prev) => [...prev, { id, title: toastTitle, description: toastDescription, message: toastDescription, type: toastType }]);
    } else {
      setToasts((prev) => [...prev, { id, title: String(titleOrToast || ''), description, message: description, type }]);
    }
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const setAppRole = (role: UserAppRole) => {
    setCurrentAppRole(role);
  };

  const setAdminRole = (role: AdminRole) => {
    const matched = DEMO_ADMINS.find((a) => a.role === role) || {
      id: `adm-${Date.now()}`,
      name: `Demo ${role}`,
      email: `${role.toLowerCase().replace(/\s+/g, '')}@vertexservices.in`,
      role,
    };
    setCurrentAdmin(matched);
    addToast('Role Switched', `Active admin profile updated to ${role}`, 'info');
  };

  const toggleTechnicianDuty = () => {
    setCurrentTechnician((prev) => {
      const nextDuty = !prev.isOnDuty;
      addToast(
        nextDuty ? 'Duty Status: Online' : 'Duty Status: Offline',
        nextDuty ? 'You are now visible for incoming service dispatches.' : 'You will not receive new assignments today.',
        nextDuty ? 'success' : 'warning'
      );
      // Persist to shared backend
      const token = localStorage.getItem('vx_token');
      fetch('/api/v1/technician/duty-toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ isOnDuty: nextDuty }),
      }).catch(() => {});
      return { ...prev, isOnDuty: nextDuty };
    });
  };

  const updateTechnicianStatus = (technicianId: string, status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE') => {
    setAllTechnicians((prev) =>
      prev.map((t) => (t.id === technicianId ? { ...t, status, isOnDuty: status === 'ACTIVE' } : t))
    );
    if (currentTechnician.id === technicianId) {
      setCurrentTechnician((prev) => ({ ...prev, status, isOnDuty: status === 'ACTIVE' }));
    }
    addToast('Technician Status Updated', `Status changed to ${status.replace('_', ' ')}`, 'info');
  };

  const updateCustomerStatus = (customerId: string, status: 'ACTIVE' | 'INACTIVE') => {
    setAllCustomers((prev) =>
      prev.map((c) => (c.id === customerId ? { ...c, status } : c))
    );
    if (currentCustomer.id === customerId) {
      setCurrentCustomer((prev) => ({ ...prev, status }));
    }
    addToast('Customer Status Updated', `Account marked as ${status}`, 'info');
  };

  const updateJobStatus = (jobId: string, status: TechnicianJob['status']) => {
    let targetBookingId: string | undefined;

    setTechnicianJobs((prev) =>
      prev.map((j) => {
        if (j.id === jobId) {
          targetBookingId = j.bookingId;
          return { ...j, status };
        }
        return j;
      })
    );

    // Synchronize booking status seamlessly
    if (targetBookingId) {
      setBookings((prev) =>
        prev.map((b) => {
          if (b.id === targetBookingId) {
            let bookingStatus = b.status;
            if (status === 'In Progress') bookingStatus = 'in_progress';
            else if (status === 'Completed') bookingStatus = 'completed';
            else if (status === 'En Route' || status === 'Assigned') bookingStatus = 'accepted';

            const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
            const history = b.statusHistory || [];
            return {
              ...b,
              status: bookingStatus,
              statusHistory: [
                ...history,
                {
                  status: bookingStatus,
                  timestamp: now,
                  updatedBy: 'Technician Partner',
                  note: `Technician updated job status to ${status}`,
                },
              ],
            };
          }
          return b;
        })
      );
    }

    // Check if this is an AMC job being completed
    if (status === 'Completed') {
      const targetJob = technicianJobs.find((j) => j.id === jobId);
      if (targetJob && (targetJob.bookingType === 'AMC' || targetJob.amcContractId)) {
        completeAMCVisit(targetJob.bookingId, {
          workPerformed: targetJob.workPerformed || 'Preventive maintenance completed per checklist.',
          partsUsed: targetJob.partsUsed || 'Standard consumables',
          serviceNotes: targetJob.serviceNotes || 'Routine service visit completed.',
          customerRemarks: targetJob.customerRemarks || 'Satisfied with service.',
        });
      }
    }

    // Persist status change to backend API
    const token = localStorage.getItem('vx_token');
    const endpointMap: Record<string, string> = {
      'Accepted': 'accept',
      'En Route': 'en-route',
      'Arrived': 'arrived',
      'In Progress': 'start',
      'Completed': 'complete',
    };
    const action = endpointMap[status];
    if (action) {
      fetch(`/api/v1/technician/jobs/${jobId}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ otp: '4821' }),
      }).catch(() => {});
    }

    addToast('Job Status Updated', `Job #${jobId} marked as ${status}`, 'success');
  };

  const assignTechnicianToBooking = (bookingId: string, technicianId: string) => {
    const tech = allTechnicians.find((t) => t.id === technicianId);
    if (!tech) {
      addToast('Assignment Error', 'Selected technician could not be found.', 'error');
      return;
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

    let targetBooking: Booking | null = null;

    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === bookingId) {
          targetBooking = {
            ...b,
            status: 'assigned',
            technicianId: tech.id,
            technicianName: tech.name,
            technicianPhone: tech.phone,
            technicianRating: tech.rating,
            statusHistory: [
              ...(b.statusHistory || []),
              {
                status: 'assigned',
                timestamp: now,
                updatedBy: `${currentAdmin.name} (${currentAdmin.role})`,
                note: `Assigned partner ${tech.name} (${tech.city})`,
              },
            ],
          };
          return targetBooking;
        }
        return b;
      })
    );

    // Create or update technician job entry so technician app sees it immediately
    setTechnicianJobs((prev) => {
      const existing = prev.find((j) => j.bookingId === bookingId);
      if (existing) {
        return prev.map((j) =>
          j.bookingId === bookingId
            ? {
                ...j,
                technicianId: tech.id,
                status: 'Assigned',
              }
            : j
        );
      }

      const bookingRef = targetBooking || bookings.find((b) => b.id === bookingId);
      if (bookingRef) {
        const newJob: TechnicianJob = {
          id: `JOB-${Math.floor(900 + Math.random() * 99)}`,
          bookingId: bookingRef.id,
          technicianId: tech.id,
          customerName: bookingRef.customerName,
          customerPhone: bookingRef.customerPhone,
          serviceName: bookingRef.serviceName,
          address: `${bookingRef.address.flat}, ${bookingRef.address.area}, ${bookingRef.address.city}`,
          city: bookingRef.address.city,
          scheduledTime: bookingRef.scheduledSlot,
          date: bookingRef.scheduledDate,
          status: 'Assigned',
          amount: bookingRef.amount,
          technicianCut: Math.round(bookingRef.amount * 0.7),
          instructions: bookingRef.notes || 'Service dispatch ticket created from Admin operations desk.',
          otp: bookingRef.otp || '4821',
        };
        return [newJob, ...prev];
      }
      return prev;
    });

    // Persist assignment to backend
    const token = localStorage.getItem('vx_token');
    fetch(`/api/v1/admin/bookings/${bookingId}/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ technicianId }),
    }).catch(() => {});

    // Notify customer
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: 'Technician Assigned',
        message: `${tech.name} (${tech.phone}) has been assigned to booking #${bookingId}.`,
        timestamp: 'Just now',
        isRead: false,
        type: 'booking',
      },
      ...prev,
    ]);

    addToast(
      'Technician Assigned',
      `Booking #${bookingId} assigned to ${tech.name}. Partner notified.`,
      'success'
    );
  };

  const updateBookingStatus = (bookingId: string, status: BookingStatus, note?: string): boolean => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) {
      addToast('Error', 'Booking not found.', 'error');
      return false;
    }

    // Validation rules
    if (booking.status === 'completed' && status !== 'completed') {
      addToast('Status Error', 'Completed bookings cannot be moved backward.', 'error');
      return false;
    }
    if (booking.status === 'cancelled' && status !== 'cancelled') {
      addToast('Status Error', 'Cancelled bookings cannot be reopened directly.', 'error');
      return false;
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === bookingId) {
          return {
            ...b,
            status,
            statusHistory: [
              ...(b.statusHistory || []),
              {
                status,
                timestamp: now,
                updatedBy: `${currentAdmin.name} (${currentAdmin.role})`,
                note: note || `Admin updated status to ${status.replace('_', ' ')}`,
              },
            ],
          };
        }
        return b;
      })
    );

    // Sync with technician jobs
    if (status === 'in_progress') {
      setTechnicianJobs((prev) =>
        prev.map((j) => (j.bookingId === bookingId ? { ...j, status: 'In Progress' } : j))
      );
    } else if (status === 'completed') {
      setTechnicianJobs((prev) =>
        prev.map((j) => (j.bookingId === bookingId ? { ...j, status: 'Completed' } : j))
      );
    }

    addToast('Status Updated', `Booking #${bookingId} status marked as ${status.replace('_', ' ')}`, 'success');
    return true;
  };

  const createBooking = (data: Omit<Booking, 'id' | 'createdAt' | 'status' | 'otp'>): Booking => {
    const newId = `VTX-${Math.floor(10000 + Math.random() * 90000)}`;
    const newOtp = `${Math.floor(1000 + Math.random() * 9000)}`;
    const newBooking: Booking = {
      ...data,
      id: newId,
      status: 'confirmed',
      otp: newOtp,
      createdAt: 'Just now',
    };

    setBookings((prev) => [newBooking, ...prev]);

    // Also notify
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: 'Booking Confirmed',
        message: `Your booking for ${data.serviceName} (${newId}) is scheduled for ${data.scheduledDate}. OTP: ${newOtp}`,
        timestamp: 'Just now',
        isRead: false,
        type: 'booking',
      },
      ...prev,
    ]);

    addToast('Booking Placed Successfully', `Booking ID ${newId} confirmed!`, 'success');
    return newBooking;
  };

  const cancelBooking = (bookingId: string) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: 'cancelled' as const } : b))
    );
    addToast('Booking Cancelled', `Booking ${bookingId} has been cancelled`, 'warning');
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
    addToast('Notifications Cleared', 'All alerts have been cleared', 'info');
  };

  const createAMCContract = (
    plan: AMCPlan,
    address: CustomerAddress,
    paymentMethod: string = 'UPI / NetBanking'
  ): AMCContract => {
    const nextNum = amcContracts.length + 1;
    const contractNumber = `AMC-2026-${String(nextNum).padStart(3, '0')}`;
    const contractId = `amc-cnt-${Date.now()}`;

    const now = new Date();
    const startDate = now.toISOString().split('T')[0];
    const endDateObj = new Date(now);
    endDateObj.setMonth(endDateObj.getMonth() + (plan.durationMonths || 12));
    const endDate = endDateObj.toISOString().split('T')[0];

    const firstServiceDateObj = new Date(now);
    firstServiceDateObj.setDate(firstServiceDateObj.getDate() + 14);
    const nextServiceDate = firstServiceDateObj.toISOString().split('T')[0];

    const newContract: AMCContract = {
      id: contractId,
      contractNumber,
      customerId: currentCustomer.id,
      customerName: currentCustomer.name,
      customerPhone: currentCustomer.phone,
      customerEmail: currentCustomer.email,
      planId: plan.id,
      planName: plan.name || plan.title,
      serviceCategory: plan.category || 'General Home Maintenance',
      addressId: address.id,
      address: `${address.flat}, ${address.area}, ${address.city} - ${address.pincode}`,
      startDate,
      endDate,
      price: plan.price || plan.priceAnnual,
      status: 'ACTIVE',
      visitsIncluded: plan.visitsIncluded || plan.visitsPerYear || 4,
      visitsUsed: 0,
      visitsRemaining: plan.visitsIncluded || plan.visitsPerYear || 4,
      nextServiceDate,
      createdAt: startDate,
      notes: `Enrolled online via ${paymentMethod}`,
    };

    setAmcContracts((prev) => [newContract, ...prev]);

    // Update customer active AMC
    setCurrentCustomer((prev) => ({
      ...prev,
      activeAmcId: newContract.id,
    }));
    setAllCustomers((prev) =>
      prev.map((c) => (c.id === currentCustomer.id ? { ...c, activeAmcId: newContract.id } : c))
    );

    // Also auto-schedule first preventive visit
    const visitBookingId = `VTX-AMC-${Math.floor(100 + Math.random() * 900)}`;
    const newVisit: AMCServiceVisit = {
      id: `amc-vst-${Date.now()}`,
      contractId: newContract.id,
      contractNumber: newContract.contractNumber,
      bookingId: visitBookingId,
      customerId: currentCustomer.id,
      customerName: currentCustomer.name,
      customerPhone: currentCustomer.phone,
      serviceName: `${plan.name || plan.title} - Initial Preventive Inspection`,
      serviceCategory: newContract.serviceCategory,
      address: typeof newContract.address === 'string' ? newContract.address : `${address.flat}, ${address.area}, ${address.city}`,
      scheduledDate: nextServiceDate,
      timeSlot: '10:00 AM - 12:00 PM',
      status: 'SCHEDULED',
      visitNumber: 1,
      totalVisits: newContract.visitsIncluded,
      createdAt: startDate,
    };
    setAmcVisits((prev) => [newVisit, ...prev]);

    // Create booking entry for visibility in booking desk
    const newBooking: Booking = {
      id: visitBookingId,
      serviceId: 'srv-amc-maintenance',
      serviceName: newVisit.serviceName,
      category: newContract.serviceCategory,
      customerId: currentCustomer.id,
      customerName: currentCustomer.name,
      customerPhone: currentCustomer.phone,
      customerEmail: currentCustomer.email,
      address,
      scheduledDate: nextServiceDate,
      scheduledSlot: '10:00 AM - 12:00 PM',
      amount: 0,
      paymentStatus: 'Paid Online',
      status: 'confirmed',
      bookingType: 'AMC',
      amcContractId: newContract.id,
      amcVisitId: newVisit.id,
      visitNumber: 1,
      notes: `Scheduled visit 1 of ${newContract.visitsIncluded} under ${newContract.contractNumber}`,
      createdAt: 'Just now',
    };
    setBookings((prev) => [newBooking, ...prev]);

    // Notification
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: 'AMC Contract Activated',
        message: `Your ${plan.name || plan.title} (${contractNumber}) is now active. 1st service scheduled for ${nextServiceDate}.`,
        timestamp: 'Just now',
        isRead: false,
        type: 'amc',
      },
      ...prev,
    ]);

    addToast('AMC Contract Activated', `Contract #${contractNumber} created successfully!`, 'success');
    return newContract;
  };

  const updateAMCContractStatus = (contractId: string, status: AMCStatus, notes?: string) => {
    setAmcContracts((prev) =>
      prev.map((c) => {
        if (c.id === contractId) {
          return {
            ...c,
            status,
            notes: notes ? `${c.notes || ''} | ${notes}` : c.notes,
          };
        }
        return c;
      })
    );
    addToast('AMC Status Updated', `Contract status changed to ${status}`, 'info');
  };

  const assignTechnicianToAMCContract = (contractId: string, technicianId: string) => {
    const tech = allTechnicians.find((t) => t.id === technicianId);
    if (!tech) {
      addToast('Error', 'Technician not found', 'error');
      return;
    }

    let targetContract: AMCContract | undefined;

    setAmcContracts((prev) =>
      prev.map((c) => {
        if (c.id === contractId) {
          targetContract = {
            ...c,
            assignedTechnicianId: tech.id,
            assignedTechnicianName: tech.name,
            assignedTechnicianPhone: tech.phone,
            status: c.status === 'PENDING' ? 'ACTIVE' : c.status,
          };
          return targetContract;
        }
        return c;
      })
    );

    // Update scheduled visits for this contract with this technician
    setAmcVisits((prev) =>
      prev.map((v) => {
        if (v.contractId === contractId && (v.status === 'SCHEDULED' || v.status === 'ASSIGNED')) {
          return {
            ...v,
            technicianId: tech.id,
            technicianName: tech.name,
            technicianPhone: tech.phone,
            status: 'ASSIGNED',
          };
        }
        return v;
      })
    );

    // Also update corresponding bookings
    setBookings((prev) =>
      prev.map((b) => {
        if (b.amcContractId === contractId && (b.status === 'pending' || b.status === 'confirmed')) {
          return {
            ...b,
            technicianId: tech.id,
            technicianName: tech.name,
            technicianPhone: tech.phone,
            status: 'assigned',
          };
        }
        return b;
      })
    );

    // Ensure technician has a job card for scheduled visits
    const scheduledVisit = amcVisits.find(
      (v) => v.contractId === contractId && (v.status === 'SCHEDULED' || v.status === 'ASSIGNED')
    );
    if (scheduledVisit) {
      setTechnicianJobs((prev) => {
        const existing = prev.find((j) => j.bookingId === scheduledVisit.bookingId || j.amcContractId === contractId);
        if (existing) {
          return prev.map((j) =>
            j.id === existing.id ? { ...j, status: 'Assigned' } : j
          );
        }
        const contractRef = targetContract || amcContracts.find((c) => c.id === contractId);
        const newJob: TechnicianJob = {
          id: `JOB-AMC-${Math.floor(100 + Math.random() * 900)}`,
          bookingId: scheduledVisit.bookingId,
          bookingType: 'AMC',
          amcContractId: contractId,
          amcContractNumber: contractRef?.contractNumber || 'AMC-CONTRACT',
          amcPlanName: contractRef?.planName || 'AMC Plan',
          customerName: scheduledVisit.customerName || contractRef?.customerName || 'Customer',
          customerPhone: scheduledVisit.customerPhone || contractRef?.customerPhone || '',
          serviceName: scheduledVisit.serviceName || 'AMC Preventive Service',
          address: typeof contractRef?.address === 'string' ? contractRef.address : scheduledVisit.address || '',
          city: 'Gurgaon',
          scheduledTime: scheduledVisit.timeSlot || '10:00 AM - 12:00 PM',
          date: scheduledVisit.scheduledDate,
          status: 'Assigned',
          amount: 0,
          technicianCut: 450,
          instructions: `AMC Contract Service (Visit ${scheduledVisit.visitNumber} of ${scheduledVisit.totalVisits}). Routine preventive inspection.`,
          otp: '4821',
          visitNumber: scheduledVisit.visitNumber,
          totalVisits: scheduledVisit.totalVisits,
        };
        return [newJob, ...prev];
      });
    }

    addToast('Technician Assigned', `${tech.name} assigned to AMC contract.`, 'success');
  };

  const requestAMCService = (
    contractId: string,
    details: {
      serviceName?: string;
      category?: string;
      scheduledDate: string;
      timeSlot: string;
      problemDescription?: string;
      notes?: string;
    }
  ) => {
    const contract = amcContracts.find((c) => c.id === contractId);
    if (!contract) {
      throw new Error('Contract not found');
    }

    const nextVisitNum = Math.min(contract.visitsIncluded, contract.visitsUsed + 1);
    const bookingId = `VTX-AMC-${Math.floor(100 + Math.random() * 900)}`;
    const visitId = `amc-vst-${Date.now()}`;
    const formattedAddress = typeof contract.address === 'string' ? contract.address : `${contract.address.flat}, ${contract.address.area}, ${contract.address.city}`;

    const newVisit: AMCServiceVisit = {
      id: visitId,
      contractId: contract.id,
      contractNumber: contract.contractNumber,
      bookingId,
      customerId: contract.customerId,
      customerName: contract.customerName || currentCustomer.name,
      customerPhone: contract.customerPhone || currentCustomer.phone,
      serviceName: details.serviceName || `${contract.planName} - Preventive Service Visit`,
      serviceCategory: details.category || contract.serviceCategory,
      address: formattedAddress,
      technicianId: contract.assignedTechnicianId,
      technicianName: contract.assignedTechnicianName,
      technicianPhone: contract.assignedTechnicianPhone,
      scheduledDate: details.scheduledDate,
      timeSlot: details.timeSlot,
      status: contract.assignedTechnicianId ? 'ASSIGNED' : 'SCHEDULED',
      visitNumber: nextVisitNum,
      totalVisits: contract.visitsIncluded,
      serviceNotes: details.notes,
      createdAt: new Date().toISOString().split('T')[0],
    };

    const newBooking: Booking = {
      id: bookingId,
      serviceId: 'srv-amc-maintenance',
      serviceName: newVisit.serviceName,
      category: newVisit.serviceCategory || contract.serviceCategory,
      customerId: contract.customerId,
      customerName: newVisit.customerName || currentCustomer.name,
      customerPhone: newVisit.customerPhone || currentCustomer.phone,
      customerEmail: contract.customerEmail || currentCustomer.email,
      address: typeof contract.address === 'string'
        ? {
            id: 'addr-amc',
            type: 'Home',
            tag: 'Service Address',
            flat: contract.address,
            area: 'Sector 54',
            city: 'Gurgaon',
            pincode: '122002',
            isDefault: true,
          }
        : contract.address,
      scheduledDate: details.scheduledDate,
      scheduledSlot: details.timeSlot,
      amount: 0,
      paymentStatus: 'Paid Online',
      status: contract.assignedTechnicianId ? 'assigned' : 'confirmed',
      technicianId: contract.assignedTechnicianId,
      technicianName: contract.assignedTechnicianName,
      technicianPhone: contract.assignedTechnicianPhone,
      otp: `${Math.floor(1000 + Math.random() * 9000)}`,
      notes: details.notes || `AMC Service Visit (${nextVisitNum} of ${contract.visitsIncluded}) under #${contract.contractNumber}`,
      problemDescription: details.problemDescription || 'Routine AMC preventive service requested by customer',
      createdAt: 'Just now',
      bookingType: 'AMC',
      amcContractId: contract.id,
      amcVisitId: visitId,
      visitNumber: nextVisitNum,
    };

    setAmcVisits((prev) => [newVisit, ...prev]);
    setBookings((prev) => [newBooking, ...prev]);

    // Update nextServiceDate in contract
    setAmcContracts((prev) =>
      prev.map((c) => (c.id === contractId ? { ...c, nextServiceDate: details.scheduledDate } : c))
    );

    // If technician assigned, create technician job
    if (contract.assignedTechnicianId) {
      const newJob: TechnicianJob = {
        id: `JOB-AMC-${Math.floor(100 + Math.random() * 900)}`,
        bookingId,
        bookingType: 'AMC',
        amcContractId: contract.id,
        amcContractNumber: contract.contractNumber,
        amcPlanName: contract.planName,
        customerName: newBooking.customerName,
        customerPhone: newBooking.customerPhone,
        serviceName: newBooking.serviceName,
        address: formattedAddress,
        city: 'Gurgaon',
        scheduledTime: details.timeSlot,
        date: details.scheduledDate,
        status: 'Assigned',
        amount: 0,
        technicianCut: 450,
        instructions: `AMC Visit (${nextVisitNum} of ${contract.visitsIncluded}): ${details.problemDescription || 'Routine maintenance'}`,
        otp: newBooking.otp || '4821',
        visitNumber: nextVisitNum,
        totalVisits: contract.visitsIncluded,
      };
      setTechnicianJobs((prev) => [newJob, ...prev]);
    }

    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: 'AMC Service Requested',
        message: `Service visit for ${details.scheduledDate} (${details.timeSlot}) has been scheduled under #${contract.contractNumber}.`,
        timestamp: 'Just now',
        isRead: false,
        type: 'amc',
      },
      ...prev,
    ]);

    addToast('AMC Service Requested', `Service request submitted for ${details.scheduledDate}.`, 'success');
    return { booking: newBooking, visit: newVisit };
  };

  const completeAMCVisit = (
    visitId: string,
    data?: {
      workPerformed?: string;
      partsUsed?: string;
      serviceNotes?: string;
      customerRemarks?: string;
    }
  ) => {
    let targetContractId: string | undefined;
    let targetBookingId: string | undefined;
    let visitNum: number = 1;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

    setAmcVisits((prev) =>
      prev.map((v) => {
        if (v.id === visitId || v.bookingId === visitId) {
          targetContractId = v.contractId;
          targetBookingId = v.bookingId;
          visitNum = v.visitNumber;
          return {
            ...v,
            status: 'COMPLETED',
            completedAt: nowStr,
            workPerformed: data?.workPerformed || v.workPerformed || 'Preventive maintenance inspection & servicing completed.',
            partsUsed: data?.partsUsed || v.partsUsed || 'None',
            serviceNotes: data?.serviceNotes || v.serviceNotes || 'Routine operational checks passed.',
            customerRemarks: data?.customerRemarks || v.customerRemarks || 'Satisfied with service.',
          };
        }
        return v;
      })
    );

    // Update contract usage
    if (targetContractId) {
      setAmcContracts((prev) =>
        prev.map((c) => {
          if (c.id === targetContractId) {
            const newVisitsUsed = Math.min(c.visitsIncluded, c.visitsUsed + 1);
            const newVisitsRemaining = Math.max(0, c.visitsIncluded - newVisitsUsed);
            // compute next service date if remaining > 0 (e.g. +90 days)
            let nextDate: string | undefined = undefined;
            if (newVisitsRemaining > 0) {
              const d = new Date();
              d.setDate(d.getDate() + 90);
              nextDate = d.toISOString().split('T')[0];
            }
            return {
              ...c,
              visitsUsed: newVisitsUsed,
              visitsRemaining: newVisitsRemaining,
              nextServiceDate: nextDate,
            };
          }
          return c;
        })
      );
    }

    // Sync booking status
    if (targetBookingId) {
      setBookings((prev) =>
        prev.map((b) => (b.id === targetBookingId ? { ...b, status: 'completed' as const } : b))
      );
    }

    // Sync technician job status
    setTechnicianJobs((prev) =>
      prev.map((j) => {
        if (j.bookingId === targetBookingId || j.id === visitId || j.amcContractId === targetContractId) {
          return {
            ...j,
            status: 'Completed',
            workPerformed: data?.workPerformed,
            partsUsed: data?.partsUsed,
            serviceNotes: data?.serviceNotes,
            customerRemarks: data?.customerRemarks,
          };
        }
        return j;
      })
    );

    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: 'AMC Visit Completed',
        message: `Visit #${visitNum} has been successfully completed and recorded.`,
        timestamp: 'Just now',
        isRead: false,
        type: 'amc',
      },
      ...prev,
    ]);

    addToast('AMC Visit Completed', `Service visit #${visitNum} marked as completed!`, 'success');
  };

  const toggleAMCPlanStatus = (planId: string) => {
    setAmcPlans((prev) =>
      prev.map((p) => {
        if (p.id === planId) {
          const nextActive = !p.active;
          addToast('Plan Status Updated', `${p.name || p.title} is now ${nextActive ? 'Active' : 'Inactive'}`, 'info');
          return { ...p, active: nextActive };
        }
        return p;
      })
    );
  };

  const updateAMCPlan = (updatedPlan: AMCPlan) => {
    setAmcPlans((prev) =>
      prev.map((p) => (p.id === updatedPlan.id ? updatedPlan : p))
    );
    addToast('AMC Plan Updated', `${updatedPlan.name || updatedPlan.title} has been updated.`, 'success');
  };

  const createAMCPlan = (planData: Omit<AMCPlan, 'id'>): AMCPlan => {
    const newPlan: AMCPlan = {
      ...planData,
      id: `amc-plan-${Date.now()}`,
      title: planData.title || planData.name,
      priceAnnual: planData.priceAnnual || planData.price,
      validityMonths: planData.validityMonths || planData.durationMonths,
      visitsPerYear: planData.visitsPerYear || planData.visitsIncluded,
    };
    setAmcPlans((prev) => [...prev, newPlan]);
    addToast('AMC Plan Created', `${newPlan.name} is now available in the catalog.`, 'success');
    return newPlan;
  };

  return (
    <AppContext.Provider
      value={{
        currentAppRole,
        setAppRole,
        currentCustomer,
        setCurrentCustomer,
        allCustomers,
        updateCustomerStatus,
        currentTechnician,
        setCurrentTechnician,
        allTechnicians,
        updateTechnicianStatus,
        technicianJobs,
        updateJobStatus,
        toggleTechnicianDuty,
        currentAdmin,
        setAdminRole,
        allAdmins: DEMO_ADMINS,
        bookings,
        createBooking,
        cancelBooking,
        assignTechnicianToBooking,
        updateBookingStatus,
        amcPlans,
        amcContracts,
        amcVisits,
        createAMCContract,
        updateAMCContractStatus,
        assignTechnicianToAMCContract,
        requestAMCService,
        completeAMCVisit,
        toggleAMCPlanStatus,
        updateAMCPlan,
        createAMCPlan,
        notifications,
        markNotificationAsRead,
        clearNotifications,
        toasts,
        addToast,
        removeToast,
        selectedCity,
        setSelectedCity,
        selectedServiceForBooking,
        setSelectedServiceForBooking,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
