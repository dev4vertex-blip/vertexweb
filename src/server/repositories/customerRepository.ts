import { BaseRepository, DatabaseTransactionContext } from './baseRepository.js';

export interface AddressEntity {
  id: string;
  user_id: string;
  label: string;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  state: string;
  postal_code: string;
  latitude: number | null;
  longitude: number | null;
  is_default: boolean;
  created_at: string;
  updated_at: string | null;
  deleted_at: string | null;
}

export interface CustomerProfileEntity {
  id: string;
  user_id: string;
  customer_type: string;
  preferred_language: string | null;
  notes: string | null;
  created_at: string;
}

export class CustomerRepository extends BaseRepository {
  async getProfile(userId: string): Promise<any | null> {
    const client = await this.getClient();
    const res = await client.query(
      `SELECT u.id, u.public_id, u.name, u.email, u.phone, u.profile_image,
              cp.customer_type, cp.preferred_language, cp.notes
       FROM users u
       LEFT JOIN customer_profiles cp ON cp.user_id = u.id
       WHERE u.id = $1 AND u.deleted_at IS NULL LIMIT 1`,
      [userId]
    );
    return res.rows[0] || null;
  }

  async updateProfile(userId: string, data: { name?: string; email?: string; phone?: string }): Promise<void> {
    const client = await this.getClient();
    await client.query(
      `UPDATE users
       SET name = COALESCE($1, name),
           email = COALESCE($2, email),
           phone = COALESCE($3, phone),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [data.name, data.email, data.phone, userId]
    );
  }

  async getAddresses(userId: string): Promise<AddressEntity[]> {
    const client = await this.getClient();
    const res = await client.query<AddressEntity>(
      `SELECT * FROM addresses
       WHERE user_id = $1 AND deleted_at IS NULL
       ORDER BY is_default DESC, created_at DESC`,
      [userId]
    );
    return res.rows;
  }

  async getAddressById(addressId: string, tx?: DatabaseTransactionContext): Promise<AddressEntity | null> {
    const queryFn = tx ? tx.query : (await this.getClient()).query;
    const res = await queryFn<AddressEntity>(
      `SELECT * FROM addresses WHERE id = $1 AND deleted_at IS NULL LIMIT 1`,
      [addressId]
    );
    return res.rows[0] || null;
  }

  async createAddress(data: Partial<AddressEntity>, tx?: DatabaseTransactionContext): Promise<AddressEntity> {
    const queryFn = tx ? tx.query : (await this.getClient()).query;
    if (data.is_default) {
      await queryFn(`UPDATE addresses SET is_default = FALSE WHERE user_id = $1`, [data.user_id]);
    }

    const res = await queryFn<AddressEntity>(
      `INSERT INTO addresses (
         id, user_id, label, address_line_1, address_line_2,
         city, state, postal_code, latitude, longitude, is_default, created_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
       RETURNING *`,
      [
        data.id,
        data.user_id,
        data.label || 'Home',
        data.address_line_1,
        data.address_line_2 || null,
        data.city || 'Gurgaon',
        data.state || 'Haryana',
        data.postal_code || '122001',
        data.latitude || null,
        data.longitude || null,
        Boolean(data.is_default),
      ]
    );
    return res.rows[0];
  }

  async updateAddress(addressId: string, data: Partial<AddressEntity>): Promise<AddressEntity | null> {
    const client = await this.getClient();
    if (data.is_default && data.user_id) {
      await client.query(`UPDATE addresses SET is_default = FALSE WHERE user_id = $1`, [data.user_id]);
    }

    const res = await client.query<AddressEntity>(
      `UPDATE addresses
       SET label = COALESCE($1, label),
           address_line_1 = COALESCE($2, address_line_1),
           address_line_2 = COALESCE($3, address_line_2),
           city = COALESCE($4, city),
           state = COALESCE($5, state),
           postal_code = COALESCE($6, postal_code),
           is_default = COALESCE($7, is_default),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 AND deleted_at IS NULL
       RETURNING *`,
      [
        data.label,
        data.address_line_1,
        data.address_line_2,
        data.city,
        data.state,
        data.postal_code,
        data.is_default,
        addressId,
      ]
    );
    return res.rows[0] || null;
  }

  async softDeleteAddress(addressId: string, userId: string): Promise<boolean> {
    const client = await this.getClient();
    const res = await client.query(
      `UPDATE addresses SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2`,
      [addressId, userId]
    );
    return (res.rowCount || 0) > 0;
  }
}

export const customerRepository = new CustomerRepository();
