'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { dictionaries, Language } from '../lib/dictionaries';

type LanguageContextType = {
  lang: Language;
  setLang: (lang: Language) => void;
  t: typeof dictionaries['en'];
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [lang, setLang] = useState<Language>('ru');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('app_lang') as Language;
    if (saved && dictionaries[saved]) {
      setLang(saved);
    }
  }, []);

  const handleSetLang = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('app_lang', newLang);
  };

  // Avoid hydration mismatch by waiting until mounted before rendering context values that depend on localstorage
  if (!mounted) {
    return (
      <LanguageContext.Provider value={{ lang: 'ru', setLang: handleSetLang, t: dictionaries['ru'] }}>
        <div style={{ visibility: 'hidden' }}>{children}</div>
      </LanguageContext.Provider>
    );
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang: handleSetLang, t: dictionaries[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
};
