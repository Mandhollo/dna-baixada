'use client';
import PageTitle from '@/components/seo/PageTitle';
import Link from 'next/link';

import { motion } from 'framer-motion';
import {
  Car, Crown, Plane, Ship, Map, Palmtree, Building2, Bus,
  MapPin, Star, Users, Gift, Heart, Target, TrendingUp,
  Award, HandHeart, Phone, Shield, CheckCircle, ChevronRight,
  Mail, ArrowRight, Download,
  CreditCard, Sparkles, HeartPulse, GraduationCap, Bot,
  Leaf,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from '@/components/i18n/LanguageProvider';

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
  const { t } = useTranslation();
  const stats = [
    { value: '25+', labelKey: 'home.stat_motoristas' },
    { value: '6', labelKey: 'home.stat_cidades' },
    { value: '1 000+', labelKey: 'home.stat_corridas' },
    { value: '4.9★', labelKey: 'home.stat_avaliacao' },
    { value: '14', labelKey: 'home.stat_premium' },
  ];
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* gradient bg */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-light to-secondary" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(245,166,35,.15),transparent_60%)]" />

      <div className="relative z-10 mx-auto max-w-5xl px-6 py-32 text-center text-white">
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="mb-4 text-sm font-semibold uppercase tracking-[.25em] text-accent">
          {t('home.hero_badge')}
        </motion.p>

        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
          {t('home.hero_title_1')}<br />
          <span className="text-accent">{t('home.hero_title_2')}</span>
        </motion.h1>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}
          className="mx-auto mt-6 max-w-2xl text-lg text-white/80">
          {t('home.hero_subtitle')}
        </motion.p>

        {/* CTAs */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link href="/corrida/solicitar" className="inline-flex items-center gap-2 rounded-full bg-accent px-8 py-3.5 font-bold text-primary shadow-lg shadow-accent/30 transition hover:brightness-110">
            <Car size={18} /> {t('common.solicitar_corrida')}
          </Link>
          <Link href="/cadastro" className="inline-flex items-center gap-2 rounded-full border-2 border-white/30 px-8 py-3.5 font-bold text-white transition hover:bg-white/10">
            {t('home.cta_motorista')} <ArrowRight size={16} />
          </Link>
        </motion.div>

        {/* Stats bar */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
          className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {stats.map((s) => (
            <div key={s.labelKey} className="rounded-2xl bg-white/10 backdrop-blur-sm px-5 py-4">
              <p className="text-2xl font-extrabold text-accent">{s.value}</p>
              <p className="text-sm text-white/70">{t(s.labelKey)}</p>
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
  const { t } = useTranslation();
  const steps = [
    { icon: MapPin, titleKey: 'home.step1_title', descKey: 'home.step1_desc' },
    { icon: Car, titleKey: 'home.step2_title', descKey: 'home.step2_desc' },
    { icon: Star, titleKey: 'home.step3_title', descKey: 'home.step3_desc' },
  ];
  return (
    <section className="py-20 bg-white">
      <div className="mx-auto max-w-5xl px-6 text-center">
        <motion.h2 variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="text-3xl font-extrabold text-primary">{t('home.como_funciona')}</motion.h2>
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="mt-12 grid gap-8 sm:grid-cols-3">
          {steps.map((s, i) => (
            <motion.div key={s.titleKey} variants={fadeUp} custom={i}
              className="group rounded-2xl border border-gray-100 bg-gray-50 p-8 transition hover:shadow-xl hover:-translate-y-1">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-secondary/10 text-secondary transition group-hover:bg-secondary group-hover:text-white">
                <s.icon size={26} />
              </div>
              <h3 className="mt-5 text-lg font-bold text-primary">{t(s.titleKey)}</h3>
              <p className="mt-2 text-sm text-gray-500">{t(s.descKey)}</p>
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
  const { t } = useTranslation();
  const items = [
    { icon: Car, titleKey: 'home.svc_corrida_urbana', tagKey: 'home.tag_popular' },
    { icon: Crown, titleKey: 'home.svc_executivo', tagKey: 'home.tag_premium' },
    { icon: Leaf, titleKey: 'home.svc_eletrico', tagKey: 'home.tag_eco' },
    { icon: Plane, titleKey: 'home.svc_transfer_aeroporto', tagKey: '' },
    { icon: Ship, titleKey: 'home.svc_transfer_cruzeiro', tagKey: '' },
    { icon: Map, titleKey: 'home.svc_city_tour', tagKey: 'home.tag_turismo' },
    { icon: Palmtree, titleKey: 'home.svc_passeios', tagKey: 'home.tag_turismo' },
    { icon: Building2, titleKey: 'home.svc_transfer_hotel', tagKey: '' },
    { icon: Bus, titleKey: 'home.svc_rodoviaria', tagKey: '' },
  ];
  return (
    <section id="corrida" className="py-20 bg-gray-50">
      <div className="mx-auto max-w-6xl px-6 text-center">
        <motion.h2 variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="text-3xl font-extrabold text-primary">{t('home.nossos_servicos')}</motion.h2>
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="mt-12 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {items.map((it, i) => (
            <motion.div key={it.titleKey} variants={fadeUp} custom={i}
              className="group relative rounded-2xl bg-white p-6 shadow-sm transition hover:-translate-y-1.5 hover:shadow-xl">
              {it.tagKey && <span className="absolute top-3 right-3 rounded-full bg-accent/15 px-3 py-0.5 text-[10px] font-bold uppercase text-accent">{t(it.tagKey)}</span>}
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-white">
                <it.icon size={22} />
              </div>
              <h3 className="mt-4 font-bold text-primary">{t(it.titleKey)}</h3>
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
  const { t } = useTranslation();
  const benefits = [
    'home.benefit_taxas',
    'home.benefit_participacao',
    'home.benefit_incentivos',
    'home.benefit_bonificacao',
    'home.benefit_capacitacao',
    'home.benefit_reconhecimento',
  ];
  return (
    <section id="motorista" className="py-20 bg-white">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-2">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <span className="text-sm font-bold uppercase tracking-widest text-secondary">{t('home.para_motoristas')}</span>
          <h2 className="mt-2 text-3xl font-extrabold text-primary">{t('home.motoristas_parceiros')}</h2>
          <p className="mt-4 text-gray-500">{t('home.motoristas_desc')}</p>
          <ul className="mt-8 space-y-3">
            {benefits.map((b, i) => (
              <motion.li key={b} variants={fadeUp} custom={i} className="flex items-center gap-3 text-sm text-gray-700"
                initial="hidden" whileInView="visible" viewport={{ once: true }}>
                <CheckCircle size={18} className="shrink-0 text-secondary" /> {t(b)}
              </motion.li>
            ))}
          </ul>
          <Link href="/cadastro" className="mt-8 inline-flex items-center gap-2 rounded-full bg-secondary px-7 py-3 font-bold text-white shadow-lg shadow-secondary/25 transition hover:brightness-110">
            {t('home.cadastre_motorista')} <ArrowRight size={16} />
          </Link>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.92 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
          className="grid grid-cols-2 gap-4">
          {[
            { icon: TrendingUp, labelKey: 'home.card_ganho', color: '#14A76C' },
            { icon: Shield, labelKey: 'home.card_seguranca', color: '#0A2463' },
            { icon: Award, labelKey: 'home.card_reconhecimento', color: '#F5A623' },
            { icon: Users, labelKey: 'home.card_comunidade', color: '#E84855' },
          ].map((c) => (
            <div key={c.labelKey} className="rounded-2xl border border-gray-100 bg-gray-50 p-6 text-center">
              <c.icon size={28} className="mx-auto" style={{ color: c.color }} />
              <p className="mt-3 text-sm font-semibold text-primary">{t(c.labelKey)}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════
   4.5. DNA PREMIUM BANNER
   ════════════════════════════════════════════════════════ */
function PremiumBanner() {
  const modules = [
    { icon: Crown, label: 'Fundadores' },
    { icon: Shield, label: 'Níveis' },
    { icon: CreditCard, label: 'DNA Pass' },
    { icon: Sparkles, label: 'Benefícios' },
    { icon: HeartPulse, label: 'Saúde' },
    { icon: GraduationCap, label: 'Cursos' },
    { icon: Users, label: 'Comunidade' },
    { icon: Bot, label: 'IA' },
  ];
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-dark to-[#0d2d73] py-20">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-accent blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-secondary blur-3xl" />
      </div>
      <div className="relative mx-auto max-w-5xl px-6 text-center">
        <motion.span
          initial={{ opacity: 0, y: -10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-accent"
        >
          <Crown size={16} /> DNA Premium
        </motion.span>
        <motion.h2
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="mt-3 text-3xl font-extrabold text-white sm:text-4xl md:text-5xl"
        >
          Mais que corridas.<br />
          <span className="text-accent">Uma plataforma completa para motoristas.</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
          className="mx-auto mt-5 max-w-2xl text-lg text-white/70"
        >
          Fundadores, níveis, benefícios, saúde, educação, comunidade, IA e muito mais.
          Tudo pensado para valorizar quem está na estrada.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}
          className="mt-10 grid grid-cols-4 gap-3 sm:grid-cols-8"
        >
          {modules.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
              transition={{ delay: 0.3 + i * 0.05 }}
              className="flex flex-col items-center gap-2 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-3"
            >
              <m.icon size={20} className="text-accent" />
              <span className="text-[10px] font-medium text-white/60 sm:text-xs">{m.label}</span>
            </motion.div>
          ))}
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.8 }}
          className="mt-10"
        >
          <Link href="/sobre/premium" className="inline-flex items-center gap-2 rounded-full bg-accent px-8 py-3.5 font-bold text-primary shadow-lg shadow-accent/30 transition hover:brightness-110">
            <Crown size={18} /> Conhecer o Módulo Premium <ArrowRight size={16} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════
   5. TURISMO
   ════════════════════════════════════════════════════════ */
function Turismo() {
  const { t } = useTranslation();
  const cards = [
    { titleKey: 'home.tur_card1_title', descKey: 'home.tur_card1_desc', color: '#0A2463' },
    { titleKey: 'home.tur_card2_title', descKey: 'home.tur_card2_desc', color: '#14A76C' },
    { titleKey: 'home.tur_card3_title', descKey: 'home.tur_card3_desc', color: '#F5A623' },
    { titleKey: 'home.tur_card4_title', descKey: 'home.tur_card4_desc', color: '#E84855' },
  ];
  return (
    <section className="py-20 bg-gray-50">
      <div className="mx-auto max-w-5xl px-6 text-center">
        <motion.h2 variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="text-3xl font-extrabold text-primary">{t('home.turismo_baixada')}</motion.h2>
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="mt-12 grid gap-6 sm:grid-cols-2">
          {cards.map((c, i) => (
            <motion.div key={c.titleKey} variants={fadeUp} custom={i}
              className="group rounded-2xl bg-white p-8 shadow-sm text-left transition hover:-translate-y-1 hover:shadow-xl">
              <div className="mb-4 h-1.5 w-12 rounded-full" style={{ backgroundColor: c.color }} />
              <h3 className="text-lg font-bold text-primary">{t(c.titleKey)}</h3>
              <p className="mt-2 text-sm text-gray-500">{t(c.descKey)}</p>
            </motion.div>
          ))}
        </motion.div>
        <Link href="/turismo" className="mt-10 inline-flex items-center gap-2 font-bold text-secondary transition hover:gap-3">
          {t('home.explorar_roteiros')} <ChevronRight size={16} />
        </Link>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════
   6. DNA SOCIAL
   ════════════════════════════════════════════════════════ */
function Social() {
  const { t } = useTranslation();
  const stats = [
    { value: 'R$ 50k+', labelKey: 'home.social_stat_doacoes' },
    { value: '20+', labelKey: 'home.social_stat_campanhas' },
    { value: '500+', labelKey: 'home.social_stat_voluntarios' },
    { value: '8', labelKey: 'home.social_stat_projetos' },
  ];
  return (
    <section className="relative py-20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-light to-accent2" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(245,166,35,.12),transparent_60%)]" />
      <div className="relative z-10 mx-auto max-w-5xl px-6 text-center text-white">
        <motion.span variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="text-sm font-bold uppercase tracking-widest text-accent">{t('home.impacto_social')}</motion.span>
        <motion.h2 variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="mt-2 text-3xl font-extrabold">{t('home.dna_social')}</motion.h2>
        <motion.p variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="mx-auto mt-4 max-w-xl text-white/70">
          {t('home.social_desc')}
        </motion.p>
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((s, i) => (
            <motion.div key={s.labelKey} variants={fadeUp} custom={i}
              className="rounded-2xl bg-white/10 backdrop-blur-sm p-6">
              <p className="text-2xl font-extrabold text-accent">{s.value}</p>
              <p className="mt-1 text-sm text-white/70">{t(s.labelKey)}</p>
            </motion.div>
          ))}
        </motion.div>
        <Link href="/social" className="mt-10 inline-flex items-center gap-2 rounded-full bg-white/15 px-7 py-3 font-bold text-white backdrop-blur transition hover:bg-white/25">
          {t('home.conheca_dna_social')} <Heart size={16} />
        </Link>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════
   7. RECOMPENSAS
   ════════════════════════════════════════════════════════ */
function Recompensas() {
  const { t } = useTranslation();
  const cols = [
    { titleKey: 'home.rec_col_passageiros', icon: Users, color: '#0A2463', items: ['home.rec_item_corridas_freq', 'home.rec_item_avaliacoes', 'home.rec_item_indicacoes'] },
    { titleKey: 'home.rec_col_motoristas', icon: Car, color: '#14A76C', items: ['home.rec_item_meta_corridas', 'home.rec_item_avaliacao_5', 'home.rec_item_horarios'] },
    { titleKey: 'home.rec_col_parceiros', icon: HandHeart, color: '#F5A623', items: ['home.rec_item_indicacao_clientes', 'home.rec_item_campanhas_ativas', 'home.rec_item_engajamento'] },
  ];
  return (
    <section className="py-20 bg-white">
      <div className="mx-auto max-w-5xl px-6 text-center">
        <motion.h2 variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="text-3xl font-extrabold text-primary">{t('home.recompensas_title')}</motion.h2>
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="mt-12 grid gap-6 sm:grid-cols-3">
          {cols.map((c, i) => (
            <motion.div key={c.titleKey} variants={fadeUp} custom={i}
              className="rounded-2xl border border-gray-100 bg-gray-50 p-8 text-left">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl text-white" style={{ backgroundColor: c.color }}>
                <c.icon size={20} />
              </div>
              <h3 className="mt-5 text-lg font-bold text-primary">{t(c.titleKey)}</h3>
              <ul className="mt-4 space-y-2">
                {c.items.map((it) => (
                  <li key={it} className="flex items-center gap-2 text-sm text-gray-600">
                    <Gift size={14} style={{ color: c.color }} /> {t(it)}
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
  const { t } = useTranslation();
  const cities = [
    { name: 'Santos', descKey: 'home.city_santos_desc' },
    { name: 'São Vicente', descKey: 'home.city_sao_vicente_desc' },
    { name: 'Guarujá', descKey: 'home.city_guaruja_desc' },
    { name: 'Cubatão', descKey: 'home.city_cubatao_desc' },
    { name: 'Praia Grande', descKey: 'home.city_praia_grande_desc' },
    { name: 'Mongaguá', descKey: 'home.city_mongagua_desc' },
    { name: 'Itanhaém', descKey: 'home.city_itanhaem_desc' },
    { name: 'Peruíbe', descKey: 'home.city_peruibe_desc' },
  ];
  return (
    <section className="py-20 bg-gray-50">
      <div className="mx-auto max-w-6xl px-6 text-center">
        <motion.h2 variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="text-3xl font-extrabold text-primary">{t('home.baixada_santista')}</motion.h2>
        <motion.p variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="mx-auto mt-3 max-w-xl text-gray-500">
          {t('home.baixada_desc')}
        </motion.p>
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {cities.map((c, i) => (
            <motion.div key={c.name} variants={fadeUp} custom={i}
              className="group cursor-pointer rounded-2xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <div className="h-2 w-full rounded-full bg-gradient-to-r from-secondary to-primary opacity-40 transition group-hover:opacity-100" />
              <h3 className="mt-4 font-bold text-primary">{c.name}</h3>
              <p className="mt-1 text-xs text-gray-400">{t(c.descKey)}</p>
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
  const { t } = useTranslation();
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
        t('home.install_alert_title') + '\n\n' +
        t('home.install_alert_android') + '\n\n' +
        t('home.install_alert_iphone')
      );
    }
    setInstalling(false);
  };

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(245,166,35,.18),transparent_50%)]" />
      <div className="relative z-10 mx-auto max-w-3xl px-6 text-center text-white">
        <motion.h2 variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="text-3xl font-extrabold sm:text-4xl">{t('home.cta_final')}</motion.h2>
        <motion.p variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="mt-4 text-white/70">{t('home.cta_final_desc')}</motion.p>
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <button onClick={handleInstall} disabled={installing}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-8 py-3.5 font-bold text-primary shadow-lg transition hover:brightness-110">
            <Download size={18} /> {installing ? t('home.instalando') : t('home.instalar_app')}
          </button>
          <Link href="/cadastro" className="inline-flex items-center gap-2 rounded-full border-2 border-white/30 px-8 py-3.5 font-bold text-white transition hover:bg-white/10">
            {t('home.cta_motorista')} <ArrowRight size={16} />
          </Link>
        </motion.div>
        {/* Trust badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-white/60">
          <span className="flex items-center gap-1.5"><Shield size={14} /> {t('home.trust_dados')}</span>
          <span className="flex items-center gap-1.5"><CheckCircle size={14} /> {t('home.trust_motoristas')}</span>
          <span className="flex items-center gap-1.5"><Star size={14} /> {t('home.trust_suporte')}</span>
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════
   10. COMING SOON / EMAIL CAPTURE
   ════════════════════════════════════════════════════════ */
function ComingSoon() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  return (
    <section className="py-20 bg-white">
      <div className="mx-auto max-w-xl px-6 text-center">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent/15">
            <Mail size={28} className="text-accent" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-primary">{t('home.em_breve')}</h2>
          <p className="mt-3 text-gray-500">{t('home.coming_soon_desc')}</p>
          <form onSubmit={(e) => { e.preventDefault(); if (email) setSent(true); }}
            className="mt-8 flex flex-col gap-3 sm:flex-row">
            <input type="email" required placeholder={t('home.placeholder_email')}
              value={email} onChange={(e) => setEmail(e.target.value)}
              className="flex-1 rounded-full border border-gray-200 bg-gray-50 px-5 py-3 text-sm text-gray-800 outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20" />
            <button type="submit"
              className="rounded-full bg-primary px-7 py-3 text-sm font-bold text-white transition hover:bg-primary-light">
              {sent ? t('home.cadastrado') : t('home.avise_me')}
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
      <PageTitle title='DNA Baixada — Mobilidade, Turismo e Impacto Social' />
      <Hero />
      <ComoFunciona />
      <Servicos />
      <Motoristas />
      <PremiumBanner />
      <Turismo />
      <Social />
      <Recompensas />
      <Baixada />
      <CtaFinal />
      <ComingSoon />
    </>
  );
}
