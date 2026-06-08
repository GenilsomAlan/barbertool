# Manual do Produto SaaS — Sistema de Gestão para Barbearias

Este documento descreve detalhadamente o funcionamento técnico, comercial e estratégico do sistema para que você possa comercializá-lo com sucesso como um produto SaaS (Software as a Service) altamente lucrativo e escalável.

---

## 🚀 1. Visão Geral do Produto

O sistema é uma plataforma completa e moderna de gestão para barbearias, focada na otimização de agendamentos, controle financeiro, gestão de equipe e captação de clientes. O principal diferencial competitivo é o portal público de agendamentos de cada barbearia, permitindo que os próprios clientes finais agendem seus horários sem precisar de interferência do barbeiro.

### Diferenciais para o Cliente Final (Barbearia)
*   **Aparência Moderna e Profissional:** Layout ultra-polido que valoriza o negócio física e digitalmente.
*   **Redução de Ociosidade:** Agenda aberta 24h para clientes agendarem via link personalizado.
*   **Gestão Financeira Descomplicada:** Faturamento diário, mensal e anual projetado no dashboard com clareza.
*   **Controle de Equipe:** Diferenciação de acessos administrativos de barbeiros comuns.

---

## 💎 2. Modelo de Negócios e Planos SaaS

A monetização é baseada no modelo Freemium estruturado na recorrência. O sistema possui limitação técnica ativa e bloqueios de interface baseados no tipo de plano:

| Benefício / Funcionalidade | Plano Grátis (Free) | Teste Grátis (Trial - 21 dias) | Plano Premium (R$ 49,90/mês) |
| :--- | :---: | :---: | :---: |
| **Painel de Agendamentos Geral** | ✅ Sim | ✅ Sim | ✅ Sim |
| **Página Pública de Agendamento**| ✅ Sim | ✅ Sim | ✅ Sim |
| **Zero Anúncios no Painel** | ❌ Não (Exibe anúncios) | ✅ Sim | ✅ Sim |
| **Relatórios Estatísticos** | ❌ Não (Bloqueado) | ✅ Sim | ✅ Sim |
| **Exportar para Excel (CSV)** | ❌ Não (Bloqueado) | ✅ Sim | ✅ Sim |
| **Múltiplos Acessos (Equipe)** | ❌ Bloqueado | ✅ Ativo durante o período | ✅ Ilimitado |
| **Suporte Prioritário** | ❌ Não | ✅ Sim | ✅ Sim |

### Regra de Bloqueios no Backend & Frontend:
1.  **Criação de Equipes (Multi-acessos):** Bloqueada ativamente no backend para o plano Grátis (`free_restricted`). No painel de Configurações, o botão de "Novo Acesso" exibe um ícone de cadeado e abre automaticamente uma chamada de Upgrade com redirecionamento de checkout.
2.  **Relatórios Financeiros:** O dashboard principal e os relatórios estatísticos de faturamento são bloqueados via CSS (filtro de blur inteligente) e protegidos nas rotas de API para contas no plano Grátis.
3.  **Monetização via AdSense/Anúncios:** O plano Grátis conta com banners comerciais que trazem receita extra ao operador do SaaS enquanto estimulam a barbearia a assinar o plano Premium para ocultá-los.

---

## ⚙️ 3. Regras de Negócio Cruciais

### 📅 Regras de Agendamento
*   **Sem Conflito de Horário:** O backend valida com rigor que nenhum barbeiro tenha mais de um compromisso coincidente no mesmo minuto/hora. Tentativas geram rejeição instantânea.
*   **Associação de Clientes:** Ao efetivar um agendamento público, o sistema cria automaticamente um perfil histórico para o cliente na base de dados da barbearia (se ele for novo) ou incrementa suas métricas de visitas e faturamento de forma recorrente.
*   **Preços Dinâmicos Atrelados:** Ao registrar um atendimento, o preço correspondente ao serviço no exato momento da criação é gravado para sempre no histórico, eliminando distorções de faturamento retroativas caso o proprietário atualize o valor do serviço futuramente.

