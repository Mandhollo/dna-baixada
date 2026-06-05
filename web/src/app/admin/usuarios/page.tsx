'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Search,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Ban,
  Car,
  Star,
  Mail,
  Phone,
  Calendar,
  RefreshCw,
  ChevronDown,
  Loader2,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import {
  supabase,
  type Profile,
  type Motorista,
  type UserRole,
  type MotoristaStatus,
} from '@/lib/supabase';

/* ─── animation ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.45, ease: 'easeOut' as const },
  }),
};

/* ─── Role badge config ─── */
const ROLE_CONFIG: Record<UserRole, { label: string; color: string; bg: string }> = {
  admin: { label: 'Admin', color: 'text-purple-700', bg: 'bg-purple-100' },
  passageiro: { label: 'Passageiro', color: 'text-primary', bg: 'bg-primary/10' },
  motorista: { label: 'Motorista', color: 'text-secondary', bg: 'bg-secondary/10' },
  parceiro: { label: 'Parceiro', color: 'text-accent-dark', bg: 'bg-accent/10' },
};

const MOTORISTA_STATUS_CONFIG: Record<MotoristaStatus, { label: string; color: string; bg: string }> = {
  pendente: { label: 'Pendente', color: 'text-accent-dark', bg: 'bg-accent/10' },
  aprovado: { label: 'Aprovado', color: 'text-secondary', bg: 'bg-secondary/10' },
  rejeitado: { label: 'Rejeitado', color: 'text-accent2', bg: 'bg-accent2/10' },
  suspenso: { label: 'Suspenso', color: 'text-accent2', bg: 'bg-accent2/10' },
};

type RoleFilter = 'todos' | UserRole;

interface ProfileWithMotorista extends Profile {
  motoristas?: Motorista[];
}

