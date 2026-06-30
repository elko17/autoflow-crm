'use client';
import { useLanguage } from '@/components/LanguageContext';
import Navbar from '@/components/Navbar';
import { useState } from 'react';
import { updateOrderStatus } from '@/lib/actions';
import toast from 'react-hot-toast';

export default function MechanicClient({ initialOrders }: { initialOrders: any[] }) {
  const { t } = useLanguage();
  const [orders, setOrders] = useState(initialOrders);

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'new': return <span className="badge badge-new">{t.statusNew}</span>;
      case 'in_progress': return <span className="badge badge-in_progress">{t.statusInProgress}</span>;
      case 'done': return <span className="badge badge-done">{t.statusDone}</span>;
      default: return status;
    }
  };

  const handleChangeStatus = async (orderId: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'new' ? 'in_progress' : currentStatus === 'in_progress' ? 'done' : 'new';
    setOrders(orders.map(o => o.id === orderId ? { ...o, status: nextStatus } : o));
    await updateOrderStatus(orderId, nextStatus);
    toast.success('Статус обновлен!');
  };

  return (
    <div className="page-wrapper animate-fade-in" style={{ opacity: 1 }}>
      <Navbar title={t.mechanicDashboard} />
      
      <main className="container">
        <h2 style={{ marginBottom: '2rem' }}>{t.orders}</h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {orders.map((order, i) => (
            <div key={order.id} className={`glass animate-slide-up`} style={{ padding: '1.5rem', animationDelay: `${(i % 3 + 1) * 100}ms` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>#{order.id}</span>
                {getStatusBadge(order.status)}
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{t.car}</div>
                <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{order.brand} {order.model}</div>
                <div style={{ fontFamily: 'monospace', color: 'var(--primary)', background: 'rgba(59,130,246,0.1)', display: 'inline-block', padding: '0.2rem 0.5rem', borderRadius: '4px', marginTop: '0.25rem' }}>{order.plate}</div>
              </div>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{t.problem}</div>
                <p>{order.problem}</p>
              </div>

              <button 
                className={`btn ${order.status === 'done' ? 'btn-secondary' : order.status === 'new' ? 'btn-primary' : 'btn-success'}`}
                style={{ width: '100%' }}
                onClick={() => handleChangeStatus(order.id, order.status)}
              >
                {t.changeStatus}
              </button>
            </div>
          ))}
          {orders.length === 0 && (
            <div style={{ color: 'var(--text-muted)' }}>Нет заказов</div>
          )}
        </div>
      </main>
    </div>
  );
}
