# Guia de Configuração de Produção

Este documento detalha como configurar as integrações de Terceiros (Mercado Pago e E-mail) para o seu sistema de barbearia.

## 1. Mercado Pago (Pagamentos)

O sistema utiliza o **Mercado Pago** para gerenciar assinaturas Premium recorrentes via PreApproval.

1.  Crie uma conta de desenvolvedor no [Mercado Pago Developers](https://developers.mercadopago.com).
2.  Crie uma nova aplicação no painel para obter suas credenciais de produção e de testes (Sandbox).
3.  No seu ambiente de hospedagem, configure as seguintes variáveis no arquivo `.env` ou nas configurações do servidor:
    *   `MP_ACCESS_TOKEN`: O Token de acesso privado (começa com `APP_USR-`).
    *   `MP_PUBLIC_KEY`: A chave pública (começa com `APP_USR-`).
    *   `MP_WEBHOOK_SECRET`: O segredo de validação HMAC obtido na configuração do webhook (obrigatório se `NODE_ENV=production`).
    *   `MP_ENV`: Use `sandbox` para desenvolvimento/testes e `production` para faturamento real.
4.  **Webhook**: Cadastre a URL de webhook no painel de desenvolvedores do Mercado Pago apontando para:
    `https://seu-dominio.com/api/webhooks/mercadopago`
    E selecione para receber notificações de:
    *   `subscription_preapproval` (assinaturas)
    *   `payment` (pagamentos)
    *   `subscription_authorized_payment` (faturas)

## 2. Segurança e E-mail Support

1.  **JWT_SECRET**: Defina uma chave secreta forte para os tokens de usuário.
2.  **SUPPORT_EMAIL_USER** e **SUPPORT_EMAIL_PASS**: Configuração opcional para envio automático de e-mails via SMTP do Gmail.
