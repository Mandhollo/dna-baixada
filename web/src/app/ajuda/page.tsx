'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  HelpCircle,
  Search,
  ChevronDown,
  MessageCircle,
  Mail,
  Clock,
  Phone,
  ExternalLink,
  MapPin,
  CreditCard,
  Car,
  UserPlus,
  Star,
  Gift,
  Shield,
  AlertCircle,
  Globe,
  Compass,
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

interface FAQItem {
  question: string;
  answer: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
}

const faqData: FAQItem[] = [
  {
    question: 'Como faço para solicitar uma corrida?',
    answer:
      'Abra o app DNA Baixada, insira seu destino no campo de busca, confirme o endereço de embarque e toque em "Solicitar Corrida". Você verá o valor estimado antes de confirmar. Um motorista parceiro será designado automaticamente com base na proximidade e avaliação.',
    category: 'Corridas',
    icon: Car,
  },
  {
    question: 'Quais formas de pagamento são aceitas?',
    answer:
      'Aceitamos cartão de crédito (Visa, Mastercard, Elo, American Express), cartão de débito, PIX e carteira digital DNA Baixada. Você pode gerenciar seus métodos de pagamento em "Configurações > Pagamento" no app. Também aceitamos cupons de desconto e créditos promocionais.',
    category: 'Pagamento',
    icon: CreditCard,
  },
  {
    question: 'Como me cadastro na plataforma?',
    answer:
      'Baixe o app DNA Baixada ou acesse nosso site. Toque em "Criar Conta", preencha seus dados pessoais (nome, CPF, telefone e e-mail), verifique seu celular com o código SMS e pronto! Você já pode começar a usar a plataforma.',
    category: 'Cadastro',
    icon: UserPlus,
  },
  {
    question: 'Como funciona o programa de pontos e recompensas?',
    answer:
      'A cada corrida concluída, você acumula pontos DNA. Esses pontos podem ser trocados por descontos em corridas, experiências turísticas na Baixada Santista e benefícios com parceiros comerciais. Acesse a seção "Recompensas" no app para ver seu saldo e opções de resgate.',
    category: 'Recompensas',
    icon: Gift,
  },
  {
    question: 'Posso cancelar uma corrida? Há alguma taxa?',
    answer:
      'Sim, você pode cancelar a qualquer momento antes do embarque. Cancelamentos feitos em até 2 minutos após a solicitação não geram taxa. Após esse período ou se o motorista já estiver a caminho, uma taxa de cancelamento pode ser cobrada, conforme informado no app no momento do cancelamento.',
    category: 'Corridas',
    icon: AlertCircle,
  },
  {
    question: 'Como funciona o serviço de turismo e city tours?',
    answer:
      'A DNA Baixada oferece city tours e experiências turísticas pela Baixada Santista, incluindo Santos, São Vicente, Guarujá, Praia Grande e Mongaguá. Acesse a seção "Turismo" no app para ver roteiros disponíveis, preços e agendar seu passeio. Os tours são conduzidos por motoristas parceiros com conhecimento local.',
    category: 'Turismo',
    icon: Compass,
  },
  {
    question: 'Como me torno um motorista parceiro?',
    answer:
      'Acesse "Quero ser Motorista" no app ou site. Você precisará de: CNH definitiva (categoria B ou superior), documento do veículo em dia, certificado de antecedentes criminais e aprovação em nosso processo de verificação. Após a aprovação, você receberá treinamento e acesso ao app do motorista.',
    category: 'Cadastro',
    icon: Car,
  },
  {
    question: 'É seguro usar a DNA Baixada?',
    answer:
      'Sim! Todos os motoristas parceiros passam por verificação de antecedentes criminais, validação de documentos e treinamento. Todas as corridas são rastreadas em tempo real por GPS, e você pode compartilhar sua localização com contatos de confiança. Também oferecemos botão de emergência integrado ao app.',
    category: 'Segurança',
    icon: Shield,
  },
  {
    question: 'Como avaliar um motorista ou passageiro?',
    answer:
      'Após cada corrida, o app exibe uma tela de avaliação com estrelas (1 a 5) e espaço para comentários. Suas avaliações ajudam a manter a qualidade da comunidade. Motoristas com notas abaixo do padrão são notificados e podem ser desativados se não houver melhoria.',
    category: 'Corridas',
    icon: Star,
  },
  {
    question: 'O que são os parceiros comerciais da DNA Baixada?',
    answer:
      'São estabelecimentos da Baixada Santista (restaurantes, lojas, hotéis, atrações) que oferecem benefícios exclusivos para usuários DNA Baixada. Ao apresentar o app no estabelecimento parceiro, você pode obter descontos, cashback ou pontos extras. Confira a lista em "Parceiros" no app.',
    category: 'Recompensas',
    icon: Globe,
  },
  {
    question: 'Esqueci minha senha. Como recupero?',
    answer:
      'Na tela de login, toque em "Esqueci minha senha". Informe o e-mail cadastrado e enviaremos um link de redefinição. Se não tiver acesso ao e-mail, entre em contato com nosso suporte pelo WhatsApp ou e-mail para verificação alternativa.',
    category: 'Cadastro',
    icon: AlertCircle,
  },
  {
    question: 'A DNA Baixada atende quais cidades?',
    answer:
      'Atualmente atendemos toda a Baixada Santista: Santos, São Vicente, Guarujá, Praia Grande, Cubatão, Mongaguá, Itanhaém, Peruíbe, Bertioga e região. Estamos em expansão — novas áreas serão adicionadas em breve.',
    category: 'Corridas',
    icon: MapPin,
  },
];

