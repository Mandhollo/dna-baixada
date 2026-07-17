'use client';

import PageTitle from '@/components/seo/PageTitle';
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft,
  GraduationCap,
  Clock,
  BookOpen,
  Star,
  User,
  Crown,
  Loader2,
  CheckCircle2,
  Award,
  XCircle,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/lib/supabase';
import type {
  Curso,
  CursoProgresso,
  CursoCategoria,
  CursoNivel,
  CursoModulo,
} from '@/lib/supabase';
import {
  CURSO_CATEGORIA_LABELS,
  CURSO_NIVEL_LABELS,
} from '@/lib/supabase';

// ─── Animações ───────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: 'easeOut' as const },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.06 } },
};

// ─── Cores de nível ──────────────────────────────────────────
const NIVEL_COLOR_HEX: Record<CursoNivel, string> = {
  basico: '#14A76C', // secondary
  intermediario: '#F5A623', // accent
  avancado: '#E84855', // accent2
};

const NIVEL_LABEL_FALLBACK: Record<CursoNivel, string> = {
  basico: 'Básico',
  intermediario: 'Intermediário',
  avancado: 'Avançado',
};

// ─── Helpers de fallback ────────────────────────────────────
function makeModulos(count: number, cargaHorariaHoras: number): CursoModulo[] {
  const dur = Math.round((cargaHorariaHoras * 60) / Math.max(count, 1));
  return Array.from({ length: count }, (_, i) => ({
    titulo: `Módulo ${i + 1}`,
    duracao_min: dur,
  }));
}

