'use client';
import PageTitle from '@/components/seo/PageTitle';

import { motion } from 'framer-motion';
import { ArrowLeft, Shield, Lock, Eye, Database, Share2, Cookie, Mail, RefreshCw } from 'lucide-react';

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

const sections = [
  {
    icon: Database,
    color: '#0A2463',
    title: '1. Dados Coletados',
    content: [
      'A DNA Baixada coleta dados pessoais fornecidos voluntariamente pelo Usuário no momento do cadastro e durante o uso da plataforma, incluindo: nome completo, CPF, data de nascimento, telefone celular, e-mail, endereço residencial e foto de perfil.',
      'Durante a utilização dos serviços, coletamos automaticamente dados de geolocalização (com permissão expressa), histórico de corridas, avaliações, dados de pagamento e informações de dispositivo (modelo, sistema operacional, identificador único).',
      'Também coletamos dados de navegação, como páginas visitadas, tempo de permanência, cliques e interações com a interface, por meio de cookies e tecnologias similares.',
      'A coleta de dados sensíveis (como biometria para verificação de identidade) ocorre apenas quando necessária e com consentimento expresso e específico do titular, em conformidade com a LGPD.',
    ],
  },
  {
    icon: Eye,
    color: '#14A76C',
    title: '2. Como Utilizamos Seus Dados',
    content: [
      'Utilizamos os dados pessoais para: (a) criar e gerenciar sua conta na plataforma; (b) conectar passageiros a motoristas parceiros; (c) processar pagamentos e reembolsos; (d) calcular rotas e estimativas de tempo e preço; (e) enviar notificações sobre o status de corridas e serviços.',
      'Além disso, empregamos os dados para: (a) personalizar a experiência do usuário; (b) oferecer promoções e programas de recompensas; (c) melhorar nossos serviços por meio de análises estatísticas; (d) prevenir fraudes e garantir a segurança da plataforma.',
      'O tratamento dos dados é realizado sempre com base em uma das hipóteses legais previstas na LGPD: consentimento, execução de contrato, cumprimento de obrigação legal, exercício regular de direitos ou interesse legítimo.',
    ],
  },
  {
    icon: Share2,
    color: '#F5A623',
    title: '3. Compartilhamento de Dados',
    content: [
      'A DNA Baixada poderá compartilhar dados pessoais com: (a) motoristas parceiros, exclusivamente para a prestação do serviço de transporte; (b) parceiros comerciais e turísticos, conforme autorizado pelo Usuário; (c) prestadores de serviço de pagamento (gateways e processadores de cartão).',
      'Dados agregados e anonimizados podem ser compartilhados com fins estatísticos, acadêmicos ou comerciais, sem possibilidade de identificação individual dos titulares.',
      'Não vendemos, alugamos ou compartilhamos dados pessoais com terceiros para fins de marketing sem o consentimento expresso do Usuário.',
      'Podemos compartilhar dados quando exigido por lei, ordem judicial ou requisição de autoridade competente, conforme a legislação brasileira.',
    ],
  },
  {
    icon: Lock,
    color: '#E84855',
    title: '4. Segurança dos Dados',
    content: [
      'Empregamos medidas técnicas e organizacionais adequadas para proteger os dados pessoais contra acesso não autorizado, destruição, perda, alteração ou qualquer forma de tratamento inadequado.',
      'Utilizamos criptografia SSL/TLS para transmissão de dados, armazenamento seguro com criptografia em repouso, firewalls, controle de acesso baseado em função e monitoramento contínuo de nossas infraestruturas.',
      'Em caso de incidente de segurança que possa acarretar risco ou dano relevante aos titulares, comunicaremos a ocorrência à Autoridade Nacional de Proteção de Dados (ANPD) e aos titulares afetados, nos prazos legais.',
      'Nossos colaboradores e prestadores de serviço são treinados e contratualmente obrigados a manter a confidencialidade dos dados.',
    ],
  },
  {
    icon: Shield,
    color: '#0A2463',
    title: '5. Direitos do Titular (LGPD)',
    content: [
      'Em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD), o titular dos dados pessoais tem os seguintes direitos: (a) confirmação da existência de tratamento; (b) acesso aos dados; (c) correção de dados incompletos, inexatos ou desatualizados.',
      'Adicionalmente, o titular pode solicitar: (d) anonimização, bloqueio ou eliminação de dados desnecessários; (e) portabilidade dos dados a outro fornecedor; (f) eliminação dos dados tratados com base no consentimento; (g) informação sobre compartilhamento de dados.',
      'O titular também possui o direito de revogar o consentimento a qualquer momento, o que não afeta a licitude do tratamento realizado anteriormente. Para exercer seus direitos, entre em contato pelo e-mail privacidade@dnabaixada.com.br.',
      'Responderemos às solicitações no prazo legal, podendo solicitar documento de identificação para verificação da identidade do requerente.',
    ],
  },
  {
    icon: Cookie,
    color: '#14A76C',
    title: '6. Cookies e Tecnologias Similares',
    content: [
      'Utilizamos cookies e tecnologias de rastreamento para melhorar a experiência de navegação, analisar o uso da plataforma e personalizar conteúdo e publicidade.',
      'Os cookies utilizados incluem: (a) cookies essenciais, necessários ao funcionamento da plataforma; (b) cookies de desempenho, que coletam dados anônimos sobre uso; (c) cookies de funcionalidade, que permitem personalização; (d) cookies de marketing, utilizados para rastrear visitantes e apresentar anúncios relevantes.',
      'O Usuário pode gerenciar suas preferências de cookies a qualquer momento por meio das configurações do navegador. A desativação de certos cookies pode afetar a funcionalidade da plataforma.',
    ],
  },
  {
    icon: Mail,
    color: '#F5A623',
    title: '7. Contato',
    content: [
      'Para dúvidas, solicitações ou reclamações relacionadas à privacidade e proteção de dados pessoais, entre em contato com nosso Encarregado de Proteção de Dados (DPO):',
      'E-mail: privacidade@dnabaixada.com.br',
      'Endereço: DNA Baixada Tecnologia LTDA — Santos, São Paulo, Brasil.',
      'Respondemos todas as solicitações em até 15 (quinze) dias úteis, conforme previsto na LGPD.',
    ],
  },
  {
    icon: RefreshCw,
    color: '#E84855',
    title: '8. Alterações nesta Política',
    content: [
      'A DNA Baixada poderá atualizar esta Política de Privacidade periodicamente para refletir mudanças em nossas práticas, serviços ou requisitos legais.',
      'Notificaremos os Usuários sobre alterações significativas por meio de aviso na plataforma, e-mail ou notificação push. A data da última revisão será sempre indicada no topo deste documento.',
      'O uso continuado da plataforma após a publicação de alterações constitui aceitação da política atualizada.',
      'Recomendamos que os Usuários revisem esta página periodicamente para se manterem informados sobre como protegemos seus dados.',
    ],
  },
];

