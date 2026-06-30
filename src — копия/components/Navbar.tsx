'use client';
import { useLanguage } from './LanguageContext';
import { useRouter } from 'next/navigation';

export default function Navbar({ title }: { title?: string }) {
  const { lang, setLang, t } = useLanguage();
  const router = useRouter();

  return (
    <nav className="navbar glass animate-fade-in">
      <div className="nav-brand">AutoFlow {title && <span style={{fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)'}}>| {title}</span>}</div>
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        <div className="lang-selector">
          <button className={`lang-btn ${lang === 'en' ? 'active' : ''}`} onClick={() => setLang('en')}>EN</button>
          <button className={`lang-btn ${lang === 'ky' ? 'active' : ''}`} onClick={() => setLang('ky')}>KY</button>
          <button className={`lang-btn ${lang === 'ru' ? 'active' : ''}`} onClick={() => setLang('ru')}>RU</button>
        </div>
        <button className="btn btn-secondary" onClick={() => router.push('/')} style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}>
          {t.logout}
        </button>
      </div>
    </nav>
  );
}
