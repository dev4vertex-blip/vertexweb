import pg from 'pg';
const { Pool } = pg;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema.js';
import { memoryStore } from './memoryStore.js';

let poolInstance: pg.Pool | null = null;
let drizzleInstance: any = null;
let activeDatabaseUrl: string | null = null;
let isDatabaseOnline: boolean | null = null;
let lastConnectionCheck: number = 0;

let testDbClientOverride: DbClient | null = null;

export function setTestDbClient(client: DbClient | null) {
  testDbClientOverride = client;
}

export interface DbClient {
  query: <T = any>(text: string, params?: any[]) => Promise<{ rows: T[]; rowCount: number | null }>;
  exec: (text: string) => Promise<any>;
  pool: pg.Pool | null;
}

/**
 * Safely normalizes and sanitizes DATABASE_URL string.
 * Strips placeholder brackets [ ] and URL-encodes special characters in password.
 */
export function sanitizeDatabaseUrl(rawUrl: string): string {
  let url = rawUrl.trim();
  if (!url) return '';

  // 1. Strip square brackets around password if present (common copy-paste issue from Supabase placeholders)
  url = url.replace(/:\[([^\]]+)\]@/, (_, pwd) => {
    return ':' + encodeURIComponent(pwd) + '@';
  });

  // 2. Handle percent-encoded brackets %5B ... %5D
  url = url.replace(/:%5B([^%]+)%5D@/i, (_, pwd) => {
    return ':' + encodeURIComponent(pwd) + '@';
  });

  return url;
}

/**
 * Validates the DATABASE_URL configuration safely without leaking credentials.
 */
export function validateDatabaseConfig(): { ok: boolean; reason?: string; sanitizedUrl?: string } {
  const rawUrl = process.env.DATABASE_URL?.trim();

  if (!rawUrl) {
    return {
      ok: false,
      reason: 'DATABASE_URL is not configured.',
    };
  }

  if (rawUrl.includes('[YOUR-PASSWORD]')) {
    return {
      ok: false,
      reason:
        'DATABASE_URL contains the placeholder [YOUR-PASSWORD]. Please update DATABASE_URL with your actual Supabase database password in the Settings menu.',
    };
  }

  const url = sanitizeDatabaseUrl(rawUrl);

  try {
    const parsed = new URL(url);
    if (!parsed.hostname) {
      return { ok: false, reason: 'DATABASE_URL is missing a valid hostname.' };
    }
    return { ok: true, sanitizedUrl: url };
  } catch {
    return { ok: false, reason: 'DATABASE_URL is not a valid connection URL format.' };
  }
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
  return validation.sanitizedUrl || sanitizeDatabaseUrl(process.env.DATABASE_URL!.trim());
}

/**
 * Retrieves or creates a singleton PostgreSQL Pool connected to Supabase.
 * Returns null safely if configuration is invalid, placeholder is present, or database is offline.
 */
export function getPool(): pg.Pool | null {
  // If database was verified to be offline recently, avoid connection hangs
  if (isDatabaseOnline === false && Date.now() - lastConnectionCheck < 30000) {
    return null;
  }

  const validation = validateDatabaseConfig();
  if (!validation.ok) {
    return null;
  }

  const currentUrl = validation.sanitizedUrl || getDatabaseUrl();

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
    poolInstance = new Pool({
      connectionString: currentUrl,
      ssl: {
        rejectUnauthorized: false,
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    activeDatabaseUrl = currentUrl;

    poolInstance.on('error', () => {
      // Mark offline and release pool safely without polluting server output
      isDatabaseOnline = false;
      if (poolInstance) {
        poolInstance.end().catch(() => {});
        poolInstance = null;
        activeDatabaseUrl = null;
      }
    });

    return poolInstance;
  } catch {
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
  if (testDbClientOverride) {
    return {
      db: drizzleInstance || {},
      client: testDbClientOverride,
      pglite: testDbClientOverride,
      pool: testDbClientOverride.pool,
      isAvailable: true,
    };
  }

  const pool = getPool();

  if (pool && isDatabaseOnline !== false) {
    try {
      const client: DbClient = {
        query: async <T = any>(text: string, params?: any[]): Promise<{ rows: T[]; rowCount: number | null }> => {
          try {
            const res = await pool.query(text, params);
            return { rows: res.rows as T[], rowCount: res.rowCount };
          } catch (err) {
            if (process.env.NODE_ENV === 'production') {
              console.error('[PostgreSQL Query Error in Production]:', err);
              throw err;
            }
            // Seamlessly fall back to memoryStore only in non-production local development
            return await memoryStore.executeQuery<T>(text, params);
          }
        },
        exec: async (text: string): Promise<any> => {
          try {
            return await pool.query(text);
          } catch (err) {
            if (process.env.NODE_ENV === 'production') {
              console.error('[PostgreSQL Exec Error in Production]:', err);
              throw err;
            }
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
    } catch (err) {
      if (process.env.NODE_ENV === 'production') {
        throw err;
      }
      // Fall through to memory store client in development
    }
  }

  // In production: Fail fast! In-memory fallback for business data is strictly forbidden.
  if (process.env.NODE_ENV === 'production') {
    throw new Error('[CRITICAL PRODUCTION ERROR] PostgreSQL database is offline. In-memory data store fallback is disabled in production.');
  }

  // Resilient memory store client for local development only
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
  lastConnectionCheck = Date.now();
  const validation = validateDatabaseConfig();
  if (!validation.ok) {
    isDatabaseOnline = false;
    return {
      connected: false,
      message: validation.reason || 'DATABASE_URL is not configured.',
    };
  }

  const url = validation.sanitizedUrl || getDatabaseUrl();
  const probePool = new Pool({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 4000,
  });

  try {
    const res = await probePool.query('SELECT NOW() as now, version() as version;');
    isDatabaseOnline = true;

    if (!poolInstance || activeDatabaseUrl !== url) {
      if (poolInstance) {
        poolInstance.end().catch(() => {});
      }
      poolInstance = probePool;
      activeDatabaseUrl = url;
    } else {
      probePool.end().catch(() => {});
    }

    return {
      connected: true,
      message: 'Successfully connected to Supabase PostgreSQL.',
      version: res.rows[0]?.version,
    };
  } catch (err: any) {
    isDatabaseOnline = false;
    if (poolInstance) {
      poolInstance.end().catch(() => {});
      poolInstance = null;
      activeDatabaseUrl = null;
    }
    probePool.end().catch(() => {});

    const msg = err?.message || '';
    let sanitizedMessage = 'Database connection could not be established.';

    if (msg.includes('password authentication failed')) {
      sanitizedMessage =
        'Password authentication failed for Supabase database. Please verify the database password in DATABASE_URL.';
    } else if (msg.includes('ENOTFOUND') || msg.includes('getaddrinfo')) {
      sanitizedMessage = 'Supabase host not found. Please verify the host in DATABASE_URL.';
    } else if (msg.includes('ETIMEDOUT') || msg.includes('timeout')) {
      sanitizedMessage =
        'Connection to Supabase timed out. Please check network connectivity or connection pooler settings.';
    } else if (msg.includes('ECONNREFUSED')) {
      sanitizedMessage =
        'Connection refused on database port. Ensure you are using the Supabase Connection Pooler URL.';
    }

    return { connected: false, message: sanitizedMessage };
  }
}

export { schema };
