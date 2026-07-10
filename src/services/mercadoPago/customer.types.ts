export interface CreateCustomerInput {
  name: string;
  email: string;
  cpf?: string;
}

export interface CustomerResult {
  id: string;
  email: string;
}
