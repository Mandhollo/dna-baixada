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
