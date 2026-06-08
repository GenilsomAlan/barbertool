import React, { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.ts";
import { Scissors, Mail, Lock, Loader2, ArrowLeft, CheckCircle2, AlertTriangle, Key } from "lucide-react";
import { motion } from "motion/react";

export default function Login({ onLogin }: { onLogin: (token: string) => void }) {
  const [view, setView] = useState<"login" | "forgot" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Recover password states
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [recoveryWarning, setRecoveryWarning] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const data = await api.auth.login({ email, password });
      onLogin(data.token);
    } catch (err: any) {
      setError(err.message || "Erro ao realizar login. Verifique suas credenciais.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setRecoveryWarning("");
    setSuccessMessage("");

    try {
      const response = await api.auth.forgotPassword(recoveryEmail);
      if (response.warning) {
        setRecoveryWarning(response.warning);
        if (response.code) {
          setRecoveryCode(response.code); // Prefills code for dev mode testing
        }
      }
      setSuccessMessage(response.message || "Código enviado! Insira-o abaixo junto com sua nova senha.");
      setView("reset");
    } catch (err: any) {
      setError(err.message || "E-mail não cadastrado no sistema.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await api.auth.resetPassword({
        email: recoveryEmail,
        code: recoveryCode,
        password: newPassword,
      });
      setSuccessMessage(response.message || "Senha redefinida com sucesso! Divirta-se.");
      setView("login");
      setEmail(recoveryEmail);
      setPassword("");
    } catch (err: any) {
      setError(err.message || "Erro ao redefinir. Verifique se o código está correto e no prazo de validade.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <motion.div 
        key={view}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        transition={{ duration: 0.25 }}
        className="max-w-md w-full"
      >
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-neutral-100">
          
          {/* ----- VIEW: LOGIN ----- */}
          {view === "login" && (
            <>
              <div className="flex flex-col items-center mb-8">
                <div className="w-12 h-12 bg-neutral-900 rounded-2xl flex items-center justify-center mb-4">
                  <Scissors className="text-white w-6 h-6" />
                </div>
                <h1 className="text-2xl font-semibold text-neutral-900">Bem-vindo de volta</h1>
                <p className="text-neutral-500 text-sm mt-1">Acesse sua conta BarberTool</p>
              </div>

              {successMessage && (
                <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl text-xs mb-6 border border-emerald-150 flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  <p>{successMessage}</p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-6 border border-red-100">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                    E-mail
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-900 transition-all text-sm text-neutral-800"
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                      Senha
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setView("forgot");
                        setError("");
                        setSuccessMessage("");
                        setRecoveryEmail(email);
                      }}
                      className="text-xs text-neutral-500 hover:text-neutral-900 font-bold"
                    >
                      Esqueceu a senha?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-900 transition-all text-sm text-neutral-800"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-neutral-900 text-white py-3 rounded-xl font-medium hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors font-sans text-sm mt-2"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Entrar"
                  )}
                </button>
              </form>

              <p className="mt-8 text-center text-sm text-neutral-500">
                Não tem uma barbearia?{" "}
                <Link to="/register" className="text-neutral-900 font-semibold hover:underline">
                  Crie agora
                </Link>
              </p>
            </>
          )}

          {/* ----- VIEW: FORGOT PASSWORD ----- */}
          {view === "forgot" && (
            <>
              <div className="flex flex-col items-center mb-8">
                <div className="w-12 h-12 bg-neutral-100 rounded-2xl flex items-center justify-center mb-4">
                  <Key className="text-neutral-900 w-6 h-6" />
                </div>
                <h1 className="text-2xl font-semibold text-neutral-900">Recuperar conta</h1>
                <p className="text-neutral-500 text-sm mt-1 text-center font-sans">
                  Insira o seu e-mail cadastrado para enviarmos um código de verificação seguro de 6 dígitos.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-6 border border-red-100">
                  {error}
                </div>
              )}

              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                    E-mail de Cadastro
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
                    <input
                      type="email"
                      required
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-900 transition-all text-sm text-neutral-800"
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-neutral-900 text-white py-3 rounded-xl font-medium hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors font-sans text-sm mt-2"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Enviar Código de Recuperação"
                  )}
                </button>
              </form>

              <div className="mt-8 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setView("login");
                    setError("");
                    setSuccessMessage("");
                  }}
                  className="inline-flex items-center gap-2 text-xs font-bold text-neutral-500 hover:text-neutral-900 transition-colors uppercase tracking-widest font-sans"
                >
                  <ArrowLeft size={14} />
                  Voltar para o Login
                </button>
              </div>
            </>
          )}

          {/* ----- VIEW: RESET PASSWORD ----- */}
          {view === "reset" && (
            <>
              <div className="flex flex-col items-center mb-8">
                <div className="w-12 h-12 bg-neutral-100 rounded-2xl flex items-center justify-center mb-4">
                  <Lock className="text-neutral-900 w-6 h-6" />
                </div>
                <h1 className="text-2xl font-semibold text-neutral-900">Redefinir Senha</h1>
                <p className="text-neutral-500 text-sm mt-1 text-center font-sans">
                  Siga os passos e redefina suas credenciais com segurança.
                </p>
              </div>

              {successMessage && (
                <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl text-xs mb-4 border border-emerald-150 flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  <p>{successMessage}</p>
                </div>
              )}

              {recoveryWarning && (
                <div className="bg-amber-50 text-amber-800 p-4 rounded-xl text-xs mb-4 border border-amber-100 space-y-2 leading-relaxed font-sans">
                  <p className="font-bold flex items-center gap-1.5">
                    <AlertTriangle size={14} className="text-amber-600" /> 
                    Aviso do Sistema (Ambiente Local/Testes)
                  </p>
                  <p>{recoveryWarning}</p>
                  {recoveryCode && (
                    <div className="bg-white/80 p-2.5 rounded-lg border border-amber-200 flex items-center justify-between">
                      <span className="text-neutral-500 uppercase text-[10px] font-bold tracking-wider">Código gerado:</span>
                      <strong className="font-mono text-sm tracking-widest text-neutral-950 font-black">{recoveryCode}</strong>
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-6 border border-red-100 font-sans">
                  {error}
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                    Código de Recuperação (6 dígitos)
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={recoveryCode}
                    onChange={(e) => setRecoveryCode(e.target.value)}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-900 transition-all font-mono tracking-widest text-center text-lg font-bold text-neutral-800"
                    placeholder="000000"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                    Nova Senha (Mínimo de 6 caracteres)
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-900 transition-all text-sm text-neutral-800 font-sans"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-neutral-900 text-white py-3 rounded-xl font-medium hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors font-sans text-sm mt-2"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Confirmar Nova Senha"
                  )}
                </button>
              </form>

              <div className="mt-8 text-center flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setView("forgot");
                    setError("");
                    setSuccessMessage("");
                  }}
                  className="text-xs font-bold text-neutral-500 hover:text-neutral-900 transition-colors uppercase tracking-widest font-sans"
                >
                  Reenviar código de verificação
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setView("login");
                    setError("");
                    setSuccessMessage("");
                  }}
                  className="inline-flex items-center gap-2 justify-center text-xs font-bold text-neutral-500 hover:text-neutral-900 transition-colors uppercase tracking-widest font-sans mt-2"
                >
                  <ArrowLeft size={14} />
                  Cancelar
                </button>
              </div>
            </>
          )}

        </div>
      </motion.div>
    </div>
  );
}
