import { db } from "../db.ts";

/**
 * Interface para credenciais e configurações da integração Asaas
 */
function getAsaasConfig() {
  const apiUrl = (process.env.ASAAS_API_URL || "https://sandbox.asaas.com/api/v3").replace(/\/$/, "");
  const apiKey = process.env.ASAAS_API_KEY || "";
  const webhookToken = process.env.ASAAS_WEBHOOK_TOKEN || "";
  const planValue = parseFloat(process.env.ASAAS_PLAN_VALUE || "59.90");
  const trialDays = parseInt(process.env.ASAAS_TRIAL_DAYS || "14", 10);

  return { apiUrl, apiKey, webhookToken, planValue, trialDays };
}

/**
 * Helper de requisição segura para a API v3 do Asaas.
 * Garante que segredos não vazem nos logs de erro.
 */
export async function asaasRequest<T = any>(
  endpoint: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    body?: any;
    customHeaders?: Record<string, string>;
  } = {}
): Promise<T> {
  const { apiUrl, apiKey } = getAsaasConfig();

  if (!apiKey) {
    throw new Error("ASAAS_API_KEY não configurada no ambiente. Verifique o arquivo .env");
  }

  const url = `${apiUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  const method = options.method || "GET";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "access_token": apiKey,
    "User-Agent": "BarberTool-SaaS/1.0",
    ...(options.customHeaders || {}),
  };

  const fetchOptions: RequestInit = {
    method,
    headers,
  };

  if (options.body && (method === "POST" || method === "PUT")) {
    fetchOptions.body = JSON.stringify(options.body);
  }

  let response: Response;
  try {
    response = await fetch(url, fetchOptions);
  } catch (netErr: any) {
    console.error("[Asaas API] Erro de rede:", netErr.message);
    throw new Error("Falha na comunicação de rede com o provedor de pagamentos Asaas.");
  }

  const responseText = await response.text();
  let json: any = null;
  try {
    json = responseText ? JSON.parse(responseText) : {};
  } catch {
    json = { raw: responseText };
  }

  if (!response.ok) {
    // Asaas retorna erros no formato { errors: [{ code: '...', description: '...' }] }
    let errorMessage = `Erro Asaas HTTP ${response.status}`;
    if (json?.errors && Array.isArray(json.errors) && json.errors.length > 0) {
      const descriptions = json.errors.map((e: any) => e.description || e.code).join(" | ");
      errorMessage = `Erro Asaas: ${descriptions}`;
    } else if (json?.message) {
      errorMessage = `Erro Asaas: ${json.message}`;
    }

    console.error(`[Asaas API] Falha ${method} ${endpoint}:`, errorMessage);
    const err = new Error(errorMessage) as any;
    err.status = response.status;
    err.asaasErrors = json?.errors || [];
    throw err;
  }

  return json as T;
}

/**
 * Calcula a regra de data de cobrança com base no período de testes (Trial).
 * Regra:
 * - Se o trial ainda estiver ativo no futuro: nextDueDate = data exata do fim do trial (YYYY-MM-DD).
 *   O usuário NÃO é cobrado antes do término do período de teste.
 * - Se o trial já expirou: nextDueDate = hoje (YYYY-MM-DD), autorizando e cobrando imediatamente.
 */
export function calculateTrialAndNextDueDate(barbershop: any): {
  nextDueDate: string;
  isTrialActive: boolean;
  trialDaysRemaining: number;
} {
  const now = new Date();
  
  if (barbershop?.trialEndsAt) {
    const trialDate = new Date(barbershop.trialEndsAt);
    
    if (trialDate > now) {
      // Trial ativo: nextDueDate no fim do trial
      const year = trialDate.getFullYear();
      const month = String(trialDate.getMonth() + 1).padStart(2, "0");
      const day = String(trialDate.getDate()).padStart(2, "0");
      const nextDueDate = `${year}-${month}-${day}`;
      
      const diffTime = trialDate.getTime() - now.getTime();
      const trialDaysRemaining = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      
      return {
        nextDueDate,
        isTrialActive: true,
        trialDaysRemaining,
      };
    }
  }

  // Trial expirado ou inexistente: cobrança inicia hoje
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const nextDueDate = `${year}-${month}-${day}`;

  return {
    nextDueDate,
    isTrialActive: false,
    trialDaysRemaining: 0,
  };
}

/**
 * Cria ou recupera cliente no Asaas para uma barbearia
 */
export async function createOrGetAsaasCustomer(
  barbershopId: string,
  customerData?: {
    name?: string;
    email?: string;
    phone?: string;
    cpfCnpj?: string;
    postalCode?: string;
    address?: string;
    addressNumber?: string;
    province?: string;
  }
): Promise<{ asaasCustomerId: string; created: boolean; customer: any }> {
  const shopRef = db.collection("barbershops").doc(barbershopId);
  const shopDoc = await shopRef.get();

  if (!shopDoc.exists) {
    throw new Error("Barbearia não encontrada no banco de dados.");
  }

  const barbershop = shopDoc.data();

  // 1. Se já possui asaasCustomerId gravado, verifica se o cliente existe no Asaas
  if (barbershop?.asaasCustomerId) {
    try {
      const existingCustomer = await asaasRequest(`/customers/${barbershop.asaasCustomerId}`);
      if (existingCustomer && existingCustomer.id) {
        return { asaasCustomerId: existingCustomer.id, created: false, customer: existingCustomer };
      }
    } catch (err: any) {
      console.warn(`[Asaas] Cliente ${barbershop.asaasCustomerId} não localizado no Asaas. Criando novo...`);
    }
  }

  // 2. Prepara payload de criação com higienização de dados
  const cleanPhone = (customerData?.phone || barbershop?.phone || "").replace(/\D/g, "");
  const cleanCpfCnpj = (customerData?.cpfCnpj || "").replace(/\D/g, "");
  const cleanPostalCode = (customerData?.postalCode || "").replace(/\D/g, "");

  const payload: Record<string, any> = {
    name: customerData?.name || barbershop?.name || "Barbearia",
    email: customerData?.email || barbershop?.email || `barbearia_${barbershopId}@sistema.com`,
    externalReference: barbershopId,
    notificationDisabled: false,
  };

  if (cleanPhone) {
    if (cleanPhone.length >= 10) {
      payload.mobilePhone = cleanPhone;
    }
    payload.phone = cleanPhone;
  }

  if (cleanCpfCnpj) {
    payload.cpfCnpj = cleanCpfCnpj;
  }

  if (cleanPostalCode) {
    payload.postalCode = cleanPostalCode;
  }

  if (customerData?.address) {
    payload.address = customerData.address;
  }

  if (customerData?.addressNumber) {
    payload.addressNumber = customerData.addressNumber;
  }

  if (customerData?.province) {
    payload.province = customerData.province;
  }

  console.log(`[Asaas] Criando cliente para barbearia ${barbershopId}...`);
  const newCustomer = await asaasRequest("/customers", {
    method: "POST",
    body: payload,
  });

  // 3. Atualiza registro da barbearia com o ID do cliente no Asaas
  await shopRef.update({
    asaasCustomerId: newCustomer.id,
    updatedAt: new Date().toISOString(),
  });

  return {
    asaasCustomerId: newCustomer.id,
    created: true,
    customer: newCustomer,
  };
}

export interface CreditCardInput {
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
}

export interface CreditCardHolderInfoInput {
  name: string;
  email: string;
  cpfCnpj: string;
  postalCode: string;
  addressNumber: string;
  phone: string;
  mobilePhone?: string;
  addressComplement?: string;
}

export interface CreateSubscriptionPayload {
  billingType: "CREDIT_CARD";
  creditCard: CreditCardInput;
  creditCardHolderInfo: CreditCardHolderInfoInput;
  remoteIp?: string;
}

/**
 * Cria uma assinatura mensal recorrente com cartão de crédito no Asaas.
 * Respeita estritamente o período de testes (trial) para a data da primeira cobrança.
 */
export async function createMonthlyCreditCardSubscription(
  barbershopId: string,
  data: CreateSubscriptionPayload,
  clientIp?: string
) {
  // Requisito: A cobrança aceita apenas cartão de crédito
  if (data.billingType !== "CREDIT_CARD") {
    throw new Error("Forma de pagamento inválida. O sistema aceita exclusivamente cartão de crédito para assinaturas mensais.");
  }

  if (!data.creditCard?.number || !data.creditCard?.holderName || !data.creditCard?.expiryMonth || !data.creditCard?.expiryYear || !data.creditCard?.ccv) {
    throw new Error("Dados do cartão de crédito incompletos.");
  }

  if (!data.creditCardHolderInfo?.name || !data.creditCardHolderInfo?.cpfCnpj || !data.creditCardHolderInfo?.postalCode || !data.creditCardHolderInfo?.phone) {
    throw new Error("Dados do titular do cartão incompletos (Nome, CPF/CNPJ, CEP e Telefone são obrigatórios).");
  }

  const shopRef = db.collection("barbershops").doc(barbershopId);
  const shopDoc = await shopRef.get();

  if (!shopDoc.exists) {
    throw new Error("Barbearia não encontrada.");
  }

  const barbershop = shopDoc.data();

  // Prevenção de duplicidade: se já existe assinatura ativa no Asaas, impede recriação acidental
  if (barbershop?.asaasSubscriptionId && barbershop?.subscriptionStatus === "premium") {
    throw new Error("Esta barbearia já possui uma assinatura ativa no Asaas. Para alterar o cartão ou plano, utilize o gerenciamento de assinatura.");
  }

  // 1. Garantir ou criar cliente no Asaas
  const { asaasCustomerId } = await createOrGetAsaasCustomer(barbershopId, {
    name: data.creditCardHolderInfo.name,
    email: data.creditCardHolderInfo.email,
    phone: data.creditCardHolderInfo.phone,
    cpfCnpj: data.creditCardHolderInfo.cpfCnpj,
    postalCode: data.creditCardHolderInfo.postalCode,
    addressNumber: data.creditCardHolderInfo.addressNumber,
  });

  // 2. Calcular data de cobrança (Regra de Trial)
  const { nextDueDate, isTrialActive, trialDaysRemaining } = calculateTrialAndNextDueDate(barbershop);
  const { planValue } = getAsaasConfig();

  // Limpeza de campos de cartão e CPF
  const cleanCardNumber = data.creditCard.number.replace(/\D/g, "");
  const cleanCpfCnpj = data.creditCardHolderInfo.cpfCnpj.replace(/\D/g, "");
  const cleanPostalCode = data.creditCardHolderInfo.postalCode.replace(/\D/g, "");
  const cleanPhone = data.creditCardHolderInfo.phone.replace(/\D/g, "");
  const cleanCardCcv = data.creditCard.ccv.trim();

  const subscriptionPayload = {
    customer: asaasCustomerId,
    billingType: "CREDIT_CARD",
    value: planValue,
    nextDueDate,
    cycle: "MONTHLY",
    description: `Assinatura Mensal BarberTool SaaS - ${barbershop.name || "Barbearia"}`,
    creditCard: {
      holderName: data.creditCard.holderName.trim(),
      number: cleanCardNumber,
      expiryMonth: data.creditCard.expiryMonth.padStart(2, "0"),
      expiryYear: data.creditCard.expiryYear.length === 2 ? `20${data.creditCard.expiryYear}` : data.creditCard.expiryYear,
      ccv: cleanCardCcv,
    },
    creditCardHolderInfo: {
      name: data.creditCardHolderInfo.name.trim(),
      email: data.creditCardHolderInfo.email.trim(),
      cpfCnpj: cleanCpfCnpj,
      postalCode: cleanPostalCode,
      addressNumber: data.creditCardHolderInfo.addressNumber,
      addressComplement: data.creditCardHolderInfo.addressComplement || null,
      phone: cleanPhone,
      mobilePhone: data.creditCardHolderInfo.mobilePhone ? data.creditCardHolderInfo.mobilePhone.replace(/\D/g, "") : cleanPhone,
    },
    remoteIp: clientIp || data.remoteIp || "127.0.0.1",
  };

  console.log(`[Asaas] Criando assinatura mensal para cliente ${asaasCustomerId}. nextDueDate=${nextDueDate} (Trial ativo: ${isTrialActive})`);

  try {
    const asaasSubscription = await asaasRequest("/subscriptions", {
      method: "POST",
      body: subscriptionPayload,
    });

    const cardLast4 = cleanCardNumber.slice(-4);
    const cardBrand = asaasSubscription.creditCard?.creditCardBrand || "CREDIT_CARD";

    // Se o trial ainda estiver ativo, o status permanece 'trial' (com cartão vinculado e validado).
    // Quando o trial expirar ou a primeira cobrança for confirmada, o status vira 'premium'.
    // Se o trial já estava expirado, a cobrança é hoje e o status vira 'premium' imediatamente.
    const newSubscriptionStatus = isTrialActive ? "trial" : "premium";

    await shopRef.update({
      asaasSubscriptionId: asaasSubscription.id,
      asaasCustomerId,
      subscriptionStatus: newSubscriptionStatus,
      hasPaymentMethod: true,
      planValue,
      cycle: "MONTHLY",
      nextDueDate,
      creditCardBrand: cardBrand,
      creditCardLast4: cardLast4,
      lastPaymentStatus: isTrialActive ? "SCHEDULED" : "AUTHORIZED",
      updatedAt: new Date().toISOString(),
    });

    return {
      success: true,
      subscriptionId: asaasSubscription.id,
      status: newSubscriptionStatus,
      nextDueDate,
      isTrialActive,
      trialDaysRemaining,
      planValue,
      creditCard: {
        brand: cardBrand,
        last4: cardLast4,
      },
      message: isTrialActive
        ? `Cartão validado com sucesso! Seu período de teste continua ativo por mais ${trialDaysRemaining} dias. A primeira cobrança ocorrerá em ${nextDueDate}.`
        : "Assinatura ativada com sucesso! Seu plano Premium está liberado.",
    };
  } catch (err: any) {
    console.error(`[Asaas] Falha na autorização do cartão para barbearia ${barbershopId}:`, err.message);

    // Se o cartão não for autorizado, atualiza o status para sinalizar falha no banco
    await shopRef.update({
      subscriptionStatus: "payment_failed",
      lastPaymentError: err.message,
      updatedAt: new Date().toISOString(),
    });

    throw err;
  }
}

/**
 * Consulta o status atual da assinatura e do período de teste da barbearia
 */
export async function getSubscriptionDetails(barbershopId: string) {
  const shopDoc = await db.collection("barbershops").doc(barbershopId).get();

  if (!shopDoc.exists) {
    throw new Error("Barbearia não encontrada.");
  }

  const barbershop = shopDoc.data();
  const { planValue } = getAsaasConfig();
  const { isTrialActive, trialDaysRemaining, nextDueDate } = calculateTrialAndNextDueDate(barbershop);

  let asaasLiveStatus: string | null = null;
  if (barbershop.asaasSubscriptionId) {
    try {
      const sub = await asaasRequest(`/subscriptions/${barbershop.asaasSubscriptionId}`);
      asaasLiveStatus = sub?.status || null;
    } catch {
      // Falha não-bloqueante na consulta externa
    }
  }

  return {
    status: barbershop.subscriptionStatus || "trial",
    isTrialActive,
    trialEndsAt: barbershop.trialEndsAt || null,
    trialDaysRemaining,
    planValue: barbershop.planValue || planValue,
    cycle: "MONTHLY",
    billingType: "CREDIT_CARD",
    hasPaymentMethod: Boolean(barbershop.hasPaymentMethod),
    nextDueDate: barbershop.nextDueDate || nextDueDate,
    creditCardBrand: barbershop.creditCardBrand || null,
    creditCardLast4: barbershop.creditCardLast4 || null,
    asaasSubscriptionId: barbershop.asaasSubscriptionId || null,
    asaasCustomerId: barbershop.asaasCustomerId || null,
    asaasLiveStatus,
    lastPaymentStatus: barbershop.lastPaymentStatus || null,
  };
}

/**
 * Cancela a assinatura recorrente no Asaas e atualiza o status da barbearia no banco
 */
export async function cancelAsaasSubscription(barbershopId: string) {
  const shopRef = db.collection("barbershops").doc(barbershopId);
  const shopDoc = await shopRef.get();

  if (!shopDoc.exists) {
    throw new Error("Barbearia não encontrada.");
  }

  const barbershop = shopDoc.data();

  if (barbershop.asaasSubscriptionId) {
    try {
      await asaasRequest(`/subscriptions/${barbershop.asaasSubscriptionId}`, {
        method: "DELETE",
      });
      console.log(`[Asaas] Assinatura ${barbershop.asaasSubscriptionId} cancelada no Asaas.`);
    } catch (err: any) {
      console.warn(`[Asaas] Falha ao cancelar assinatura no Asaas (${err.message}). Atualizando banco localmente.`);
    }
  }

  await shopRef.update({
    subscriptionStatus: "cancelled",
    cancelledAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  return {
    success: true,
    message: "Assinatura cancelada com sucesso.",
  };
}

/**
 * Validação de token de segurança do Webhook Asaas
 */
export function validateAsaasWebhookToken(receivedToken: string | undefined): boolean {
  const { webhookToken } = getAsaasConfig();
  if (!webhookToken) {
    // Se nenhum token foi definido em .env ainda, emite aviso em desenvolvimento mas não quebra testes locais
    console.warn("[Asaas Webhook] ASAAS_WEBHOOK_TOKEN não configurado no .env.");
    return true;
  }
  return receivedToken === webhookToken;
}

/**
 * Processa eventos de Webhook do Asaas com garantia de IDEMPOTÊNCIA e atualização de status
 */
export async function processAsaasWebhookEvent(payload: any): Promise<{
  processed: boolean;
  duplicate?: boolean;
  event: string;
  barbershopId?: string;
}> {
  const event = payload?.event;
  const eventId = payload?.id || `${payload?.payment?.id || payload?.subscription?.id || "unknown"}_${event}`;

  if (!event) {
    throw new Error("Payload de webhook inválido: campo 'event' ausente.");
  }

  // 1. Verificação de Idempotência: impede reprocessamento do mesmo webhook
  const webhookDoc = await db.collection("processed_webhooks").doc(eventId).get();
  if (webhookDoc.exists) {
    console.log(`[Asaas Webhook] Evento duplicado descartado (idempotência): ${eventId}`);
    return { processed: true, duplicate: true, event };
  }

  const payment = payload.payment;
  const subscriptionId = payment?.subscription || payload.subscription?.id;
  const customerId = payment?.customer || payload.customer?.id;
  const externalReference = payment?.externalReference || payload.subscription?.externalReference;

  // 2. Localiza a barbearia correspondente
  let matchedBarbershopId: string | null = null;
  const shopsRef = db.collection("barbershops");

  if (externalReference) {
    const shopDoc = await shopsRef.doc(externalReference).get();
    if (shopDoc.exists) {
      matchedBarbershopId = shopDoc.id;
    }
  }

  if (!matchedBarbershopId && subscriptionId) {
    const snap = await shopsRef.where("asaasSubscriptionId", "==", subscriptionId).limit(1).get();
    if (!snap.empty) {
      matchedBarbershopId = snap.docs[0].id;
    }
  }

  if (!matchedBarbershopId && customerId) {
    const snap = await shopsRef.where("asaasCustomerId", "==", customerId).limit(1).get();
    if (!snap.empty) {
      matchedBarbershopId = snap.docs[0].id;
    }
  }

  // 3. Aplica regras de transição de status
  if (matchedBarbershopId) {
    const shopRef = shopsRef.doc(matchedBarbershopId);

    switch (event) {
      case "PAYMENT_RECEIVED":
      case "PAYMENT_CONFIRMED":
        await shopRef.update({
          subscriptionStatus: "premium",
          lastPaymentStatus: "CONFIRMED",
          lastPaymentAt: new Date().toISOString(),
          nextDueDate: payment?.dueDate || null,
          updatedAt: new Date().toISOString(),
        });
        console.log(`[Asaas Webhook] Barbearia ${matchedBarbershopId} promovida para 'premium' via evento ${event}`);
        break;

      case "PAYMENT_OVERDUE":
        await shopRef.update({
          subscriptionStatus: "past_due",
          lastPaymentStatus: "OVERDUE",
          updatedAt: new Date().toISOString(),
        });
        console.warn(`[Asaas Webhook] Pagamento em atraso para barbearia ${matchedBarbershopId}. Status alterado para 'past_due'`);
        break;

      case "PAYMENT_REFUNDED":
      case "PAYMENT_DELETED":
        await shopRef.update({
          subscriptionStatus: "past_due",
          lastPaymentStatus: event,
          updatedAt: new Date().toISOString(),
        });
        console.log(`[Asaas Webhook] Pagamento estornado/deletado para barbearia ${matchedBarbershopId}`);
        break;

      case "SUBSCRIPTION_CANCELLED":
      case "SUBSCRIPTION_INACTIVATED":
        await shopRef.update({
          subscriptionStatus: "cancelled",
          cancelledAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        console.log(`[Asaas Webhook] Assinatura cancelada para barbearia ${matchedBarbershopId}`);
        break;

      default:
        console.log(`[Asaas Webhook] Evento ${event} recebido para barbearia ${matchedBarbershopId} sem alteração crítica de status.`);
        break;
    }
  } else {
    console.warn(`[Asaas Webhook] Nenhuma barbearia encontrada para o evento ${event} (Sub: ${subscriptionId}, Cus: ${customerId})`);
  }

  // 4. Registra webhook processado para garantir idempotência em futuras chamadas
  await db.collection("processed_webhooks").doc(eventId).set({
    id: eventId,
    event,
    paymentId: payment?.id || null,
    subscriptionId: subscriptionId || null,
    customerId: customerId || null,
    barbershopId: matchedBarbershopId,
    processedAt: new Date().toISOString(),
  });

  return {
    processed: true,
    duplicate: false,
    event,
    barbershopId: matchedBarbershopId || undefined,
  };
}