// ─── Fallback data (7 cursos) ───────────────────────────────
const FALLBACK_CURSOS: Curso[] = [
  {
    id: 'direcao-defensiva',
    titulo: 'Direção Defensiva na Prática',
    slug: 'direcao-defensiva',
    descricao:
      'Aprenda técnicas avançadas de direção defensiva para reduzir riscos, evitar acidentes e dirigir com mais segurança em qualquer condição de trânsito.',
    descricao_curta: 'Técnicas para reduzir riscos no trânsito',
    categoria: 'direcao_defensiva',
    carga_horaria_horas: 4,
    nivel: 'basico',
    modulos: makeModulos(4, 4),
    total_modulos: 4,
    imagem_url: null,
    video_intro_url: null,
    pontos_recompensa: 80,
    certificado_disponivel: true,
    nivel_minimo: null,
    dna_pass_exclusivo: false,
    instrutor_nome: 'Carlos Mendes',
    instrutor_bio: null,
    ativo: true,
    destaque: false,
    ordem: 1,
    total_matriculas: 0,
    total_concluidos: 0,
  },
  {
    id: 'atendimento-turista',
    titulo: 'Atendimento ao Turista',
    slug: 'atendimento-turista',
    descricao:
      'Encante seus passageiros turistas. Aprenda postura, comunicação, dicas locais e como transformar uma corrida em uma experiência memorável.',
    descricao_curta: 'Postura e comunicação para turistas',
    categoria: 'atendimento',
    carga_horaria_horas: 3,
    nivel: 'basico',
    modulos: makeModulos(3, 3),
    total_modulos: 3,
    imagem_url: null,
    video_intro_url: null,
    pontos_recompensa: 60,
    certificado_disponivel: true,
    nivel_minimo: null,
    dna_pass_exclusivo: false,
    instrutor_nome: 'Ana Paula',
    instrutor_bio: null,
    ativo: true,
    destaque: false,
    ordem: 2,
    total_matriculas: 0,
    total_concluidos: 0,
  },
  {
    id: 'primeiros-socorros',
    titulo: 'Primeiros Socorros para Motoristas',
    slug: 'primeiros-socorros',
    descricao:
      'Saiba como agir em emergências. Curso completo de primeiros socorros focado em situações do dia a dia do motorista de aplicativo.',
    descricao_curta: 'Aja em emergências com segurança',
    categoria: 'primeiros_socorros',
    carga_horaria_horas: 5,
    nivel: 'intermediario',
    modulos: makeModulos(5, 5),
    total_modulos: 5,
    imagem_url: null,
    video_intro_url: null,
    pontos_recompensa: 100,
    certificado_disponivel: true,
    nivel_minimo: null,
    dna_pass_exclusivo: false,
    instrutor_nome: 'Dr. Roberto Lima',
    instrutor_bio: null,
    ativo: true,
    destaque: false,
    ordem: 3,
    total_matriculas: 0,
    total_concluidos: 0,
  },
  {
    id: 'ingles-basico',
    titulo: 'Inglês Básico para Motoristas',
    slug: 'ingles-basico',
    descricao:
      'Comunique-se com passageiros estrangeiros. Inglês prático com frases e vocabulário essenciais para o dia a dia do motorista.',
    descricao_curta: 'Inglês prático para o dia a dia',
    categoria: 'idiomas',
    carga_horaria_horas: 6,
    nivel: 'basico',
    modulos: makeModulos(6, 6),
    total_modulos: 6,
    imagem_url: null,
    video_intro_url: null,
    pontos_recompensa: 120,
    certificado_disponivel: true,
    nivel_minimo: null,
    dna_pass_exclusivo: false,
    instrutor_nome: 'Sarah Johnson',
    instrutor_bio: null,
    ativo: true,
    destaque: false,
    ordem: 4,
    total_matriculas: 0,
    total_concluidos: 0,
  },
  {
    id: 'educacao-financeira',
    titulo: 'Educação Financeira: Aumente Ganhos',
    slug: 'educacao-financeira',
    descricao:
      'Controle suas finanças, reduza custos e aumente seus ganhos. Aprenda a gerir sua renda como motorista de aplicativo.',
    descricao_curta: 'Gestão financeira para motoristas',
    categoria: 'educacao_financeira',
    carga_horaria_horas: 4,
    nivel: 'basico',
    modulos: makeModulos(4, 4),
    total_modulos: 4,
    imagem_url: null,
    video_intro_url: null,
    pontos_recompensa: 100,
    certificado_disponivel: true,
    nivel_minimo: null,
    dna_pass_exclusivo: false,
    instrutor_nome: 'Marcos Finance',
    instrutor_bio: null,
    ativo: true,
    destaque: false,
    ordem: 5,
    total_matriculas: 0,
    total_concluidos: 0,
  },
  {
    id: 'marketing-pessoal',
    titulo: 'Marketing Pessoal para Motoristas',
    slug: 'marketing-pessoal',
    descricao:
      'Construa sua marca pessoal como motorista. Destaque-se da concorrência, ganhe avaliações 5 estrelas e fidelize clientes.',
    descricao_curta: 'Construa sua marca como motorista',
    categoria: 'marketing',
    carga_horaria_horas: 3,
    nivel: 'intermediario',
    modulos: makeModulos(3, 3),
    total_modulos: 3,
    imagem_url: null,
    video_intro_url: null,
    pontos_recompensa: 80,
    certificado_disponivel: true,
    nivel_minimo: 'prata' as Curso['nivel_minimo'],
    dna_pass_exclusivo: false,
    instrutor_nome: 'Júlia Marketing',
    instrutor_bio: null,
    ativo: true,
    destaque: false,
    ordem: 6,
    total_matriculas: 0,
    total_concluidos: 0,
  },
  {
    id: 'espanhol-basico',
    titulo: 'Espanhol Básico para Motoristas',
    slug: 'espanhol-basico',
    descricao:
      'Atenda passageiros hispano-falantes com confiança. Espanhol prático com frases e vocabulário do dia a dia do motorista.',
    descricao_curta: 'Espanhol prático para motoristas',
    categoria: 'idiomas',
    carga_horaria_horas: 5,
    nivel: 'basico',
    modulos: makeModulos(5, 5),
    total_modulos: 5,
    imagem_url: null,
    video_intro_url: null,
    pontos_recompensa: 100,
    certificado_disponivel: true,
    nivel_minimo: null,
    dna_pass_exclusivo: false,
    instrutor_nome: 'Carmen Ruiz',
    instrutor_bio: null,
    ativo: true,
    destaque: false,
    ordem: 7,
    total_matriculas: 0,
    total_concluidos: 0,
  },
];

