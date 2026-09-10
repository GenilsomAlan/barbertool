// Pagamentos Asaas e Mercado Pago removidos — stub retornando resposta padronizada de pagamento desativado
export const PAYMENT_PROVIDER_DISABLED = "PAYMENT_PROVIDER_DISABLED";

export interface DisabledPaymentResponse {
  status: "disabled";
  provider: "ASAAS" | "MERCADOPAGO";
  message: string;
}

/**
 * Retorna objeto padronizado indicando que o provedor de pagamento foi desativado.
 */
export function getPaymentDisabledResponse(provider: "ASAAS" | "MERCADOPAGO"): DisabledPaymentResponse {
  return {
    status: "disabled",
    provider,
    message: `Pagamento via ${provider === "ASAAS" ? "Asaas" : "Mercado Pago"} desativado — use alternativa`,
  };
}

export default {
  PAYMENT_PROVIDER_DISABLED,
  getPaymentDisabledResponse,
};
