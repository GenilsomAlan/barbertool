# Guia de Configuração de Produção

Este documento detalha como configurar as integrações de Terceiros (Asaas e AdSense) para o seu sistema de barbearia.

## 1. Asaas (Pagamentos)

O sistema utiliza o **Asaas** para gerenciar assinaturas Premium via Pix, Boleto ou Cartão.

1.  Crie uma conta em [https://www.asaas.com](https://www.asaas.com) (ou [sandbox.asaas.com](https://sandbox.asaas.com) para testes).
2.  Vá em **Configurações da Conta > Integrações** e gere uma **Chave de API (Access Token)**.
3.  No seu ambiente de hospedagem, configure as seguintes variáveis no arquivo `.env` ou nas configurações do servidor:
    *   `ASAAS_API_URL`: Use `https://api.asaas.com/api/v3` para produção.
    *   `ASAAS_API_KEY`: Cole aqui o seu Access Token.
4.  **Webhook**: Configure o Webhook no painel do Asaas para apontar para `https://seu-dominio.com/api/payments/webhook`. Marque os eventos de "Pagamento Recebido" e "Pagamento Confirmado".

## 2. Google AdSense (Anúncios)

Para exibir anúncios nos planos Trial e Free:

1.  No painel do Google AdSense, crie um novo bloco de anúncios (Ads).
2.  Obtenha o seu **Client ID** (`ca-pub-XXXXXXXXXXXXXXXX`) e o **Slot ID** (`XXXXXXXXXX`).
3.  Configure as variáveis:
    *   `VITE_ADSENSE_CLIENT_ID`: Seu ID de cliente.
    *   `VITE_ADSENSE_SLOT_ID`: O ID do bloco de anúncio.
4.  Se estas variáveis estiverem vazias, o sistema automaticamente mostrará "Banners de Parceria" internos em vez de anúncios do Google.

## 3. Segurança (JWT)

Não esqueça de definir uma chave secreta forte para os tokens de usuário:
*   `JWT_SECRET`: Uma string aleatória longa.
