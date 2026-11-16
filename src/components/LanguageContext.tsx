'use client';
import React, { createContext, useContext, useSyncExternalStore } from 'react';
import { dictionaries, Language } from '../lib/dictionaries';

type LanguageContextType = {
  lang: Language;
  setLang: (lang: Language) => void;
  t: typeof dictionaries['en'];
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);
const LANGUAGE_EVENT = 'autoflow-language-change';

function subscribeToLanguage(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener(LANGUAGE_EVENT, callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(LANGUAGE_EVENT, callback);
  };
}

function getStoredLanguage(): Language {
  const saved = window.localStorage.getItem('app_lang') as Language | null;
  return saved && saved in dictionaries ? saved : 'ru';
}

function getServerLanguage(): Language {
  return 'ru';
}

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const lang = useSyncExternalStore(subscribeToLanguage, getStoredLanguage, getServerLanguage);

  const handleSetLang = (newLang: Language) => {
    window.localStorage.setItem('app_lang', newLang);
    window.dispatchEvent(new Event(LANGUAGE_EVENT));
  };

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
