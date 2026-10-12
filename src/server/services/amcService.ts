import crypto from 'crypto';
import { amcRepository, AmcPlanEntity, AmcSubscriptionEntity } from '../repositories/amcRepository.js';

export class AmcService {
  async getPlans(activeOnly = false): Promise<AmcPlanEntity[]> {
    return await amcRepository.listPlans(activeOnly);
  }

  async getPlanById(id: string): Promise<AmcPlanEntity> {
    const plan = await amcRepository.getPlanById(id);
    if (!plan) {
      throw new Error(`AMC plan '${id}' not found.`);
    }
    return plan;
  }

  async createPlan(payload: {
    name: string;
    code: string;
    price: number;
    basePrice?: number;
    durationMonths?: number;
    description?: string;
    preventiveVisits?: number;
    breakdownVisits?: number;
    gasChargingIncluded?: boolean;
    prioritySlaHours?: number;
    benefits?: string[];
  }): Promise<AmcPlanEntity> {
    if (!payload.name || payload.name.trim().length < 2) {
      throw new Error('Valid AMC plan name is required.');
    }
    if (!payload.code) {
      throw new Error('Unique AMC plan code is required.');
    }

    const planId = `amc-${crypto.randomUUID()}`;
    const publicSuffix = Math.floor(1000 + Math.random() * 9000);
    const publicId = `AMC-${publicSuffix}`;
    const slug = payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    return await amcRepository.createPlan({
      id: planId,
      public_id: publicId,
      name: payload.name.trim(),
      code: payload.code.trim().toUpperCase(),
      slug,
      description: payload.description || null,
      duration_months: payload.durationMonths || 12,
      price: payload.price,
      base_price: payload.basePrice ?? payload.price,
      preventive_visits: payload.preventiveVisits ?? 2,
      breakdown_visits: payload.breakdownVisits ?? 4,
      gas_charging_included: Boolean(payload.gasChargingIncluded),
      priority_sla_hours: payload.prioritySlaHours ?? 4,
      benefits: JSON.stringify(payload.benefits || []),
      is_active: true,
      status: 'ACTIVE',
    });
  }

  async updatePlan(id: string, updates: Partial<AmcPlanEntity>): Promise<AmcPlanEntity> {
    const existing = await this.getPlanById(id);
    const updated = await amcRepository.updatePlan(existing.id, updates);
    if (!updated) {
      throw new Error(`Failed to update AMC plan '${id}'.`);
    }
    return updated;
  }

  async softDeletePlan(id: string): Promise<void> {
    const existing = await this.getPlanById(id);
    await amcRepository.softDeletePlan(existing.id);
  }
}

export const amcService = new AmcService();
