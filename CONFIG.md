# Guia de Configuração e Integração Asaas (Fase 1)

Este documento detalha a arquitetura, configuração, payloads e estratégia de validação para a **Integração de Assinatura Recorrente Mensal via Cartão de Crédito com Período de Testes (Trial)** no Asaas v3.

---

## 1. Visão Geral e Modelo de Negócio

- **Produto**: SaaS de gestão para barbearias (BarberTool).
- **Modelo de Cobrança**: Assinatura recorrente mensal (`cycle: "MONTHLY"`).
- **Método de Pagamento**: Exclusivamente Cartão de Crédito (`billingType: "CREDIT_CARD"`).
- **Período de Teste (Trial)**: 14 dias gratuitos a partir da criação da barbearia.
- **Regra de Transição**:
  - Se o usuário cadastra o cartão **durante** o trial: o Asaas valida o cartão e define a data da primeira cobrança (`nextDueDate`) exatamente para a data de término do trial (`trialEndsAt`). Nenhuma cobrança é realizada antes do término do período de teste.
  - Se o usuário cadastra o cartão **após** o trial ter expirado (status `free_restricted`): `nextDueDate` é definido para o dia corrente (`hoje`), autorizando e cobrando imediatamente.
  - Se o cartão falhar na autorização (saldo insuficiente, dados inválidos, recusa da operadora): o status no banco é atualizado para `payment_failed`, e o frontend recebe resposta de erro clara com status HTTP 402/400.
  - Após a aprovação do pagamento ou recebimento do webhook `PAYMENT_RECEIVED`/`PAYMENT_CONFIRMED`, o status da barbearia é promovido automaticamente para `premium`.

---

## 2. Variáveis de Ambiente (.env)

| Variável | Obrigatório | Descrição | Exemplo Sandbox | Exemplo Produção |
| :--- | :--- | :--- | :--- | :--- |
| `ASAAS_API_URL` | Sim | URL base da API v3 do Asaas | `https://sandbox.asaas.com/api/v3` | `https://api.asaas.com/api/v3` |
| `ASAAS_API_KEY` | Sim | Chave de API / Access Token gerada no painel Asaas | `$aact_YTU5Y...` | `$aact_...` |
| `ASAAS_WEBHOOK_TOKEN` | Sim | Token de autenticação configurado na fila de Webhooks do Asaas | `meu_token_secreto_webhook` | `prod_secret_token_123` |
| `ASAAS_PLAN_VALUE` | Opcional | Valor mensal do plano em Reais (Default: `59.90`) | `59.90` | `59.90` |
| `ASAAS_TRIAL_DAYS` | Opcional | Duração do período de testes em dias (Default: `14`) | `14` | `14` |

---

## 3. Endpoints Disponíveis

Todos os endpoints de manipulação de assinatura exigem o cabeçalho `Authorization: Bearer <JWT_TOKEN>`. O webhook do Asaas é autenticado via cabeçalho `asaas-access-token`.

### A. Obter Informações do Plano
- **Método**: `GET /api/payments/plan`
- **Autenticação**: Pública
- **Resposta (200 OK)**:
```json
{
  "success": true,
  "plan": {
    "name": "Plano Premium Mensal",
    "description": "Acesso completo aos módulos de agendamentos, equipe, relatórios e financeiro.",
    "value": 59.9,
    "currency": "BRL",
    "cycle": "MONTHLY",
    "billingType": "CREDIT_CARD",
    "trialDays": 14
  }
}
```

### B. Criar ou Recuperar Cliente no Asaas
- **Método**: `POST /api/payments/asaas/customer`
- **Autenticação**: `Bearer <token>` (Admin da Barbearia)
- **Payload de Requisição (opcional para enriquecer dados cadastrais)**:
```json
{
  "name": "Barbearia Imperial",
  "email": "contato@barbeariaimperial.com",
  "phone": "11987654321",
  "cpfCnpj": "24971563000174",
  "postalCode": "01310100",
  "address": "Avenida Paulista",
  "addressNumber": "1000",
  "province": "Bela Vista"
}
```
- **Resposta (200 OK)**:
```json
{
  "success": true,
  "asaasCustomerId": "cus_000005934528",
  "created": true,
  "message": "Cliente criado no Asaas com sucesso."
}
```

### C. Criar Assinatura Recorrente Mensal
- **Método**: `POST /api/payments/asaas/subscription` (ou alias `POST /api/payments/subscribe`)
- **Autenticação**: `Bearer <token>`
- **Payload de Requisição**:
```json
{
  "billingType": "CREDIT_CARD",
  "creditCard": {
    "holderName": "JOAO DA SILVA",
    "number": "4000000000000001",
    "expiryMonth": "12",
    "expiryYear": "2028",
    "ccv": "123"
  },
  "creditCardHolderInfo": {
    "name": "João da Silva",
    "email": "joao@exemplo.com",
    "cpfCnpj": "01234567890",
    "postalCode": "01310100",
    "addressNumber": "1000",
    "addressComplement": "Apto 42",
    "phone": "11987654321"
  }
}
```
- **Resposta de Sucesso durante Trial (200 OK)**:
```json
{
  "success": true,
  "subscriptionId": "sub_000000123456",
  "status": "trial",
  "nextDueDate": "2026-09-24",
  "isTrialActive": true,
  "trialDaysRemaining": 14,
  "planValue": 59.9,
  "creditCard": {
    "brand": "VISA",
    "last4": "0001"
  },
  "message": "Cartão validado com sucesso! Seu período de teste continua ativo por mais 14 dias. A primeira cobrança ocorrerá em 2026-09-24."
}
```
- **Resposta de Falha na Autorização (402 Payment Required)**:
```json
{
  "success": false,
  "error": "Erro Asaas: Transação não autorizada pela operadora do cartão.",
  "details": [
    {
      "code": "invalid_credit_card",
      "description": "Transação não autorizada pela operadora do cartão."
    }
  ]
}
```

