import { db, FieldValue } from "../db.ts";
import { createCustomer, createSubscription, cancelSubscription } from "../../services/mercadoPago/index.ts";
import { PREMIUM_PLAN_NAME, PREMIUM_PLAN_AMOUNT } from "../../config/payment.ts";

export interface SubscribeServiceInput {
  userId: string;
  barbershopId: string;
  planName?: string;
  amount?: number;
  backUrl?: string;
}

export interface SubscribeServiceOutput {
  checkoutUrl: string;
  alreadyExists?: boolean;
}

/**
 * Business logic service to handle the starting of a subscription.
 * Coordinates between Firestore and Mercado Pago API.
 * Uses a multi-step lock to prevent concurrent duplicate creations and NEVER runs external APIs inside a transaction.
 *
 * @param input - The payload containing the authenticated userId, barbershopId, and optional checkout details
 * @returns A promise that resolves to the checkout url (initPoint) and whether it already existed
 */
export async function handleSubscribe(input: SubscribeServiceInput): Promise<SubscribeServiceOutput> {
  const userRef = db.collection("users").doc(input.userId);
  const barbershopRef = db.collection("barbershops").doc(input.barbershopId);
  const processToken = Math.random().toString(36).substring(2) + Date.now();

  // PASSO 1: Transação curta para verificar status, ler customerId e marcar lock
  const step1Result = await db.runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists) {
      throw new Error("Usuário não encontrado.");
    }

    const barbershopDoc = await transaction.get(barbershopRef);
    if (!barbershopDoc.exists) {
      throw new Error("Barbearia não encontrada.");
    }

    const userData = userDoc.data() || {};
    const barbershopData = barbershopDoc.data() || {};

    const currentStatus = String(
      barbershopData.subscriptionStatus || ""
    ).toLowerCase();

    // Se existir assinatura active/pending/approved/authorized, não criar outra. Retornar checkout existente.
    if (["active", "approved", "authorized", "pending", "premium"].includes(currentStatus)) {
      return {
        alreadyExists: true,
        checkoutUrl: barbershopData.subscriptionCheckoutUrl || "",
        customerId: barbershopData.mpCustomerId || null,
        email: userData.email,
        name: userData.name,
        cpf: userData.cpf || userData.cpfCnpj,
      };
    }

    const now = new Date().toISOString();
    const isProcessing = barbershopData.subscriptionProcessing === true;
    const processingStartedAt = barbershopData.subscriptionProcessingStartedAt;
    const lockExpired = processingStartedAt && (new Date(now).getTime() - new Date(processingStartedAt).getTime() > 30000);

    if (isProcessing && !lockExpired) {
      const err = new Error("Já existe uma assinatura sendo criada.");
      (err as any).code = "SUBSCRIPTION_IN_PROGRESS";
      throw err;
    }

    const customerId = barbershopData.mpCustomerId || null;

    // Marcar lock temporário no documento da barbearia
    transaction.set(
      barbershopRef,
      {
        subscriptionProcessing: true,
        subscriptionProcessingStartedAt: now,
        subscriptionProcessToken: processToken,
      },
      { merge: true }
    );

    return {
      alreadyExists: false,
      checkoutUrl: "",
      customerId,
      email: userData.email,
      name: userData.name,
      cpf: userData.cpf || userData.cpfCnpj,
    };
  });

  if (step1Result.alreadyExists) {
    return {
      checkoutUrl: step1Result.checkoutUrl,
      alreadyExists: true,
    };
  }

  let customerId = step1Result.customerId;
  let subscriptionResult: any = null;

  try {
    // PASSO 2: FORA da transação: Criar Customer (se necessário) e Subscription
    if (!customerId) {
      const customer = await createCustomer({
        name: step1Result.name || "Cliente BarberTool",
        email: step1Result.email,
        cpf: step1Result.cpf,
      });
      customerId = customer.id;
    }

    const planName = input.planName || PREMIUM_PLAN_NAME;
    const amount = input.amount || PREMIUM_PLAN_AMOUNT;
    const backUrl = input.backUrl || "https://barbertool.com/dashboard";

    subscriptionResult = await createSubscription({
      customerId,
      payerEmail: step1Result.email,
      planName,
      amount,
      externalReference: input.barbershopId, // Send barbershopId as externalReference
      backUrl,
    });
  } catch (error: any) {
    // Se ocorrer erro: remover processing, registrar erro, não deixar lock permanente.
    console.error("Error outside subscription transaction, cleaning lock:", error);
    try {
      await db.runTransaction(async (transaction) => {
        const barbershopDoc = await transaction.get(barbershopRef);
        if (barbershopDoc.exists) {
          const barbershopData = barbershopDoc.data() || {};
          if (barbershopData.subscriptionProcessToken === processToken) {
            transaction.set(
              barbershopRef,
              {
                subscriptionProcessing: FieldValue.delete(),
                subscriptionProcessToken: FieldValue.delete(),
                subscriptionProcessingStartedAt: FieldValue.delete(),
              },
              { merge: true }
            );
          }
        }
      });
    } catch (txErr) {
      console.error("Failed to release lock after subscription error:", txErr);
    }
    throw error;
  }

  // PASSO 3: Transação curta para confirmar lock e persistir assinatura
  const now = new Date().toISOString();
  return await db.runTransaction(async (transaction) => {
    const barbershopDoc = await transaction.get(barbershopRef);
    if (!barbershopDoc.exists) {
      throw new Error("Barbearia não encontrada.");
    }

    const barbershopData = barbershopDoc.data() || {};

    // Confirmar que o lock ainda pertence ao fluxo atual
    if (barbershopData.subscriptionProcessToken !== processToken) {
      throw new Error("O fluxo de criação expirou ou foi substituído por outra requisição.");
    }

    transaction.set(
      barbershopRef,
      {
        mpCustomerId: customerId,
        mpSubscriptionId: subscriptionResult.id,
        subscriptionStatus: subscriptionResult.status,
        subscriptionCheckoutUrl: subscriptionResult.initPoint,
        subscriptionUpdatedAt: now,
        subscriptionProcessing: FieldValue.delete(),
        subscriptionProcessingStartedAt: FieldValue.delete(),
        subscriptionProcessToken: FieldValue.delete(),
      },
      { merge: true }
    );

    return {
      checkoutUrl: subscriptionResult.initPoint,
    };
  });
}

