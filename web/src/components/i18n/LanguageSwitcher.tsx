'use client';

import { useState, useRef, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { locales, type Locale } from '@/lib/i18n';
import { useTranslation } from './LanguageProvider';

export default function LanguageSwitcher() {
  const { locale, setLocale } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const current = locales.find((l) => l.code === locale) ?? locales[0];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
        aria-label="Change language"
      >
        <Globe className="h-4 w-4" />
        <span className="text-base leading-none">{current.flag}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 min-w-[140px] overflow-hidden rounded-xl border border-white/10 bg-primary/95 backdrop-blur-xl shadow-2xl">
          {locales.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => {
                if (l.code === 'pt-BR') {
                  setLocale(l.code);
                  setOpen(false);
                }
                // EN/ES — tradução em breve, não troca ainda
              }}
              disabled={l.code !== 'pt-BR'}
              className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors ${
                l.code !== 'pt-BR'
                  ? 'cursor-not-allowed opacity-50'
                  : locale === l.code
                    ? 'bg-white/10 text-white font-semibold'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="text-base leading-none">{l.flag}</span>
              <span>{l.label}</span>
              {l.code !== 'pt-BR' && (
                <span className="ml-auto text-[10px] font-medium uppercase tracking-wide text-white/40">
                  Em breve
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
