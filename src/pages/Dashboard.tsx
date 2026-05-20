import React, { useEffect, useState } from "react";
import { api } from "../services/api.ts";
import { LogOut, Scissors, LayoutDashboard, Calendar, Users, Settings, Building2, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Agenda from "../components/Agenda.tsx";
import Clientes from "../components/Clientes.tsx";
import Painel from "../components/Painel.tsx";
import Configuracoes from "../components/Configuracoes.tsx";
import Tutorial from "../components/Tutorial.tsx";
import AdBanner from "../components/AdBanner.tsx";
import { BookOpen } from "lucide-react";

type Tab = "painel" | "agenda" | "clientes" | "unidade" | "config" | "tutorial";

export default function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [barbershop, setBarbershop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("painel");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    api.barbershop.me()
      .then(setBarbershop)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 font-sans">
      <div className="animate-pulse flex flex-col items-center">
        <Scissors className="w-8 h-8 text-neutral-300 mb-2" />
        <p className="text-neutral-400 text-sm">Carregando...</p>
      </div>
    </div>
  );

  const refreshBarbershop = () => {
    api.barbershop.me()
      .then(setBarbershop)
      .catch(console.error);
  };

  const primaryColor = barbershop?.primaryColor || "#171717"; // fallback to neutral-900
  const secondaryColor = barbershop?.secondaryColor || "#ffffff";

  const toggleTab = (tab: Tab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "agenda":
        return <Agenda primaryColor={primaryColor} secondaryColor={secondaryColor} />;
      case "clientes":
        return <Clientes primaryColor={primaryColor} secondaryColor={secondaryColor} />;
      case "config":
        return <Configuracoes onUpdate={refreshBarbershop} />;
      case "tutorial":
        return <Tutorial primaryColor={primaryColor} secondaryColor={secondaryColor} />;
      case "unidade":
        return (
          <div className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm text-center py-20">
            <Building2 className="w-12 h-12 text-neutral-200 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-neutral-900">Gerenciamento de Unidade</h3>
            <p className="text-neutral-500 max-w-xs mx-auto">Em breve você poderá gerenciar múltiplas unidades e filiais por aqui.</p>
          </div>
        );
      case "painel":
      default:
        return <Painel 
          barbershopName={barbershop?.name} 
          primaryColor={primaryColor} 
          secondaryColor={secondaryColor} 
          subscriptionStatus={barbershop?.subscriptionStatus || 'trial'} 
        />;
    }
  };

  const navItems = [
    { id: "painel", icon: <LayoutDashboard size={18} />, label: "Painel" },
    { id: "agenda", icon: <Calendar size={18} />, label: "Agenda" },
    { id: "clientes", icon: <Users size={18} />, label: "Clientes" },
    { id: "unidade", icon: <Building2 size={18} />, label: "Unidade" },
    { id: "config", icon: <Settings size={18} />, label: "Configurações" },
    { id: "tutorial", icon: <BookOpen size={18} />, label: "Tutorial" },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 flex font-sans overflow-hidden">
      {/* Sidebar Desktop */}
      <aside className="w-64 bg-white border-r border-neutral-100 flex flex-col hidden lg:flex flex-shrink-0">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            {barbershop?.logoUrl ? (
              <img 
                src={barbershop.logoUrl} 
                alt={barbershop.name} 
                className="w-10 h-10 rounded-xl object-cover border border-neutral-100"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: primaryColor }}>
                <Scissors className="w-4 h-4" style={{ color: secondaryColor }} />
              </div>
            )}
            <span className="font-bold text-neutral-900 tracking-tight">BarberTool</span>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavItem 
                key={item.id}
                icon={item.icon} 
                label={item.label} 
                active={activeTab === item.id} 
                onClick={() => toggleTab(item.id as Tab)}
                primaryColor={primaryColor}
                secondaryColor={secondaryColor}
              />
            ))}
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-neutral-100">
          <button 
            onClick={onLogout}
            className="flex items-center gap-3 text-neutral-500 hover:text-red-600 transition-colors w-full"
          >
            <LogOut size={18} />
            <span className="text-sm font-medium">Sair</span>
          </button>
        </div>
      </aside>

      {/* Mobile Menu Backdrop */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm z-[60] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.aside 
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 w-72 bg-white z-[70] lg:hidden flex flex-col shadow-2xl"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: primaryColor }}>
                    <Scissors className="w-4 h-4" style={{ color: secondaryColor }} />
                  </div>
                  <span className="font-bold text-neutral-900 tracking-tight">BarberTool</span>
                </div>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 hover:bg-neutral-100 rounded-xl transition-colors"
                >
                  <X size={20} className="text-neutral-500" />
                </button>
              </div>

              <nav className="space-y-1">
                {navItems.map((item) => (
                  <NavItem 
                    key={item.id}
                    icon={item.icon} 
                    label={item.label} 
                    active={activeTab === item.id} 
                    onClick={() => toggleTab(item.id as Tab)}
                    primaryColor={primaryColor}
                    secondaryColor={secondaryColor}
                  />
                ))}
              </nav>
            </div>

            <div className="mt-auto p-6 border-t border-neutral-100">
              <button 
                onClick={onLogout}
                className="flex items-center gap-3 text-neutral-500 hover:text-red-600 transition-colors w-full"
              >
                <LogOut size={18} />
                <span className="text-sm font-medium">Sair da Conta</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-white border-b border-neutral-100 flex items-center justify-between px-4 md:px-8 flex-shrink-0 z-[50]">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 hover:bg-neutral-50 rounded-xl transition-colors"
            >
              <Menu size={20} className="text-neutral-600" />
            </button>
            <h2 className="font-bold text-neutral-800 capitalize tracking-tight text-lg">{activeTab}</h2>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-neutral-900 truncate max-w-[150px]">{barbershop?.name}</p>
              <p className="text-[10px] text-neutral-400 capitalize font-medium">{barbershop?.slug}</p>
            </div>
            {barbershop?.logoUrl ? (
              <img 
                src={barbershop.logoUrl} 
                alt={barbershop.name} 
                className="w-9 h-9 md:w-10 md:h-10 bg-neutral-100 rounded-full border border-neutral-200 object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-9 h-9 md:w-10 md:h-10 bg-neutral-100 rounded-full border border-neutral-200 flex items-center justify-center">
                <Building2 size={18} className="text-neutral-400" />
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-auto bg-neutral-50">
          <div className="p-4 md:p-8 max-w-6xl mx-auto">
            {(barbershop?.subscriptionStatus === 'trial' || barbershop?.subscriptionStatus === 'free_restricted') && (
              <div className="mb-6 md:mb-8">
                <AdBanner subscriptionStatus={barbershop?.subscriptionStatus} />
              </div>
            )}
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
}

const NavItem: React.FC<{ icon: React.ReactNode, label: string, active?: boolean, onClick: () => void, primaryColor: string, secondaryColor: string }> = ({ icon, label, active = false, onClick, primaryColor, secondaryColor }) => {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
        active ? "shadow-md shadow-neutral-900/10" : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900"
      }`}
      style={active ? { backgroundColor: primaryColor, color: secondaryColor } : {}}
    >
      {icon}
      {label}
    </button>
  );
}


function StatCard({ label, value, change }: { label: string; value: string; change: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm">
      <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">{label}</p>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-bold text-neutral-900">{value}</span>
        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">{change}</span>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-neutral-50 last:border-0 hover:bg-neutral-50 transition-colors px-2 rounded-lg">
      <span className="text-sm text-neutral-500 font-medium">{label}</span>
      <span className="text-sm text-neutral-900 font-mono bg-neutral-100 px-2 py-0.5 rounded">{value}</span>
    </div>
  );
}
