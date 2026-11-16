import { getMechanicOrders } from '@/lib/actions';
import MechanicClient from './MechanicClient';

// Orders are scoped to the signed-in mechanic on the server.
export default async function MechanicPage() {
  const orders = await getMechanicOrders();
  return <MechanicClient initialOrders={orders} />;
}
