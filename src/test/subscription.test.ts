import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleSubscribe, handleCancelSubscription } from "../server/services/subscription.service.ts";
import { handleWebhook } from "../server/controllers/webhook.controller.ts";
import { retryAsync } from "../server/utils/retry.ts";
import { WebhookSignatureValidator } from "mercadopago";
import { db } from "../server/db.ts";

// Mock Mercado Pago SDK
vi.mock("mercadopago", () => {
  const mockCreateCustomer = vi.fn().mockResolvedValue({ id: "cust_123", email: "customer@example.com" });
  const mockCreatePreApproval = vi.fn().mockResolvedValue({
    id: "sub_123",
    init_point: "https://mercadopago.com/checkout/sub_123",
    status: "pending",
  });
  const mockUpdatePreApproval = vi.fn().mockResolvedValue({
    id: "sub_123",
    status: "cancelled",
  });
  const mockGetPreApproval = vi.fn().mockResolvedValue({
    id: "sub_123",
    status: "authorized",
    external_reference: "shop_normal",
    payer_id: "payer_123",
    init_point: "https://mercadopago.com/checkout/sub_123",
  });

  return {
    MercadoPagoConfig: class {},
    Customer: class {
      async create(args: any) {
        return mockCreateCustomer(args);
      }
    },
    PreApproval: class {
      async create(args: any) {
        return mockCreatePreApproval(args);
      }
      async update(args: any) {
        return mockUpdatePreApproval(args);
      }
      async get(args: any) {
        return mockGetPreApproval(args);
      }
    },
    Payment: class {
      get = vi.fn().mockResolvedValue({ id: "pay_123", status: "approved", preapproval_id: "sub_123" });
    },
    Invoice: class {
      get = vi.fn().mockResolvedValue({ id: "inv_123", preapproval_id: "sub_123", payment: { id: "pay_123" } });
    },
    WebhookSignatureValidator: {
      validate: vi.fn(),
    },
  };
});

// Mock Database Stores
let usersStore: Record<string, any> = {};
let barbershopsStore: Record<string, any> = {};
let transactionQueue = Promise.resolve();

const mockSetDoc = vi.fn();
const mockUpdateDoc = vi.fn();

function resetMockStores() {
  usersStore = {
    user_normal: {
      id: "user_normal",
      barbershopId: "shop_normal",
      name: "Normal User",
      email: "normal@example.com",
    },
    user_active: {
      id: "user_active",
      barbershopId: "shop_active",
      name: "Active User",
      email: "active@example.com",
    },
    user_cancelled: {
      id: "user_cancelled",
      barbershopId: "shop_cancelled",
      name: "Cancelled User",
      email: "cancelled@example.com",
    },
  };

  barbershopsStore = {
    shop_normal: {
      id: "shop_normal",
      name: "Normal Shop",
      subscriptionStatus: "trial",
    },
    shop_active: {
      id: "shop_active",
      name: "Active Shop",
      subscriptionStatus: "active",
      mpSubscriptionId: "sub_123",
      subscriptionCheckoutUrl: "https://mercadopago.com/checkout/sub_123",
    },
    shop_cancelled: {
      id: "shop_cancelled",
      name: "Cancelled Shop",
      subscriptionStatus: "free_restricted",
      mpSubscriptionId: "sub_123",
    },
  };
}

resetMockStores();

