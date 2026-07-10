import { Express } from "express";
import { authenticate } from "../auth.ts";
import { subscribe as subscribeController, getSubscription as getSubscriptionController, cancel as cancelController } from "../controllers/subscription.controller.ts";

export function setupPaymentRoutes(app: Express) {
  // Create or get subcription checkout
  app.post("/api/payments/subscribe", authenticate, subscribeController);

  // Cancel current subscription
  app.post("/api/payments/subscription/cancel", authenticate, cancelController);

  // Get current subscription details
  app.get("/api/payments/subscription", authenticate, getSubscriptionController);
}
