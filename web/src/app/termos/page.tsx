'use client';
import PageTitle from '@/components/seo/PageTitle';

import { motion } from 'framer-motion';
import { ArrowLeft, FileText } from 'lucide-react';

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
    title: '1. Aceitação dos Termos',
    content: [
      'Ao acessar e utilizar a plataforma DNA Baixada, disponibilizada por meio de aplicativo móvel ou site web, o Usuário declara que leu, compreendeu e concorda integralmente com estes Termos de Uso.',
      'Caso o Usuário não concorde com qualquer disposição aqui apresentada, deverá cessar imediatamente o uso da plataforma. O uso continuado após eventuais atualizações constitui aceitação tácita das modificações.',
      'Estes Termos se aplicam a todos os tipos de usuários: passageiros, motoristas parceiros, parceiros comerciais e visitantes.',
    ],
  },
  {
    title: '2. Cadastro e Conta',
    content: [
      'Para utilizar os serviços da DNA Baixada, o Usuário deve criar uma conta fornecendo dados pessoais verdadeiros, completos e atualizados, incluindo nome completo, CPF, telefone celular, e-mail e endereço.',
      'O Usuário é integralmente responsável pela confidencialidade de suas credenciais de acesso (senha e login), comprometendo-se a não compartilhá-las com terceiros.',
      'A DNA Baixada reserva-se o direito de suspender ou cancelar contas que apresentem informações falsas, inconsistentes ou que violem estes Termos, mediante notificação prévia.',
      'Menores de 18 anos somente poderão utilizar a plataforma com autorização expressa dos pais ou responsáveis legais, nos termos do Estatuto da Criança e do Adolescente.',
    ],
  },
  {
    title: '3. Serviços de Transporte',
    content: [
      'A DNA Baixada conecta Usuários passageiros a motoristas parceiros para a prestação de serviços de transporte privado. A plataforma atua como intermediária tecnológica, não sendo proprietária dos veículos nem empregadora dos motoristas.',
      'Os motoristas parceiros são profissionais autônomos ou vinculados a empresas parceiras, responsáveis por manter seus veículos em condições adequadas de segurança e higiene, bem como por possuir toda a documentação legal exigida.',
      'Os trajetos, tempos de espera e valores estimados são calculados por algoritmos e podem sofrer variações em função de condições de trânsito, clima, eventos na região e outros fatores externos.',
      'A DNA Baixada poderá oferecer serviços complementares, como city tours, passeios turísticos e experiências na Baixada Santista, sujeitos a condições específicas divulgadas na plataforma.',
    ],
  },
  {
    title: '4. Pagamentos e Reembolsos',
    content: [
      'Os pagamentos podem ser realizados por meio de cartão de crédito, cartão de débito, PIX ou outros métodos disponibilizados na plataforma. Todos os valores são expressos em Reais (R$).',
      'O valor final da corrida será apresentado ao Usuário antes da confirmação da solicitação. Em casos de alteração de rota solicitada pelo passageiro, o valor poderá ser reajustado automaticamente.',
      'Reembolsos serão analisados caso a caso, mediante solicitação pelo canal de atendimento em até 48 horas após a conclusão do serviço. Cancelamentos antes do início da corrida seguem a política de cancelamento vigente.',
      'Promoções, cupons de desconto e créditos de parceria possuem validade e condições específicas, podendo ser alterados ou cancelados a qualquer momento mediante aviso prévio na plataforma.',
    ],
  },
  {
    title: '5. Responsabilidades',
    content: [
      'A DNA Baixada emprega seus melhores esforços para manter a plataforma estável, segura e funcional, mas não garante disponibilidade ininterrupta, estando isenta de responsabilidade por falhas técnicas temporárias, manutenções programadas ou casos fortuitos.',
      'O Usuário reconhece que a DNA Baixada não se responsabiliza por condutas de terceiros, incluindo motoristas parceiros e outros passageiros, sendo estes responsáveis diretos por seus atos.',
      'A plataforma não se responsabiliza por danos decorrentes de força maior, como desastres naturais, pandemias, greves, bloqueios de vias ou qualquer evento fora do controle razoável da DNA Baixada.',
      'O Usuário concorda em indenizar a DNA Baixada por quaisquer perdas, danos ou despesas decorrentes de seu uso indevido da plataforma ou violação destes Termos.',
    ],
  },
  {
    title: '6. Conduta do Usuário',
    content: [
      'O Usuário compromete-se a utilizar a plataforma de forma ética, respeitosa e em conformidade com a legislação brasileira vigente.',
      'É expressamente proibido: (a) assediar, ameaçar ou discriminara outros usuários ou motoristas; (b) utilizar a plataforma para fins ilícitos; (c) criar múltiplas contas fraudulentas; (d) tentar acessar áreas restritas do sistema; (e) realizar qualquer forma de fraude nos sistemas de pagamento ou avaliação.',
      'A DNA Baixada poderá, a seu exclusivo critério, aplicar advertências, suspensões temporárias ou cancelamento permanente de contas que violem as regras de conduta, garantido o direito de ampla defesa.',
    ],
  },
  {
    title: '7. Privacidade e Proteção de Dados',
    content: [
      'O tratamento dos dados pessoais dos Usuários segue o disposto na nossa Política de Privacidade e na Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 — LGPD).',
      'Ao utilizar a plataforma, o Usuário consente com a coleta, armazenamento e processamento de seus dados conforme descrito na Política de Privacidade disponível em /privacidade.',
      'O Usuário pode exercer seus direitos de titular de dados (acesso, correção, exclusão, portabilidade) a qualquer momento por meio dos canais de contato da DNA Baixada.',
    ],
  },
  {
    title: '8. Modificações dos Termos',
    content: [
      'A DNA Baixada reserva-se o direito de modificar estes Termos de Uso a qualquer momento, publicando a versão atualizada na plataforma.',
      'As alterações entram em vigor na data de sua publicação ou em outro prazo especificado. O uso continuado da plataforma após a publicação implica aceitação dos novos termos.',
      'Recomendamos que os Usuários revisem periodicamente esta página para se manterem informados sobre eventuais mudanças.',
    ],
  },
  {
    title: '9. Legislação e Foro',
    content: [
      'Estes Termos de Uso são regidos pela legislação da República Federativa do Brasil.',
      'Fica eleito o foro da Comarca de Santos, Estado de São Paulo, para dirimir quaisquer litígios ou controvérsias oriundas destes Termos, com renúncia expressa a qualquer outro, por mais privilegiado que seja.',
      'Caso qualquer disposição destes Termos seja considerada inválida ou inexequível por decisão judicial, as demais cláusulas permanecerão em pleno vigor e efeito.',
      'A tolerância da DNA Baixada em relação ao descumprimento de qualquer cláusula não constituirá novação ou renúncia ao direito de exigir o cumprimento em momento posterior.',
    ],
  },
];

