import { bookingRepository, BookingEntity } from '../repositories/bookingRepository.js';
import { catalogRepository } from '../repositories/catalogRepository.js';
import { customerRepository } from '../repositories/customerRepository.js';
import crypto from 'crypto';

export class BookingService {
  async getBooking(id: string): Promise<BookingEntity> {
    const booking = await bookingRepository.getBookingById(id);
    if (!booking) {
      throw new Error(`Booking '${id}' not found`);
    }
    return booking;
  }

  async listCustomerBookings(customerId: string): Promise<BookingEntity[]> {
    return await bookingRepository.listCustomerBookings(customerId);
  }

  async listTechnicianJobs(technicianId: string): Promise<BookingEntity[]> {
    return await bookingRepository.listTechnicianJobs(technicianId);
  }

  /**
   * Create Booking transactionally with server-authoritative pricing & snapshots
   */
  async createBooking(payload: {
    customerId: string;
    serviceId: string;
    scheduledDate: string;
    timeSlot: string;
    serviceAddress: string;
    addressId?: string;
    notes?: string;
  }): Promise<BookingEntity> {
    // 1. Authoritative Service Lookup
    const service = await catalogRepository.getServiceById(payload.serviceId);
    if (!service) {
      throw new Error(`Service '${payload.serviceId}' is invalid or no longer active.`);
    }

    // 2. Server-Side Price Calculation (Do NOT trust client)
    const basePrice = Number(service.price);
    const taxRate = Number(service.tax_percent) || 18;
    const taxAmount = Math.round((basePrice * taxRate) / 100);
    const totalAmount = basePrice + taxAmount;
    const technicianCut = Math.round(basePrice * 0.7); // 70% standard technician payout

    // 3. Resolve and snapshot service address
    let addressSnapshot: any = { address: payload.serviceAddress };
    if (payload.addressId) {
      const addr = await customerRepository.getAddressById(payload.addressId);
      if (addr) {
        addressSnapshot = {
          line1: addr.address_line_1,
          line2: addr.address_line_2,
          city: addr.city,
          state: addr.state,
          pincode: addr.postal_code,
        };
      }
    }

    const bookingId = `bk-${crypto.randomUUID()}`;
    const publicSuffix = Math.floor(1000 + Math.random() * 9000);
    const publicId = `BK-${publicSuffix}`;
    const otp = String(Math.floor(1000 + Math.random() * 9000));

    return await bookingRepository.createBookingWithTransaction(
      {
        id: bookingId,
        public_id: publicId,
        customer_id: payload.customerId,
        service_id: service.id,
        service_name: service.name,
        service_category: service.category_name || 'Home Appliance',
        scheduled_date: payload.scheduledDate,
        time_slot: payload.timeSlot,
        service_address: payload.serviceAddress,
        service_address_snapshot: addressSnapshot,
        service_price_snapshot: basePrice,
        total_amount: totalAmount,
        discount_amount: 0,
        tax_amount: taxAmount,
        technician_cut: technicianCut,
        status: 'Pending',
        payment_status: 'PENDING',
        otp,
        notes: payload.notes || '',
      },
      {
        id: `bki-${crypto.randomUUID()}`,
        service_id: service.id,
        service_name: service.name,
        unit_price: basePrice,
        quantity: 1,
        total_price: basePrice,
      },
      {
        id: `bsh-${crypto.randomUUID()}`,
        new_status: 'Pending',
        changed_by: payload.customerId,
        reason: 'Customer initiated service booking',
      }
    );
  }

  /**
   * Assign Technician transactionally
   */
  async assignTechnician(bookingId: string, technician: { id: string; name: string; phone: string }, assignedBy: string): Promise<BookingEntity> {
    return await bookingRepository.assignTechnicianWithTransaction(
      bookingId,
      technician.id,
      technician.name,
      technician.phone,
      assignedBy
    );
  }

  /**
   * Verify doorstep OTP and transition booking state to In Progress
   */
  async verifyDoorstepOtpAndStart(bookingId: string, otp: string, technicianId: string): Promise<BookingEntity> {
    const booking = await this.getBooking(bookingId);

    if (booking.technician_id !== technicianId) {
      throw new Error('Forbidden: You are not authorized to start a job not assigned to you.');
    }

    if (booking.status !== 'Arrived') {
      throw new Error(`Invalid state: Technician must mark 'Arrived' before entering OTP. Current state: '${booking.status}'.`);
    }

    if (!booking.otp || String(booking.otp).trim() !== String(otp).trim()) {
      throw new Error('Invalid Doorstep OTP. Please ask customer for correct 4-digit verification code.');
    }

    return await bookingRepository.updateStatusWithTransaction(
      booking.id,
      'In Progress',
      technicianId,
      'Doorstep OTP verified successfully'
    );
  }

  /**
   * Complete booking transactionally: updates booking, records technician earning, and creates invoice
   */
  async completeBooking(
    bookingId: string,
    completionData: {
      workPerformed: string;
      partsUsed: string;
      technicianNotes: string;
      customerRemarks: string;
    },
    technicianId: string
  ): Promise<BookingEntity> {
    const booking = await this.getBooking(bookingId);

    if (booking.technician_id !== technicianId) {
      throw new Error('Forbidden: You are not authorized to complete a job not assigned to you.');
    }

    if (booking.status !== 'In Progress') {
      throw new Error(`Invalid state: Job must be 'In Progress' before marking completed. Current state: '${booking.status}'.`);
    }

    const earningAmount = Number(booking.technician_cut) || Math.round(Number(booking.total_amount) * 0.7);

    return await bookingRepository.completeBookingWithTransaction(
      booking.id,
      completionData,
      technicianId,
      earningAmount
    );
  }
}

export const bookingService = new BookingService();
