import { BaseRepository, DatabaseTransactionContext } from './baseRepository.js';

export interface ServiceCategoryEntity {
  id: number;
  name: string;
  slug: string | null;
  code: string | null;
  description: string | null;
  icon: string | null;
  sort_order: number;
  active: boolean;
  created_at: string;
  deleted_at: string | null;
}

export interface ServiceEntity {
  id: string;
  public_id: string;
  name: string;
  slug: string | null;
  category_id: number;
  category_name?: string | null;
  description: string | null;
  short_description: string | null;
  price: number | string;
  base_price: number | string;
  discounted_price: number | string | null;
  strike_price: number | string | null;
  duration_minutes: number;
  warranty_days: number;
  sla_hours: number;
  tax_percent: number | string;
  image_url: string | null;
  status: string;
  is_active: boolean;
  sort_order: number;
  features: string | null;
  availability: string | null;
  requirements: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export class CatalogRepository extends BaseRepository {
  async listCategories(activeOnly = false): Promise<ServiceCategoryEntity[]> {
    const client = await this.getClient();
    let sql = `SELECT * FROM service_categories WHERE deleted_at IS NULL`;
    if (activeOnly) {
      sql += ` AND active = TRUE`;
    }
    sql += ` ORDER BY sort_order ASC, name ASC`;
    const res = await client.query<ServiceCategoryEntity>(sql);
    return res.rows;
  }

  async getCategoryById(id: number): Promise<ServiceCategoryEntity | null> {
    const client = await this.getClient();
    const res = await client.query<ServiceCategoryEntity>(
      `SELECT * FROM service_categories WHERE id = $1 AND deleted_at IS NULL LIMIT 1`,
      [id]
    );
    return res.rows[0] || null;
  }

  async createCategory(data: Partial<ServiceCategoryEntity>): Promise<ServiceCategoryEntity> {
    const client = await this.getClient();
    const res = await client.query<ServiceCategoryEntity>(
      `INSERT INTO service_categories (name, slug, code, description, icon, sort_order, active, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
       RETURNING *`,
      [
        data.name,
        data.slug || null,
        data.code || null,
        data.description || null,
        data.icon || '🛠️',
        data.sort_order ?? 1,
        data.active ?? true,
      ]
    );
    return res.rows[0];
  }

  async updateCategory(id: number, data: Partial<ServiceCategoryEntity>): Promise<ServiceCategoryEntity | null> {
    const client = await this.getClient();
    const res = await client.query<ServiceCategoryEntity>(
      `UPDATE service_categories
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           icon = COALESCE($3, icon),
           sort_order = COALESCE($4, sort_order),
           active = COALESCE($5, active)
       WHERE id = $6 AND deleted_at IS NULL
       RETURNING *`,
      [data.name, data.description, data.icon, data.sort_order, data.active, id]
    );
    return res.rows[0] || null;
  }

  async softDeleteCategory(id: number): Promise<boolean> {
    const client = await this.getClient();
    const res = await client.query(
      `UPDATE service_categories SET deleted_at = CURRENT_TIMESTAMP, active = FALSE WHERE id = $1`,
      [id]
    );
    return (res.rowCount || 0) > 0;
  }

  async listServices(options: { categoryId?: number; status?: string; activeOnly?: boolean } = {}): Promise<ServiceEntity[]> {
    const client = await this.getClient();
    let sql = `
      SELECT s.*, c.name as category_name
      FROM services s
      LEFT JOIN service_categories c ON c.id = s.category_id
      WHERE s.deleted_at IS NULL
    `;
    const params: any[] = [];

    if (options.categoryId) {
      params.push(options.categoryId);
      sql += ` AND s.category_id = $${params.length}`;
    }
    if (options.status) {
      params.push(options.status);
      sql += ` AND s.status = $${params.length}`;
    }
    if (options.activeOnly) {
      sql += ` AND s.is_active = TRUE`;
    }

    sql += ` ORDER BY s.sort_order ASC, s.name ASC`;
    const res = await client.query<ServiceEntity>(sql, params);
    return res.rows;
  }

  async getServiceById(id: string, tx?: DatabaseTransactionContext): Promise<ServiceEntity | null> {
    const queryFn = tx ? tx.query : (await this.getClient()).query;
    const res = await queryFn<ServiceEntity>(
      `SELECT s.*, c.name as category_name
       FROM services s
       LEFT JOIN service_categories c ON c.id = s.category_id
       WHERE (s.id = $1 OR s.public_id = $1) AND s.deleted_at IS NULL
       LIMIT 1`,
      [id]
    );
    return res.rows[0] || null;
  }

  async createService(data: Partial<ServiceEntity>): Promise<ServiceEntity> {
    const client = await this.getClient();
    const res = await client.query<ServiceEntity>(
      `INSERT INTO services (
         id, public_id, name, slug, category_id, description, short_description,
         price, base_price, discounted_price, strike_price, duration_minutes,
         warranty_days, sla_hours, tax_percent, image_url, status, is_active,
         sort_order, features, availability, requirements, created_at, updated_at
       )
       VALUES (
         $1, $2, $3, $4, $5, $6, $7,
         $8, $9, $10, $11, $12,
         $13, $14, $15, $16, $17, $18,
         $19, $20, $21, $22, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
       )
       RETURNING *`,
      [
        data.id,
        data.public_id,
        data.name,
        data.slug || null,
        data.category_id,
        data.description || null,
        data.short_description || null,
        data.price || 0,
        data.base_price || data.price || 0,
        data.discounted_price || null,
        data.strike_price || null,
        data.duration_minutes || 60,
        data.warranty_days || 30,
        data.sla_hours || 4,
        data.tax_percent || 18,
        data.image_url || null,
        data.status || 'ACTIVE',
        data.is_active ?? true,
        data.sort_order || 1,
        typeof data.features === 'string' ? data.features : JSON.stringify(data.features || []),
        typeof data.availability === 'string' ? data.availability : JSON.stringify(data.availability || []),
        typeof data.requirements === 'string' ? data.requirements : JSON.stringify(data.requirements || []),
      ]
    );
    return res.rows[0];
  }

  async updateService(id: string, data: Partial<ServiceEntity>): Promise<ServiceEntity | null> {
    const client = await this.getClient();
    const res = await client.query<ServiceEntity>(
      `UPDATE services
       SET name = COALESCE($1, name),
           price = COALESCE($2, price),
           base_price = COALESCE($3, base_price),
           discounted_price = COALESCE($4, discounted_price),
           duration_minutes = COALESCE($5, duration_minutes),
           status = COALESCE($6, status),
           is_active = COALESCE($7, is_active),
           description = COALESCE($8, description),
           updated_at = CURRENT_TIMESTAMP
       WHERE (id = $9 OR public_id = $9) AND deleted_at IS NULL
       RETURNING *`,
      [
        data.name,
        data.price,
        data.base_price,
        data.discounted_price,
        data.duration_minutes,
        data.status,
        data.is_active,
        data.description,
        id,
      ]
    );
    return res.rows[0] || null;
  }

  async softDeleteService(id: string): Promise<boolean> {
    const client = await this.getClient();
    const res = await client.query(
      `UPDATE services SET deleted_at = CURRENT_TIMESTAMP, is_active = FALSE, status = 'ARCHIVED' WHERE id = $1 OR public_id = $1`,
      [id]
    );
    return (res.rowCount || 0) > 0;
  }
}

export const catalogRepository = new CatalogRepository();
