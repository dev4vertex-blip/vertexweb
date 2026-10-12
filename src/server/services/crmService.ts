import crypto from 'crypto';
import { crmRepository, LeadEntity, LeadFollowupEntity } from '../repositories/crmRepository.js';

export class CrmService {
  async listLeads(options: {
    assignedTo?: string;
    salesUserIds?: string[];
    stage?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<LeadEntity[]> {
    return await crmRepository.listLeads(options);
  }

  async getLead(id: string): Promise<LeadEntity> {
    const lead = await crmRepository.getLeadById(id);
    if (!lead) {
      throw new Error(`Lead '${id}' not found.`);
    }
    return lead;
  }

  async createLead(payload: {
    customerName: string;
    phone: string;
    email?: string;
    serviceInterest: string;
    serviceCategory?: string;
    requirementDetails?: string;
    estimatedValue?: number;
    leadSource?: string;
    priority?: string;
    cityId?: number;
    assignedTo?: string;
    createdBy: string;
    notes?: string;
  }): Promise<LeadEntity> {
    if (!payload.customerName || payload.customerName.trim().length < 2) {
      throw new Error('Valid customer name is required.');
    }
    if (!payload.phone || payload.phone.replace(/\D/g, '').length < 10) {
      throw new Error('Valid 10-digit mobile number is required.');
    }
    if (!payload.serviceInterest) {
      throw new Error('Service of interest is required.');
    }

    const leadId = `lead-${crypto.randomUUID()}`;
    const publicSuffix = Math.floor(1000 + Math.random() * 9000);
    const publicId = `LD-${publicSuffix}`;

    return await crmRepository.createLead({
      id: leadId,
      public_id: publicId,
      customer_name: payload.customerName.trim(),
      phone: payload.phone.trim(),
      email: payload.email?.trim() || null,
      service_interest: payload.serviceInterest.trim(),
      service_category: payload.serviceCategory || null,
      requirement_details: payload.requirementDetails || null,
      estimated_value: payload.estimatedValue || 0,
      lead_source: payload.leadSource || 'WEBSITE',
      priority: payload.priority || 'MEDIUM',
      stage: 'NEW',
      status: 'ACTIVE',
      assigned_to: payload.assignedTo || null,
      created_by: payload.createdBy,
      city_id: payload.cityId || null,
      notes: payload.notes || null,
    });
  }

  async updateLead(id: string, updates: Partial<LeadEntity>): Promise<LeadEntity> {
    const existing = await this.getLead(id);
    const updated = await crmRepository.updateLead(existing.id, updates);
    if (!updated) {
      throw new Error(`Failed to update lead ${id}`);
    }
    return updated;
  }

  async addFollowup(leadId: string, payload: {
    scheduledDate: string;
    scheduledTime?: string;
    followupType: string;
    notes: string;
  }): Promise<LeadFollowupEntity> {
    await this.getLead(leadId);
    return await crmRepository.createFollowup({
      id: `fup-${crypto.randomUUID()}`,
      lead_id: leadId,
      scheduled_date: payload.scheduledDate,
      scheduled_time: payload.scheduledTime || null,
      followup_type: payload.followupType || 'CALL',
      notes: payload.notes || '',
      status: 'SCHEDULED',
      completed: false,
    });
  }
}

export const crmService = new CrmService();
