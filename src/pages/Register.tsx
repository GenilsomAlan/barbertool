import React, { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.ts";
import { Scissors, Mail, Lock, User, Building, Phone, Loader2, Tag, CheckCircle2, AlertCircle } from "lucide-react";
import { motion } from "motion/react";

export default function Register({ onRegister }: { onRegister: (token: string) => void }) {
  const [step, setStep] = useState<"form" | "verify">("form");
  const [formData, setFormData] = useState({
    barbershopName: "",
    adminName: "",
    email: "",
    password: "",
    phone: "",
    coupon: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Email confirmation code states
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationWarning, setVerificationWarning] = useState("");
  const [verificationMessage, setVerificationMessage] = useState("");

  // Coupon States
  const [couponInput, setCouponInput] = useState("");
  const [couponStatus, setCouponStatus] = useState<"idle" | "checking" | "valid" | "invalid">("idle");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");

  const handleVerifyCoupon = async (codeToVerify: string) => {
    const cleanCode = codeToVerify.trim().toUpperCase();
    if (!cleanCode) {
      setCouponStatus("idle");
      setCouponDiscount(0);
      setCouponError("");
      setCouponSuccess("");
      setFormData(prev => ({ ...prev, coupon: "" }));
      return;
    }

    setCouponStatus("checking");
    setCouponError("");
    setCouponSuccess("");

    try {
      const response = await api.auth.verifyCoupon(cleanCode);
      if (response && response.valid) {
        setCouponStatus("valid");
        setCouponDiscount(response.discountPercent);
        setCouponSuccess(`Cupom ativo! Você ganhou ${response.discountPercent}% de desconto permanente nos planos Premium.`);
        setFormData(prev => ({ ...prev, coupon: response.code }));
      } else {
        setCouponStatus("invalid");
        setCouponDiscount(0);
        setCouponError("Cupom não encontrado ou expirado.");
        setFormData(prev => ({ ...prev, coupon: "" }));
      }
    } catch (err: any) {
      setCouponStatus("invalid");
      setCouponDiscount(0);
      setCouponError("Cupom inválido ou expirado.");
      setFormData(prev => ({ ...prev, coupon: "" }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRequestVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setVerificationWarning("");
    setVerificationMessage("");

    try {
      const response = await api.auth.sendRegisterVerificationCode(formData.email);
      if (response.warning) {
        setVerificationWarning(response.warning);
        if (response.code) {
          setVerificationCode(response.code); // Prefills code for dev mode testing
        }
      }
      setVerificationMessage(response.message || "Enviamos um código de confirmação de 6 dígitos para o seu e-mail.");
      setStep("verify");
    } catch (err: any) {
      setError(err.message || "Erro ao solicitar o código de verificação.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const data = await api.auth.register({
        ...formData,
        code: verificationCode,
      });
      onRegister(data.token);
    } catch (err: any) {
      setError(err.message || "Código incorreto ou expirado. Verifique os dígitos informados.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <motion.div 
        key={step}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="max-w-xl w-full"
      >
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-neutral-100">
          
          {step === "form" ? (
            <>
              <div className="flex flex-col items-center mb-8">
                <div className="w-12 h-12 bg-neutral-900 rounded-2xl flex items-center justify-center mb-4">
                  <Scissors className="text-white w-6 h-6" />
                </div>
                <h1 className="text-2xl font-semibold text-neutral-900">Comece seu BarberTool</h1>
                <p className="text-neutral-500 text-sm mt-1">Crie sua barbearia e gerencie seus agendamentos</p>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-6 border border-red-100 text-center font-sans">
                  {error}
                </div>
              )}

              <form onSubmit={handleRequestVerification} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                      Nome da Barbearia
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
                      <input
                        name="barbershopName"
                        required
                        value={formData.barbershopName}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-all font-sans text-sm"
                        placeholder="Ex: Barber Alpha"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                      Seu Nome
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
                      <input
                        name="adminName"
                        required
                        value={formData.adminName}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-all font-sans text-sm"
                        placeholder="Seu nome completo"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    E-mail Profissional
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
                    <input
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-all font-sans text-sm"
                      placeholder="admin@barbearia.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                      Telefone
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
                      <input
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-all font-sans text-sm"
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                      Senha
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
                      <input
                        name="password"
                        type="password"
                        required
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-all font-sans text-sm"
                        placeholder="Mínimo 6 caracteres"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-neutral-100 pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-1.5 font-sans">
                      <Tag className="w-4 h-4 text-neutral-400" />
                      Cupom de Desconto (Opcional)
                    </label>
                    <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider font-sans">Planos de Assinatura</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <div className="relative flex-grow">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => {
                          setCouponInput(e.target.value);
                          if (couponStatus !== "idle") {
                            setCouponStatus("idle");
                            setCouponDiscount(0);
                            setCouponError("");
                            setCouponSuccess("");
                            setFormData(prev => ({ ...prev, coupon: "" }));
                          }
                        }}
                        placeholder="Digite seu cupom"
                        className="w-full px-4 py-3 font-mono text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-all uppercase tracking-widest"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleVerifyCoupon(couponInput)}
                      disabled={couponStatus === "checking" || !couponInput.trim()}
                      className="px-5 bg-neutral-900 text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-sans cursor-pointer"
                    >
                      {couponStatus === "checking" ? "Validando..." : "Aplicar"}
                    </button>
                  </div>

                  {couponStatus === "valid" && (
                    <div className="bg-emerald-50 text-emerald-800 p-3.5 rounded-xl text-xs border border-emerald-100 flex items-start gap-2 font-sans leading-relaxed">
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                      <p className="font-medium">{couponSuccess}</p>
                    </div>
                  )}

                  {couponStatus === "invalid" && (
                    <div className="bg-red-50 text-red-700 p-3.5 rounded-xl text-xs border border-red-100 flex items-start gap-2 font-sans leading-relaxed">
                      <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                      <p className="font-medium">{couponError}</p>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-neutral-900 text-white py-4 rounded-xl font-medium hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors font-sans text-sm cursor-pointer"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Prosseguir e Enviar Código"
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="flex flex-col items-center mb-8">
                <div className="w-12 h-12 bg-neutral-100 rounded-2xl flex items-center justify-center mb-4">
                  <Mail className="text-neutral-900 w-6 h-6" />
                </div>
                <h1 className="text-2xl font-semibold text-neutral-900">Verifique seu E-mail</h1>
                <p className="text-neutral-500 text-sm mt-1 text-center font-sans leading-relaxed">
                  Insira o código de 6 dígitos enviado para o e-mail: <br />
                  <strong className="text-neutral-900 font-bold break-all">{formData.email}</strong>
                </p>
              </div>

              {verificationMessage && (
                <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl text-xs mb-4 border border-emerald-100 flex items-start gap-2 leading-relaxed font-sans">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  <p className="font-semibold">{verificationMessage}</p>
                </div>
              )}

              {verificationWarning && (
                <div className="bg-amber-50 text-amber-800 p-4 rounded-xl text-xs mb-4 border border-amber-100 space-y-2 leading-relaxed font-sans">
                  <p className="font-bold flex items-center gap-1.5 text-amber-900">
                    <AlertCircle size={14} className="text-amber-600 shrink-0" />
                    Ambiente Local / Demonstração
                  </p>
                  <p>{verificationWarning}</p>
                  {verificationCode && (
                    <div className="bg-white/80 p-2.5 rounded-lg border border-amber-200 flex items-center justify-between">
                      <span className="text-neutral-500 uppercase text-[10px] font-bold tracking-wider">Código de Ativação:</span>
                      <strong className="font-mono text-sm tracking-widest text-neutral-950 font-black">{verificationCode}</strong>
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-6 border border-red-100 text-center font-sans animate-shake">
                  {error}
                </div>
              )}

              <form onSubmit={handleFinalRegister} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 text-center font-sans">
                    Código de Confirmação (6 dígitos)
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-900 transition-all font-mono tracking-widest text-center text-lg font-black text-neutral-900"
                    placeholder="000000"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-neutral-900 text-white py-3.5 rounded-xl font-medium hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors font-sans text-sm mt-4 cursor-pointer"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Confirmar Código e Ativar Conta"
                  )}
                </button>
              </form>

              <div className="mt-8 text-center flex flex-col gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    setIsLoading(true);
                    setError("");
                    try {
                      const response = await api.auth.sendRegisterVerificationCode(formData.email);
                      if (response.warning) {
                        setVerificationWarning(response.warning);
                        if (response.code) {
                          setVerificationCode(response.code);
                        }
                      }
                      setVerificationMessage("Um novo código de verificação foi enviado para seu e-mail.");
                    } catch (err: any) {
                      setError(err.message || "Erro ao reenviar.");
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  className="text-xs font-bold text-neutral-500 hover:text-neutral-900 transition-colors uppercase tracking-widest font-sans cursor-pointer"
                >
                  Reenviar código de verificação
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep("form");
                    setError("");
                    setVerificationWarning("");
                    setVerificationMessage("");
                  }}
                  className="inline-flex items-center gap-2 justify-center text-xs font-extrabold text-neutral-400 hover:text-neutral-800 transition-colors uppercase tracking-widest font-sans mt-3 cursor-pointer"
                >
                  Alterar dados de cadastro
                </button>
              </div>
            </>
          )}

          <p className="mt-8 text-center text-sm text-neutral-500 font-sans">
            Dono de barbearia já cadastrado?{" "}
            <Link to="/login" className="text-neutral-900 font-semibold hover:underline">
              Fazer login
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
