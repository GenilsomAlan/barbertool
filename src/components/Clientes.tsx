import React, { useState, useEffect } from "react";
import { api } from "../services/api.ts";
import { User, Phone, Mail, Calendar, TrendingUp, History, Loader2, Search, ArrowRight, X, Edit2, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function Clientes({ primaryColor, secondaryColor }: { primaryColor: string, secondaryColor: string }) {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = () => {
    setLoading(true);
    api.customers.list()
      .then(setCustomers)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleViewHistory = async (customer: any) => {
    setSelectedCustomer(customer);
    setHistoryLoading(true);
    try {
      const data = await api.customers.history(customer.id);
      setHistory(data.history);
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      await api.customers.update(editingCustomer.id, {
        name: editingCustomer.name,
        phone: editingCustomer.phone,
        email: editingCustomer.email,
      });
      setEditingCustomer(null);
      fetchCustomers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  );

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-neutral-300" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-900">Clientes</h2>
          <p className="text-sm text-neutral-500">Gerencie sua base de clientes e histórico</p>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
          <input 
            type="text"
            placeholder="Buscar por nome ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 bg-white border border-neutral-200 rounded-xl text-sm focus:ring-2 outline-none w-full md:w-64 transition-all"
            style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden shadow-sm">
        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-100">
                <th className="px-6 py-4 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-4 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Contato</th>
                <th className="px-6 py-4 text-[10px] font-bold text-neutral-400 uppercase tracking-wider text-center">Visitas</th>
                <th className="px-6 py-4 text-[10px] font-bold text-neutral-400 uppercase tracking-wider text-right">Total Gasto</th>
                <th className="px-6 py-4 text-[10px] font-bold text-neutral-400 uppercase tracking-wider text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-neutral-500">
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-neutral-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-500 font-bold text-xs">
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-neutral-900">{customer.name}</p>
                          <p className="text-[10px] text-neutral-400 uppercase tracking-tighter">
                            Última visita: {customer.lastVisit ? new Date(customer.lastVisit).toLocaleDateString() : 'Nuca'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-600">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <Phone size={12} className="text-neutral-300" />
                          <span>{customer.phone}</span>
                        </div>
                        {customer.email && (
                          <div className="flex items-center gap-2">
                            <Mail size={12} className="text-neutral-300" />
                            <span>{customer.email}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-neutral-100 text-neutral-700 rounded-lg text-xs font-bold">
                        {customer.appointmentsCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-bold text-neutral-900">
                          R$ {(customer.totalSpent || 0).toFixed(2)}
                        </span>
                        <TrendingUp size={12} className="text-emerald-500" />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setEditingCustomer({...customer})}
                          className="text-neutral-400 hover:text-neutral-900 p-2 hover:bg-neutral-100 rounded-lg transition-all"
                          title="Editar Cliente"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleViewHistory(customer)}
                          className="text-neutral-400 hover:text-neutral-900 p-2 hover:bg-neutral-100 rounded-lg transition-all"
                          title="Ver Histórico"
                        >
                          <ArrowRight size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile/Tablet Card View */}
        <div className="lg:hidden divide-y divide-neutral-100">
          {filteredCustomers.length === 0 ? (
            <div className="p-12 text-center text-neutral-500">
              Nenhum cliente encontrado.
            </div>
          ) : (
            filteredCustomers.map((customer) => (
              <div key={customer.id} className="p-5 space-y-4 hover:bg-neutral-50/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-500 font-bold text-sm">
                      {customer.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-neutral-900">{customer.name}</p>
                      <p className="text-[10px] text-neutral-400 uppercase tracking-tighter">
                        Visto em: {customer.lastVisit ? new Date(customer.lastVisit).toLocaleDateString() : 'Nuca'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => setEditingCustomer({...customer})}
                      className="p-2 text-neutral-400 hover:text-neutral-900 rounded-lg transition-all"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleViewHistory(customer)}
                      className="p-2 text-neutral-400 hover:text-neutral-900 rounded-lg transition-all"
                    >
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-neutral-50">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Contato</p>
                    <p className="text-xs text-neutral-600 truncate">{customer.phone}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Visitas</p>
                    <p className="text-xs font-bold text-neutral-900">{customer.appointmentsCount}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Faturamento</p>
                    <p className="text-xs font-bold text-emerald-600">R$ {(customer.totalSpent || 0).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <AnimatePresence>
        {editingCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingCustomer(null)}
              className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-sm rounded-3xl shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
                <h3 className="font-bold text-neutral-900">Editar Cliente</h3>
                <button onClick={() => setEditingCustomer(null)} className="p-2 hover:bg-neutral-100 rounded-full text-neutral-400">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleUpdateCustomer} className="p-6 space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 text-red-600 text-xs font-medium rounded-xl border border-red-100">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Nome Completo</label>
                  <input 
                    type="text"
                    required
                    value={editingCustomer.name}
                    onChange={e => setEditingCustomer({...editingCustomer, name: e.target.value})}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Telefone</label>
                  <input 
                    type="tel"
                    required
                    value={editingCustomer.phone}
                    onChange={e => setEditingCustomer({...editingCustomer, phone: e.target.value})}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">E-mail (Opcional)</label>
                  <input 
                    type="email"
                    value={editingCustomer.email || ""}
                    onChange={e => setEditingCustomer({...editingCustomer, email: e.target.value})}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 outline-none"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-3 rounded-xl font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 mt-4"
                  style={{ backgroundColor: primaryColor, color: secondaryColor }}
                >
                  {isSaving ? <Loader2 className="animate-spin" size={18} /> : "Salvar Alterações"}
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {selectedCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCustomer(null)}
              className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-6 border-b border-neutral-100 bg-white sticky top-0 flex justify-between items-start">
                <div className="flex gap-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold" style={{ backgroundColor: primaryColor, color: secondaryColor }}>
                    {selectedCustomer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-neutral-900">{selectedCustomer.name}</h3>
                    <p className="text-sm text-neutral-500">{selectedCustomer.phone}</p>
                    <div className="flex items-center gap-3 mt-2">
                       <span className="text-[10px] font-bold text-neutral-400 uppercase">Total: R$ {(selectedCustomer.totalSpent || 0).toFixed(2)}</span>
                       <span className="text-neutral-200">|</span>
                       <span className="text-[10px] font-bold text-neutral-400 uppercase">{selectedCustomer.appointmentsCount} Visitas</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedCustomer(null)} className="p-2 hover:bg-neutral-100 rounded-full transition-colors text-neutral-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-auto">
                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <History size={14} />
                  Histórico de Atendimentos
                </h4>

                {historyLoading ? (
                  <div className="flex justify-center p-8"><Loader2 className="animate-spin text-neutral-200" /></div>
                ) : history.length === 0 ? (
                  <p className="text-center py-8 text-neutral-400 text-sm">Nenhum histórico encontrado para este cliente.</p>
                ) : (
                  <div className="space-y-3">
                    {history.map((item) => (
                      <div key={item.id} className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white rounded-xl border border-neutral-100 flex items-center justify-center text-neutral-400">
                            <TrendingUp size={18} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-neutral-900">{item.serviceName}</p>
                            <p className="text-xs text-neutral-400">
                              {new Date(item.date).toLocaleDateString()} às {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-neutral-900">R$ {(item.servicePrice || 0).toFixed(2)}</p>
                          <span className={`text-[9px] font-bold uppercase tracking-tighter px-2 py-0.5 rounded ${
                            item.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-neutral-100 text-neutral-500'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
