import { BaseRepository, DatabaseTransactionContext } from './baseRepository.js';

export interface PartnerEntity {
  id: string;
  public_id: string;
  user_id: string | null;
  company_name: string;
  contact_person: string;
  phone: string;
  email: string;
  status: string;
  address: string | null;
  tier: string;
  pan_number: string | null;
  gst_number: string | null;
  bank_account_number: string | null;
  bank_ifsc: string | null;
  bank_name: string | null;
  total_referrals: number;
  total_commission_earned: number | string;
  total_commission_paid: number | string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export class PartnerRepository extends BaseRepository {
  async listPartners(userId?: string): Promise<PartnerEntity[]> {
    const client = await this.getClient();
    let sql = `SELECT * FROM partners WHERE deleted_at IS NULL`;
    const params: any[] = [];
    if (userId) {
      params.push(userId);
      sql += ` AND user_id = $1`;
    }
    sql += ` ORDER BY created_at DESC`;
    const res = await client.query<PartnerEntity>(sql, params);
    return res.rows;
  }

  async getPartnerById(id: string): Promise<PartnerEntity | null> {
    const client = await this.getClient();
    const res = await client.query<PartnerEntity>(
      `SELECT * FROM partners WHERE (id = $1 OR public_id = $1) AND deleted_at IS NULL LIMIT 1`,
      [id]
    );
    return res.rows[0] || null;
  }

  async createPartner(data: Partial<PartnerEntity>): Promise<PartnerEntity> {
    const client = await this.getClient();
    const res = await client.query<PartnerEntity>(
      `INSERT INTO partners (
         id, public_id, user_id, company_name, contact_person, phone, email,
         status, address, tier, pan_number, gst_number, bank_account_number,
         bank_ifsc, bank_name, total_referrals, total_commission_earned,
         total_commission_paid, notes, created_at, updated_at
       )
       VALUES (
         $1, $2, $3, $4, $5, $6, $7,
         $8, $9, $10, $11, $12, $13,
         $14, $15, $16, $17,
         $18, $19, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
       )
       RETURNING *`,
      [
        data.id,
        data.public_id,
        data.user_id || null,
        data.company_name,
        data.contact_person,
        data.phone,
        data.email,
        data.status || 'ACTIVE',
        data.address || null,
        data.tier || 'STANDARD',
        data.pan_number || null,
        data.gst_number || null,
        data.bank_account_number || null,
        data.bank_ifsc || null,
        data.bank_name || null,
        data.total_referrals || 0,
        data.total_commission_earned || 0,
        data.total_commission_paid || 0,
        data.notes || null,
      ]
    );
    return res.rows[0];
  }

  async updatePartner(id: string, data: Partial<PartnerEntity>): Promise<PartnerEntity | null> {
    const client = await this.getClient();
    const res = await client.query<PartnerEntity>(
      `UPDATE partners
       SET company_name = COALESCE($1, company_name),
           contact_person = COALESCE($2, contact_person),
           phone = COALESCE($3, phone),
           email = COALESCE($4, email),
           status = COALESCE($5, status),
           tier = COALESCE($6, tier),
           notes = COALESCE($7, notes),
           updated_at = CURRENT_TIMESTAMP
       WHERE (id = $8 OR public_id = $8) AND deleted_at IS NULL
       RETURNING *`,
      [
        data.company_name,
        data.contact_person,
        data.phone,
        data.email,
        data.status,
        data.tier,
        data.notes,
        id,
      ]
    );
    return res.rows[0] || null;
  }

  async softDeletePartner(id: string): Promise<boolean> {
    const client = await this.getClient();
    const res = await client.query(
      `UPDATE partners SET deleted_at = CURRENT_TIMESTAMP, status = 'INACTIVE' WHERE id = $1 OR public_id = $1`,
      [id]
    );
    return (res.rowCount || 0) > 0;
  }
}

export const partnerRepository = new PartnerRepository();
