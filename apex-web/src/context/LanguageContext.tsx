'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { dict } from '@/lib/dictionary';

export type Lang = 'ar' | 'en';
export type Dictionary = typeof dict.ar;

interface LangContextProps {
  lang: Lang;
  toggleLang: () => void;
  t: Dictionary;
}

const LangContext = createContext<LangContextProps | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('ar');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Sync document direction and language for global css targeting
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  const toggleLang = () => setLang((prev) => (prev === 'ar' ? 'en' : 'ar'));

  return (
    <LangContext.Provider value={{ lang, toggleLang, t: dict[lang] }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LangContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
};
