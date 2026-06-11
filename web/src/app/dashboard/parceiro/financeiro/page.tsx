'use client';
import PageTitle from '@/components/seo/PageTitle';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  DollarSign,
  Ticket,
  Wallet,
  TrendingUp,
  Clock,
  Plus,
  X,
  Tag,
  Percent,
  Hash,
  CalendarDays,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  ChevronUp,
  Users,
  Copy,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import {
  supabase,
  formatarBRL,
  TRANSACAO_TIPO_LABELS,
  TRANSACAO_STATUS_LABELS,
} from '@/lib/supabase';
import type { Transacao, Cupom, CupomUsado, Profile } from '@/lib/supabase';

/* ─── animation helpers ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' as const },
  }),
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

type TabKey = 'visao_geral' | 'cupons';

/* ════════════════════════════════════════════════════════════
   MAIN PAGE
   ════════════════════════════════════════════════════════════ */

export default function ParceiroFinanceiroPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabKey>('visao_geral');
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [cupons, setCupons] = useState<Cupom[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [totalVendas, setTotalVendas] = useState(0);
  const [totalCuponsUsados, setTotalCuponsUsados] = useState(0);

  /* ── Auth guard ── */
  useEffect(() => {
    if (authLoading) return;
    if (!user || profile?.role !== 'parceiro') {
      router.replace('/entrar');
    }
  }, [user, profile, authLoading, router]);

  /* ── Fetch data ── */
  const fetchTransacoes = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('transacoes')
      .select('*')
      .eq('usuario_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) {
      setTransacoes(data as Transacao[]);
      const total = data.reduce((acc, t) => acc + (t.valor_liquido ?? 0), 0);
      setTotalVendas(total);
    }
  }, [user]);

  const fetchCupons = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('cupons')
      .select('*')
      .eq('parceiro_id', user.id)
      .order('created_at', { ascending: false });
    if (data) {
      setCupons(data as Cupom[]);
      const usados = data.reduce((acc, c) => acc + (c.usos_contabilizados ?? 0), 0);
      setTotalCuponsUsados(usados);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setLoadingData(true);
    Promise.all([fetchTransacoes(), fetchCupons()]).finally(() => setLoadingData(false));
  }, [user, fetchTransacoes, fetchCupons]);

  /* ── Loading state ── */
  if (authLoading || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-secondary">
      <PageTitle title='Financeiro Parceiro' />
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    );
  }

  const saldoDisponivel = totalVendas;

  /* ════════════════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-background-secondary">
      {/* ── Header ── */}
      <header className="sticky top-0 z-30 bg-gradient-to-r from-primary to-primary-light text-white shadow-lg">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
          <button
            onClick={() => router.push('/dashboard/parceiro')}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 transition hover:bg-white/25"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-widest text-white/60">
              Parceiro
            </p>
            <h1 className="text-lg font-bold leading-tight">Financeiro</h1>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        {/* ── Tabs ── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
          className="mb-6 flex gap-2 rounded-2xl bg-surface-elevated p-1.5 shadow-sm border border-border"
        >
          <TabButton
            active={activeTab === 'visao_geral'}
            onClick={() => setActiveTab('visao_geral')}
            icon={<TrendingUp size={16} />}
            label="Visao Geral"
          />
          <TabButton
            active={activeTab === 'cupons'}
            onClick={() => setActiveTab('cupons')}
            icon={<Ticket size={16} />}
            label="Meus Cupons"
          />
        </motion.div>

        {loadingData ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-primary" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === 'visao_geral' && (
              <motion.div key="visao" variants={fadeIn} initial="hidden" animate="visible" exit="exit">
                <VisaoGeral
                  totalVendas={totalVendas}
                  totalCuponsUsados={totalCuponsUsados}
                  saldoDisponivel={saldoDisponivel}
                  transacoes={transacoes}
                />
              </motion.div>
            )}
            {activeTab === 'cupons' && (
              <motion.div key="cupons" variants={fadeIn} initial="hidden" animate="visible" exit="exit">
                <MeusCupons cupons={cupons} onRefresh={fetchCupons} />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   TAB BUTTON
   ════════════════════════════════════════════════════════════ */

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
        active
          ? 'bg-primary text-white shadow-md'
          : 'text-foreground-muted hover:text-foreground hover:bg-background-tertiary'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

/* ════════════════════════════════════════════════════════════
   VISAO GERAL TAB
   ════════════════════════════════════════════════════════════ */

function VisaoGeral({
  totalVendas,
  totalCuponsUsados,
  saldoDisponivel,
  transacoes,
}: {
  totalVendas: number;
  totalCuponsUsados: number;
  saldoDisponivel: number;
  transacoes: Transacao[];
}) {
  return (
    <div className="space-y-6">
      {/* ── Summary cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          index={0}
          icon={<DollarSign size={22} className="text-secondary" />}
          label="Total Vendas"
          value={formatarBRL(totalVendas)}
          bgIcon="bg-secondary/10"
        />
        <SummaryCard
          index={1}
          icon={<Tag size={22} className="text-accent-dark" />}
          label="Cupons Usados"
          value={String(totalCuponsUsados)}
          bgIcon="bg-accent/10"
        />
        <SummaryCard
          index={2}
          icon={<Wallet size={22} className="text-primary" />}
          label="Saldo Disponivel"
          value={formatarBRL(saldoDisponivel)}
          bgIcon="bg-primary/10"
        />
      </div>

      {/* ── Transacoes recentes ── */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3}>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-foreground-muted">
          Transacoes Recentes
        </h2>

        {transacoes.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface-elevated p-8 text-center shadow-sm">
            <Clock size={40} className="mx-auto text-foreground-muted/40" />
            <p className="mt-3 font-semibold text-foreground-secondary">
              Nenhuma transacao encontrada
            </p>
            <p className="mt-1 text-sm text-foreground-muted">
              As transacoes aparecerao conforme seu parceiro gerar atividade.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {transacoes.map((t, idx) => (
              <TransacaoCard key={t.id} transacao={t} index={idx} />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

/* ── Summary card ── */
function SummaryCard({
  index,
  icon,
  label,
  value,
  bgIcon,
}: {
  index: number;
  icon: React.ReactNode;
  label: string;
  value: string;
  bgIcon: string;
}) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      custom={index}
      className="rounded-2xl border border-border bg-surface-elevated p-5 shadow-sm transition hover:shadow-md"
    >
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${bgIcon}`}>
          {icon}
        </div>
        <div>
          <p className="text-xl font-extrabold text-foreground">{value}</p>
          <p className="text-xs font-medium text-foreground-muted">{label}</p>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Transacao card ── */
function TransacaoCard({ transacao, index }: { transacao: Transacao; index: number }) {
  const tipoInfo = TRANSACAO_TIPO_LABELS[transacao.tipo] ?? {
    label: transacao.tipo,
    color: 'text-foreground-muted',
  };
  const statusInfo = TRANSACAO_STATUS_LABELS[transacao.status] ?? {
    label: transacao.status,
    color: 'text-foreground-muted',
    bg: 'bg-background-tertiary',
  };

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      custom={index}
      className="rounded-xl border border-border bg-surface-elevated p-4 shadow-sm transition hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/5">
            <DollarSign size={18} className={tipoInfo.color} />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">{tipoInfo.label}</p>
            <p className="text-xs text-foreground-muted">
              {transacao.descricao ?? 'Sem descricao'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-extrabold text-foreground">
            {formatarBRL(transacao.valor_liquido)}
          </p>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusInfo.color} ${statusInfo.bg}`}
          >
            {statusInfo.label}
          </span>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2 text-[11px] text-foreground-muted">
        <Clock size={12} />
        {new Date(transacao.created_at).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </div>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════
   MEUS CUPONS TAB
   ════════════════════════════════════════════════════════════ */

function MeusCupons({
  cupons,
  onRefresh,
}: {
  cupons: Cupom[];
  onRefresh: () => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const [expandedCupom, setExpandedCupom] = useState<string | null>(null);
  const [cupomUsados, setCupomUsados] = useState<CupomUsado[]>([]);
  const [loadingUsados, setLoadingUsados] = useState(false);
  const [usadosProfiles, setUsadosProfiles] = useState<Record<string, Profile>>({});

  const fetchCupomUsados = useCallback(
    async (cupomId: string) => {
      setLoadingUsados(true);
      const { data } = await supabase
        .from('cupons_usados')
        .select('*')
        .eq('cupom_id', cupomId)
        .order('created_at', { ascending: false });
      if (data) {
        setCupomUsados(data as CupomUsado[]);
        // Fetch profiles for users
        const userIds = [...new Set(data.map((u) => u.usuario_id))];
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('*')
            .in('id', userIds);
          if (profiles) {
            const map: Record<string, Profile> = {};
            profiles.forEach((p) => {
              map[p.id] = p as Profile;
            });
            setUsadosProfiles(map);
          }
        }
      }
      setLoadingUsados(false);
    },
    [],
  );

  const toggleExpand = (cupomId: string) => {
    if (expandedCupom === cupomId) {
      setExpandedCupom(null);
    } else {
      setExpandedCupom(cupomId);
      setCupomUsados([]);
      setUsadosProfiles({});
      fetchCupomUsados(cupomId);
    }
  };

  const handleDesativar = async (cupomId: string) => {
    await supabase.from('cupons').update({ ativo: false }).eq('id', cupomId);
    onRefresh();
  };

  return (
    <div className="space-y-4">
      {/* ── Criar Cupom button ── */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}>
        <button
          onClick={() => setShowModal(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-accent-dark to-accent px-5 py-3.5 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl sm:w-auto"
        >
          <Plus size={18} />
          Criar Cupom
        </button>
      </motion.div>

      {/* ── Lista de cupons ── */}
      {cupons.length === 0 ? (
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={1}
          className="rounded-2xl border border-border bg-surface-elevated p-8 text-center shadow-sm"
        >
          <Ticket size={40} className="mx-auto text-foreground-muted/40" />
          <p className="mt-3 font-semibold text-foreground-secondary">
            Nenhum cupom criado
          </p>
          <p className="mt-1 text-sm text-foreground-muted">
            Crie cupons de desconto para atrair mais clientes.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {cupons.map((cupom, idx) => {
            const isExpired =
              cupom.valido_ate && new Date(cupom.valido_ate) < new Date();
            const isActive = cupom.ativo && !isExpired;
            const isExpanded = expandedCupom === cupom.id;

            return (
              <motion.div
                key={cupom.id}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={idx + 1}
                className="overflow-hidden rounded-2xl border border-border bg-surface-elevated shadow-sm"
              >
                {/* ── Cupom header ── */}
                <div
                  className="flex cursor-pointer items-center gap-4 p-4 transition hover:bg-background-tertiary/50"
                  onClick={() => toggleExpand(cupom.id)}
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10">
                    <Ticket size={20} className="text-accent-dark" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-bold text-foreground">
                        {cupom.codigo}
                      </p>
                      <CupomStatusBadge active={isActive} />
                    </div>
                    <p className="truncate text-xs text-foreground-muted">
                      {cupom.descricao}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <p className="text-sm font-extrabold text-foreground">
                      {cupom.tipo_desconto === 'percentual'
                        ? `${cupom.valor_desconto}%`
                        : formatarBRL(cupom.valor_desconto)}
                    </p>
                    <p className="text-[11px] text-foreground-muted">
                      {cupom.usos_contabilizados}/{cupom.usos_maximo} usos
                    </p>
                  </div>
                  <div className="text-foreground-muted">
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </div>

                {/* ── Expanded details ── */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      variants={fadeIn}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="border-t border-border bg-background-secondary/50"
                    >
                      <div className="p-4 space-y-3">
                        {/* Info row */}
                        <div className="flex flex-wrap gap-3 text-xs">
                          {cupom.valido_de && (
                            <div className="flex items-center gap-1 text-foreground-muted">
                              <CalendarDays size={12} />
                              De:{' '}
                              {new Date(cupom.valido_de).toLocaleDateString('pt-BR')}
                            </div>
                          )}
                          {cupom.valido_ate && (
                            <div className="flex items-center gap-1 text-foreground-muted">
                              <CalendarDays size={12} />
                              Ate:{' '}
                              {new Date(cupom.valido_ate).toLocaleDateString('pt-BR')}
                            </div>
                          )}
                          {cupom.valor_minimo_corrida && (
                            <div className="flex items-center gap-1 text-foreground-muted">
                              <DollarSign size={12} />
                              Min: {formatarBRL(cupom.valor_minimo_corrida)}
                            </div>
                          )}
                        </div>

                        {/* Desativar button */}
                        {cupom.ativo && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDesativar(cupom.id);
                            }}
                            className="flex items-center gap-2 rounded-xl bg-accent2/10 px-3 py-2 text-xs font-semibold text-accent2 transition hover:bg-accent2/20"
                          >
                            <EyeOff size={14} />
                            Desativar Cupom
                          </button>
                        )}

                        {/* ── Quem usou ── */}
                        <div>
                          <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-foreground-muted">
                            Quem usou
                          </h4>
                          {loadingUsados ? (
                            <div className="flex items-center justify-center py-4">
                              <Loader2 size={20} className="animate-spin text-primary" />
                            </div>
                          ) : cupomUsados.length === 0 ? (
                            <p className="text-xs text-foreground-muted">
                              Nenhum uso registrado ainda.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {cupomUsados.map((uso) => {
                                const userProfile = usadosProfiles[uso.usuario_id];
                                return (
                                  <div
                                    key={uso.id}
                                    className="flex items-center justify-between rounded-xl bg-surface-elevated p-3"
                                  >
                                    <div className="flex items-center gap-2">
                                      <Users size={14} className="text-foreground-muted" />
                                      <span className="text-xs font-semibold text-foreground">
                                        {userProfile?.nome ?? 'Usuario'}
                                      </span>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-xs font-bold text-accent2">
                                        -{formatarBRL(uso.desconto_aplicado)}
                                      </p>
                                      <p className="text-[10px] text-foreground-muted">
                                        {new Date(uso.created_at).toLocaleDateString('pt-BR')}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Modal Criar Cupom ── */}
      <AnimatePresence>
        {showModal && (
          <CriarCupomModal
            onClose={() => setShowModal(false)}
            onCreated={() => {
              setShowModal(false);
              onRefresh();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Status badge ── */
function CupomStatusBadge({ active }: { active: boolean }) {
  return active ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-secondary/10 px-2 py-0.5 text-[10px] font-bold text-secondary">
      <CheckCircle2 size={10} />
      Ativo
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-accent2/10 px-2 py-0.5 text-[10px] font-bold text-accent2">
      <AlertCircle size={10} />
      Expirado
    </span>
  );
}

/* ════════════════════════════════════════════════════════════
   MODAL — CRIAR CUPOM
   ════════════════════════════════════════════════════════════ */

function CriarCupomModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState({
    codigo: '',
    descricao: '',
    tipo_desconto: 'percentual' as 'percentual' | 'fixo',
    valor_desconto: '',
    usos_maximo: '',
    valido_de: new Date().toISOString().split('T')[0],
    valido_ate: '',
  });

  const set = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const generateCodigo = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'DNA';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    set('codigo', code);
  };

  const handleCopyCodigo = () => {
    navigator.clipboard.writeText(form.codigo);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError(null);

    if (!form.codigo.trim()) {
      setError('Codigo do cupom e obrigatorio.');
      return;
    }
    if (!form.valor_desconto || Number(form.valor_desconto) <= 0) {
      setError('Valor do desconto deve ser maior que zero.');
      return;
    }
    if (!form.usos_maximo || Number(form.usos_maximo) <= 0) {
      setError('Numero maximo de usos deve ser maior que zero.');
      return;
    }

    setSaving(true);

    const payload = {
      parceiro_id: user.id,
      codigo: form.codigo.toUpperCase().trim(),
      descricao: form.descricao.trim() || form.codigo.toUpperCase(),
      tipo_desconto: form.tipo_desconto,
      valor_desconto: Number(form.valor_desconto),
      usos_maximo: Number(form.usos_maximo),
      usos_contabilizados: 0,
      ativo: true,
      valido_de: form.valido_de || new Date().toISOString(),
      valido_ate: form.valido_ate || null,
    };

    const { error: insertError } = await supabase.from('cupons').insert(payload);

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    onCreated();
  };

  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-surface-elevated border border-border shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface-elevated px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10">
              <Ticket size={18} className="text-accent-dark" />
            </div>
            <h2 className="text-base font-bold text-foreground">Criar Cupom</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-background-tertiary text-foreground-muted transition hover:bg-border"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-accent2/10 p-3 text-xs font-semibold text-accent2">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          {/* Codigo */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-foreground-secondary">
              <Hash size={12} />
              Codigo do Cupom
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.codigo}
                onChange={(e) => set('codigo', e.target.value.toUpperCase())}
                placeholder="Ex: DNADESC20"
                className="flex-1 rounded-xl border border-border bg-background-secondary px-3 py-2.5 text-sm font-medium text-foreground placeholder:text-foreground-muted/50 focus:border-primary focus:outline-none"
              />
              <button
                type="button"
                onClick={generateCodigo}
                className="rounded-xl bg-primary/10 px-3 text-xs font-bold text-primary transition hover:bg-primary/20"
              >
                Gerar
              </button>
              {form.codigo && (
                <button
                  type="button"
                  onClick={handleCopyCodigo}
                  className="rounded-xl bg-secondary/10 px-3 text-xs font-bold text-secondary transition hover:bg-secondary/20"
                >
                  {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                </button>
              )}
            </div>
          </div>

          {/* Descricao */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-foreground-secondary">
              <Tag size={12} />
              Descricao
            </label>
            <input
              type="text"
              value={form.descricao}
              onChange={(e) => set('descricao', e.target.value)}
              placeholder="Ex: 20% de desconto em corridas"
              className="w-full rounded-xl border border-border bg-background-secondary px-3 py-2.5 text-sm font-medium text-foreground placeholder:text-foreground-muted/50 focus:border-primary focus:outline-none"
            />
          </div>

          {/* Tipo desconto */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-foreground-secondary">
              <Percent size={12} />
              Tipo de Desconto
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => set('tipo_desconto', 'percentual')}
                className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  form.tipo_desconto === 'percentual'
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-background-secondary text-foreground-muted border border-border hover:bg-background-tertiary'
                }`}
              >
                Percentual (%)
              </button>
              <button
                type="button"
                onClick={() => set('tipo_desconto', 'fixo')}
                className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  form.tipo_desconto === 'fixo'
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-background-secondary text-foreground-muted border border-border hover:bg-background-tertiary'
                }`}
              >
                Valor Fixo (R$)
              </button>
            </div>
          </div>

          {/* Valor desconto */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-foreground-secondary">
              <DollarSign size={12} />
              Valor do Desconto {form.tipo_desconto === 'percentual' ? '(%)' : '(R$)'}
            </label>
            <input
              type="number"
              min="0"
              step={form.tipo_desconto === 'percentual' ? '1' : '0.01'}
              value={form.valor_desconto}
              onChange={(e) => set('valor_desconto', e.target.value)}
              placeholder={form.tipo_desconto === 'percentual' ? 'Ex: 20' : 'Ex: 15.00'}
              className="w-full rounded-xl border border-border bg-background-secondary px-3 py-2.5 text-sm font-medium text-foreground placeholder:text-foreground-muted/50 focus:border-primary focus:outline-none"
            />
          </div>

          {/* Usos maximo */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-foreground-secondary">
              <Hash size={12} />
              Usos Maximo
            </label>
            <input
              type="number"
              min="1"
              value={form.usos_maximo}
              onChange={(e) => set('usos_maximo', e.target.value)}
              placeholder="Ex: 100"
              className="w-full rounded-xl border border-border bg-background-secondary px-3 py-2.5 text-sm font-medium text-foreground placeholder:text-foreground-muted/50 focus:border-primary focus:outline-none"
            />
          </div>

          {/* Validade */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-foreground-secondary">
                <CalendarDays size={12} />
                Valido de
              </label>
              <input
                type="date"
                value={form.valido_de}
                onChange={(e) => set('valido_de', e.target.value)}
                className="w-full rounded-xl border border-border bg-background-secondary px-3 py-2.5 text-sm font-medium text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-foreground-secondary">
                <CalendarDays size={12} />
                Valido ate
              </label>
              <input
                type="date"
                value={form.valido_ate}
                onChange={(e) => set('valido_ate', e.target.value)}
                className="w-full rounded-xl border border-border bg-background-secondary px-3 py-2.5 text-sm font-medium text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-secondary to-secondary-light py-3.5 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <CheckCircle2 size={16} />
                Criar Cupom
              </>
            )}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
