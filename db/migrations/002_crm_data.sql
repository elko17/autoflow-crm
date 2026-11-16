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
