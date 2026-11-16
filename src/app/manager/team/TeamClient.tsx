'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, UserPlus, UserX, UserCheck, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import { createMechanic, setMechanicActive, type StaffRow } from '@/lib/actions';

export default function TeamClient({ initialStaff }: { initialStaff: StaffRow[] }) {
  const router = useRouter();
  const [staff, setStaff] = useState(initialStaff);
  const [loading, setLoading] = useState(false);
  const [changingId, setChangingId] = useState<number | null>(null);

  useEffect(() => {
    setStaff(initialStaff);
  }, [initialStaff]);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    setLoading(true);

    try {
      await createMechanic({
        username: String(data.get('username') ?? ''),
        email: String(data.get('email') ?? ''),
        fullName: String(data.get('fullName') ?? ''),
        password: String(data.get('password') ?? ''),
      });
      form.reset();
      toast.success('Аккаунт механика создан');
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (message.includes('USER_EXISTS')) {
        toast.error('Такой логин или email уже используется');
      } else if (message.includes('INVALID_INPUT')) {
        toast.error('Проверьте поля. Пароль должен быть не короче 12 символов');
      } else {
        toast.error('Не удалось создать аккаунт');
      }
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(member: StaffRow) {
    const nextActive = !member.is_active;
    const question = nextActive
      ? 'Восстановить доступ этому механику?'
      : 'Отключить доступ этому механику? Его прошлые заказы сохранятся.';
    if (!window.confirm(question)) return;

    setChangingId(member.id);
    try {
      await setMechanicActive(member.id, nextActive);
      setStaff(current => current.map(item =>
        item.id === member.id ? { ...item, is_active: nextActive } : item
      ));
      toast.success(nextActive ? 'Доступ восстановлен' : 'Доступ отключён');
      router.refresh();
    } catch {
      toast.error('Не удалось изменить доступ');
    } finally {
      setChangingId(null);
    }
  }

  return (
    <div className="page-wrapper animate-fade-in" style={{ opacity: 1 }}>
      <Navbar title="Сотрудники" />
      <main className="container" style={{ maxWidth: '1000px' }}>
        <button className="btn btn-secondary" onClick={() => router.push('/manager')} style={{ marginBottom: '1.5rem', gap: '0.5rem' }}>
          <ArrowLeft size={18} /> Назад к заказам
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '1.5rem', alignItems: 'start' }}>
          <section className="glass" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <UserPlus size={22} color="var(--primary)" />
              <h2 style={{ margin: 0 }}>Добавить механика</h2>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label" htmlFor="staff-name">ФИО</label>
                <input id="staff-name" name="fullName" className="form-input" required minLength={2} maxLength={120} autoComplete="name" />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="staff-username">Логин</label>
                <input id="staff-username" name="username" className="form-input" required minLength={3} maxLength={40} pattern="[A-Za-z0-9_]+" autoComplete="username" />
                <small style={{ color: 'var(--text-muted)' }}>Только латинские буквы, цифры и _</small>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="staff-email">Email</label>
                <input id="staff-email" name="email" type="email" className="form-input" required maxLength={254} autoComplete="email" />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="staff-password">Временный пароль</label>
                <input id="staff-password" name="password" type="password" className="form-input" required minLength={12} maxLength={200} autoComplete="new-password" />
                <small style={{ color: 'var(--text-muted)' }}>Минимум 12 символов. Передайте пароль сотруднику безопасным способом.</small>
              </div>
              <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', gap: '0.5rem', opacity: loading ? 0.7 : 1 }}>
                <UserPlus size={18} /> {loading ? 'Создаём…' : 'Создать аккаунт'}
              </button>
            </form>
          </section>

          <section className="glass" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <Users size={22} color="var(--primary)" />
              <h2 style={{ margin: 0 }}>Команда ({staff.length})</h2>
            </div>
            {staff.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>Сотрудников пока нет. Добавьте первого механика.</p>
            ) : (
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {staff.map(member => (
                  <div key={member.id} style={{ padding: '1rem', border: '1px solid var(--glass-border)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600 }}>{member.name}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', overflowWrap: 'anywhere' }}>{member.email}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>@{member.username}</div>
                      <span className={member.is_active ? 'badge badge-done' : 'badge'} style={!member.is_active ? { background: 'rgba(148,163,184,0.18)', color: 'var(--text-muted)' } : undefined}>
                        {member.is_active ? 'Активен' : 'Отключён'}
                      </span>
                    </div>
                    <button
                      className={member.is_active ? 'btn btn-danger' : 'btn btn-secondary'}
                      style={{ padding: '0.55rem', flexShrink: 0, background: member.is_active ? 'var(--danger)' : undefined }}
                      title={member.is_active ? 'Отключить доступ' : 'Восстановить доступ'}
                      disabled={changingId === member.id}
                      onClick={() => toggleActive(member)}
                    >
                      {member.is_active ? <UserX size={18} /> : <UserCheck size={18} />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
