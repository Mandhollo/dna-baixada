'use client';
import PageTitle from '@/components/seo/PageTitle';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin, Compass, Users, Heart, Mountain, Calendar, ArrowRight,
  Star, Coffee, Fish, Waves, Building2, Anchor, Binoculars, Palette,
  Ship, Sparkles, Clock, Banknote, ChevronRight,
} from 'lucide-react';
import { supabase, type PontoTuristico, type Roteiro, type Cruzeiro, PONTO_CATEGORIA_LABELS, ROTEIRO_TIPO_LABELS, formatarBRL } from '@/lib/supabase';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.6, ease: 'easeOut' as const },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

const categoriaIcon: Record<string, React.ReactNode> = {
  historico: <Building2 size={20} />,
  praia: <Waves size={20} />,
  natureza: <Mountain size={20} />,
  museu: <Building2 size={20} />,
  religioso: <Sparkles size={20} />,
  gastronomico: <Coffee size={20} />,
  entretenimento: <Fish size={20} />,
  mirante: <Mountain size={20} />,
  cultura: <Palette size={20} />,
  esporte: <Star size={20} />,
};

const categoriaGrad: Record<string, string> = {
  historico: 'from-[#0A2463] to-[#1a3a8a]',
  praia: 'from-[#14A76C] to-[#0d8a56]',
  natureza: 'from-[#14A76C] to-[#0A2463]',
  museu: 'from-[#F5A623] to-[#d48e1c]',
  religioso: 'from-[#0d2d73] to-[#14A76C]',
  gastronomico: 'from-[#E84855] to-[#F5A623]',
  entretenimento: 'from-[#0A2463] to-[#14A76C]',
  mirante: 'from-[#14A76C] to-[#F5A623]',
  cultura: 'from-[#F5A623] to-[#0A2463]',
  esporte: 'from-[#0d2d73] to-[#0A2463]',
};

const roteiroIcons: Record<string, React.ReactNode> = {
  familia: <Users size={28} />,
  casal: <Heart size={28} />,
  aventura: <Binoculars size={28} />,
  cultural: <Palette size={28} />,
  gastronomico: <Coffee size={28} />,
  religioso: <Sparkles size={28} />,
  noturno: <Star size={28} />,
};

