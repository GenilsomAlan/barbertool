import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Scissors, Calendar, Clock, User, Phone, CheckCircle, ArrowLeft, Loader2, Instagram, Facebook, Video, X } from "lucide-react";
import { api } from "../services/api";
import { formatPhone, isValidPhone } from "../utils/phone";

type Step = "service" | "datetime" | "info" | "done";

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
}

interface BarberInfo {
  id: string;
  name: string;
  avatarUrl?: string;
  barbershopName: string;
  barbershopId: string;
  address?: string;
  description?: string;
  phone: string;
  openTime: string;
  closeTime: string;
  slotDuration: number;
  workingDays?: string;
  logoUrl?: string;
  instagram?: string;
  tiktok?: string;
  facebook?: string;
  primaryColor?: string;
  secondaryColor?: string;
  subscriptionStatus?: string;
}

export default function BookingPage() {
  const { bookingToken } = useParams<{ bookingToken: string }>();
  const [step, setStep] = useState<Step>("service");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [barber, setBarber] = useState<BarberInfo | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (bookingToken) {
      loadBarberData();
    }
  }, [bookingToken]);

  async function loadBarberData() {
    try {
      setLoading(true);
      const data = await api.public.getBarber(bookingToken!);
      setBarber(data.barber);
      setServices(data.services);

      // Auto-select first working day
      const workingDays = (data.barber.workingDays || '1,2,3,4,5,6').split(',').map(Number);
      const today = new Date();
      let firstWorking = new Date(today);
      for (let i = 0; i < 14; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        if (workingDays.includes(d.getDay())) {
          firstWorking = d;
          break;
        }
      }
      setSelectedDate(firstWorking);
    } catch (err: any) {
      setError(err.message || "Barbeiro não encontrado");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (step === "datetime" && selectedDate && selectedService) {
      loadSlots();
    }
  }, [selectedDate, selectedService, step]);

  async function loadSlots() {
    try {
      setLoadingSlots(true);
      const y = selectedDate.getFullYear();
      const m = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
      const d = selectedDate.getDate().toString().padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;
      const data = await api.public.getSlots(bookingToken!, dateStr, selectedService!.id);
      setSlots(data.slots);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSlots(false);
    }
  }

  function toLocalISO(date: Date, slot: string) {
    const [hours, minutes] = slot.split(":").map(Number);
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    const hh = hours.toString().padStart(2, '0');
    const mm = minutes.toString().padStart(2, '0');
    return `${y}-${m}-${d}T${hh}:${mm}:00`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedService || !selectedSlot) return;

    try {
      setSubmitting(true);
      setError(null);
      const isoDate = toLocalISO(selectedDate, selectedSlot);
      const res = await api.public.createAppointment(bookingToken!, {
        serviceId: selectedService.id,
        customerName,
        customerPhone,
        date: isoDate
      });
      setResult(res);
      setStep("done");
      
      setTimeout(() => {
        if (res.whatsapp?.client) {
          window.open(res.whatsapp.client, '_blank');
        }
      }, 800);
    } catch (err: any) {
      setError(err.message || "Erro ao agendar");
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-neutral-400 animate-spin" />
      </div>
    );
  }

  if (error && step !== "info") {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="text-white underline">Tentar novamente</button>
        </div>
      </div>
    );
  }

  const steps = [
    { id: "service", label: "Serviço" },
    { id: "datetime", label: "Horário" },
    { id: "info", label: "Dados" }
  ];

  const currentStepIndex = steps.findIndex(s => s.id === (step === "done" ? "info" : step));

  const primaryColor = barber?.primaryColor || "#ffffff";
  const secondaryColor = barber?.secondaryColor || "#000000";

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans selection:bg-white selection:text-black">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-900 px-6 py-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-neutral-900 rounded-xl flex items-center justify-center overflow-hidden border" style={{ borderColor: `${primaryColor}4d` }}>
              {barber?.avatarUrl ? (
                <img src={barber.avatarUrl} alt="Barbeiro" className="w-full h-full object-cover" />
              ) : barber?.logoUrl ? (
                <img src={barber.logoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <Scissors className="w-5 h-5 text-neutral-500" />
              )}
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">{barber?.name}</h1>
              <p className="text-neutral-500 text-sm whitespace-nowrap overflow-hidden text-ellipsis">{barber?.barbershopName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {barber?.instagram && (
              <a 
                href={`https://instagram.com/${barber.instagram.replace('@', '')}`}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition-all shadow-sm"
              >
                <Instagram size={16} />
              </a>
            )}
            {barber?.tiktok && (
              <a 
                href={`https://tiktok.com/@${barber.tiktok.replace('@', '')}`}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition-all shadow-sm"
              >
                <Video size={16} />
              </a>
            )}
            {barber?.facebook && (
              <a 
                href={barber.facebook.startsWith('http') ? barber.facebook : `https://${barber.facebook}`}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition-all shadow-sm"
              >
                <Facebook size={16} />
              </a>
            )}
          </div>
        </div>
      </header>

      <main className="pt-28 pb-10 px-6 max-w-md mx-auto">
        {step !== "done" && (
          <div className="mb-10">
            <div className="flex items-center justify-between relative">
              <div className="absolute top-1/2 left-0 w-full h-[1px] bg-neutral-900 -z-10" />
              {steps.map((s, i) => {
                const isActive = i <= currentStepIndex;
                const isCurrent = i === currentStepIndex;
                return (
                  <div key={s.id} className="flex flex-col items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                      isCurrent ? "scale-110" : 
                      isActive ? "bg-neutral-600 text-white" : "bg-neutral-900 text-neutral-500"
                    }`}
                    style={isCurrent ? { backgroundColor: primaryColor, color: secondaryColor, boxShadow: `0 0 15px ${primaryColor}4d` } : {}}
                    >
                      {i + 1}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <AnimatePresence>
          {step === "service" && (
            <motion.div
              key="service"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="space-y-4"
            >
              <h2 className="text-2xl font-bold tracking-tight mb-6">Escolha o serviço</h2>
              <div className="grid gap-3">
                {services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => setSelectedService(service)}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      selectedService?.id === service.id
                        ? "border-transparent"
                        : "bg-neutral-900 border-neutral-800 text-white hover:border-neutral-700"
                    }`}
                    style={selectedService?.id === service.id ? { backgroundColor: primaryColor, color: secondaryColor } : {}}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-lg">{service.name}</span>
                      <span className={`font-bold ${selectedService?.id === service.id ? "" : "text-neutral-400"}`} style={selectedService?.id === service.id ? { color: secondaryColor } : {}}>
                        {service.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </span>
                    </div>
                    <div className={`flex items-center gap-1.5 text-sm ${selectedService?.id === service.id ? "" : "text-neutral-500"}`} style={selectedService?.id === service.id ? { color: `${secondaryColor}b3` } : {}}>
                      <Clock className="w-3.5 h-3.5" />
                      {service.duration} min
                    </div>
                  </button>
                ))}
              </div>
              
              <div className="pt-6">
                <button
                  disabled={!selectedService}
                  onClick={() => setStep("datetime")}
                  className="w-full font-bold py-4 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  style={{ backgroundColor: primaryColor, color: secondaryColor }}
                >
                  Continuar
                </button>
              </div>
            </motion.div>
          )}

          {step === "datetime" && (
            <motion.div
              key="datetime"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="space-y-6"
            >
              <button 
                onClick={() => setStep("service")}
                className="flex items-center gap-1.5 text-neutral-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </button>

              <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
                <p className="text-xs text-neutral-500 uppercase tracking-widest font-bold mb-1">Serviço Selecionado</p>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg">{selectedService?.name}</span>
                  <span className="text-neutral-400">{selectedService?.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold mb-4">Selecione o dia</h2>
                <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6">
                  {Array.from({ length: 14 }).map((_, i) => {
                    const date = new Date();
                    date.setDate(date.getDate() + i);
                    const isSelected = selectedDate.toDateString() === date.toDateString();
                    const isToday = i === 0;
                    
                    const workingDays = (barber?.workingDays || '1,2,3,4,5,6').split(',').map(Number);
                    const isWorkingDay = workingDays.includes(date.getDay());
                    
                    return (
                      <button
                        key={i}
                        disabled={!isWorkingDay}
                        onClick={() => setSelectedDate(date)}
                        className={`flex-shrink-0 w-16 h-20 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all ${
                          isSelected 
                            ? "border-transparent shadow-[0_4px_12px_rgba(0,0,0,0.1)]" 
                            : isWorkingDay 
                              ? "bg-neutral-900 border-neutral-800 text-white"
                              : "bg-neutral-950 border-neutral-900 text-neutral-700 opacity-50 cursor-not-allowed"
                        }`}
                        style={isSelected ? { backgroundColor: primaryColor, color: secondaryColor } : {}}
                      >
                        <span className={`text-[10px] font-bold uppercase tracking-wider`} style={isSelected ? { color: secondaryColor, opacity: 0.7 } : { color: 'rgb(115 115 115)' }}>
                          {date.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")}
                        </span>
                        <span className="text-xl font-black">{date.getDate()}</span>
                        {isToday && (
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full`} style={isSelected ? { backgroundColor: secondaryColor, color: primaryColor } : { backgroundColor: 'white', color: 'black' }}>
                            HOJE
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold mb-4">Escolha o horário</h2>
                {loadingSlots ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 text-neutral-700 animate-spin" />
                  </div>
                ) : slots.length > 0 ? (
                  <div className="grid grid-cols-4 gap-2">
                    {slots.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-3 rounded-xl border text-sm font-bold transition-all ${
                          selectedSlot === slot
                            ? "border-transparent"
                            : "bg-neutral-900 border-neutral-800 text-white hover:border-neutral-700"
                        }`}
                        style={selectedSlot === slot ? { backgroundColor: primaryColor, color: secondaryColor } : {}}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 px-6 rounded-2xl bg-neutral-900/50 border border-neutral-900">
                    <p className="text-neutral-500">Nenhum horário disponível para este dia.</p>
                  </div>
                )}
              </div>

              <div className="pt-4">
                <button
                  disabled={!selectedDate || !selectedSlot}
                  onClick={() => setStep("info")}
                  className="w-full font-bold py-4 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  style={{ backgroundColor: primaryColor, color: secondaryColor }}
                >
                  Continuar
                </button>
              </div>
            </motion.div>
          )}

          {step === "info" && (
            <motion.div
              key="info"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="space-y-6"
            >
              <button 
                onClick={() => setStep("datetime")}
                className="flex items-center gap-1.5 text-neutral-400 hover:text-white transition-colors"
                disabled={submitting}
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </button>

              <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
                <p className="text-xs text-neutral-500 uppercase tracking-widest font-bold">Resumo do Agendamento</p>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-white">
                    <Calendar className="w-4 h-4 text-neutral-500" />
                    <span className="font-medium">
                      {selectedDate.toLocaleDateString("pt-BR", { day: '2-digit', month: 'long' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-white">
                    <Clock className="w-4 h-4 text-neutral-500" />
                    <span className="font-medium">{selectedSlot}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-neutral-800">
                  <span className="text-neutral-300">{selectedService?.name}</span>
                  <span className="font-bold text-lg">{selectedService?.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1.5 ml-1">Seu nome completo</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                    <input
                      required
                      type="text"
                      placeholder="Ex: João da Silva"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1.5 ml-1">WhatsApp (para confirmar)</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                    <input
                      required
                      type="tel"
                      placeholder="(11) 99999-9999"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(formatPhone(e.target.value))}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all font-medium"
                    />
                  </div>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3"
                    >
                      <div className="w-5 h-5 rounded-full bg-red-500 text-neutral-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <X className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-red-400 text-sm font-bold leading-tight">Ops! Não foi possível agendar</p>
                        <p className="text-red-400/80 text-[11px] font-medium mt-1 uppercase tracking-wider">{error}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={submitting || !customerName || !isValidPhone(customerPhone)}
                    className="w-full font-bold py-4 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    style={{ backgroundColor: primaryColor, color: secondaryColor }}
                  >
                    {submitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      "Confirmar Agendamento"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {step === "done" && (
            <motion.div
              key="done"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center py-8"
            >
              <div className="flex justify-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                >
                  <CheckCircle className="w-24 h-24" style={{ color: primaryColor }} />
                </motion.div>
              </div>
              
              <h2 className="text-3xl font-black mb-2 tracking-tight">Agendado!</h2>
              <p className="text-neutral-400 mb-12">Seu horário foi reservado com sucesso.</p>
              
              <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 mb-10 space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-neutral-500">Barbeiro</span>
                  <span className="font-bold">{barber?.name}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-neutral-500">Serviço</span>
                  <span className="font-bold">{selectedService?.name}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-neutral-500">Data e Hora</span>
                  <span className="font-bold">
                    {selectedDate.toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit' })} • {selectedSlot}
                  </span>
                </div>
                {barber?.address && (
                  <div className="pt-3 border-t border-neutral-800">
                    <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold mb-1 text-left">Localização</p>
                    <p className="text-sm font-medium text-left text-neutral-200">{barber.address}</p>
                  </div>
                )}
                {barber?.description && (
                  <div className="pt-3 border-t border-neutral-800">
                    <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold mb-1 text-left">Sobre a Barbearia</p>
                    <p className="text-xs text-left text-neutral-400 leading-relaxed italic">"{barber.description}"</p>
                  </div>
                )}
              </div>

              <div className="grid gap-3">
                <button
                  onClick={() => window.open(result?.whatsapp?.client, '_blank')}
                  className="w-full bg-[#25D366] text-white font-bold py-4 rounded-2xl hover:opacity-90 transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.301-.15-1.767-.872-2.04-.971-.272-.1-.47-.15-.67.15-.199.3-.77.971-.944 1.171-.174.2-.347.225-.648.075-.301-.15-1.269-.467-2.417-1.492-.893-.796-1.495-1.777-1.671-2.078-.176-.3-.019-.462.13-.611.135-.133.301-.35.451-.526.15-.176.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.67-1.616-.918-2.213-.242-.589-.487-.509-.67-.52l-.57-.01c-.198 0-.52.075-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.767-.721 2.016-1.416.249-.695.249-1.291.174-1.416-.076-.125-.276-.199-.577-.349zM12 2C6.477 2 2 6.477 2 12c0 1.891.524 3.662 1.435 5.179L2 22l4.957-1.301C8.32 21.535 9.948 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
                  </svg>
                  Ver confirmação no WhatsApp
                </button>
                
                <button
                   onClick={() => window.location.href = '/'}
                   className="mt-4 text-neutral-500 hover:text-white text-sm font-medium transition-colors"
                >
                  Voltar ao início
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
