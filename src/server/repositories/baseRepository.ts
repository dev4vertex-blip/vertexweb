import { getDb, DbClient } from '../../db/client.js';

export interface DatabaseTransactionContext {
  client: DbClient;
  query: <T = any>(text: string, params?: any[]) => Promise<{ rows: T[]; rowCount: number | null }>;
}

let singleClientTxMutex = Promise.resolve();

async function acquireTxLock(): Promise<() => void> {
  let release: () => void;
  const nextLock = new Promise<void>((resolve) => {
    release = resolve;
  });
  const currentLock = singleClientTxMutex;
  singleClientTxMutex = singleClientTxMutex.then(() => nextLock);
  await currentLock;
  return release!;
}

export abstract class BaseRepository {
  protected async getClient(): Promise<DbClient> {
    const { pglite } = await getDb();
    return pglite;
  }

  /**
   * Execute callback within an isolated PostgreSQL transaction
   */
  async withTransaction<T>(callback: (ctx: DatabaseTransactionContext) => Promise<T>): Promise<T> {
    const client = await this.getClient();
    
    // If running with single-connection client without pool (e.g. PGlite in tests), serialize transaction boundaries
    if (!client.pool) {
      const release = await acquireTxLock();
      try {
        await client.exec('BEGIN');
        const result = await callback({ client, query: client.query });
        await client.exec('COMMIT');
        return result;
      } catch (err) {
        await client.exec('ROLLBACK').catch(() => {});
        throw err;
      } finally {
        release();
      }
    }

    const poolClient = await client.pool.connect();
    try {
      await poolClient.query('BEGIN');
      const txCtx: DatabaseTransactionContext = {
        client: {
          query: async (text: string, params?: any[]) => {
            const res = await poolClient.query(text, params);
            return { rows: res.rows, rowCount: res.rowCount };
          },
          exec: async (text: string) => poolClient.query(text),
          pool: client.pool,
        },
        query: async (text: string, params?: any[]) => {
          const res = await poolClient.query(text, params);
          return { rows: res.rows, rowCount: res.rowCount };
        },
      };

      const result = await callback(txCtx);
      await poolClient.query('COMMIT');
      return result;
    } catch (err) {
      await poolClient.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      poolClient.release();
    }
  }
}
