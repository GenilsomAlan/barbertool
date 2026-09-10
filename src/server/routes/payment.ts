import { Express, Response } from "express";
import { authenticate, AuthRequest } from "../auth.ts";
import { getPaymentDisabledResponse } from "../services/paymentDisabled.ts";

// Provedores Asaas e Mercado Pago removidos — endpoints substituídos por stubs seguros que retornam PAYMENT_PROVIDER_DISABLED
export function setupPaymentRoutes(app: Express) {
  // Pagamento Asaas removido — stub retornando status disabled
  app.post("/api/payments/asaas/customer", authenticate, async (req: AuthRequest, res: Response) => {
    const barbershopId = req.user?.barbershopId;
    if (!barbershopId) {
      return res.status(400).json({ error: "Sessão inválida: Barbearia não informada." });
    }

    return res.status(200).json(getPaymentDisabledResponse("ASAAS"));
  });

  // Endpoint legado/alternativo Asaas — stub retornando status disabled
  app.post("/api/payments/asaas", authenticate, async (req: AuthRequest, res: Response) => {
    return res.status(200).json(getPaymentDisabledResponse("ASAAS"));
  });

  // Pagamento Mercado Pago removido — stub retornando status disabled
  app.post("/api/payments/subscribe", authenticate, async (req: AuthRequest, res: Response) => {
    const barbershopId = req.user?.barbershopId;
    if (!barbershopId) {
      return res.status(400).json({ error: "Sessão inválida: Barbearia não informada." });
    }

    return res.status(200).json(getPaymentDisabledResponse("MERCADOPAGO"));
  });

  // Cancelamento Mercado Pago removido — stub retornando status disabled
  app.post("/api/payments/subscription/cancel", authenticate, async (req: AuthRequest, res: Response) => {
    const barbershopId = req.user?.barbershopId;
    if (!barbershopId) {
      return res.status(400).json({ error: "Sessão inválida: Barbearia não informada." });
    }

    return res.status(200).json(getPaymentDisabledResponse("MERCADOPAGO"));
  });

  // Consulta de assinatura de pagamento externo removida — stub retornando status disabled
  app.get("/api/payments/subscription", authenticate, async (req: AuthRequest, res: Response) => {
    const barbershopId = req.user?.barbershopId;
    if (!barbershopId) {
      return res.status(400).json({ error: "Sessão inválida: Barbearia não informada." });
    }

    return res.status(200).json(getPaymentDisabledResponse("MERCADOPAGO"));
  });

  // Webhooks legados de pagamento desativados — retorno seguro com 200
  app.all(["/api/payments/webhook", "/api/webhooks/mercadopago"], async (_req, res: Response) => {
    return res.status(200).json(getPaymentDisabledResponse("MERCADOPAGO"));
  });
}