/**
 * Business logic service to handle the cancellation of an existing subscription.
 * Coordinates between Firestore transactions and Mercado Pago API, avoiding Lost Updates.
 *
 * @param barbershopId - The ID of the barbershop requesting cancellation.
 */
export async function handleCancelSubscription(barbershopId: string): Promise<{ success: boolean }> {
  const barbershopRef = db.collection("barbershops").doc(barbershopId);

  // Transação 1: Ler o documento e obter o ID da assinatura com segurança, verificando o status
  const step1 = await db.runTransaction(async (transaction) => {
    const barbershopDoc = await transaction.get(barbershopRef);
    if (!barbershopDoc.exists) {
      throw new Error("Barbearia não encontrada.");
    }

    const barbershopData = barbershopDoc.data() || {};
    const subscriptionId = barbershopData.mpSubscriptionId;
    const currentStatus = String(barbershopData.subscriptionStatus || "").toLowerCase();

    if (!subscriptionId || currentStatus === "free_restricted") {
      return { alreadyCancelled: true, subscriptionId: null };
    }

    return { alreadyCancelled: false, subscriptionId };
  });

  if (step1.alreadyCancelled) {
    return { success: true };
  }

  const subscriptionId = step1.subscriptionId;
  if (!subscriptionId) {
    return { success: true };
  }

  // Cancelamento via API externa FORA de transações
  await cancelSubscription(subscriptionId);

  // Transação 2: Gravação do status cancelado usando transação do Firestore
  await db.runTransaction(async (transaction) => {
    const barbershopDoc = await transaction.get(barbershopRef);
    if (!barbershopDoc.exists) {
      throw new Error("Barbearia não encontrada.");
    }

    const now = new Date().toISOString();

    transaction.set(
      barbershopRef,
      {
        subscriptionStatus: "free_restricted", // Gravar "free_restricted" (NÃO "cancelled") para bloquear o acesso
        subscriptionCancelledAt: now,
        subscriptionUpdatedAt: now,
      },
      { merge: true }
    );
  });

  return { success: true };
}