### D. Consultar Status da Assinatura
- **Método**: `GET /api/payments/subscription`
- **Autenticação**: `Bearer <token>`
- **Resposta (200 OK)**:
```json
{
  "success": true,
  "status": "trial",
  "isTrialActive": true,
  "trialEndsAt": "2026-09-24T18:00:00.000Z",
  "trialDaysRemaining": 14,
  "planValue": 59.9,
  "cycle": "MONTHLY",
  "billingType": "CREDIT_CARD",
  "hasPaymentMethod": true,
  "nextDueDate": "2026-09-24",
  "creditCardBrand": "VISA",
  "creditCardLast4": "0001",
  "asaasSubscriptionId": "sub_000000123456",
  "asaasCustomerId": "cus_000005934528",
  "asaasLiveStatus": "ACTIVE",
  "lastPaymentStatus": "SCHEDULED"
}
```

### E. Cancelar Assinatura
- **Método**: `POST /api/payments/subscription/cancel`
- **Autenticação**: `Bearer <token>`
- **Resposta (200 OK)**:
```json
{
  "success": true,
  "message": "Assinatura cancelada com sucesso."
}
```

### F. Webhook do Asaas
- **Método**: `POST /api/payments/webhook`
- **Autenticação**: Cabeçalho `asaas-access-token: <ASAAS_WEBHOOK_TOKEN>`
- **Exemplo de Payload recebido do Asaas**:
```json
{
  "id": "evt_00000123456",
  "event": "PAYMENT_RECEIVED",
  "dateCreated": "2026-09-24 10:00:00",
  "payment": {
    "id": "pay_000009876543",
    "customer": "cus_000005934528",
    "subscription": "sub_000000123456",
    "billingType": "CREDIT_CARD",
    "value": 59.90,
    "netValue": 57.50,
    "status": "RECEIVED",
    "dueDate": "2026-09-24"
  }
}
```
- **Resposta (200 OK)**:
```json
{
  "success": true,
  "processed": true,
  "duplicate": false,
  "event": "PAYMENT_RECEIVED",
  "barbershopId": "38a39512-40c2-40ce-a1a1-..."
}
```

---

## 4. Idempotência e Tratamento de Repetições no Webhook

O Asaas envia retentativas em caso de falha temporária ou timeouts. Para evitar cobranças repetidas ou inconsistências:
1. Cada evento processado tem seu identificador gravado na coleção `processed_webhooks` do Firestore.
2. Caso um payload com o mesmo ID chegue novamente, o sistema identifica a duplicidade imediatamente e retorna status `200 OK` com `{ "duplicate": true }` sem reexecutar mutações no banco.

---

## 5. Estratégia de Testes em Sandbox (Ambiente Seguro)

1. **Conta de Testes**:
   - Crie uma conta gratuita em [https://sandbox.asaas.com](https://sandbox.asaas.com).
   - Gere sua chave em **Minha Conta > Integrações > Chaves de API**.
   - Defina um token de webhook em **Minha Conta > Integrações > Webhooks**.
2. **Cartões de Teste Oficiais do Asaas**:
   - **Cartão Aprovado**: `4000000000000001`, Validade: `12/2028`, CVV: `123`.
   - **Cartão Recusado (Saldo Insuficiente)**: `4000000000000002`.
   - **Cartão Bloqueado**: `4000000000000003`.
3. **Simulação de Webhooks**:
   - No painel Sandbox do Asaas, acesse **Fila de Sincronização** ou use a rota de testes simulando os eventos `PAYMENT_RECEIVED`, `PAYMENT_OVERDUE` e `SUBSCRIPTION_CANCELLED`.
4. **Isolamento de Produção**:
   - O ambiente Sandbox utiliza domínio e banco de dados totalmente separados (`sandbox.asaas.com`). Nenhuma cobrança real ou chamada a adquirentes de produção é realizada.
   - Em produção (`api.asaas.com`), utilize apenas chaves de produção restritas e ative TLS/HTTPS obrigatório para a URL de Webhook.

---

## 6. Segurança e E-mail Support

1. **JWT_SECRET**: Defina uma chave secreta forte para os tokens de usuário.
2. **SUPPORT_EMAIL_USER** e **SUPPORT_EMAIL_PASS**: Configuração opcional para envio automático de e-mails via SMTP do Gmail.
 

