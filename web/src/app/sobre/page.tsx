'use client';
import PageTitle from '@/components/seo/PageTitle';
import { useTranslation } from '@/components/i18n/LanguageProvider';

import { motion } from 'framer-motion';
import {
  Heart,
  Target,
  Eye,
  Users,
  Rocket,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: 'easeOut' as const },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.12 } },
};

export default function SobrePage() {
  const { t } = useTranslation();

  const timeline = [
    {
      year: '2026',
      phase: t('sobre.phase_ideia'),
      description: t('sobre.phase_ideia_desc'),
    },
    {
      year: '2026',
      phase: t('sobre.phase_dev'),
      description: t('sobre.phase_dev_desc'),
    },
    {
      year: '2026',
      phase: t('sobre.phase_lancamento'),
      description: t('sobre.phase_lancamento_desc'),
    },
  ];

  const values = [
    { icon: Heart, label: t('sobre.value_empatia'), desc: t('sobre.value_empatia_desc') },
    { icon: Target, label: t('sobre.value_compromisso'), desc: t('sobre.value_compromisso_desc') },
    { icon: Sparkles, label: t('sobre.value_inovacao'), desc: t('sobre.value_inovacao_desc') },
    { icon: Users, label: t('sobre.value_comunidade'), desc: t('sobre.value_comunidade_desc') },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white">
        <PageTitle title={t('sobre.page_title')} />
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-light to-primary py-28 px-6">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-secondary blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-[#F5A623] blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto text-center">
          <motion.span
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-block text-sm font-semibold tracking-widest uppercase text-[#F5A623] mb-4"
          >
            {t('sobre.hero_badge')}
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight"
          >
            {t('sobre.hero_title_1') + ' '}
            <span className="bg-gradient-to-r from-secondary to-[#F5A623] bg-clip-text text-transparent">
              {t('sobre.hero_title_2')}
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-6 max-w-2xl mx-auto text-lg text-white/80"
          >
            {t('sobre.hero_subtitle')}
          </motion.p>
        </div>
      </section>

      {/* Origin Story */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={stagger}
            className="grid md:grid-cols-2 gap-12 items-center"
          >
            <motion.div variants={fadeUp} custom={0}>
              <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-primary/10 via-secondary/10 to-[#F5A623]/10 flex items-center justify-center">
                <span className="text-6xl font-black text-primary/20">DNA</span>
              </div>
            </motion.div>
            <motion.div variants={fadeUp} custom={1}>
              <h2 className="text-3xl font-bold text-primary mb-6">{t('sobre.origin_title')}</h2>
              <p className="text-gray-600 leading-relaxed mb-4">{t('sobre.origin_p1')}</p>
              <p className="text-gray-600 leading-relaxed mb-4">{t('sobre.origin_p2')}</p>
              <p className="text-gray-600 leading-relaxed">{t('sobre.origin_p3')}</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Mission, Vision, Values */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={stagger}
            className="text-center mb-14"
          >
            <motion.h2
              variants={fadeUp}
              custom={0}
              className="text-3xl md:text-4xl font-bold text-primary"
            >
              {t('sobre.mvv_title')}
            </motion.h2>
            <motion.div
              variants={fadeUp}
              custom={1}
              className="mt-3 w-16 h-1 bg-gradient-to-r from-secondary to-[#F5A623] mx-auto rounded-full"
            />
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={stagger}
            className="grid md:grid-cols-3 gap-8 mb-16"
          >
            {[
              {
                icon: Target,
                title: t('sobre.missao_title'),
                text: t('sobre.missao_text'),
                color: '#0A2463',
              },
              {
                icon: Eye,
                title: t('sobre.visao_title'),
                text: t('sobre.visao_text'),
                color: '#14A76C',
              },
              {
                icon: Heart,
                title: t('sobre.proposito_title'),
                text: t('sobre.proposito_text'),
                color: '#F5A623',
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                variants={fadeUp}
                custom={i}
                className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-shadow"
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center mb-5"
                  style={{ backgroundColor: `${item.color}15` }}
                >
                  <item.icon className="w-7 h-7" style={{ color: item.color }} />
                </div>
                <h3 className="text-xl font-bold text-primary mb-3">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.text}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Values Grid */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={stagger}
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {values.map((v, i) => (
              <motion.div
                key={v.label}
                variants={fadeUp}
                custom={i}
                className="bg-white rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 mx-auto rounded-full bg-secondary/10 flex items-center justify-center mb-4">
                  <v.icon className="w-6 h-6 text-secondary" />
                </div>
                <h4 className="font-bold text-primary mb-1">{v.label}</h4>
                <p className="text-sm text-gray-500">{v.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Team / Founders */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={stagger}
            className="text-center mb-14"
          >
            <motion.h2
              variants={fadeUp}
              custom={0}
              className="text-3xl md:text-4xl font-bold text-primary"
            >
              {t('sobre.team_title')}
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="mt-3 text-gray-500">
              {t('sobre.team_subtitle')}
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={stagger}
            className="grid sm:grid-cols-2 md:grid-cols-3 gap-8"
          >
            {[
              { name: 'Anderson N. Oliveira', role: t('sobre.role_ceo') },
              { name: 'Equipe DNA Baixada', role: t('sobre.role_ops') },
              { name: 'Equipe Técnica', role: t('sobre.role_cto') },
            ].map((member, i) => (
              <motion.div
                key={member.role}
                variants={fadeUp}
                custom={i}
                className="text-center group"
              >
                <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <Users className="w-12 h-12 text-primary/40" />
                </div>
                <h3 className="text-lg font-bold text-primary">{member.name}</h3>
                <p className="text-sm text-gray-500">{member.role}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={stagger}
            className="text-center mb-14"
          >
            <motion.h2
              variants={fadeUp}
              custom={0}
              className="text-3xl md:text-4xl font-bold text-primary"
            >
              {t('sobre.journey_title')}
            </motion.h2>
            <motion.div
              variants={fadeUp}
              custom={1}
              className="mt-3 w-16 h-1 bg-gradient-to-r from-secondary to-[#F5A623] mx-auto rounded-full"
            />
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
            className="relative"
          >
            {/* Vertical line */}
            <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-secondary via-primary to-[#F5A623]" />

            {timeline.map((item, i) => (
              <motion.div
                key={item.phase}
                variants={fadeUp}
                custom={i}
                className={`relative flex items-start mb-12 last:mb-0 ${
                  i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                }`}
              >
                {/* Dot */}
                <div className="absolute left-6 md:left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-secondary border-4 border-white shadow z-10" />

                {/* Content */}
                <div
                  className={`ml-14 md:ml-0 md:w-1/2 ${
                    i % 2 === 0 ? 'md:pr-12 md:text-right' : 'md:pl-12'
                  }`}
                >
                  <span className="inline-block text-xs font-bold tracking-wider uppercase text-[#F5A623] mb-1">
                    {item.year}
                  </span>
                  <h3 className="text-xl font-bold text-primary mb-2">{item.phase}</h3>
                  <p className="text-gray-600 leading-relaxed">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gradient-to-r from-primary to-secondary">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center"
        >
          <Rocket className="w-12 h-12 text-[#F5A623] mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {t('sobre.cta_title')}
          </h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">
            {t('sobre.cta_desc')}
          </p>
          <a
            href="/contato"
            className="inline-flex items-center gap-2 bg-[#F5A623] hover:bg-accent-dark text-primary font-bold px-8 py-4 rounded-full transition-colors shadow-lg"
          >
            {t('sobre.cta_button')}
            <ArrowRight className="w-5 h-5" />
          </a>
        </motion.div>
      </section>
    </div>
  );
}
