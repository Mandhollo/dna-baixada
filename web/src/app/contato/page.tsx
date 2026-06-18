'use client';
import PageTitle from '@/components/seo/PageTitle';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Clock,
  AtSign,
  Send,
  CheckCircle2,
  ArrowRight,
  Car,
  MessageSquare,
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

const contactInfo = [
  {
    icon: Mail,
    label: 'E-mail',
    value: 'contato@dnabaixada.com.br',
    href: 'mailto:contato@dnabaixada.com.br',
    color: '#0A2463',
    desc: 'Resposta em até 24h',
  },
  {
    icon: AtSign,
    label: 'Instagram',
    value: '@contato.dnabaixada',
    href: 'https://instagram.com/contato.dnabaixada',
    color: '#E1306C',
    desc: 'Siga-nos nas redes',
  },
  {
    icon: Clock,
    label: 'Horário',
    value: 'Seg–Sex: 8h às 18h',
    href: null,
    color: '#F5A623',
    desc: 'Atendimento comercial',
  },
];

const assuntoOptions = [
  { value: '', label: 'Selecione um assunto' },
  { value: 'parceria', label: 'Parceria' },
  { value: 'motorista', label: 'Motorista' },
  { value: 'suporte', label: 'Suporte' },
  { value: 'outro', label: 'Outro' },
];

