'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { type Locale, getTranslations } from '@/lib/i18n';

const STORAGE_KEY = 'dna_baixada_lang';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

function detectLocale(): Locale {
  if (typeof window === 'undefined') return 'pt-BR';

  // 1. Check localStorage — user's explicit choice takes priority
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'pt-BR' || saved === 'en-US' || saved === 'es-ES') return saved;
  } catch {
    // Ignore
  }

  // 2. Auto-detect from browser language
  try {
    const browserLang = navigator.language || (navigator as unknown as { userLanguage?: string }).userLanguage || '';
    const lang = browserLang.toLowerCase();
    if (lang.startsWith('en')) return 'en-US';
    if (lang.startsWith('es')) return 'es-ES';
  } catch {
    // Ignore
  }

  return 'pt-BR';
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('pt-BR');

  useEffect(() => {
    setLocaleState(detectLocale());
  }, []);

  // Keep <html lang="..."> in sync with selected locale for SEO and a11y
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem(STORAGE_KEY, newLocale);
    } catch {
      // Ignore
    }
  }, []);

  const translations = useMemo(() => getTranslations(locale), [locale]);

  const t = useCallback(
    (key: string): string => translations[key] ?? key,
    [translations],
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation(): I18nContextType {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}
