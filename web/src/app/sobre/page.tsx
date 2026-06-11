'use client';
import PageTitle from '@/components/seo/PageTitle';

import { motion } from 'framer-motion';
import {
  Heart,
  Target,
  Eye,
  Users,
  Rocket,
  Sparkles,
  ArrowRight,
  CheckCircle2,
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

const timeline = [
  {
    year: '2026',
    phase: 'Ideia',
    description:
      'Nasce a visão de uma plataforma que conecta mobilidade, turismo e impacto social na Baixada Santista.',
  },
  {
    year: '2026',
    phase: 'Desenvolvimento',
    description:
      'Estruturação da tecnologia, parcerias locais e construção da marca DNA Baixada.',
  },
  {
    year: '2026',
    phase: 'Lançamento',
    description:
      'A plataforma chega ao público com serviços de transporte, city tours e programas sociais.',
  },
];

const values = [
  { icon: Heart, label: 'Empatia', desc: 'Colocamos as pessoas no centro de cada decisão.' },
  { icon: Target, label: 'Compromisso', desc: 'Cumprimos o que prometemos, com transparência total.' },
  { icon: Sparkles, label: 'Inovação', desc: 'Usamos tecnologia para transformar a experiência regional.' },
  { icon: Users, label: 'Comunidade', desc: 'Fortalecemos os laços que unem a Baixada Santista.' },
];

export default function SobrePage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
        <PageTitle title='Sobre Nos' />
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0A2463] via-[#0d2d73] to-[#0A2463] py-28 px-6">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-[#14A76C] blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-[#F5A623] blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto text-center">
          <motion.span
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-block text-sm font-semibold tracking-widest uppercase text-[#F5A623] mb-4"
          >
            Conheça nossa história
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight"
          >
            Sobre a{' '}
                        <span className="bg-gradient-to-r from-[#14A76C] to-[#F5A623] bg-clip-text text-transparent">
                          DNA Baixada
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-6 max-w-2xl mx-auto text-lg text-white/80"
          >
            Nascidos na Baixada Santista, feitos por quem conhece cada rua, cada praia e cada
            história dessa região.
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
              <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-[#0A2463]/10 via-[#14A76C]/10 to-[#F5A623]/10 flex items-center justify-center">
                <span className="text-6xl font-black text-[#0A2463]/20">DNA</span>
              </div>
            </motion.div>
            <motion.div variants={fadeUp} custom={1}>
              <h2 className="text-3xl font-bold text-[#0A2463] mb-6">Nossa Origem</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                A DNA Baixada nasceu da vontade de transformar a experiência de quem vive e visita
                a Baixada Santista. Somos criados por quem respira essa região — que conhece cada
                cantinho, cada cultura e cada necessidade local.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                Mais do que uma plataforma de mobilidade, somos um movimento que conecta transporte,
                turismo e responsabilidade social em um único ecossistema.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Cada corrida, cada city tour e cada parceria carrega o nosso DNA: o compromisso
                com a comunidade da Baixada Santista.
              </p>
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
              className="text-3xl md:text-4xl font-bold text-[#0A2463]"
            >
              Missão, Visão & Valores
            </motion.h2>
            <motion.div
              variants={fadeUp}
              custom={1}
              className="mt-3 w-16 h-1 bg-gradient-to-r from-[#14A76C] to-[#F5A623] mx-auto rounded-full"
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
                title: 'Missão',
                text: 'Oferecer mobilidade inteligente, experiências turísticas memoráveis e impacto social positivo na Baixada Santista.',
                color: '#0A2463',
              },
              {
                icon: Eye,
                title: 'Visão',
                text: 'Ser a principal plataforma regional de mobilidade e turismo, referência em inovação e responsabilidade social.',
                color: '#14A76C',
              },
              {
                icon: Heart,
                title: 'Propósito',
                text: 'Cada serviço prestado gera impacto direto na comunidade, fortalecendo a economia e o bem-estar local.',
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
                <h3 className="text-xl font-bold text-[#0A2463] mb-3">{item.title}</h3>
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
                <div className="w-12 h-12 mx-auto rounded-full bg-[#14A76C]/10 flex items-center justify-center mb-4">
                  <v.icon className="w-6 h-6 text-[#14A76C]" />
                </div>
                <h4 className="font-bold text-[#0A2463] mb-1">{v.label}</h4>
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
              className="text-3xl md:text-4xl font-bold text-[#0A2463]"
            >
              Nossa Equipe
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="mt-3 text-gray-500">
              Pessoas apaixonadas pela Baixada Santista
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
              { name: 'Anderson N. Oliveira', role: 'CEO & Fundador' },
              { name: 'Equipe DNA Baixada', role: 'Diretor de Operações' },
              { name: 'Equipe Técnica', role: 'CTO' },
            ].map((member, i) => (
              <motion.div
                key={member.role}
                variants={fadeUp}
                custom={i}
                className="text-center group"
              >
                <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-[#0A2463]/20 to-[#14A76C]/20 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <Users className="w-12 h-12 text-[#0A2463]/40" />
                </div>
                <h3 className="text-lg font-bold text-[#0A2463]">{member.name}</h3>
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
              className="text-3xl md:text-4xl font-bold text-[#0A2463]"
            >
              Nossa Jornada
            </motion.h2>
            <motion.div
              variants={fadeUp}
              custom={1}
              className="mt-3 w-16 h-1 bg-gradient-to-r from-[#14A76C] to-[#F5A623] mx-auto rounded-full"
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
            <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#14A76C] via-[#0A2463] to-[#F5A623]" />

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
                <div className="absolute left-6 md:left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#14A76C] border-4 border-white shadow z-10" />

                {/* Content */}
                <div
                  className={`ml-14 md:ml-0 md:w-1/2 ${
                    i % 2 === 0 ? 'md:pr-12 md:text-right' : 'md:pl-12'
                  }`}
                >
                  <span className="inline-block text-xs font-bold tracking-wider uppercase text-[#F5A623] mb-1">
                    {item.year}
                  </span>
                  <h3 className="text-xl font-bold text-[#0A2463] mb-2">{item.phase}</h3>
                  <p className="text-gray-600 leading-relaxed">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gradient-to-r from-[#0A2463] to-[#14A76C]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center"
        >
          <Rocket className="w-12 h-12 text-[#F5A623] mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Faça parte da DNA Baixada
          </h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">
            Junte-se a nós e ajude a transformar a Baixada Santista. Seja motorista, parceiro ou
            voluntário.
          </p>
          <a
            href="/contato"
            className="inline-flex items-center gap-2 bg-[#F5A623] hover:bg-[#e6951c] text-[#0A2463] font-bold px-8 py-4 rounded-full transition-colors shadow-lg"
          >
            Faça parte
            <ArrowRight className="w-5 h-5" />
          </a>
        </motion.div>
      </section>
    </div>
  );
}