vi.mock("../server/db.ts", () => {
  return {
    FieldValue: {
      delete: () => ({ __isDeleteSentinel: true })
    },
    db: {
      collection: vi.fn().mockImplementation((colName: string) => ({
        doc: vi.fn().mockImplementation((docId: string) => {
          const mockRef = {
            id: docId,
            path: `${colName}/${docId}`,
            set: async (data: any, options?: any) => {
              const store = colName === "users" ? usersStore : barbershopsStore;
              const b = store[docId] || {};
              if (options?.merge) {
                const updated = { ...b, ...data };
                for (const key of Object.keys(data)) {
                  if (data[key] && (data[key].__isDeleteSentinel || typeof data[key] === "function")) {
                    delete updated[key];
                  }
                }
                store[docId] = updated;
              } else {
                store[docId] = { ...b, ...data };
              }
              mockSetDoc(docId, data, options);
            }
          };

          return {
            id: docId,
            ref: mockRef,
            get: async () => {
              if (colName === "webhook_events" && docId === "event_exists") {
                return { exists: true, data: () => ({ eventId: "event_exists" }) };
              }
              if (colName === "webhook_events" && docId === "event_new") {
                return { exists: false };
              }
              if (colName === "users") {
                const u = usersStore[docId];
                if (u) {
                  return {
                    exists: true,
                    id: docId,
                    ref: mockRef,
                    data: () => ({ ...u }),
                  };
                }
              }
              if (colName === "barbershops") {
                const b = barbershopsStore[docId];
                if (b) {
                  return {
                    exists: true,
                    id: docId,
                    ref: mockRef,
                    data: () => ({ ...b }),
                  };
                }
              }
              return { exists: false, data: () => ({}) };
            },
            set: mockRef.set,
            update: mockUpdateDoc,
          };
        }),
        where: vi.fn().mockImplementation((field, op, val) => ({
          get: async () => {
            if (colName === "barbershops" && field === "mpSubscriptionId" && val === "sub_123") {
              const mockRefActive = {
                id: "shop_active",
                path: "barbershops/shop_active",
                set: async (data: any, options?: any) => {
                  const b = barbershopsStore["shop_active"] || {};
                  if (options?.merge) {
                    const updated = { ...b, ...data };
                    for (const key of Object.keys(data)) {
                      if (data[key] && (data[key].__isDeleteSentinel || typeof data[key] === "function")) {
                        delete updated[key];
                      }
                    }
                    barbershopsStore["shop_active"] = updated;
                  } else {
                    barbershopsStore["shop_active"] = { ...b, ...data };
                  }
                  mockSetDoc("shop_active", data, options);
                }
              };

              return {
                empty: false,
                docs: [
                  {
                    id: "shop_active",
                    ref: mockRefActive,
                    data: () => ({ ...barbershopsStore["shop_active"] }),
                  },
                ],
              };
            }
            return { empty: true, docs: [] };
          },
        })),
      })),
      runTransaction: vi.fn().mockImplementation(async (callback) => {
        const resultPromise = transactionQueue.then(async () => {
          const transactionWrapper = {
            get: async (docRef: any) => {
              const docId = docRef.id;
              const isUser = usersStore[docId] !== undefined || docRef.path?.startsWith("users/");
              const store = isUser ? usersStore : barbershopsStore;
              return {
                exists: store[docId] !== undefined,
                id: docId,
                ref: docRef,
                data: () => ({ ...store[docId] }),
              };
            },
            set: vi.fn().mockImplementation((docRef: any, data: any, options?: any) => {
              const docId = docRef.id;
              const isUser = usersStore[docId] !== undefined || docRef.path?.startsWith?.("users/") || docId.startsWith?.("user_");
              const store = isUser ? usersStore : barbershopsStore;
              const original = store[docId] || {};

              if (options?.merge) {
                const updated = { ...original, ...data };
                for (const key of Object.keys(data)) {
                  if (data[key] && (data[key].__isDeleteSentinel || typeof data[key] === "function")) {
                    delete updated[key];
                  }
                }
                store[docId] = updated;
              } else {
                store[docId] = { ...original, ...data };
              }
              mockSetDoc(docRef, data, options);
            }),
            update: mockUpdateDoc,
            delete: vi.fn(),
          };
          return await callback(transactionWrapper);
        });

        transactionQueue = resultPromise.then(() => {}, () => {});
        return await resultPromise;
      }),
    },
    DocumentSnapshotWrapper: class {},
    DocumentReferenceWrapper: class {},
  };
});

