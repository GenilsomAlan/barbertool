# Guia de Configuração de Produção

Este documento detalha como configurar os serviços do seu sistema de barbearia.

## 1. Pagamentos

As integrações online de terceiros (Asaas e Mercado Pago) foram desativadas/removidas. O sistema opera com agendamentos diretos e confirmação no local ou via WhatsApp. Endpoints de pagamento retornam status desativado com stub de compatibilidade.

## 2. Segurança e E-mail Support

1.  **JWT_SECRET**: Defina uma chave secreta forte para os tokens de usuário.
2.  **SUPPORT_EMAIL_USER** e **SUPPORT_EMAIL_PASS**: Configuração opcional para envio automático de e-mails via SMTP do Gmail. 

