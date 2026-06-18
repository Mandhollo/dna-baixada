'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X, LogOut, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/components/i18n/LanguageProvider';
import { useAuth } from '@/components/auth/AuthProvider';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

const navKeys = [
  { key: 'nav.inicio', href: '/' },
  { key: 'nav.solicitar_corrida', href: '/corrida/solicitar' },
  { key: 'nav.turismo', href: '/turismo' },
  { key: 'nav.parceiros', href: '/parceiros' },
  { key: 'nav.social', href: '/social' },
  { key: 'nav.recompensas', href: '/recompensas' },
  { key: 'nav.sobre', href: '/sobre' },
  { key: 'nav.ajuda', href: '/ajuda' },
];

export default function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const { t } = useTranslation();
  const { user, profile, signOut } = useAuth();
  const isLoggedIn = !!user;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.nav
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring' as const, damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 z-[60] flex h-full w-full max-w-xs flex-col bg-primary shadow-2xl"
          >
            {/* Close button */}
            <div className="flex h-16 items-center justify-end px-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Fechar menu"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* User greeting if logged in */}
            {isLoggedIn && (
              <div className="mx-4 mb-3 rounded-xl bg-white/10 px-4 py-3">
                <p className="text-sm text-white/60">Olá,</p>
                <p className="text-base font-bold text-white">{profile?.nome?.split(' ')[0] || 'Usuário'}</p>
              </div>
            )}

            {/* Links */}
            <div className="flex flex-1 flex-col gap-1 px-4 overflow-y-auto">
              {navKeys.map((link, index) => (
                <motion.div
                  key={link.key}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: 0.08 + index * 0.05,
                    duration: 0.35,
                    ease: [0.22, 1, 0.36, 1] as const,
                  }}
                >
                  <Link
                    href={link.href}
                    onClick={onClose}
                    className="block rounded-lg px-4 py-3 text-lg font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    {t(link.key)}
                  </Link>
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className="mt-4 space-y-2"
              >
                {isLoggedIn ? (
                  <>
                    <Link
                      href="/dashboard"
                      onClick={onClose}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-secondary px-6 py-3 text-base font-bold text-white shadow-lg shadow-secondary/25 transition-all hover:bg-secondary-dark"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Painel
                    </Link>
                    <button
                      onClick={() => { signOut(); onClose(); }}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white/10 px-6 py-3 text-base font-medium text-white/80 transition-all hover:bg-white/20 hover:text-white"
                    >
                      <LogOut className="h-4 w-4" />
                      Sair
                    </button>
                  </>
                ) : (
                  <Link
                    href="/entrar"
                    onClick={onClose}
                    className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-accent px-6 py-3 text-base font-bold text-primary shadow-lg shadow-accent/25 transition-all hover:bg-accent-dark"
                  >
                    {t('common.entrar')}
                  </Link>
                )}
              </motion.div>
            </div>
          </motion.nav>
        </>
      )}
    </AnimatePresence>
  );
}
