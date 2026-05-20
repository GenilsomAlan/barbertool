import { Express, Request, Response } from "express";
import { db } from "../db.ts";
import { authenticate, AuthRequest } from "../auth.ts";

const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
const ASAAS_API_URL = process.env.ASAAS_API_URL || "https://sandbox.asaas.com/api/v3";

async function asaasFetch(endpoint: string, options: any = {}) {
  if (!ASAAS_API_KEY) {
    throw new Error("GATEWAY_NOT_CONFIGURED");
  }

  const response = await fetch(`${ASAAS_API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "access_token": ASAAS_API_KEY,
      ...options.headers,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.errors?.[0]?.description || "Asaas API Error");
  }
  return data;
}

export function setupPaymentRoutes(app: Express) {
  if (!ASAAS_API_KEY) {
    console.warn("⚠️ ASAAS_API_KEY is not set. Payments will be disabled.");
  } else {
    console.log(`✅ Asaas Payment Gateway configured (${ASAAS_API_URL})`);
  }

  // Create or get payment link
  app.post("/api/payments/checkout", authenticate, async (req: AuthRequest, res: Response) => {
    const barbershopId = req.user?.barbershopId!;
    
    try {
      const barbershopRef = db.collection("barbershops").doc(barbershopId);
      const barbershopDoc = await barbershopRef.get();
      if (!barbershopDoc.exists) return res.status(404).json({ error: "Barbearia não encontrada" });

      const barbershop = barbershopDoc.data();
      let customerId = barbershop?.asaasCustomerId;

      // 1. Create customer if not exists
      if (!customerId) {
        const customer = await asaasFetch("/customers", {
          method: "POST",
          body: JSON.stringify({
            name: barbershop?.name,
            email: barbershop?.email,
            externalReference: barbershopId
          })
        });
        customerId = customer.id;
        await barbershopRef.update({ asaasCustomerId: customerId });
      }

      // 2. Create a Payment Link or a direct Payment
      const payment = await asaasFetch("/payments", {
        method: "POST",
        body: JSON.stringify({
          customer: customerId,
          billingType: "UNDEFINED", 
          value: 49.90, 
          dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], 
          description: `Assinatura Premium - ${barbershop?.name}`,
          externalReference: barbershopId
        })
      });

      res.json({ checkoutUrl: payment.invoiceUrl });
    } catch (err: any) {
      console.error("Payment checkout error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Webhook for payment updates
  app.post("/api/payments/webhook", async (req: Request, res: Response) => {
    const body = req.body;
    console.log("Asaas Webhook received:", body.event);

    try {
      if (body.event === "PAYMENT_RECEIVED" || body.event === "PAYMENT_CONFIRMED") {
        const barbershopId = body.payment.externalReference;
        
        if (barbershopId) {
          await db.collection("barbershops").doc(barbershopId).update({
            subscriptionStatus: 'premium'
          });
          console.log(`Barbershop ${barbershopId} upgraded to Premium via Asaas.`);
        }
      }
      
      res.status(200).send("OK");
    } catch (err) {
      console.error("Webhook processing failed:", err);
      res.status(500).send("Internal Server Error");
    }
  });
}