const categories = ['Todas', 'Corridas', 'Pagamento', 'Cadastro', 'Recompensas', 'Turismo', 'Segurança'];

const usefulLinks = [
  { href: '/turismo', label: 'Turismo & City Tours', desc: 'Descubra passeios e experiências na Baixada Santista' },
  { href: '/parceiros', label: 'Parceiros Comerciais', desc: 'Descontos e benefícios em estabelecimentos locais' },
  { href: '/social', label: 'Impacto Social', desc: 'Conheça nossas iniciativas na comunidade' },
  { href: '/recompensas', label: 'Recompensas', desc: 'Acumule pontos e troque por benefícios exclusivos' },
];

export default function AjudaPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todas');

  const filtered = faqData.filter((item) => {
    const matchCategory = activeCategory === 'Todas' || item.category === activeCategory;
    const matchSearch =
      searchTerm === '' ||
      item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#F5A623] via-[#e6971a] to-[#0A2463] py-28 px-6">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-[#14A76C] blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-[#E84855] blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto text-center">
          <motion.span
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-block text-sm font-semibold tracking-widest uppercase text-white/90 mb-4"
          >
            Estamos aqui para ajudar
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight"
          >
            Central de{' '}
            <span className="bg-gradient-to-r from-[#14A76C] to-white bg-clip-text text-transparent">
              Ajuda
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-6 max-w-2xl mx-auto text-lg text-white/80"
          >
            Encontre respostas para as dúvidas mais frequentes ou entre em contato com nossa equipe.
          </motion.p>
        </div>
      </section>

      {/* Back link */}
      <div className="max-w-4xl mx-auto px-6 pt-10">
        <motion.a
          href="/"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 text-[#0A2463] hover:text-[#14A76C] font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para a Home
        </motion.a>
      </div>

      {/* FAQ Section */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={stagger}
            className="text-center mb-10"
          >
            <motion.h2
              variants={fadeUp}
              custom={0}
              className="text-3xl md:text-4xl font-bold text-[#0A2463] flex items-center justify-center gap-3"
            >
              <HelpCircle className="w-8 h-8 text-[#14A76C]" />
              Perguntas Frequentes
            </motion.h2>
            <motion.div
              variants={fadeUp}
              custom={1}
              className="mt-3 w-16 h-1 bg-gradient-to-r from-[#14A76C] to-[#F5A623] mx-auto rounded-full"
            />
          </motion.div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative mb-8"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar perguntas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 bg-gray-50 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14A76C]/40 focus:border-[#14A76C] transition-all"
            />
          </motion.div>

          {/* Category filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-wrap gap-2 mb-10"
          >
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  activeCategory === cat
                    ? 'bg-[#0A2463] text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </motion.div>

          {/* Accordion */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={stagger}
            className="space-y-3"
          >
            {filtered.length === 0 ? (
              <motion.div variants={fadeUp} custom={0} className="text-center py-12">
                <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Nenhuma pergunta encontrada.</p>
                <p className="text-gray-400 text-sm mt-1">Tente outro termo ou categoria.</p>
              </motion.div>
            ) : (
              filtered.map((item, i) => {
                const Icon = item.icon;
                const isOpen = openIndex === i;
                return (
                  <motion.div
                    key={item.question}
                    variants={fadeUp}
                    custom={i}
                    className="border border-gray-100 rounded-2xl overflow-hidden hover:border-[#14A76C]/30 transition-colors"
                  >
                    <button
                      onClick={() => setOpenIndex(isOpen ? null : i)}
                      className="w-full flex items-center gap-4 p-5 text-left bg-white hover:bg-gray-50/50 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#14A76C]/10 flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-[#14A76C]" />
                      </div>
                      <span className="flex-1 font-semibold text-[#0A2463] pr-4">{item.question}</span>
                      <motion.div
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                        className="shrink-0"
                      >
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      </motion.div>
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-5 pl-19">
                            <p className="text-gray-600 leading-relaxed">{item.answer}</p>
                            <span className="inline-block mt-3 text-xs font-semibold text-[#14A76C] bg-[#14A76C]/10 px-3 py-1 rounded-full">
                              {item.category}
                            </span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })
            )}
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
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
              Entre em Contato
            </motion.h2>
            <motion.div
              variants={fadeUp}
              custom={1}
              className="mt-3 w-16 h-1 bg-gradient-to-r from-[#14A76C] to-[#F5A623] mx-auto rounded-full"
            />
            <motion.p variants={fadeUp} custom={2} className="mt-4 text-gray-500 max-w-xl mx-auto">
              Não encontrou o que procurava? Nossa equipe está pronta para ajudar.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={stagger}
            className="grid sm:grid-cols-2 md:grid-cols-3 gap-6"
          >
            {[
              {
                icon: MessageCircle,
                label: 'WhatsApp',
                value: '(13) 99764-4646',
                href: 'https://wa.me/5513997644646',
                color: '#14A76C',
                desc: 'Resposta rápida',
              },
              {
                icon: Mail,
                label: 'E-mail',
                value: 'contato@dnabaixada.com.br',
                href: 'mailto:contato@dnabaixada.com.br',
                color: '#0A2463',
                desc: 'Resposta em até 24h',
              },
              {
                icon: Clock,
                label: 'Horário',
                value: 'Seg–Sex: 8h às 20h',
                href: null,
                color: '#F5A623',
                desc: 'Sáb: 8h às 14h',
              },
            ].map((item, i) => {
              const Icon = item.icon;
              const Wrapper = item.href ? 'a' : 'div';
              return (
                <motion.div
                  key={item.label}
                  variants={fadeUp}
                  custom={i}
                  className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow text-center"
                >
                  <div
                    className="w-14 h-14 mx-auto rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${item.color}15` }}
                  >
                    <Icon className="w-7 h-7" style={{ color: item.color }} />
                  </div>
                  <h3 className="font-bold text-[#0A2463] text-lg mb-1">{item.label}</h3>
                  <Wrapper
                    {...(item.href
                      ? {
                          href: item.href,
                          target: '_blank',
                          rel: 'noopener noreferrer',
                          className: 'text-[#14A76C] font-semibold hover:underline',
                        }
                      : { className: 'text-[#0A2463] font-semibold' })}
                  >
                    {item.value}
                  </Wrapper>
                  <p className="text-sm text-gray-400 mt-1">{item.desc}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Useful Links */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
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
              Links Úteis
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
            className="grid sm:grid-cols-2 gap-6"
          >
            {usefulLinks.map((link, i) => (
              <motion.a
                key={link.href}
                href={link.href}
                variants={fadeUp}
                custom={i}
                className="group flex items-start gap-4 bg-gray-50 rounded-2xl p-6 hover:bg-[#14A76C]/5 hover:border-[#14A76C]/20 border border-transparent transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-[#0A2463]/10 flex items-center justify-center shrink-0 group-hover:bg-[#14A76C]/20 transition-colors">
                  <ExternalLink className="w-5 h-5 text-[#0A2463] group-hover:text-[#14A76C] transition-colors" />
                </div>
                <div>
                  <h3 className="font-bold text-[#0A2463] group-hover:text-[#14A76C] transition-colors">
                    {link.label}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">{link.desc}</p>
                </div>
              </motion.a>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="py-8 px-6 bg-gray-50 border-t border-gray-100 text-center text-sm text-gray-400"
      >
        <p>DNA Baixada Tecnologia LTDA — Santos/SP</p>
        <p className="mt-1">Central de Ajuda — Junho 2026</p>
      </motion.div>
    </div>
  );
}
