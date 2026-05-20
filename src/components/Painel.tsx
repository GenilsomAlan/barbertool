import React, { useState, useEffect } from "react";
import { api } from "../services/api.ts";
import { Calendar, TrendingUp, Users, Loader2, ArrowUpRight, ArrowDownRight, Bell, CheckCircle, XCircle, Layers, Clock, Lock, Zap } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { exportMultiSheetToExcel } from "../utils/export";

export default function Painel({ barbershopName, primaryColor, secondaryColor, subscriptionStatus }: { barbershopName: string, primaryColor: string, secondaryColor: string, subscriptionStatus: string }) {
  const [stats, setStats] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      const { checkoutUrl } = await api.payments.createCheckout();
      window.open(checkoutUrl, "_blank");
    } catch (err) {
      console.error(err);
      alert("Erro ao gerar checkout. Verifique sua conexão.");
    } finally {
      setIsUpgrading(false);
    }
  };
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  const handleUnifiedExport = async () => {
    setExporting('unified');
    try {
      const apps = await api.appointments.list();
      
      // Sheet 1: Agendamentos
      const appointmentsData = apps.map((a: any) => {
        const dateStr = a.date.endsWith('Z') ? a.date.slice(0, -1) : a.date;
        const d = new Date(dateStr);
        return {
          ID: a.id,
          Cliente: a.customerName,
          Telefone: a.customerPhone,
          Data: d.toLocaleDateString('pt-BR'),
          Hora: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          Servico: a.serviceName,
          Preço: a.servicePrice || 0,
          Status: a.status
        };
      });

      // Sheet 2: Clientes
      const customerMap = new Map();
      apps.forEach((a: any) => {
        if (!customerMap.has(a.customerPhone)) {
          customerMap.set(a.customerPhone, {
            Nome: a.customerName,
            Telefone: a.customerPhone,
            Agendamentos: 0,
            TotalGasto: 0
          });
        }
        const c = customerMap.get(a.customerPhone);
        const price = Number(a.servicePrice) || 0;
        c.Agendamentos += 1;
        c.TotalGasto += price;
      });
      const customersData = Array.from(customerMap.values());

      // Sheet 3: Faturamento
      const revenueMap = new Map();
      apps.forEach((a: any) => {
        const dateStr = a.date.endsWith('Z') ? a.date.slice(0, -1) : a.date;
        const d = new Date(dateStr);
        const monthYear = d.toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' });
        if (!revenueMap.has(monthYear)) {
          revenueMap.set(monthYear, {
            Mes: monthYear,
            Faturamento: 0,
            Agendamentos: 0
          });
        }
        const r = revenueMap.get(monthYear);
        const price = Number(a.servicePrice) || 0;
        r.Faturamento += price;
        r.Agendamentos += 1;
      });
      const revenueData = Array.from(revenueMap.values());

      exportMultiSheetToExcel([
        { name: "Agendamentos", data: appointmentsData },
        { name: "Clientes", data: customersData },
        { name: "Faturamento", data: revenueData }
      ], "relatorio-unificado-barbearia");

    } catch (error) {
      console.error("Export error:", error);
      alert("Erro ao exportar relatório unificado.");
    } finally {
      setExporting(null);
    }
  };

  const notifiedIds = React.useRef<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isMounted, setIsMounted] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const syncPermission = () => {
      if (typeof Notification !== 'undefined') {
        setNotificationPermission(Notification.permission);
      }
    };

    window.addEventListener('focus', syncPermission);
    syncPermission(); // Initial sync

    const fetchData = () => {
      Promise.all([
        api.stats.get(selectedDate).catch(err => {
          if (err.status === 403) setErrorStatus(403);
          throw err;
        }),
        api.notifications.list()
      ])
        .then(([statsData, notifs]) => {
          setStats(statsData);
          setErrorStatus(null);
          // Native Notification Logic
          if (notifs.length > 0) {
            const latest = notifs[0];
            if (!latest.isRead && !notifiedIds.current.has(latest.id)) {
              if (Notification.permission === 'granted' && isMounted) {
                new Notification(latest.title, {
                  body: latest.message,
                  icon: '/favicon.ico'
                });
              }
              notifiedIds.current.add(latest.id);
            }
          }
          
          setNotifications(notifs);
        })
        .catch(console.error)
        .finally(() => {
          setLoading(false);
          if (!isMounted) setTimeout(() => setIsMounted(true), 100);
        });
    };

    fetchData();
    const interval = setInterval(fetchData, 10000); // Poll every 10 seconds for real-time feel
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', syncPermission);
    };
  }, [selectedDate, isMounted]);

  const requestNotificationPermission = async () => {
    if (typeof Notification === 'undefined') return;
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      
      if (permission === 'denied' && window.self !== window.top) {
        // Helpful tip for iframes
        console.log("Permission denied. Try opening the app in a new tab to manage permissions.");
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
    }
  };

  if (loading && !stats) return (
    <div className="flex justify-center p-12">
      <Loader2 className="animate-spin text-neutral-300" />
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4"
        >
          {stats?.barbershopLogo && (
            <img 
              src={stats.barbershopLogo} 
              alt={barbershopName} 
              className="w-16 h-16 rounded-2xl object-cover border border-neutral-100 shadow-sm hidden sm:block"
              referrerPolicy="no-referrer"
            />
          )}
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Olá, Admin!</h1>
            <p className="text-neutral-500 mt-1">Veja o que está acontecendo na {barbershopName} hoje.</p>
          </div>
        </motion.div>

        <div className="flex flex-col items-end gap-2">
          {subscriptionStatus === 'trial' && (
            <div className="bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Período de Teste Ativo</span>
            </div>
          )}
          {subscriptionStatus === 'premium' && (
            <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full flex items-center gap-2">
              <Zap size={12} className="text-emerald-500 fill-emerald-500" />
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Plano Premium</span>
            </div>
          )}
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-neutral-200 shadow-sm">
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-sm font-medium text-neutral-700 outline-none px-3 py-1.5 bg-transparent"
            />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {stats?.nextAppointment && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white p-5 sm:p-6 rounded-[2rem] border border-neutral-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-500 hidden sm:block">
              <Clock size={140} />
            </div>
            
            <div className="flex items-center gap-4 sm:gap-5 relative z-10 w-full sm:w-auto">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg" style={{ backgroundColor: primaryColor }}>
                <Clock className="w-7 h-7 sm:w-8 sm:h-8" style={{ color: secondaryColor }} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Próximo na Agenda</p>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">{stats.nextAppointment.customerName}</h3>
                <p className="text-sm text-neutral-500 font-medium truncate max-w-[200px] sm:max-w-none">
                  {stats.nextAppointment.serviceName} <span className="mx-2 text-neutral-300">•</span> {stats.nextAppointment.barberName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-8 sm:gap-12 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 md:border-l border-neutral-100 pt-5 md:pt-0 md:pl-12 relative z-10">
              <div className="text-left md:text-right">
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Horário</p>
                <p className="text-2xl sm:text-3xl font-black text-neutral-900 tabular-nums">
                  {new Date(stats.nextAppointment.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className="text-left md:text-right">
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Data</p>
                <p className="text-xl sm:text-2xl font-bold text-neutral-400 tabular-nums">
                  {new Date(stats.nextAppointment.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <StatCard 
          label="Agendamentos" 
          value={errorStatus === 403 ? "---" : (stats?.appointmentsCount || 0)} 
          icon={<Calendar size={20} />}
          trend={errorStatus === 403 ? "0%" : `${(stats?.appointmentsTrend || 0) > 0 ? "+" : ""}${(stats?.appointmentsTrend || 0).toFixed(0)}%`} 
          positive={errorStatus === 403 ? true : (stats?.appointmentsTrend >= 0)}
        />
        <StatCard 
          label="Faturamento Previsto" 
          value={errorStatus === 403 ? "R$ ---" : `R$ ${(stats?.estimatedRevenue || 0).toFixed(2)}`} 
          icon={<TrendingUp size={20} />}
          trend={errorStatus === 403 ? "0%" : `${(stats?.revenueTrend || 0) > 0 ? "+" : ""}${(stats?.revenueTrend || 0).toFixed(0)}%`} 
          positive={errorStatus === 403 ? true : (stats?.revenueTrend >= 0)}
        />
        <StatCard 
          label="Novos Clientes" 
          value={errorStatus === 403 ? "---" : (stats?.newCustomersCount || 0)} 
          icon={<Users size={20} />}
          trend={errorStatus === 403 ? "0%" : `${(stats?.customersTrend || 0) > 0 ? "+" : ""}${(stats?.customersTrend || 0).toFixed(0)}%`} 
          positive={errorStatus === 403 ? true : (stats?.customersTrend >= 0)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-5 sm:p-8 rounded-3xl border border-neutral-100 shadow-sm overflow-hidden relative">
            {errorStatus === 403 && (
              <div className="absolute inset-0 z-20 backdrop-blur-[6px] bg-white/40 flex items-center justify-center p-8 text-center">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="max-w-xs bg-white p-8 rounded-[2.5rem] shadow-2xl border border-neutral-100 flex flex-col items-center gap-4"
                >
                  <div className="w-14 h-14 bg-neutral-900 rounded-2xl flex items-center justify-center text-white shadow-lg mb-2">
                    <Lock size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900">Plano Premium</h3>
                  <p className="text-sm text-neutral-500 leading-relaxed">Seu Trial expirou. Assine o plano Premium para desbloquear estatísticas e relatórios avançados.</p>
                  <button 
                    className="w-full py-4 bg-neutral-900 text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-neutral-900/20 disabled:opacity-50"
                    onClick={handleUpgrade}
                    disabled={isUpgrading}
                  >
                    {isUpgrading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Atualizar Agora"}
                  </button>
                </motion.div>
              </div>
            )}
            <div className={`flex items-center justify-between mb-8 ${errorStatus === 403 ? 'blur-[2px] opacity-40' : ''}`}>
              <div>
                <h3 className="font-bold text-lg text-neutral-900">Movimentação da Agenda</h3>
                <p className="text-sm text-neutral-500">Fluxo de atendimentos nos últimos 7 dias</p>
              </div>
            </div>

            <div className={`h-[300px] w-full overflow-hidden ${errorStatus === 403 ? 'blur-[2px] opacity-20' : ''}`}>
              {isMounted && stats?.chartData && stats.chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300} minWidth={0}>
                  <AreaChart data={stats.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={primaryColor} stopOpacity={0.1}/>
                        <stop offset="95%" stopColor={primaryColor} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: '#A3A3A3' }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: '#A3A3A3' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '16px', 
                        border: 'none', 
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                        padding: '12px'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke={primaryColor} 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorValue)" 
                      animationDuration={1500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center gap-2 text-neutral-300 h-full justify-center">
                  <Loader2 className="animate-spin w-5 h-5" />
                  <span className="text-xs font-medium">Renderizando gráfico...</span>
                </div>
              )}
            </div>
          </div>

              <div className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm relative overflow-hidden">
                {(errorStatus === 403 || subscriptionStatus === 'free_restricted') && (
                  <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                       <div className="flex items-center gap-2 text-neutral-400 font-bold uppercase tracking-widest text-[10px]">
                        <Lock size={12} />
                        Recurso Bloqueado
                      </div>
                      <button 
                        onClick={handleUpgrade}
                        className="px-4 py-2 bg-neutral-900 text-white text-[10px] font-bold rounded-lg uppercase tracking-wider"
                      >
                         Vire Premium para Exportar
                      </button>
                    </div>
                  </div>
                )}
                <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${(errorStatus === 403 || subscriptionStatus === 'free_restricted') ? 'opacity-30 blur-[1px]' : ''}`}>
                  <div className="text-center sm:text-left">
                    <h3 className="text-lg sm:text-xl font-bold text-neutral-900 mb-1">Relatórios & Exportação</h3>
                    <p className="text-neutral-400 text-xs sm:text-sm">Baixe seus dados unificados da barbearia</p>
                  </div>
                  <button 
                    onClick={handleUnifiedExport}
                    disabled={exporting === 'unified' || errorStatus === 403 || subscriptionStatus === 'free_restricted'}
                    className="w-full sm:w-auto px-6 py-3.5 sm:py-3 rounded-2xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                    style={{ backgroundColor: primaryColor, color: secondaryColor }}
                  >
                    {exporting === 'unified' ? <Loader2 size={16} className="animate-spin" /> : <Layers size={16} />}
                    <span className="truncate">Exportar Relatório (Excel)</span>
                  </button>
                </div>
            </div>

            <div className="bg-neutral-900 p-8 rounded-3xl text-white relative overflow-hidden" style={{ backgroundColor: primaryColor }}>
            <div className="relative z-10 max-w-lg">
              <h3 className="text-xl font-bold mb-2" style={{ color: secondaryColor }}>Dica de Performance</h3>
              <p className="text-sm leading-relaxed" style={{ color: `${secondaryColor}b3` }}>
                Baseado no seu fluxo médio de terça-feira, recomendamos abrir horários extras entre 18:00 e 20:00 para maximizar sua agenda de amanhã.
              </p>
            </div>
            <div className="absolute top-0 right-0 p-8 opacity-10" style={{ color: secondaryColor }}>
              <TrendingUp size={120} />
            </div>
          </div>
        </div>

        {/* Sidebar Column: Notifications */}
        <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-neutral-900 flex items-center gap-2">
                <Bell size={18} className="text-neutral-400" />
                Notificações
              </h3>
              {notifications.length > 0 && (
                <button 
                  onClick={() => api.notifications.clearAll().then(() => api.notifications.list().then(setNotifications))}
                  className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest hover:text-neutral-900 transition-colors"
                >
                  Limpar Tudo
                </button>
              )}
            </div>

            {notificationPermission !== 'granted' && (
              <div className="space-y-2">
                <button 
                  onClick={requestNotificationPermission}
                  className={`w-full py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2 ${
                    notificationPermission === 'denied' 
                    ? 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200' 
                    : 'hover:opacity-90'
                  }`}
                  style={notificationPermission !== 'denied' ? { backgroundColor: primaryColor, color: secondaryColor } : {}}
                >
                  <Bell size={12} />
                  {notificationPermission === 'denied' ? 'Re-tentar Permissão' : 'Ativar Alertas no Desktop'}
                </button>
                {notificationPermission === 'denied' ? (
                  <p className="text-[9px] text-red-500 text-center leading-tight font-medium px-2">
                    Notificações bloqueadas no navegador. Clique acima ou verifique o cadeado na barra de endereço para liberar.
                  </p>
                ) : (
                  window.self !== window.top && (
                    <p className="text-[9px] text-emerald-600 font-medium text-center leading-tight px-2">
                      Dica: Abra o site em uma nova aba para garantir que os alertas funcionem corretamente.
                    </p>
                  )
                )}
              </div>
            )}
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <div className="w-12 h-12 bg-neutral-50 rounded-2xl flex items-center justify-center mx-auto text-neutral-200">
                    <Bell size={24} />
                </div>
                <p className="text-xs text-neutral-400 font-medium">Nenhuma atividade recente</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`p-4 rounded-2xl border transition-all ${
                    notification.isRead ? 'bg-white border-neutral-50 opacity-60' : 'bg-neutral-50 border-neutral-100'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      notification.type === 'appointment_new' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                    }`}>
                      {notification.type === 'appointment_new' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-neutral-900">{notification.title}</p>
                      <p className="text-[11px] text-neutral-500 leading-normal">{notification.message}</p>
                      <p className="text-[10px] text-neutral-400 font-medium">
                        {new Date(notification.createdAt.endsWith('Z') ? notification.createdAt.slice(0, -1) : notification.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, trend, positive }: { label: string; value: any; icon: any; trend: string; positive: boolean }) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm hover:border-neutral-200 transition-all group">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 bg-neutral-50 rounded-2xl flex items-center justify-center text-neutral-400 group-hover:bg-neutral-900 group-hover:text-white transition-all">
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${
          positive ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'
        }`}>
          {positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {trend}
        </div>
      </div>
      <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">{label}</p>
      <span className="text-2xl font-bold text-neutral-900 tracking-tight">{value}</span>
    </div>
  );
}