### 🛡️ Níveis de Acesso e Permissões
*   **Administrador (`admin`):** Acesso completo a todas as áreas. Pode gerenciar serviços, fluxo financeiro, equipe de barbeiros, preferências visuais (cores do sistema) e excluir dados.
*   **Barbeiro (`barber`):** Acesso somente à própria agenda. Ele não vê faturamento corporativo, não altera dados do estabelecimento e não pode adicionar outros membros de equipe.

---

## 🧹 4. Políticas Automatizadas de Manutenção e LGPD

Para garantir conformidade com as leis de proteção de dados (LGPD) e manter o servidor rodando leve, o sistema inclui recursos integrados de limpeza e privacidade:

### 🗑️ Autoexclusão Definitiva (Ação do Usuário)
Disponível em Configurações (Zona de Perigo). O próprio usuário pode solicitar o encerramento do seu cadastro.
*   **Se for Barbeiro:** Deleta apenas seu registro pessoal na base de usuários.
*   **Se for Administrador:** Realiza uma **exclusão em cascata profunda**. Todo o banco de dados associado à barbearia é imediatamente purgado:
    1.  Todos os agendamentos já registrados.
    2.  Todos os serviços criados.
    3.  Toda a listagem de clientes.
    4.  Todas as notificações enviadas.
    5.  Todos os perfis de barbeiros associados à barbearia.
    6.  O próprio estabelecimento comercial.

### 🕰️ Daemon de Limpeza Automática por Inatividade
Um robô inteligente rodando em background no servidor monitora a base de dados a cada **24 horas** em busca de contas fantasmas ou inativas:
*   **Critério de Inatividade:** 60 dias (2 meses) sem qualquer login ou atividade.
*   **Otimização do Banco:** O sistema registra a data do último uso de forma inteligente (`lastActiveAt`). Visando economizar leituras e gravações dispendiosas no banco de dados Firestore, este valor é atualizado em background de forma "frouxa" (com intervalo mínimo de 1 hora entre atualizações).
*   **Ação:** Usuários inativos há mais de 2 meses têm suas contas excluídas em cascata pelo robô de limpeza, liberando espaço de armazenamento e otimizando os custos de infraestrutura do SaaS.

---

## 📈 5. Como Oferecer Isso como um Produto (Guia Comercial)

### 🎯 Público-Alvo Principal
*   Barbearias de bairro de pequeno e médio porte (que ainda usam papel ou WhatsApp manual).
*   Salões de beleza focados em agilidade.
*   Barbeiros autônomos que atendem em domicílio ou estúdios privados.

### 💡 Estratégia de Venda (Funil de Conversão)
1.  **Aceleração de Entrada (Foco no Trial):** Ofereça os 21 dias grátis sem pedir cartão de crédito. Isso rebaixa a barreira psicológica de entrada. Mostre ao dono da barbearia o portal público dele gerando agendamentos enquanto ele trabalha.
2.  **O Gatilho da Equipe:** Quando a barbearia começa a crescer e o dono tenta cadastrar o segundo barbeiro de sua equipe para usar o sistema, o software pede o upgrade para o Premium de R$ 49,90/mês. Este é o seu principal convertor de vendas.
3.  **Precificação Altamente Atrativa:** Cobrar R$ 49,90 mensais é extremamente aceitável para qualquer negócio que fatura. O sistema se paga sozinho com apenas 1 ou 2 cortes fechados pela agenda online por mês!

---

## 🛠️ 6. Arquitetura Técnica Simplificada

*   **Frontend:** React (Vite) + Tailwind CSS + Lucide Icons (design moderno de altíssima fidelidade).
*   **Backend:** Node.js (com Express e TypeScript) autônomo e de resposta rápida.
*   **Banco de Dados:** Google Firebase Firestore, garantindo tempo de carregamento instantâneo, persistência robusta e excelente resiliência sob carga.
*   **Comunicação API:** Clean Client-Side wrapper que gerencia tokens JWT (JSON Web Tokens) para controle automático de sessão.

---

Com este produto em mãos, você tem exatamente o que é necessário para dominar o nicho de beleza e agendamento da sua região com custos mínimos de manutenção de servidor e máximo ganho na recorrência!
