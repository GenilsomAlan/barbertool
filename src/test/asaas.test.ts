// Pagamento Asaas e Mercado Pago removidos — teste adaptado para validar stub PAYMENT_PROVIDER_DISABLED
import { getPaymentDisabledResponse } from "../server/services/paymentDisabled.ts";

/**
 * Script de Teste / Validação para stubs de pagamentos desativados (Asaas e Mercado Pago).
 */
export async function runPaymentDisabledTests() {
  console.log("=== INICIANDO TESTES DO STUB DE PAGAMENTOS DESATIVADOS ===");

  const asaasStub = getPaymentDisabledResponse("ASAAS");
  if (asaasStub.status === "disabled" && asaasStub.provider === "ASAAS") {
    console.log("✅ Asaas stub validado com sucesso:", asaasStub.message);
  } else {
    throw new Error("❌ Falha na validação do stub Asaas.");
  }

  const mpStub = getPaymentDisabledResponse("MERCADOPAGO");
  if (mpStub.status === "disabled" && mpStub.provider === "MERCADOPAGO") {
    console.log("✅ Mercado Pago stub validado com sucesso:", mpStub.message);
  } else {
    throw new Error("❌ Falha na validação do stub Mercado Pago.");
  }

  console.log("=== TESTES DE PAGAMENTOS DESATIVADOS CONCLUÍDOS COM SUCESSO ===");
}

