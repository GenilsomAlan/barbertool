import { PreApproval } from "mercadopago";
import { PreApprovalRequest } from "mercadopago/dist/clients/preApproval/commonTypes";
import { mercadoPagoClient } from "../../config/mercadopago.ts";
import { CreateSubscriptionInput, SubscriptionResult } from "./subscription.types.ts";
import { retryAsync } from "../../server/utils/retry.ts";
import { getDetailedMPError } from "./customer.service.ts";

/**
 * Creates a subscription (PreApproval) in Mercado Pago using the official SDK.
 *
 * @param input - The subscription details including customer identifier, payer email, plan name, amount, external reference, and redirect URL.
 * @returns A promise that resolves to the SubscriptionResult containing id, initPoint, and status.
 */
export async function createSubscription(input: CreateSubscriptionInput): Promise<SubscriptionResult> {
  try {
    const preApprovalClient = new PreApproval(mercadoPagoClient);

    const body: PreApprovalRequest = {
      reason: input.planName,
      payer_email: input.payerEmail,
      external_reference: input.externalReference,
      back_url: input.backUrl,
      status: "pending",
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: input.amount,
        currency_id: "BRL",
      },
    };

    // Call using retry helper with exponential backoff
    const response = await retryAsync(() => preApprovalClient.create({ body }));

    if (!response || !response.id || !response.init_point || !response.status) {
      throw new Error("Invalid or incomplete response received from Mercado Pago Subscription API");
    }

    return {
      id: response.id,
      initPoint: response.init_point,
      status: response.status,
    };
  } catch (error: unknown) {
    console.error("Error creating Mercado Pago Subscription:", error);
    const errorMessage = getDetailedMPError(error);
    throw new Error(`Mercado Pago Subscription Creation Failed: ${errorMessage}`);
  }
}

/**
 * Cancels a subscription (PreApproval) in Mercado Pago using the official SDK.
 *
 * @param subscriptionId - The ID of the subscription to cancel.
 * @returns A promise that resolves to the cancel response.
 */
export async function cancelSubscription(subscriptionId: string): Promise<any> {
  try {
    const preApprovalClient = new PreApproval(mercadoPagoClient);

    // Call using retry helper with exponential backoff
    const response = await retryAsync(() =>
      preApprovalClient.update({
        id: subscriptionId,
        body: {
          status: "cancelled",
        },
      })
    );

    return response;
  } catch (error: unknown) {
    console.error("Error cancelling Mercado Pago Subscription:", error);
    const errorMessage = getDetailedMPError(error);
    throw new Error(`Mercado Pago Subscription Cancellation Failed: ${errorMessage}`);
  }
}

