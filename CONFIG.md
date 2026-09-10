# Guia de Configuração de Produção

Este documento detalha como configurar as integrações de Terceiros (Asaas, Mercado Pago ou de e-mail) para o seu sistema de barbearia.

## 1. Asaas (Pagamentos - Etapa 1: Vínculo de Clientes)

O sistema integra com a API oficial do **Asaas** para gerenciamento de clientes e cobranças.

1. Crie uma conta no Asaas em [https://www.asaas.com](https://www.asaas.com) (ou [sandbox.asaas.com](https://sandbox.asaas.com) para testes).
2. Acesse **Configurações da Conta > Integrações** e gere sua chave de API (**Access Token**).
3. No arquivo `.env` do seu servidor backend, configure:
   * `ASAAS_API_URL`: Use `https://sandbox.asaas.com/api/v3` para testes ou `https://api.asaas.com/api/v3` para produção.
   * `ASAAS_API_KEY`: Cole aqui a sua chave de API do Asaas.

## 2. Mercado Pago (Pagamentos)

O sistema utiliza o **Mercado Pago** para gerenciar assinaturas recorrentes via PreApproval.

1.  Crie uma conta em [https://www.mercadopago.com.br](https://www.mercadopago.com.br) ou acesse o painel de desenvolvedores do Mercado Pago.
2.  Obtenha as credenciais de produção ou de testes nas configurações de sua aplicação.
3.  No seu ambiente de hospedagem, configure as seguintes variáveis no arquivo `.env` ou nas configurações do servidor:
    *   `MP_ACCESS_TOKEN`: O token de acesso privado (Access Token) gerado no painel do Mercado Pago.
    *   `MP_PUBLIC_KEY`: A chave pública do Mercado Pago utilizada nas integrações do frontend.
    *   `MP_WEBHOOK_SECRET`: A chave secreta (ou token de validação) utilizada para verificar a integridade e autenticidade das requisições HMAC enviadas pelo webhook do Mercado Pago.
    *   `MP_ENV`: Configure como `sandbox` para o ambiente de testes ou `production` para o ambiente de produção.
4.  **Webhook**: Cadastre a URL do webhook `https://seu-dominio.com/api/webhooks/mercadopago` no painel de desenvolvedores do Mercado Pago para receber notificações sobre eventos e atualizações de assinaturas.

## 2. Segurança e E-mail Support

1.  **JWT_SECRET**: Defina uma chave secreta forte para os tokens de usuário.
2.  **SUPPORT_EMAIL_USER** e **SUPPORT_EMAIL_PASS**: Configuração opcional para envio automático de e-mails via SMTP do Gmail. 

