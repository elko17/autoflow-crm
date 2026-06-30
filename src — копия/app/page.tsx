'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/components/LanguageContext';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const { lang, setLang, t } = useLanguage();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'manager') router.push('/manager');
    else if (username.startsWith('mechanic')) router.push('/mechanic');
    else alert('Invalid credentials for prototype. Use manager or mechanic1');
  };

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      
      <div style={{ position: 'absolute', top: '2rem', right: '2rem' }} className="lang-selector">
        <button className={`lang-btn ${lang === 'en' ? 'active' : ''}`} onClick={() => setLang('en')}>EN</button>
        <button className={`lang-btn ${lang === 'ky' ? 'active' : ''}`} onClick={() => setLang('ky')}>KY</button>
        <button className={`lang-btn ${lang === 'ru' ? 'active' : ''}`} onClick={() => setLang('ru')}>RU</button>
      </div>

      <div className="glass animate-slide-up" style={{ padding: '3rem', width: '100%', maxWidth: '400px' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <span className="nav-brand">AutoFlow</span> CRM
        </h1>
        
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">{t.username}</label>
            <input 
              type="text" 
              className="form-input" 
              value={username} 
              onChange={e => setUsername(e.target.value)}
              required 
            />
          </div>
          <div className="form-group">
            <label className="form-label">{t.password}</label>
            <input 
              type="password" 
              className="form-input" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              required 
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
            {t.signIn}
          </button>
        </form>
      </div>
    </div>
  );
}
