export async function retryAsync<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  const delays = [500, 1000, 2000];
  let attempt = 0;

  while (true) {
    attempt++;
    try {
      return await fn();
    } catch (error: any) {
      if (attempt >= maxAttempts) {
        throw error;
      }

      const isRetryable = checkIfRetryable(error);
      if (!isRetryable) {
        throw error;
      }

      const delay = delays[attempt - 1] || 1000;
      console.warn(`[Retry Helper] Attempt ${attempt} failed. Retrying in ${delay}ms... Error: ${error.message || error}`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

function checkIfRetryable(error: any): boolean {
  if (!error) return false;

  const errMsg = String(error.message || "").toLowerCase();
  
  // Timeout or Network errors
  if (
    errMsg.includes("timeout") ||
    errMsg.includes("network") ||
    errMsg.includes("econnreset") ||
    errMsg.includes("econnrefused") ||
    errMsg.includes("etimedout") ||
    errMsg.includes("enotfound") ||
    errMsg.includes("fetch failed")
  ) {
    return true;
  }

  // Mercado Pago SDK HTTP status checks
  const status = error.status || error.statusCode || (error.response && error.response.status);
  if (status) {
    const statusCode = Number(status);
    
    // Only retry server errors: 500, 502, 503, 504
    if ([500, 502, 503, 504].includes(statusCode)) {
      return true;
    }
    
    // Do not retry client errors (4xx)
    if (statusCode >= 400 && statusCode < 500) {
      return false;
    }
  }

  return false;
}
