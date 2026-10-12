import { BaseRepository } from './baseRepository.js';

export interface LeadEntity {
  id: string;
  public_id: string;
  customer_name: string;
  company_name: string | null;
  email: string | null;
  phone: string;
  alternate_phone: string | null;
  address: string | null;
  service_interest: string;
  service_category: string | null;
  requirement_details: string | null;
  estimated_value: number | string;
  lead_source: string;
  priority: string;
  stage: string;
  status: string;
  loss_reason: string | null;
  won_booking_id: string | null;
  won_customer_id: string | null;
  assigned_to: string | null;
  assigned_to_name?: string | null;
  created_by: string;
  created_by_name?: string | null;
  city_id: number | null;
  cityName?: string | null;
  expected_followup_date: string | null;
  expected_followup_time: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface LeadFollowupEntity {
  id: string;
  lead_id: string;
  scheduled_date: string;
  scheduled_time: string | null;
  followup_type: string;
  notes: string;
  outcome: string | null;
  status: string;
  completed: boolean;
  completed_at: string | null;
  completed_by: string | null;
  cancellation_reason: string | null;
  created_at: string;
}

export class CrmRepository extends BaseRepository {
  async listLeads(options: {
    assignedTo?: string;
    salesUserIds?: string[];
    stage?: string;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<LeadEntity[]> {
    const client = await this.getClient();
    let sql = `
      SELECT l.*,
             u.name as assigned_to_name,
             c.name as created_by_name
      FROM leads l
      LEFT JOIN users u ON u.id = l.assigned_to
      LEFT JOIN users c ON c.id = l.created_by
      WHERE l.deleted_at IS NULL
    `;
    const params: any[] = [];

    if (options.assignedTo) {
      params.push(options.assignedTo);
      sql += ` AND l.assigned_to = $${params.length}`;
    } else if (options.salesUserIds && options.salesUserIds.length > 0) {
      sql += ` AND l.assigned_to = ANY($${params.length + 1}::text[])`;
      params.push(options.salesUserIds);
    }

    if (options.stage && options.stage !== 'ALL') {
      params.push(options.stage);
      sql += ` AND l.stage = $${params.length}`;
    }

    if (options.status && options.status !== 'ALL') {
      params.push(options.status);
      sql += ` AND l.status = $${params.length}`;
    }

    sql += ` ORDER BY l.created_at DESC`;
    if (options.limit) {
      params.push(options.limit);
      sql += ` LIMIT $${params.length}`;
    }
    if (options.offset) {
      params.push(options.offset);
      sql += ` OFFSET $${params.length}`;
    }

    const res = await client.query<LeadEntity>(sql, params);
    return res.rows;
  }

  async getLeadById(id: string): Promise<LeadEntity | null> {
    const client = await this.getClient();
    const res = await client.query<LeadEntity>(
      `SELECT l.*,
              u.name as assigned_to_name,
              c.name as created_by_name
       FROM leads l
       LEFT JOIN users u ON u.id = l.assigned_to
       LEFT JOIN users c ON c.id = l.created_by
       WHERE (l.id = $1 OR l.public_id = $1) AND l.deleted_at IS NULL
       LIMIT 1`,
      [id]
    );
    return res.rows[0] || null;
  }

  async createLead(data: Partial<LeadEntity>): Promise<LeadEntity> {
    const client = await this.getClient();
    const res = await client.query<LeadEntity>(
      `INSERT INTO leads (
         id, public_id, customer_name, company_name, email, phone, alternate_phone,
         address, service_interest, service_category, requirement_details, estimated_value,
         lead_source, priority, stage, status, assigned_to, created_by, city_id,
         expected_followup_date, expected_followup_time, notes, created_at, updated_at
       )
       VALUES (
         $1, $2, $3, $4, $5, $6, $7,
         $8, $9, $10, $11, $12,
         $13, $14, $15, $16, $17, $18, $19,
         $20, $21, $22, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
       )
       RETURNING *`,
      [
        data.id,
        data.public_id,
        data.customer_name,
        data.company_name || null,
        data.email || null,
        data.phone,
        data.alternate_phone || null,
        data.address || null,
        data.service_interest,
        data.service_category || null,
        data.requirement_details || null,
        data.estimated_value || 0,
        data.lead_source || 'ORGANIC',
        data.priority || 'MEDIUM',
        data.stage || 'NEW',
        data.status || 'ACTIVE',
        data.assigned_to || null,
        data.created_by,
        data.city_id || null,
        data.expected_followup_date || null,
        data.expected_followup_time || null,
        data.notes || null,
      ]
    );
    return res.rows[0];
  }

  async updateLead(id: string, data: Partial<LeadEntity>): Promise<LeadEntity | null> {
    const client = await this.getClient();
    const res = await client.query<LeadEntity>(
      `UPDATE leads
       SET customer_name = COALESCE($1, customer_name),
           phone = COALESCE($2, phone),
           email = COALESCE($3, email),
           stage = COALESCE($4, stage),
           status = COALESCE($5, status),
           assigned_to = COALESCE($6, assigned_to),
           estimated_value = COALESCE($7, estimated_value),
           loss_reason = COALESCE($8, loss_reason),
           updated_at = CURRENT_TIMESTAMP
       WHERE (id = $9 OR public_id = $9) AND deleted_at IS NULL
       RETURNING *`,
      [
        data.customer_name,
        data.phone,
        data.email,
        data.stage,
        data.status,
        data.assigned_to,
        data.estimated_value,
        data.loss_reason,
        id,
      ]
    );
    return res.rows[0] || null;
  }

  async listFollowups(leadId: string): Promise<LeadFollowupEntity[]> {
    const client = await this.getClient();
    const res = await client.query<LeadFollowupEntity>(
      `SELECT * FROM lead_followups WHERE lead_id = $1 ORDER BY scheduled_date ASC`,
      [leadId]
    );
    return res.rows;
  }

  async createFollowup(data: Partial<LeadFollowupEntity>): Promise<LeadFollowupEntity> {
    const client = await this.getClient();
    const res = await client.query<LeadFollowupEntity>(
      `INSERT INTO lead_followups (
         id, lead_id, scheduled_date, scheduled_time, followup_type,
         notes, outcome, status, completed, created_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
       RETURNING *`,
      [
        data.id,
        data.lead_id,
        data.scheduled_date,
        data.scheduled_time || null,
        data.followup_type || 'CALL',
        data.notes || '',
        data.outcome || null,
        data.status || 'SCHEDULED',
        Boolean(data.completed),
      ]
    );
    return res.rows[0];
  }

  async completeFollowup(id: string, outcome: string, completedBy: string): Promise<LeadFollowupEntity | null> {
    const client = await this.getClient();
    const res = await client.query<LeadFollowupEntity>(
      `UPDATE lead_followups
       SET completed = TRUE,
           status = 'COMPLETED',
           outcome = $1,
           completed_by = $2,
           completed_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [outcome, completedBy, id]
    );
    return res.rows[0] || null;
  }

  async softDeleteLead(id: string): Promise<boolean> {
    const client = await this.getClient();
    const res = await client.query(
      `UPDATE leads SET deleted_at = CURRENT_TIMESTAMP, status = 'ARCHIVED' WHERE (id = $1 OR public_id = $1)`,
      [id]
    );
    return (res.rowCount || 0) > 0;
  }
}

export const crmRepository = new CrmRepository();
