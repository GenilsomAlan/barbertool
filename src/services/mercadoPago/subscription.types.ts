export interface CreateSubscriptionInput {
  customerId: string;
  payerEmail: string;
  planName: string;
  amount: number;
  externalReference: string;
  backUrl: string;
}

export interface SubscriptionResult {
  id: string;
  initPoint: string;
  status: string;
}
