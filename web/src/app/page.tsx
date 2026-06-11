'use client';
import PageTitle from '@/components/seo/PageTitle';

import { motion } from 'framer-motion';
import {
  Car, Crown, Plane, Ship, Map, Palmtree, Building2, Bus,
  MapPin, Star, Users, Gift, Heart, Target, TrendingUp,
  Award, HandHeart, Phone, Shield, CheckCircle, ChevronRight,
  Mail, ArrowRight, Download,
} from 'lucide-react';
import { useState } from 'react';

/* ─── colour tokens ─── */
const P = '#0A2463';
const S = '#14A76C';
const A = '#F5A623';
const A2 = '#E84855';

/* ─── animation helpers ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.12, duration: 0.55, ease: 'easeOut' as const } }),
};
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

/* ════════════════════════════════════════════════════════
   1. HERO
   ════════════════════════════════════════════════════════ */
function Hero() {
  const stats = [
    { value: '25+', label: 'Motoristas' },
    { value: '6', label: 'Cidades' },
    { value: '1 000+', label: 'Corridas' },
    { value: '4.9★', label: 'Avaliação' },
  ];
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* gradient bg */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0A2463] via-[#0d2d6e] to-[#14A76C]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(245,166,35,.15),transparent_60%)]" />

      <div className="relative z-10 mx-auto max-w-5xl px-6 py-32 text-center text-white">
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="mb-4 text-sm font-semibold uppercase tracking-[.25em] text-[#F5A623]">
          Baixada Santista
        </motion.p>

        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
          Mobilidade. Turismo.<br />
          <span className="text-[#F5A623]">Impacto Social.</span>
        </motion.h1>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}
          className="mx-auto mt-6 max-w-2xl text-lg text-white/80">
          A plataforma que conecta passageiros, motoristas e turistas em toda a Baixada Santista — com tecnologia, segurança e propósito.
        </motion.p>

        {/* CTAs */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <a href="/corrida/solicitar" className="inline-flex items-center gap-2 rounded-full bg-[#F5A623] px-8 py-3.5 font-bold text-[#0A2463] shadow-lg shadow-[#F5A623]/30 transition hover:brightness-110">
            <Car size={18} /> Solicitar Corrida
          </a>
          <a href="/cadastro" className="inline-flex items-center gap-2 rounded-full border-2 border-white/30 px-8 py-3.5 font-bold text-white transition hover:bg-white/10">
            Sou Motorista <ArrowRight size={16} />
          </a>
        </motion.div>

        {/* Stats bar */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
          className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl bg-white/10 backdrop-blur-sm px-5 py-4">
              <p className="text-2xl font-extrabold text-[#F5A623]">{s.value}</p>
              <p className="text-sm text-white/70">{s.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════
   2. COMO FUNCIONA
   ════════════════════════════════════════════════════════ */
function ComoFunciona() {
  const steps = [
    { icon: MapPin, title: 'Informe seu destino', desc: 'Digite o endereço ou escolha no mapa.' },
    { icon: Car, title: 'Receba um motorista', desc: 'Motorista verificado em poucos minutos.' },
    { icon: Star, title: 'Avalie e acumule pontos', desc: 'Ganhe pontos a cada corrida.' },
  ];
  return (
    <section className="py-20 bg-white">
      <div className="mx-auto max-w-5xl px-6 text-center">
        <motion.h2 variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="text-3xl font-extrabold text-[#0A2463]">Como Funciona</motion.h2>
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="mt-12 grid gap-8 sm:grid-cols-3">
          {steps.map((s, i) => (
            <motion.div key={s.title} variants={fadeUp} custom={i}
              className="group rounded-2xl border border-gray-100 bg-gray-50 p-8 transition hover:shadow-xl hover:-translate-y-1">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#14A76C]/10 text-[#14A76C] transition group-hover:bg-[#14A76C] group-hover:text-white">
                <s.icon size={26} />
              </div>
              <h3 className="mt-5 text-lg font-bold text-[#0A2463]">{s.title}</h3>
              <p className="mt-2 text-sm text-gray-500">{s.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════
   3. SERVIÇOS
   ════════════════════════════════════════════════════════ */
function Servicos() {
  const items = [
    { icon: Car, title: 'Corrida Urbana', tag: 'Popular' },
    { icon: Crown, title: 'Executivo', tag: 'Premium' },
    { icon: Plane, title: 'Transfer Aeroporto', tag: '' },
    { icon: Ship, title: 'Transfer Cruzeiro', tag: '' },
    { icon: Map, title: 'City Tour', tag: 'Turismo' },
    { icon: Palmtree, title: 'Passeios', tag: 'Turismo' },
    { icon: Building2, title: 'Transfer Hotel', tag: '' },
    { icon: Bus, title: 'Rodoviária', tag: '' },
  ];
  return (
    <section id="corrida" className="py-20 bg-gray-50">
      <div className="mx-auto max-w-6xl px-6 text-center">
        <motion.h2 variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="text-3xl font-extrabold text-[#0A2463]">Nossos Serviços</motion.h2>
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="mt-12 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {items.map((it, i) => (
            <motion.div key={it.title} variants={fadeUp} custom={i}
              className="group relative rounded-2xl bg-white p-6 shadow-sm transition hover:-translate-y-1.5 hover:shadow-xl">
              {it.tag && <span className="absolute top-3 right-3 rounded-full bg-[#F5A623]/15 px-3 py-0.5 text-[10px] font-bold uppercase text-[#F5A623]">{it.tag}</span>}
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#0A2463]/10 text-[#0A2463] transition group-hover:bg-[#0A2463] group-hover:text-white">
                <it.icon size={22} />
              </div>
              <h3 className="mt-4 font-bold text-[#0A2463]">{it.title}</h3>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════
   4. PARA MOTORISTAS
   ════════════════════════════════════════════════════════ */
function Motoristas() {
  const benefits = [
    'Taxas justas e transparentes',
    'Participação nos resultados',
    'Incentivos em horários de pico',
    'Bonificação por avaliações',
    'Capacitação gratuita',
    'Reconhecimento e premiações',
  ];
  return (
    <section id="motorista" className="py-20 bg-white">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-2">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <span className="text-sm font-bold uppercase tracking-widest text-[#14A76C]">Para Motoristas</span>
          <h2 className="mt-2 text-3xl font-extrabold text-[#0A2463]">Motoristas Parceiros</h2>
          <p className="mt-4 text-gray-500">Junte-se à nossa rede e ganhe mais com condições que valorizam seu trabalho.</p>
          <ul className="mt-8 space-y-3">
            {benefits.map((b, i) => (
              <motion.li key={b} variants={fadeUp} custom={i} className="flex items-center gap-3 text-sm text-gray-700"
                initial="hidden" whileInView="visible" viewport={{ once: true }}>
                <CheckCircle size={18} className="shrink-0 text-[#14A76C]" /> {b}
              </motion.li>
            ))}
          </ul>
          <a href="/cadastro" className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#14A76C] px-7 py-3 font-bold text-white shadow-lg shadow-[#14A76C]/25 transition hover:brightness-110">
            Cadastre-se como Motorista <ArrowRight size={16} />
          </a>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.92 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
          className="grid grid-cols-2 gap-4">
          {[
            { icon: TrendingUp, label: 'Ganho médio +30%', color: '#14A76C' },
            { icon: Shield, label: 'Segurança 24/7', color: '#0A2463' },
            { icon: Award, label: 'Programa de reconhecimento', color: '#F5A623' },
            { icon: Users, label: 'Comunidade ativa', color: '#E84855' },
          ].map((c) => (
            <div key={c.label} className="rounded-2xl border border-gray-100 bg-gray-50 p-6 text-center">
              <c.icon size={28} className="mx-auto" style={{ color: c.color }} />
              <p className="mt-3 text-sm font-semibold text-[#0A2463]">{c.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════
   5. TURISMO
   ════════════════════════════════════════════════════════ */
function Turismo() {
  const cards = [
    { title: 'Roteiros Personalizados', desc: 'Monte o roteiro ideal para você.', color: '#0A2463' },
    { title: 'City Tours Guiados', desc: 'Conheça cada canto com guias locais.', color: '#14A76C' },
    { title: 'Experiências Gastronômicas', desc: 'Sabores da Baixada Santista.', color: '#F5A623' },
    { title: 'Passeios Ecológicos', desc: 'Trilhas, mangues e natureza.', color: '#E84855' },
  ];
  return (
    <section className="py-20 bg-gray-50">
      <div className="mx-auto max-w-5xl px-6 text-center">
        <motion.h2 variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="text-3xl font-extrabold text-[#0A2463]">Turismo na Baixada Santista</motion.h2>
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="mt-12 grid gap-6 sm:grid-cols-2">
          {cards.map((c, i) => (
            <motion.div key={c.title} variants={fadeUp} custom={i}
              className="group rounded-2xl bg-white p-8 shadow-sm text-left transition hover:-translate-y-1 hover:shadow-xl">
              <div className="mb-4 h-1.5 w-12 rounded-full" style={{ backgroundColor: c.color }} />
              <h3 className="text-lg font-bold text-[#0A2463]">{c.title}</h3>
              <p className="mt-2 text-sm text-gray-500">{c.desc}</p>
            </motion.div>
          ))}
        </motion.div>
        <a href="/turismo" className="mt-10 inline-flex items-center gap-2 font-bold text-[#14A76C] transition hover:gap-3">
          Explorar Roteiros <ChevronRight size={16} />
        </a>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════
   6. DNA SOCIAL
   ════════════════════════════════════════════════════════ */
function Social() {
  const stats = [
    { value: 'R$ 50k+', label: 'Doações realizadas' },
    { value: '20+', label: 'Campanhas' },
    { value: '500+', label: 'Voluntários' },
    { value: '8', label: 'Projetos ativos' },
  ];
  return (
    <section className="relative py-20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0A2463] via-[#1a3a7a] to-[#E84855]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(245,166,35,.12),transparent_60%)]" />
      <div className="relative z-10 mx-auto max-w-5xl px-6 text-center text-white">
        <motion.span variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="text-sm font-bold uppercase tracking-widest text-[#F5A623]">Impacto Social</motion.span>
        <motion.h2 variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="mt-2 text-3xl font-extrabold">DNA Social</motion.h2>
        <motion.p variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="mx-auto mt-4 max-w-xl text-white/70">
          Cada corrida gera impacto. Conheça as ações que transformam vidas na Baixada Santista.
        </motion.p>
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((s, i) => (
            <motion.div key={s.label} variants={fadeUp} custom={i}
              className="rounded-2xl bg-white/10 backdrop-blur-sm p-6">
              <p className="text-2xl font-extrabold text-[#F5A623]">{s.value}</p>
              <p className="mt-1 text-sm text-white/70">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>
        <a href="/social" className="mt-10 inline-flex items-center gap-2 rounded-full bg-white/15 px-7 py-3 font-bold text-white backdrop-blur transition hover:bg-white/25">
          Conheça o DNA Social <Heart size={16} />
        </a>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════
   7. RECOMPENSAS
   ════════════════════════════════════════════════════════ */
function Recompensas() {
  const cols = [
    { title: 'Passageiros', icon: Users, color: '#0A2463', items: ['Corridas frequentes', 'Avaliações', 'Indicações'] },
    { title: 'Motoristas', icon: Car, color: '#14A76C', items: ['Meta de corridas', 'Avaliação 5 estrelas', 'Horários de pico'] },
    { title: 'Parceiros', icon: HandHeart, color: '#F5A623', items: ['Indicação de clientes', 'Campanhas ativas', 'Engajamento social'] },
  ];
  return (
    <section className="py-20 bg-white">
      <div className="mx-auto max-w-5xl px-6 text-center">
        <motion.h2 variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="text-3xl font-extrabold text-[#0A2463]">Acumule Pontos, Ganhe Benefícios</motion.h2>
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="mt-12 grid gap-6 sm:grid-cols-3">
          {cols.map((c, i) => (
            <motion.div key={c.title} variants={fadeUp} custom={i}
              className="rounded-2xl border border-gray-100 bg-gray-50 p-8 text-left">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl text-white" style={{ backgroundColor: c.color }}>
                <c.icon size={20} />
              </div>
              <h3 className="mt-5 text-lg font-bold text-[#0A2463]">{c.title}</h3>
              <ul className="mt-4 space-y-2">
                {c.items.map((it) => (
                  <li key={it} className="flex items-center gap-2 text-sm text-gray-600">
                    <Gift size={14} style={{ color: c.color }} /> {it}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════
   8. BAIXADA SANTISTA
   ════════════════════════════════════════════════════════ */
function Baixada() {
  const cities = [
    { name: 'Santos', desc: 'Centro histórico e jardins' },
    { name: 'São Vicente', desc: 'Primeira vila do Brasil' },
    { name: 'Guarujá', desc: 'Praias paradisíacas' },
    { name: 'Cubatão', desc: 'Indústria e natureza' },
    { name: 'Praia Grande', desc: 'Orla modernizada' },
    { name: 'Mongaguá', desc: 'Turismo acessível' },
    { name: 'Itanhaém', desc: 'Patrimônio histórico' },
    { name: 'Peruíbe', desc: 'Ecoturismo e praias' },
  ];
  return (
    <section className="py-20 bg-gray-50">
      <div className="mx-auto max-w-6xl px-6 text-center">
        <motion.h2 variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="text-3xl font-extrabold text-[#0A2463]">Baixada Santista</motion.h2>
        <motion.p variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="mx-auto mt-3 max-w-xl text-gray-500">
          Atendemos todas as cidades da região com a mesma qualidade e dedicação.
        </motion.p>
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {cities.map((c, i) => (
            <motion.div key={c.name} variants={fadeUp} custom={i}
              className="group cursor-pointer rounded-2xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <div className="h-2 w-full rounded-full bg-gradient-to-r from-[#14A76C] to-[#0A2463] opacity-40 transition group-hover:opacity-100" />
              <h3 className="mt-4 font-bold text-[#0A2463]">{c.name}</h3>
              <p className="mt-1 text-xs text-gray-400">{c.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════
   9. CTA FINAL
   ════════════════════════════════════════════════════════ */
function CtaFinal() {
  const [installing, setInstalling] = useState(false);

  const handleInstall = async () => {
    setInstalling(true);
    const promptEvent = (window as any).deferredInstallPrompt;
    if (promptEvent) {
      promptEvent.prompt();
      await promptEvent.userChoice;
      (window as any).deferredInstallPrompt = null;
    } else {
      alert(
        'Para instalar:\n\n' +
        '📱 Android: Menu (⋮) → "Adicionar à tela inicial"\n\n' +
        '🍎 iPhone: Compartilhar (↑) → "Adicionar à Tela de Início"'
      );
    }
    setInstalling(false);
  };

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0A2463] to-[#14A76C]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(245,166,35,.18),transparent_50%)]" />
      <div className="relative z-10 mx-auto max-w-3xl px-6 text-center text-white">
        <motion.h2 variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="text-3xl font-extrabold sm:text-4xl">Pronto para se conectar com a Baixada?</motion.h2>
        <motion.p variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="mt-4 text-white/70">Instale o app no seu celular e comece agora mesmo.</motion.p>
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <button onClick={handleInstall} disabled={installing}
            className="inline-flex items-center gap-2 rounded-full bg-[#F5A623] px-8 py-3.5 font-bold text-[#0A2463] shadow-lg transition hover:brightness-110">
            <Download size={18} /> {installing ? 'Instalando...' : 'Instalar App'}
          </button>
          <a href="/cadastro" className="inline-flex items-center gap-2 rounded-full border-2 border-white/30 px-8 py-3.5 font-bold text-white transition hover:bg-white/10">
            Sou Motorista <ArrowRight size={16} />
          </a>
        </motion.div>
        {/* Trust badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-white/60">
          <span className="flex items-center gap-1.5"><Shield size={14} /> Dados protegidos</span>
          <span className="flex items-center gap-1.5"><CheckCircle size={14} /> Motoristas verificados</span>
          <span className="flex items-center gap-1.5"><Star size={14} /> Suporte 24h</span>
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════
   10. COMING SOON / EMAIL CAPTURE
   ════════════════════════════════════════════════════════ */
function ComingSoon() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  return (
    <section className="py-20 bg-white">
      <div className="mx-auto max-w-xl px-6 text-center">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#F5A623]/15">
            <Mail size={28} className="text-[#F5A623]" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-[#0A2463]">Em Breve</h2>
          <p className="mt-3 text-gray-500">Cadastre-se e seja o primeiro a saber quando o app estiver no ar.</p>
          <form onSubmit={(e) => { e.preventDefault(); if (email) setSent(true); }}
            className="mt-8 flex flex-col gap-3 sm:flex-row">
            <input type="email" required placeholder="Seu melhor e-mail"
              value={email} onChange={(e) => setEmail(e.target.value)}
              className="flex-1 rounded-full border border-gray-200 bg-gray-50 px-5 py-3 text-sm text-gray-800 outline-none focus:border-[#14A76C] focus:ring-2 focus:ring-[#14A76C]/20" />
            <button type="submit"
              className="rounded-full bg-[#0A2463] px-7 py-3 text-sm font-bold text-white transition hover:bg-[#0d2d6e]">
              {sent ? '✓ Cadastrado!' : 'Avise-me'}
            </button>
          </form>
        </motion.div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════
   PAGE
   ════════════════════════════════════════════════════════ */
export default function Home() {
  return (
    <>
      <Hero />
      <ComoFunciona />
      <Servicos />
      <Motoristas />
      <Turismo />
      <Social />
      <Recompensas />
      <Baixada />
      <CtaFinal />
      <ComingSoon />
    </>
  );
}
