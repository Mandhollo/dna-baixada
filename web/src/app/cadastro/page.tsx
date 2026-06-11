'use client';
import PageTitle from '@/components/seo/PageTitle';

import { useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Car,
  Store,
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { useTranslation } from '@/components/i18n/LanguageProvider';
import type { UserRole } from '@/lib/supabase';

/* ─── colour tokens ─── */
const PRIMARY = '#0A2463';
const SECONDARY = '#14A76C';
const ACCENT = '#F5A623';

/* ─── types ─── */
type ProfileType = 'passageiro' | 'motorista' | 'parceiro';

interface ProfileOption {
  type: ProfileType;
  titleKey: string;
  descKey: string;
  icon: typeof User;
  color: string;
}

const PROFILE_OPTIONS: ProfileOption[] = [
  {
    type: 'passageiro',
    titleKey: 'register.passageiro',
    descKey: 'register.passageiro_desc',
    icon: User,
    color: SECONDARY,
  },
  {
    type: 'motorista',
    titleKey: 'register.motorista',
    descKey: 'register.motorista_desc',
    icon: Car,
    color: PRIMARY,
  },
  {
    type: 'parceiro',
    titleKey: 'register.parceiro',
    descKey: 'register.parceiro_desc',
    icon: Store,
    color: ACCENT,
  },
];

const CIDADES = [
  'Santos',
  'São Vicente',
  'Guarujá',
  'Cubatão',
  'Praia Grande',
  'Mongaguá',
  'Itanhaém',
  'Peruíbe',
];

const CATEGORIAS = [
  { value: 'restaurante', label: 'Restaurante' },
  { value: 'bar', label: 'Bar' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'pousada', label: 'Pousada' },
  { value: 'comercio', label: 'Comércio' },
  { value: 'turismo', label: 'Turismo' },
  { value: 'outro', label: 'Outro' },
];

/* ─── input mask helpers ─── */
function maskPhone(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function maskPlaca(v: string) {
  const d = v.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 7);
  if (d.length <= 3) return d;
  return `${d.slice(0, 3)}-${d.slice(3)}`;
}

function maskCNPJ(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12)
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

/* ─── reusable input component ─── */
function FormField({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  required = true,
  min,
  max,
  children,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  min?: string;
  max?: string;
  children?: React.ReactNode;
}) {
  const [showPass, setShowPass] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold" style={{ color: PRIMARY }}>
        {label}
      </label>
      <div className="relative">
        {children ?? (
          <input
            type={isPassword ? (showPass ? 'text' : 'password') : type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            required={required}
            min={min}
            max={max}
            className={`w-full rounded-xl border bg-white/80 px-4 py-3 text-sm transition-all outline-none placeholder:text-gray-400 focus:ring-2 ${
              error
                ? 'border-red-400 focus:border-red-400 focus:ring-red-200'
                : 'border-gray-200 focus:border-[#14A76C] focus:ring-[#14A76C]/20'
            }`}
          />
        )}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPass(!showPass)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
          >
            {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-500">
          <AlertCircle size={12} /> {error}
        </p>
      )}
    </div>
  );
}

/* ─── select wrapper ─── */
function FormSelect({
  label,
  value,
  onChange,
  options,
  placeholder = 'Selecione...',
  required = true,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  error?: string;
}) {
  return (
    <FormField label={label} value={value} onChange={onChange} error={error}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className={`w-full rounded-xl border bg-white/80 px-4 py-3 text-sm transition-all outline-none focus:ring-2 ${
          value
            ? 'text-gray-800'
            : 'text-gray-400'
        } ${
          error
            ? 'border-red-400 focus:border-red-400 focus:ring-red-200'
            : 'border-gray-200 focus:border-[#14A76C] focus:ring-[#14A76C]/20'
        }`}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FormField>
  );
}

/* ═══════════════════════════════════════════════════════════
   STEP 1 — Profile type selection
   ═══════════════════════════════════════════════════════════ */
