import pg from 'pg';
const { Pool } = pg;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema.js';
import { memoryStore } from './memoryStore.js';

let poolInstance: pg.Pool | null = null;
let drizzleInstance: any = null;
let activeDatabaseUrl: string | null = null;

export interface DbClient {
  query: <T = any>(text: string, params?: any[]) => Promise<{ rows: T[]; rowCount: number | null }>;
  exec: (text: string) => Promise<any>;
  pool: pg.Pool | null;
}

/**
 * Validates the DATABASE_URL configuration safely without leaking credentials.
 */
export function validateDatabaseConfig(): { ok: boolean; reason?: string } {
  const url = process.env.DATABASE_URL?.trim();

  if (!url) {
    return {
      ok: false,
      reason: 'DATABASE_URL is not configured.',
    };
  }

  if (url.includes('[YOUR-PASSWORD]')) {
    return {
      ok: false,
      reason:
        'DATABASE_URL contains the placeholder [YOUR-PASSWORD]. Please update DATABASE_URL with your actual Supabase database password in the Settings menu.',
    };
  }

  try {
    const parsed = new URL(url);
    if (!parsed.hostname) {
      return { ok: false, reason: 'DATABASE_URL is missing a valid hostname.' };
    }
  } catch {
    return { ok: false, reason: 'DATABASE_URL is not a valid connection URL format.' };
  }

  return { ok: true };
}

/**
 * Returns the validated DATABASE_URL from server environment.
 * Throws a clean error if missing or invalid.
 */
export function getDatabaseUrl(): string {
  const validation = validateDatabaseConfig();
  if (!validation.ok) {
    throw new Error(validation.reason);
  }
  return process.env.DATABASE_URL!.trim();
}

/**
 * Retrieves or creates a singleton PostgreSQL Pool connected to Supabase.
 * Returns null safely if configuration is invalid or placeholder is present.
 */
export function getPool(): pg.Pool | null {
  const validation = validateDatabaseConfig();
  if (!validation.ok) {
    return null;
  }

  const currentUrl = process.env.DATABASE_URL?.trim();

  // If pool already exists and URL has not changed, reuse it
  if (poolInstance && activeDatabaseUrl === currentUrl) {
    return poolInstance;
  }

  // If URL changed or pool is stale, tear down old pool
  if (poolInstance) {
    try {
      poolInstance.end().catch(() => {});
    } catch {}
    poolInstance = null;
    drizzleInstance = null;
  }

  try {
    const databaseUrl = currentUrl!;

    poolInstance = new Pool({
      connectionString: databaseUrl,
      ssl: {
        rejectUnauthorized: false,
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    activeDatabaseUrl = currentUrl || null;

    poolInstance.on('error', (err: any) => {
      // Log connection issue server-side without leaking passwords
      console.warn('[Supabase PostgreSQL Pool] Connection event:', err?.message || 'Database error');
    });

    return poolInstance;
  } catch (err: any) {
    console.warn('[Supabase PostgreSQL Pool] Pool initialization deferred:', err?.message || 'Configuration pending');
    return null;
  }
}

/**
 * Primary database accessor for backend services and API routes.
 * Returns both Drizzle ORM instance and SQL query client with seamless resilient fallback.
 */
export async function getDb(): Promise<{
  db: any;
  client: DbClient;
  pglite: DbClient;
  pool: pg.Pool | null;
  isAvailable: boolean;
}> {
  const pool = getPool();

  if (pool) {
    try {
      const client: DbClient = {
        query: async <T = any>(text: string, params?: any[]): Promise<{ rows: T[]; rowCount: number | null }> => {
          try {
            const res = await pool.query(text, params);
            return { rows: res.rows as T[], rowCount: res.rowCount };
          } catch {
            // Seamlessly fall back to memoryStore if live query drops
            return await memoryStore.executeQuery<T>(text, params);
          }
        },
        exec: async (text: string): Promise<any> => {
          try {
            return await pool.query(text);
          } catch {
            return await memoryStore.executeQuery(text);
          }
        },
        pool,
      };

      if (!drizzleInstance) {
        drizzleInstance = drizzle(pool, { schema });
      }

      return {
        db: drizzleInstance,
        client,
        pglite: client, // Backwards-compatible alias for existing route handlers
        pool,
        isAvailable: true,
      };
    } catch {
      // Fall through to memory store client
    }
  }

  // Resilient memory store client
  const fallbackClient: DbClient = {
    query: async <T = any>(text: string, params?: any[]): Promise<{ rows: T[]; rowCount: number | null }> => {
      return await memoryStore.executeQuery<T>(text, params);
    },
    exec: async (text: string): Promise<any> => {
      return await memoryStore.executeQuery(text);
    },
    pool: null,
  };

  const noOp = {
    findMany: async () => [],
    findFirst: async () => null,
    findUnique: async () => null,
    create: async (d: any) => d?.data ?? {},
    update: async (d: any) => d?.data ?? {},
    delete: async () => ({}),
  };
  const mockDrizzle = new Proxy({}, {
    get: (_, prop) => (prop === 'query' ? new Proxy({}, { get: () => noOp }) : async () => []),
  });

  return {
    db: mockDrizzle,
    client: fallbackClient,
    pglite: fallbackClient,
    pool: null,
    isAvailable: false,
  };
}

/**
 * Tests connection to the Supabase PostgreSQL database.
 */
export async function testDatabaseConnection(): Promise<{
  connected: boolean;
  message: string;
  version?: string;
}> {
  const validation = validateDatabaseConfig();
  if (!validation.ok) {
    return {
      connected: false,
      message: validation.reason || 'DATABASE_URL is not configured.',
    };
  }

  try {
    const pool = getPool();
    if (!pool) {
      return {
        connected: false,
        message: validation.reason || 'Database configuration pending.',
      };
    }
    const res = await pool.query('SELECT NOW() as now, version() as version;');
    return {
      connected: true,
      message: 'Successfully connected to Supabase PostgreSQL.',
      version: res.rows[0]?.version,
    };
  } catch (err: any) {
    const msg = err?.message || '';
    let sanitizedMessage = 'Unable to connect to database.';

    if (msg.includes('password authentication failed')) {
      sanitizedMessage =
        'Password authentication failed for Supabase database. Please check the database password in DATABASE_URL.';
    } else if (msg.includes('ENOTFOUND') || msg.includes('getaddrinfo')) {
      sanitizedMessage = 'Supabase host not found. Please verify the host in DATABASE_URL.';
    } else if (msg.includes('ETIMEDOUT') || msg.includes('timeout')) {
      sanitizedMessage =
        'Connection to Supabase timed out. Please check network connectivity or connection pooler settings.';
    }

    return { connected: false, message: sanitizedMessage };
  }
}

export { schema };
