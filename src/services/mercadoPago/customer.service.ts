import { Customer } from "mercadopago";
import { CustomerRequestBody } from "mercadopago/dist/clients/customer/commonTypes";
import { mercadoPagoClient } from "../../config/mercadopago.ts";
import { CreateCustomerInput, CustomerResult } from "./customer.types.ts";
import { retryAsync } from "../../server/utils/retry.ts";

/**
 * Extracts a highly detailed error message from Mercado Pago API errors.
 */
export function getDetailedMPError(error: any): string {
  if (!error) return "Unknown error";

  let detail = "";

  if (typeof error === "string") {
    return error;
  }

  if (typeof error === "object") {
    // Check if cause is an array with details (typical Mercado Pago error structure)
    if (Array.isArray(error.cause)) {
      const causeDetails = error.cause
        .map((c: any) => {
          if (c && typeof c === "object") {
            return c.description || c.code || JSON.stringify(c);
          }
          return String(c);
        })
        .filter(Boolean)
        .join("; ");
      if (causeDetails) {
        detail = `Cause: ${causeDetails}`;
      }
    }

    // Check inside error.body or error.api_response if available
    const body = error.body || (error.api_response && error.api_response.content);
    if (body) {
      let parsedBody = body;
      if (typeof body === "string") {
        try {
          parsedBody = JSON.parse(body);
        } catch {
          // ignore
        }
      }

      if (parsedBody && typeof parsedBody === "object") {
        const msg = parsedBody.message || parsedBody.error;
        if (msg) {
          detail = detail ? `${msg} (${detail})` : msg;
        }
        if (Array.isArray(parsedBody.cause)) {
          const bodyCauses = parsedBody.cause
            .map((c: any) => c.description || c.code || JSON.stringify(c))
            .filter(Boolean)
            .join("; ");
          if (bodyCauses) {
            detail = detail ? `${detail} (Cause: ${bodyCauses})` : `Cause: ${bodyCauses}`;
          }
        }
      }
    }

    // Fallbacks
    if (!detail) {
      if (error.message) {
        detail = error.message;
      } else if (error.error) {
        detail = error.error;
      } else {
        detail = JSON.stringify(error);
      }
    }
  }

  return detail || "Unknown error";
}

/**
 * Searches for a Customer in Mercado Pago by email.
 *
 * @param email - The email to search for
 * @returns A promise that resolves to CustomerResult if found, or null
 */
export async function findCustomerByEmail(email: string): Promise<CustomerResult | null> {
  try {
    const customerClient = new Customer(mercadoPagoClient);
    
    // Search using the email
    const response = await retryAsync(() => customerClient.search({
      options: {
        email: email,
      }
    }));

    if (response && Array.isArray(response.results) && response.results.length > 0) {
      const match = response.results[0];
      if (match && match.id && match.email) {
        return {
          id: match.id,
          email: match.email,
        };
      }
    }
    return null;
  } catch (error: unknown) {
    console.warn("Failed to search Mercado Pago Customer by email, returning null:", error);
    return null;
  }
}

/**
 * Creates a Customer in Mercado Pago using the official SDK and the initialized configuration.
 *
 * @param input - The customer details (name, email, optional cpf)
 * @returns A promise that resolves to the CustomerResult containing id and email
 */
export async function createCustomer(input: CreateCustomerInput): Promise<CustomerResult> {
  // Pre-emptive search to avoid duplicate customer creation errors
  try {
    const existing = await findCustomerByEmail(input.email);
    if (existing) {
      console.log(`Found existing Mercado Pago customer with email ${input.email}: ${existing.id}`);
      return existing;
    }
  } catch (err) {
    console.warn("Pre-emptive customer search failed, proceeding with creation:", err);
  }

  try {
    const customerClient = new Customer(mercadoPagoClient);

    const nameParts = input.name.trim().split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ");

    const body: CustomerRequestBody = {
      email: input.email,
      first_name: firstName,
    };

    if (lastName) {
      body.last_name = lastName;
    }

    if (input.cpf) {
      const cleanDoc = input.cpf.replace(/\D/g, "");
      if (cleanDoc) {
        if (cleanDoc.length === 11) {
          body.identification = {
            type: "CPF",
            number: cleanDoc,
          };
        } else if (cleanDoc.length === 14) {
          body.identification = {
            type: "CNPJ",
            number: cleanDoc,
          };
        }
      }
    }

    // Call using retry helper with exponential backoff
    const response = await retryAsync(() => customerClient.create({ body }));

    if (!response || !response.id || !response.email) {
      throw new Error("Invalid or incomplete response received from Mercado Pago Customer API");
    }

    return {
      id: response.id,
      email: response.email,
    };
  } catch (error: unknown) {
    console.error("Error creating Mercado Pago Customer:", error);
    const errorMessage = getDetailedMPError(error);

    // Fallback if customer already exists (double safety)
    if (errorMessage.toLowerCase().includes("already exist")) {
      console.log(`Mercado Pago customer with email ${input.email} already exists on fallback. Attempting to retrieve customer details...`);
      try {
        const existing = await findCustomerByEmail(input.email);
        if (existing) {
          return existing;
        }
      } catch (fallbackErr) {
        console.error("Fallback customer search also failed:", fallbackErr);
      }
    }

    throw new Error(`Mercado Pago Customer Creation Failed: ${errorMessage}`);
  }
}

