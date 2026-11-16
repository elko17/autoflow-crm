import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getMechanicOrders } from '@/lib/actions';
import MechanicClient from './MechanicClient';

export const dynamic = 'force-dynamic';

export default async function MechanicPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/');
  if (user.role !== 'mechanic') redirect('/manager');
  const orders = await getMechanicOrders();
  return <MechanicClient initialOrders={orders} />;
}
