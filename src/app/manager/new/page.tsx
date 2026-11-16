import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import NewOrderClient from './NewOrderClient';

export const dynamic = 'force-dynamic';

export default async function NewOrderPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/');
  if (user.role !== 'manager') redirect('/mechanic');
  return <NewOrderClient />;
}
