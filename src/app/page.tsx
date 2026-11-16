'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/components/LanguageContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { lang, setLang, t } = useLanguage();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error || 'Не удалось войти.');
        return;
      }
      toast.success(`Добро пожаловать, ${payload.user.name}!`);
      router.replace(payload.user.role === 'manager' ? '/manager' : '/mechanic');
      router.refresh();
    } catch {
      setError('Не удалось связаться с сервером. Попробуйте ещё раз.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ position: 'absolute', top: '2rem', right: '2rem' }} className="lang-selector">
        <button className={`lang-btn ${lang === 'en' ? 'active' : ''}`} onClick={() => setLang('en')}>EN</button>
        <button className={`lang-btn ${lang === 'ky' ? 'active' : ''}`} onClick={() => setLang('ky')}>KY</button>
        <button className={`lang-btn ${lang === 'ru' ? 'active' : ''}`} onClick={() => setLang('ru')}>RU</button>
      </div>
      <div className="glass animate-slide-up" style={{ padding: '3rem', width: '100%', maxWidth: '420px' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
          <span className="nav-brand">AutoFlow</span> CRM
        </h1>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2rem' }}>Управление автосервисом</p>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" autoComplete="username" className="form-input" value={email} onChange={e => setEmail(e.target.value)} required maxLength={254} />
          </div>
          <div className="form-group">
            <label className="form-label">{t.password}</label>
            <input type="password" autoComplete="current-password" className="form-input" value={password} onChange={e => setPassword(e.target.value)} required maxLength={200} />
          </div>
          {error && <div role="alert" style={{ color: '#f87171', fontSize: '0.9rem', marginTop: '0.5rem', padding: '0.75rem', background: 'rgba(239,68,68,0.1)', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)' }}>{error}</div>}
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Входим…' : t.signIn}
          </button>
        </form>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '1.5rem' }}>Доступ выдаёт администратор системы.</p>
      </div>
    </div>
  );
}
