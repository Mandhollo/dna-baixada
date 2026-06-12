'use client';

import { Settings } from 'lucide-react';

export default function AdminConfig() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Configurações</h1>
        <p className="text-sm text-[var(--foreground-muted)]">Configurações da plataforma</p>
      </div>
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] py-16 text-center">
        <Settings className="mx-auto mb-3 h-12 w-12 text-[var(--foreground-muted)]" />
        <p className="text-lg font-medium text-[var(--foreground)]">Em breve</p>
        <p className="text-sm text-[var(--foreground-muted)]">Configurações avançadas em desenvolvimento</p>
      </div>
    </div>
  );
}
