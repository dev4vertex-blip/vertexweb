import { BaseRepository, DatabaseTransactionContext } from './baseRepository.js';

export interface LocationEntity {
  id: number;
  name: string;
  code: string | null;
  country: string;
  state_id: number;
  state_name?: string;
  tier: number;
  active: boolean;
  status: string;
  city: string | null;
  area: string | null;
  pincode: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  created_at: string;
  updated_at: string | null;
  deleted_at: string | null;
}

export class LocationRepository extends BaseRepository {
  async listLocations(options: { activeOnly?: boolean; status?: string } = {}): Promise<LocationEntity[]> {
    const client = await this.getClient();
    let sql = `
      SELECT c.*, s.name as state_name, s.code as state_code
      FROM cities c
      LEFT JOIN states s ON c.state_id = s.id
      WHERE c.deleted_at IS NULL
    `;
    const params: any[] = [];
    if (options.status && options.status !== 'ALL') {
      params.push(options.status.toUpperCase());
      sql += ` AND UPPER(c.status) = $${params.length}`;
    }
    if (options.activeOnly) {
      sql += ` AND c.active = TRUE`;
    }

    sql += ` ORDER BY c.tier ASC, c.name ASC`;
    const res = await client.query<LocationEntity>(sql, params);
    return res.rows;
  }

  async getLocationById(id: number): Promise<LocationEntity | null> {
    const client = await this.getClient();
    const res = await client.query<LocationEntity>(
      `SELECT c.*, s.name as state_name, s.code as state_code
       FROM cities c
       LEFT JOIN states s ON c.state_id = s.id
       WHERE c.id = $1 AND c.deleted_at IS NULL LIMIT 1`,
      [id]
    );
    return res.rows[0] || null;
  }

  async createLocation(data: Partial<LocationEntity>): Promise<LocationEntity> {
    const client = await this.getClient();
    const res = await client.query<LocationEntity>(
      `INSERT INTO cities (
         name, code, country, state_id, tier, active, status,
         city, area, pincode, address, latitude, longitude, description, created_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, CURRENT_TIMESTAMP)
       RETURNING *`,
      [
        data.name,
        data.code || null,
        data.country || 'India',
        data.state_id || 1,
        data.tier || 1,
        data.active ?? true,
        data.status || 'ACTIVE',
        data.city || data.name,
        data.area || null,
        data.pincode || null,
        data.address || null,
        data.latitude || null,
        data.longitude || null,
        data.description || null,
      ]
    );
    return res.rows[0];
  }

  async updateLocation(id: number, data: Partial<LocationEntity>): Promise<LocationEntity | null> {
    const client = await this.getClient();
    const res = await client.query<LocationEntity>(
      `UPDATE cities
       SET name = COALESCE($1, name),
           status = COALESCE($2, status),
           active = COALESCE($3, active),
           tier = COALESCE($4, tier),
           area = COALESCE($5, area),
           pincode = COALESCE($6, pincode),
           address = COALESCE($7, address),
           description = COALESCE($8, description),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $9 AND deleted_at IS NULL
       RETURNING *`,
      [
        data.name,
        data.status,
        data.active,
        data.tier,
        data.area,
        data.pincode,
        data.address,
        data.description,
        id,
      ]
    );
    return res.rows[0] || null;
  }

  async softDeleteLocation(id: number): Promise<boolean> {
    const client = await this.getClient();
    const res = await client.query(
      `UPDATE cities SET deleted_at = CURRENT_TIMESTAMP, active = FALSE, status = 'INACTIVE' WHERE id = $1`,
      [id]
    );
    return (res.rowCount || 0) > 0;
  }
}

export const locationRepository = new LocationRepository();
