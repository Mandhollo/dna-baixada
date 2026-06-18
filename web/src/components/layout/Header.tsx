'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Menu, LogOut, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import MobileNav from './MobileNav';
import LanguageSwitcher from '@/components/i18n/LanguageSwitcher';
import NotificationBell from '@/components/notifications/NotificationBell';
import { useTranslation } from '@/components/i18n/LanguageProvider';
import { useAuth } from '@/components/auth/AuthProvider';

const navKeys = [
  { key: 'nav.inicio', href: '/' },
  { key: 'nav.corridas', href: '/corrida/solicitar' },
  { key: 'nav.turismo', href: '/turismo' },
  { key: 'nav.parceiros', href: '/parceiros' },
  { key: 'nav.social', href: '/social' },
  { key: 'nav.recompensas', href: '/recompensas' },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useTranslation();
  const { user, profile, signOut } = useAuth();
  const isLoggedIn = !!user;

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }}
        className="sticky top-0 z-50 w-full border-b border-white/10 bg-primary/70 backdrop-blur-xl supports-[backdrop-filter]:bg-primary/60"
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1 select-none">
            <span className="text-2xl font-extrabold tracking-tight text-accent">
              DNA
            </span>
            <span className="text-2xl font-semibold tracking-tight text-white">
              Baixada
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {navKeys.map((link) => (
              <Link
                key={link.key}
                href={link.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              >
                {t(link.key)}
              </Link>
            ))}
            <LanguageSwitcher />
            {isLoggedIn && <NotificationBell />}

            {isLoggedIn ? (
              <div className="ml-3 flex items-center gap-2">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-4 py-2 text-sm font-bold text-white shadow-lg shadow-secondary/25 transition-all hover:bg-secondary-dark hover:shadow-secondary/40"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  {profile?.nome?.split(' ')[0] || 'Painel'}
                </Link>
                <button
                  onClick={signOut}
                  className="inline-flex items-center justify-center rounded-full p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                  title="Sair"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/entrar"
                className="ml-3 inline-flex items-center rounded-full bg-accent px-5 py-2 text-sm font-bold text-primary shadow-lg shadow-accent/25 transition-all hover:bg-accent-dark hover:shadow-accent/40"
              >
                {t('common.entrar')}
              </Link>
            )}
          </nav>

          {/* Mobile: language + hamburger */}
          <div className="flex items-center gap-1 md:hidden">
            {isLoggedIn && <NotificationBell />}
            <LanguageSwitcher />
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="inline-flex items-center justify-center rounded-lg p-2 text-white transition-colors hover:bg-white/10"
              aria-label="Abrir menu"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </motion.header>

      <MobileNav isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}