describe("Mercado Pago Integration Technical Audit & Verification (Barbershop Scope)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.MP_WEBHOOK_SECRET;
    resetMockStores();
    transactionQueue = Promise.resolve();
  });

  describe("1) Customer & Subscription Creation (Normal Flow)", () => {
    it("should successfully trigger customer and subscription creation for an inactive barbershop", async () => {
      const result = await handleSubscribe({
        userId: "user_normal",
        barbershopId: "shop_normal",
        planName: "Plano Premium",
        amount: 49.9,
        backUrl: "http://test.com",
      });

      expect(result.checkoutUrl).toBe("https://mercadopago.com/checkout/sub_123");
      expect(result.alreadyExists).toBeUndefined();

      // Verify barbershop document is updated with subscription info
      expect(barbershopsStore.shop_normal.mpSubscriptionId).toBe("sub_123");
      expect(barbershopsStore.shop_normal.subscriptionStatus).toBe("pending");
      expect(barbershopsStore.shop_normal.subscriptionCheckoutUrl).toBe("https://mercadopago.com/checkout/sub_123");
    });
  });

  describe("2) Block Duplicate Subscriptions", () => {
    it("should block creating a subscription and return existing credentials when status is active", async () => {
      const result = await handleSubscribe({
        userId: "user_active",
        barbershopId: "shop_active",
        planName: "Plano Premium",
        amount: 49.9,
        backUrl: "http://test.com",
      });

      expect(result.alreadyExists).toBe(true);
      expect(result.checkoutUrl).toBe("https://mercadopago.com/checkout/sub_123");
    });
  });

  describe("3) Webhook Idempotency", () => {
    it("should return HTTP 200 with alreadyProcessed immediately if the eventId was already recorded", async () => {
      const req = {
        body: { id: "event_exists", type: "subscription_preapproval", data: { id: "sub_123" } },
        query: {},
        headers: { "x-request-id": "corr_123" },
      } as any;

      const jsonMock = vi.fn();
      const statusMock = vi.fn().mockReturnValue({ json: jsonMock });
      const res = { status: statusMock } as any;

      await handleWebhook(req, res);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({ received: true, alreadyProcessed: true })
      );
    });
  });

  describe("4) Webhook HMAC Validation", () => {
    it("should return HTTP 401 Unauthorized if verification throws an error", async () => {
      process.env.MP_WEBHOOK_SECRET = "secret_key";

      const mockValidate = WebhookSignatureValidator.validate as any;
      mockValidate.mockImplementationOnce(() => {
        throw new Error("Invalid signature");
      });

      const req = {
        body: { id: "event_new", type: "subscription_preapproval", data: { id: "sub_123" } },
        query: {},
        headers: { "x-signature": "sig_bad", "x-request-id": "req_123" },
      } as any;

      const jsonMock = vi.fn();
      const statusMock = vi.fn().mockReturnValue({ json: jsonMock });
      const res = { status: statusMock } as any;

      await handleWebhook(req, res);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: "Invalid webhook signature." });
    });
  });

  describe("5) Subscription Cancellation", () => {
    it("should call the official cancel SDK and update Firestore with free_restricted status", async () => {
      const result = await handleCancelSubscription("shop_active");

      expect(result.success).toBe(true);
      expect(barbershopsStore.shop_active.subscriptionStatus).toBe("free_restricted");
      expect(barbershopsStore.shop_active.subscriptionCancelledAt).toBeDefined();
    });

    it("should return success without making SDK calls if already cancelled", async () => {
      const result = await handleCancelSubscription("shop_cancelled");
      expect(result.success).toBe(true);
    });
  });

  describe("6) Retry Logic with Exponential Backoff", () => {
    it("should succeed after failing twice with retryable timeout error", async () => {
      let callCount = 0;
      const testFn = async () => {
        callCount++;
        if (callCount < 3) {
          throw new Error("Timeout occurred");
        }
        return "success";
      };

      const result = await retryAsync(testFn);
      expect(result).toBe("success");
      expect(callCount).toBe(3);
    });

    it("should fail immediately on 400 bad request and not retry", async () => {
      let callCount = 0;
      const testFn = async () => {
        callCount++;
        const err = new Error("Invalid field") as any;
        err.status = 400;
        throw err;
      };

      await expect(retryAsync(testFn)).rejects.toThrow("Invalid field");
      expect(callCount).toBe(1);
    });
  });

  describe("7) Production Refactoring & Security Scenarios", () => {
    it("should return HTTP 409 if a subscription creation is already in progress (lock active)", async () => {
      const originalRunTransaction = db.runTransaction;
      db.runTransaction = vi.fn().mockImplementationOnce(async (callback) => {
        const transactionWrapper = {
          get: async (docRef: any) => {
            const isUser = docRef.id.startsWith("user_");
            return {
              exists: true,
              id: docRef.id,
              ref: docRef,
              data: () => {
                if (isUser) {
                  return { name: "Normal User", email: "normal@example.com" };
                } else {
                  return {
                    subscriptionProcessing: true,
                    subscriptionProcessingStartedAt: new Date().toISOString(),
                  };
                }
              }
            };
          },
          set: vi.fn(),
          update: vi.fn(),
          delete: vi.fn(),
        };
        return await callback(transactionWrapper);
      });

      await expect(handleSubscribe({
        userId: "user_normal",
        barbershopId: "shop_normal",
        planName: "Plano Premium",
        amount: 49.9,
      })).rejects.toThrow("Já existe uma assinatura sendo criada.");

      db.runTransaction = originalRunTransaction;
    });

    it("should release the lock (rollback) if createSubscription fails", async () => {
      const { PreApproval } = await import("mercadopago");
      const originalCreate = PreApproval.prototype.create;
      try {
        PreApproval.prototype.create = vi.fn().mockRejectedValueOnce(new Error("MP API Error"));

        await expect(handleSubscribe({
          userId: "user_normal",
          barbershopId: "shop_normal",
          planName: "Plano Premium",
          amount: 49.9,
        })).rejects.toThrow("MP API Error");

        expect(barbershopsStore.shop_normal.subscriptionProcessing).toBeUndefined();
        expect(barbershopsStore.shop_normal.subscriptionProcessToken).toBeUndefined();
      } finally {
        PreApproval.prototype.create = originalCreate;
      }
    });

    it("should reject webhook with HTTP 500 in production if MP_WEBHOOK_SECRET is missing", async () => {
      process.env.NODE_ENV = "production";
      delete process.env.MP_WEBHOOK_SECRET;

      const req = {
        body: { id: "event_new", type: "subscription_preapproval", data: { id: "sub_123" } },
        query: {},
        headers: { "x-request-id": "req_123" },
      } as any;

      const jsonMock = vi.fn();
      const statusMock = vi.fn().mockReturnValue({ json: jsonMock });
      const res = { status: statusMock } as any;

      await handleWebhook(req, res);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: "Webhook validation secret is required in production." });

      process.env.NODE_ENV = "test";
    });

    it("should handle concurrency by allowing only one request to obtain the lock and rejecting the other", async () => {
      const p1 = handleSubscribe({
        userId: "user_normal",
        barbershopId: "shop_normal",
        planName: "Plano Premium",
        amount: 49.9,
      });

      const p2 = handleSubscribe({
        userId: "user_normal",
        barbershopId: "shop_normal",
        planName: "Plano Premium",
        amount: 49.9,
      });

      const results = await Promise.allSettled([p1, p2]);

      const fulfilled = results.filter(r => r.status === "fulfilled");
      const rejected = results.filter(r => r.status === "rejected");

      expect(fulfilled.length).toBe(1);
      expect(rejected.length).toBe(1);
      expect((rejected[0] as any).reason.message).toBe("Já existe uma assinatura sendo criada.");
    });
  });
});