export default function PrivacidadePage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
        <PageTitle title='Politica de Privacidade' />
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#14A76C] via-[#11b85e] to-[#0d9450] py-28 px-6">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-[#0A2463] blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-[#F5A623] blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto text-center">
          <motion.span
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-block text-sm font-semibold tracking-widest uppercase text-[#F5A623] mb-4"
          >
            Sua privacidade importa
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight"
          >
            Política de{' '}
            <span className="bg-gradient-to-r from-white/90 to-white/70 bg-clip-text text-transparent">
              Privacidade
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-6 max-w-2xl mx-auto text-lg text-white/80"
          >
            Saiba como coletamos, usamos e protegemos seus dados pessoais em conformidade com a LGPD.
            Última atualização: Junho de 2026.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-6 inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-5 py-2 text-sm text-white/90"
          >
            <Shield className="w-4 h-4" />
            Em conformidade com a Lei nº 13.709/2018 — LGPD
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          {/* Back link */}
          <motion.a
            href="/"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 text-[#0A2463] hover:text-[#14A76C] font-semibold mb-10 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para a Home
          </motion.a>

          {/* Intro */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={stagger}
            className="bg-gray-50 rounded-2xl p-8 mb-12 border border-gray-100"
          >
            <p className="text-gray-600 leading-relaxed">
              A DNA Baixada Tecnologia LTDA (&quot;DNA Baixada&quot;, &quot;nós&quot;, &quot;nosso&quot;) está
              comprometida com a proteção dos dados pessoais de seus Usuários. Esta Política de
              Privacidade descreve como coletamos, utilizamos, armazenamos, compartilhamos e protegemos
              as informações dos titulares de dados que utilizam nossa plataforma, em total conformidade
              com a Lei Geral de Proteção de Dados Pessoais (LGPD — Lei nº 13.709/2018).
            </p>
          </motion.div>

          {/* Sections */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={stagger}
            className="space-y-10"
          >
            {sections.map((section, i) => {
              const Icon = section.icon;
              return (
                <motion.div key={section.title} variants={fadeUp} custom={i}>
                  <h2 className="text-xl md:text-2xl font-bold text-[#0A2463] mb-4 flex items-center gap-3">
                    <span
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${section.color}12` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: section.color }} />
                    </span>
                    {section.title}
                  </h2>
                  <div className="space-y-3 pl-13">
                    {section.content.map((paragraph, j) => (
                      <p key={j} className="text-gray-600 leading-relaxed">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-16 pt-8 border-t border-gray-200 text-center text-sm text-gray-400"
          >
            <p>DNA Baixada Tecnologia LTDA — Santos/SP</p>
            <p className="mt-1">Política de Privacidade — Junho de 2026</p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
