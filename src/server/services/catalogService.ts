import { catalogRepository, ServiceCategoryEntity, ServiceEntity } from '../repositories/catalogRepository.js';
import crypto from 'crypto';

export class CatalogService {
  async getCategories(activeOnly = false): Promise<ServiceCategoryEntity[]> {
    return await catalogRepository.listCategories(activeOnly);
  }

  async createCategory(payload: { name: string; description?: string; icon?: string; sortOrder?: number }): Promise<ServiceCategoryEntity> {
    if (!payload.name || payload.name.trim().length < 2) {
      throw new Error('Category name is required and must be at least 2 characters.');
    }
    const slug = payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const code = payload.name.toUpperCase().replace(/[^A-Z0-9]+/g, '_').slice(0, 20);

    return await catalogRepository.createCategory({
      name: payload.name.trim(),
      slug,
      code,
      description: payload.description || null,
      icon: payload.icon || '🛠️',
      sort_order: payload.sortOrder || 1,
      active: true,
    });
  }

  async updateCategory(id: number, payload: Partial<ServiceCategoryEntity>): Promise<ServiceCategoryEntity> {
    const existing = await catalogRepository.getCategoryById(id);
    if (!existing) {
      throw new Error(`Category with ID ${id} not found.`);
    }
    const updated = await catalogRepository.updateCategory(id, payload);
    if (!updated) {
      throw new Error('Failed to update category.');
    }
    return updated;
  }

  async deactivateCategory(id: number): Promise<void> {
    const existing = await catalogRepository.getCategoryById(id);
    if (!existing) {
      throw new Error(`Category with ID ${id} not found.`);
    }
    await catalogRepository.softDeleteCategory(id);
  }

  async getServices(options: { categoryId?: number; status?: string; activeOnly?: boolean } = {}): Promise<ServiceEntity[]> {
    return await catalogRepository.listServices(options);
  }

  async getServiceById(id: string): Promise<ServiceEntity> {
    const service = await catalogRepository.getServiceById(id);
    if (!service) {
      throw new Error(`Service '${id}' not found.`);
    }
    return service;
  }

  async createService(payload: {
    name: string;
    categoryId: number;
    price: number;
    basePrice?: number;
    description?: string;
    durationMinutes?: number;
    warrantyDays?: number;
  }): Promise<ServiceEntity> {
    if (!payload.name || payload.name.trim().length < 2) {
      throw new Error('Service name is required.');
    }
    if (!payload.categoryId || isNaN(payload.categoryId)) {
      throw new Error('Valid categoryId is required.');
    }
    const price = Number(payload.price);
    if (isNaN(price) || price < 0) {
      throw new Error('Valid price is required.');
    }

    const serviceId = `srv-${crypto.randomUUID()}`;
    const publicSuffix = Math.floor(100000 + Math.random() * 900000);
    const publicId = `VXSRV-${publicSuffix}`;
    const slug = payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    return await catalogRepository.createService({
      id: serviceId,
      public_id: publicId,
      name: payload.name.trim(),
      slug,
      category_id: payload.categoryId,
      description: payload.description || null,
      price: price,
      base_price: payload.basePrice ?? price,
      duration_minutes: payload.durationMinutes || 60,
      warranty_days: payload.warrantyDays || 30,
      sla_hours: 4,
      tax_percent: 18,
      status: 'ACTIVE',
      is_active: true,
      sort_order: 1,
    });
  }

  async updateService(id: string, payload: Partial<ServiceEntity>): Promise<ServiceEntity> {
    const existing = await catalogRepository.getServiceById(id);
    if (!existing) {
      throw new Error(`Service '${id}' not found.`);
    }
    const updated = await catalogRepository.updateService(id, payload);
    if (!updated) {
      throw new Error('Failed to update service.');
    }
    return updated;
  }

  async deactivateService(id: string): Promise<void> {
    const existing = await catalogRepository.getServiceById(id);
    if (!existing) {
      throw new Error(`Service '${id}' not found.`);
    }
    await catalogRepository.softDeleteService(id);
  }
}

export const catalogService = new CatalogService();
