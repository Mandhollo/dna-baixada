'use client';
import PageTitle from '@/components/seo/PageTitle';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Camera,
  Pencil,
  Save,
  LogOut,
  User,
  Mail,
  Phone,
  Car,
  CreditCard,
  MapPin,
  ShieldCheck,
  AlertCircle,
  Star,
  TrendingUp,
  Gift,
  CheckCircle2,
  Loader2,
  LayoutDashboard,
  X,
  Hash,
  Palette,
  Calendar,
  Users,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase, formatarBRL } from '@/lib/supabase';
import type { Motorista, MotoristaStatus } from '@/lib/supabase';

/* ─── animation helpers ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' as const },
  }),
};

/* ─── Status config ─── */
const STATUS_CONFIG: Record<MotoristaStatus, { label: string; color: string; bg: string }> = {
  pendente: { label: 'Pendente', color: 'text-accent-dark', bg: 'bg-accent/10 border-accent/20' },
  aprovado: { label: 'Aprovado', color: 'text-secondary', bg: 'bg-secondary/10 border-secondary/20' },
  rejeitado: { label: 'Rejeitado', color: 'text-accent2', bg: 'bg-accent2/10 border-accent2/20' },
  suspenso: { label: 'Suspenso', color: 'text-accent2', bg: 'bg-accent2/10 border-accent2/20' },
};