export default function TermosPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
        <PageTitle title='Termos de Uso' />
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
            Documento Legal
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight"
          >
            Termos de{' '}
            <span className="bg-gradient-to-r from-secondary to-[#F5A623] bg-clip-text text-transparent">
              Uso
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-6 max-w-2xl mx-auto text-lg text-white/80"
          >
            Leia atentamente os termos que regulam o uso da plataforma DNA Baixada.
            Última atualização: Junho de 2026.
          </motion.p>
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
            className="inline-flex items-center gap-2 text-primary hover:text-secondary font-semibold mb-10 transition-colors"
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
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-gray-600 leading-relaxed">
                  Estes Termos de Uso (&quot;Termos&quot;) regulam o acesso e a utilização da plataforma
                  DNA Baixada, incluindo o site e o aplicativo móvel, operados pela DNA Baixada
                  Tecnologia LTDA, inscrita no CNPJ sob o nº a ser definido, com sede na cidade de
                  Santos, Estado de São Paulo.
                </p>
                <p className="text-sm text-gray-400 mt-3">
                  Última atualização: Junho de 2026
                </p>
              </div>
            </div>
          </motion.div>

          {/* Sections */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={stagger}
            className="space-y-10"
          >
            {sections.map((section, i) => (
              <motion.div key={section.title} variants={fadeUp} custom={i}>
                <h2 className="text-xl md:text-2xl font-bold text-primary mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-secondary to-primary flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {i + 1}
                  </span>
                  {section.title.replace(/^\d+\.\s/, '')}
                </h2>
                <div className="space-y-3 pl-11">
                  {section.content.map((paragraph, j) => (
                    <p key={j} className="text-gray-600 leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </motion.div>
            ))}
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
            <p className="mt-1">Termos de Uso — Junho de 2026</p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
