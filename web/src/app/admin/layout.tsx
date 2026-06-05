'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Store,
  BarChart3,
  Settings,
  Megaphone,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';

/* ─── sidebar nav items ─── */
const NAV_ITEMS = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Usuários', href: '/admin/usuarios', icon: Users },
  { label: 'Parceiros', href: '/admin/parceiros', icon: Store },
  { label: 'Relatórios', href: '/admin/relatorios', icon: BarChart3 },
  { label: 'Campanhas', href: '/admin/campanhas', icon: Megaphone },
  { label: 'Config', href: '/admin/config', icon: Settings },
] as const;

/* ─── animation helpers ─── */
const sidebarVariants = {
  open: { x: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 30 } },
  closed: { x: -280, opacity: 0, transition: { duration: 0.2 } },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* ── Auth guard ── */
  useEffect(() => {
    if (loading) return;
    if (!user || profile?.role !== 'admin') {
      router.replace('/entrar');
    }
  }, [user, profile, loading, router]);

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-secondary">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
          <p className="text-sm text-foreground-muted">Carregando painel…</p>
        </div>
      </div>
    );
  }

  if (!user || profile?.role !== 'admin') return null;

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <div className="flex min-h-screen bg-background-secondary">
      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-primary text-white z-40">
        <SidebarContent
          pathname={pathname}
          isActive={isActive}
          signOut={signOut}
        />
      </aside>

      {/* ── Mobile sidebar overlay ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              variants={sidebarVariants}
              initial="closed"
              animate="open"
              exit="closed"
              className="fixed inset-y-0 left-0 z-50 w-64 bg-primary text-white lg:hidden"
            >
              <SidebarContent
                pathname={pathname}
                isActive={isActive}
                signOut={signOut}
                onClose={() => setSidebarOpen(false)}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main content ── */}
      <div className="flex-1 lg:ml-64">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex items-center gap-3 bg-primary px-4 py-3 text-white lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-xl p-2 transition hover:bg-white/10"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-bold uppercase tracking-widest text-accent">
            DNA Admin
          </span>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Sidebar inner content (shared desktop + mobile)
   ═══════════════════════════════════════════════════════════ */
function SidebarContent({
  pathname,
  isActive,
  signOut,
  onClose,
}: {
  pathname: string;
  isActive: (href: string) => boolean;
  signOut: () => Promise<void>;
  onClose?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-white/10">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-primary font-extrabold text-lg">
          D
        </div>
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-accent">DNA Baixada</p>
          <p className="text-xs text-white/60">Painel Admin</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="ml-auto rounded-xl p-1 hover:bg-white/10 transition">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                active
                  ? 'bg-white/15 text-white shadow-md'
                  : 'text-white/70 hover:bg-white/8 hover:text-white'
              }`}
            >
              <item.icon className={`h-5 w-5 ${active ? 'text-accent' : 'text-white/50 group-hover:text-white/80'}`} />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight className="h-4 w-4 text-accent" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 px-3 py-4">
        <button
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white/70 transition hover:bg-white/8 hover:text-white"
        >
          <LogOut className="h-5 w-5 text-white/50" />
          <span>Sair</span>
        </button>
      </div>
    </div>
  );
}
