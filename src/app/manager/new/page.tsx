'use client';
import { useLanguage } from '@/components/LanguageContext';
import Navbar from '@/components/Navbar';
import { createOrder, getMechanics } from '@/lib/actions';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function NewOrderPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [mechanics, setMechanics] = useState<any[]>([]);

  useEffect(() => {
    getMechanics().then(setMechanics);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await createOrder(formData);
    router.push('/manager');
  };

  return (
    <div className="page-wrapper animate-fade-in" style={{ opacity: 1 }}>
      <Navbar title={t.createOrder} />
      
      <main className="container" style={{ maxWidth: '600px' }}>
        <div className="glass animate-slide-up" style={{ padding: '2rem' }}>
          <h2 style={{ marginBottom: '2rem' }}>{t.createOrder}</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">{t.client}</label>
              <input type="text" name="clientName" className="form-input" required />
            </div>
            <div className="form-group">
              <label className="form-label">{t.phone}</label>
              <input type="text" name="phone" className="form-input" required />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">{t.brand}</label>
                <input type="text" name="brand" className="form-input" required />
              </div>
              <div className="form-group">
                <label className="form-label">{t.model}</label>
                <input type="text" name="model" className="form-input" required />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">{t.plate}</label>
              <input type="text" name="plate" className="form-input" required />
            </div>
            
            <div className="form-group">
              <label className="form-label">{t.problem}</label>
              <textarea name="problem" className="form-input" rows={3} required style={{ resize: 'vertical' }}></textarea>
            </div>
            
            <div className="form-group">
              <label className="form-label">{t.price} ({t.som})</label>
              <input type="number" name="price" className="form-input" required />
            </div>

            <div className="form-group">
              <label className="form-label">{t.mechanic}</label>
              <select name="mechanicId" className="form-select" required>
                <option value="">-- Выберите механика --</option>
                {mechanics.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => router.push('/manager')} style={{ flex: 1 }}>
                Назад
              </button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                {t.createOrder}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
