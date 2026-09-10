import { Express, Request, Response } from "express";
import { authenticate, AuthRequest } from "../auth.ts";
import {
  createOrGetAsaasCustomer,
  createMonthlyCreditCardSubscription,
  getSubscriptionDetails,
  cancelAsaasSubscription,
  validateAsaasWebhookToken,
  processAsaasWebhookEvent,
} from "../services/asaasService.ts";

export function setupPaymentRoutes(app: Express) {
  /**
   * 1. Detalhes do Plano Recorrente
   * Retorna informações sobre o plano mensal e o período de testes (Trial).
   */
  app.get("/api/payments/plan", async (_req: Request, res: Response) => {
    const planValue = parseFloat(process.env.ASAAS_PLAN_VALUE || "59.90");
    const trialDays = parseInt(process.env.ASAAS_TRIAL_DAYS || "14", 10);

    return res.status(200).json({
      success: true,
      plan: {
        name: "Plano Premium Mensal",
        description: "Acesso completo aos módulos de agendamentos, equipe, relatórios e financeiro.",
        value: planValue,
        currency: "BRL",
        cycle: "MONTHLY",
        billingType: "CREDIT_CARD",
        trialDays,
      },
    });
  });

  /**
   * 2. Criar ou Recuperar Cliente no Asaas
   * Endpoint autenticado e seguro.
   */
  app.post("/api/payments/asaas/customer", authenticate, async (req: AuthRequest, res: Response) => {
    const barbershopId = req.user?.barbershopId;
    if (!barbershopId) {
      return res.status(400).json({ success: false, error: "Sessão inválida: Barbearia não informada." });
    }

    try {
      const { name, email, phone, cpfCnpj, postalCode, address, addressNumber, province } = req.body || {};
      const result = await createOrGetAsaasCustomer(barbershopId, {
        name,
        email: email || req.user?.email,
        phone,
        cpfCnpj,
        postalCode,
        address,
        addressNumber,
        province,
      });

      return res.status(200).json({
        success: true,
        asaasCustomerId: result.asaasCustomerId,
        created: result.created,
        message: result.created
          ? "Cliente criado no Asaas com sucesso."
          : "Cliente Asaas já vinculado e verificado.",
      });
    } catch (err: any) {
      console.error("[Payment Route] Erro ao criar/consultar cliente Asaas:", err.message);
      return res.status(err.status || 500).json({
        success: false,
        error: err.message || "Falha ao processar cliente no Asaas.",
      });
    }
  });

  /**
   * 3. Criar Assinatura Recorrente Mensal com Cartão de Crédito
   * Requisitos estritos:
   * - Aceita apenas CREDIT_CARD.
   * - Se o trial estiver ativo, a primeira cobrança é agendada para o fim do trial (nextDueDate).
   * - Se o trial já expirou, a cobrança inicia imediatamente.
   * - Caso o cartão não seja autorizado, retorna erro padronizado e atualiza status no banco.
   */
  const handleCreateSubscription = async (req: AuthRequest, res: Response) => {
    const barbershopId = req.user?.barbershopId;
    if (!barbershopId) {
      return res.status(400).json({ success: false, error: "Sessão inválida: Barbearia não identificada." });
    }

    const { billingType, creditCard, creditCardHolderInfo } = req.body || {};

    // Validação de tipo de cobrança exclusivo
    if (billingType && billingType !== "CREDIT_CARD") {
      return res.status(400).json({
        success: false,
        error: "Forma de pagamento não permitida. Este produto aceita apenas cartão de crédito para assinaturas mensais.",
      });
    }

    if (!creditCard || !creditCardHolderInfo) {
      return res.status(400).json({
        success: false,
        error: "Parâmetros obrigatórios ausentes: 'creditCard' e 'creditCardHolderInfo' devem ser informados.",
      });
    }

    const clientIp = (req.headers["x-forwarded-for"] as string)?.split(",")[0] || req.socket.remoteAddress || "127.0.0.1";

    try {
      const result = await createMonthlyCreditCardSubscription(
        barbershopId,
        {
          billingType: "CREDIT_CARD",
          creditCard,
          creditCardHolderInfo,
        },
        clientIp
      );

      return res.status(200).json(result);
    } catch (err: any) {
      console.error(`[Payment Route] Falha ao criar assinatura para barbearia ${barbershopId}:`, err.message);

      // Tratamento padronizado de erro de autorização
      const isCardAuthError = err.asaasErrors?.some((e: any) =>
        /cartão|transação|autorizad|cvv|saldo|recusad/i.test(e.description || e.code)
      );

      return res.status(isCardAuthError ? 402 : 400).json({
        success: false,
        error: err.message || "Falha na autorização do cartão de crédito no Asaas.",
        details: err.asaasErrors || [],
      });
    }
  };

  app.post("/api/payments/asaas/subscription", authenticate, handleCreateSubscription);
  app.post("/api/payments/subscribe", authenticate, handleCreateSubscription);

  /**
   * 4. Consultar Assinatura e Status do Trial
   * Retorna dados padronizados sobre status, dias restantes de teste, próxima cobrança e dados mascarados do cartão.
   */
  app.get("/api/payments/subscription", authenticate, async (req: AuthRequest, res: Response) => {
    const barbershopId = req.user?.barbershopId;
    if (!barbershopId) {
      return res.status(400).json({ success: false, error: "Sessão inválida: Barbearia não informada." });
    }

    try {
      const details = await getSubscriptionDetails(barbershopId);
      return res.status(200).json({
        success: true,
        ...details,
      });
    } catch (err: any) {
      console.error(`[Payment Route] Erro ao consultar assinatura da barbearia ${barbershopId}:`, err.message);
      return res.status(500).json({
        success: false,
        error: err.message || "Falha ao consultar detalhes da assinatura.",
      });
    }
  });

  /**
   * 5. Cancelar Assinatura Recorrente
   * Interrompe as cobranças no Asaas e altera status para 'cancelled'.
   */
  app.post("/api/payments/subscription/cancel", authenticate, async (req: AuthRequest, res: Response) => {
    const barbershopId = req.user?.barbershopId;
    if (!barbershopId) {
      return res.status(400).json({ success: false, error: "Sessão inválida: Barbearia não informada." });
    }

    try {
      const result = await cancelAsaasSubscription(barbershopId);
      return res.status(200).json(result);
    } catch (err: any) {
      console.error(`[Payment Route] Erro ao cancelar assinatura da barbearia ${barbershopId}:`, err.message);
      return res.status(500).json({
        success: false,
        error: err.message || "Falha ao cancelar assinatura no Asaas.",
      });
    }
  });

  /**
   * 6. Webhook do Asaas
   * - Validação de token de segurança no header 'asaas-access-token'.
   * - Proteção contra duplicidade através da coleção 'processed_webhooks' (idempotência).
   * - Transição de status automática (PAYMENT_RECEIVED, PAYMENT_OVERDUE, SUBSCRIPTION_CANCELLED, etc.).
   */
  app.post("/api/payments/webhook", async (req: Request, res: Response) => {
    const receivedToken = (req.headers["asaas-access-token"] as string) || (req.headers["access_token"] as string);

    if (!validateAsaasWebhookToken(receivedToken)) {
      console.warn("[Asaas Webhook] Tentativa de acesso com token inválido.");
      return res.status(401).json({ success: false, error: "Unauthorized: Token de webhook inválido." });
    }

    try {
      const result = await processAsaasWebhookEvent(req.body);
      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (err: any) {
      console.error("[Asaas Webhook] Erro ao processar evento:", err.message);
      // Retorna 400 ou 500 para permitir retentativa do webhook caso tenha sido erro transitório
      return res.status(500).json({
        success: false,
        error: err.message || "Falha interna no processamento do webhook.",
      });
    }
  });
}
