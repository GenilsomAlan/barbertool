// Provedores de pagamento Asaas e Mercado Pago removidos — stub retornando aviso de pagamento desativado
import React, { useState } from "react";
import { Check, ShieldAlert, CreditCard, Lock, Clock, ExternalLink, HelpCircle, Info } from "lucide-react";
import { motion } from "motion/react";

interface AssinaturaProps {
  barbershop: any;
  onUpdate?: () => void;
}

export default function Assinatura({ barbershop }: AssinaturaProps) {
  const [errorMsg, setErrorMsg] = useState("");

  const subscriptionStatus = barbershop?.subscriptionStatus || "trial";
  const primaryColor = barbershop?.primaryColor || "#171717";
  const secondaryColor = barbershop?.secondaryColor || "#ffffff";

  // Calculate remaining days for Trial
  const getTrialDaysRemaining = () => {
    if (!barbershop?.trialEndsAt) return 0;
    const now = new Date();
    const end = new Date(barbershop.trialEndsAt);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      });
    } catch {
      return dateStr;
    }
  };

  // Pagamento Asaas e Mercado Pago removido — stub informativo ao usuário
  const handleUpgrade = () => {
    setErrorMsg("Pagamento online desativado — escolha pagamento no local ou entre em contato");
  };

  const trialDaysRemaining = getTrialDaysRemaining();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      {/* Overview Card */}
      <div className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm space-y-6">
        <div>
          <h3 className="font-bold text-lg text-neutral-900">Gerenciamento da Assinatura</h3>
          <p className="text-neutral-400 text-sm">Visualize a situação da sua licença e consulte as pendências da sua conta.</p>
        </div>

        {/* Dynamic Alerts based on status */}
        {subscriptionStatus === "free_restricted" && (
          <div className="p-5 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-4">
            <div className="p-3 bg-red-100 text-red-600 rounded-xl mt-1 shrink-0">
              <Lock size={20} />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-red-950 text-sm">Pendência de Pagamento Encontrada</h4>
              <p className="text-xs text-red-700 leading-relaxed">
                Seu período de avaliação gratuita terminou. O link público de agendamentos online para seus clientes foi temporariamente suspenso. Para reativá-lo, assine o plano premium abaixo.
              </p>
            </div>
          </div>
        )}

        {subscriptionStatus === "trial" && (
          <div className="p-5 bg-blue-50/70 border border-blue-100 rounded-2xl flex items-start gap-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl mt-1 shrink-0">
              <Clock size={20} />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-blue-950 text-sm">Conta Regular em Período de Testes</h4>
              <p className="text-xs text-blue-700 leading-relaxed">
                Você possui <span className="font-bold">{trialDaysRemaining} dias</span> restantes de avaliação gratuita completa. Não há pendências no momento e todos os seus recursos de agendamento online estão liberados.
              </p>
            </div>
          </div>
        )}

        {subscriptionStatus === "premium" && (
          <div className="p-5 bg-emerald-50/70 border border-emerald-100 rounded-2xl flex items-start gap-4">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl mt-1 shrink-0">
              <Check size={20} />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-emerald-950 text-sm">Tudo Ok! Conta Premium Ativa</h4>
              <p className="text-xs text-emerald-700 leading-relaxed">
                Sua assinatura Premium está ativa e em dia. Todos os seus recursos de link público, multiplos barbeiros, estatísticas e layouts personalizados estão 100% liberados e operantes.
              </p>
            </div>
          </div>
        )}

        {/* Detailed Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Situation card */}
          <div className="p-6 rounded-2xl border border-neutral-100 bg-neutral-50/50 space-y-4">
            <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Situação da Conta</h4>
            
            <div className="flex items-center gap-3">
              <div className="relative flex">
                <span className={`absolute inline-flex h-3 w-3 rounded-full opacity-75 animate-ping ${
                  subscriptionStatus === "premium" ? "bg-emerald-400" :
                  subscriptionStatus === "trial" ? "bg-blue-400" : "bg-red-400"
                }`} />
                <span className={`relative inline-flex rounded-full h-3 w-3 ${
                  subscriptionStatus === "premium" ? "bg-emerald-500" :
                  subscriptionStatus === "trial" ? "bg-blue-500" : "bg-red-500"
                }`} />
              </div>
              <span className="text-sm font-bold text-neutral-800">
                {subscriptionStatus === "premium" && "Plano Premium (Ativo)"}
                {subscriptionStatus === "trial" && "Teste Gratuito (Ativo)"}
                {subscriptionStatus === "free_restricted" && "Bloqueada / Expirada"}
              </span>
            </div>

            <div className="space-y-2 pt-2 text-xs text-neutral-600">
              <div className="flex justify-between border-b border-neutral-100 pb-2">
                <span>Tipo do Plano:</span>
                <span className="font-semibold text-neutral-900">
                  {subscriptionStatus === "premium" ? "Corporativo Mensal" : "Período de Experiência"}
                </span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 pb-2">
                <span>Vencimento / Renovação:</span>
                <span className="font-semibold text-neutral-900">
                  {subscriptionStatus === "premium" ? "Toda 1ª semana do mês" : formatDate(barbershop?.trialEndsAt) || "-"}
                </span>
              </div>
              <div className="flex justify-between pb-1">
                <span>Valor de Cobrança:</span>
                <span className="font-semibold text-neutral-900">R$ 5,00 / mês</span>
              </div>
            </div>
          </div>

          {/* Pending items card */}
          <div className="p-6 rounded-2xl border border-neutral-100 bg-neutral-50/50 space-y-4">
            <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Pendências Financeiras</h4>
            
            {subscriptionStatus === "free_restricted" ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-red-600">
                  <ShieldAlert size={18} />
                  <span className="text-xs font-bold">1 faturamento em atraso</span>
                </div>
                <p className="text-[11px] text-neutral-500">
                  A ativação do plano premium regulariza e libera o link público imediatamente após a confirmação.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-emerald-600">
                  <Check size={18} className="border border-emerald-200 rounded-full p-0.5 bg-emerald-50" />
                  <span className="text-xs font-bold">Nenhuma pendência financeira</span>
                </div>
                <p className="text-[11px] text-neutral-500">
                  Sua conta está perfeitamente em dia. Novos faturamentos ocorrerão apenas mediante renovação ou ao fim do período de teste.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Actions section */}
        <div className="pt-4 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-left shrink-0">
            <p className="text-xs text-neutral-500 font-medium">
              Pagamento online desativado — escolha pagamento no local ou entre em contato
            </p>
            {errorMsg && <p className="text-xs text-amber-600 mt-1 font-semibold">{errorMsg}</p>}
          </div>

          {subscriptionStatus !== "premium" && (
            <button
              onClick={handleUpgrade}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all text-sm shadow-xl"
              style={{
                backgroundColor: primaryColor,
                color: secondaryColor,
                boxShadow: `0 10px 15px -3px ${primaryColor}33`
              }}
            >
              <Info size={16} className="shrink-0" />
              Informações sobre Assinatura
            </button>
          )}
        </div>
      </div>

      {/* Benefits checklist & Support */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm space-y-4">
          <h4 className="text-sm font-bold text-neutral-800 flex items-center gap-2">
            <CreditCard size={18} className="text-neutral-500" />
            Recursos inclusos na licença Premium
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-neutral-600">
            <div className="flex items-start gap-2">
              <Check size={16} className="text-emerald-500 shrink-0 mt-0.5" />
              <span>Link de agendamento online público personalizado</span>
            </div>
            <div className="flex items-start gap-2">
              <Check size={16} className="text-emerald-500 shrink-0 mt-0.5" />
              <span>Integração de WhatsApp para contatos da barbearia</span>
            </div>
            <div className="flex items-start gap-2">
              <Check size={16} className="text-emerald-500 shrink-0 mt-0.5" />
              <span>Criação ilimitada de usuários (membros da equipe)</span>
            </div>
            <div className="flex items-start gap-2">
              <Check size={16} className="text-emerald-500 shrink-0 mt-0.5" />
              <span>Personalização visual com logo e cores proprietárias</span>
            </div>
            <div className="flex items-start gap-2">
              <Check size={16} className="text-emerald-500 shrink-0 mt-0.5" />
              <span>Intervalos e durações de agendamento dinâmico</span>
            </div>
            <div className="flex items-start gap-2">
              <Check size={16} className="text-emerald-500 shrink-0 mt-0.5" />
              <span>Painel de Estatísticas e Gerenciamento de Faturamento</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm flex flex-col justify-between gap-4">
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-neutral-800 flex items-center gap-2">
              <HelpCircle size={18} className="text-neutral-500" />
              Precisa de ajuda?
            </h4>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Dúvidas sobre pagamentos, estornos, notas fiscais ou alteração de dados de cobrança? Fale direto conosco.
            </p>
          </div>
          <a
            href="https://wa.me/5534997410717"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-xl text-xs transition-colors border border-neutral-200"
          >
            Falar pelo WhatsApp
            <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </motion.div>
  );
}
