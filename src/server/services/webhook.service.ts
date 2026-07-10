import { PreApproval, Payment, Invoice } from "mercadopago";
import { PaymentResponse } from "mercadopago/dist/clients/payment/commonTypes";
import { PreApprovalResponse } from "mercadopago/dist/clients/preApproval/commonTypes";
import { InvoiceResponse } from "mercadopago/dist/clients/invoice/commonTypes";
import { mercadoPagoClient } from "../../config/mercadopago.ts";
import { db, DocumentSnapshotWrapper } from "../db.ts";
import { retryAsync } from "../utils/retry.ts";
import { LogContext, logInfo, logWarn, logError } from "../utils/logger.ts";

const preApprovalClient = new PreApproval(mercadoPagoClient);
const paymentClient = new Payment(mercadoPagoClient);
const invoiceClient = new Invoice(mercadoPagoClient);

/**
 * Maps the Mercado Pago resource status to our database subscription status.
 *
 * @param mpStatus - The status returned by Mercado Pago API
 * @returns The mapped status ("active", "pending", "cancelled", "paused", "rejected")
 */
function mapStatus(mpStatus: string): string {
  const status = mpStatus.toLowerCase();
  if (status === "approved" || status === "authorized" || status === "active") {
    return "active";
  }
  if (status === "pending") {
    return "pending";
  }
  if (status === "cancelled") {
    return "cancelled";
  }
  if (status === "paused") {
    return "paused";
  }
  if (status === "rejected") {
    return "rejected";
  }
  return status;
}

/**
 * Safely updates the subscription details inside a barbershop's document in Firestore.
 *
 * @param barbershopDoc - The Firestore document snapshot of the target barbershop
 * @param mpStatus - The mapped status from Mercado Pago
 * @param subscriptionId - The Mercado Pago subscription ID
 * @param additionalData - Optional additional details like customer ID or checkout URL
 */
async function updateBarbershopSubscription(
  barbershopDoc: DocumentSnapshotWrapper,
  mpStatus: string,
  subscriptionId: string,
  additionalData?: { customerId?: string; checkoutUrl?: string }
): Promise<void> {
  const barbershopRef = barbershopDoc.ref;
  const now = new Date().toISOString();

  const updates: Record<string, any> = {
    subscriptionUpdatedAt: now,
  };

  if (subscriptionId) {
    updates.mpSubscriptionId = subscriptionId;
  }

  if (additionalData?.customerId) {
    updates.mpCustomerId = additionalData.customerId;
  }
  if (additionalData?.checkoutUrl) {
    updates.subscriptionCheckoutUrl = additionalData.checkoutUrl;
  }

  const normalizedStatus = mpStatus.toLowerCase();
  if (normalizedStatus === "active" || normalizedStatus === "approved" || normalizedStatus === "authorized") {
    updates.subscriptionStatus = "active";
  } else if (normalizedStatus === "cancelled" || normalizedStatus === "rejected" || normalizedStatus === "paused") {
    updates.subscriptionStatus = "free_restricted";
  } else if (normalizedStatus === "pending") {
    // "pending" -> NÃO alterar subscriptionStatus; apenas atualizar os outros campos.
  } else {
    // Outros status desconhecidos, manter mapeamento robusto
    updates.subscriptionStatus = mpStatus;
  }

  await barbershopRef.set(updates, { merge: true });
}

/**
 * Helper to find a Firestore barbershop based on subscriptionId, externalReference, or customerId.
 *
 * @param subscriptionId - Mercado Pago subscription (preapproval) ID
 * @param externalReference - Custom external reference (barbershopId)
 * @param customerId - Mercado Pago customer ID
 * @returns Document snapshot of the barbershop if found, or null
 */