export default function AdminUsuariosPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();

  const [profiles, setProfiles] = useState<ProfileWithMotorista[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('todos');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /* ── Auth guard ── */
  useEffect(() => {
    if (authLoading) return;
    if (!user || profile?.role !== 'admin') {
      router.replace('/entrar');
    }
  }, [user, profile, authLoading, router]);

  /* ── Fetch profiles ── */
  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    setError(null);

    let query = supabase
      .from('profiles')
      .select('*, motoristas(*)')
      .order('created_at', { ascending: false });

    if (roleFilter !== 'todos') {
      query = query.eq('role', roleFilter);
    }

    if (searchTerm.trim()) {
      query = query.or(`nome.ilike.%${searchTerm.trim()}%,email.ilike.%${searchTerm.trim()}%`);
    }

    const { data, error: fetchError } = await query.limit(100);

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setProfiles((data as ProfileWithMotorista[]) ?? []);
    }
    setLoading(false);
  }, [roleFilter, searchTerm]);

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchProfiles();
    }
  }, [profile, roleFilter, fetchProfiles]);

  /* ── Actions ── */
  const handleAprovarMotorista = async (motoristaId: string, profileId: string) => {
    setActionLoading(profileId);
    const { error: updateError } = await supabase
      .from('motoristas')
      .update({ status: 'aprovado' })
      .eq('id', motoristaId);

    if (updateError) {
      setError(updateError.message);
    } else {
      setProfiles((prev) =>
        prev.map((p) =>
          p.id === profileId
            ? {
                ...p,
                motoristas: p.motoristas?.map((m) =>
                  m.id === motoristaId ? { ...m, status: 'aprovado' as MotoristaStatus } : m
                ),
              }
            : p
        )
      );
    }
    setActionLoading(null);
  };

  const handleRejeitarMotorista = async (motoristaId: string, profileId: string) => {
    setActionLoading(profileId);
    const { error: updateError } = await supabase
      .from('motoristas')
      .update({ status: 'rejeitado' })
      .eq('id', motoristaId);

    if (updateError) {
      setError(updateError.message);
    } else {
      setProfiles((prev) =>
        prev.map((p) =>
          p.id === profileId
            ? {
                ...p,
                motoristas: p.motoristas?.map((m) =>
                  m.id === motoristaId ? { ...m, status: 'rejeitado' as MotoristaStatus } : m
                ),
              }
            : p
        )
      );
    }
    setActionLoading(null);
  };

  const handleSuspenderUsuario = async (profileId: string) => {
    setActionLoading(profileId);
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ ativo: false })
      .eq('id', profileId);

    if (updateError) {
      setError(updateError.message);
    } else {
      setProfiles((prev) =>
        prev.map((p) => (p.id === profileId ? { ...p, ativo: false } : p))
      );
    }
    setActionLoading(null);
  };

  const handleReativarUsuario = async (profileId: string) => {
    setActionLoading(profileId);
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ ativo: true })
      .eq('id', profileId);

    if (updateError) {
      setError(updateError.message);
    } else {
      setProfiles((prev) =>
        prev.map((p) => (p.id === profileId ? { ...p, ativo: true } : p))
      );
    }
    setActionLoading(null);
  };

  /* ── Loading / Auth ── */
  if (authLoading || !profile || profile.role !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-secondary">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    );
  }

  /* ── Counters ── */
  const totalUsuarios = profiles.length;
  const pendentesCount = profiles.filter(
    (p) => p.role === 'motorista' && p.motoristas?.some((m) => m.status === 'pendente')
  ).length;
  const suspensosCount = profiles.filter((p) => !p.ativo).length;

  return (
    <div className="min-h-screen bg-background-secondary">
      {/* ── Header ── */}
      <header className="sticky top-0 z-30 bg-primary text-white shadow-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-accent">
              Admin · DNA Baixada
            </p>
            <h1 className="text-lg font-bold sm:text-xl flex items-center gap-2">
              <Users size={22} />
              Gestão de Usuários
            </h1>
          </div>
          <button
            onClick={fetchProfiles}
            className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold transition hover:bg-white/20"
          >
            <RefreshCw size={16} /> Atualizar
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* ── Stats cards ── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
          className="mb-6 grid grid-cols-3 gap-4"
        >
          <div className="rounded-2xl border border-border bg-surface-elevated p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">Total</p>
            <p className="mt-1 text-2xl font-bold text-primary">{totalUsuarios}</p>
          </div>
          <div className="rounded-2xl border border-border bg-surface-elevated p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">Pendentes</p>
            <p className="mt-1 text-2xl font-bold text-accent-dark">{pendentesCount}</p>
          </div>
          <div className="rounded-2xl border border-border bg-surface-elevated p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">Suspensos</p>
            <p className="mt-1 text-2xl font-bold text-accent2">{suspensosCount}</p>
          </div>
        </motion.div>

        {/* ── Error banner ── */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 flex items-center gap-2 rounded-xl border border-accent2/30 bg-accent2/5 px-4 py-3 text-sm text-accent2"
            >
              <AlertTriangle size={16} />
              {error}
              <button onClick={() => setError(null)} className="ml-auto text-accent2/60 hover:text-accent2">✕</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Filters ── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={1}
          className="mb-6 flex flex-col gap-3 sm:flex-row"
        >
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-muted" />
            <input
              type="text"
              placeholder="Buscar por nome ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface-elevated py-3 pl-11 pr-4 text-sm text-foreground placeholder-foreground-muted/50 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </div>
          <div className="relative">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
              className="appearance-none rounded-xl border border-border bg-surface-elevated py-3 pl-4 pr-10 text-sm font-medium text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
            >
              <option value="todos">Todos os perfis</option>
              <option value="passageiro">Passageiro</option>
              <option value="motorista">Motorista</option>
              <option value="parceiro">Parceiro</option>
              <option value="admin">Admin</option>
            </select>
            <ChevronDown size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-foreground-muted" />
          </div>
        </motion.div>

        {/* ── List / Skeleton ── */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl border border-border bg-surface-elevated p-5"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-background-tertiary" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 rounded bg-background-tertiary" />
                    <div className="h-3 w-1/2 rounded bg-background-tertiary" />
                  </div>
                  <div className="h-6 w-20 rounded-full bg-background-tertiary" />
                </div>
              </div>
            ))}
          </div>
        ) : profiles.length === 0 ? (
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={2}
            className="rounded-2xl border border-border bg-surface-elevated p-12 text-center shadow-sm"
          >
            <Users size={48} className="mx-auto text-foreground-muted/30" />
            <p className="mt-4 text-lg font-bold text-foreground">Nenhum usuário encontrado</p>
            <p className="mt-1 text-sm text-foreground-muted">Tente ajustar os filtros de busca.</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {profiles.map((p, idx) => {
              const roleConf = ROLE_CONFIG[p.role] ?? ROLE_CONFIG.passageiro;
              const motorista = p.motoristas?.[0];
              const motorStatus = motorista
                ? MOTORISTA_STATUS_CONFIG[motorista.status] ?? MOTORISTA_STATUS_CONFIG.pendente
                : null;
              const isPending = motorista?.status === 'pendente';
              const isAction = actionLoading === p.id;

              return (
                <motion.div
                  key={p.id}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  custom={idx + 2}
                  className={`rounded-2xl border bg-surface-elevated p-5 shadow-sm transition ${
                    !p.ativo ? 'border-accent2/20 opacity-70' : 'border-border hover:shadow-md'
                  }`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    {/* Left: avatar + info */}
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        {p.foto_url ? (
                          <img src={p.foto_url} alt="" className="h-12 w-12 rounded-full object-cover" />
                        ) : (
                          <span className="text-lg font-bold">{p.nome.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-foreground truncate">{p.nome}</p>
                          {!p.ativo && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-accent2/10 px-2 py-0.5 text-[10px] font-bold text-accent2">
                              <Ban size={10} /> SUSPENSO
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-foreground-muted">
                          <span className="flex items-center gap-1">
                            <Mail size={12} /> {p.email}
                          </span>
                          {p.telefone && (
                            <span className="flex items-center gap-1">
                              <Phone size={12} /> {p.telefone}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar size={12} /> {new Date(p.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        {/* Motorista details */}
                        {motorista && (
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${motorStatus?.color} ${motorStatus?.bg}`}>
                              <Car size={11} /> {motorStatus?.label}
                            </span>
                            <span className="text-[11px] text-foreground-muted">
                              {motorista.veiculo_modelo} · {motorista.veiculo_placa}
                            </span>
                            <span className="flex items-center gap-0.5 text-[11px] text-accent-dark">
                              <Star size={11} /> {p.avaliacao_media.toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: badges + actions */}
                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                      {/* Role badge */}
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${roleConf.color} ${roleConf.bg}`}>
                        {roleConf.label}
                      </span>

                      {/* Motorista actions */}
                      {isPending && motorista && (
                        <>
                          <button
                            onClick={() => handleAprovarMotorista(motorista.id, p.id)}
                            disabled={isAction}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-secondary px-3 py-1.5 text-xs font-bold text-white transition hover:bg-secondary-dark disabled:opacity-50"
                          >
                            {isAction ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                            Aprovar
                          </button>
                          <button
                            onClick={() => handleRejeitarMotorista(motorista.id, p.id)}
                            disabled={isAction}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-accent2 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-accent2-dark disabled:opacity-50"
                          >
                            {isAction ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                            Rejeitar
                          </button>
                        </>
                      )}

                      {/* Suspender / Reativar */}
                      {p.role !== 'admin' && (
                        p.ativo ? (
                          <button
                            onClick={() => handleSuspenderUsuario(p.id)}
                            disabled={isAction}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-accent2/30 px-3 py-1.5 text-xs font-bold text-accent2 transition hover:bg-accent2/5 disabled:opacity-50"
                          >
                            {isAction ? <Loader2 size={14} className="animate-spin" /> : <Ban size={14} />}
                            Suspender
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReativarUsuario(p.id)}
                            disabled={isAction}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-secondary/30 px-3 py-1.5 text-xs font-bold text-secondary transition hover:bg-secondary/5 disabled:opacity-50"
                          >
                            {isAction ? <Loader2 size={14} className="animate-spin" /> : <UserCheck size={14} />}
                            Reativar
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
