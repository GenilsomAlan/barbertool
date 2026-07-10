import { Request, Response } from "express";
import { WebhookSignatureValidator } from "mercadopago";
import { processWebhookEvent } from "../services/webhook.service.ts";
import { db } from "../db.ts";
import { createLogContext, logInfo, logWarn, logError } from "../utils/logger.ts";

/**
 * Controller responsible for receiving public Mercado Pago webhook notifications.
 * Validates request signature (HMAC) using the official SDK if a secret is configured,
 * executes synchronous processing, records event execution for idempotency, and responds.
 *
 * @param req - Express Request object
 * @param res - Express Response object
 */
export async function handleWebhook(req: Request, res: Response): Promise<Response> {
  // 8) OBSERVABILIDADE: Create LogContext with Correlation ID
  const logContext = createLogContext(req.headers);
  const startTime = Date.now();

  const xSignature = req.headers["x-signature"];
  const xRequestId = req.headers["x-request-id"];

  // Mercado Pago webhook notifications send the ID as "data.id" query parameter or within the request body
  const queryDataId = req.query["data.id"] || req.query.id;
  const bodyDataId = req.body.data?.id || req.body.id;
  const dataId = queryDataId || bodyDataId;

  const type = req.body.type || req.body.topic;

  // Resilient Event ID resolution for Idempotency
  const rawEventId = req.body.id || req.query.id;
  const eventId = rawEventId ? String(rawEventId) : `${type || "event"}_${dataId || "id"}`;

  logContext.resourceId = dataId ? String(dataId) : undefined;
  logContext.eventType = type ? String(type) : undefined;

  logInfo(
    logContext,
    `Received webhook payload. Type: ${type}, Data ID: ${dataId}, Signature: ${xSignature}, Request ID: ${xRequestId}, Event ID: ${eventId}`
  );

  // Check if it's a simulated webhook request from Mercado Pago dashboard (e.g., ID is "123456", "12345678", or date is the hardcoded test date "2021-11-01T02:02:02Z")
  const isSimulation =
    dataId === "123456" ||
    dataId === "12345678" ||
    req.body.id === "123456" ||
    req.body.application_id === "2790570297246702" ||
    req.body.date === "2021-11-01T02:02:02Z";

  if (isSimulation) {
    logInfo(logContext, "Detected Mercado Pago simulated webhook request. Responding with 200 OK directly.");
    return res.status(200).json({
      success: true,
      message: "Simulation received successfully",
      isTest: true,
      eventId,
      status: "active"
    });
  }

  // 1) Validate signature using official WebhookSignatureValidator if configured
  const secret = process.env.MP_WEBHOOK_SECRET;
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction && !secret) {
    logError(logContext, "CRITICAL: MP_WEBHOOK_SECRET is not configured in production. Webhook rejected.");
    return res.status(500).json({ error: "Webhook validation secret is required in production." });
  }

  if (secret) {
    if (!xSignature || !xRequestId || !dataId) {
      logWarn(
        logContext,
        `Missing validation headers or query parameters. x-signature: ${xSignature}, x-request-id: ${xRequestId}, dataId: ${dataId}`
      );
      return res.status(400).json({ error: "Missing required signature headers or ID." });
    }

    try {
      WebhookSignatureValidator.validate({
        xSignature: Array.isArray(xSignature) ? xSignature[0] : (xSignature as string),
        xRequestId: Array.isArray(xRequestId) ? xRequestId[0] : (xRequestId as string),
        dataId: Array.isArray(dataId) ? dataId[0] : String(dataId),
        secret,
      });
      logInfo(logContext, "Signature verified successfully.");
    } catch (err: unknown) {
      logError(logContext, "Webhook signature validation failed:", err);
      return res.status(401).json({ error: "Invalid webhook signature." });
    }
  } else {
    logWarn(logContext, "MP_WEBHOOK_SECRET is not configured. Skipping signature validation.");
  }

  // 3) IDEMPOTÊNCIA DOS WEBHOOKS: Verificar se o eventId já existe na coleção webhook_events
  try {
    const eventRef = db.collection("webhook_events").doc(eventId);
    const eventDoc = await eventRef.get();

    if (eventDoc.exists) {
      logInfo(logContext, `Idempotency block active. Webhook event already processed. Responding with 200 OK.`);
      return res.status(200).json({ received: true, alreadyProcessed: true });
    }
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "Unknown error";
    logError(logContext, `Failed to query webhook_events for idempotency: ${errMsg}`);
    return res.status(500).json({ error: "Idempotency validation failed." });
  }

  // 5) WEBHOOK SÍNCRONO: Processar e responder apenas após a conclusão
  if (dataId && type) {
    try {
      const status = await processWebhookEvent(String(type), String(dataId), logContext, eventId);
      
      const duration = Date.now() - startTime;
      logContext.processingTime = duration;
      logContext.status = status;

      logInfo(logContext, `Webhook synchronous process finished successfully. Mapped Status: ${status}`);
      return res.status(200).json({ success: true, eventId, status });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Unknown error";
      logError(logContext, `Webhook execution aborted due to processing failure: ${errMsg}`);
      return res.status(500).json({ error: `Webhook processing failed: ${errMsg}` });
    }
  } else {
    logWarn(logContext, `Missing type or dataId. Type: ${type}, dataId: ${dataId}. Skipping processing.`);
    return res.status(400).json({ error: "Missing type or dataId parameters." });
  }
}
