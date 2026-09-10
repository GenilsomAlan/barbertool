import { db } from "../db.ts";

export interface AsaasCustomerData {
  name: string;
  email: string;
  phone?: string | null;
  cpfCnpj?: string | null;
  externalReference?: string;
}

function getAsaasConfig() {
  const apiKey = process.env.ASAAS_API_KEY;
  let apiUrl = (process.env.ASAAS_API_URL || "https://sandbox.asaas.com/api/v3").trim();

  // Normalize URL trailing slashes and ensure /api/v3 path
  if (apiUrl.endsWith("/")) {
    apiUrl = apiUrl.slice(0, -1);
  }
  if (apiUrl.includes("asaas.com") && !apiUrl.includes("/api/v3")) {
    apiUrl += "/api/v3";
  }

  return { apiKey, apiUrl };
}

export async function asaasFetch(endpoint: string, options: RequestInit = {}) {
  const { apiKey, apiUrl } = getAsaasConfig();

  if (!apiKey) {
    throw new Error("Chave de API do Asaas (ASAAS_API_KEY) não configurada no servidor.");
  }

  const url = `${apiUrl}${endpoint.startsWith("/") ? endpoint : "/" + endpoint}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "access_token": apiKey,
    ...((options.headers as Record<string, string>) || {}),
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const text = await response.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      console.error("[Asaas Service] Resposta da API não é um JSON válido:", text.substring(0, 200));
      throw new Error(`Erro de integração com Asaas (Status HTTP ${response.status}).`);
    }

    if (!response.ok) {
      console.error(`[Asaas Service] Erro API Asaas (Status ${response.status}):`, data);
      const errorMessage =
        data?.errors?.[0]?.description ||
        data?.message ||
        `Erro na API do Asaas (Status HTTP ${response.status})`;
      throw new Error(errorMessage);
    }

    return data;
  } catch (err: any) {
    if (apiKey && err.message && err.message.includes(apiKey)) {
      err.message = err.message.replace(apiKey, "[REDACTED_API_KEY]");
    }
    throw err;
  }
}

/**
 * Cria ou recupera o cliente Asaas vinculado à barbearia/usuário no SaaS.
 * Garante idempotência e evita duplicidade.
 */
export async function createOrGetAsaasCustomer(
  barbershopId: string,
  userFallback?: { name?: string; email?: string; phone?: string; cpfCnpj?: string }
): Promise<{ asaasCustomerId: string; created: boolean }> {
  const shopRef = db.collection("barbershops").doc(barbershopId);
  const shopDoc = await shopRef.get();

  if (!shopDoc.exists) {
    throw new Error("Barbearia não encontrada no banco de dados.");
  }

  const shopData = shopDoc.data() || {};
  let existingCustomerId = shopData.asaasCustomerId || shopData.asaas_customer_id;

  // Cenário 1: Se já possui asaasCustomerId no banco, verifica validade no Asaas
  if (existingCustomerId) {
    try {
      console.log(`[Asaas Service] Verificando cliente existente ${existingCustomerId} no Asaas...`);
      const existingCustomer = await asaasFetch(`/customers/${existingCustomerId}`);
      if (existingCustomer && existingCustomer.id) {
        console.log(`[Asaas Service] Cliente ${existingCustomerId} verificado com sucesso.`);
        return { asaasCustomerId: existingCustomerId, created: false };
      }
    } catch (err: any) {
      console.warn(`[Asaas Service] Cliente ${existingCustomerId} inválido ou não encontrado no Asaas. Recriando vínculo...`);
      existingCustomerId = null;
    }
  }

  const name = shopData.name || userFallback?.name || "Barbearia";
  const email = shopData.email || userFallback?.email || "";
  const phone = shopData.phone || userFallback?.phone || null;
  const cpfCnpj = shopData.cpfCnpj || shopData.cnpj || userFallback?.cpfCnpj || null;

  if (!email) {
    throw new Error("E-mail da barbearia/usuário é obrigatório para cadastro no Asaas.");
  }

  // Idempotência extra: consultar Asaas por externalReference antes de criar novo
  try {
    console.log(`[Asaas Service] Buscando no Asaas cliente por externalReference (${barbershopId})...`);
    const searchResult = await asaasFetch(`/customers?externalReference=${barbershopId}`);
    if (searchResult?.data && searchResult.data.length > 0) {
      const foundCustomer = searchResult.data[0];
      console.log(`[Asaas Service] Cliente reutilizado do Asaas por externalReference: ${foundCustomer.id}`);

      await shopRef.update({
        asaasCustomerId: foundCustomer.id,
        asaas_customer_id: foundCustomer.id,
      });

      return { asaasCustomerId: foundCustomer.id, created: false };
    }
  } catch (searchErr) {
    console.warn("[Asaas Service] Consulta de verificação antes da criação retornou aviso:", searchErr);
  }

  // Cenário 2: Criar novo cliente no Asaas
  console.log(`[Asaas Service] Criando novo cliente no Asaas para ${name} (${email})...`);
  const payload: any = {
    name,
    email,
    externalReference: barbershopId,
    notificationDisabled: false,
  };

  if (phone) {
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length >= 10) {
      payload.mobilePhone = cleanPhone;
    }
  }

  if (cpfCnpj) {
    const cleanCpfCnpj = cpfCnpj.replace(/\D/g, "");
    if (cleanCpfCnpj.length === 11 || cleanCpfCnpj.length === 14) {
      payload.cpfCnpj = cleanCpfCnpj;
    }
  }

  const newCustomer = await asaasFetch("/customers", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const newCustomerId = newCustomer.id;
  if (!newCustomerId) {
    throw new Error("A API do Asaas não retornou um ID de cliente válido.");
  }

  console.log(`[Asaas Service] Cliente criado no Asaas com sucesso: ${newCustomerId}`);

  // Salva no banco de dados do SaaS
  await shopRef.update({
    asaasCustomerId: newCustomerId,
    asaas_customer_id: newCustomerId,
  });

  return { asaasCustomerId: newCustomerId, created: true };
}
