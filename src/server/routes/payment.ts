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

  // Create or get subcription checkout
  app.post("/api/payments/subscribe", authenticate, async (req: AuthRequest, res: Response) => {
    const barbershopId = req.user?.barbershopId!;
    const { name, cpfCnpj, mobilePhone, billingType, value, cycle, description, creditCard, creditCardHolderInfo } = req.body;

    if (!name || !cpfCnpj || !mobilePhone) {
      return res.status(400).json({ error: "Nome, CPF/CNPJ e Telefone Celular são obrigatórios." });
    }

    try {
      const barbershopRef = db.collection("barbershops").doc(barbershopId);
      const barbershopDoc = await barbershopRef.get();
      if (!barbershopDoc.exists) {
        return res.status(404).json({ error: "Barbearia não encontrada" });
      }

      const barbershop = barbershopDoc.data();
      let customerId = barbershop?.asaasCustomerId;

      // 1. Create customer if not exists or if checking details
      if (!customerId) {
        const customer = await asaasFetch("/customers", {
          method: "POST",
          body: JSON.stringify({
            name,
            cpfCnpj,
            mobilePhone,
            email: barbershop?.email || req.user?.email || "faturamento@barbertool.com",
            externalReference: barbershopId
          })
        });
        customerId = customer.id;
        await barbershopRef.update({ 
          asaasCustomerId: customerId,
          cpfCnpj,
          mobilePhone
        });
      }

      // Generate nextDueDate (3 days from now to give time or tomorrow)
      const now = new Date();
      now.setDate(now.getDate() + 3);
      const nextDueDateStr = now.toISOString().split('T')[0];

      // Prepare subscription dynamic body
      const subscriptionBody: any = {
        customer: customerId,
        billingType: billingType || "BOLETO",
        nextDueDate: nextDueDateStr,
        value: value || 49.90,
        cycle: cycle || "MONTHLY",
        description: description || `Assinatura Plano Premium - ${barbershop?.name || 'Barbearia'}`,
        externalReference: barbershopId
      };

      // Add Credit Card details if provided and billing type is CREDIT_CARD
      if (billingType === "CREDIT_CARD" && creditCard) {
        subscriptionBody.creditCard = {
          holderName: creditCard.holderName || name,
          number: creditCard.number,
          expiryMonth: creditCard.expiryMonth,
          expiryYear: creditCard.expiryYear,
          ccv: creditCard.ccv
        };
        
        subscriptionBody.creditCardHolderInfo = {
          name: creditCardHolderInfo?.name || name,
          email: creditCardHolderInfo?.email || barbershop?.email || req.user?.email || "faturamento@barbertool.com",
          cpfCnpj: creditCardHolderInfo?.cpfCnpj || cpfCnpj,
          postalCode: creditCardHolderInfo?.postalCode || "89010025",
          addressNumber: creditCardHolderInfo?.addressNumber || "10",
          phone: creditCardHolderInfo?.phone || mobilePhone
        };
      }

      // 2. Create subscription with automatic recovery for deleted/removed customer records in Sandbox
      let subscription;
      try {
        subscription = await asaasFetch("/subscriptions", {
          method: "POST",
          body: JSON.stringify(subscriptionBody)
        });
      } catch (err: any) {
        const isDeletedCustomerError = err.message && (
          err.message.includes("cliente removido") || 
          err.message.includes("removido") || 
          err.message.includes("não encontrado")
        );
        
        if (isDeletedCustomerError && customerId) {
          console.log(`⚠️ Customer ${customerId} appears deleted/removed in Asaas. Recreating customer...`);
          const customer = await asaasFetch("/customers", {
            method: "POST",
            body: JSON.stringify({
              name,
              cpfCnpj,
              mobilePhone,
              email: barbershop?.email || req.user?.email || "faturamento@barbertool.com",
              externalReference: barbershopId
            })
          });
          customerId = customer.id;
          await barbershopRef.update({ 
            asaasCustomerId: customerId,
            cpfCnpj,
            mobilePhone
          });
          
          // Retry subscription with the verified new customer ID
          subscriptionBody.customer = customerId;
          subscription = await asaasFetch("/subscriptions", {
            method: "POST",
            body: JSON.stringify(subscriptionBody)
          });
        } else {
          throw err;
        }
      }

      // Update local barbershop doc with customer and subscription IDs
      await barbershopRef.update({
        asaasSubscriptionId: subscription.id,
        billingType: billingType || "BOLETO",
        subscriptionStatus: "premium" // Immediately mark active or allow payment flows to handle status changes
      });

      // Get first generated charge for the subscription to show on screen
      let firstPayment = null;
      try {
        // Wait briefly/retry or directly fetch payments for subscription
        const paymentList = await asaasFetch(`/subscriptions/${subscription.id}/payments`);
        if (paymentList && paymentList.data && paymentList.data.length > 0) {
          firstPayment = paymentList.data[0];
        }
      } catch (payErr) {
        console.warn("Could not fetch initial subscription payment immediately:", payErr);
      }

      res.json({
        subscriptionId: subscription.id,
        customerId: customerId,
        subscription,
        payment: firstPayment
      });
    } catch (err: any) {
      console.error("Subscription setup error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Get payments for a subscription
  app.get("/api/payments/subscription/:id/payments", authenticate, async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const payments = await asaasFetch(`/subscriptions/${id}/payments`);
      res.json(payments);
    } catch (err: any) {
      console.error("Error fetching subscription payments:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Get Pix QR Code or code for a payment
  app.get("/api/payments/:paymentId/pix", authenticate, async (req: AuthRequest, res: Response) => {
    try {
      const { paymentId } = req.params;
      const pixData = await asaasFetch(`/payments/${paymentId}/pixQrCode`);
      res.json(pixData);
    } catch (err: any) {
      console.error("Error fetching Pix info:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Create or get payment link (kept for compatibility)
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
    // Validate authorization token passed by Asaas via "asaas-access-token" header
    const asaasTokenHeader = req.headers["asaas-access-token"];
    const expectedToken = "whsec_WvZhRdUBg-w3AsVz7s17xwJKzE0Uc_ObJ4nVoAsaQ3g";

    if (!asaasTokenHeader || asaasTokenHeader !== expectedToken) {
      console.warn(`⚠️ Webhook unauthorized. Header "asaas-access-token" got: "${asaasTokenHeader || 'undefined'}"`);
      return res.status(401).json({ error: "Unauthorized access. Invalid or missing webhook token." });
    }

    const body = req.body;
    console.log("Asaas Webhook received:", body.event);

    try {
      if (body.event === "PAYMENT_RECEIVED" || body.event === "PAYMENT_CONFIRMED") {
        let barbershopId = body.payment.externalReference;
        
        // If reference is not found directly, try querying by subscription ID
        if (!barbershopId && body.payment.subscription) {
          console.log(`Searching for barbershop with subscription ID: ${body.payment.subscription}`);
          const shopSnapshot = await db.collection("barbershops")
            .where("asaasSubscriptionId", "==", body.payment.subscription)
            .limit(1)
            .get();
          
          if (!shopSnapshot.empty) {
            barbershopId = shopSnapshot.docs[0].id;
          }
        }
        
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