export default function ContatoPage() {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    assunto: '',
    mensagem: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const errs: Record<string, string> = {};
    if (!formData.nome.trim()) errs.nome = 'Nome é obrigatório';
    if (!formData.email.trim()) errs.email = 'E-mail é obrigatório';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      errs.email = 'E-mail inválido';
    if (!formData.assunto) errs.assunto = 'Selecione um assunto';
    if (!formData.mensagem.trim()) errs.mensagem = 'Mensagem é obrigatória';
    return errs;
  }

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setSubmitting(true);
    setSubmitError('');

    try {
      const res = await fetch('/api/contato', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao enviar');
      }

      setSubmitted(true);
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : 'Erro ao enviar. Tente novamente ou chame no WhatsApp.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
        <PageTitle title='Contato' />
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-light to-secondary py-28 px-6">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-[#F5A623] blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-secondary blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto text-center">
          <motion.span
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-block text-sm font-semibold tracking-widest uppercase text-[#F5A623] mb-4"
          >
            Fale conosco
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight"
          >
            Entre em{' '}
            <span className="bg-gradient-to-r from-secondary to-[#F5A623] bg-clip-text text-transparent">
              Contato
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-6 max-w-2xl mx-auto text-lg text-white/80"
          >
            Tem alguma dúvida, sugestão ou quer fechar uma parceria? Envie uma mensagem e
            respondemos o mais rápido possível.
          </motion.p>
        </div>
      </section>

      {/* Contact Form + Info */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
            className="grid lg:grid-cols-5 gap-12"
          >
            {/* Form */}
            <motion.div variants={fadeUp} custom={0} className="lg:col-span-3">
              <h2 className="text-3xl font-bold text-primary mb-2">Envie sua mensagem</h2>
              <div className="w-16 h-1 bg-gradient-to-r from-secondary to-[#F5A623] rounded-full mb-8" />

              <AnimatePresence mode="wait">
                {submitted ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col items-center justify-center text-center py-16 bg-secondary/5 rounded-2xl border border-secondary/20"
                  >
                    <div className="w-20 h-20 rounded-full bg-secondary/10 flex items-center justify-center mb-6">
                      <CheckCircle2 className="w-10 h-10 text-secondary" />
                    </div>
                    <h3 className="text-2xl font-bold text-primary mb-2">
                      Mensagem enviada!
                    </h3>
                    <p className="text-foreground-muted max-w-sm mb-6">
                      Obrigado pelo contato, <strong>{formData.nome}</strong>! Vamos responder
                      o mais breve possível.
                    </p>
                    <button
                      onClick={() => {
                        setSubmitted(false);
                        setFormData({ nome: '', email: '', assunto: '', mensagem: '' });
                      }}
                      className="px-6 py-3 rounded-full bg-primary text-white font-semibold hover:bg-primary-light transition-colors"
                    >
                      Enviar outra mensagem
                    </button>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleSubmit}
                    className="space-y-5"
                  >
                    {/* Nome */}
                    <div>
                      <label
                        htmlFor="nome"
                        className="block text-sm font-semibold text-primary mb-1.5"
                      >
                        Nome completo *
                      </label>
                      <input
                        id="nome"
                        name="nome"
                        type="text"
                        required
                        value={formData.nome}
                        onChange={handleChange}
                        placeholder="Seu nome"
                        className={`w-full px-4 py-3 rounded-xl border bg-surface-elevated text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 transition-all ${
                          errors.nome
                            ? 'border-red-400 focus:ring-red-300/40'
                            : 'border-border focus:ring-secondary/40 focus:border-secondary'
                        }`}
                      />
                      {errors.nome && (
                        <p className="mt-1 text-sm text-red-500">{errors.nome}</p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-semibold text-primary mb-1.5"
                      >
                        E-mail *
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="seuemail@exemplo.com"
                        className={`w-full px-4 py-3 rounded-xl border bg-surface-elevated text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 transition-all ${
                          errors.email
                            ? 'border-red-400 focus:ring-red-300/40'
                            : 'border-border focus:ring-secondary/40 focus:border-secondary'
                        }`}
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                      )}
                    </div>

                    {/* Assunto */}
                    <div>
                      <label
                        htmlFor="assunto"
                        className="block text-sm font-semibold text-primary mb-1.5"
                      >
                        Assunto *
                      </label>
                      <select
                        id="assunto"
                        name="assunto"
                        required
                        value={formData.assunto}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 rounded-xl border bg-surface-elevated text-foreground focus:outline-none focus:ring-2 transition-all appearance-none ${
                          errors.assunto
                            ? 'border-red-400 focus:ring-red-300/40'
                            : 'border-border focus:ring-secondary/40 focus:border-secondary'
                        } ${!formData.assunto ? 'text-foreground-muted' : ''}`}
                      >
                        {assuntoOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      {errors.assunto && (
                        <p className="mt-1 text-sm text-red-500">{errors.assunto}</p>
                      )}
                    </div>

                    {/* Mensagem */}
                    <div>
                      <label
                        htmlFor="mensagem"
                        className="block text-sm font-semibold text-primary mb-1.5"
                      >
                        Mensagem *
                      </label>
                      <textarea
                        id="mensagem"
                        name="mensagem"
                        required
                        rows={5}
                        value={formData.mensagem}
                        onChange={handleChange}
                        placeholder="Escreva sua mensagem aqui..."
                        className={`w-full px-4 py-3 rounded-xl border bg-surface-elevated text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 transition-all resize-none ${
                          errors.mensagem
                            ? 'border-red-400 focus:ring-red-300/40'
                            : 'border-border focus:ring-secondary/40 focus:border-secondary'
                        }`}
                      />
                      {errors.mensagem && (
                        <p className="mt-1 text-sm text-red-500">{errors.mensagem}</p>
                      )}
                    </div>

                    {/* Submit */}
                    {submitError && (
                      <p className="text-sm text-accent2 font-medium">{submitError}</p>
                    )}
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-secondary to-primary hover:from-primary hover:to-secondary text-white font-bold px-8 py-4 rounded-full transition-all shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Enviando...' : 'Enviar mensagem'}
                      <Send className="w-5 h-5" />
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Contact Info Sidebar */}
            <motion.div variants={fadeUp} custom={1} className="lg:col-span-2">
              <h2 className="text-3xl font-bold text-primary mb-2">Informações</h2>
              <div className="w-16 h-1 bg-gradient-to-r from-secondary to-[#F5A623] rounded-full mb-8" />

              <div className="space-y-5">
                {contactInfo.map((item) => {
                  const Icon = item.icon;
                  const Wrapper = item.href ? 'a' : 'div';
                  return (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4 }}
                      className="flex items-start gap-4 bg-surface-elevated rounded-2xl p-5 hover:shadow-md transition-shadow"
                    >
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${item.color}15` }}
                      >
                        <Icon className="w-6 h-6" style={{ color: item.color }} />
                      </div>
                      <div>
                        <h3 className="font-bold text-primary mb-0.5">{item.label}</h3>
                        <Wrapper
                          {...(item.href
                            ? {
                                href: item.href,
                                target: '_blank',
                                rel: 'noopener noreferrer',
                                className: 'text-secondary font-semibold hover:underline',
                              }
                            : { className: 'text-foreground font-semibold' })}
                        >
                          {item.value}
                        </Wrapper>
                        <p className="text-sm text-foreground-muted mt-0.5">{item.desc}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Quick tip */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="mt-8 bg-secondary/5 border border-secondary/20 rounded-2xl p-5"
              >
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-5 h-5 text-secondary" />
                  <span className="font-bold text-primary text-sm">Dica rápida</span>
                </div>
                <p className="text-sm text-foreground-secondary leading-relaxed">
                  Para respostas mais rápidas, escolha o assunto que melhor se encaixa na sua
                  necessidade. Assim direcionamos sua mensagem ao time certo!
                </p>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA Motoristas */}
      <section className="py-20 px-6 bg-gradient-to-r from-primary to-secondary">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center"
        >
          <Car className="w-12 h-12 text-[#F5A623] mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Quer ser motorista parceiro?
          </h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">
            Faça parte do time de motoristas da DNA Baixada e ganhe dinheiro fazendo o que
            ama, com flexibilidade e apoio total.
          </p>
          <a
            href="/cadastro"
            className="inline-flex items-center gap-2 bg-[#F5A623] hover:bg-accent-dark text-primary font-bold px-8 py-4 rounded-full transition-colors shadow-lg"
          >
            Cadastre-se como motorista
            <ArrowRight className="w-5 h-5" />
          </a>
        </motion.div>
      </section>
    </div>
  );
}
