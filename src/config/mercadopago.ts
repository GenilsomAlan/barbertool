import { MercadoPagoConfig } from "mercadopago";
import { PAYMENT_TIMEOUT } from "./payment.ts";

const accessToken = process.env.MP_ACCESS_TOKEN;

if (!accessToken) {
  throw new Error("CRITICAL ERROR: MP_ACCESS_TOKEN is missing from the environment variables. Application startup aborted.");
}

/**
 * Single instance of Mercado Pago Config.
 * Prepared for clean architecture integration.
 */
export const mercadoPagoClient = new MercadoPagoConfig({
  accessToken,
  options: {
    timeout: PAYMENT_TIMEOUT,
  },
});
