import { Response } from "express";
import { AuthRequest } from "../auth.ts";
import { handleSubscribe, handleCancelSubscription } from "../services/subscription.service.ts";
import { db } from "../db.ts";

/**
 * Controller responsible for subscription orchestration.
 * Extracts the user and barbershop from AuthRequest, forwards the input to the subscription service,
 * and outputs the success status with the checkout URL.
 *
 * @param req - Authenticated Express Request with user metadata
 * @param res - Express Response object
 */
export async function subscribe(req: AuthRequest, res: Response): Promise<Response> {
  try {
    const userId = req.user?.id;
    const barbershopId = req.user?.barbershopId;
    if (!userId || !barbershopId) {
      return res.status(401).json({ error: "Não autorizado." });
    }

    const { planName, amount, backUrl } = req.body;

    const result = await handleSubscribe({
      userId,
      barbershopId,
      planName,
      amount,
      backUrl,
    });

    return res.json({
      success: true,
      checkoutUrl: result.checkoutUrl,
      ...(result.alreadyExists ? { alreadyExists: true } : {}),
    });
  } catch (error: any) {
    console.error("Subscription controller error:", error);
    if (error && error.code === "SUBSCRIPTION_IN_PROGRESS") {
      return res.status(409).json({
        success: false,
        code: "SUBSCRIPTION_IN_PROGRESS",
        message: "Já existe uma assinatura sendo criada."
      });
    }
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro ao iniciar a assinatura.";
    return res.status(500).json({ error: errorMessage });
  }
}

/**
 * Controller to fetch subscription data directly from Firestore.
 * Reads directly from barbershops/{barbershopId} to keep it robust and authoritative.
 */
export async function getSubscription(req: AuthRequest, res: Response): Promise<Response> {
  try {
    const barbershopId = req.user?.barbershopId;
    if (!barbershopId) {
      return res.status(401).json({ error: "Não autorizado." });
    }

    const barbershopDoc = await db.collection("barbershops").doc(barbershopId).get();
    if (!barbershopDoc.exists) {
      return res.status(404).json({ error: "Barbearia não encontrada." });
    }

    const barbershopData = barbershopDoc.data() || {};

    const trialStartedAt = barbershopData.trialStartedAt || barbershopData.createdAt || null;
    const trialEndsAt = barbershopData.trialEndsAt || null;

    let status = barbershopData.subscriptionStatus || null;
    if (!status) {
      const now = new Date();
      if (trialEndsAt && now <= new Date(trialEndsAt)) {
        status = "trial";
      } else {
        status = "free_restricted";
      }
    }

    return res.json({
      provider: "mercadopago",
      status: status,
      customerId: barbershopData.mpCustomerId || null,
      subscriptionId: barbershopData.mpSubscriptionId || null,
      checkoutUrl: barbershopData.subscriptionCheckoutUrl || null,
      trialStartedAt: trialStartedAt,
      trialEndsAt: trialEndsAt,
      updatedAt: barbershopData.subscriptionUpdatedAt || barbershopData.updatedAt || null,
      createdAt: barbershopData.createdAt || null,
    });
  } catch (error: unknown) {
    console.error("Get subscription controller error:", error);
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro ao buscar os dados da assinatura.";
    return res.status(500).json({ error: errorMessage });
  }
}

/**
 * Controller to handle canceling an active subscription.
 */
export async function cancel(req: AuthRequest, res: Response): Promise<Response> {
  try {
    const barbershopId = req.user?.barbershopId;
    if (!barbershopId) {
      return res.status(401).json({ error: "Não autorizado." });
    }

    const result = await handleCancelSubscription(barbershopId);
    return res.json(result);
  } catch (error: unknown) {
    console.error("Cancel subscription controller error:", error);
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro ao cancelar a assinatura.";
    return res.status(500).json({ error: errorMessage });
  }
}
