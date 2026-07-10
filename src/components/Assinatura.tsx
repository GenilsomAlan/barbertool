import React from "react";
import { Check, CreditCard, ExternalLink, HelpCircle } from "lucide-react";
import { motion } from "motion/react";
import SubscriptionCard from "./SubscriptionCard.tsx";

interface AssinaturaProps {
  barbershop: any;
  onUpdate?: () => void;
}

export default function Assinatura({ barbershop, onUpdate }: AssinaturaProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      {/* Real-time Mercado Pago Subscription Management Card */}
      <SubscriptionCard />

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
