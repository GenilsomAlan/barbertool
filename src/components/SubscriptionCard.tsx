import React, { useState, useEffect } from "react";
import { api } from "../services/api.ts";
import { PREMIUM_PLAN_NAME, PREMIUM_PLAN_AMOUNT } from "../config/payment.ts";
import { 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  PauseCircle, 
  PlayCircle, 
  Clock, 
  Zap, 
  CreditCard, 
  ArrowRight, 
  Sparkles, 
  ShieldAlert,
  Loader2,
  Calendar
} from "lucide-react";
import { motion } from "motion/react";

interface SubscriptionData {
  provider: string;
  status: string;
  customerId: string | null;
  subscriptionId: string | null;
  checkoutUrl: string | null;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  updatedAt: string | null;
  createdAt: string | null;
}

export default function SubscriptionCard() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchSubscription = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const data = await api.payments.getSubscription();
      setSubscription(data);
    } catch (err: any) {
      console.error("Erro ao carregar dados de assinatura:", err);
      setErrorMsg("Não foi possível carregar as informações da sua assinatura. Por favor, recarregue a página.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  const getTrialDaysRemaining = (endsAtStr?: string | null) => {
    if (!endsAtStr) return 0;
    const now = new Date();
    const end = new Date(endsAtStr);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      });
    } catch {
      return "-";
    }
  };

  const handleCreateSubscription = async () => {
    setActionLoading(true);
    setErrorMsg("");
    try {
      const response = await api.payments.createSubscription({
        planName: PREMIUM_PLAN_NAME,
        amount: PREMIUM_PLAN_AMOUNT
      });

      if (response && response.success && response.checkoutUrl) {
        window.location.href = response.checkoutUrl;
      } else {
        throw new Error("Não foi possível gerar o link de checkout do Mercado Pago.");
      }
    } catch (err: any) {
      console.error("Erro ao criar assinatura:", err);
      setErrorMsg(err.message || "Erro ao iniciar o processo de contratação da assinatura.");
      setActionLoading(false);
    }
  };

  const handleContinuePayment = () => {
    if (subscription?.checkoutUrl) {
      window.location.href = subscription.checkoutUrl;
    } else {
      handleCreateSubscription();
    }
  };

  const handlePlaceholderAction = (actionName: string) => {
    alert(`A ação "${actionName}" estará disponível automaticamente após a confirmação e conciliação completa do Mercado Pago.`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 space-y-4 bg-white/50 backdrop-blur-sm rounded-3xl border border-neutral-100">
        <Loader2 className="w-8 h-8 text-neutral-800 animate-spin" />
        <p className="text-sm text-neutral-500 font-medium">Carregando detalhes da assinatura...</p>
      </div>
    );
  }

  if (errorMsg && !subscription) {
    return (
      <div className="p-6 bg-red-50 border border-red-100 rounded-3xl space-y-4">
        <div className="flex items-start gap-3">
          <ShieldAlert className="text-red-600 shrink-0 mt-0.5" size={20} />
          <div className="space-y-1">
            <h4 className="font-bold text-red-950 text-sm">Erro ao Carregar</h4>
            <p className="text-xs text-red-700 leading-relaxed">{errorMsg}</p>
          </div>
        </div>
        <button 
          onClick={fetchSubscription}
          className="px-4 py-2 text-xs font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 transition"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  const status = subscription?.status || "trial";
  const trialDaysRemaining = getTrialDaysRemaining(subscription?.trialEndsAt);

  // Render proper Badge and Info based on status
  const getStatusBadge = (statusStr: string) => {
    switch (statusStr.toLowerCase()) {
      case "active":
      case "approved":
      case "authorized":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={13} className="fill-emerald-100" />
            Ativa
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
            <Clock size={13} />
            Pendente
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-600 border border-neutral-200">
            <XCircle size={13} />
            Cancelada
          </span>
        );
      case "paused":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <PauseCircle size={13} />
            Pausada
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle size={13} />
            Recusada
          </span>
        );
      case "trial":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            <Sparkles size={13} className="text-sky-500 fill-sky-100" />
            Período de Teste
          </span>
        );
    }
  };

  // Get recommendations for each state
  const getRecommendation = (statusStr: string) => {
    switch (statusStr.toLowerCase()) {
      case "active":
      case "approved":
      case "authorized":
        return "Sua licença Premium está regularizada e com todos os recursos habilitados. Não há nenhuma ação pendente no momento.";
      case "pending":
        return "Detectamos um pagamento pendente no Mercado Pago. Por favor, clique no botão para continuar para a página de faturamento oficial e concluir sua transação.";
      case "cancelled":
        return "Sua assinatura foi cancelada. Habilite o plano Premium novamente para restabelecer o link público de agendamentos da sua barbearia.";
      case "paused":
        return "Sua assinatura está pausada. Ela poderá ser reativada a qualquer momento para reaver todos os recursos.";
      case "rejected":
        return "O Mercado Pago recusou a última cobrança. Recomendamos reativar ou iniciar um novo fluxo para atualizar seus dados de pagamento.";
      case "trial":
      default:
        return trialDaysRemaining > 0
          ? `Aproveite seu período de avaliação! Você possui mais ${trialDaysRemaining} dias gratuitos para testar o sistema. Assine para garantir a continuidade.`
          : "Seu período de testes grátis expirou. Faça o upgrade agora para liberar o acesso aos agendamentos online dos clientes.";
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-3xl border border-neutral-100 shadow-sm overflow-hidden"
    >
      {/* Header Banner */}
      <div className="bg-neutral-900 text-white p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold tracking-wider uppercase bg-white/10 px-2 py-0.5 rounded text-white/90">
              Licença Atual
            </span>
            {subscription?.trialEndsAt && getStatusBadge(status)}
          </div>
          <h3 className="text-xl md:text-2xl font-bold font-sans tracking-tight">
            {status.toLowerCase() === "trial" ? "Plano de Avaliação Grátis" : "BarberTool Premium Recorrente"}
          </h3>
          <p className="text-neutral-400 text-sm flex items-center gap-1.5">
            <CreditCard size={14} />
            {subscription?.subscriptionId ? `ID: ${subscription.subscriptionId}` : "Contrato via Mercado Pago"}
          </p>
        </div>
        
        <div className="text-left md:text-right">
          <p className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">Valor Mensal</p>
          <p className="text-2xl md:text-3xl font-extrabold text-white">R$ 49,90<span className="text-sm font-medium text-neutral-400">/mês</span></p>
        </div>
      </div>

      {/* Main Details Body */}
      <div className="p-6 md:p-8 space-y-6">
        {/* Error message at action tier */}
        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-100 text-rose-800 text-xs rounded-2xl flex items-center gap-2">
            <ShieldAlert size={16} className="shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Col 1: Status Details */}
          <div className="p-4 rounded-2xl bg-neutral-50/50 border border-neutral-100 space-y-3">
            <p className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">Informações Gerais</p>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-neutral-500">Status Geral:</span>
                <span className="font-semibold text-neutral-800">{getStatusBadge(status)}</span>
              </div>
              {subscription?.customerId && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-neutral-500">ID Cliente:</span>
                  <span className="font-mono text-xs font-semibold text-neutral-700 max-w-[120px] truncate">
                    {subscription.customerId}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center text-sm">
                <span className="text-neutral-500">Provedor:</span>
                <span className="font-semibold text-neutral-800 uppercase text-xs">
                  {subscription?.provider || "mercado pago"}
                </span>
              </div>
            </div>
          </div>

          {/* Col 2: Trial/Dates */}
          <div className="p-4 rounded-2xl bg-neutral-50/50 border border-neutral-100 space-y-3">
            <p className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">Período de Testes</p>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-neutral-500">Dias Restantes:</span>
                <span className={`font-bold text-sm ${trialDaysRemaining > 0 ? "text-sky-600" : "text-neutral-400"}`}>
                  {trialDaysRemaining} dias
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-neutral-500">Início do Teste:</span>
                <span className="font-semibold text-neutral-700">{formatDate(subscription?.trialStartedAt || subscription?.createdAt)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-neutral-500">Fim do Teste:</span>
                <span className="font-semibold text-neutral-700">{formatDate(subscription?.trialEndsAt)}</span>
              </div>
            </div>
          </div>

          {/* Col 3: Recommended Action Header Card */}
          <div className="p-4 rounded-2xl bg-neutral-50/50 border border-neutral-100 md:col-span-2 lg:col-span-1 space-y-3">
            <p className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">Ação Recomendada</p>
            <p className="text-xs text-neutral-600 leading-relaxed font-medium">
              {getRecommendation(status)}
            </p>
          </div>
        </div>

        {/* Action Button Section based on exact subscription statuses */}
        <div className="pt-4 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs text-neutral-400 flex items-center gap-1.5">
            <Calendar size={14} />
            Última atualização em {formatDate(subscription?.updatedAt || subscription?.createdAt)}
          </div>

          <div className="flex items-center gap-3">
            {/* Action buttons mapping exactly to status */}
            {(status.toLowerCase() === "active" || status.toLowerCase() === "approved" || status.toLowerCase() === "authorized") && (
              <button
                type="button"
                onClick={() => handlePlaceholderAction("Cancelar Assinatura")}
                className="w-full sm:w-auto px-5 py-2.5 text-sm font-semibold rounded-2xl border border-neutral-200 text-neutral-600 hover:bg-neutral-50 active:bg-neutral-100 transition-all duration-200"
              >
                Cancelar Assinatura
              </button>
            )}

            {status.toLowerCase() === "pending" && (
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleContinuePayment}
                className="w-full sm:w-auto px-6 py-2.5 text-sm font-bold rounded-2xl text-white bg-amber-500 hover:bg-amber-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                {actionLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    Continuar Pagamento
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            )}

            {status.toLowerCase() === "cancelled" && (
              <button
                type="button"
                onClick={() => handlePlaceholderAction("Reativar Assinatura")}
                className="w-full sm:w-auto px-6 py-2.5 text-sm font-bold rounded-2xl text-white bg-neutral-900 hover:bg-neutral-800 active:scale-[0.98] transition-all"
              >
                Reativar Assinatura
              </button>
            )}

            {status.toLowerCase() === "trial" && (
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleCreateSubscription}
                className="w-full sm:w-auto px-6 py-2.5 text-sm font-bold rounded-2xl text-white bg-neutral-900 hover:bg-neutral-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm"
                style={{
                  boxShadow: `0 10px 15px -3px rgba(0,0,0,0.1)`
                }}
              >
                {actionLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <Zap size={15} className="fill-current text-amber-400" />
                    Assinar Agora
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
