'use server';

import bcrypt from 'bcryptjs';
import { requireRole } from './auth';
import { authQuery, authTransaction } from './auth-db';

type OrderRow = {
  id: number;
  client_id: number;
  car_id: number;
  mechanic_id: number | null;
  problem: string;
  status: string;
  price: number;
  created_at: Date;
  clientName: string;
  phone: string;
  brand: string;
  model: string;
  plate: string;
  mechanicName: string | null;
};

export type StaffRow = {
  id: number;
  username: string;
  email: string;
  name: string;
  is_active: boolean;
  created_at: Date;
};

const ORDER_SELECT = `
  SELECT o.id, o.client_id, o.car_id, o.mechanic_id, o.problem, o.status,
         o.price::float8 AS price, o.created_at,
         c.name AS "clientName", c.phone,
         car.brand, car.model, car.plate,
         u.full_name AS "mechanicName"
  FROM crm_orders o
  JOIN crm_clients c ON c.id = o.client_id
  JOIN crm_cars car ON car.id = o.car_id
  LEFT JOIN auth_users u ON u.id = o.mechanic_id
`;

export async function getOrders(): Promise<OrderRow[]> {
  await requireRole('manager');
  const result = await authQuery<OrderRow>(ORDER_SELECT + ' ORDER BY o.created_at DESC');
  return result.rows;
}

export async function getMechanicOrders(): Promise<OrderRow[]> {
  const user = await requireRole('mechanic');
  const result = await authQuery<OrderRow>(ORDER_SELECT + ' WHERE o.mechanic_id = $1 ORDER BY o.created_at DESC', [user.id]);
  return result.rows;
}

export async function updateOrderStatus(orderId: number, status: string) {
  if (!Number.isInteger(orderId) || !['new', 'in_progress', 'done'].includes(status)) throw new Error('INVALID_INPUT');
  const user = await requireRole('mechanic');
  const result = await authQuery(
    'UPDATE crm_orders SET status = $1, updated_at = NOW() WHERE id = $2 AND mechanic_id = $3',
    [status, orderId, user.id],
  );
  if (result.rowCount !== 1) throw new Error('FORBIDDEN');
}

export async function getMechanics() {
  await requireRole('manager');
  const result = await authQuery(
    `SELECT id, username, role, full_name AS name
     FROM auth_users WHERE role = 'mechanic' AND is_active = TRUE ORDER BY full_name`,
  );
  return result.rows;
}

export async function getStaff(): Promise<StaffRow[]> {
  await requireRole('manager');
  const result = await authQuery<StaffRow>(
    `SELECT id, username, email, full_name AS name, is_active, created_at
     FROM auth_users WHERE role = 'mechanic' ORDER BY is_active DESC, full_name ASC`,
  );
  return result.rows;
}

export async function createMechanic(input: {
  username: string;
  email: string;
  fullName: string;
  password: string;
}) {
  await requireRole('manager');
  const username = String(input.username ?? '').trim().toLowerCase();
  const email = String(input.email ?? '').trim().toLowerCase();
  const fullName = String(input.fullName ?? '').trim();
  const password = String(input.password ?? '');

  if (!/^[a-z0-9_]{3,40}$/.test(username) ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 ||
      fullName.length < 2 || fullName.length > 120 ||
      password.length < 12 || password.length > 200) {
    throw new Error('INVALID_INPUT');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  try {
    await authQuery(
      `INSERT INTO auth_users (username, email, password_hash, role, full_name)
       VALUES ($1, $2, $3, 'mechanic', $4)`,
      [username, email, passwordHash, fullName],
    );
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
      throw new Error('USER_EXISTS');
    }
    throw error;
  }
}

export async function setMechanicActive(mechanicId: number, active: boolean) {
  await requireRole('manager');
  if (!Number.isInteger(mechanicId) || typeof active !== 'boolean') throw new Error('INVALID_INPUT');

  await authTransaction(async client => {
    const result = await client.query(
      `UPDATE auth_users SET is_active = $1, updated_at = NOW()
       WHERE id = $2 AND role = 'mechanic'`,
      [active, mechanicId],
    );
    if (result.rowCount !== 1) throw new Error('NOT_FOUND');
    if (!active) {
      await client.query('DELETE FROM auth_sessions WHERE user_id = $1', [mechanicId]);
    }
  });
}

export async function deleteOrder(orderId: number) {
  await requireRole('manager');
  if (!Number.isInteger(orderId)) throw new Error('INVALID_INPUT');
  await authQuery('DELETE FROM crm_orders WHERE id = $1', [orderId]);
}

export async function createOrder(data: FormData) {
  await requireRole('manager');
  const phone = String(data.get('phone') ?? '').trim();
  const clientName = String(data.get('clientName') ?? '').trim();
  const brand = String(data.get('brand') ?? '').trim();
  const model = String(data.get('model') ?? '').trim();
  const plate = String(data.get('plate') ?? '').trim().toUpperCase();
  const problem = String(data.get('problem') ?? '').trim();
  const price = Number(data.get('price'));
  const mechanicValue = data.get('mechanicId');
  const mechanicId = mechanicValue ? Number(mechanicValue) : null;

  if (!clientName || !phone || !brand || !model || !plate || !problem ||
      clientName.length > 120 || phone.length > 30 || brand.length > 80 ||
      model.length > 80 || plate.length > 20 || problem.length > 2000 ||
      !Number.isFinite(price) || price < 0 || price > 100_000_000 ||
      (mechanicId !== null && !Number.isInteger(mechanicId))) {
    throw new Error('INVALID_INPUT');
  }

  await authTransaction(async client => {
    if (mechanicId !== null) {
      const mechanic = await client.query(
        `SELECT id FROM auth_users WHERE id = $1 AND role = 'mechanic' AND is_active = TRUE`,
        [mechanicId],
      );
      if (!mechanic.rowCount) throw new Error('INVALID_MECHANIC');
    }
    const clientResult = await client.query(
      'INSERT INTO crm_clients (name, phone) VALUES ($1, $2) RETURNING id',
      [clientName, phone],
    );
    const carResult = await client.query(
      'INSERT INTO crm_cars (client_id, brand, model, plate) VALUES ($1, $2, $3, $4) RETURNING id',
      [clientResult.rows[0].id, brand, model, plate],
    );
    await client.query(
      `INSERT INTO crm_orders (client_id, car_id, mechanic_id, problem, status, price)
       VALUES ($1, $2, $3, $4, 'new', $5)`,
      [clientResult.rows[0].id, carResult.rows[0].id, mechanicId, problem, price],
    );
  });
}
