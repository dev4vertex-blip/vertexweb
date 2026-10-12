import { BaseRepository, DatabaseTransactionContext } from './baseRepository.js';

export interface AmcPlanEntity {
  id: string;
  public_id: string;
  name: string;
  code: string | null;
  slug: string | null;
  description: string | null;
  duration_months: number;
  price: number | string;
  base_price: number | string;
  strike_price: number | string | null;
  tax_percent: number | string;
  preventive_visits: number;
  breakdown_visits: number;
  spare_parts_discount_percent: number | string;
  gas_charging_included: boolean;
  priority_sla_hours: number;
  included_services: string | null;
  benefits: string | null;
  exclusions: string | null;
  terms: string | null;
  status: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string | null;
  deleted_at: string | null;
}

export interface AmcSubscriptionEntity {
  id: string;
  subscription_number: string;
  plan_id: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string | null;
  service_address: string;
  start_date: string;
  end_date: string;
  total_amount: number | string;
  payment_status: string;
  status: string;
  visits_total: number;
  visits_used: number;
  created_at: string;
  plan_name?: string;
}

export class AmcRepository extends BaseRepository {
  async listPlans(activeOnly = false): Promise<AmcPlanEntity[]> {
    const client = await this.getClient();
    let sql = `SELECT * FROM amc_plans WHERE deleted_at IS NULL`;
    if (activeOnly) {
      sql += ` AND is_active = TRUE`;
    }
    sql += ` ORDER BY sort_order ASC, name ASC`;
    const res = await client.query<AmcPlanEntity>(sql);
    return res.rows;
  }

  async getPlanById(id: string): Promise<AmcPlanEntity | null> {
    const client = await this.getClient();
    const res = await client.query<AmcPlanEntity>(
      `SELECT * FROM amc_plans WHERE (id = $1 OR public_id = $1 OR code = $1) AND deleted_at IS NULL LIMIT 1`,
      [id]
    );
    return res.rows[0] || null;
  }

  async createPlan(data: Partial<AmcPlanEntity>): Promise<AmcPlanEntity> {
    const client = await this.getClient();
    const res = await client.query<AmcPlanEntity>(
      `INSERT INTO amc_plans (
         id, public_id, name, code, slug, description, duration_months,
         price, base_price, strike_price, tax_percent, preventive_visits,
         breakdown_visits, spare_parts_discount_percent, gas_charging_included,
         priority_sla_hours, benefits, status, is_active, sort_order, created_at
       )
       VALUES (
         $1, $2, $3, $4, $5, $6, $7,
         $8, $9, $10, $11, $12,
         $13, $14, $15,
         $16, $17, $18, $19, $20, CURRENT_TIMESTAMP
       )
       RETURNING *`,
      [
        data.id,
        data.public_id,
        data.name,
        data.code || null,
        data.slug || null,
        data.description || null,
        data.duration_months || 12,
        data.price || 0,
        data.base_price || data.price || 0,
        data.strike_price || null,
        data.tax_percent || 18,
        data.preventive_visits || 2,
        data.breakdown_visits || 4,
        data.spare_parts_discount_percent || 15,
        Boolean(data.gas_charging_included),
        data.priority_sla_hours || 4,
        typeof data.benefits === 'string' ? data.benefits : JSON.stringify(data.benefits || []),
        data.status || 'ACTIVE',
        data.is_active ?? true,
        data.sort_order || 1,
      ]
    );
    return res.rows[0];
  }

  async updatePlan(id: string, data: Partial<AmcPlanEntity>): Promise<AmcPlanEntity | null> {
    const client = await this.getClient();
    const res = await client.query<AmcPlanEntity>(
      `UPDATE amc_plans
       SET name = COALESCE($1, name),
           base_price = COALESCE($2, base_price),
           price = COALESCE($2, price),
           strike_price = COALESCE($3, strike_price),
           duration_months = COALESCE($4, duration_months),
           is_active = COALESCE($5, is_active),
           status = COALESCE($6, status),
           description = COALESCE($7, description),
           preventive_visits = COALESCE($8, preventive_visits),
           breakdown_visits = COALESCE($9, breakdown_visits),
           spare_parts_discount_percent = COALESCE($10, spare_parts_discount_percent),
           priority_sla_hours = COALESCE($11, priority_sla_hours),
           updated_at = CURRENT_TIMESTAMP
       WHERE (id = $12 OR public_id = $12) AND deleted_at IS NULL
       RETURNING *`,
      [
        data.name,
        data.base_price,
        data.strike_price,
        data.duration_months,
        data.is_active,
        data.status,
        data.description,
        data.preventive_visits,
        data.breakdown_visits,
        data.spare_parts_discount_percent,
        data.priority_sla_hours,
        id,
      ]
    );
    return res.rows[0] || null;
  }

  async softDeletePlan(id: string): Promise<boolean> {
    const client = await this.getClient();
    const res = await client.query(
      `UPDATE amc_plans SET deleted_at = CURRENT_TIMESTAMP, is_active = FALSE, status = 'INACTIVE' WHERE id = $1 OR public_id = $1`,
      [id]
    );
    return (res.rowCount || 0) > 0;
  }

  async listSubscriptions(customerId?: string): Promise<AmcSubscriptionEntity[]> {
    const client = await this.getClient();
    let sql = `
      SELECT sub.*, p.name as plan_name
      FROM amc_subscriptions sub
      LEFT JOIN amc_plans p ON p.id = sub.plan_id
      WHERE sub.deleted_at IS NULL
    `;
    const params: any[] = [];
    if (customerId) {
      params.push(customerId);
      sql += ` AND sub.customer_id = $1`;
    }
    sql += ` ORDER BY sub.created_at DESC`;
    const res = await client.query<AmcSubscriptionEntity>(sql, params);
    return res.rows;
  }
}

export const amcRepository = new AmcRepository();
