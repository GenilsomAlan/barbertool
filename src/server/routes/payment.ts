import { Express, Response } from "express";
import { db } from "../db.ts";
import { authenticate, AuthRequest } from "../auth.ts";
import { createOrGetAsaasCustomer } from "../services/asaasService.ts";

export function setupPaymentRoutes(app: Express) {
  // Asaas Stage 1: Route to ensure/create Asaas customer for authenticated barbershop
  app.post("/api/payments/asaas/customer", authenticate, async (req: AuthRequest, res: Response) => {
    const barbershopId = req.user?.barbershopId;
    if (!barbershopId) {
      return res.status(400).json({ error: "Sessão inválida: Barbearia não informada." });
    }

    try {
      const result = await createOrGetAsaasCustomer(barbershopId, {
        name: req.user?.email ? req.user.email.split("@")[0] : undefined,
        email: req.user?.email,
      });

      res.json({
        success: true,
        asaasCustomerId: result.asaasCustomerId,
        created: result.created,
        message: result.created ? "Cliente criado no Asaas com sucesso." : "Cliente Asaas já vinculado e verificado.",
      });
    } catch (err: any) {
      console.error("[Payment Route] Erro no vínculo com Asaas:", err.message);
      res.status(500).json({ error: err.message || "Falha ao vincular cliente no Asaas." });
    }
  });

  // Mercado Pago Subscribe Route (Checkout/subscription activation)
  app.post("/api/payments/subscribe", authenticate, async (req: AuthRequest, res: Response) => {
    const barbershopId = req.user?.barbershopId!;
    try {
      const barbershopRef = db.collection("barbershops").doc(barbershopId);
      const barbershopDoc = await barbershopRef.get();
      if (!barbershopDoc.exists) {
        return res.status(404).json({ error: "Barbearia não encontrada" });
      }

      await barbershopRef.update({
        subscriptionStatus: "premium"
      });

      res.json({ checkoutUrl: "/dashboard" });
    } catch (err: any) {
      console.error("Subscription setup error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Mercado Pago Cancel Subscription Route
  app.post("/api/payments/subscription/cancel", authenticate, async (req: AuthRequest, res: Response) => {
    const barbershopId = req.user?.barbershopId!;
    try {
      const barbershopRef = db.collection("barbershops").doc(barbershopId);
      const barbershopDoc = await barbershopRef.get();
      if (!barbershopDoc.exists) {
        return res.status(404).json({ error: "Barbearia não encontrada" });
      }

      await barbershopRef.update({
        subscriptionStatus: "trial"
      });

      res.json({ success: true });
    } catch (err: any) {
      console.error("Cancel subscription error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Mercado Pago Get Subscription Route
  app.get("/api/payments/subscription", authenticate, async (req: AuthRequest, res: Response) => {
    const barbershopId = req.user?.barbershopId!;
    try {
      const barbershopDoc = await db.collection("barbershops").doc(barbershopId).get();
      if (!barbershopDoc.exists) {
        return res.status(404).json({ error: "Barbearia não encontrada" });
      }

      const barbershop = barbershopDoc.data();
      res.json({
        status: barbershop?.subscriptionStatus || "trial",
        trialEndsAt: barbershop?.trialEndsAt || null
      });
    } catch (err: any) {
      console.error("Fetch subscription error:", err);
      res.status(500).json({ error: err.message });
    }
  });
}
