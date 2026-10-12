import crypto from 'crypto';
import { partnerRepository, PartnerEntity } from '../repositories/partnerRepository.js';

export class PartnerService {
  async listPartners(userId?: string): Promise<PartnerEntity[]> {
    return await partnerRepository.listPartners(userId);
  }

  async getPartner(id: string): Promise<PartnerEntity> {
    const partner = await partnerRepository.getPartnerById(id);
    if (!partner) {
      throw new Error(`Partner '${id}' not found.`);
    }
    return partner;
  }

  async createPartner(payload: {
    companyName: string;
    contactPerson: string;
    phone: string;
    email: string;
    userId?: string;
    tier?: string;
    address?: string;
    notes?: string;
  }): Promise<PartnerEntity> {
    if (!payload.companyName || payload.companyName.trim().length < 2) {
      throw new Error('Valid company name is required.');
    }
    if (!payload.contactPerson) {
      throw new Error('Contact person name is required.');
    }
    if (!payload.phone || payload.phone.replace(/\D/g, '').length < 10) {
      throw new Error('Valid 10-digit mobile number is required.');
    }

    const partnerId = `ptnr-${crypto.randomUUID()}`;
    const publicSuffix = Math.floor(1000 + Math.random() * 9000);
    const publicId = `VXPTN-${publicSuffix}`;

    return await partnerRepository.createPartner({
      id: partnerId,
      public_id: publicId,
      user_id: payload.userId || null,
      company_name: payload.companyName.trim(),
      contact_person: payload.contactPerson.trim(),
      phone: payload.phone.trim(),
      email: payload.email.trim(),
      tier: payload.tier || 'STANDARD',
      address: payload.address || null,
      notes: payload.notes || null,
      status: 'ACTIVE',
    });
  }

  async updatePartner(id: string, updates: Partial<PartnerEntity>): Promise<PartnerEntity> {
    const existing = await this.getPartner(id);
    const updated = await partnerRepository.updatePartner(existing.id, updates);
    if (!updated) {
      throw new Error(`Failed to update partner '${id}'.`);
    }
    return updated;
  }
}

export const partnerService = new PartnerService();
