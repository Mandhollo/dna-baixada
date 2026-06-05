'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Car,
  Star,
  Gift,
  LogOut,
  Clock,
  TrendingUp,
  ShieldCheck,
  AlertCircle,
  Bell,
  BellRing,
  Trophy,
  User,
  History,
  Target,
  Zap,
  CheckCircle,
  X,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import {
  supabase,
  formatarBRL,
  type Motorista,
  type Notificacao,
  type MetaProgresso,
  type Incentivo,
  CORRIDA_STATUS_LABELS,
} from '@/lib/supabase';

/* ─── animation helpers ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' as const },
  }),
};

export default function MotoristaDashboardPage() {
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();
  const [motorista, setMotorista] = useState<Motorista | null>(null);
  const [disponivel, setDisponivel] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [showNotif, setShowNotif] = useState(false);
  const [metas, setMetas] = useState<MetaProgresso[]>([]);
  const [incentivos, setIncentivos] = useState<Incentivo[]>([]);

  useEffect(() => {
    if (loading) return;
    if (!user || profile?.role !== 'motorista') {
      router.replace('/entrar');
    }
  }, [user, profile, loading, router]);

  /* fetch motorista row */
  useEffect(() => {
    if (!user) return;
    supabase
      .from('motoristas')
      .select('*')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setMotorista(data as Motorista);
          setDisponivel(data.disponivel);
        }
      });
  }, [user]);

  /* fetch notificações */
  useEffect(() => {
    if (!user) return;
    supabase
      .from('notificacoes')
      .select('*')
      .eq('usuario_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (data) setNotificacoes(data as Notificacao[]);
      });
  }, [user]);

  /* fetch metas + progresso */
  useEffect(() => {
    if (!user) return;
    supabase
      .from('meta_progresso')
      .select('*, meta:metas(*)')
      .eq('motorista_id', user.id)
      .order('created_at', { ascending: false })
      .limit(4)
      .then(({ data }) => {
        if (data) setMetas(data as MetaProgresso[]);
      });
  }, [user]);

  /* fetch incentivos ativos */
  useEffect(() => {
    supabase
      .from('incentivos')
      .select('*')
      .eq('ativo', true)
      .order('multiplicador', { ascending: false })
      .then(({ data }) => {
        if (data) setIncentivos(data as Incentivo[]);
      });
  }, []);

  /* toggle disponível */
  const handleToggle = async () => {
    if (!user) return;
    setToggling(true);
    const next = !disponivel;
    await supabase
      .from('motoristas')
      .update({ disponivel: next })
      .eq('id', user.id);
    setDisponivel(next);
    setToggling(false);
  };

  /* marcar notificação como lida */
  const markRead = useCallback(async (id: string) => {
    await supabase
      .from('notificacoes')
      .update({ lida: true, lida_em: new Date().toISOString() })
      .eq('id', id);
    setNotificacoes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, lida: true } : n))
    );
  }, []);

  const markAllRead = useCallback(async () => {
    if (!user) return;
    const unread = notificacoes.filter((n) => !n.lida).map((n) => n.id);
    if (unread.length === 0) return;
    await supabase
      .from('notificacoes')
      .update({ lida: true, lida_em: new Date().toISOString() })
      .in('id', unread);
    setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })));
  }, [user, notificacoes]);

  const unreadCount = notificacoes.filter((n) => !n.lida).length;

  /* ── Loading ── */
  if (loading || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-secondary">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    );
  }

  const firstName = profile.nome.split(' ')[0];
  const status = motorista?.status ?? 'pendente';
  const isApproved = status === 'aprovado';

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    pendente: { label: 'Pendente', color: 'text-accent-dark', bg: 'bg-accent/10 border-accent/20' },
    aprovado: { label: 'Aprovado', color: 'text-secondary', bg: 'bg-secondary/10 border-secondary/20' },
    rejeitado: { label: 'Rejeitado', color: 'text-accent2', bg: 'bg-accent2/10 border-accent2/20' },
    suspenso: { label: 'Suspenso', color: 'text-accent2', bg: 'bg-accent2/10 border-accent2/20' },
  };

  const st = statusConfig[status] ?? statusConfig.pendente;

  return (
    <div className="min-h-screen bg-background-secondary">
      {/* ── Header ── */}
      <header className="sticky top-0 z-30 bg-primary text-white shadow-lg">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-accent">
              Motorista · DNA Baixada
            </p>
            <h1 className="text-lg font-bold sm:text-xl">Olá, {firstName}!</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Notificações */}
            <button
              onClick={() => setShowNotif(!showNotif)}
              className="relative flex items-center justify-center rounded-full bg-white/10 p-2.5 transition hover:bg-white/20"
            >
              {unreadCount > 0 ? (
                <BellRing size={18} className="animate-pulse text-accent" />
              ) : (
                <Bell size={18} />
              )}
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent2 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={signOut}
              className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold transition hover:bg-white/20"
            >
              <LogOut size={16} /> Sair
            </button>
          </div>
        </div>
      </header>

      {/* ── Notificações dropdown ── */}
      <AnimatePresence>
        {showNotif && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed inset-x-0 top-[60px] z-40 mx-auto max-w-5xl px-4 sm:px-6"
          >
            <div className="rounded-2xl border border-border bg-surface-elevated shadow-xl">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <h3 className="font-bold text-foreground">Notificações</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Marcar todas como lidas
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notificacoes.length === 0 ? (
                  <div className="p-6 text-center">
                    <Bell size={28} className="mx-auto text-foreground-muted/40" />
                    <p className="mt-2 text-sm text-foreground-muted">Nenhuma notificação</p>
                  </div>
                ) : (
                  notificacoes.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => {
                        markRead(n.id);
                        if (n.link) router.push(n.link);
                        setShowNotif(false);
                      }}
                      className={`flex w-full gap-3 border-b border-border/50 px-4 py-3 text-left transition hover:bg-background-secondary ${
                        n.lida ? 'opacity-60' : ''
                      }`}
                    >
                      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        n.lida ? 'bg-background-tertiary' : 'bg-primary/10'
                      }`}>
                        <Zap size={14} className={n.lida ? 'text-foreground-muted' : 'text-primary'} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm ${n.lida ? 'text-foreground-muted' : 'font-semibold text-foreground'}`}>
                          {n.titulo}
                        </p>
                        <p className="truncate text-xs text-foreground-muted">{n.mensagem}</p>
                        <p className="mt-0.5 text-[10px] text-foreground-muted/60">
                          {new Date(n.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {!n.lida && <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                    </button>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Overlay to close */}
      {showNotif && (
        <div className="fixed inset-0 z-35" onClick={() => setShowNotif(false)} />
      )}

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* ── Status badge ── */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0} className="mb-6">
          <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 ${st.bg}`}>
            {status === 'aprovado' ? (
              <ShieldCheck size={16} className={st.color} />
            ) : (
              <AlertCircle size={16} className={st.color} />
            )}
            <span className={`text-sm font-bold ${st.color}`}>Status: {st.label}</span>
          </div>
        </motion.div>

        {/* ── Stats ── */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1} className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            label="Ganho Total"
            value={motorista ? formatarBRL(motorista.ganho_total) : 'R$ 0,00'}
            icon={<TrendingUp size={20} className="text-secondary" />}
          />
          <StatCard
            label="Corridas"
            value={motorista ? String(motorista.total_corridas) : '0'}
            icon={<Car size={20} className="text-primary" />}
          />
          <StatCard
            label="Avaliação"
            value={profile.avaliacao_media ? profile.avaliacao_media.toFixed(1) : '—'}
            icon={<Star size={20} className="text-accent-dark" />}
          />
          <StatCard
            label="Pontos"
            value={String(profile.pontos ?? 0)}
            icon={<Gift size={20} className="text-accent2" />}
          />
        </motion.div>

        {/* ── Disponível toggle ── */}
        {isApproved && (
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={2} className="mt-8 rounded-2xl border border-border bg-surface-elevated p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${disponivel ? 'bg-secondary/10' : 'bg-foreground-muted/10'}`}>
                  <Car size={20} className={disponivel ? 'text-secondary' : 'text-foreground-muted'} />
                </div>
                <div>
                  <p className="font-bold text-foreground">{disponivel ? 'Disponível' : 'Indisponível'}</p>
                  <p className="text-xs text-foreground-muted">
                    {disponivel ? 'Você está recebendo corridas' : 'Ative para começar a receber corridas'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleToggle}
                disabled={toggling}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${disponivel ? 'bg-secondary' : 'bg-border-strong'} ${toggling ? 'opacity-50' : ''}`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${disponivel ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Incentivos ativos ── */}
        {incentivos.length > 0 && (
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={2.5} className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={16} className="text-accent-dark" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground-muted">Incentivos Ativos</h2>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {incentivos.map((inc) => (
                <div
                  key={inc.id}
                  className="shrink-0 rounded-2xl bg-gradient-to-br from-accent-dark to-accent px-4 py-3 text-white shadow-md"
                >
                  <p className="text-sm font-bold">{inc.nome}</p>
                  <p className="text-xs text-white/75">{inc.descricao}</p>
                  <div className="mt-1.5 flex items-center gap-1">
                    <TrendingUp size={12} />
                    <span className="text-xs font-bold">+{Math.round((inc.multiplicador - 1) * 100)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Metas / Bonificações ── */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3} className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target size={16} className="text-accent-dark" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground-muted">Metas</h2>
            </div>
            <a href="/dashboard/motorista/ranking" className="text-xs font-semibold text-primary hover:underline">
              Ver Ranking
            </a>
          </div>
          {metas.length > 0 ? (
            <div className="space-y-3">
              {metas.map((mp) => {
                const meta = mp.meta;
                if (!meta) return null;
                const pct = Math.min(100, Math.round((mp.progresso / meta.objetivo) * 100));
                return (
                  <div key={mp.id} className="rounded-2xl border border-border bg-surface-elevated p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-foreground">{meta.nome}</p>
                        <p className="text-xs text-foreground-muted">{meta.descricao}</p>
                      </div>
                      <div className="text-right">
                        {mp.concluida ? (
                          <div className="flex items-center gap-1 text-secondary">
                            <CheckCircle size={16} />
                            <span className="text-xs font-bold">Concluída!</span>
                          </div>
                        ) : (
                          <p className="text-sm font-bold text-primary">{pct}%</p>
                        )}
                        <p className="text-[10px] text-foreground-muted">
                          {mp.progresso.toFixed(0)}/{meta.objetivo} {meta.unidade}
                        </p>
                      </div>
                    </div>
                    {!mp.concluida && (
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-background-tertiary">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    )}
                    {mp.concluida && (
                      <p className="mt-2 text-xs text-accent-dark font-semibold">
                        Recompensa: {meta.recompensa_tipo === 'bonus' ? formatarBRL(meta.recompensa_valor) : `${meta.recompensa_valor} pontos`}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-surface-elevated p-6 text-center shadow-sm">
              <Target size={32} className="mx-auto text-foreground-muted/40" />
              <p className="mt-2 text-sm text-foreground-muted">
                Complete corridas para desbloquear metas!
              </p>
            </div>
          )}
        </motion.div>

        {/* ── Quick actions ── */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={4} className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <ActionCard
            title="Corridas"
            description="Disponíveis"
            icon={<Car size={20} />}
            href="/corridas-disponiveis"
            variant="primary"
          />
          <ActionCard
            title="Financeiro"
            description="Ganhos e extrato"
            icon={<TrendingUp size={20} />}
            href="/dashboard/motorista/financeiro"
            variant="accent"
          />
          <ActionCard
            title="Histórico"
            description="Minhas corridas"
            icon={<History size={20} />}
            href="/dashboard/motorista/corridas"
            variant="primary"
          />
          <ActionCard
            title="Ranking"
            description="Top motoristas"
            icon={<Trophy size={20} />}
            href="/dashboard/motorista/ranking"
            variant="accent"
          />
        </motion.div>

        {/* ── Perfil link ── */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={5} className="mt-6">
          <a
            href="/dashboard/motorista/perfil"
            className="flex items-center gap-4 rounded-2xl border border-border bg-surface-elevated p-4 shadow-sm transition hover:shadow-md"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              {profile.foto_url ? (
                <img src={profile.foto_url} alt="" className="h-12 w-12 rounded-full object-cover" />
              ) : (
                <span className="text-lg font-bold">{profile.nome.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="flex-1">
              <p className="font-bold text-foreground">{profile.nome}</p>
              <p className="text-xs text-foreground-muted">
                {motorista?.veiculo_modelo ?? 'Sem veículo'} · {motorista?.cidade_base ?? 'Santos'}
              </p>
            </div>
            <User size={20} className="text-foreground-muted" />
          </a>
        </motion.div>
      </div>
    </div>
  );
}

/* ── Stat card ── */
function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-elevated p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/5">{icon}</div>
        <div>
          <p className="text-lg font-extrabold text-foreground">{value}</p>
          <p className="text-[11px] font-medium text-foreground-muted">{label}</p>
        </div>
      </div>
    </div>
  );
}

/* ── Action card ── */
function ActionCard({ title, description, icon, href, variant }: {
  title: string; description: string; icon: React.ReactNode; href: string; variant: 'primary' | 'accent';
}) {
  const bgMap = { primary: 'from-primary to-primary-light', accent: 'from-accent-dark to-accent' };
  return (
    <a
      href={href}
      className={`group flex items-center gap-3 rounded-2xl bg-gradient-to-br ${bgMap[variant]} p-4 text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl`}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">{icon}</div>
      <div>
        <h3 className="text-sm font-bold">{title}</h3>
        <p className="text-[11px] text-white/75">{description}</p>
      </div>
    </a>
  );
}