export default function TurismoPage() {
  const [pontos, setPontos] = useState<PontoTuristico[]>([]);
  const [roteiros, setRoteiros] = useState<Roteiro[]>([]);
  const [cruzeiros, setCruzeiros] = useState<Cruzeiro[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from('pontos_turisticos').select('*').eq('ativo', true).order('ordem'),
      supabase.from('roteiros').select('*').eq('ativo', true).order('preco_base'),
      supabase.from('cruzeiros').select('*').eq('ativo', true).order('data_chegada').limit(3),
    ]).then(([pRes, rRes, cRes]) => {
      if (pRes.data) setPontos(pRes.data as PontoTuristico[]);
      if (rRes.data) setRoteiros(rRes.data as Roteiro[]);
      if (cRes.data) setCruzeiros(cRes.data as Cruzeiro[]);
      setLoading(false);
    });
  }, []);

  const proxCruzeiros = cruzeiros.filter(c => {
    const d = new Date(c.data_chegada);
    const hoje = new Date();
    return d >= hoje;
  });

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0A2463] via-[#0d2d73] to-[#14A76C] py-28 px-6">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-20 w-80 h-80 rounded-full bg-[#F5A623] blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-[#14A76C] blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto text-center">
          <motion.span
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-block text-sm font-semibold tracking-widest uppercase text-[#F5A623] mb-4"
          >
            Descubra a região
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight"
          >
            Turismo na{'\u00A0'}
            <span className="bg-gradient-to-r from-[#F5A623] to-[#14A76C] bg-clip-text text-transparent">
              Baixada Santista
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-6 max-w-2xl mx-auto text-lg text-white/80"
          >
            Praias paradisíacas, história rica e experiências inesquecíveis. Conheça os melhores
            pontos turísticos da região com quem mais a conhece.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45 }}
            className="mt-8 flex flex-wrap justify-center gap-3"
          >
            <a href="/turismo/booking" className="inline-flex items-center gap-2 bg-[#F5A623] hover:bg-[#e6951c] text-[#0A2463] font-bold px-6 py-3 rounded-full transition shadow-lg">
              <Calendar size={18} /> Agendar City Tour
            </a>
            <a href="/turismo/cruzeiros" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-3 rounded-full transition border border-white/20">
              <Ship size={18} /> Cruzeiros
            </a>
          </motion.div>
        </div>
      </section>

      {/* Pontos Turísticos */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={stagger} className="text-center mb-14">
            <motion.h2 variants={fadeUp} custom={0} className="text-3xl md:text-4xl font-bold text-[#0A2463]">
              Pontos Turísticos
            </motion.h2>
            <motion.div variants={fadeUp} custom={1} className="mt-3 w-16 h-1 bg-gradient-to-r from-[#14A76C] to-[#F5A623] mx-auto rounded-full" />
          </motion.div>

          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden shadow-sm animate-pulse">
                  <div className="h-44 bg-gray-200" />
                  <div className="p-5 space-y-3">
                    <div className="h-5 bg-gray-200 rounded w-2/3" />
                    <div className="h-3 bg-gray-100 rounded w-full" />
                    <div className="h-3 bg-gray-100 rounded w-4/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={stagger} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {pontos.map((ponto, i) => (
                <motion.a
                  key={ponto.id}
                  href={`/turismo/${ponto.slug}`}
                  variants={fadeUp}
                  custom={i}
                  className="group rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 bg-white"
                >
                  <div className={`relative h-44 bg-gradient-to-br ${categoriaGrad[ponto.categoria] ?? 'from-[#0A2463] to-[#14A76C]'} flex items-center justify-center`}>
                    <div className="text-white/50 group-hover:scale-110 transition-transform">
                      {categoriaIcon[ponto.categoria] ?? <MapPin size={48} />}
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex gap-2">
                      {ponto.destaque && (
                        <span className="bg-[#F5A623] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Destaque</span>
                      )}
                      {ponto.gratuito && (
                        <span className="bg-[#14A76C] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Grátis</span>
                      )}
                    </div>
                    <div className="absolute bottom-3 right-3 bg-white/20 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full">
                      {PONTO_CATEGORIA_LABELS[ponto.categoria]?.label ?? ponto.categoria}
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-[#0A2463] mb-1 group-hover:text-[#14A76C] transition-colors">
                      {ponto.nome}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
                      {ponto.descricao_curta}
                    </p>
                    <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                      <span className="flex items-center gap-1"><MapPin size={12} /> {ponto.cidade}</span>
                      <span className="flex items-center gap-1"><Clock size={12} /> {ponto.tempo_visita_minutos ?? '?'} min</span>
                      {!ponto.gratuito && ponto.preco_entrada > 0 && (
                        <span className="flex items-center gap-1"><Banknote size={12} /> {formatarBRL(ponto.preco_entrada)}</span>
                      )}
                    </div>
                  </div>
                </motion.a>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* Roteiros */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={stagger} className="text-center mb-14">
            <motion.h2 variants={fadeUp} custom={0} className="text-3xl md:text-4xl font-bold text-[#0A2463]">
              Roteiros Sugeridos
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="mt-3 text-gray-500">
              Escolha o estilo de passeio perfeito para você
            </motion.p>
          </motion.div>

          {loading ? (
            <div className="grid sm:grid-cols-2 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-7 shadow-sm animate-pulse">
                  <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-5" />
                  <div className="h-5 bg-gray-200 rounded w-1/2 mx-auto mb-3" />
                  <div className="h-3 bg-gray-100 rounded w-full" />
                </div>
              ))}
            </div>
          ) : (
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={stagger} className="grid sm:grid-cols-2 gap-6">
              {roteiros.map((roteiro, i) => {
                const cfg = ROTEIRO_TIPO_LABELS[roteiro.tipo] ?? { label: roteiro.tipo, color: '#0A2463', icon: 'compass' };
                return (
                  <motion.a
                    key={roteiro.id}
                    href={`/turismo/booking?ponto=`}
                    variants={fadeUp}
                    custom={i}
                    className="bg-white rounded-2xl p-7 shadow-sm hover:shadow-lg transition-shadow group"
                  >
                    <div
                      className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-5 group-hover:scale-110 transition-transform"
                      style={{ backgroundColor: `${cfg.color}15`, color: cfg.color }}
                    >
                      {roteiroIcons[roteiro.tipo] ?? <Compass size={28} />}
                    </div>
                    <h3 className="text-xl font-bold text-[#0A2463] mb-2 text-center">{roteiro.nome}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed text-center">{roteiro.descricao}</p>
                    <div className="mt-4 flex items-center justify-center gap-4 text-sm">
                      <span className="text-gray-500 flex items-center gap-1"><Clock size={14} /> {roteiro.duracao_horas}h</span>
                      <span className="font-bold text-[#14A76C] flex items-center gap-1"><Banknote size={14} /> {formatarBRL(roteiro.preco_base)}</span>
                      <span className="text-xs text-gray-400">{roteiro.pontos_ids.length} pontos</span>
                    </div>
                  </motion.a>
                );
              })}
            </motion.div>
          )}
        </div>
      </section>

      {/* City Tours CTA */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={stagger} className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div variants={fadeUp} custom={0}>
              <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-[#0A2463] via-[#14A76C] to-[#F5A623] flex items-center justify-center">
                <Compass className="w-24 h-24 text-white/40" />
              </div>
            </motion.div>
            <motion.div variants={fadeUp} custom={1}>
              <span className="text-sm font-semibold tracking-widest uppercase text-[#14A76C]">Exclusivo</span>
              <h2 className="text-3xl font-bold text-[#0A2463] mt-2 mb-4">City Tours com DNA</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Nossos city tours são guiados por condutores que conhecem cada detalhe da Baixada
                Santista. Roteiros personalizados com paradas nos principais pontos turísticos,
                cultura local e gastronomia regional.
              </p>
              <ul className="space-y-3 mb-6">
                {[
                  'Motoristas-guia locais certificados',
                  'Roteiros personalizáveis',
                  'Veículos confortáveis e com ar-condicionado',
                  'Saída de qualquer ponto da Baixada',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-gray-600">
                    <MapPin className="w-5 h-5 text-[#14A76C] shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <a href="/turismo/booking" className="inline-flex items-center gap-2 bg-[#0A2463] hover:bg-[#0d2d73] text-white font-bold px-6 py-3 rounded-full transition">
                Agendar City Tour <ArrowRight size={18} />
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Cruzeiros */}
      {proxCruzeiros.length > 0 && (
        <section className="py-20 px-6 bg-gradient-to-r from-[#0A2463] to-[#0d2d73]">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <Ship className="w-10 h-10 text-[#F5A623] mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-white">Próximos Cruzeiros</h2>
              <p className="mt-2 text-white/60">Chegando no Concais — Santos</p>
            </div>
            <div className="grid sm:grid-cols-3 gap-6">
              {proxCruzeiros.map((c) => (
                <div key={c.id} className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 text-white border border-white/10">
                  <p className="font-bold text-lg">{c.navio}</p>
                  <p className="text-sm text-white/60">{c.companhia}</p>
                  <div className="mt-3 space-y-1 text-sm">
                    <p className="flex items-center gap-2"><Calendar size={14} className="text-[#F5A623]" /> {new Date(c.data_chegada + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</p>
                    <p className="text-white/50">Chegada {c.hora_chegada.slice(0,5)} · Saída {c.hora_saida.slice(0,5)}</p>
                    {c.passageiros && <p className="text-white/50">~{c.passageiros} passageiros</p>}
                  </div>
                  <a href="/corrida/solicitar?tipo=transfer_cruzeiro" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#F5A623] hover:underline">
                    Reservar Transfer <ChevronRight size={12} />
                  </a>
                </div>
              ))}
            </div>
            <div className="text-center mt-8">
              <a href="/turismo/cruzeiros" className="inline-flex items-center gap-2 text-white/80 hover:text-white font-semibold transition">
                Ver todos os cruzeiros <ArrowRight size={16} />
              </a>
            </div>
          </div>
        </section>
      )}

      {/* Eventos + Links rápidos */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-[#0A2463]">Explore Mais</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            <a href="/turismo/eventos" className="group rounded-2xl border border-gray-100 p-6 text-center shadow-sm hover:shadow-lg transition-all hover:-translate-y-1">
              <Calendar className="w-10 h-10 mx-auto text-[#F5A623] group-hover:scale-110 transition-transform" />
              <h3 className="mt-3 font-bold text-[#0A2463]">Eventos</h3>
              <p className="mt-1 text-sm text-gray-500">Shows, feiras e festivais</p>
            </a>
            <a href="/turismo/cruzeiros" className="group rounded-2xl border border-gray-100 p-6 text-center shadow-sm hover:shadow-lg transition-all hover:-translate-y-1">
              <Ship className="w-10 h-10 mx-auto text-[#0A2463] group-hover:scale-110 transition-transform" />
              <h3 className="mt-3 font-bold text-[#0A2463]">Cruzeiros</h3>
              <p className="mt-1 text-sm text-gray-500">Calendário de navios</p>
            </a>
            <a href="/turismo/booking" className="group rounded-2xl border border-gray-100 p-6 text-center shadow-sm hover:shadow-lg transition-all hover:-translate-y-1">
              <Compass className="w-10 h-10 mx-auto text-[#14A76C] group-hover:scale-110 transition-transform" />
              <h3 className="mt-3 font-bold text-[#0A2463]">City Tours</h3>
              <p className="mt-1 text-sm text-gray-500">Agende seu passeio</p>
            </a>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-6 bg-gradient-to-r from-[#0A2463] to-[#14A76C]">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="max-w-3xl mx-auto text-center">
          <Calendar className="w-12 h-12 text-[#F5A623] mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Agende seu City Tour</h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">
            Viva a Baixada Santista como nunca antes. Agende um city tour exclusivo com nossos condutores locais.
          </p>
          <a href="/turismo/booking" className="inline-flex items-center gap-2 bg-[#F5A623] hover:bg-[#e6951c] text-[#0A2463] font-bold px-8 py-4 rounded-full transition-colors shadow-lg">
            Agendar City Tour <ArrowRight size={18} />
          </a>
        </motion.div>
      </section>
    </div>
  );
}