/* ════════════════════════════════════════════════════════════ */
/*  Page Component                                            */
/* ════════════════════════════════════════════════════════════ */
export default function MotoristaPerfilPage() {
  const { user, profile, loading: authLoading, signOut, refreshProfile } = useAuth();
  const router = useRouter();

  const [motorista, setMotorista] = useState<Motorista | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  /* Edit modes */
  const [editandoPessoal, setEditandoPessoal] = useState(false);
  const [editandoVeiculo, setEditandoVeiculo] = useState(false);

  /* Editable fields — pessoal */
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');

  /* Editable fields — veículo */
  const [veiculoModelo, setVeiculoModelo] = useState('');
  const [veiculoPlaca, setVeiculoPlaca] = useState('');
  const [veiculoCor, setVeiculoCor] = useState('');
  const [veiculoAno, setVeiculoAno] = useState('');
  const [veiculoLugares, setVeiculoLugares] = useState('');

  /* File input ref */
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Auth guard ── */
  useEffect(() => {
    if (authLoading) return;
    if (!user || profile?.role !== 'motorista') {
      router.replace('/entrar');
    }
  }, [user, profile, authLoading, router]);

  /* ── Fetch motorista ── */
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
          setVeiculoModelo(data.veiculo_modelo ?? '');
          setVeiculoPlaca(data.veiculo_placa ?? '');
          setVeiculoCor(data.veiculo_cor ?? '');
          setVeiculoAno(data.veiculo_ano ? String(data.veiculo_ano) : '');
          setVeiculoLugares(data.veiculo_lugares ? String(data.veiculo_lugares) : '');
        }
        setCarregando(false);
      });
  }, [user]);

  /* ── Sync profile fields ── */
  useEffect(() => {
    if (profile) {
      setNome(profile.nome ?? '');
      setTelefone(profile.telefone ?? '');
      setEmail(profile.email ?? '');
    }
  }, [profile]);

  /* ── Save handler ── */
  const handleSave = async () => {
    if (!user) return;
    setSalvando(true);
    setSucesso(false);

    try {
      /* Update profiles */
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          nome,
          telefone,
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      /* Update motoristas */
      const { error: motoristaError } = await supabase
        .from('motoristas')
        .update({
          veiculo_modelo: veiculoModelo,
          veiculo_placa: veiculoPlaca,
          veiculo_cor: veiculoCor || null,
          veiculo_ano: veiculoAno ? Number(veiculoAno) : null,
          veiculo_lugares: veiculoLugares ? Number(veiculoLugares) : 4,
        })
        .eq('id', user.id);

      if (motoristaError) throw motoristaError;

      /* Refresh context profile */
      await refreshProfile();

      /* Refresh local motorista */
      const { data } = await supabase
        .from('motoristas')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) setMotorista(data as Motorista);

      setEditandoPessoal(false);
      setEditandoVeiculo(false);
      setSucesso(true);
      setTimeout(() => setSucesso(false), 3000);
    } catch (err) {
      console.error('Erro ao salvar perfil:', err);
    } finally {
      setSalvando(false);
    }
  };

  /* ── Photo upload placeholder ── */
  const handleFileChange = (_e: React.ChangeEvent<HTMLInputElement>) => {
    /* Upload será implementado futuramente com Supabase Storage */
  };

  /* ── Render estrelas ── */
  const renderEstrelas = (media: number) => {
    const estrelas = [];
    const cheias = Math.floor(media);
    for (let i = 0; i < 5; i++) {
      estrelas.push(
        <Star
          key={i}
          size={16}
          className={i < cheias ? 'fill-accent text-accent' : 'text-border-strong'}
        />
      );
    }
    return estrelas;
  };

  /* ── Loading state ── */
  if (authLoading || !profile || carregando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-secondary">
      <PageTitle title='Meu Perfil' />
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    );
  }

  const status = motorista?.status ?? 'pendente';
  const st = STATUS_CONFIG[status] ?? STATUS_CONFIG.pendente;

  const hasChanges =
    (editandoPessoal || editandoVeiculo);

  return (
    <div className="min-h-screen bg-background-secondary pb-32">
      {/* ═══ Header ═══ */}
      <header className="sticky top-0 z-30 bg-primary text-white shadow-lg">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
          <button
            onClick={() => router.push('/dashboard/motorista')}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 transition hover:bg-white/20"
            aria-label="Voltar"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <p className="text-xs font-medium uppercase tracking-widest text-accent">
              Motorista
            </p>
            <h1 className="text-lg font-bold sm:text-xl">Meu Perfil</h1>
          </div>
          <button
            onClick={() => router.push('/dashboard/motorista')}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 transition hover:bg-white/20"
            aria-label="Dashboard"
          >
            <LayoutDashboard size={20} />
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        {/* ═══ Foto de perfil ═══ */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
          className="flex flex-col items-center"
        >
          <div className="relative">
            {profile.foto_url ? (
              <img
                src={profile.foto_url}
                alt={profile.nome}
                className="h-28 w-28 rounded-full border-4 border-white object-cover shadow-lg"
              />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-white bg-primary text-4xl font-bold text-white shadow-lg">
                {profile.nome.charAt(0).toUpperCase()}
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-white shadow-md transition hover:bg-secondary-light"
              aria-label="Alterar foto"
            >
              <Camera size={16} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="mt-3 text-sm font-semibold text-primary transition hover:underline"
          >
            Alterar foto
          </button>
        </motion.div>

        {/* ═══ Card: Dados pessoais ═══ */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={1}
          className="mt-8"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground-muted">
              Dados Pessoais
            </h2>
            <button
              onClick={() => setEditandoPessoal(!editandoPessoal)}
              className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-foreground-secondary transition hover:border-primary hover:text-primary"
            >
              {editandoPessoal ? <X size={14} /> : <Pencil size={14} />}
              {editandoPessoal ? 'Cancelar' : 'Editar'}
            </button>
          </div>

          <div className="mt-3 rounded-2xl border border-border bg-surface-elevated p-5 shadow-sm">
            <div className="space-y-4">
              {/* Nome */}
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/5">
                  <User size={18} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-foreground-muted">Nome</p>
                  {editandoPessoal ? (
                    <input
                      type="text"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      className="mt-0.5 w-full rounded-xl border border-border bg-background-secondary px-3 py-2 text-sm font-semibold text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20"
                    />
                  ) : (
                    <p className="truncate text-sm font-semibold text-foreground">{nome}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/5">
                  <Mail size={18} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-foreground-muted">Email</p>
                  <p className="truncate text-sm font-semibold text-foreground">{email}</p>
                </div>
              </div>

              {/* Telefone */}
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/5">
                  <Phone size={18} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-foreground-muted">Telefone</p>
                  {editandoPessoal ? (
                    <input
                      type="tel"
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                      className="mt-0.5 w-full rounded-xl border border-border bg-background-secondary px-3 py-2 text-sm font-semibold text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20"
                    />
                  ) : (
                    <p className="truncate text-sm font-semibold text-foreground">
                      {telefone || 'Não informado'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ═══ Card: Dados do veículo ═══ */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={2}
          className="mt-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground-muted">
              Dados do Veículo
            </h2>
            <button
              onClick={() => setEditandoVeiculo(!editandoVeiculo)}
              className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-foreground-secondary transition hover:border-primary hover:text-primary"
            >
              {editandoVeiculo ? <X size={14} /> : <Pencil size={14} />}
              {editandoVeiculo ? 'Cancelar' : 'Editar'}
            </button>
          </div>

          <div className="mt-3 rounded-2xl border border-border bg-surface-elevated p-5 shadow-sm">
            <div className="space-y-4">
              {/* Modelo */}
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary/10">
                  <Car size={18} className="text-secondary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-foreground-muted">Modelo</p>
                  {editandoVeiculo ? (
                    <input
                      type="text"
                      value={veiculoModelo}
                      onChange={(e) => setVeiculoModelo(e.target.value)}
                      className="mt-0.5 w-full rounded-xl border border-border bg-background-secondary px-3 py-2 text-sm font-semibold text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20"
                    />
                  ) : (
                    <p className="truncate text-sm font-semibold text-foreground">
                      {veiculoModelo || 'Não informado'}
                    </p>
                  )}
                </div>
              </div>

              {/* Placa */}
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary/10">
                  <Hash size={18} className="text-secondary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-foreground-muted">Placa</p>
                  {editandoVeiculo ? (
                    <input
                      type="text"
                      value={veiculoPlaca}
                      onChange={(e) => setVeiculoPlaca(e.target.value.toUpperCase())}
                      className="mt-0.5 w-full rounded-xl border border-border bg-background-secondary px-3 py-2 text-sm font-semibold text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20"
                    />
                  ) : (
                    <p className="truncate text-sm font-semibold text-foreground">
                      {veiculoPlaca || 'Não informada'}
                    </p>
                  )}
                </div>
              </div>

              {/* Cor */}
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary/10">
                  <Palette size={18} className="text-secondary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-foreground-muted">Cor</p>
                  {editandoVeiculo ? (
                    <input
                      type="text"
                      value={veiculoCor}
                      onChange={(e) => setVeiculoCor(e.target.value)}
                      className="mt-0.5 w-full rounded-xl border border-border bg-background-secondary px-3 py-2 text-sm font-semibold text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20"
                    />
                  ) : (
                    <p className="truncate text-sm font-semibold text-foreground">
                      {veiculoCor || 'Não informada'}
                    </p>
                  )}
                </div>
              </div>

              {/* Ano */}
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary/10">
                  <Calendar size={18} className="text-secondary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-foreground-muted">Ano</p>
                  {editandoVeiculo ? (
                    <input
                      type="number"
                      value={veiculoAno}
                      onChange={(e) => setVeiculoAno(e.target.value)}
                      placeholder="Ex: 2023"
                      className="mt-0.5 w-full rounded-xl border border-border bg-background-secondary px-3 py-2 text-sm font-semibold text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20"
                    />
                  ) : (
                    <p className="truncate text-sm font-semibold text-foreground">
                      {veiculoAno || 'Não informado'}
                    </p>
                  )}
                </div>
              </div>

              {/* Lugares */}
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary/10">
                  <Users size={18} className="text-secondary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-foreground-muted">Lugares</p>
                  {editandoVeiculo ? (
                    <input
                      type="number"
                      value={veiculoLugares}
                      onChange={(e) => setVeiculoLugares(e.target.value)}
                      placeholder="Ex: 4"
                      className="mt-0.5 w-full rounded-xl border border-border bg-background-secondary px-3 py-2 text-sm font-semibold text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20"
                    />
                  ) : (
                    <p className="truncate text-sm font-semibold text-foreground">
                      {veiculoLugares ? `${veiculoLugares} lugares` : 'Não informado'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ═══ Card: Status ═══ */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={3}
          className="mt-6"
        >
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground-muted">
            Status e Registro
          </h2>

          <div className="mt-3 rounded-2xl border border-border bg-surface-elevated p-5 shadow-sm">
            <div className="space-y-4">
              {/* Status badge */}
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/5">
                  {status === 'aprovado' ? (
                    <ShieldCheck size={18} className="text-secondary" />
                  ) : (
                    <AlertCircle size={18} className="text-accent-dark" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-foreground-muted">Status</p>
                  <span
                    className={`mt-0.5 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${st.bg} ${st.color}`}
                  >
                    {status === 'aprovado' ? (
                      <ShieldCheck size={12} />
                    ) : (
                      <AlertCircle size={12} />
                    )}
                    {st.label}
                  </span>
                </div>
              </div>

              {/* CNH */}
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/5">
                  <CreditCard size={18} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-foreground-muted">CNH</p>
                  <p className="truncate text-sm font-semibold text-foreground">
                    {motorista?.cnh_numero || 'Não informada'}
                  </p>
                </div>
              </div>

              {/* Cidade base */}
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/5">
                  <MapPin size={18} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-foreground-muted">Cidade Base</p>
                  <p className="truncate text-sm font-semibold text-foreground">
                    {motorista?.cidade_base || 'Não informada'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ═══ Card: Estatísticas ═══ */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={4}
          className="mt-6"
        >
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground-muted">
            Estatísticas
          </h2>

          <div className="mt-3 grid grid-cols-2 gap-3">
            {/* Total corridas */}
            <StatCard
              label="Total Corridas"
              value={motorista ? String(motorista.total_corridas) : '0'}
              icon={<Car size={20} className="text-primary" />}
              iconBg="bg-primary/5"
            />

            {/* Ganho total */}
            <StatCard
              label="Ganho Total"
              value={motorista ? formatarBRL(motorista.ganho_total) : formatarBRL(0)}
              icon={<TrendingUp size={20} className="text-secondary" />}
              iconBg="bg-secondary/10"
            />

            {/* Avaliação média */}
            <div className="rounded-2xl border border-border bg-surface-elevated p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10">
                  <Star size={20} className="text-accent" />
                </div>
                <div>
                  <p className="text-lg font-extrabold text-foreground">
                    {profile.avaliacao_media ? profile.avaliacao_media.toFixed(1) : '--'}
                  </p>
                  <div className="flex items-center gap-0.5">
                    {renderEstrelas(profile.avaliacao_media ?? 0)}
                  </div>
                  <p className="text-[10px] text-foreground-muted">
                    {profile.total_avaliacoes} avaliações
                  </p>
                </div>
              </div>
            </div>

            {/* Pontos */}
            <StatCard
              label="Pontos"
              value={String(profile.pontos ?? 0)}
              icon={<Gift size={20} className="text-accent2" />}
              iconBg="bg-accent2/10"
            />
          </div>
        </motion.div>

        {/* ═══ Botão Salvar ═══ */}
        {hasChanges && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            <button
              onClick={handleSave}
              disabled={salvando}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-primary-light px-6 py-4 text-base font-bold text-white shadow-lg shadow-primary/20 transition hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.98] disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {salvando ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Salvando...
                </>
              ) : sucesso ? (
                <>
                  <CheckCircle2 size={20} />
                  Salvo com sucesso!
                </>
              ) : (
                <>
                  <Save size={20} />
                  Salvar Alterações
                </>
              )}
            </button>
          </motion.div>
        )}

        {/* ═══ Feedback de sucesso (quando não há mais edições) ═══ */}
        {sucesso && !hasChanges && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 flex items-center justify-center gap-2 rounded-2xl border border-secondary/20 bg-secondary/5 py-3 text-sm font-semibold text-secondary"
          >
            <CheckCircle2 size={18} />
            Perfil atualizado com sucesso!
          </motion.div>
        )}

        {/* ═══ Botão Sair da conta ═══ */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={5}
          className="mt-8"
        >
          <button
            onClick={async () => {
              await signOut();
              router.replace('/entrar');
            }}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-accent2/20 bg-accent2/5 px-6 py-4 text-base font-bold text-accent2 transition hover:bg-accent2/10 active:scale-[0.98]"
          >
            <LogOut size={20} />
            Sair da conta
          </button>
        </motion.div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════ */
/*  Sub-components                                            */
/* ════════════════════════════════════════════════════════════ */

function StatCard({
  label,
  value,
  icon,
  iconBg,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  iconBg: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface-elevated p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-center gap-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconBg}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="truncate text-lg font-extrabold text-foreground">{value}</p>
          <p className="text-[11px] font-medium text-foreground-muted">{label}</p>
        </div>
      </div>
    </div>
  );
}