function StepSelectType({
  selected,
  onSelect,
}: {
  selected: ProfileType | null;
  onSelect: (t: ProfileType) => void;
}) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-extrabold" style={{ color: PRIMARY }}>
          {t('register.como_cadastrar')}
        </h2>
        <p className="mt-2 text-gray-500 text-sm">
          {t('register.escolha_perfil')}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {PROFILE_OPTIONS.map((opt, i) => {
          const isSelected = selected === opt.type;
          const Icon = opt.icon;
          return (
            <motion.button
              key={opt.type}
              type="button"
              onClick={() => onSelect(opt.type)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              whileHover={{ y: -6, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`group relative flex flex-col items-center gap-4 rounded-2xl border-2 p-6 sm:p-8 text-center transition-all cursor-pointer ${
                isSelected
                  ? 'border-[#F5A623] bg-[#F5A623]/5 shadow-lg shadow-[#F5A623]/15'
                  : 'border-gray-200 bg-white hover:border-[#F5A623]/50 hover:shadow-md'
              }`}
            >
              {/* Check badge */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2.5 -right-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-[#F5A623] text-white shadow"
                >
                  <CheckCircle size={16} />
                </motion.div>
              )}

              <div
                className={`flex h-14 w-14 items-center justify-center rounded-xl transition-colors ${
                  isSelected ? 'text-white' : 'text-white/90 group-hover:brightness-110'
                }`}
                style={{ backgroundColor: opt.color }}
              >
                <Icon size={26} />
              </div>

              <div>
                <h3 className="font-bold text-base" style={{ color: PRIMARY }}>
                  {t(opt.titleKey)}
                </h3>
                <p className="mt-1 text-xs text-gray-500 leading-relaxed">{t(opt.descKey)}</p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   STEP 2 — Registration form
   ═══════════════════════════════════════════════════════════ */
function StepForm({
  profileType,
  onBack,
}: {
  profileType: ProfileType;
  onBack: () => void;
}) {
  const router = useRouter();
  const { signUp } = useAuth();
  const { t } = useTranslation();

  /* common fields */
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmSenha, setConfirmSenha] = useState('');

  /* motorista fields */
  const [cnh, setCnh] = useState('');
  const [veiculoModelo, setVeiculoModelo] = useState('');
  const [veiculoPlaca, setVeiculoPlaca] = useState('');
  const [veiculoCor, setVeiculoCor] = useState('');
  const [veiculoAno, setVeiculoAno] = useState('');
  const [veiculoLugares, setVeiculoLugares] = useState('');

  /* parceiro fields */
  const [cnpj, setCnpj] = useState('');
  const [nomeFantasia, setNomeFantasia] = useState('');
  const [razaoSocial, setRazaoSocial] = useState('');
  const [categoria, setCategoria] = useState('');
  const [endereco, setEndereco] = useState('');
  const [cidade, setCidade] = useState('');
  const [telComercial, setTelComercial] = useState('');
  const [site, setSite] = useState('');

  /* ui state */
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  /* validation */
  const [touched, setTouched] = useState(false);

  const senhaError =
    touched && senha && senha.length < 6
      ? t('register.min_caracteres')
      : undefined;
  const confirmError =
    touched && confirmSenha && confirmSenha !== senha
      ? t('register.senhas_nao_coincidem')
      : undefined;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setTouched(true);

    /* client validation */
    if (senha.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (senha !== confirmSenha) {
      setError('As senhas não coincidem.');
      return;
    }
    if (!nome.trim() || !email.trim()) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }

    setLoading(true);

    try {
      // Build metadata based on role
      const metadata: Record<string, string> = {
        nome: nome.trim(),
        role: profileType as UserRole,
        telefone,
      };

      if (profileType === 'motorista') {
        metadata.cnh = cnh;
        metadata.veiculo_modelo = veiculoModelo;
        metadata.veiculo_placa = veiculoPlaca;
        metadata.veiculo_cor = veiculoCor;
        metadata.veiculo_ano = veiculoAno;
        metadata.veiculo_lugares = veiculoLugares;
      }

      if (profileType === 'parceiro') {
        metadata.cnpj = cnpj;
        metadata.nome_fantasia = nomeFantasia;
        metadata.razao_social = razaoSocial;
        metadata.categoria = categoria;
        metadata.endereco = endereco;
        metadata.cidade = cidade;
        metadata.tel_comercial = telComercial;
        metadata.site = site;
      }

      const { error: signUpError } = await signUp(
        email.trim(),
        senha,
        metadata,
      );

      if (signUpError) {
        setError(signUpError);
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push('/dashboard'), 1800);
    } catch {
      setError('Erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  const profileLabel = t(PROFILE_OPTIONS.find((o) => o.type === profileType)?.titleKey ?? '');

  return (
    <motion.div
      key={`form-${profileType}`}
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Header */}
      <div className="mb-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-[#0A2463] transition mb-4"
        >
          <ArrowLeft size={16} /> {t('common.voltar')}
        </button>
        <h2 className="text-2xl sm:text-3xl font-extrabold" style={{ color: PRIMARY }}>
          {t('register.criar_conta_tipo')} {profileLabel}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          {t('register.preencha_dados')}
        </p>
      </div>

      {/* Success state */}
      {success && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-8 text-center"
        >
          <CheckCircle size={48} className="text-[#14A76C]" />
          <h3 className="text-lg font-bold" style={{ color: PRIMARY }}>
            {t('register.conta_criada')}
          </h3>
          <p className="text-sm text-gray-500">{t('register.redirecionando')}</p>
        </motion.div>
      )}

      {!success && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error banner */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </motion.div>
          )}

          {/* ─── Dados Pessoais ─── */}
          <div className="rounded-xl border border-gray-100 bg-white/60 p-5 space-y-4">
            <h3
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: SECONDARY }}
            >
              {t('register.dados_pessoais')}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <FormField
                  label={t('register.nome_completo')}
                  value={nome}
                  onChange={setNome}
                  placeholder="Seu nome completo"
                />
              </div>
              <FormField
                label={t('login.email')}
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="seu@email.com"
              />
              <FormField
                label={t('register.telefone')}
                type="tel"
                value={telefone}
                onChange={(v) => setTelefone(maskPhone(v))}
                placeholder="(XX) XXXXX-XXXX"
              />
              <FormField
                label={t('login.senha')}
                type="password"
                value={senha}
                onChange={setSenha}
                placeholder={t('register.min_caracteres')}
                error={senhaError}
              />
              <FormField
                label={t('register.confirmar_senha')}
                type="password"
                value={confirmSenha}
                onChange={setConfirmSenha}
                placeholder="Repita a senha"
                error={confirmError}
              />
            </div>
          </div>

          {/* ─── Motorista extra fields ─── */}
          {profileType === 'motorista' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-xl border border-gray-100 bg-white/60 p-5 space-y-4"
            >
              <h3
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: PRIMARY }}
              >
                {t('register.dados_veiculo')}
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label={t('register.cnh')}
                  value={cnh}
                  onChange={setCnh}
                  placeholder={t('register.cnh')}
                />
                <FormField
                  label={t('register.modelo_veiculo')}
                  value={veiculoModelo}
                  onChange={setVeiculoModelo}
                  placeholder="Ex: Toyota Corolla"
                />
                <FormField
                  label={t('register.placa_veiculo')}
                  value={veiculoPlaca}
                  onChange={(v) => setVeiculoPlaca(maskPlaca(v))}
                  placeholder="XXX-XXXX"
                />
                <FormField
                  label={t('register.cor_veiculo')}
                  value={veiculoCor}
                  onChange={setVeiculoCor}
                  placeholder="Ex: Prata"
                />
                <FormField
                  label={t('register.ano_veiculo')}
                  type="number"
                  value={veiculoAno}
                  onChange={setVeiculoAno}
                  placeholder="Ex: 2023"
                  min="1990"
                  max="2030"
                />
                <FormSelect
                  label={t('register.lugares')}
                  value={veiculoLugares}
                  onChange={setVeiculoLugares}
                  options={[
                    { value: '4', label: `4 ${t('register.x_lugares')}` },
                    { value: '6', label: `6 ${t('register.x_lugares')}` },
                    { value: '7', label: `7 ${t('register.x_lugares')}` },
                  ]}
                  placeholder={t('register.selecione')}
                />
              </div>
            </motion.div>
          )}

          {/* ─── Parceiro extra fields ─── */}
          {profileType === 'parceiro' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-xl border border-gray-100 bg-white/60 p-5 space-y-4"
            >
              <h3
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: ACCENT }}
              >
                {t('register.dados_estabelecimento')}
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label={t('register.cnpj')}
                  value={cnpj}
                  onChange={(v) => setCnpj(maskCNPJ(v))}
                  placeholder="XX.XXX.XXX/XXXX-XX"
                />
                <FormField
                  label={t('register.nome_fantasia')}
                  value={nomeFantasia}
                  onChange={setNomeFantasia}
                  placeholder="Nome fantasia do negócio"
                />
                <FormField
                  label={t('register.razao_social')}
                  value={razaoSocial}
                  onChange={setRazaoSocial}
                  placeholder="Razão social"
                />
                <FormSelect
                  label={t('register.categoria')}
                  value={categoria}
                  onChange={setCategoria}
                  options={CATEGORIAS}
                  placeholder="Selecione a categoria..."
                />
                <div className="sm:col-span-2">
                  <FormField
                    label={t('register.endereco')}
                    value={endereco}
                    onChange={setEndereco}
                    placeholder="Endereço completo"
                  />
                </div>
                <FormSelect
                  label={t('register.cidade')}
                  value={cidade}
                  onChange={setCidade}
                  options={CIDADES.map((c) => ({ value: c, label: c }))}
                  placeholder="Selecione a cidade..."
                />
                <FormField
                  label={t('register.tel_comercial')}
                  type="tel"
                  value={telComercial}
                  onChange={(v) => setTelComercial(maskPhone(v))}
                  placeholder="(XX) XXXXX-XXXX"
                />
                <FormField
                  label={t('register.site_opcional')}
                  type="url"
                  value={site}
                  onChange={setSite}
                  placeholder="https://www.seusite.com.br"
                  required={false}
                />
              </div>
            </motion.div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="relative w-full rounded-xl py-3.5 text-sm font-bold text-[#0A2463] shadow-lg shadow-[#F5A623]/25 transition-all hover:brightness-110 hover:shadow-xl hover:shadow-[#F5A623]/30 disabled:opacity-70 disabled:cursor-not-allowed"
            style={{ backgroundColor: ACCENT }}
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 size={18} className="animate-spin" />
                {t('register.criando_conta')}
              </span>
            ) : (
              t('register.criar_conta')
            )}
          </button>

          {/* Login link */}
          <p className="text-center text-sm text-gray-500">
            {t('register.ja_tem_conta')}{' '}
            <a
              href="/entrar"
              className="font-semibold hover:underline"
              style={{ color: SECONDARY }}
            >
              {t('common.entrar')}
            </a>
          </p>
        </form>
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════ */
export default function CadastroPage() {
  const { t } = useTranslation();
  const [selectedType, setSelectedType] = useState<ProfileType | null>(null);
  const [step, setStep] = useState<1 | 2>(1);

  function handleSelectType(type: ProfileType) {
    setSelectedType(type);
    setStep(2);
  }

  function handleBack() {
    setStep(1);
    setSelectedType(null);
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
        <PageTitle title={t('register.page_title')} />
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0A2463] via-[#0d2d6e] to-[#14A76C]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(245,166,35,.12),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(20,167,108,.10),transparent_50%)]" />

      {/* Decorative floating shapes */}
      <div className="absolute top-20 left-10 h-64 w-64 rounded-full bg-[#F5A623]/5 blur-3xl" />
      <div className="absolute bottom-20 right-10 h-80 w-80 rounded-full bg-[#14A76C]/5 blur-3xl" />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-2xl rounded-3xl border border-white/20 bg-white/95 p-6 shadow-2xl backdrop-blur-sm sm:p-10"
      >
        {/* Logo */}
        <div className="mb-8 text-center">
          <a href="/" className="inline-flex items-center gap-1 select-none">
            <span className="text-3xl font-extrabold tracking-tight" style={{ color: ACCENT }}>
              DNA
            </span>
            <span className="text-3xl font-semibold tracking-tight" style={{ color: PRIMARY }}>
              Baixada
            </span>
          </a>
          <p className="mt-1 text-xs text-gray-400 tracking-wide">
            Mobilidade · Turismo · Impacto Social
          </p>
        </div>

        {/* Steps */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <StepSelectType
              key="step1"
              selected={selectedType}
              onSelect={handleSelectType}
            />
          )}
          {step === 2 && selectedType && (
            <StepForm
              key="step2"
              profileType={selectedType}
              onBack={handleBack}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
