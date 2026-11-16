import 'server-only';
import { Pool, type QueryResultRow } from 'pg';

declare global {
  // eslint-disable-next-line no-var
  var __authPool: Pool | undefined;
  // eslint-disable-next-line no-var
  var __authSchemaPromise: Promise<void> | undefined;
}

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS auth_users (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(40) NOT NULL UNIQUE,
  email VARCHAR(254) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('manager', 'mechanic')),
  full_name VARCHAR(120) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  token_hash CHAR(64) PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS auth_sessions_user_id_idx ON auth_sessions(user_id);
CREATE INDEX IF NOT EXISTS auth_sessions_expires_at_idx ON auth_sessions(expires_at);

CREATE TABLE IF NOT EXISTS auth_login_attempts (
  fingerprint CHAR(64) PRIMARY KEY,
  attempts INTEGER NOT NULL DEFAULT 0,
  window_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_clients (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_cars (
  id BIGSERIAL PRIMARY KEY,
  client_id BIGINT NOT NULL REFERENCES crm_clients(id) ON DELETE CASCADE,
  brand VARCHAR(80) NOT NULL,
  model VARCHAR(80) NOT NULL,
  plate VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS crm_cars_plate_idx ON crm_cars(plate);

CREATE TABLE IF NOT EXISTS crm_orders (
  id BIGSERIAL PRIMARY KEY,
  client_id BIGINT NOT NULL REFERENCES crm_clients(id) ON DELETE RESTRICT,
  car_id BIGINT NOT NULL REFERENCES crm_cars(id) ON DELETE RESTRICT,
  mechanic_id BIGINT REFERENCES auth_users(id) ON DELETE SET NULL,
  problem VARCHAR(2000) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'done')),
  price NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS crm_orders_created_at_idx ON crm_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS crm_orders_mechanic_status_idx ON crm_orders(mechanic_id, status);
`;

function getPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is required. See .env.example and docs/AUTH_SETUP.md.');
  }

  if (!global.__authPool) {
    global.__authPool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : undefined,
    });
  }
  return global.__authPool;
}

async function ensureSchema() {
  const pool = getPool();
  if (!global.__authSchemaPromise) {
    global.__authSchemaPromise = pool.query(SCHEMA_SQL).then(() => undefined).catch((error) => {
      global.__authSchemaPromise = undefined;
      throw error;
    });
  }
  await global.__authSchemaPromise;
}

export async function authQuery<T extends QueryResultRow = QueryResultRow>(text: string, values: unknown[] = []) {
  await ensureSchema();
  return getPool().query<T>(text, values);
}

export async function authTransaction<T>(work: (client: import('pg').PoolClient) => Promise<T>) {
  await ensureSchema();
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