async function findBarbershop(
  subscriptionId?: string,
  externalReference?: string,
  customerId?: string
): Promise<DocumentSnapshotWrapper | null> {
  const promises: Promise<any>[] = [];

  // Index 0: subscriptionId query
  if (subscriptionId) {
    promises.push(db.collection("barbershops").where("mpSubscriptionId", "==", subscriptionId).get());
  } else {
    promises.push(Promise.resolve(null));
  }

  // Index 1: directDoc check for externalReference (barbershop ID)
  if (externalReference) {
    promises.push(db.collection("barbershops").doc(externalReference).get());
  } else {
    promises.push(Promise.resolve(null));
  }

  // Index 2: customerId query
  if (customerId) {
    promises.push(db.collection("barbershops").where("mpCustomerId", "==", customerId).get());
  } else {
    promises.push(Promise.resolve(null));
  }

  const results = await Promise.all(promises);

  // Check 1: subscriptionId query result
  const subQuery = results[0];
  if (subQuery && !subQuery.empty) {
    return subQuery.docs[0];
  }

  // Check 2: direct externalReference doc result
  const directDoc = results[1];
  if (directDoc && directDoc.exists) {
    return directDoc;
  }

  // Check 3: customerId query result
  const custQuery = results[2];
  if (custQuery && !custQuery.empty) {
    return custQuery.docs[0];
  }

  return null;
}

/**
 * Handles processing of a 'subscription_preapproval' event.
 *
 * @param resourceId - The subscription (preapproval) ID
 */
async function handleSubscriptionPreapproval(
  resourceId: string,
  logContext: LogContext
): Promise<{ subscriptionId: string; status: string; barbershopId?: string }> {
  // 4) RETRY: preApprovalClient.get with retryAsync
  const sub: PreApprovalResponse = await retryAsync(() => preApprovalClient.get({ id: resourceId }));

  if (!sub.id) {
    throw new Error("PreApproval response did not contain a valid ID.");
  }

  const status = mapStatus(sub.status || "");
  const barbershopDoc = await findBarbershop(sub.id, sub.external_reference?.toString(), sub.payer_id?.toString());

  let barbershopId: string | undefined;
  if (barbershopDoc) {
    barbershopId = barbershopDoc.id;
    await updateBarbershopSubscription(barbershopDoc, status, sub.id, {
      checkoutUrl: sub.init_point,
    });
  } else {
    logWarn(logContext, `[Webhook] No barbershop found for subscription_preapproval: ${sub.id}`);
  }

  return { subscriptionId: sub.id, status, barbershopId };
}

/**
 * Handles processing of a 'payment' event.
 *
 * @param resourceId - The payment ID
 */
async function handlePaymentEvent(
  resourceId: string,
  logContext: LogContext
): Promise<{ subscriptionId?: string; paymentId: string; status: string; barbershopId?: string }> {
  // 4) RETRY: paymentClient.get with retryAsync
  const payment: PaymentResponse = await retryAsync(() => paymentClient.get({ id: resourceId }));

  if (!payment.id) {
    throw new Error("Payment response did not contain a valid ID.");
  }

  const paymentIdStr = String(payment.id);
  const preapprovalId = (payment as unknown as Record<string, any>).preapproval_id as string | undefined;
  const status = mapStatus(payment.status || "");

  const barbershopDoc = await findBarbershop(
    preapprovalId,
    payment.external_reference,
    payment.payer?.id?.toString()
  );

  let barbershopId: string | undefined;
  if (barbershopDoc) {
    barbershopId = barbershopDoc.id;
    // If associated with a subscription, try to retrieve full subscription status from API to be precise
    if (preapprovalId) {
      try {
        // 4) RETRY: preApprovalClient.get with retryAsync
        const sub: PreApprovalResponse = await retryAsync(() => preApprovalClient.get({ id: preapprovalId }));
        const subStatus = mapStatus(sub.status || "");
        await updateBarbershopSubscription(barbershopDoc, subStatus, preapprovalId, {
          checkoutUrl: sub.init_point,
        });
        return { subscriptionId: preapprovalId, paymentId: paymentIdStr, status: subStatus, barbershopId };
      } catch (subErr) {
        logWarn(logContext, `[Webhook] Failed to fetch subscription ${preapprovalId} for payment ${paymentIdStr}:`, subErr);
      }
    }

    // Fallback/Direct update based on payment status
    await updateBarbershopSubscription(barbershopDoc, status, preapprovalId || "");
  } else {
    logWarn(logContext, `[Webhook] No barbershop found for payment: ${paymentIdStr}`);
  }

  return { subscriptionId: preapprovalId, paymentId: paymentIdStr, status, barbershopId };
}

/**
 * Handles processing of a 'subscription_authorized_payment' event (invoice).
 *
 * @param resourceId - The authorized payment (invoice) ID
 */
