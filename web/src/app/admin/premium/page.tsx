'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import PageTitle from '@/components/seo/PageTitle';
import {
  Crown,
  CreditCard,
  Shield,
  GraduationCap,
  Sparkles,
  HeartPulse,
  Users,
  MapPin,
  ArrowRight,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

/* ─── tipos ─── */
interface Metricas {
  totalFundadores: number;
  assinantesAtivos: number;
  cursosAtivos: number;
  topicosComunidade: number;
}

/* ─── acesso rápido ─── */
const MODULOS = [
  {
    titulo: 'Fundadores',
    descricao: 'Motoristas fundadores com selo especial',
    href: '/admin/premium/fundadores',
    Icon: Crown,
    gradiente: 'from-amber-500 to-orange-600',
  },
  {
    titulo: 'DNA Pass',
    descricao: 'Planos e assinaturas mensais',
    href: '/admin/premium/dna-pass',
    Icon: CreditCard,
    gradiente: 'from-emerald-500 to-green-600',
  },
  {
    titulo: 'Níveis',
    descricao: 'Sistema de níveis e critérios',
    href: '/admin/premium/niveis',
    Icon: Shield,
    gradiente: 'from-blue-600 to-indigo-700',
  },
  {
    titulo: 'Cursos',
    descricao: 'Trilhas de capacitação dos motoristas',
    href: '/admin/premium/cursos',
    Icon: GraduationCap,
    gradiente: 'from-indigo-500 to-purple-600',
  },
  {
    titulo: 'Benefícios',
    descricao: 'Central de benefícios e parceiros',
    href: '/admin/premium/beneficios',
    Icon: Sparkles,
    gradiente: 'from-cyan-500 to-blue-600',
  },
  {
    titulo: 'Saúde',
    descricao: 'Parceiros de saúde e bem-estar',
    href: '/admin/premium/saude',
    Icon: HeartPulse,
    gradiente: 'from-red-500 to-rose-600',
  },
  {
    titulo: 'Comunidade',
    descricao: 'Tópicos, categorias e moderação',
    href: '/admin/premium/comunidade',
    Icon: Users,
    gradiente: 'from-teal-500 to-cyan-600',
  },
  {
    titulo: 'Demanda',
    descricao: 'Regiões e eventos de alta demanda',
    href: '/admin/premium/demanda',
    Icon: MapPin,
    gradiente: 'from-orange-500 to-red-600',
  },
] as const;

/* ─── helper: extrair count com fallback ─── */
function extrairCount(r: PromiseSettledResult<{ count: number | null }>): number {
  if (r.status === 'fulfilled') return r.value.count ?? 0;
  return 0;
}

export default function AdminPremiumDashboard() {
  const [metricas, setMetricas] = useState<Metricas | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregar() {
      const [
        fundRes,
        assinaAtivaRes,
        assinaTrialRes,
        cursosRes,
        topicosRes,
      ] = await Promise.allSettled([
        supabase.from('motoristas_fundadores').select('*', { count: 'exact', head: true }),
        supabase
          .from('dna_pass_assinaturas')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'ativa'),
        supabase
          .from('dna_pass_assinaturas')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'trial'),
        supabase.from('cursos').select('*', { count: 'exact', head: true }).eq('ativo', true),
        supabase
          .from('comunidade_topicos')
          .select('*', { count: 'exact', head: true })
          .eq('ativo', true),
      ]);

      const assinantes =
        extrairCount(assinaAtivaRes as PromiseSettledResult<{ count: number | null }>) +
        extrairCount(assinaTrialRes as PromiseSettledResult<{ count: number | null }>);

      setMetricas({
        totalFundadores: extrairCount(fundRes as PromiseSettledResult<{ count: number | null }>),
        assinantesAtivos: assinantes,
        cursosAtivos: extrairCount(cursosRes as PromiseSettledResult<{ count: number | null }>),
        topicosComunidade: extrairCount(topicosRes as PromiseSettledResult<{ count: number | null }>),
      });
      setLoading(false);
    }
    carregar();
  }, []);

  const metricaCards = [
    { label: 'Total Fundadores', valor: metricas?.totalFundadores ?? 0, Icon: Crown, gradiente: 'from-amber-500 to-orange-600' },
    { label: 'Assinantes DNA Pass', valor: metricas?.assinantesAtivos ?? 0, Icon: CreditCard, gradiente: 'from-emerald-500 to-green-600' },
    { label: 'Cursos Ativos', valor: metricas?.cursosAtivos ?? 0, Icon: GraduationCap, gradiente: 'from-indigo-500 to-purple-600' },
    { label: 'Tópicos da Comunidade', valor: metricas?.topicosComunidade ?? 0, Icon: Users, gradiente: 'from-teal-500 to-cyan-600' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageTitle title="Admin — Módulo Premium" />

      {/* ─── Cabeçalho ─── */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
          <Crown className="w-6 h-6" /> Módulo Premium
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Gerencie todos os recursos premium da plataforma
        </p>
      </div>

      {/* ─── Métricas ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {metricaCards.map((m) => (
          <div
            key={m.label}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-5"
          >
            <div className={`w-11 h-11 rounded-lg bg-gradient-to-br ${m.gradiente} flex items-center justify-center shadow-sm`}>
              <m.Icon className="w-5 h-5 text-white" />
            </div>
            {loading ? (
              <div className="mt-4">
                <div className="h-7 w-16 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-24 bg-gray-100 rounded animate-pulse mt-2" />
              </div>
            ) : (
              <>
                <p className="text-2xl font-bold text-primary mt-3">{m.valor}</p>
                <p className="text-xs text-gray-500 mt-0.5">{m.label}</p>
              </>
            )}
          </div>
        ))}
      </div>

      {/* ─── Acesso rápido ─── */}
      <h2 className="text-lg font-bold text-primary mb-4">Acesso Rápido</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {MODULOS.map((mod) => (
          <Link
            key={mod.href}
            href={mod.href}
            className="group bg-white rounded-xl shadow-sm border border-gray-100 p-5 transition-all hover:shadow-md hover:border-gray-200"
          >
            <div className={`w-11 h-11 rounded-lg bg-gradient-to-br ${mod.gradiente} flex items-center justify-center shadow-sm mb-3`}>
              <mod.Icon className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-bold text-primary text-sm">{mod.titulo}</h3>
            <p className="text-xs text-gray-500 mt-1 leading-snug">{mod.descricao}</p>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
              Acessar <ArrowRight className="w-3 h-3" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
