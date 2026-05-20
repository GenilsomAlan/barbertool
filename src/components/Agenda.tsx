import React, { useState, useEffect } from "react";
import { api } from "../services/api.ts";
import { Calendar as CalendarIcon, Clock, User, Phone, Scissors, Plus, X, Check, Loader2, Edit2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { formatPhone, isValidPhone } from "../utils/phone";

export default function Agenda({ primaryColor, secondaryColor }: { primaryColor: string, secondaryColor: string }) {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [rescheduleData, setRescheduleData] = useState<any>(null);

  const fetchAppointments = async () => {
    try {
      const data = await api.appointments.list();
      setAppointments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await api.appointments.updateStatus(id, status);
      fetchAppointments();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-neutral-300" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-900">Agenda</h2>
          <p className="text-sm text-neutral-500">Gerencie seus horários e atendimentos</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="w-full sm:w-auto px-4 py-3 sm:py-2 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-all text-sm font-bold sm:font-medium shadow-sm transition-all"
          style={{ backgroundColor: primaryColor, color: secondaryColor }}
        >
          <Plus size={18} />
          Novo Agendamento
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {appointments.length === 0 ? (
          <div className="bg-white border border-dashed border-neutral-200 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
            <CalendarIcon size={48} className="text-neutral-200 mb-4" />
            <p className="text-neutral-500 font-medium">Nenhum agendamento encontrado</p>
            <p className="text-neutral-400 text-sm mt-1">Comece criando um novo agendamento para hoje.</p>
          </div>
        ) : (
          appointments.map((appointment) => (
            <motion.div 
              key={appointment.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-4 sm:p-5 rounded-2xl border border-neutral-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-neutral-50 rounded-xl flex items-center justify-center text-neutral-400 flex-shrink-0">
                  <Clock size={18} className="sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-bold text-neutral-900 text-sm sm:text-base">
                      {new Date(appointment.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-[10px] sm:text-xs font-medium text-neutral-400">
                      ({new Date(appointment.date).toLocaleDateString('pt-BR')})
                    </span>
                    <span className="hidden sm:inline text-neutral-300">|</span>
                    <span className="text-xs sm:text-sm font-medium text-neutral-600 truncate">{appointment.serviceName}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <div className="flex items-center gap-1 text-[10px] sm:text-xs text-neutral-500">
                      <User size={12} className="sm:w-[14px] sm:h-[14px]" />
                      <span className="truncate max-w-[100px] sm:max-w-none">{appointment.customerName}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] sm:text-xs text-neutral-500">
                      <Phone size={12} className="sm:w-[14px] sm:h-[14px]" />
                      <span>{appointment.customerPhone}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] sm:text-xs text-neutral-500">
                      <Scissors size={12} className="opacity-70 sm:w-[14px] sm:h-[14px]" />
                      <span className="truncate max-w-[80px] sm:max-w-none">{appointment.barberName}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t md:border-0 border-neutral-50">
                <span className={`text-[9px] sm:text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-lg ${
                  appointment.status === 'confirmed' ? 'bg-blue-50 text-blue-600' :
                  appointment.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                  appointment.status === 'cancelled' ? 'bg-red-50 text-red-600' :
                  'bg-neutral-50 text-neutral-600'
                }`}>
                  {appointment.status === 'confirmed' ? 'Confirmado' :
                   appointment.status === 'completed' ? 'Concluído' :
                   appointment.status === 'cancelled' ? 'Cancelado' : 'Pendente'}
                </span>

                <div className="flex items-center gap-1">
                  {(appointment.status === 'confirmed' || appointment.status === 'completed') && (
                    <>
                      <button 
                        onClick={() => setRescheduleData(appointment)}
                        className="p-1.5 sm:p-2 text-neutral-400 hover:bg-neutral-50 hover:text-neutral-900 rounded-lg transition-colors"
                        title="Editar/Reagendar"
                      >
                        <Edit2 size={14} className="sm:w-4 sm:h-4" />
                      </button>
                      {appointment.status === 'confirmed' && (
                        <button 
                          onClick={() => handleStatusChange(appointment.id, 'completed')}
                          className="p-1.5 sm:p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Concluir Atendimento"
                        >
                          <Check size={16} className="sm:w-[18px] sm:h-[18px]" />
                        </button>
                      )}
                    </>
                  )}
                  {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                    <button 
                      onClick={() => handleStatusChange(appointment.id, 'cancelled')}
                      className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Cancelar"
                    >
                      <X size={16} className="sm:w-[18px] sm:h-[18px]" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <NewAppointmentModal 
            onClose={() => setShowModal(false)} 
            onSuccess={() => {
              setShowModal(false);
              fetchAppointments();
            }} 
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
          />
        )}
        {rescheduleData && (
          <RescheduleModal
            appointment={rescheduleData}
            onClose={() => setRescheduleData(null)}
            onSuccess={() => {
              setRescheduleData(null);
              fetchAppointments();
            }}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function RescheduleModal({ appointment, onClose, onSuccess, primaryColor, secondaryColor }: { appointment: any, onClose: () => void, onSuccess: () => void, primaryColor: string, secondaryColor: string }) {
  const [services, setServices] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    date: new Date(appointment.date).toISOString().split('T')[0],
    time: new Date(appointment.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false }),
    serviceId: appointment.serviceId
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.services.list().then(setServices);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const dateTime = `${formData.date}T${formData.time}:00`;
      await api.appointments.reschedule(appointment.id, dateTime, formData.serviceId);
      onSuccess();
    } catch (err: any) {
      console.error(err);
      if (err.status === 409) {
        setError(err.message || "Este horário já está ocupado ou conflita com outro agendamento.");
      } else {
        setError("Erro ao reagendar atendimento. Tente novamente.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white w-full max-w-sm rounded-3xl shadow-2xl relative z-10 overflow-hidden"
      >
        <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
          <h3 className="font-bold text-neutral-900">Reagendar Atendimento</h3>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-full text-neutral-400">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl flex items-start gap-2 text-xs font-medium leading-relaxed">
                  <X size={14} className="mt-0.5 flex-shrink-0" />
                  {error}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div>
            <p className="text-xs text-neutral-500 mb-4 bg-neutral-50 p-3 rounded-xl">
              Alterando horário de: <span className="font-bold text-neutral-900">{appointment.customerName}</span>
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Serviço</label>
            <select 
              required
              value={formData.serviceId}
              onChange={e => setFormData({...formData, serviceId: e.target.value})}
              className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 outline-none appearance-none"
            >
              {services.map(s => (
                <option key={s.id} value={s.id}>{s.name} - R$ {(s.price || 0).toFixed(2)}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Nova Data</label>
            <input 
              type="date"
              required
              value={formData.date}
              min={new Date().toISOString().split('T')[0]}
              onChange={e => setFormData({...formData, date: e.target.value})}
              className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Novo Horário</label>
            <input 
              type="time"
              required
              value={formData.time}
              onChange={e => setFormData({...formData, time: e.target.value})}
              className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 outline-none"
            />
          </div>
          <button 
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 mt-4"
            style={{ backgroundColor: primaryColor, color: secondaryColor }}
          >
            {isLoading ? <Loader2 className="animate-spin" size={18} /> : "Confirmar Alteração"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function NewAppointmentModal({ onClose, onSuccess, primaryColor, secondaryColor }: { onClose: () => void, onSuccess: () => void, primaryColor: string, secondaryColor: string }) {
  const [services, setServices] = useState<any[]>([]);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    serviceId: "",
    userId: "",
    date: "",
    time: "",
  });
  const [barbers, setBarbers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = () => api.services.list().then(setServices);
  const fetchBarbers = () => api.users.list().then((data) => {
    // Filter only barbers or admins
    setBarbers(data);
    // Auto-select if there's only one barber
    if (data.length === 1) {
      setFormData(prev => ({ ...prev, userId: data[0].id }));
    }
  });

  useEffect(() => {
    api.services.list().then(data => {
      setServices(data);
      if (data.length === 1) {
        setFormData(prev => ({ ...prev, serviceId: data[0].id }));
      }
    });
    fetchBarbers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const dateTime = `${formData.date}T${formData.time}:00`;
      
      const finalData = { ...formData, date: dateTime };
      
      // Auto-pick if not set (since we removed the UI fields)
      if (!finalData.serviceId && services.length > 0) {
        finalData.serviceId = services[0].id;
      }
      if (!finalData.userId && barbers.length > 0) {
        finalData.userId = barbers[0].id;
      }

      await api.appointments.create(finalData);
      onSuccess();
    } catch (err: any) {
      console.error(err);
      if (err.status === 409) {
        setError(err.message || "Este horário já está ocupado ou conflita com outro agendamento.");
      } else {
        setError("Erro ao criar agendamento. Tente novamente.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm"
      />
      
      <AnimatePresence>
        {showServiceModal && (
          <ManageServicesModal 
            onClose={() => setShowServiceModal(false)}
            onSuccess={() => {
              setShowServiceModal(false);
              fetchServices();
            }}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
          />
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl relative z-10 overflow-hidden"
      >
        <div className="p-6 border-b border-neutral-100 flex items-center justify-between bg-white sticky top-0">
          <h3 className="text-xl font-bold text-neutral-900">Novo Agendamento</h3>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-full transition-colors text-neutral-400">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl flex items-start gap-3 text-sm font-medium leading-relaxed">
                  <X size={18} className="mt-0.5 flex-shrink-0" />
                  <p>{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Cliente</label>
              <input 
                required
                value={formData.customerName}
                onChange={e => setFormData({...formData, customerName: e.target.value})}
                placeholder="Nome do cliente"
                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Telefone</label>
              <input 
                required
                value={formData.customerPhone}
                onChange={e => setFormData({...formData, customerPhone: formatPhone(e.target.value)})}
                placeholder="(00) 00000-0000"
                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Data</label>
              <input 
                type="date"
                required
                value={formData.date}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setFormData({...formData, date: e.target.value})}
                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Horário</label>
              <input 
                type="time"
                required
                value={formData.time}
                onChange={e => setFormData({...formData, time: e.target.value})}
                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Serviço</label>
              <select 
                required
                value={formData.serviceId}
                onChange={e => setFormData({...formData, serviceId: e.target.value})}
                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 outline-none appearance-none transition-all"
              >
                <option value="">Selecione o serviço</option>
                {services.map(s => (
                  <option key={s.id} value={s.id}>{s.name} (R$ {(s.price || 0).toFixed(2)})</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Profissional</label>
              <select 
                required
                value={formData.userId}
                onChange={e => setFormData({...formData, userId: e.target.value})}
                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 outline-none appearance-none transition-all"
              >
                <option value="">Selecione o barbeiro</option>
                {barbers.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-4">
            <button 
              type="submit"
              disabled={isLoading || services.length === 0 || !isValidPhone(formData.customerPhone)}
              className="w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
              style={{ backgroundColor: primaryColor, color: secondaryColor }}
            >
              {isLoading ? <Loader2 className="animate-spin" /> : "Agendar Agora"}
            </button>
            {services.length === 0 && (
              <p className="text-[10px] text-red-500 text-center mt-2 font-medium uppercase">
                Cadastre pelo menos um serviço antes de agendar
              </p>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function ManageServicesModal({ onClose, onSuccess, primaryColor, secondaryColor }: { onClose: () => void, onSuccess: () => void, primaryColor: string, secondaryColor: string }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("30");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.services.create({
        name,
        price: Number(price),
        duration: Number(duration)
      });
      onSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-neutral-900/60 backdrop-blur-md" onClick={onClose} />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-sm rounded-3xl shadow-2xl relative z-10 p-8"
      >
        <h4 className="text-lg font-bold text-neutral-900 mb-6">Novo Serviço</h4>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-neutral-400 uppercase">Nome do Serviço</label>
            <input 
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Corte de Cabelo"
              className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-neutral-400 uppercase">Preço (R$)</label>
              <input 
                required
                type="number"
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-neutral-400 uppercase">Duração (min)</label>
              <input 
                required
                type="number"
                value={duration}
                onChange={e => setDuration(e.target.value)}
                className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl outline-none"
              />
            </div>
          </div>
          <button 
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl font-bold mt-4 flex items-center justify-center gap-2 hover:opacity-90 transition-all"
            style={{ backgroundColor: primaryColor, color: secondaryColor }}
          >
            {isLoading ? <Loader2 className="animate-spin" size={18} /> : "Salvar Serviço"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
