import { getOrders } from '@/lib/actions';
import ManagerClient from './ManagerClient';

export default async function ManagerPage() {
  const orders = await getOrders();
  return <ManagerClient initialOrders={orders} />;
}
