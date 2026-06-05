'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Menu } from 'lucide-react';
import Link from 'next/link';
import MobileNav from './MobileNav';

const navLinks = [
  { label: 'Início', href: '/' },
  { label: 'Corridas', href: '/corrida/solicitar' },
  { label: 'Turismo', href: '/turismo' },
  { label: 'Parceiros', href: '/parceiros' },
  { label: 'DNA Social', href: '/social' },
  { label: 'Recompensas', href: '/recompensas' },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }}
        className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#0A2463]/70 backdrop-blur-xl supports-[backdrop-filter]:bg-[#0A2463]/60"
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1 select-none">
            <span className="text-2xl font-extrabold tracking-tight text-[#F5A623]">
              DNA
            </span>
            <span className="text-2xl font-semibold tracking-tight text-white">
              Baixada
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/entrar"
              className="ml-3 inline-flex items-center rounded-full bg-[#F5A623] px-5 py-2 text-sm font-bold text-[#0A2463] shadow-lg shadow-[#F5A623]/25 transition-all hover:bg-[#e6951a] hover:shadow-[#F5A623]/40"
            >
              Entrar
            </Link>
          </nav>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="inline-flex items-center justify-center rounded-lg p-2 text-white transition-colors hover:bg-white/10 md:hidden"
            aria-label="Abrir menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </motion.header>

      <MobileNav isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}
