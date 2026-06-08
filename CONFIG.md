# Guia de Configuração de Produção

Este documento detalha como configurar as integrações de Terceiros (Asaas ou de e-mail) para o seu sistema de barbearia.

## 1. Asaas (Pagamentos)

O sistema utiliza o **Asaas** para gerenciar assinaturas Premium via Pix, Boleto ou Cartão.

1.  Crie uma conta em [https://www.asaas.com](https://www.asaas.com) (ou [sandbox.asaas.com](https://sandbox.asaas.com) para testes).
2.  Vá em **Configurações da Conta > Integrações** e gere uma **Chave de API (Access Token)**.
3.  No seu ambiente de hospedagem, configure as seguintes variáveis no arquivo `.env` ou nas configurações do servidor:
    *   `ASAAS_API_URL`: Use `https://api.asaas.com/api/v3` para produção.
    *   `ASAAS_API_KEY`: Cole aqui o seu Access Token.
4.  **Webhook**: Configure o Webhook no painel do Asaas para apontar para `https://seu-dominio.com/api/payments/webhook`. Marque os eventos de "Pagamento Recebido" e "Pagamento Confirmado".

## 2. Segurança e E-mail Support

1.  **JWT_SECRET**: Defina uma chave secreta forte para os tokens de usuário.
2.  **SUPPORT_EMAIL_USER** e **SUPPORT_EMAIL_PASS**: Configuração opcional para envio automático de e-mails via SMTP do Gmail. 

