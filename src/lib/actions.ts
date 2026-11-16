'use server';

import { db } from './db';
import { requireRole } from './auth';

export async function getOrders() {
  await requireRole('manager');
  return db.orders.map((o: any) => {
    const client = db.clients.find((c: any) => c.id === o.client_id);
    const car = db.cars.find((c: any) => c.id === o.car_id);
    const mechanic = db.users.find((u: any) => u.id === o.mechanic_id);
    return {
      ...o,
      clientName: client?.name,
      phone: client?.phone,
      brand: car?.brand,
      model: car?.model,
      plate: car?.plate,
      mechanicName: mechanic?.name
    };
  }).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function getMechanicOrders() {
  const user = await requireRole('mechanic');
  const legacyUser = db.users.find((u: any) => u.username === user.username && u.role === 'mechanic');
  if (!legacyUser) return [];
  const orders = db.orders.filter((o: any) => o.mechanic_id === legacyUser.id);
  return orders.map((o: any) => {
    const client = db.clients.find((c: any) => c.id === o.client_id);
    const car = db.cars.find((c: any) => c.id === o.car_id);
    return { ...o, clientName: client?.name, phone: client?.phone, brand: car?.brand, model: car?.model, plate: car?.plate };
  }).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function updateOrderStatus(orderId: number, status: string) {
  if (!Number.isInteger(orderId) || !['new', 'in_progress', 'done'].includes(status)) throw new Error('INVALID_INPUT');
  const user = await requireRole('mechanic');
  const legacyUser = db.users.find((u: any) => u.username === user.username && u.role === 'mechanic');
  const order = db.orders.find((o: any) => o.id === orderId);
  if (!legacyUser || !order || order.mechanic_id !== legacyUser.id) throw new Error('FORBIDDEN');
  order.status = status;
}

export async function getMechanics() {
  await requireRole('manager');
  return db.users.filter((u: any) => u.role === 'mechanic');
}

export async function deleteOrder(orderId: number) {
  await requireRole('manager');
  if (!Number.isInteger(orderId)) throw new Error('INVALID_INPUT');
  db.orders = db.orders.filter((o: any) => o.id !== orderId);
}

export async function createOrder(data: FormData) {
  await requireRole('manager');
  const phone = String(data.get('phone') ?? '').trim();
  const clientName = String(data.get('clientName') ?? '').trim();
  const brand = String(data.get('brand') ?? '').trim();
  const model = String(data.get('model') ?? '').trim();
  const plate = String(data.get('plate') ?? '').trim();
  const problem = String(data.get('problem') ?? '').trim();
  const price = Number(data.get('price'));
  const mechanicValue = data.get('mechanicId');
  const mechanicId = mechanicValue ? Number(mechanicValue) : null;
  if (!clientName || !phone || !brand || !model || !plate || !problem ||
      clientName.length > 120 || phone.length > 30 || brand.length > 80 ||
      model.length > 80 || plate.length > 20 || problem.length > 2000 ||
      !Number.isFinite(price) || price < 0 || price > 100_000_000 ||
      (mechanicId !== null && (!Number.isInteger(mechanicId) || !db.users.some((u: any) => u.id === mechanicId && u.role === 'mechanic')))) {
    throw new Error('INVALID_INPUT');
  }

  db.lastClientId++;
  const clientId = db.lastClientId;
  db.clients.push({ id: clientId, name: clientName, phone });
  db.lastCarId++;
  const carId = db.lastCarId;
  db.cars.push({ id: carId, client_id: clientId, brand, model, plate });
  db.lastOrderId++;
  db.orders.push({
    id: db.lastOrderId, client_id: clientId, car_id: carId, mechanic_id: mechanicId,
    problem, status: 'new', price, created_at: new Date().toISOString()
  });
}
