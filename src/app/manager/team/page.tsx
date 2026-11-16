import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getStaff } from '@/lib/actions';
import TeamClient from './TeamClient';

export const dynamic = 'force-dynamic';

export default async function TeamPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/');
  if (user.role !== 'manager') redirect('/mechanic');

  const staff = await getStaff();
  return <TeamClient initialStaff={staff} />;
}
