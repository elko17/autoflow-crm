import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getOrders } from '@/lib/actions';
import ManagerClient from './ManagerClient';

export const dynamic = 'force-dynamic';

export default async function ManagerPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/');
  if (user.role !== 'manager') redirect('/mechanic');
  const orders = await getOrders();
  return <ManagerClient initialOrders={orders} />;
}
