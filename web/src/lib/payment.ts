import { MercadoPagoConfig, Payment } from 'mercadopago';

// ════════════════════════════════════════════════════════════
// Mercado Pago SDK — PIX Payment Integration
// ════════════════════════════════════════════════════════════

const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

if (!accessToken) {
  console.warn(
    '[payment] MERCADOPAGO_ACCESS_TOKEN not set — PIX payments will fail'
  );
}

const client = new MercadoPagoConfig({
  accessToken: accessToken ?? '',
  options: { timeout: 15000 },
});

const paymentApi = new Payment(client);

// ── Types ──────────────────────────────────────────────────

export interface CreatePixPaymentInput {
  amount: number;
  description: string;
  email: string;
  cpf: string;
  nome?: string;
  externalReference?: string;
}

export interface PixPaymentResult {
  payment_id: number;
  qr_code_base64: string;
  qr_code_copy: string;
  status: string;
  date_of_expiration?: string;
}

export type PaymentStatus =
  | 'pending'
  | 'approved'
  | 'authorized'
  | 'in_process'
  | 'in_mediation'
  | 'rejected'
  | 'cancelled'
  | 'refunded'
  | 'charged_back';

export interface PaymentStatusResult {
  id: number;
  status: PaymentStatus;
  status_detail: string;
  date_approved?: string;
  external_reference?: string;
}

// ── Create PIX Payment ─────────────────────────────────────

export async function createPixPayment(
  input: CreatePixPaymentInput
): Promise<PixPaymentResult> {
  if (!accessToken) {
    throw new Error('MERCADOPAGO_ACCESS_TOKEN não configurado');
  }

  // Limpar CPF: remover pontos e traços
  const cleanCpf = input.cpf.replace(/\D/g, '');

  const result = await paymentApi.create({
    body: {
      transaction_amount: input.amount,
      description: input.description,
      payment_method_id: 'pix',
      payer: {
        email: input.email,
        first_name: input.nome?.split(' ')[0] ?? 'Passageiro',
        last_name:
          input.nome?.split(' ').slice(1).join(' ') ?? 'DNA Baixada',
        identification: {
          type: 'CPF',
          number: cleanCpf,
        },
      },
      external_reference: input.externalReference,
    },
  });

  // Extrair dados do QR Code PIX da resposta
  const transactionData = result.point_of_interaction?.transaction_data;

  return {
    payment_id: result.id!,
    qr_code_base64: transactionData?.qr_code_base64 ?? '',
    qr_code_copy: transactionData?.qr_code ?? '',
    status: result.status ?? 'pending',
    date_of_expiration: result.date_of_expiration ?? undefined,
  };
}

// ── Check Payment Status ───────────────────────────────────

export async function checkPaymentStatus(
  paymentId: number
): Promise<PaymentStatusResult> {
  if (!accessToken) {
    throw new Error('MERCADOPAGO_ACCESS_TOKEN não configurado');
  }

  const result = await paymentApi.get({ id: paymentId });

  return {
    id: result.id!,
    status: (result.status ?? 'pending') as PaymentStatus,
    status_detail: result.status_detail ?? '',
    date_approved: result.date_approved ?? undefined,
    external_reference: result.external_reference ?? undefined,
  };
}
