import { getMechanicOrders } from '@/lib/actions';
import MechanicClient from './MechanicClient';

// For prototype we hardcode mechanicId = 2 (Нурлан, see setup-db.mjs)
export default async function MechanicPage() {
  const mechanicId = 2; // mechanic1 in setup
  const orders = await getMechanicOrders(mechanicId);
  return <MechanicClient initialOrders={orders} />;
}
