'use server';
import { db } from './db';

export async function getOrders() {
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

export async function getMechanicOrders(mechanicId: number) {
  const orders = await getOrders();
  return orders.filter((o: any) => o.mechanic_id === mechanicId);
}

export async function updateOrderStatus(orderId: number, status: string) {
  const order = db.orders.find((o: any) => o.id === orderId);
  if (order) order.status = status;
}

export async function getMechanics() {
  return db.users.filter((u: any) => u.role === 'mechanic');
}

export async function deleteOrder(orderId: number) {
  db.orders = db.orders.filter((o: any) => o.id !== orderId);
}

export async function createOrder(data: FormData) {
  const phone = data.get('phone') as string;
  const clientName = data.get('clientName') as string;
  const brand = data.get('brand') as string;
  const model = data.get('model') as string;
  const plate = data.get('plate') as string;
  const problem = data.get('problem') as string;
  const price = Number(data.get('price')) || 0;
  const mechanicId = data.get('mechanicId') ? Number(data.get('mechanicId')) : null;

  db.lastClientId++;
  const clientId = db.lastClientId;
  db.clients.push({ id: clientId, name: clientName, phone });

  db.lastCarId++;
  const carId = db.lastCarId;
  db.cars.push({ id: carId, client_id: clientId, brand, model, plate });

  db.lastOrderId++;
  const orderId = db.lastOrderId;
  db.orders.push({
    id: orderId,
    client_id: clientId,
    car_id: carId,
    mechanic_id: mechanicId,
    problem,
    status: 'new',
    price,
    created_at: new Date().toISOString()
  });
}
