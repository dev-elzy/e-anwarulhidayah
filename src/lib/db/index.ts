import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

const globalForDb = globalThis as unknown as {
  _postgresClient?: postgres.Sql;
  _drizzleDb?: any;
};

export const getDb = () => {
  // Selama fase build produksi Next.js (prerender static pages)
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return new Proxy({} as any, {
      get(_, prop) {
        if (prop === 'select' || prop === 'insert' || prop === 'update' || prop === 'delete' || prop === 'query') {
          return () => Promise.resolve([]);
        }
        return undefined;
      }
    });
  }

  if (globalForDb._drizzleDb) {
    return globalForDb._drizzleDb;
  }

  const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;

  if (!connectionString) {
    // Return proxy with helpful warning if DATABASE_URL is not set yet
    return new Proxy({} as any, {
      get(_, prop) {
        if (prop === 'select' || prop === 'insert' || prop === 'update' || prop === 'delete' || prop === 'query') {
          throw new Error(
            'DATABASE_URL belum dikonfigurasi. Silakan isi DATABASE_URL di file .env dengan connection string Supabase Anda.'
          );
        }
        return undefined;
      }
    });
  }

  try {
    // Ultra-low latency Postgres.js connection pooler
    // prepare: false diperlukan untuk Supabase transaction pooler (port 6543 / pgbouncer)
    const client = globalForDb._postgresClient ?? postgres(connectionString, {
      prepare: false,
      max: 10,
      idle_timeout: 30,
      connect_timeout: 15,
      ssl: 'require',
    });

    if (process.env.NODE_ENV !== 'production') {
      globalForDb._postgresClient = client;
    }

    const dbInstance = drizzle(client, { schema });
    if (process.env.NODE_ENV !== 'production') {
      globalForDb._drizzleDb = dbInstance;
    }

    return dbInstance;
  } catch (error) {
    console.error('Gagal menghubungkan ke Supabase PostgreSQL:', error);
    throw error;
  }
};

export const db = getDb();