async function handleSubscriptionAuthorizedPayment(
  resourceId: string,
  logContext: LogContext
): Promise<{ subscriptionId: string; paymentId?: string; status: string; barbershopId?: string }> {
  // 4) RETRY: invoiceClient.get with retryAsync
  const invoice: InvoiceResponse = await retryAsync(() => invoiceClient.get({ id: resourceId }));

  if (!invoice.id) {
    throw new Error("Invoice response did not contain a valid ID.");
  }

  const preapprovalId = invoice.preapproval_id;
  if (!preapprovalId) {
    throw new Error(`Invoice ${invoice.id} does not contain a preapproval_id.`);
  }

  // 4) RETRY: preApprovalClient.get with retryAsync
  const sub: PreApprovalResponse = await retryAsync(() => preApprovalClient.get({ id: preapprovalId }));
  const status = mapStatus(sub.status || "");
  const paymentId = invoice.payment?.id ? String(invoice.payment.id) : undefined;

  const barbershopDoc = await findBarbershop(
    preapprovalId,
    invoice.external_reference,
    invoice.payer_id?.toString()
  );

  let barbershopId: string | undefined;
  if (barbershopDoc) {
    barbershopId = barbershopDoc.id;
    await updateBarbershopSubscription(barbershopDoc, status, preapprovalId, {
      checkoutUrl: sub.init_point,
    });
  } else {
    logWarn(logContext, `[Webhook] No barbershop found for invoice: ${invoice.id} (subscription: ${preapprovalId})`);
  }

  return { subscriptionId: preapprovalId, paymentId, status, barbershopId };
}

/**
 * Orchestrator to process webhook events synchronously.
 * Performs API lookup, updates Firestore, and logs complete execution details.
 *
 * @param type - The Mercado Pago event type
 * @param resourceId - The event resource identifier
 * @param logContext - Context for structured logging
 * @param eventId - The unique webhook event ID
 * @returns The final processed status mapped to our database model
 */
export async function processWebhookEvent(
  type: string,
  resourceId: string,
  logContext: LogContext,
  eventId: string
): Promise<string> {
  const startTime = Date.now();
  let subscriptionId: string | undefined;
  let paymentId: string | undefined;
  let status = "unknown";
  let barbershopId: string | undefined;

  logContext.resourceId = resourceId;
  logContext.eventType = type;

  try {
    logInfo(logContext, `Starting synchronous webhook processing.`);

    if (type === "subscription_preapproval") {
      const result = await handleSubscriptionPreapproval(resourceId, logContext);
      subscriptionId = result.subscriptionId;
      status = result.status;
      barbershopId = result.barbershopId;
    } else if (type === "payment") {
      const result = await handlePaymentEvent(resourceId, logContext);
      subscriptionId = result.subscriptionId;
      paymentId = result.paymentId;
      status = result.status;
      barbershopId = result.barbershopId;
    } else if (type === "subscription_authorized_payment") {
      const result = await handleSubscriptionAuthorizedPayment(resourceId, logContext);
      subscriptionId = result.subscriptionId;
      paymentId = result.paymentId;
      status = result.status;
      barbershopId = result.barbershopId;
    } else {
      logWarn(logContext, `Unhandled webhook event type: ${type}`);
    }

    const duration = Date.now() - startTime;
    logContext.processingTime = duration;
    logContext.status = status;
    logContext.userId = barbershopId; // Set mapped ID into context for tracing

    logInfo(
      logContext,
      `Webhook processing completed. Subscription ID: ${subscriptionId || "N/A"}, Payment ID: ${paymentId || "N/A"}`
    );

    // 3) IDEMPOTÊNCIA DOS WEBHOOKS: Gravar na coleção webhook_events
    await db.collection("webhook_events").doc(eventId).set({
      eventId,
      type,
      resourceId,
      status,
      userId: barbershopId || null, // Keep userId/barbershopId mapped field for backward-compatibility with tests and tracing
      barbershopId: barbershopId || null,
      processedAt: new Date().toISOString(),
    });

    return status;
  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    logContext.processingTime = duration;
    logContext.status = "failed";
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    logError(logContext, `Webhook processing failed. Error: ${errorMessage}`);
    throw new Error(`Mercado Pago Webhook Processing Failed: ${errorMessage}`);
  }
}
