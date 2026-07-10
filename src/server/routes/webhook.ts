import { Express } from "express";
import { handleWebhook } from "../controllers/webhook.controller.ts";

/**
 * Public routes for webhooks.
 * Segments webhook events to the controller.
 *
 * @param app - Express application instance
 */
export function setupWebhookRoutes(app: Express): void {
  app.post("/api/webhooks/mercadopago", handleWebhook);
}
