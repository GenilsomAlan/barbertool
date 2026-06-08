import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { 
  ArrowLeft, Check, ShieldCheck, Zap, CreditCard, Loader2, Info, 
  User, CheckCircle, FileText, QrCode, Copy, RefreshCw, Phone, Tag
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function Checkout() {
  const navigate = useNavigate();
  const [bar_shop, setBarShop] = useState<any>(null);
  
  // Pre-filled with the exact test data requested by the user
  const [formData, setFormData] = useState({
    name: "Marcelo Almeida",
    cpfCnpj: "24971563792",
    mobilePhone: "4799376637",
    billingType: "BOLETO", // BOLETO, PIX, or CREDIT_CARD
    planValue: 49.90, // default application standard
    planName: "Plano Premium",
  });

  const [creditCard, setCreditCard] = useState({
    holderName: "Marcelo Almeida",
    number: "",
    expiryMonth: "",
    expiryYear: "",
    ccv: ""
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successData, setSuccessData] = useState<any>(null);
  const [pixInfo, setPixInfo] = useState<any>(null);
  const [loadingPix, setLoadingPix] = useState(false);
  const [copied, setCopied] = useState(false);
  const [paymentsList, setPaymentsList] = useState<any[]>([]);
  const [fetchingPayments, setFetchingPayments] = useState(false);

  // Checkout Coupons State
  const [checkoutCouponInput, setCheckoutCouponInput] = useState("");
  const [checkoutCouponError, setCheckoutCouponError] = useState("");

  useEffect(() => {
    // Get currently logged-in barbershop configuration to pre-fill where possible
    async function loadBarber() {
      try {
        const shop = await api.barbershop.me();
        if (shop) {
          setBarShop(shop);
          
          let initialValue = 49.90;
          if (shop.discountPercent) {
            initialValue = 49.90 * (1 - (shop.discountPercent / 100));
            initialValue = Math.round(initialValue * 100) / 100;
          }

          // Only overwrite name if we have it, keeping the default test name as fallback
          if (shop.name && shop.name !== "Minha Barbearia" && shop.name !== "Barbearia") {
            setFormData(prev => ({
              ...prev,
              name: shop.ownerName || shop.name,
              mobilePhone: shop.phone || prev.mobilePhone,
              planValue: initialValue
            }));
            setCreditCard(prev => ({
              ...prev,
              holderName: shop.ownerName || shop.name
            }));
          } else {
            setFormData(prev => ({
              ...prev,
              planValue: initialValue
            }));
          }
        }
      } catch (err) {
        console.warn("Could not load current barbershop details for auto-fill", err);
      }
    }
    loadBarber();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCreditCard(prev => ({ ...prev, [name]: value }));
  };

  const fillTestCard = () => {
    setCreditCard({
      holderName: formData.name || "Marcelo Almeida",
      number: "4012001037470070", // Sandbox acceptable test card for Sandbox Asaas
      expiryMonth: "12",
      expiryYear: "2030",
      ccv: "123"
    });
  };

  const loadSubscriptionPayments = async (subId: string) => {
    setFetchingPayments(true);
    try {
      const data = await api.payments.getSubscriptionPayments(subId);
      if (data && data.data) {
        setPaymentsList(data.data);
        
        // If billing style is PIX and we have payment ID, load Pix details
        const firstPayment = data.data[0];
        if (firstPayment && formData.billingType === "PIX" && !pixInfo) {
          handleFetchPix(firstPayment.id);
        }
      }
    } catch (err: any) {
      console.error("Error loading subscription payments:", err);
    } finally {
      setFetchingPayments(false);
    }
  };

  const handleFetchPix = async (paymentId: string) => {
    setLoadingPix(true);
    try {
      const pix = await api.payments.getPixQrCode(paymentId);
      setPixInfo(pix);
    } catch (err: any) {
      console.error("Error fetching PIX QR Code:", err);
    } finally {
      setLoadingPix(false);
    }
  };

  const handleCopyPix = () => {
    if (pixInfo?.payload) {
      navigator.clipboard.writeText(pixInfo.payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessData(null);
    setPixInfo(null);
    setPaymentsList([]);

    if (formData.billingType === "CREDIT_CARD") {
      if (!creditCard.number || !creditCard.expiryMonth || !creditCard.expiryYear || !creditCard.ccv) {
        setLoading(false);
        setErrorMsg("Por favor, preencha todos os dados do cartão de crédito para continuar.");
        return;
      }
    }

    try {
      const payload: any = {
        name: formData.name,
        cpfCnpj: formData.cpfCnpj.replace(/\D/g, ""), // clean non-digits if any
        mobilePhone: formData.mobilePhone.replace(/\D/g, ""),
        billingType: formData.billingType,
        value: formData.planValue,
        description: `Assinatura ${formData.planName} - BarberTool`,
      };

      if (formData.billingType === "CREDIT_CARD") {
        payload.creditCard = {
          holderName: creditCard.holderName || formData.name,
          number: creditCard.number.replace(/\D/g, ""),
          expiryMonth: creditCard.expiryMonth.replace(/\D/g, ""),
          expiryYear: creditCard.expiryYear.replace(/\D/g, ""),
          ccv: creditCard.ccv.replace(/\D/g, "")
        };
        // Holder info duplicates name & cpfCnpj by safety
        payload.creditCardHolderInfo = {
          name: creditCard.holderName || formData.name,
          cpfCnpj: formData.cpfCnpj.replace(/\D/g, ""),
          phone: formData.mobilePhone.replace(/\D/g, "")
        };
      }

      const result = await api.payments.createSubscription(payload);

      setSuccessData(result);

      // If immediate payment is returned
      if (result.payment) {
        setPaymentsList([result.payment]);
        if (formData.billingType === "PIX") {
          await handleFetchPix(result.payment.id);
        }
      } else if (result.subscriptionId) {
        // Asaas takes a brief moment sometimes, load payments on demand
        await loadSubscriptionPayments(result.subscriptionId);
      }
    } catch (err: any) {
      console.error("Checkout failed:", err);
      setErrorMsg(err.message || "Erro para criar sua assinatura. Verifique os dados inseridos e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 font-sans text-neutral-800">
      {/* Header Bar */}
      <header className="bg-white border-b border-neutral-100 py-4 px-6 md:px-12 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button 
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors font-medium text-sm"
          >
            <ArrowLeft size={16} />
            Voltar para as Configurações
          </button>
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-emerald-500 w-5 h-5" />
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">Ambiente Seguro</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <AnimatePresence mode="wait">
          {!successData ? (
            <motion.div
              key="checkout-form"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 md:grid-cols-5 gap-8"
            >
              {/* Form Side */}
              <div className="md:col-span-3 bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Finalizar Assinatura</h1>
                  <p className="text-neutral-400 text-xs mt-1">Preencha os dados abaixo para gerar sua fatura e ativar o plano.</p>
                </div>

                {errorMsg && (
                  <div className="p-4 bg-red-50 border border-red-100 text-red-700 text-xs rounded-2xl flex items-center gap-2">
                    <Info size={16} className="shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Test Data Notification */}
                  <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-100 text-xs text-neutral-500 flex gap-3">
                    <CheckCircle size={16} className="text-neutral-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-neutral-700 mb-0.5">Dados de Teste Sugeridos:</p>
                      <p>Preenchemos automaticamente com dados válidos de simulação para facilitar seu teste do Sandbox Asaas.</p>
                    </div>
                  </div>

                  {/* Nome Completo */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider block">
                      Nome Completo / Razão Social
                    </label>
                    <div className="relative">
                      <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 bg-neutral-50/80 border border-neutral-200 rounded-xl focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 focus:outline-none transition-all text-sm"
                        placeholder="Nome como consta no CPF/CNPJ"
                      />
                    </div>
                  </div>

                  {/* CPF / CNPJ */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider block">
                      CPF ou CNPJ
                    </label>
                    <div className="relative">
                      <FileText size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                      <input
                        type="text"
                        name="cpfCnpj"
                        required
                        value={formData.cpfCnpj}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 bg-neutral-50/80 border border-neutral-200 rounded-xl focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 focus:outline-none transition-all text-sm"
                        placeholder="Apenas números"
                      />
                    </div>
                  </div>

                  {/* Telefone Celular */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider block">
                      Telefone Celular
                    </label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                      <input
                        type="text"
                        name="mobilePhone"
                        required
                        value={formData.mobilePhone}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 bg-neutral-50/80 border border-neutral-200 rounded-xl focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 focus:outline-none transition-all text-sm"
                        placeholder="Ex: 4799376637"
                      />
                    </div>
                  </div>

                  {/* Forma de Pagamento */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider block">
                      Forma de Pagamento da Assinatura
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <label className={`p-4 rounded-2xl border text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 ${
                        formData.billingType === "BOLETO" 
                          ? "border-neutral-900 bg-neutral-900 text-white shadow-md" 
                          : "border-neutral-200 bg-neutral-50/50 hover:bg-neutral-100/50 text-neutral-700"
                      }`}>
                        <input
                          type="radio"
                          name="billingType"
                          value="BOLETO"
                          checked={formData.billingType === "BOLETO"}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        <FileText size={18} />
                        <span className="text-xs font-bold">Boleto Bancário</span>
                      </label>

                      <label className={`p-4 rounded-2xl border text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 ${
                        formData.billingType === "PIX" 
                          ? "border-neutral-900 bg-neutral-900 text-white shadow-md" 
                          : "border-neutral-200 bg-neutral-50/50 hover:bg-neutral-100/50 text-neutral-700"
                      }`}>
                        <input
                          type="radio"
                          name="billingType"
                          value="PIX"
                          checked={formData.billingType === "PIX"}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        <QrCode size={18} />
                        <span className="text-xs font-bold">Pix Instantâneo</span>
                      </label>

                      <label className={`p-4 rounded-2xl border text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 ${
                        formData.billingType === "CREDIT_CARD" 
                          ? "border-neutral-900 bg-neutral-900 text-white shadow-md" 
                          : "border-neutral-200 bg-neutral-50/50 hover:bg-neutral-100/50 text-neutral-700"
                      }`}>
                        <input
                          type="radio"
                          name="billingType"
                          value="CREDIT_CARD"
                          checked={formData.billingType === "CREDIT_CARD"}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        <CreditCard size={18} />
                        <span className="text-xs font-bold">Cartão de Crédito</span>
                      </label>
                    </div>
                  </div>

                  {/* Credit Card inputs */}
                  {formData.billingType === "CREDIT_CARD" && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-5 border border-neutral-100 rounded-2xl bg-neutral-50/50 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider block">
                          Dados do Cartão de Crédito
                        </span>
                        <button
                          type="button"
                          onClick={fillTestCard}
                          className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-[10px] rounded-lg transition-colors flex items-center gap-1"
                        >
                          <RefreshCw size={10} />
                          Usar Cartão de Teste
                        </button>
                      </div>

                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block font-medium">Nome no Cartão</label>
                          <input
                            type="text"
                            name="holderName"
                            required
                            value={creditCard.holderName}
                            onChange={handleCardChange}
                            placeholder="MARCELO ALMEIDA"
                            className="w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-xl focus:border-neutral-900 focus:outline-none text-xs transition-colors"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block font-medium">Número do Cartão</label>
                          <input
                            type="text"
                            name="number"
                            required
                            maxLength={19}
                            value={creditCard.number}
                            onChange={handleCardChange}
                            placeholder="4012 0010 3747 0070"
                            className="w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-xl focus:border-neutral-900 focus:outline-none text-xs transition-colors font-mono"
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block font-medium">Mês (MM)</label>
                            <input
                              type="text"
                              name="expiryMonth"
                              required
                              maxLength={2}
                              value={creditCard.expiryMonth}
                              onChange={handleCardChange}
                              placeholder="12"
                              className="w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-xl text-center focus:border-neutral-900 focus:outline-none text-xs transition-colors font-mono"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block font-medium">Ano (AAAA)</label>
                            <input
                              type="text"
                              name="expiryYear"
                              required
                              maxLength={4}
                              value={creditCard.expiryYear}
                              onChange={handleCardChange}
                              placeholder="2030"
                              className="w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-xl text-center focus:border-neutral-900 focus:outline-none text-xs transition-colors font-mono"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block font-medium">Cód. (CVV)</label>
                            <input
                              type="text"
                              name="ccv"
                              required
                              maxLength={4}
                              value={creditCard.ccv}
                              onChange={handleCardChange}
                              placeholder="123"
                              className="w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-xl text-center focus:border-neutral-900 focus:outline-none text-xs transition-colors font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 rounded-2xl font-bold bg-neutral-900 hover:bg-neutral-800 text-white flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 transition-all text-sm mt-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin text-white" />
                        Aguarde, processando assinatura...
                      </>
                    ) : (
                      <>
                        <Zap size={16} className="fill-current" />
                        Criar Assinatura ({formData.planValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/mês)
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Plans / Details Summary Side */}
              <div className="md:col-span-2 space-y-6">
                <div className="bg-neutral-900 text-white p-7 rounded-3xl shadow-sm space-y-6">
                  <div>
                    <span className="px-2.5 py-1 text-[10px] uppercase font-bold tracking-widest bg-yellow-500/20 text-yellow-500 rounded-full">
                      Plano Premium
                    </span>
                    <h3 className="text-lg font-bold mt-2">Plano Premium Completo</h3>
                    <p className="text-neutral-400 text-xs">Acesso total e ilimitado para alavancar a gestão de sua barbearia.</p>
                  </div>

                  {/* Plan Features */}
                  <div className="space-y-2 bg-white/5 p-4 rounded-2xl text-xs border border-white/10">
                    <p className="font-bold text-neutral-300 text-[10px] uppercase tracking-wider mb-1.5">O QUE ESTÁ INTEGRADO:</p>
                    <div className="flex items-center gap-2 text-neutral-300">
                      <Check size={14} className="text-emerald-500" />
                      <span>Agendamentos Ilimitados</span>
                    </div>
                    <div className="flex items-center gap-2 text-neutral-300">
                      <Check size={14} className="text-emerald-500" />
                      <span>Profissionais ilimitados</span>
                    </div>
                    <div className="flex items-center gap-2 text-neutral-300">
                      <Check size={14} className="text-emerald-500" />
                      <span>Painel de Indicadores Avançados</span>
                    </div>
                    <div className="flex items-center gap-2 text-neutral-300">
                      <Check size={14} className="text-emerald-500" />
                      <span>Envio automatizado de lembretes</span>
                    </div>
                  </div>

                  <div className="border-t border-neutral-800 pt-4 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-neutral-400">Plano Selecionado:</span>
                      <span className="font-medium text-neutral-200 font-sans">Plano Premium</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-neutral-400">Ciclo de Cobrança:</span>
                      <span className="font-medium text-neutral-200 font-sans">Mensal</span>
                    </div>

                    {bar_shop?.appliedCoupon && (
                      <div className="flex justify-between text-xs font-sans text-emerald-400 border-t border-neutral-800/55 pt-1.5 mt-1.5">
                        <span>Cupom Ativo:</span>
                        <span className="font-bold uppercase tracking-wider font-mono bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded text-[10px]">
                          {bar_shop.appliedCoupon} (-{bar_shop.discountPercent}%)
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between pt-1 font-bold border-t border-neutral-800 mt-2">
                      <span className="text-white text-xs font-sans">Valor Recorrente:</span>
                      {bar_shop?.appliedCoupon ? (
                        <span className="text-white text-sm font-sans flex items-center gap-1.5">
                          <span className="line-through text-neutral-500 text-xs text-right block">R$ 49,90</span>
                          <span className="text-emerald-400 font-bold">{formData.planValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/mês</span>
                        </span>
                      ) : (
                        <span className="text-white text-sm font-sans">
                          R$ 49,90/mês
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Coupon component for checkout */}
                <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm space-y-3">
                  <h4 className="font-bold text-xs text-neutral-800 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                    <Tag className="text-neutral-500 w-4 h-4" />
                    Cupom de Desconto
                  </h4>
                  
                  {bar_shop?.appliedCoupon ? (
                    <div className="bg-emerald-50 text-emerald-800 p-3.5 rounded-2xl text-xs border border-emerald-100 flex items-center justify-between font-sans">
                      <div className="space-y-0.5 flex-grow">
                        <span className="font-bold font-mono tracking-wider bg-emerald-100 px-1.5 py-0.5 rounded text-[11px] text-emerald-950 uppercase">
                          {bar_shop.appliedCoupon}
                        </span>
                        <p className="font-semibold text-[11px] text-emerald-800 mt-1">
                          {bar_shop.discountPercent}% de desconto aplicado!
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const updatedShop = await api.barbershop.update({ couponCode: null });
                            setBarShop(updatedShop);
                            setFormData(prev => ({ ...prev, planValue: 49.90 }));
                          } catch (err: any) {
                            console.error("Failed to remove coupon:", err);
                          }
                        }}
                        className="text-xs text-red-600 hover:text-red-700 font-extrabold hover:underline"
                      >
                        Remover
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Digite seu cupom"
                          value={checkoutCouponInput}
                          onChange={(e) => {
                            setCheckoutCouponInput(e.target.value);
                            setCheckoutCouponError("");
                          }}
                          className="flex-grow px-3 py-2 border border-neutral-200 bg-neutral-50 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-900 text-xs uppercase tracking-wider font-mono font-semibold"
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            if (!checkoutCouponInput.trim()) return;
                            try {
                              const upper = checkoutCouponInput.trim().toUpperCase();
                              const updatedShop = await api.barbershop.update({ couponCode: upper });
                              setBarShop(updatedShop);
                              
                              let premiumPrice = 49.90;
                              if (updatedShop.discountPercent) {
                                premiumPrice = premiumPrice * (1 - (updatedShop.discountPercent / 100));
                                premiumPrice = Math.round(premiumPrice * 100) / 100;
                              }
                              setFormData(prev => ({ ...prev, planValue: premiumPrice }));
                              setCheckoutCouponInput("");
                            } catch (err: any) {
                              setCheckoutCouponError(err.message || "Cupom inválido.");
                            }
                          }}
                          className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold rounded-xl transition-colors shrink-0"
                        >
                          Aplicar
                        </button>
                      </div>
                      {checkoutCouponError && (
                        <p className="text-[10px] font-bold text-red-500 font-sans">{checkoutCouponError}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Secure Trust Indicators */}
                <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm space-y-4 text-xs text-neutral-500">
                  <div className="flex gap-3">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                      <CreditCard size={16} />
                    </div>
                    <div>
                      <h4 className="font-bold text-neutral-800">Sem Multas ou Fidelidades</h4>
                      <p className="mt-0.5 leading-relaxed">Sua assinatura dura o tempo contratado. Cancele e altere planos quando desejar, diretamente pelo painel.</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="checkout-success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white p-10 rounded-4xl border border-neutral-100 shadow-lg text-center max-w-xl mx-auto space-y-6"
            >
              <div className="mx-auto w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                <CheckCircle size={32} />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">Assinatura Criada com Sucesso!</h2>
                <p className="text-neutral-400 text-xs">
                  Sua assinatura está ativa em período de teste. Efetue o primeiro pagamento para homologar definitivamente.
                </p>
              </div>

              {/* Response Subscription Data */}
              <div className="bg-neutral-50/50 p-5 rounded-2xl text-left text-xs border border-neutral-100 space-y-2.5">
                <div className="flex justify-between text-neutral-500 border-b border-neutral-100 pb-2">
                  <span>ID da Assinatura:</span>
                  <span className="font-bold text-neutral-800">{successData.subscriptionId}</span>
                </div>
                <div className="flex justify-between text-neutral-500 border-b border-neutral-100 pb-2">
                  <span>ID do Cliente:</span>
                  <span className="font-bold text-neutral-800">{successData.customerId}</span>
                </div>
                <div className="flex justify-between text-neutral-500">
                  <span>Plan/Valor:</span>
                  <span className="font-bold text-neutral-800">
                    {formData.planName} (R$ 49,90/mês)
                  </span>
                </div>
              </div>

              {/* CREDIT_CARD success message if selected */}
              {formData.billingType === "CREDIT_CARD" && (
                <div className="p-6 border border-neutral-100 rounded-3xl bg-emerald-50/20 space-y-3 flex flex-col items-center text-center">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-sm">
                    <ShieldCheck className="text-emerald-600" size={18} />
                    <span>Pagamento Autorizado via Cartão</span>
                  </div>
                  <p className="text-xs text-neutral-600 max-w-sm">
                    Sua assinatura foi criada e o primeiro ciclo de faturamento foi cadastrado com sucesso no cartão final <span className="font-mono font-bold text-neutral-800">{creditCard.number.slice(-4) || "0070"}</span>.
                  </p>
                  <p className="text-[10px] text-neutral-400">
                    O status da sua conta foi atualizado para Premium e todos os recursos de gestão avançada já estão disponíveis.
                  </p>
                </div>
              )}

              {/* PIX instructions if selected */}
              {formData.billingType === "PIX" && (
                <div className="p-6 border border-neutral-100 rounded-3xl bg-neutral-50/30 space-y-4">
                  <div className="flex items-center justify-center gap-1.5 text-neutral-800 font-bold text-sm">
                    <QrCode size={18} />
                    <span>Pague Via PIX QR Code</span>
                  </div>

                  {loadingPix ? (
                    <div className="flex flex-col items-center justify-center py-6 gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-neutral-800" />
                      <span className="text-[10px] text-neutral-400">Gerando QRCode do PIX...</span>
                    </div>
                  ) : pixInfo ? (
                    <div className="flex flex-col items-center gap-4">
                      {pixInfo.encodedImage && (
                        <div className="bg-white p-2 border border-neutral-100 rounded-2xl shadow-sm">
                          <img 
                            src={`data:image/png;base64,${pixInfo.encodedImage}`} 
                            alt="Pix QR Code" 
                            className="w-44 h-44 object-contain"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}
                      
                      <div className="w-full space-y-1.5 text-left">
                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Código Copia e Cola:</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            readOnly
                            value={pixInfo.payload || ""}
                            className="w-full bg-white border border-neutral-200 text-xs rounded-xl px-3 py-2 text-neutral-600 focus:outline-none select-all font-mono overflow-ellipsis"
                          />
                          <button
                            onClick={handleCopyPix}
                            className={`px-3 py-2 text-xs font-bold rounded-xl flex items-center gap-1 hover:scale-[1.02] active:scale-[0.98] transition-all shrink-0 ${
                              copied ? "bg-emerald-600 text-white" : "bg-neutral-900 text-white"
                            }`}
                          >
                            <Copy size={12} />
                            {copied ? "Copiado!" : "Copiar"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-neutral-400">Pix temporariamente indisponível. Recarregue a página ou confira sua caixa de e-mail.</p>
                  )}
                </div>
              )}

              {/* BOLETO instructions if selected */}
              {formData.billingType === "BOLETO" && paymentsList.length > 0 && paymentsList[0].bankSlipUrl && (
                <div className="p-6 border border-neutral-100 rounded-3xl bg-neutral-50/30 space-y-4 flex flex-col items-center">
                  <div className="flex items-center gap-1.5 text-neutral-800 font-bold text-sm">
                    <FileText size={18} />
                    <span>Faturamento Via Boleto Bancário</span>
                  </div>
                  <p className="text-xs text-neutral-500 max-w-sm">
                    Seu boleto já foi gerado de forma totalmente digital. Clique no botão abaixo para abrir a guia de visualização e realizar o pagamento.
                  </p>
                  <a
                    href={paymentsList[0].bankSlipUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 border border-neutral-900 hover:bg-neutral-800 text-white hover:scale-[1.02] active:scale-[0.98] transition-all font-bold text-xs rounded-xl"
                  >
                    Visualizar Boleto Bancário
                  </a>
                </div>
              )}

              {/* Fallback load action if Asaas delay */}
              {formData.billingType !== "CREDIT_CARD" && paymentsList.length === 0 && (
                <div className="p-4 bg-orange-50 border border-orange-100 text-orange-800 text-xs rounded-2xl flex flex-col gap-2 items-center">
                  <div className="flex items-center gap-2">
                    <Info size={14} />
                    <span className="font-semibold">Buscando primeira cobrança da assinatura...</span>
                  </div>
                  <button
                    onClick={() => loadSubscriptionPayments(successData.subscriptionId)}
                    disabled={fetchingPayments}
                    className="flex items-center gap-1.5 px-3 py-1 bg-white border border-orange-200 rounded-lg hover:bg-orange-100 font-bold text-[10px] text-orange-900 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw size={10} className={fetchingPayments ? "animate-spin" : ""} />
                    Consultar Atualizações
                  </button>
                </div>
              )}

              <div className="pt-4 border-t border-neutral-100 flex flex-col gap-2">
                <button
                  onClick={() => navigate("/dashboard")}
                  className="w-full py-3 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 font-bold rounded-xl text-xs transition-all"
                >
                  Ir para minhas Configurações
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