// ─── Filtros de categoria ───────────────────────────────────
type CategoriaFiltro = CursoCategoria | 'todos';

const FILTROS: { id: CategoriaFiltro; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'direcao_defensiva', label: 'Direção Defensiva' },
  { id: 'atendimento', label: 'Atendimento' },
  { id: 'primeiros_socorros', label: 'Primeiros Socorros' },
  { id: 'idiomas', label: 'Idiomas' },
  { id: 'educacao_financeira', label: 'Educação Financeira' },
  { id: 'marketing', label: 'Marketing' },
];

// ─── Componente ──────────────────────────────────────────────
export default function EducacaoPage() {
  const { user, loading: authLoading } = useAuth();
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [progressoMap, setProgressoMap] = useState<Record<string, CursoProgresso>>({});
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<CategoriaFiltro>('todos');
  const [matriculandoId, setMatriculandoId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [cursoMatriculadoNome, setCursoMatriculadoNome] = useState('');

  // ─── Buscar cursos + progresso ────────────────────────────
  const fetchDados = async () => {
    // Cursos
    try {
      const { data } = await supabase
        .from('cursos')
        .select('*')
        .eq('ativo', true)
        .order('ordem', { ascending: true });
      if (data && data.length > 0) setCursos(data as Curso[]);
    } catch (e) {
      console.warn('Erro ao buscar cursos:', e);
    }

    // Progresso do usuário
    if (!user) {
      setProgressoMap({});
      return;
    }
    try {
      const { data } = await supabase
        .from('curso_progresso')
        .select('*, curso:cursos(*)')
        .eq('motorista_id', user.id)
        .neq('status', 'abandonado');
      if (data) {
        const map: Record<string, CursoProgresso> = {};
        (data as CursoProgresso[]).forEach((p) => {
          map[p.curso_id] = p;
        });
        setProgressoMap(map);
      }
    } catch (e) {
      console.warn('Erro ao buscar progresso:', e);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      await fetchDados();
      if (mounted) setLoading(false);
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const cursosDisplay = cursos.length > 0 ? cursos : FALLBACK_CURSOS;

  const cursosFiltrados = useMemo(() => {
    if (filtro === 'todos') return cursosDisplay;
    return cursosDisplay.filter((c) => c.categoria === filtro);
  }, [cursosDisplay, filtro]);

  // ─── Matrícula ────────────────────────────────────────────
  const handleMatricular = async (curso: Curso) => {
    if (!user) return;
    setMatriculandoId(curso.id);
    try {
      const { error } = await supabase.from('curso_progresso').insert({
        curso_id: curso.id,
        motorista_id: user.id,
        status: 'matriculado',
        modulos_concluidos: [],
        progresso_percentual: 0,
        matriculado_em: new Date().toISOString(),
      });

      if (error) throw error;

      await fetchDados();
      setCursoMatriculadoNome(curso.titulo);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    } catch (err) {
      console.error('Erro ao matricular:', err);
      alert('Erro ao processar matrícula. Tente novamente.');
    } finally {
      setMatriculandoId(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <PageTitle title="Educação" />

      {/* ─── Hero ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 py-20 px-6">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-72 h-72 rounded-full bg-accent blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-64 h-64 rounded-full bg-secondary blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto">
          <Link
            href="/premium"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm font-medium mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Premium
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2, type: 'spring' }}
              className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center mx-auto mb-6"
            >
              <GraduationCap className="w-8 h-8 text-white" />
            </motion.div>

            <motion.span
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="inline-block text-sm font-semibold tracking-widest uppercase text-white/90 mb-3"
            >
              Capacitação Profissional
            </motion.span>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight">
              Educação
            </h1>
            <p className="mt-4 max-w-xl mx-auto text-lg text-white/80">
              Capacitação que valoriza sua carreira
            </p>
          </motion.div>

          {/* Resumo — apenas logado */}
          {user && !authLoading && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="mt-10 grid grid-cols-3 gap-4 max-w-lg mx-auto"
            >
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 text-center">
                <BookOpen className="w-5 h-5 text-accent mx-auto mb-1.5" />
                <p className="text-white/50 text-xs font-medium uppercase tracking-wider">
                  Matriculados
                </p>
                <p className="text-white font-bold text-lg">
                  {Object.values(progressoMap).filter(
                    (p) => p.status !== 'concluido',
                  ).length}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 text-center">
                <Award className="w-5 h-5 text-secondary mx-auto mb-1.5" />
                <p className="text-white/50 text-xs font-medium uppercase tracking-wider">
                  Concluídos
                </p>
                <p className="text-white font-bold text-lg">
                  {Object.values(progressoMap).filter(
                    (p) => p.status === 'concluido',
                  ).length}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 text-center">
                <Star className="w-5 h-5 text-accent mx-auto mb-1.5" />
                <p className="text-white/50 text-xs font-medium uppercase tracking-wider">
                  Pontos
                </p>
                <p className="text-white font-bold text-lg">
                  {Object.values(progressoMap)
                    .filter((p) => p.status === 'concluido')
                    .reduce(
                      (acc, p) => acc + (p.curso?.pontos_recompensa ?? 0),
                      0,
                    )}
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* ─── Filtros + Grid ───────────────────────────────── */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
            className="text-center mb-10"
          >
            <motion.h2
              variants={fadeUp}
              custom={0}
              className="text-3xl md:text-4xl font-bold text-primary"
            >
              Cursos Disponíveis
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={1}
              className="mt-3 text-gray-500 max-w-xl mx-auto"
            >
              Evolua profissionalmente com cursos práticos e certificados.
            </motion.p>
          </motion.div>

          {/* Filtros por categoria */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {FILTROS.map((f) => {
              const ativo = filtro === f.id;
              const catInfo =
                f.id !== 'todos' ? CURSO_CATEGORIA_LABELS[f.id as CursoCategoria] : null;
              return (
                <button
                  key={f.id}
                  onClick={() => setFiltro(f.id)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    ativo
                      ? 'text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  style={
                    ativo && catInfo
                      ? { backgroundColor: catInfo.color }
                      : ativo
                        ? { backgroundColor: '#0A2463' }
                        : undefined
                  }
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          {/* Grid de cursos */}
          <motion.div
            key={filtro}
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {cursosFiltrados.map((curso, i) => {
              const progresso = progressoMap[curso.id];
              const estaMatriculado = !!progresso;
              const estaConcluido = progresso?.status === 'concluido';
              const catLabel = CURSO_CATEGORIA_LABELS[curso.categoria];
              const nivelLabel =
                CURSO_NIVEL_LABELS[curso.nivel]?.label ||
                NIVEL_LABEL_FALLBACK[curso.nivel];
              const nivelCor = NIVEL_COLOR_HEX[curso.nivel];

              return (
                <motion.div
                  key={curso.id}
                  variants={fadeUp}
                  custom={i}
                  className="flex flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:border-gray-200"
                >
                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: nivelCor }}
                    >
                      {nivelLabel}
                    </span>
                    <span
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={{
                        backgroundColor: `${catLabel.color}15`,
                        color: catLabel.color,
                      }}
                    >
                      {catLabel.label}
                    </span>
                    {curso.dna_pass_exclusivo && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-secondary to-secondary-dark text-white">
                        <Crown className="w-3 h-3" />
                        DNA Pass
                      </span>
                    )}
                    {estaConcluido && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-secondary/15 text-secondary">
                        <CheckCircle2 className="w-3 h-3" />
                        Concluído
                      </span>
                    )}
                  </div>

                  {/* Título */}
                  <h3 className="text-lg font-bold text-primary mb-2 leading-snug">
                    {curso.titulo}
                  </h3>

                  {/* Descrição */}
                  <p className="text-sm text-gray-500 mb-4 flex-1">
                    {curso.descricao_curta || curso.descricao}
                  </p>

                  {/* Meta info */}
                  <div className="grid grid-cols-2 gap-y-2 gap-x-3 text-xs text-gray-600 mb-4">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="font-medium">
                        {curso.carga_horaria_horas}h
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="font-medium">
                        {curso.total_modulos} módulos
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 text-accent shrink-0" />
                      <span className="font-medium">
                        {curso.pontos_recompensa} pts
                      </span>
                    </div>
                    {curso.instrutor_nome && (
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="font-medium truncate">
                          {curso.instrutor_nome}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Progresso ou matrícula */}
                  {estaConcluido ? (
                    <div className="space-y-2">
                      {progresso?.certificado_url ? (
                        <Link
                          href={progresso.certificado_url}
                          target="_blank"
                          className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm bg-secondary/10 text-secondary hover:bg-secondary/20 transition-all"
                        >
                          <Award className="w-4 h-4" />
                          Baixar Certificado
                        </Link>
                      ) : (
                        <div className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm bg-secondary/10 text-secondary">
                          <Award className="w-4 h-4" />
                          Certificado Disponível
                        </div>
                      )}
                    </div>
                  ) : estaMatriculado ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-gray-500">
                          {progresso.status === 'em_andamento'
                            ? 'Em andamento'
                            : 'Matriculado'}
                        </span>
                        <span className="font-bold text-primary">
                          {progresso.progresso_percentual}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{
                            width: `${progresso.progresso_percentual}%`,
                          }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className="h-full bg-gradient-to-r from-secondary to-accent"
                        />
                      </div>
                      <Link
                        href={`/premium/educacao/${curso.slug}`}
                        className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm bg-primary text-white hover:bg-primary-dark transition-all"
                      >
                        Continuar Curso
                      </Link>
                    </div>
                  ) : user ? (
                    <button
                      onClick={() => handleMatricular(curso)}
                      disabled={matriculandoId === curso.id}
                      className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm bg-primary text-white hover:bg-primary-dark transition-all disabled:opacity-50"
                    >
                      {matriculandoId === curso.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Matriculando…
                        </>
                      ) : (
                        <>
                          <GraduationCap className="w-4 h-4" />
                          Matricular-se
                        </>
                      )}
                    </button>
                  ) : (
                    <Link
                      href="/entrar"
                      className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm bg-primary text-white hover:bg-primary-dark transition-all"
                    >
                      <GraduationCap className="w-4 h-4" />
                      Matricular-se
                    </Link>
                  )}
                </motion.div>
              );
            })}
          </motion.div>

          {cursosFiltrados.length === 0 && !loading && (
            <div className="text-center py-16 text-gray-400">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-40" />
              <p className="font-medium">Nenhum curso nesta categoria.</p>
            </div>
          )}
        </div>
      </section>

      {/* ─── CTA não-logado ────────────────────────────────── */}
      {!user && !authLoading && (
        <section className="py-16 px-6 bg-gray-50 border-t border-gray-100">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-primary mb-3">
                Pronto para evoluir?
              </h2>
              <p className="text-gray-500 mb-6">
                Faça login para se matricular nos cursos e acompanhar seu
                progresso com certificados.
              </p>
              <Link
                href="/entrar"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-white shadow-lg hover:bg-primary-dark transition-all"
              >
                Entrar na plataforma
              </Link>
            </motion.div>
          </div>
        </section>
      )}

      {/* ─── Toast de sucesso ─────────────────────────────── */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-secondary text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 max-w-sm"
          >
            <CheckCircle2 className="w-6 h-6 shrink-0" />
            <div className="flex-1">
              <p className="font-bold text-sm">Matrícula realizada!</p>
              <p className="text-white/80 text-xs mt-0.5">
                {cursoMatriculadoNome}
              </p>
            </div>
            <button
              onClick={() => setShowSuccess(false)}
              className="text-white/70 hover:text-white"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
