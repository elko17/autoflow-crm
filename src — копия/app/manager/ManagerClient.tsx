'use client';
import { useLanguage } from '@/components/LanguageContext';
import Navbar from '@/components/Navbar';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { deleteOrder } from '@/lib/actions';
import { Search, Plus, Trash2, Printer } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ManagerClient({ initialOrders }: { initialOrders: any[] }) {
  const { t } = useLanguage();
  const router = useRouter();
  const [orders, setOrders] = useState(initialOrders);
  const [searchTerm, setSearchTerm] = useState('');

  const handleDelete = async (id: number) => {
    if (confirm('Вы уверены, что хотите удалить заказ?')) {
      setOrders(orders.filter(o => o.id !== id));
      await deleteOrder(id);
      toast.success(t.delete + ' ✅');
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(o => 
      o.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      o.plate?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [orders, searchTerm]);

  const stats = useMemo(() => {
    const total = orders.length;
    const inProgress = orders.filter(o => o.status === 'in_progress').length;
    const done = orders.filter(o => o.status === 'done').length;
    const revenue = orders.filter(o => o.status === 'done').reduce((acc, o) => acc + (o.price || 0), 0);
    return { total, inProgress, done, revenue };
  }, [orders]);

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'new': return <span className="badge badge-new">{t.statusNew}</span>;
      case 'in_progress': return <span className="badge badge-in_progress">{t.statusInProgress}</span>;
      case 'done': return <span className="badge badge-done">{t.statusDone}</span>;
      default: return status;
    }
  };

  const handlePrint = (order: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Чек #${order.id}</title>
          <style>
            body { font-family: sans-serif; padding: 2rem; color: #333; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 1rem; margin-bottom: 2rem; }
            .row { display: flex; justify-content: space-between; margin-bottom: 1rem; border-bottom: 1px dashed #ccc; padding-bottom: 0.5rem; }
            .total { font-size: 1.5rem; font-weight: bold; margin-top: 2rem; text-align: right; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>AutoFlow CRM</h1>
            <p>Квитанция к заказу #${order.id}</p>
          </div>
          <div class="row"><span>Клиент:</span> <span>${order.clientName} (${order.phone})</span></div>
          <div class="row"><span>Автомобиль:</span> <span>${order.brand} ${order.model} [${order.plate}]</span></div>
          <div class="row"><span>Проблема:</span> <span>${order.problem}</span></div>
          <div class="row"><span>Механик:</span> <span>${order.mechanicName || '—'}</span></div>
          <div class="total">Итого: ${order.price} ${t.som}</div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
    toast.success('Отправлено на печать 🖨️');
  };

  return (
    <div className="page-wrapper animate-fade-in" style={{ opacity: 1 }}>
      <Navbar title={t.managerDashboard} />
      
      <main className="container">
        
        {/* STATS ROW */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div className="glass animate-slide-up" style={{ padding: '1.5rem', textAlign: 'center', animationDelay: '100ms' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>{stats.total}</div>
            <div style={{ color: 'var(--text-muted)' }}>{t.orders}</div>
          </div>
          <div className="glass animate-slide-up" style={{ padding: '1.5rem', textAlign: 'center', animationDelay: '200ms' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#eab308' }}>{stats.inProgress}</div>
            <div style={{ color: 'var(--text-muted)' }}>{t.statusInProgress}</div>
          </div>
          <div className="glass animate-slide-up" style={{ padding: '1.5rem', textAlign: 'center', animationDelay: '300ms' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--success)' }}>{stats.done}</div>
            <div style={{ color: 'var(--text-muted)' }}>{t.statusDone}</div>
          </div>
          <div className="glass animate-slide-up" style={{ padding: '1.5rem', textAlign: 'center', animationDelay: '400ms' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>{stats.revenue} <span style={{fontSize:'1rem'}}>{t.som}</span></div>
            <div style={{ color: 'var(--text-muted)' }}>Выручка</div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2>{t.orders}</h2>
          
          <div style={{ display: 'flex', gap: '1rem', flex: 1, justifyContent: 'flex-end', minWidth: '300px' }}>
            <div style={{ position: 'relative', maxWidth: '300px', width: '100%' }}>
              <Search style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} size={20} />
              <input 
                type="text" 
                placeholder="Поиск..." 
                className="form-input" 
                style={{ paddingLeft: '40px' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }} onClick={() => router.push('/manager/new')}>
              <Plus size={20} />
              {t.createOrder}
            </button>
          </div>
        </div>

        <div className="glass table-container animate-slide-up" style={{ animationDelay: '500ms' }}>
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>{t.client} / {t.phone}</th>
                <th>{t.car}</th>
                <th>{t.problem}</th>
                <th>{t.mechanic}</th>
                <th>{t.price}</th>
                <th>{t.status}</th>
                <th>{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td>#{order.id}</td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{order.clientName}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{order.phone}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{order.brand} {order.model}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{order.plate}</div>
                  </td>
                  <td>{order.problem}</td>
                  <td>{order.mechanicName || '—'}</td>
                  <td style={{ fontWeight: 600 }}>{order.price} {t.som}</td>
                  <td>{getStatusBadge(order.status)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {order.status === 'done' && (
                        <button className="btn" style={{ padding: '0.4rem', background: 'var(--success)', color: 'white' }} onClick={() => handlePrint(order)} title="Печать">
                          <Printer size={16} />
                        </button>
                      )}
                      <button className="btn btn-danger" style={{ padding: '0.4rem', background: 'var(--danger)' }} onClick={() => handleDelete(order.id)} title={t.delete}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Нет заказов</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
