import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { cache } from 'react';

const globalForDb = globalThis as unknown as {
  _postgresClient?: postgres.Sql;
  _drizzleDb?: any;
};

export const getDb = cache(() => {
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

  let connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;
  let isHyperdrive = false;

  try {
    const cf = getCloudflareContext();
    if ((cf?.env as any)?.HYPERDRIVE?.connectionString) {
      connectionString = (cf.env as any).HYPERDRIVE.connectionString;
      isHyperdrive = true;
    } else if ((cf?.env as any)?.DATABASE_URL) {
      connectionString = (cf.env as any).DATABASE_URL;
    }
  } catch {
    // Di luar runtime Cloudflare Workers (misal: development lokal dengan Node.js)
  }

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
    if (isHyperdrive) {
      // Koneksi via Cloudflare Hyperdrive:
      // Hyperdrive mengelola pooling dan SSL ke Supabase secara native di edge Cloudflare
      const client = postgres(connectionString, {
        prepare: false,
        max: 5,
        idle_timeout: 20,
        connect_timeout: 10,
        fetch_types: false,
      });

      return drizzle(client, { schema });
    }

    // Koneksi development lokal atau fallback langsung
    if (globalForDb._drizzleDb) {
      return globalForDb._drizzleDb;
    }

    const client = globalForDb._postgresClient ?? postgres(connectionString, {
      prepare: false,
      max: 10,
      idle_timeout: 30,
      connect_timeout: 15,
      ssl: { rejectUnauthorized: false },
      fetch_types: false,
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
});

// Proxy dinamis agar tidak melakukan inisialisasi koneksi soket di level modul saat cold start Cloudflare Workers
export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_, prop) {
    const instance = getDb();
    const val = (instance as any)[prop];
    return typeof val === 'function' ? val.bind(instance) : val;
  }
});

