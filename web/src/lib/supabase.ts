import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

// ════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════

export type UserRole = 'passageiro' | 'motorista' | 'parceiro' | 'admin';
export type MotoristaStatus = 'pendente' | 'aprovado' | 'rejeitado' | 'suspenso';
export type CorridaStatus = 'aguardando' | 'aceita' | 'motorista_chegou' | 'em_andamento' | 'finalizada' | 'cancelada';
export type CorridaTipo = 'urbana' | 'executivo' | 'transfer_aeroporto' | 'transfer_rodoviaria' | 'transfer_hotel' | 'transfer_cruzeiro' | 'city_tour' | 'passeio_turistico';
export type FormaPagamento = 'pix' | 'dinheiro' | 'cartao';

export interface Profile {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  foto_url?: string;
  role: UserRole;
  pontos: number;
  avaliacao_media: number;
  total_avaliacoes: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Motorista {
  id: string;
  cnh_numero: string;
  cnh_foto_url?: string;
  veiculo_modelo: string;
  veiculo_placa: string;
  veiculo_cor?: string;
  veiculo_ano?: number;
  veiculo_lugares: number;
  veiculo_foto_url?: string;
  status: MotoristaStatus;
  cidade_base: string;
  disponivel: boolean;
  latitude?: number;
  longitude?: number;
  total_corridas: number;
  ganho_total: number;
}

export interface Parceiro {
  id: string;
  cnpj?: string;
  nome_fantasia: string;
  razao_social?: string;
  categoria: string;
  descricao?: string;
  endereco?: string;
  cidade: string;
  telefone_comercial?: string;
  site_url?: string;
  foto_url?: string;
  logo_url?: string;
  status: MotoristaStatus;
  avaliacao_media: number;
  total_avaliacoes: number;
}

export interface Corrida {
  id: string;
  passageiro_id: string;
  motorista_id?: string | null;
  tipo: CorridaTipo;
  status: CorridaStatus;
  origem_endereco: string;
  origem_lat?: number | null;
  origem_lng?: number | null;
  destino_endereco?: string | null;
  destino_lat?: number | null;
  destino_lng?: number | null;
  preco_estimado?: number | null;
  preco_final?: number | null;
  forma_pagamento?: FormaPagamento | null;
  distancia_km?: number | null;
  duracao_minutos?: number | null;
  observacoes?: string | null;
  passageiros: number;
  cancelado_por?: string | null;
  motivo_cancelamento?: string | null;
  created_at: string;
  updated_at: string;
  aceita_em?: string | null;
  iniciada_em?: string | null;
  finalizada_em?: string | null;
  // Joined
  passageiro?: Profile;
  motorista?: Profile & { motoristas?: Motorista[] };
}

export interface MensagemChat {
  id: string;
  corrida_id: string;
  remetente_id: string;
  mensagem: string;
  lida: boolean;
  created_at: string;
  // Joined
  remetente?: Profile;
}

export interface Avaliacao {
  id: string;
  corrida_id: string;
  avaliador_id: string;
  avaliado_id: string;
  nota: number;
  comentario?: string | null;
  created_at: string;
}

// ════════════════════════════════════════════════════════════
// CONSTANTES — Tipos de serviço
// ════════════════════════════════════════════════════════════

export const CORRIDA_TIPOS: { value: CorridaTipo; label: string; icon: string; descricao: string }[] = [
  { value: 'urbana', label: 'Corrida Urbana', icon: '🚗', descricao: 'Deslocamento dentro da cidade' },
  { value: 'executivo', label: 'Transporte Executivo', icon: '🎩', descricao: 'Veículo premium com motorista profissional' },
  { value: 'transfer_aeroporto', label: 'Transfer Aeroporto', icon: '✈️', descricao: 'Guarulhos (GRU) ou Congonhas (CGH)' },
  { value: 'transfer_rodoviaria', label: 'Transfer Rodoviária', icon: '🚌', descricao: 'Ida ou volta da rodoviária' },
  { value: 'transfer_hotel', label: 'Transfer Hotel', icon: '🏨', descricao: 'Transporte de/para hotel' },
  { value: 'transfer_cruzeiro', label: 'Transfer Cruzeiro', icon: '🚢', descricao: 'Terminal Concais — ida/volta' },
  { value: 'city_tour', label: 'City Tour', icon: '🗺️', descricao: 'Passeio turístico pela Baixada' },
  { value: 'passeio_turistico', label: 'Passeio Turístico', icon: '📸', descricao: 'Visita a pontos turísticos' },
];

export const CORRIDA_STATUS_LABELS: Record<CorridaStatus, { label: string; color: string; bg: string }> = {
  aguardando: { label: 'Aguardando motorista', color: 'text-accent-dark', bg: 'bg-accent/10' },
  aceita: { label: 'Motorista a caminho', color: 'text-secondary', bg: 'bg-secondary/10' },
  motorista_chegou: { label: 'Motorista chegou', color: 'text-secondary', bg: 'bg-secondary/10' },
  em_andamento: { label: 'Em andamento', color: 'text-primary', bg: 'bg-primary/10' },
  finalizada: { label: 'Finalizada', color: 'text-foreground-muted', bg: 'bg-background-tertiary' },
  cancelada: { label: 'Cancelada', color: 'text-accent2', bg: 'bg-accent2/10' },
};

// ════════════════════════════════════════════════════════════
// HELPERS — Preço estimado
// ════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════
// TIPOS — Financeiro (Etapa 4)
// ════════════════════════════════════════════════════════════

export type TransacaoTipo = 'pagamento_corrida' | 'repasse_motorista' | 'taxa_plataforma' | 'bonus' | 'ajuste' | 'resgate_pontos' | 'cupom_desconto';
export type TransacaoStatus = 'pendente' | 'processando' | 'concluido' | 'falhou' | 'estornado';

export interface Transacao {
  id: string;
  corrida_id?: string | null;
  usuario_id: string;
  tipo: TransacaoTipo;
  status: TransacaoStatus;
  valor_bruto: number;
  taxa_plataforma: number;
  valor_liquido: number;
  forma_pagamento?: FormaPagamento | null;
  pix_qrcode?: string | null;
  pix_copiaecola?: string | null;
  pix_txid?: string | null;
  pix_pago_em?: string | null;
  descricao?: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // Joined
  corrida?: Corrida;
}

export interface Cupom {
  id: string;
  parceiro_id?: string | null;
  codigo: string;
  descricao: string;
  tipo_desconto: 'percentual' | 'fixo';
  valor_desconto: number;
  usos_maximo: number;
  usos_contabilizados: number;
  valor_minimo_corrida?: number | null;
  ativo: boolean;
  valido_de: string;
  valido_ate?: string | null;
  created_at: string;
}

export interface CupomUsado {
  id: string;
  cupom_id: string;
  usuario_id: string;
  corrida_id?: string | null;
  desconto_aplicado: number;
  created_at: string;
  // Joined
  cupom?: Cupom;
}

export interface ConfigTaxa {
  id: string;
  tipo_corrida: string;
  taxa_percentual: number;
  taxa_fixa: number;
  ativo: boolean;
  updated_at: string;
}

export const TRANSACAO_TIPO_LABELS: Record<TransacaoTipo, { label: string; icon: string; color: string }> = {
  pagamento_corrida: { label: 'Pagamento', icon: '💳', color: 'text-accent2' },
  repasse_motorista: { label: 'Repasse', icon: '💰', color: 'text-secondary' },
  taxa_plataforma: { label: 'Taxa Plataforma', icon: '🏢', color: 'text-foreground-muted' },
  bonus: { label: 'Bônus', icon: '🎁', color: 'text-accent-dark' },
  ajuste: { label: 'Ajuste', icon: '🔄', color: 'text-primary' },
  resgate_pontos: { label: 'Resgate Pontos', icon: '⭐', color: 'text-accent-dark' },
  cupom_desconto: { label: 'Cupom', icon: '🏷️', color: 'text-accent2' },
};

export const TRANSACAO_STATUS_LABELS: Record<TransacaoStatus, { label: string; color: string; bg: string }> = {
  pendente: { label: 'Pendente', color: 'text-accent-dark', bg: 'bg-accent/10' },
  processando: { label: 'Processando', color: 'text-primary', bg: 'bg-primary/10' },
  concluido: { label: 'Concluído', color: 'text-secondary', bg: 'bg-secondary/10' },
  falhou: { label: 'Falhou', color: 'text-accent2', bg: 'bg-accent2/10' },
  estornado: { label: 'Estornado', color: 'text-foreground-muted', bg: 'bg-background-tertiary' },
};

// ════════════════════════════════════════════════════════════
// HELPERS — Financeiro
// ════════════════════════════════════════════════════════════

/** Formata valor em BRL */
export function formatarBRL(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/** Calcula taxa e repasse */
export function calcularRepasse(valorCorrida: number, taxaPercentual: number, taxaFixa: number = 0): {
  bruto: number; taxa: number; liquido: number;
} {
  const taxa = Math.round((valorCorrida * taxaPercentual / 100 + taxaFixa) * 100) / 100;
  const liquido = Math.round((valorCorrida - taxa) * 100) / 100;
  return { bruto: valorCorrida, taxa, liquido };
}

// ════════════════════════════════════════════════════════════
// TIPOS — Painel Motorista (Etapa 5)
// ════════════════════════════════════════════════════════════

export type NotificacaoTipo = 'info' | 'corrida_nova' | 'corrida_aceita' | 'corrida_cancelada' | 'pagamento' | 'bonus' | 'meta' | 'ranking' | 'demanda_alta' | 'sistema';

export interface Notificacao {
  id: string;
  usuario_id: string;
  titulo: string;
  mensagem: string;
  tipo: NotificacaoTipo;
  lida: boolean;
  lida_em?: string | null;
  link?: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export type MetaTipo = 'corridas_dia' | 'corridas_semana' | 'corridas_mes' | 'faturamento_semana' | 'faturamento_mes' | 'avaliacao' | 'horario_pico' | 'cruzeiro' | 'evento';

export interface Meta {
  id: string;
  nome: string;
  descricao: string;
  tipo: MetaTipo;
  objetivo: number;
  unidade: 'corridas' | 'reais' | 'pontos' | 'horas';
  recompensa_tipo: 'bonus' | 'pontos' | 'badge';
  recompensa_valor: number;
  inicio_em: string;
  fim_em?: string | null;
  ativa: boolean;
  recorrente: boolean;
  created_at: string;
}

export interface MetaProgresso {
  id: string;
  meta_id: string;
  motorista_id: string;
  progresso: number;
  concluida: boolean;
  concluida_em?: string | null;
  recompensa_resgatada: boolean;
  created_at: string;
  updated_at: string;
  // Joined
  meta?: Meta;
}

export type IncentivoTipo = 'pico' | 'cruzeiro' | 'evento' | 'noite' | 'fim_de_semana' | 'primeira_corrida';

export interface Incentivo {
  id: string;
  nome: string;
  descricao: string;
  tipo: IncentivoTipo;
  multiplicador: number;
  inicio_em: string;
  fim_em?: string | null;
  horario_inicio?: string | null;
  horario_fim?: string | null;
  dias_semana: number[];
  ativo: boolean;
}

export interface RankingMotorista {
  id: string;
  nome: string;
  foto_url?: string | null;
  avaliacao_media: number;
  total_avaliacoes: number;
  veiculo_modelo: string;
  cidade_base: string;
  total_corridas: number;
  ganho_total: number;
  disponivel: boolean;
  corridas_mes: number;
  ganho_mes: number;
  score: number;
}

export const NOTIFICACAO_TIPO_LABELS: Record<NotificacaoTipo, { label: string; icon: string }> = {
  info: { label: 'Informação', icon: 'info' },
  corrida_nova: { label: 'Nova Corrida', icon: 'car' },
  corrida_aceita: { label: 'Corrida Aceita', icon: 'check' },
  corrida_cancelada: { label: 'Corrida Cancelada', icon: 'x' },
  pagamento: { label: 'Pagamento', icon: 'credit-card' },
  bonus: { label: 'Bônus', icon: 'gift' },
  meta: { label: 'Meta', icon: 'target' },
  ranking: { label: 'Ranking', icon: 'trophy' },
  demanda_alta: { label: 'Demanda Alta', icon: 'trending-up' },
  sistema: { label: 'Sistema', icon: 'bell' },
};

export const INCENTIVO_TIPO_LABELS: Record<IncentivoTipo, { label: string; color: string }> = {
  pico: { label: 'Horário de Pico', color: 'text-accent-dark' },
  cruzeiro: { label: 'Temporada Cruzeiros', color: 'text-primary' },
  evento: { label: 'Evento Especial', color: 'text-accent2' },
  noite: { label: 'Turno da Noite', color: 'text-purple-500' },
  fim_de_semana: { label: 'Fim de Semana', color: 'text-secondary' },
  primeira_corrida: { label: 'Primeira Corrida', color: 'text-accent-dark' },
};

// ════════════════════════════════════════════════════════════
// TIPOS — Turismo (Etapa 6)
// ════════════════════════════════════════════════════════════

export type PontoCategoria = 'historico' | 'praia' | 'natureza' | 'museu' | 'religioso' | 'gastronomico' | 'entretenimento' | 'mirante' | 'cultura' | 'esporte';

export interface PontoTuristico {
  id: string;
  nome: string;
  slug: string;
  descricao_curta: string;
  descricao: string;
  endereco?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  cidade: string;
  categoria: PontoCategoria;
  foto_url?: string | null;
  galeria: string[];
  horario_funcionamento?: string | null;
  preco_entrada: number;
  gratuito: boolean;
  dicas?: string | null;
  tempo_visita_minutos?: number | null;
  avaliacao_media: number;
  total_avaliacoes: number;
  ativo: boolean;
  destaque: boolean;
  ordem: number;
  created_at: string;
  updated_at: string;
}

export type RoteiroTipo = 'familia' | 'casal' | 'aventura' | 'cultural' | 'gastronomico' | 'religioso' | 'noturno';

export interface Roteiro {
  id: string;
  nome: string;
  slug: string;
  descricao: string;
  tipo: RoteiroTipo;
  duracao_horas: number;
  preco_base: number;
  preco_6lugares?: number | null;
  pontos_ids: string[];
  foto_url?: string | null;
  inclui: string[];
  nao_inclui: string[];
  observacoes?: string | null;
  ativo: boolean;
  destaque: boolean;
  created_at: string;
  // Joined
  pontos?: PontoTuristico[];
}

export type EventoCategoria = 'show' | 'feira' | 'festival' | 'exposicao' | 'esportivo' | 'religioso' | 'cultural' | 'gastronomico' | 'comunitario';

export interface Evento {
  id: string;
  nome: string;
  descricao: string;
  local: string;
  endereco?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  cidade: string;
  data_inicio: string;
  data_fim?: string | null;
  horario_inicio?: string | null;
  horario_fim?: string | null;
  categoria: EventoCategoria;
  preco?: string | null;
  gratuito: boolean;
  site_url?: string | null;
  foto_url?: string | null;
  ativo: boolean;
  destaque: boolean;
  created_at: string;
}

export interface Cruzeiro {
  id: string;
  navio: string;
  companhia: string;
  data_chegada: string;
  hora_chegada: string;
  data_saida: string;
  hora_saida: string;
  porto: string;
  passageiros?: number | null;
  rota?: string | null;
  status: 'confirmado' | 'cancelado' | 'atrasado';
  ativo: boolean;
  created_at: string;
}

export const PONTO_CATEGORIA_LABELS: Record<PontoCategoria, { label: string; icon: string }> = {
  historico: { label: 'Histórico', icon: 'landmark' },
  praia: { label: 'Praia', icon: 'waves' },
  natureza: { label: 'Natureza', icon: 'tree-pine' },
  museu: { label: 'Museu', icon: 'building-2' },
  religioso: { label: 'Religioso', icon: 'church' },
  gastronomico: { label: 'Gastronômico', icon: 'utensils' },
  entretenimento: { label: 'Entretenimento', icon: 'sparkles' },
  mirante: { label: 'Mirante', icon: 'mountain' },
  cultura: { label: 'Cultura', icon: 'palette' },
  esporte: { label: 'Esporte', icon: 'trophy' },
};

export const ROTEIRO_TIPO_LABELS: Record<RoteiroTipo, { label: string; color: string; icon: string }> = {
  familia: { label: 'Família', color: '#14A76C', icon: 'users' },
  casal: { label: 'Casal', color: '#F5A623', icon: 'heart' },
  aventura: { label: 'Aventura', color: '#0A2463', icon: 'compass' },
  cultural: { label: 'Cultural', color: '#0A2463', icon: 'palette' },
  gastronomico: { label: 'Gastronômico', color: '#E84855', icon: 'utensils' },
  religioso: { label: 'Religioso', color: '#0d2d73', icon: 'church' },
  noturno: { label: 'Noturno', color: '#7c3aed', icon: 'moon' },
};

export const EVENTO_CATEGORIA_LABELS: Record<EventoCategoria, { label: string }> = {
  show: { label: 'Show' },
  feira: { label: 'Feira' },
  festival: { label: 'Festival' },
  exposicao: { label: 'Exposição' },
  esportivo: { label: 'Esportivo' },
  religioso: { label: 'Religioso' },
  cultural: { label: 'Cultural' },
  gastronomico: { label: 'Gastronômico' },
  comunitario: { label: 'Comunitário' },
};

// ════════════════════════════════════════════════════════════
// TIPOS — Parceiros Comerciais (Etapa 7)
// ════════════════════════════════════════════════════════════

export type EstabelecimentoCategoria = 'restaurante' | 'bar' | 'hotel' | 'pousada' | 'cafeteria' | 'loja' | 'farmacia' | 'supermercado' | 'salao' | 'academia' | 'entretenimento' | 'servico' | 'outro';

export interface Estabelecimento {
  id: string;
  parceiro_id?: string | null;
  nome: string;
  slug: string;
  descricao: string;
  categoria: EstabelecimentoCategoria;
  telefone?: string | null;
  whatsapp?: string | null;
  site_url?: string | null;
  instagram?: string | null;
  endereco?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  cidade: string;
  bairro?: string | null;
  foto_url?: string | null;
  galeria: string[];
  logo_url?: string | null;
  horario_funcionamento: Record<string, string>;
  avaliacao_media: number;
  total_avaliacoes: number;
  pontos_por_real: number;
  programa_fidelidade_ativo: boolean;
  descricao_fidelidade?: string | null;
  ativo: boolean;
  destaque: boolean;
  verificado: boolean;
  ordem: number;
  created_at: string;
  updated_at: string;
  // Joined
  campanhas?: CampanhaPromocional[];
}

export interface AvaliacaoParceiro {
  id: string;
  estabelecimento_id: string;
  usuario_id: string;
  nota: number;
  comentario?: string | null;
  foto_url?: string | null;
  created_at: string;
  // Joined
  usuario?: { nome: string; foto_url?: string | null };
}

export type CampanhaTipo = 'desconto' | 'cupom' | 'cashback' | 'frete_gratis' | 'combo' | 'happy_hour';

export interface CampanhaPromocional {
  id: string;
  estabelecimento_id: string;
  titulo: string;
  descricao: string;
  tipo: CampanhaTipo;
  desconto_percentual?: number | null;
  desconto_fixo?: number | null;
  codigo_cupom?: string | null;
  valor_minimo: number;
  data_inicio: string;
  data_fim: string;
  horario_inicio?: string | null;
  horario_fim?: string | null;
  dias_semana: number[];
  uso_maximo?: number | null;
  usos_realizados: number;
  uso_por_usuario: number;
  ativo: boolean;
  destaque: boolean;
  created_at: string;
}

export const ESTABELECIMENTO_CATEGORIA_LABELS: Record<EstabelecimentoCategoria, { label: string; icon: string; color: string }> = {
  restaurante: { label: 'Restaurante', icon: 'utensils', color: '#E84855' },
  bar: { label: 'Bar', icon: 'wine', color: '#7c3aed' },
  hotel: { label: 'Hotel', icon: 'building-2', color: '#0A2463' },
  pousada: { label: 'Pousada', icon: 'home', color: '#0A2463' },
  cafeteria: { label: 'Cafeteria', icon: 'coffee', color: '#F5A623' },
  loja: { label: 'Loja', icon: 'shopping-bag', color: '#14A76C' },
  farmacia: { label: 'Farmácia', icon: 'plus-circle', color: '#14A76C' },
  supermercado: { label: 'Supermercado', icon: 'shopping-cart', color: '#14A76C' },
  salao: { label: 'Salão', icon: 'scissors', color: '#E84855' },
  academia: { label: 'Academia', icon: 'dumbbell', color: '#0A2463' },
  entretenimento: { label: 'Entretenimento', icon: 'sparkles', color: '#F5A623' },
  servico: { label: 'Serviço', icon: 'wrench', color: '#0d2d73' },
  outro: { label: 'Outro', icon: 'store', color: '#0d2d73' },
};

export const CAMPANHA_TIPO_LABELS: Record<CampanhaTipo, { label: string; color: string }> = {
  desconto: { label: 'Desconto', color: '#14A76C' },
  cupom: { label: 'Cupom', color: '#F5A623' },
  cashback: { label: 'Cashback', color: '#0A2463' },
  frete_gratis: { label: 'Frete Grátis', color: '#14A76C' },
  combo: { label: 'Combo', color: '#7c3aed' },
  happy_hour: { label: 'Happy Hour', color: '#E84855' },
};

// ════════════════════════════════════════════════════════════
// TIPOS — DNA Social e Recompensas (Etapa 8)
// ════════════════════════════════════════════════════════════

export type CampanhaSocialCategoria = 'doacao_sangue' | 'alimentos' | 'meio_ambiente' | 'educacao' | 'inverno' | 'saude' | 'animal' | 'cultural' | 'outro';
export type CampanhaSocialStatus = 'ativa' | 'encerrada' | 'planejada';

export interface CampanhaSocial {
  id: string;
  titulo: string;
  descricao: string;
  categoria: CampanhaSocialCategoria;
  meta_valor?: number | null;
  meta_unidade?: string | null;
  meta_alcancada: number;
  data_inicio: string;
  data_fim?: string | null;
  recorrente: boolean;
  foto_url?: string | null;
  status: CampanhaSocialStatus;
  destaque: boolean;
  pontos_participacao: number;
  local?: string | null;
  cidade: string;
  created_at: string;
  // Joined
  participacoes_count?: number;
}

export type ParticipacaoTipo = 'participacao' | 'doacao' | 'voluntario' | 'compartilhou';

export interface ParticipacaoSocial {
  id: string;
  campanha_id: string;
  usuario_id: string;
  tipo: ParticipacaoTipo;
  descricao?: string | null;
  valor?: number | null;
  pontos_ganhos: number;
  created_at: string;
  // Joined
  campanha?: Pick<CampanhaSocial, 'titulo' | 'categoria'>;
  usuario?: { nome: string; foto_url?: string | null };
}

export type RecompensaCategoria = 'desconto_corrida' | 'upgrade' | 'produto' | 'experiencia' | 'certificado' | 'outro';

export interface Recompensa {
  id: string;
  nome: string;
  descricao: string;
  categoria: RecompensaCategoria;
  pontos_necessarios: number;
  imagem_url?: string | null;
  valor_desconto?: number | null;
  codigo?: string | null;
  quantidade_total?: number | null;
  quantidade_resgatada: number;
  ativo: boolean;
  destaque: boolean;
  created_at: string;
}

export type ResgateStatus = 'pendente' | 'aprovado' | 'entregue' | 'cancelado';

export interface ResgateRecompensa {
  id: string;
  recompensa_id: string;
  usuario_id: string;
  pontos_gastos: number;
  status: ResgateStatus;
  codigo_resgate?: string | null;
  created_at: string;
  // Joined
  recompensa?: Pick<Recompensa, 'nome' | 'descricao' | 'categoria'>;
}

export type HistoricoPontosTipo = 'corrida' | 'avaliacao' | 'indicacao' | 'campanha_social' | 'login_diario' | 'resgate' | 'bonus' | 'ajuste';

export interface HistoricoPontos {
  id: string;
  usuario_id: string;
  tipo: HistoricoPontosTipo;
  pontos: number;
  descricao: string;
  referencia_id?: string | null;
  created_at: string;
}

export const CAMPANHA_SOCIAL_CATEGORIA_LABELS: Record<CampanhaSocialCategoria, { label: string; icon: string; color: string }> = {
  doacao_sangue: { label: 'Doação de Sangue', icon: 'droplets', color: '#E84855' },
  alimentos: { label: 'Alimentos', icon: 'apple', color: '#14A76C' },
  meio_ambiente: { label: 'Meio Ambiente', icon: 'leaf', color: '#F5A623' },
  educacao: { label: 'Educação', icon: 'book-open', color: '#0A2463' },
  inverno: { label: 'Campanha de Inverno', icon: 'snowflake', color: '#0d2d73' },
  saude: { label: 'Saúde', icon: 'heart-pulse', color: '#E84855' },
  animal: { label: 'Animais', icon: 'paw-print', color: '#14A76C' },
  cultural: { label: 'Cultural', icon: 'palette', color: '#7c3aed' },
  outro: { label: 'Outro', icon: 'heart', color: '#0d2d73' },
};

export const RECOMPENSA_CATEGORIA_LABELS: Record<RecompensaCategoria, { label: string; icon: string }> = {
  desconto_corrida: { label: 'Desconto', icon: 'percent' },
  upgrade: { label: 'Upgrade', icon: 'arrow-up-circle' },
  produto: { label: 'Produto', icon: 'package' },
  experiencia: { label: 'Experiência', icon: 'sparkles' },
  certificado: { label: 'Certificado', icon: 'award' },
  outro: { label: 'Outro', icon: 'gift' },
};

export const PONTOS_CONFIG = {
  corrida: 10,           // por corrida
  avaliacao: 5,          // por avaliação dada
  avaliacao_recebida: 5, // por avaliação recebida
  indicacao: 50,         // por amigo indicado que faz cadastro
  campanha_social: 50,   // por participação em campanha
  login_diario: 2,       // login diário
  bonus_novato: 100,     // bônus primeiro cadastro
} as const;

// ════════════════════════════════════════════════════════════
// TIPOS — Admin (Etapa 9)
// ════════════════════════════════════════════════════════════

export interface LogAdmin {
  id: string;
  admin_id: string;
  acao: string;
  tabela: string;
  registro_id?: string | null;
  dados_anteriores?: Record<string, unknown> | null;
  dados_novos?: Record<string, unknown> | null;
  ip_address?: string | null;
  created_at: string;
}

export interface AdminStats {
  total_usuarios: number;
  total_passageiros: number;
  total_motoristas: number;
  total_parceiros: number;
  total_corridas: number;
  corridas_concluidas: number;
  faturamento_total: number;
  corridas_ativas: number;
  total_estabelecimentos: number;
  campanhas_ativas: number;
  total_participacoes: number;
  pontos_distribuidos: number;
}

export interface RelatorioCorrida {
  data: string;
  tipo: string;
  status: string;
  total: number;
  faturamento: number;
}

export interface RelatorioFinanceiro {
  data: string;
  tipo: string;
  total_transacoes: number;
  valor_bruto_total: number;
  taxas_total: number;
  liquido_total: number;
}

// ════════════════════════════════════════════════════════════
// TIPOS — Módulo Premium (Etapa 10)
// ════════════════════════════════════════════════════════════

// ─── Motoristas Fundadores ───
export interface MotoristaFundador {
  id: string;
  motorista_id: string;
  numero_fundador: number;
  selo_ativo: boolean;
  data_ingresso: string;
  certificado_url?: string | null;
  certificado_emitido_em?: string | null;
  reconhecimento_publico: boolean;
  observacoes?: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // Joined (via view)
  nome?: string;
  foto_url?: string | null;
  avaliacao_media?: number;
  total_avaliacoes?: number;
  veiculo_modelo?: string;
  cidade_base?: string;
  total_corridas?: number;
}

// ─── Sistema de Níveis ───
export type MotoristaNivelSlug = 'bronze' | 'prata' | 'ouro' | 'platinum' | 'elite';

export interface MotoristaNivel {
  id: string;
  nome: string;
  slug: MotoristaNivelSlug;
  ordem: number;
  cor_hex: string;
  cor_gradiente: string;
  icone: string;
  avaliacao_minima: number;
  tempo_plataforma_meses: number;
  corridas_minimas: number;
  taxa_cancelamento_maxima: number;
  treinamentos_minimos: number;
  beneficios: string[];
  comissao_percentual: number;
  prioridade_corridas: number;
  descricao: string;
  ativo: boolean;
}

export interface MotoristaNivelAtual {
  id: string;
  motorista_id: string;
  nivel_atual: string;
  nivel_destino?: string | null;
  progresso_percentual: number;
  avaliacao_atual: number;
  tempo_plataforma_meses: number;
  total_corridas: number;
  taxa_cancelamento: number;
  treinamentos_concluidos: number;
  pontualidade_percentual: number;
  nivel_alcancado_em?: string | null;
  snapshot_em: string;
}

// ─── DNA Pass ───
export type DNAPassPlanoSlug = 'mensal' | 'trimestral' | 'anual';
export type DNAPassStatus = 'trial' | 'ativa' | 'cancelada' | 'expirada' | 'suspendida';
export type DNAPassBeneficioCategoria = 'comissao' | 'prioridade' | 'desconto' | 'suporte' | 'exclusivo' | 'geral';

export interface DNAPassPlano {
  id: string;
  nome: string;
  slug: DNAPassPlanoSlug;
  preco_mensal: number;
  preco_total: number;
  desconto_percentual: number;
  periodo_meses: number;
  descricao: string;
  descricao_curta?: string | null;
  destaque: boolean;
  badge?: string | null;
  cor_hex: string;
  ativo: boolean;
  ordem: number;
}

export interface DNAPassBeneficio {
  id: string;
  titulo: string;
  descricao: string;
  icone: string;
  plano_id?: string | null;
  categoria: DNAPassBeneficioCategoria;
  valor?: string | null;
  ordem: number;
  ativo: boolean;
}

export interface DNAPassAssinatura {
  id: string;
  motorista_id: string;
  plano_id: string;
  status: DNAPassStatus;
  inicio_em: string;
  fim_em: string;
  proxima_cobranca?: string | null;
  auto_renovar: boolean;
  metodo_pagamento?: 'pix' | 'cartao' | 'boleto' | null;
  valor_pago: number;
  cancelado_em?: string | null;
  motivo_cancelamento?: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // Joined
  plano?: DNAPassPlano;
}

export const MOTORISTA_NIVEL_LABELS: Record<MotoristaNivelSlug, { label: string; color: string; icon: string }> = {
  bronze: { label: 'Bronze', color: '#CD7F32', icon: 'shield' },
  prata: { label: 'Prata', color: '#C0C0C0', icon: 'shield-check' },
  ouro: { label: 'Ouro', color: '#FFD700', icon: 'award' },
  platinum: { label: 'Platinum', color: '#E5E4E2', icon: 'crown' },
  elite: { label: 'Elite', color: '#00CEC9', icon: 'gem' },
};

export const DNA_PASS_STATUS_LABELS: Record<DNAPassStatus, { label: string; color: string; bg: string }> = {
  trial: { label: 'Período de Teste', color: 'text-accent-dark', bg: 'bg-accent/10' },
  ativa: { label: 'Ativa', color: 'text-secondary', bg: 'bg-secondary/10' },
  cancelada: { label: 'Cancelada', color: 'text-foreground-muted', bg: 'bg-background-tertiary' },
  expirada: { label: 'Expirada', color: 'text-accent2', bg: 'bg-accent2/10' },
  suspendida: { label: 'Suspensa', color: 'text-accent2', bg: 'bg-accent2/10' },
};

// ════════════════════════════════════════════════════════════
// TIPOS — Módulo Premium Fase 2 (Etapa 11)
// ════════════════════════════════════════════════════════════

// ─── Central de Benefícios ───
export type BeneficioCategoria =
  | 'combustivel' | 'oficina' | 'troca_oleo' | 'lavagem' | 'pneus'
  | 'auto_eletrica' | 'funilaria' | 'loja_auto' | 'alimentacao'
  | 'farmacia' | 'academia' | 'barbearia' | 'clinica' | 'outro';

export interface BeneficioParceiro {
  id: string;
  nome: string;
  categoria: BeneficioCategoria;
  desconto_descricao: string;
  desconto_percentual?: number | null;
  condicoes?: string | null;
  telefone?: string | null;
  whatsapp?: string | null;
  endereco?: string | null;
  cidade: string;
  latitude?: number | null;
  longitude?: number | null;
  logo_url?: string | null;
  foto_url?: string | null;
  dna_pass_exclusivo: boolean;
  desconto_dna_pass?: string | null;
  ativo: boolean;
  destaque: boolean;
  verificado: boolean;
  ordem: number;
}

export const BENEFICIO_CATEGORIA_LABELS: Record<BeneficioCategoria, { label: string; icon: string; color: string }> = {
  combustivel: { label: 'Combustível', icon: 'fuel', color: '#E84855' },
  oficina: { label: 'Oficina', icon: 'wrench', color: '#0A2463' },
  troca_oleo: { label: 'Troca de Óleo', icon: 'droplet', color: '#F5A623' },
  lavagem: { label: 'Lavagem', icon: 'droplets', color: '#14A76C' },
  pneus: { label: 'Pneus', icon: 'circle-dot', color: '#0d2d73' },
  auto_eletrica: { label: 'Auto Elétrica', icon: 'zap', color: '#F5A623' },
  funilaria: { label: 'Funilaria', icon: 'hammer', color: '#0A2463' },
  loja_auto: { label: 'Loja Automotiva', icon: 'shopping-bag', color: '#14A76C' },
  alimentacao: { label: 'Alimentação', icon: 'utensils', color: '#E84855' },
  farmacia: { label: 'Farmácia', icon: 'pill', color: '#14A76C' },
  academia: { label: 'Academia', icon: 'dumbbell', color: '#0A2463' },
  barbearia: { label: 'Barbearia', icon: 'scissors', color: '#E84855' },
  clinica: { label: 'Clínica', icon: 'stethoscope', color: '#0A2463' },
  outro: { label: 'Outro', icon: 'store', color: '#0d2d73' },
};

// ─── Saúde e Bem-estar ───
export type SaudeTipo = 'psicologo' | 'nutricionista' | 'fisioterapeuta' | 'academia' | 'clinica' | 'medico' | 'outro';

export interface ParceiroSaude {
  id: string;
  nome: string;
  tipo: SaudeTipo;
  descricao?: string | null;
  especialidades: string[];
  desconto_descricao?: string | null;
  desconto_percentual?: number | null;
  aceita_convenio: boolean;
  convenios: string[];
  atendimento_online: boolean;
  atendimento_presencial: boolean;
  telefone?: string | null;
  whatsapp?: string | null;
  endereco?: string | null;
  cidade: string;
  latitude?: number | null;
  longitude?: number | null;
  logo_url?: string | null;
  foto_url?: string | null;
  dna_pass_exclusivo: boolean;
  desconto_dna_pass?: string | null;
  ativo: boolean;
  destaque: boolean;
  ordem: number;
}

export const SAUDE_TIPO_LABELS: Record<SaudeTipo, { label: string; icon: string; color: string }> = {
  psicologo: { label: 'Psicólogo', icon: 'brain', color: '#7c3aed' },
  nutricionista: { label: 'Nutricionista', icon: 'apple', color: '#14A76C' },
  fisioterapeuta: { label: 'Fisioterapeuta', icon: 'activity', color: '#F5A623' },
  academia: { label: 'Academia', icon: 'dumbbell', color: '#0A2463' },
  clinica: { label: 'Clínica', icon: 'stethoscope', color: '#E84855' },
  medico: { label: 'Médico', icon: 'stethoscope', color: '#0A2463' },
  outro: { label: 'Outro', icon: 'heart-pulse', color: '#0d2d73' },
};

// ─── Educação / Cursos ───
export type CursoCategoria =
  | 'direcao_defensiva' | 'atendimento' | 'primeiros_socorros'
  | 'idiomas' | 'educacao_financeira' | 'marketing' | 'gestao' | 'outro';

export type CursoNivel = 'basico' | 'intermediario' | 'avancado';
export type CursoProgressoStatus = 'matriculado' | 'em_andamento' | 'concluido' | 'abandonado';

export interface CursoModulo {
  titulo: string;
  duracao_min: number;
}

export interface Curso {
  id: string;
  titulo: string;
  slug: string;
  descricao: string;
  descricao_curta?: string | null;
  categoria: CursoCategoria;
  carga_horaria_horas: number;
  nivel: CursoNivel;
  modulos: CursoModulo[];
  total_modulos: number;
  imagem_url?: string | null;
  video_intro_url?: string | null;
  pontos_recompensa: number;
  certificado_disponivel: boolean;
  nivel_minimo?: MotoristaNivelSlug | null;
  dna_pass_exclusivo: boolean;
  instrutor_nome?: string | null;
  instrutor_bio?: string | null;
  ativo: boolean;
  destaque: boolean;
  ordem: number;
  total_matriculas: number;
  total_concluidos: number;
}

export interface CursoProgresso {
  id: string;
  curso_id: string;
  motorista_id: string;
  status: CursoProgressoStatus;
  modulos_concluidos: number[];
  progresso_percentual: number;
  matriculado_em: string;
  iniciado_em?: string | null;
  concluido_em?: string | null;
  nota_final?: number | null;
  certificado_url?: string | null;
  certificado_emitido_em?: string | null;
  // Joined
  curso?: Curso;
}

export const CURSO_CATEGORIA_LABELS: Record<CursoCategoria, { label: string; icon: string; color: string }> = {
  direcao_defensiva: { label: 'Direção Defensiva', icon: 'shield-check', color: '#0A2463' },
  atendimento: { label: 'Atendimento', icon: 'smile', color: '#14A76C' },
  primeiros_socorros: { label: 'Primeiros Socorros', icon: 'heart-pulse', color: '#E84855' },
  idiomas: { label: 'Idiomas', icon: 'languages', color: '#F5A623' },
  educacao_financeira: { label: 'Educação Financeira', icon: 'wallet', color: '#14A76C' },
  marketing: { label: 'Marketing Pessoal', icon: 'megaphone', color: '#7c3aed' },
  gestao: { label: 'Gestão', icon: 'briefcase', color: '#0d2d73' },
  outro: { label: 'Outro', icon: 'book-open', color: '#0d2d73' },
};

export const CURSO_NIVEL_LABELS: Record<CursoNivel, { label: string; color: string }> = {
  basico: { label: 'Básico', color: 'text-secondary' },
  intermediario: { label: 'Intermediário', color: 'text-accent-dark' },
  avancado: { label: 'Avançado', color: 'text-accent2' },
};

export const CURSO_STATUS_LABELS: Record<CursoProgressoStatus, { label: string; color: string; bg: string }> = {
  matriculado: { label: 'Matriculado', color: 'text-primary', bg: 'bg-primary/10' },
  em_andamento: { label: 'Em Andamento', color: 'text-accent-dark', bg: 'bg-accent/10' },
  concluido: { label: 'Concluído', color: 'text-secondary', bg: 'bg-secondary/10' },
  abandonado: { label: 'Abandonado', color: 'text-foreground-muted', bg: 'bg-background-tertiary' },
};

// ════════════════════════════════════════════════════════════
// TIPOS — Módulo Premium Fase 3 (Etapa 12)
// ════════════════════════════════════════════════════════════

// ─── Comunidade ───
export type ComunidadeTopicoTipo = 'discussao' | 'sugestao' | 'duvida' | 'aviso' | 'denuncia' | 'grupo_cidade';
export type ComunidadeTopicoStatus = 'aberto' | 'em_analise' | 'aprovado' | 'recusado' | 'implementado' | 'fechado';

export interface ComunidadeCategoria {
  id: string;
  nome: string;
  slug: string;
  descricao?: string | null;
  icone: string;
  cor_hex: string;
  ordem: number;
  ativo: boolean;
}

export interface ComunidadeTopico {
  id: string;
  categoria_id?: string | null;
  autor_id: string;
  titulo: string;
  conteudo: string;
  tipo: ComunidadeTopicoTipo;
  status: ComunidadeTopicoStatus;
  cidade?: string | null;
  imagem_url?: string | null;
  fixado: boolean;
  total_votos: number;
  total_respostas: number;
  total_visualizacoes: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  // Joined
  autor?: { nome: string; foto_url?: string | null };
  categoria?: ComunidadeCategoria;
}

export interface ComunidadeResposta {
  id: string;
  topico_id: string;
  autor_id: string;
  conteudo: string;
  imagem_url?: string | null;
  melhor_resposta: boolean;
  total_votos: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  autor?: { nome: string; foto_url?: string | null };
}

// ─── Previsão de Demanda ───
export interface DemandaRegiao {
  id: string;
  nome: string;
  cidade: string;
  bairro?: string | null;
  latitude: number;
  longitude: number;
  raio_km: number;
  nivel_demanda: number;
  demanda_por_hora: Record<string, number>;
  melhores_horarios: string[];
  fatores: string[];
  evento_proximo?: string | null;
  evento_fim?: string | null;
  aumento_turismo_percentual: number;
  cor_hex: string;
  ativo: boolean;
}

export type DemandaEventoTipo = 'show' | 'jogo' | 'feira' | 'congresso' | 'cruzeiro' | 'feriado' | 'clima' | 'transito' | 'outro';

export interface DemandaEvento {
  id: string;
  nome: string;
  descricao?: string | null;
  cidade: string;
  local?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  data_inicio: string;
  data_fim?: string | null;
  tipo: DemandaEventoTipo;
  aumento_demanda_percentual: number;
  corridas_estimadas?: number | null;
  recomendacao?: string | null;
  ativo: boolean;
}

export const DEMANDA_EVENTO_TIPO_LABELS: Record<DemandaEventoTipo, { label: string; icon: string; color: string }> = {
  show: { label: 'Show', icon: 'music', color: '#7c3aed' },
  jogo: { label: 'Jogo', icon: 'trophy', color: '#14A76C' },
  feira: { label: 'Feira', icon: 'shopping-cart', color: '#F5A623' },
  congresso: { label: 'Congresso', icon: 'briefcase', color: '#0A2463' },
  cruzeiro: { label: 'Cruzeiro', icon: 'ship', color: '#0d2d73' },
  feriado: { label: 'Feriado', icon: 'calendar', color: '#E84855' },
  clima: { label: 'Clima', icon: 'cloud-rain', color: '#0A2463' },
  transito: { label: 'Trânsito', icon: 'car', color: '#E84855' },
  outro: { label: 'Outro', icon: 'info', color: '#0d2d73' },
};

export const COMUNIDADE_TOPICO_TIPO_LABELS: Record<ComunidadeTopicoTipo, { label: string; icon: string; color: string }> = {
  discussao: { label: 'Discussão', icon: 'message-circle', color: '#0A2463' },
  sugestao: { label: 'Sugestão', icon: 'lightbulb', color: '#F5A623' },
  duvida: { label: 'Dúvida', icon: 'help-circle', color: '#14A76C' },
  aviso: { label: 'Aviso', icon: 'bell', color: '#E84855' },
  denuncia: { label: 'Denúncia', icon: 'flag', color: '#E84855' },
  grupo_cidade: { label: 'Grupo', icon: 'map-pin', color: '#7c3aed' },
};

export const COMUNIDADE_TOPICO_STATUS_LABELS: Record<ComunidadeTopicoStatus, { label: string; color: string; bg: string }> = {
  aberto: { label: 'Aberto', color: 'text-secondary', bg: 'bg-secondary/10' },
  em_analise: { label: 'Em Análise', color: 'text-accent-dark', bg: 'bg-accent/10' },
  aprovado: { label: 'Aprovado', color: 'text-primary', bg: 'bg-primary/10' },
  recusado: { label: 'Recusado', color: 'text-accent2', bg: 'bg-accent2/10' },
  implementado: { label: 'Implementado', color: 'text-secondary', bg: 'bg-secondary/10' },
  fechado: { label: 'Fechado', color: 'text-foreground-muted', bg: 'bg-background-tertiary' },
};

export function calcularPrecoEstimado(tipo: CorridaTipo, distanciaKm?: number, passageiros: number = 1): number {
  const BASE: Record<CorridaTipo, { fixo: number; km: number }> = {
    urbana: { fixo: 15, km: 3.50 },
    executivo: { fixo: 40, km: 5.00 },
    transfer_aeroporto: { fixo: 600, km: 0 },   // GRU R$600 fixo
    transfer_rodoviaria: { fixo: 80, km: 2.50 },
    transfer_hotel: { fixo: 40, km: 3.00 },
    transfer_cruzeiro: { fixo: 50, km: 3.00 },
    city_tour: { fixo: 400, km: 0 },             // R$400/3h fixo
    passeio_turistico: { fixo: 200, km: 2.00 },
  };

  const config = BASE[tipo];
  const distKm = distanciaKm ?? 10; // default 10km se sem coords
  let preco = config.fixo + (config.km * distKm);

  // Carro 6 lugares custa mais (+30%)
  if (passageiros > 4) preco *= 1.3;

  return Math.round(preco * 100) / 100;
}
