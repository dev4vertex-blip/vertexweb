import crypto from 'crypto';
import {
  financeRepository,
  PaymentEntity,
  InvoiceEntity,
  InvoiceItemEntity,
  LedgerEntryEntity,
} from '../repositories/financeRepository.js';

export class FinanceService {
  async listPayments(options: {
    status?: string;
    method?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ payments: PaymentEntity[]; total: number }> {
    return await financeRepository.listPayments(options);
  }

  async getPayment(id: string): Promise<PaymentEntity> {
    const payment = await financeRepository.getPaymentById(id);
    if (!payment) {
      throw new Error(`Payment '${id}' not found.`);
    }
    return payment;
  }

  async collectPayment(payload: {
    bookingId?: string;
    invoiceId?: string;
    customerId?: string;
    customerName: string;
    customerPhone?: string;
    amount: number;
    paymentMethod: string;
    paymentReference?: string;
    collectedBy: string;
    collectedByName: string;
    notes?: string;
    idempotencyKey?: string;
  }): Promise<{ payment: PaymentEntity; invoice?: InvoiceEntity | null; isDuplicate?: boolean }> {
    if (!payload.amount || payload.amount <= 0) {
      throw new Error('Valid payment amount greater than zero is required.');
    }
    if (!payload.paymentMethod) {
      throw new Error('Payment method is required.');
    }

    return await financeRepository.collectPaymentWithTransaction(payload);
  }

  async verifyPayment(id: string, verifiedBy: string): Promise<PaymentEntity> {
    return await financeRepository.verifyPaymentWithTransaction(id, verifiedBy);
  }

  async requestRefund(id: string, amount: number, reason: string): Promise<PaymentEntity> {
    const updated = await financeRepository.requestRefund(id, amount, reason);
    if (!updated) {
      throw new Error(`Failed to request refund for payment '${id}'.`);
    }
    return updated;
  }

  async approveRefund(id: string, approvedBy: string): Promise<PaymentEntity> {
    return await financeRepository.approveRefundWithTransaction(id, approvedBy);
  }

  async listInvoices(options: {
    customerId?: string;
    bookingId?: string;
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ invoices: InvoiceEntity[]; total: number }> {
    return await financeRepository.listInvoices(options);
  }

  async getInvoice(id: string): Promise<{ invoice: InvoiceEntity; items: InvoiceItemEntity[] }> {
    const data = await financeRepository.getInvoiceWithItems(id);
    if (!data) {
      throw new Error(`Invoice '${id}' not found.`);
    }
    return data;
  }

  async listLedger(options: {
    account?: string;
    entryType?: string;
    referenceType?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ entries: LedgerEntryEntity[]; total: number; summary: { totalDebit: number; totalCredit: number } }> {
    return await financeRepository.listLedgerEntries(options);
  }

  async getSummary(): Promise<{
    totalCollected: number;
    totalVerified: number;
    totalRefunded: number;
    totalReceivable: number;
    totalRevenue: number;
    totalTechnicianCommissions: number;
  }> {
    return await financeRepository.getFinancialSummary();
  }
}

export const financeService = new FinanceService();
