const API_URL = "/api";

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  let data: any = {};
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      data = await response.json();
    } catch {
      data = {};
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
      return new Promise(() => {}); // Never resolve/reject during redirect
    }
    const error: any = new Error(data.error || "Something went wrong");
    error.status = response.status;
    error.message = data.error || "Something went wrong";
    throw error;
  }

  return data;
}

export async function fetchPublic(endpoint: string, options: RequestInit = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  let data: any = {};
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      data = await response.json();
    } catch {
      data = {};
    }
  }

  if (!response.ok) {
    const error: any = new Error(data.error || "Something went wrong");
    error.status = response.status;
    error.message = data.error || "Something went wrong";
    throw error;
  }

  return data;
}

export const api = {
  auth: {
    login: (credentials: any) => fetchApi("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),
    register: (data: any) => fetchApi("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    sendRegisterVerificationCode: (email: string) => fetchApi("/auth/send-verification-code", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
    forgotPassword: (email: string) => fetchApi("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
    resetPassword: (data: any) => fetchApi("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    verifyCoupon: (code: string) => fetchApi(`/auth/verify-coupon/${code}`),
  },
  public: {
    getBarber: (bookingToken: string) => fetchPublic(`/public/barber/${bookingToken}`),
    getSlots: (bookingToken: string, date: string, serviceId: string) => fetchPublic(`/public/barber/${bookingToken}/slots?date=${date}&serviceId=${serviceId}`),
    createAppointment: (bookingToken: string, data: any) => fetchPublic(`/public/barber/${bookingToken}/appointments`, { method: 'POST', body: JSON.stringify(data) })
  },
  barbershop: {
    me: () => fetchApi("/barbershop/me"),
    update: (data: any) => fetchApi("/barbershop", { method: "PATCH", body: JSON.stringify(data) }),
  },
  services: {
    list: () => fetchApi("/services"),
    create: (data: any) => fetchApi("/services", { method: "POST", body: JSON.stringify(data) }),
    delete: (id: string) => fetchApi(`/services/${id}`, { method: "DELETE" }),
  },
  appointments: {
    list: (start?: string, end?: string) => {
      const query = start && end ? `?start=${start}&end=${end}` : "";
      return fetchApi(`/appointments${query}`);
    },
    create: (data: any) => fetchApi("/appointments", { method: "POST", body: JSON.stringify(data) }),
    updateStatus: (id: string, status: string) => fetchApi(`/appointments/${id}/status`, { 
      method: "PATCH", 
      body: JSON.stringify({ status }) 
    }),
    reschedule: (id: string, date: string, serviceId?: string, customerName?: string, customerPhone?: string) => fetchApi(`/appointments/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ date, serviceId, customerName, customerPhone })
    }),
    delete: (id: string) => fetchApi(`/appointments/${id}`, { method: "DELETE" }),
  },
  // Integrações com Asaas e Mercado Pago removidas — endpoints substituídos por stubs seguros que retornam status disabled
  payments: {
    ensureAsaasCustomer: () => fetchApi("/payments/asaas/customer", { method: "POST" }),
    createSubscription: (data: any) => fetchApi("/payments/subscribe", { method: "POST", body: JSON.stringify(data) }),
    getSubscription: () => fetchApi("/payments/subscription"),
    cancel: () => fetchApi("/payments/subscription/cancel", { method: "POST" }),
  },
  customers: {
    list: () => fetchApi("/customers"),
    history: (id: string) => fetchApi(`/customers/${id}/history`),
    update: (id: string, data: { name?: string; phone?: string; email?: string }) => fetchApi(`/customers/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data)
    }),
    delete: (id: string) => fetchApi(`/customers/${id}`, { method: "DELETE" }),
  },
  users: {
    list: () => fetchApi("/users"),
    create: (data: any) => fetchApi("/users", { method: "POST", body: JSON.stringify(data) }),
    delete: (id: string) => fetchApi(`/users/${id}`, { method: "DELETE" }),
    deleteMe: () => fetchApi("/users/me", { method: "DELETE" }),
    update: (id: string, data: any) => fetchApi(`/users/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    updatePassword: (id: string, newPassword: string) => fetchApi(`/users/${id}/password`, {
      method: "PATCH",
      body: JSON.stringify({ newPassword }),
    }),
    regenerateToken: (id: string) => fetchApi(`/users/${id}/regenerate-token`, { method: 'POST' })
  },
  stats: {
    get: (date?: string) => {
      const query = date ? `?date=${date}` : "";
      return fetchApi(`/stats${query}`);
    },
  },
  notifications: {
    list: () => fetchApi("/notifications"),
    markAllAsRead: () => fetchApi("/notifications/read-all", { method: "POST" }),
    clearAll: () => fetchApi("/notifications/all", { method: "DELETE" }),
  }
};
