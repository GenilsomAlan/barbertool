import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { Save, Plus, Trash2, Clock, DollarSign, Settings as SettingsIcon, Scissors, Shield, Bell, Key, ExternalLink, RefreshCw, Link2, Instagram, Facebook, Video, Image as ImageIcon, User as UserIcon, Phone, Zap, Lock } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { formatPhone, isValidPhone } from "../utils/phone";
import Assinatura from "./Assinatura";

export default function Configuracoes({ barbershop: initialBarbershop, onUpdate }: { barbershop?: any; onUpdate?: (updatedData?: any) => void }) {
  const [barbershop, setBarbershop] = useState<any>(initialBarbershop || null);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(prev => prev?.message === message ? null : prev);
    }, 4500);
  };
  const [activeSubTab, setActiveSubTab] = useState<"perfil" | "agenda" | "servicos" | "acesso" | "personalizacao" | "assinatura">("perfil");
  const [users, setUsers] = useState<any[]>([]);
  const [copiedStates, setCopiedStates] = useState<Record<string, 'idle' | 'copied'>>({});
  const [apiToken, setApiToken] = useState("");
  const [copiedToken, setCopiedToken] = useState(false);

  const copyApiToken = () => {
    navigator.clipboard.writeText(apiToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  // New User Form
  const [newUser, setNewUser] = useState({ name: "", email: "", phone: "", password: "", role: "barber" as "admin" | "barber", avatarUrl: "" });
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [changingPasswordFor, setChangingPasswordFor] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const DAYS_OF_WEEK = [
    { id: 1, label: "Seg", full: "Segunda" },
    { id: 2, label: "Ter", full: "Terça" },
    { id: 3, label: "Qua", full: "Quarta" },
    { id: 4, label: "Qui", full: "Quinta" },
    { id: 5, label: "Sex", full: "Sexta" },
    { id: 6, label: "Sáb", full: "Sábado" },
    { id: 0, label: "Dom", full: "Domingo" },
  ];

  // New Service Form
  const [newService, setNewService] = useState({ name: "", price: "", duration: "" });
  const [showAddService, setShowAddService] = useState(false);

  useEffect(() => {
    if (initialBarbershop) {
      setBarbershop(initialBarbershop);
    }
  }, [initialBarbershop]);

  useEffect(() => {
    setApiToken(localStorage.getItem("token") || "");
    Promise.all([
      api.barbershop.me(),
      api.services.list(),
      api.users.list()
    ]).then(([bData, sData, uData]) => {
      setBarbershop(bData);
      setServices(sData);
      setUsers(uData);
    })
    .catch(console.error)
    .finally(() => setLoading(false));
  }, []);

  const handleSaveProfile = async (e?: any) => {
    if (e && typeof e.preventDefault === "function") {
      e.preventDefault();
    }
    if (barbershop?.phone && !isValidPhone(barbershop.phone)) {
      showToast("Por favor, insira um WhatsApp válido para a barbearia.", "error");
      return;
    }
    setSaving(true);
    try {
      const updated = await api.barbershop.update(barbershop);
      setBarbershop(updated);
      if (onUpdate) onUpdate(updated);
      showToast("Configurações salvas com sucesso!", "success");
    } catch (err: any) {
      console.error("Failed to update barbershop profile:", err);
      showToast(err.message || "Erro ao salvar as configurações.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newService.name || !newService.price || !newService.duration) return;

    try {
      const created = await api.services.create({
        name: newService.name,
        price: Number(newService.price),
        duration: Number(newService.duration)
      });
      setServices([...services, created]);
      setNewService({ name: "", price: "", duration: "" });
      setShowAddService(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteService = async (id: string) => {
    try {
      await api.services.delete(id);
      setServices(services.filter(s => s.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover o acesso deste usuário?")) return;
    try {
      await api.users.delete(id);
      setUsers(users.filter(u => u.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email || !newUser.password) return;
    
    if (newUser.phone && !isValidPhone(newUser.phone)) {
      showToast("Por favor, insira um WhatsApp válido para o membro da equipe.", "error");
      return;
    }

    try {
      const created = await api.users.create(newUser);
      setUsers([created, ...users]);
      setNewUser({ name: "", email: "", phone: "", password: "", role: "barber", avatarUrl: "" });
      setShowAddUser(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegenerateToken = async (userId: string) => {
    if (!confirm("Isso invalidará o link atual deste barbeiro. Deseja continuar?")) return;
    try {
      const { bookingToken } = await api.users.regenerateToken(userId);
      setUsers(users.map(u => u.id === userId ? { ...u, bookingToken } : u));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSelfAccount = async () => {
    const typedConfirm = prompt(
      "Tem certeza que deseja excluir sua conta permanentemente? Esta ação NÃO PODE ser desfeita.\n\nSe você é o administrador, sua barbearia e TODOS os dados associados (serviços, agendamentos, equipe, clientes) serão apagados.\n\nPara confirmar, digite EXCLUIR no campo abaixo:"
    );

    if (typedConfirm !== "EXCLUIR") {
      if (typedConfirm !== null) {
        showToast("Confirmação incorreta. A exclusão de conta foi cancelada.", "error");
      }
      return;
    }

    try {
      setSaving(true);
      const res = await api.users.deleteMe();
      showToast(res.message || "Sua conta foi excluída com sucesso.", "success");
      
      // Clear token and redirect to home page, triggering login state teardown
      setTimeout(() => {
        localStorage.removeItem("token");
        window.location.href = "/";
      }, 2000);
    } catch (err: any) {
      console.error("Falha ao se autoexcluir:", err);
      showToast(err.message || "Erro ao tentar excluir sua conta.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      callback(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const copyBookingLink = (bookingToken: string, userId: string) => {
    const url = `${window.location.origin}/book/${bookingToken}`;
    navigator.clipboard.writeText(url);
    setCopiedStates({ ...copiedStates, [userId]: 'copied' });
    setTimeout(() => {
      setCopiedStates(prev => ({ ...prev, [userId]: 'idle' }));
    }, 2000);
  };

  const handleUpdateUser = async (userId: string, data: any) => {
    try {
      const updated = await api.users.update(userId, data);
      setUsers(users.map(u => u.id === userId ? { ...u, ...updated } : u));
      setEditingUser(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!changingPasswordFor || !newPassword) return;

    try {
      await api.users.updatePassword(changingPasswordFor, newPassword);
      setChangingPasswordFor(null);
      setNewPassword("");
      showToast("Senha alterada com sucesso!", "success");
    } catch (err) {
      console.error(err);
      showToast("Falha ao alterar senha.", "error");
    }
  };

  const primaryColor = barbershop?.primaryColor || "#171717";
  const secondaryColor = barbershop?.secondaryColor || "#ffffff";
  const isEligibleForNewUser = barbershop?.subscriptionStatus === "premium" || barbershop?.subscriptionStatus === "trial" || barbershop?.subscriptionStatus === "active";

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-2">
        <SettingsIcon className="w-6 h-6 text-neutral-300 animate-spin" />
        <span className="text-sm text-neutral-400">Carregando configurações...</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-12">
      {barbershop?.subscriptionStatus === 'free_restricted' && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-neutral-900 p-6 rounded-3xl text-white flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10">
             <Zap size={100} />
          </div>
          <div className="flex items-center gap-5 relative z-10">
             <div className="w-14 h-14 bg-neutral-800 rounded-2xl flex items-center justify-center text-yellow-400">
                <Lock size={28} />
             </div>
             <div>
                <h4 className="text-lg font-bold">Plano Free Ativo</h4>
                <p className="text-sm opacity-60">Seu período de teste expirou. O link de agendamento público está desativado.</p>
             </div>
          </div>
          <button 
            onClick={() => {
               // Pagamento Asaas/Mercado Pago removido — stub retornando aviso de pagamento desativado
               alert("Pagamento online desativado — escolha pagamento no local ou entre em contato.");
            }}
            className="w-full md:w-auto px-8 py-4 bg-white text-neutral-900 font-bold rounded-2xl flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl relative z-10"
          >
             <Zap size={16} className="fill-neutral-900" />
             Ativar Agendamento Online
          </button>
        </motion.div>
      )}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Configurações</h1>
        <p className="text-neutral-500 text-sm">Gerencie sua unidade, serviços e preferências da conta.</p>
      </div>

      <div className="flex overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:pb-0 gap-1 p-1 bg-neutral-100 rounded-xl w-full sm:w-fit custom-scrollbar scrollbar-hide">
        <button
          onClick={() => setActiveSubTab("perfil")}
          className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeSubTab === "perfil" 
              ? "bg-white shadow-sm" 
              : "text-neutral-500 hover:text-neutral-700"
          }`}
          style={activeSubTab === "perfil" ? { color: primaryColor } : {}}
        >
          Perfil
        </button>
        <button
          onClick={() => setActiveSubTab("agenda")}
          className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeSubTab === "agenda" 
              ? "bg-white shadow-sm" 
              : "text-neutral-500 hover:text-neutral-700"
          }`}
          style={activeSubTab === "agenda" ? { color: primaryColor } : {}}
        >
          Agenda
        </button>
        <button
          onClick={() => setActiveSubTab("servicos")}
          className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeSubTab === "servicos" 
              ? "bg-white shadow-sm" 
              : "text-neutral-500 hover:text-neutral-700"
          }`}
          style={activeSubTab === "servicos" ? { color: primaryColor } : {}}
        >
          Serviços
        </button>
        <button
          onClick={() => setActiveSubTab("acesso")}
          className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeSubTab === "acesso" 
              ? "bg-white shadow-sm" 
              : "text-neutral-500 hover:text-neutral-700"
          }`}
          style={activeSubTab === "acesso" ? { color: primaryColor } : {}}
        >
          Acesso
        </button>
        <button
          onClick={() => setActiveSubTab("personalizacao")}
          className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeSubTab === "personalizacao" 
              ? "bg-white shadow-sm" 
              : "text-neutral-500 hover:text-neutral-700"
          }`}
          style={activeSubTab === "personalizacao" ? { color: primaryColor } : {}}
        >
          Visual
        </button>
        <button
          onClick={() => setActiveSubTab("assinatura")}
          className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeSubTab === "assinatura" 
              ? "bg-white shadow-sm" 
              : "text-neutral-500 hover:text-neutral-700"
          }`}
          style={activeSubTab === "assinatura" ? { color: primaryColor } : {}}
        >
          Assinatura
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {activeSubTab === "perfil" ? (
              <motion.div
                key="perfil"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm space-y-6"
              >
                <form onSubmit={handleSaveProfile} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-neutral-50 mb-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Logo / Imagem do Estabelecimento</label>
                        <div className="flex gap-4 items-start">
                          <div className="w-20 h-20 rounded-2xl bg-neutral-50 border border-neutral-100 flex items-center justify-center overflow-hidden shrink-0">
                            {barbershop?.logoUrl ? (
                              <img src={barbershop.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon className="text-neutral-300" size={32} />
                            )}
                          </div>
                          <div className="flex-1 space-y-1">
                            <label className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-neutral-100 text-neutral-900 rounded-xl text-sm font-bold cursor-pointer hover:bg-neutral-200 transition-all border border-neutral-200">
                              <ImageIcon size={16} />
                              Escolher Imagem
                              <input 
                                type="file" 
                                accept="image/*"
                                onChange={(e) => handleFileUpload(e, (base64) => setBarbershop({...barbershop, logoUrl: base64}))}
                                className="hidden"
                              />
                            </label>
                            <p className="text-[10px] text-neutral-400 italic text-center">Importe uma foto da sua barbearia ou logo.</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Nome da barbearia</label>
                        <input 
                          type="text" 
                          value={barbershop?.name || ""}
                          onChange={(e) => setBarbershop({...barbershop, name: e.target.value})}
                          className="w-full px-4 py-3 bg-neutral-50 border border-neutral-100 rounded-xl focus:ring-2 focus:ring-neutral-900 outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">WhatsApp Principal (Opcional)</label>
                        <div className="relative">
                          <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                          <input 
                            type="tel" 
                            placeholder="(00) 00000-0000"
                            value={barbershop?.phone || ""}
                            onChange={(e) => setBarbershop({...barbershop, phone: formatPhone(e.target.value)})}
                            className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 border border-neutral-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-neutral-900"
                          />
                        </div>
                        <p className="text-[10px] text-neutral-400 italic">Número principal para contato da barbearia.</p>
                      </div>

                      <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Redes Sociais</label>
                      
                      <div className="space-y-3">
                        <div className="relative">
                          <Instagram size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                          <input 
                            type="text" 
                            placeholder="Instagram (ex: @suabarbearia)"
                            value={barbershop?.instagram || ""}
                            onChange={(e) => setBarbershop({...barbershop, instagram: e.target.value})}
                            className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 border border-neutral-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-neutral-900"
                          />
                        </div>
                        <div className="relative">
                          <Video size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                          <input 
                            type="text" 
                            placeholder="TikTok (ex: @suabarbearia)"
                            value={barbershop?.tiktok || ""}
                            onChange={(e) => setBarbershop({...barbershop, tiktok: e.target.value})}
                            className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 border border-neutral-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-neutral-900"
                          />
                        </div>
                        <div className="relative">
                          <Facebook size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                          <input 
                            type="text" 
                            placeholder="Facebook (ex: facebook.com/sua)"
                            value={barbershop?.facebook || ""}
                            onChange={(e) => setBarbershop({...barbershop, facebook: e.target.value})}
                            className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 border border-neutral-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-neutral-900"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Domínio (Slug)</label>
                      <div className="flex">
                        <span className="inline-flex items-center px-4 rounded-l-xl border border-r-0 border-neutral-100 bg-neutral-100 text-neutral-500 text-sm">
                          barbertool.com/
                        </span>
                        <input 
                          type="text" 
                          value={barbershop?.slug || ""}
                          disabled
                          className="flex-1 w-full px-4 py-3 bg-neutral-100 border border-neutral-100 rounded-r-xl text-neutral-400 outline-none cursor-not-allowed"
                        />
                      </div>
                      <p className="text-[10px] text-neutral-400">O slug identifica sua barbearia unicamente na plataforma.</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Endereço Completo</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Rua das Flores, 123 - Centro, São Paulo"
                      value={barbershop?.address || ""}
                      onChange={(e) => setBarbershop({...barbershop, address: e.target.value})}
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-100 rounded-xl focus:ring-2 focus:ring-neutral-900 focus:border-transparent outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Sobre a Barbearia</label>
                    <textarea 
                      rows={4}
                      placeholder="Conte um pouco sobre a história, estilo e diferenciais..."
                      value={barbershop?.description || ""}
                      onChange={(e) => setBarbershop({...barbershop, description: e.target.value})}
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-100 rounded-xl focus:ring-2 focus:ring-neutral-900 focus:border-transparent outline-none transition-all resize-none"
                    />
                  </div>

                  <div className="pt-4 flex justify-end gap-3">
                    <button 
                      type="button"
                      className="px-6 py-3 rounded-xl text-neutral-600 font-medium hover:bg-neutral-50 transition-colors"
                    >
                      Descartar
                    </button>
                    <button 
                      type="submit"
                      disabled={saving}
                      className="flex items-center gap-2 px-8 py-3 rounded-xl font-medium hover:opacity-90 transition-all disabled:opacity-50 shadow-lg"
                      style={{ backgroundColor: primaryColor, color: secondaryColor, boxShadow: `0 10px 15px -3px ${primaryColor}33` }}
                    >
                      {saving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save size={18} />
                          Salvar Alterações
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            ) : activeSubTab === "agenda" ? (
              <motion.div
                key="agenda"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm space-y-8">
                  <div>
                    <h3 className="font-bold text-lg text-neutral-900 mb-6">Horário de Funcionamento</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-neutral-50 mb-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider ml-1">Início do Expediente</label>
                          <input 
                            type="time" 
                            value={barbershop?.openTime || "08:00"}
                            onChange={(e) => setBarbershop({...barbershop, openTime: e.target.value})}
                            className="w-full px-4 py-3 bg-neutral-50 border border-neutral-100 rounded-xl focus:ring-2 focus:ring-neutral-900 outline-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider ml-1">Fim do Expediente</label>
                          <input 
                            type="time" 
                            value={barbershop?.closeTime || "18:00"}
                            onChange={(e) => setBarbershop({...barbershop, closeTime: e.target.value})}
                            className="w-full px-4 py-3 bg-neutral-50 border border-neutral-100 rounded-xl focus:ring-2 focus:ring-neutral-900 outline-none"
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider ml-1">Início do Almoço (Opcional)</label>
                          <input 
                            type="time" 
                            value={barbershop?.lunchStartTime || ""}
                            onChange={(e) => setBarbershop({...barbershop, lunchStartTime: e.target.value})}
                            className="w-full px-4 py-3 bg-neutral-50 border border-neutral-100 rounded-xl focus:ring-2 focus:ring-neutral-900 outline-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider ml-1">Fim do Almoço (Opcional)</label>
                          <input 
                            type="time" 
                            value={barbershop?.lunchEndTime || ""}
                            onChange={(e) => setBarbershop({...barbershop, lunchEndTime: e.target.value})}
                            className="w-full px-4 py-3 bg-neutral-50 border border-neutral-100 rounded-xl focus:ring-2 focus:ring-neutral-900 outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider ml-1">Dias de Funcionamento</label>
                      <div className="flex flex-wrap gap-2">
                        {DAYS_OF_WEEK.map(day => {
                          const workingDays = (barbershop?.workingDays || '1,2,3,4,5,6').split(',').map(Number);
                          const isActive = workingDays.includes(day.id);
                          
                          return (
                            <button
                              key={day.id}
                              type="button"
                              onClick={() => {
                                let newDays;
                                if (isActive) {
                                  newDays = workingDays.filter(d => d !== day.id);
                                } else {
                                  newDays = [...workingDays, day.id].sort();
                                }
                                setBarbershop({ ...barbershop, workingDays: newDays.join(',') });
                              }}
                              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                                isActive
                                  ? "border-transparent shadow-sm"
                                  : "bg-white text-neutral-400 border-neutral-100 hover:border-neutral-200"
                              }`}
                              style={isActive ? { backgroundColor: primaryColor, color: secondaryColor } : {}}
                            >
                              {day.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider ml-1">Tipo de Agendamento</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <button
                          onClick={() => setBarbershop({...barbershop, schedulingType: 'fixed'})}
                          className={`p-4 rounded-2xl border text-left transition-all ${
                            (barbershop?.schedulingType || 'fixed') === 'fixed'
                              ? "border-neutral-900 bg-neutral-50 shadow-sm"
                              : "border-neutral-100 bg-white hover:border-neutral-200"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                             <div className={`p-2 rounded-lg ${(barbershop?.schedulingType || 'fixed') === 'fixed' ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-500'}`}>
                                <SettingsIcon size={16} />
                             </div>
                             {(barbershop?.schedulingType || 'fixed') === 'fixed' && <div className="w-2 h-2 rounded-full bg-neutral-900" />}
                          </div>
                          <h4 className="font-bold text-sm text-neutral-900">Intervalo Fixo</h4>
                          <p className="text-[10px] text-neutral-500 leading-relaxed mt-1">Todos os serviços ocupam 1 bloco da agenda (ex: 30 min), independente da duração definida no serviço.</p>
                        </button>

                        <button
                          onClick={() => setBarbershop({...barbershop, schedulingType: 'dynamic'})}
                          className={`p-4 rounded-2xl border text-left transition-all ${
                            barbershop?.schedulingType === 'dynamic'
                              ? "border-neutral-900 bg-neutral-50 shadow-sm"
                              : "border-neutral-100 bg-white hover:border-neutral-200"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                             <div className={`p-2 rounded-lg ${barbershop?.schedulingType === 'dynamic' ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-500'}`}>
                                <Zap size={16} />
                             </div>
                             {barbershop?.schedulingType === 'dynamic' && <div className="w-2 h-2 rounded-full bg-neutral-900" />}
                          </div>
                          <h4 className="font-bold text-sm text-neutral-900">Agendamento Dinâmico</h4>
                          <p className="text-[10px] text-neutral-500 leading-relaxed mt-1">O serviço ocupa o tempo real necessário. Se um corte dura 1h, ele ocupará 2 blocos de 30 min automaticamente.</p>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider ml-1">Duração dos Slots (minutos)</label>
                      <div className="flex flex-wrap gap-2">
                        {[15, 20, 30, 45, 60].map(dur => (
                          <button
                            key={dur}
                            onClick={() => setBarbershop({...barbershop, slotDuration: dur})}
                            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                              barbershop?.slotDuration === dur
                                ? "shadow-lg"
                                : "bg-neutral-50 text-neutral-500 hover:bg-neutral-100"
                            }`}
                            style={barbershop?.slotDuration === dur ? { backgroundColor: primaryColor, color: secondaryColor, boxShadow: `0 10px 15px -3px ${primaryColor}33` } : {}}
                          >
                            {dur} min
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-neutral-50 rounded-2xl border border-neutral-100">
                    <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Clock size={14} /> Preview da Agenda Diária
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {(() => {
                        const openStr = barbershop?.openTime || "08:00";
                        const closeStr = barbershop?.closeTime || "18:00";
                        const lunchStartStr = barbershop?.lunchStartTime;
                        const lunchEndStr = barbershop?.lunchEndTime;
                        const duration = barbershop?.slotDuration || 30;
                        const [openH, openM] = openStr.split(":").map(Number);
                        const [closeH, closeM] = closeStr.split(":").map(Number);
                        const openMinutes = openH * 60 + openM;
                        const closeMinutes = closeH * 60 + closeM;

                        let lunchStartMin = -1;
                        let lunchEndMin = -1;
                        if (lunchStartStr && lunchEndStr) {
                          const [lsH, lsM] = lunchStartStr.split(":").map(Number);
                          const [leH, leM] = lunchEndStr.split(":").map(Number);
                          lunchStartMin = lsH * 60 + lsM;
                          lunchEndMin = leH * 60 + leM;
                        }

                        const slots = [];
                        let current = openMinutes;
                        while (current + duration <= closeMinutes) {
                          const isDuringLunch = lunchStartMin !== -1 && (
                            (current >= lunchStartMin && current < lunchEndMin) ||
                            (current + duration > lunchStartMin && current + duration <= lunchEndMin) ||
                            (current < lunchStartMin && current + duration > lunchEndMin)
                          );

                          if (!isDuringLunch) {
                            const h = Math.floor(current / 60);
                            const m = current % 60;
                            slots.push(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`);
                          }
                          current += duration;
                        }
                        return (
                          <>
                            {slots.slice(0, 8).map(s => (
                              <span key={s} className="px-3 py-1.5 bg-white border border-neutral-100 rounded-lg text-xs font-medium text-neutral-600">
                                {s}
                              </span>
                            ))}
                            {slots.length > 8 && (
                              <span className="px-3 py-1.5 text-xs text-neutral-400 font-medium italic">
                                +{slots.length - 8} mais...
                              </span>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button 
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="flex items-center gap-2 px-8 py-3 rounded-xl font-medium hover:opacity-90 transition-all disabled:opacity-50 shadow-lg"
                      style={{ backgroundColor: primaryColor, color: secondaryColor, boxShadow: `0 10px 15px -3px ${primaryColor}33` }}
                    >
                      {saving ? "Salvando..." : "Salvar Configurações"}
                    </button>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm relative overflow-hidden">
                  {barbershop?.subscriptionStatus === 'free_restricted' && (
                    <div className="absolute inset-0 z-20 backdrop-blur-[4px] bg-white/40 flex flex-col items-center justify-center p-8 text-center text-neutral-400">
                       <Lock size={32} className="mb-2" />
                       <p className="text-sm font-bold uppercase tracking-widest leading-relaxed">Links de Agendamento <br/> Desativados</p>
                    </div>
                  )}
                  <div className={`mb-6 ${barbershop?.subscriptionStatus === 'free_restricted' ? 'blur-[1px] opacity-20' : ''}`}>
                    <h3 className="font-bold text-lg text-neutral-900">Links de Agendamento</h3>
                    <p className="text-neutral-400 text-sm">Cada barbeiro possui seu próprio link de agendamento público.</p>
                  </div>
                  
                  <div className={`space-y-6 ${barbershop?.subscriptionStatus === 'free_restricted' ? 'blur-[1px] opacity-20 pointer-events-none' : ''}`}>
                    {users.map(user => (
                      <div key={user.id} className="p-6 rounded-2xl border border-neutral-100 bg-neutral-50/50 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-neutral-900 rounded-xl flex items-center justify-center text-white font-bold text-xs uppercase">
                              {user.name.charAt(0)}
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-neutral-900 line-clamp-1">{user.name}</h4>
                              <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{user.role}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => window.open(`${window.location.origin}/book/${user.bookingToken}`, '_blank')}
                              className="p-2 bg-white border border-neutral-100 rounded-lg text-neutral-500 hover:text-neutral-900 hover:shadow-sm transition-all"
                              title="Ver página pública"
                            >
                              <ExternalLink size={16} />
                            </button>
                            <button 
                              onClick={() => handleRegenerateToken(user.id)}
                              className="p-2 bg-white border border-neutral-100 rounded-lg text-neutral-500 hover:text-neutral-900 hover:shadow-sm transition-all"
                              title="Regenerar Link"
                            >
                              <RefreshCw size={16} />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-white border border-neutral-100 rounded-xl text-[11px] font-mono text-neutral-400 overflow-hidden">
                            <Link2 size={12} className="shrink-0" />
                            <span className="truncate">{window.location.origin}/book/{user.bookingToken}</span>
                          </div>
                          <button
                            onClick={() => copyBookingLink(user.bookingToken, user.id)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all min-w-[100px] ${
                              copiedStates[user.id] === 'copied'
                                ? "bg-emerald-50 text-emerald-600"
                                : "shadow-sm"
                            }`}
                            style={copiedStates[user.id] !== 'copied' ? { backgroundColor: primaryColor, color: secondaryColor } : {}}
                          >
                            {copiedStates[user.id] === 'copied' ? "Copiado!" : "Copiar Link"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : activeSubTab === "servicos" ? (
              <motion.div
                key="servicos"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="font-bold text-lg text-neutral-900">Catálogo de Serviços</h3>
                      <p className="text-neutral-400 text-sm">Defina os preços e durações dos seus serviços.</p>
                    </div>
                    <button 
                      onClick={() => setShowAddService(!showAddService)}
                      className="p-2 rounded-xl hover:opacity-90 transition-all"
                      style={{ backgroundColor: primaryColor, color: secondaryColor }}
                    >
                      {showAddService ? <Plus className="rotate-45" size={20} /> : <Plus size={20} />}
                    </button>
                  </div>

                  {showAddService && (
                    <motion.form 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      onSubmit={handleAddService}
                      className="mb-8 p-6 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-4 overflow-hidden"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider ml-1">Serviço</label>
                          <input 
                            type="text" 
                            placeholder="Ex: Corte Degradê"
                            value={newService.name}
                            onChange={e => setNewService({...newService, name: e.target.value})}
                            className="w-full px-4 py-2.5 bg-white border border-neutral-100 rounded-xl focus:ring-2 focus:ring-neutral-900 outline-none text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider ml-1">Preço (R$)</label>
                          <input 
                            type="number" 
                            placeholder="45"
                            value={newService.price}
                            onChange={e => setNewService({...newService, price: e.target.value})}
                            className="w-full px-4 py-2.5 bg-white border border-neutral-100 rounded-xl focus:ring-2 focus:ring-neutral-900 outline-none text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider ml-1">Tempo (min)</label>
                          <input 
                            type="number" 
                            placeholder="30"
                            value={newService.duration}
                            onChange={e => setNewService({...newService, duration: e.target.value})}
                            className="w-full px-4 py-2.5 bg-white border border-neutral-100 rounded-xl focus:ring-2 focus:ring-neutral-900 outline-none text-sm"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <button 
                          type="submit"
                          className="px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg"
                          style={{ backgroundColor: primaryColor, color: secondaryColor, boxShadow: `0 10px 15px -3px ${primaryColor}33` }}
                        >
                          Confirmar Adição
                        </button>
                      </div>
                    </motion.form>
                  )}

                  <div className="space-y-3">
                    {services.length === 0 ? (
                      <div className="py-12 text-center text-neutral-400 text-sm">
                        Nenhum serviço cadastrado ainda.
                      </div>
                    ) : (
                      services.map((service) => (
                        <div key={service.id} className="flex items-center justify-between p-4 bg-neutral-50 border border-neutral-100 rounded-2xl group active:scale-[0.99] transition-all">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-neutral-100 text-neutral-900">
                              <Scissors size={20} />
                            </div>
                            <div>
                              <h4 className="font-bold text-neutral-900 text-sm">{service.name}</h4>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="flex items-center gap-1 text-[11px] text-neutral-500">
                                  <DollarSign size={10} className="text-emerald-500" />
                                  {service.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </span>
                                <span className="flex items-center gap-1 text-[11px] text-neutral-500">
                                  <Clock size={10} className="text-blue-500" />
                                  {service.duration} min
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <button 
                            onClick={() => handleDeleteService(service.id)}
                            className="p-2.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            ) : activeSubTab === "personalizacao" ? (
              <motion.div
                key="personalizacao"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm space-y-8"
              >
                <div>
                  <h3 className="font-bold text-lg text-neutral-900 mb-2">Identidade Visual</h3>
                  <p className="text-neutral-400 text-sm mb-6">Personalize as cores que seus clientes verão na página de agendamento.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="p-6 rounded-2xl border border-neutral-100 bg-neutral-50 space-y-4">
                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block">Cor Primária</label>
                        <div className="flex items-center gap-4">
                          <input 
                            type="color" 
                            value={barbershop?.primaryColor || "#000000"}
                            onChange={(e) => setBarbershop({...barbershop, primaryColor: e.target.value})}
                            className="w-12 h-12 rounded-lg cursor-pointer border-none bg-transparent"
                          />
                          <input 
                            type="text"
                            value={barbershop?.primaryColor || "#000000"}
                            onChange={(e) => setBarbershop({...barbershop, primaryColor: e.target.value})}
                            className="flex-1 px-3 py-2 bg-white border border-neutral-200 rounded-xl text-sm font-mono"
                          />
                        </div>
                        <p className="text-[10px] text-neutral-400 italic">Usada em botões e destaques principais.</p>
                      </div>

                      <div className="p-6 rounded-2xl border border-neutral-100 bg-neutral-50 space-y-4">
                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block">Cor de Fundo / Texto (Secundária)</label>
                        <div className="flex items-center gap-4">
                          <input 
                            type="color" 
                            value={barbershop?.secondaryColor || "#ffffff"}
                            onChange={(e) => setBarbershop({...barbershop, secondaryColor: e.target.value})}
                            className="w-12 h-12 rounded-lg cursor-pointer border-none bg-transparent"
                          />
                          <input 
                            type="text"
                            value={barbershop?.secondaryColor || "#ffffff"}
                            onChange={(e) => setBarbershop({...barbershop, secondaryColor: e.target.value})}
                            className="flex-1 px-3 py-2 bg-white border border-neutral-200 rounded-xl text-sm font-mono"
                          />
                        </div>
                        <p className="text-[10px] text-neutral-400 italic">Usada em contrastes e elementos secundários.</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block pl-2">Visualização em Tempo Real</label>
                      <div className="p-8 rounded-[2rem] bg-neutral-900 border border-neutral-800 relative overflow-hidden flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 border border-neutral-800" style={{ backgroundColor: barbershop?.primaryColor || '#000000' }}>
                           <Scissors className="text-white" size={24} />
                        </div>
                        <h4 className="text-white font-bold mb-1">{barbershop?.name || "Sua Barbearia"}</h4>
                        <p className="text-neutral-500 text-[10px] mb-6">Preview do seu link público</p>
                        
                        <button 
                          className="w-full py-3 rounded-xl text-sm font-bold shadow-lg transition-all"
                          style={{ 
                            backgroundColor: barbershop?.primaryColor || '#000000',
                            color: barbershop?.secondaryColor || '#ffffff'
                          }}
                        >
                          Agendar Agora
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4" style={{ backgroundColor: 'transparent' }}>
                    <button 
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="flex items-center gap-2 px-8 py-3 rounded-xl font-medium hover:opacity-90 transition-all disabled:opacity-50 shadow-lg"
                      style={{ backgroundColor: primaryColor, color: secondaryColor, boxShadow: `0 10px 15px -3px ${primaryColor}33` }}
                    >
                      {saving ? "Salvando..." : "Salvar Cores"}
                    </button>
                  </div>
              </motion.div>
            ) : activeSubTab === "acesso" ? (
              <motion.div
                key="acesso"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="font-bold text-lg text-neutral-900">Membros da Equipe</h3>
                      <p className="text-neutral-400 text-sm">Gerencie quem tem acesso ao painel da sua barbearia.</p>
                    </div>
                    <button 
                      onClick={() => {
                        if (!isEligibleForNewUser) {
                          showToast("A criação de novos acessos (membros de equipe) está disponível apenas nos planos Teste Grátis e Premium. Por favor, atualize sua assinatura para continuar!", "error");
                          return;
                        }
                        setShowAddUser(!showAddUser);
                      }}
                      className="p-2 px-4 rounded-xl hover:opacity-90 transition-all font-bold text-sm flex items-center gap-2 border border-transparent"
                      style={isEligibleForNewUser ? { backgroundColor: primaryColor, color: secondaryColor } : { backgroundColor: "#f5f5f5", color: "#a3a3a3", borderColor: "#e5e5e5", cursor: "not-allowed" }}
                    >
                      {!isEligibleForNewUser ? (
                        <Lock size={15} />
                      ) : showAddUser ? (
                        <Plus className="rotate-45" size={20} />
                      ) : (
                        <Plus size={20} />
                      )}
                      Novo Acesso
                    </button>
                  </div>

                  {!isEligibleForNewUser && (
                    <div className="mb-8 p-6 bg-amber-50/70 rounded-2xl border border-amber-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="flex gap-3">
                        <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl shrink-0 mt-0.5 md:mt-0">
                          <Lock size={18} />
                        </div>
                        <div>
                          <h4 className="font-bold text-neutral-900 text-sm">Recurso Premium: Multi-acessos</h4>
                          <p className="text-xs text-neutral-600 mt-0.5 leading-relaxed max-w-[600px]">
                            A criação de novos usuários e acessos para membros de equipe está disponível apenas nos planos <strong>Teste Grátis</strong> e <strong>Premium</strong>. Ative hoje e libere acessos individuais para sua equipe!
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          // Pagamento Asaas/Mercado Pago removido — stub retornando aviso de pagamento desativado
                          alert("Pagamento online desativado — escolha pagamento no local ou entre em contato.");
                        }}
                        className="px-5 py-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 self-stretch md:self-auto justify-center"
                      >
                        <Zap size={14} className="fill-white" />
                        Fazer Upgrade
                      </button>
                    </div>
                  )}

                  {showAddUser && (
                    <motion.form 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      onSubmit={handleAddUser}
                      className="mb-8 p-6 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-4 overflow-hidden"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider ml-1">Nome Completo</label>
                          <input 
                            type="text" 
                            placeholder="Ex: João Silva"
                            value={newUser.name}
                            onChange={e => setNewUser({...newUser, name: e.target.value})}
                            className="w-full px-4 py-2.5 bg-white border border-neutral-100 rounded-xl focus:ring-2 focus:ring-neutral-900 outline-none text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider ml-1">Foto do Perfil</label>
                          <label className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-white border border-dashed border-neutral-300 rounded-xl cursor-pointer hover:bg-neutral-50 transition-all text-xs font-bold text-neutral-600">
                            {newUser.avatarUrl ? "Trocar Imagem" : "Importar Imagem"}
                            <input 
                              type="file" 
                              accept="image/*"
                              onChange={(e) => handleFileUpload(e, (base64) => setNewUser({...newUser, avatarUrl: base64}))}
                              className="hidden"
                            />
                            {newUser.avatarUrl && (
                                <div className="w-6 h-6 rounded-full overflow-hidden border border-neutral-200">
                                    <img src={newUser.avatarUrl} className="w-full h-full object-cover" />
                                </div>
                            )}
                          </label>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider ml-1">E-mail</label>
                          <input 
                            type="email" 
                            placeholder="joao@exemplo.com"
                            value={newUser.email}
                            onChange={e => setNewUser({...newUser, email: e.target.value})}
                            className="w-full px-4 py-2.5 bg-white border border-neutral-100 rounded-xl focus:ring-2 focus:ring-neutral-900 outline-none text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider ml-1">WhatsApp</label>
                          <input 
                            type="tel" 
                            placeholder="(11) 99999-9999"
                            value={newUser.phone}
                            onChange={e => setNewUser({...newUser, phone: formatPhone(e.target.value)})}
                            className="w-full px-4 py-2.5 bg-white border border-neutral-100 rounded-xl focus:ring-2 focus:ring-neutral-900 outline-none text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider ml-1">Senha Provisória</label>
                          <input 
                            type="password" 
                            placeholder="Mínimo 6 caracteres"
                            value={newUser.password}
                            onChange={e => setNewUser({...newUser, password: e.target.value})}
                            className="w-full px-4 py-2.5 bg-white border border-neutral-100 rounded-xl focus:ring-2 focus:ring-neutral-900 outline-none text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider ml-1">Nível de Acesso</label>
                          <select 
                            value={newUser.role}
                            onChange={e => setNewUser({...newUser, role: e.target.value as "admin" | "barber"})}
                            className="w-full px-4 py-2.5 bg-white border border-neutral-100 rounded-xl focus:ring-2 focus:ring-neutral-900 outline-none text-sm"
                          >
                            <option value="barber">Barbeiro (Acesso Limitado)</option>
                            <option value="admin">Administrador (Acesso Total)</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <button 
                          type="submit"
                          className="px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg"
                          style={{ backgroundColor: primaryColor, color: secondaryColor, boxShadow: `0 10px 15px -3px ${primaryColor}33` }}
                        >
                          Conceder Acesso
                        </button>
                      </div>
                    </motion.form>
                  )}

                  <div className="space-y-4">
                    {users.map((user) => (
                      <div key={user.id} className="space-y-3">
                        <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-neutral-900 rounded-full flex items-center justify-center text-white font-bold text-sm overflow-hidden border border-neutral-200">
                              {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                              ) : (
                                user.name.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-neutral-900 text-sm">{user.name}</h4>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  user.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-green-100 text-green-700'
                                }`}>
                                  {user.role}
                                </span>
                              </div>
                              <p className="text-xs text-neutral-500">{user.email}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => setEditingUser(editingUser === user.id ? null : user.id)}
                              className={`p-2 rounded-xl transition-all ${
                                editingUser === user.id 
                                  ? "bg-neutral-900 text-white" 
                                  : "text-neutral-400 hover:text-neutral-900 hover:bg-white"
                              }`}
                              title="Editar Perfil"
                            >
                              <SettingsIcon size={18} />
                            </button>
                            <button 
                              onClick={() => {
                                setChangingPasswordFor(changingPasswordFor === user.id ? null : user.id);
                                setNewPassword("");
                              }}
                              className={`p-2 rounded-xl transition-all ${
                                changingPasswordFor === user.id 
                                  ? "bg-neutral-900 text-white" 
                                  : "text-neutral-400 hover:text-neutral-900 hover:bg-white"
                              }`}
                              title="Alterar Senha"
                            >
                              <Key size={18} />
                            </button>
                            <button 
                              onClick={() => handleDeleteUser(user.id)}
                              className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                              title="Remover Acesso"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>

                        <AnimatePresence>
                          {editingUser === user.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="bg-white border border-neutral-100 p-4 rounded-2xl space-y-4 shadow-sm mb-2">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Foto do Perfil</label>
                                    <label className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-neutral-100 rounded-xl text-xs font-bold cursor-pointer hover:bg-neutral-200 transition-all border border-neutral-200">
                                      Escolher Arquivo
                                      <input 
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleFileUpload(e, (base64) => handleUpdateUser(user.id, { avatarUrl: base64 }))}
                                        className="hidden"
                                      />
                                    </label>
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Nome</label>
                                    <input 
                                      type="text"
                                      defaultValue={user.name}
                                      onBlur={(e) => handleUpdateUser(user.id, { name: e.target.value })}
                                      className="w-full px-4 py-2 bg-neutral-50 border border-neutral-100 rounded-xl text-sm focus:ring-2 focus:ring-neutral-900 outline-none"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">WhatsApp / Telefone</label>
                                    <input 
                                      type="tel"
                                      value={user.phone || ""}
                                      onChange={(e) => {
                                        const formatted = formatPhone(e.target.value);
                                        setUsers(users.map(u => u.id === user.id ? { ...u, phone: formatted } : u));
                                      }}
                                      onBlur={(e) => handleUpdateUser(user.id, { phone: e.target.value })}
                                      className="w-full px-4 py-2 bg-neutral-50 border border-neutral-100 rounded-xl text-sm focus:ring-2 focus:ring-neutral-900 outline-none"
                                    />
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <AnimatePresence>
                          {changingPasswordFor === user.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              <form 
                                onSubmit={handleUpdatePassword}
                                className="bg-white border border-neutral-100 p-4 rounded-2xl flex items-center gap-3 shadow-sm"
                              >
                                <div className="flex-1">
                                  <input 
                                    type="password"
                                    placeholder="Nova senha (mínimo 6 caracteres)"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-100 rounded-xl text-sm focus:ring-2 focus:ring-neutral-900 outline-none"
                                  />
                                </div>
                                <button 
                                  type="button"
                                  onClick={() => setChangingPasswordFor(null)}
                                  className="px-4 py-2 text-sm text-neutral-500 hover:text-neutral-700"
                                >
                                  Cancelar
                                </button>
                                <button 
                                  type="submit"
                                  className="px-6 py-2 bg-neutral-900 text-white text-sm font-bold rounded-xl shadow-lg shadow-neutral-900/10"
                                >
                                  Redefinir
                                </button>
                              </form>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>

                  {/* Danger Zone: delete own account */}
                  <div className="mt-8 pt-8 border-t border-red-100 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-red-50/50 rounded-2xl border border-red-100">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-red-100 text-red-600 rounded-xl shrink-0">
                          <Trash2 size={20} />
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-bold text-red-950 text-sm">Excluir Minha Conta</h4>
                          <p className="text-xs text-red-700 leading-relaxed max-w-[500px]">
                            Atenção: Esta ação é definitiva. Se você for o administrador principal, sua barbearia, equipe, agendamentos e clientes serão permanentemente apagados dos servidores.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleDeleteSelfAccount}
                        disabled={saving}
                        className="px-5 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-red-600/10 shrink-0 self-start md:self-center"
                      >
                        {saving ? "Excluindo..." : "Excluir Conta"}
                      </button>
                    </div>
                  </div>
                  
                </div>
              </motion.div>
            ) : activeSubTab === "assinatura" ? (
              <Assinatura barbershop={barbershop} onUpdate={onUpdate} />
            ) : null}
          </AnimatePresence>
        </div>

        <div className="space-y-6">
          <div className="p-8 rounded-3xl text-white relative overflow-hidden shadow-xl" style={{ backgroundColor: primaryColor }}>
            <div className="relative z-10">
              <Shield className="w-8 h-8 mb-4 opacity-50" style={{ color: secondaryColor }} />
              <h3 className="text-lg font-bold mb-2" style={{ color: secondaryColor }}>Segurança da Unidade</h3>
              <p className="text-sm leading-relaxed mb-6" style={{ color: `${secondaryColor}b3` }}>
                Gerencie permissões, troque sua senha e ative autenticação de dois fatores.
              </p>
              <button 
                onClick={() => setActiveSubTab("acesso")}
                className="w-full py-3 rounded-xl text-sm font-bold transition-all backdrop-blur-md"
                style={{ backgroundColor: `${secondaryColor}1a`, border: `1px solid ${secondaryColor}33`, color: secondaryColor }}
              >
                Gerenciar Acesso
              </button>
            </div>
            <div className="absolute -right-4 -bottom-4 w-32 h-32 rounded-full blur-3xl opacity-50" style={{ backgroundColor: `${secondaryColor}1a` }} />
          </div>

          <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm space-y-4">
            <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider px-2">Notificações</h4>
            <div className="space-y-2">
              <ToggleRow icon={<Bell size={16} />} label="Agendamentos" active primaryColor={primaryColor} />
              <ToggleRow icon={<Bell size={16} />} label="Cancelamentos" active primaryColor={primaryColor} />
              <ToggleRow icon={<Bell size={16} />} label="Marketing" primaryColor={primaryColor} />
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-xl border text-sm font-semibold transition-all max-w-sm"
            style={{
              backgroundColor: notification.type === 'success' ? '#f0fdf4' : '#fef2f2',
              borderColor: notification.type === 'success' ? '#bbf7d0' : '#fca5a5',
              color: notification.type === 'success' ? '#15803d' : '#b91c1c'
            }}
          >
            {notification.type === 'success' ? (
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white shrink-0 font-bold">✓</div>
            ) : (
              <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white shrink-0 font-bold">!</div>
            )}
            <span>{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ToggleRow({ icon, label, active = false, primaryColor }: { icon: any, label: string, active?: boolean, primaryColor: string }) {
  const [isOn, setIsOn] = useState(active);
  return (
    <div className="flex items-center justify-between p-2 rounded-xl hover:bg-neutral-50 transition-colors">
      <div className="flex items-center gap-3">
        <div className="text-neutral-400">{icon}</div>
        <span className="text-sm font-medium text-neutral-700">{label}</span>
      </div>
      <button 
        onClick={() => setIsOn(!isOn)}
        className={`w-10 h-6 rounded-full transition-all flex items-center px-1 ${
          isOn ? "" : "bg-neutral-200"
        }`}
        style={isOn ? { backgroundColor: primaryColor } : {}}
      >
        <motion.div 
          animate={{ x: isOn ? 14 : 0 }}
          className="w-4 h-4 bg-white rounded-full shadow-sm"
        />
      </button>
    </div>
  );
}
