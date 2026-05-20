import React from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Scissors, Calendar, BarChart3, Zap, ShieldCheck, CheckCircle2, ArrowRight, Play } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-bottom border-neutral-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-neutral-900 rounded-xl flex items-center justify-center">
              <Scissors className="text-white" size={20} />
            </div>
            <span className="text-xl font-black tracking-tight uppercase">BarberTool</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-bold text-neutral-500 hover:text-neutral-900 transition-colors">Funcionalidades</a>
            <a href="#pricing" className="text-sm font-bold text-neutral-500 hover:text-neutral-900 transition-colors">Preços</a>
            <Link to="/login" className="text-sm font-bold text-neutral-900">Entrar</Link>
            <Link 
              to="/register" 
              className="px-6 py-3 bg-neutral-900 text-white text-xs font-bold rounded-2xl uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-neutral-900/10"
            >
              Começar Agora
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 bg-neutral-100 px-4 py-2 rounded-full mb-6">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-600">Teste Grátis de 21 Dias</span>
              </div>
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-8 uppercase">
                O Futuro da sua <span className="text-neutral-300">Barbearia</span> Começa Aqui.
              </h1>
              <p className="text-xl text-neutral-500 max-w-lg mb-10 leading-relaxed">
                Gestão simplificada, agendamento online e relatórios poderosos. Tudo o que você precisa para escalar seu negócio.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Link 
                  to="/register" 
                  className="w-full sm:w-auto px-10 py-5 bg-neutral-900 text-white font-bold rounded-[2rem] flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-neutral-900/20"
                >
                  Começar 21 Dias Grátis
                  <ArrowRight size={20} />
                </Link>
                <div className="flex items-center gap-4 px-6 py-4">
                   <div className="flex -space-x-4">
                     {[1,2,3,4].map(i => (
                       <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-neutral-200">
                         <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i * 123}`} alt="User" />
                       </div>
                     ))}
                   </div>
                   <div className="text-left">
                     <p className="text-xs font-bold text-neutral-900">+500 Barbearias</p>
                     <p className="text-[10px] text-neutral-400 font-medium">Confiam no BarberTool</p>
                   </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="bg-neutral-100 rounded-[3rem] p-4 relative overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=1000" 
                  alt="Dashboard Preview" 
                  className="rounded-[2.5rem] shadow-2xl"
                />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                   <button className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform cursor-pointer">
                      <Play className="fill-neutral-900 text-neutral-900 ml-1" size={24} />
                   </button>
                </div>
              </div>
              
              {/* Floating Cards */}
              <div className="absolute -bottom-10 -left-10 bg-white p-6 rounded-3xl shadow-2xl border border-neutral-100 hidden md:block">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Sucesso</p>
                    <p className="text-lg font-bold">Agendamento Confirmado</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full w-2/3"></div>
                </div>
              </div>

              <div className="absolute -top-10 -right-10 bg-neutral-900 text-white p-6 rounded-3xl shadow-2xl hidden md:block">
                <div className="flex items-center gap-4">
                   <Zap className="text-yellow-400 fill-yellow-400" />
                   <div>
                     <p className="text-xs opacity-50 uppercase font-black tracking-widest">Faturamento</p>
                     <p className="text-2xl font-bold">+R$ 12.450,00</p>
                   </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-neutral-50 px-6">
        <div className="max-w-7xl mx-auto text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-6">Tudo o que você precisa <br/> para gerenciar sua <span className="text-neutral-400">agenda</span></h2>
          <p className="text-neutral-500 max-w-2xl mx-auto leading-relaxed">
            Desenvolvido por quem entende de barbearia para quem quer crescer de forma organizada e profissional.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {[
            { 
              icon: <Calendar className="text-neutral-900" size={32} />, 
              title: "Agendamento Online", 
              desc: "Seu cliente agenda o próprio horário através de um link personalizado, 24h por dia." 
            },
            { 
              icon: <BarChart3 className="text-neutral-900" size={32} />, 
              title: "Relatórios Inteligentes", 
              desc: "Visualize seu faturamento, novos clientes e tendências com gráficos fáceis de entender." 
            },
            { 
              icon: <ShieldCheck className="text-neutral-900" size={32} />, 
              title: "Gestão Profissional", 
              desc: "Controle serviços, barbeiros e horários de funcionamento com apenas alguns cliques." 
            }
          ].map((feature, i) => (
            <motion.div 
              key={i}
              whileHover={{ y: -10 }}
              className="bg-white p-10 rounded-[2.5rem] border border-neutral-100 shadow-sm"
            >
              <div className="w-16 h-16 bg-neutral-50 rounded-2xl flex items-center justify-center mb-8">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
              <p className="text-neutral-500 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-7xl mx-auto text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-6">Planos Transparentes</h2>
          <p className="text-neutral-500 max-w-2xl mx-auto leading-relaxed">Escolha o melhor plano para o momento atual do seu negócio.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <div className="bg-white p-10 rounded-[3rem] border border-neutral-100 shadow-xl relative overflow-hidden flex flex-col">
            <div className="mb-8">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest block mb-1">Iniciante</span>
              <h3 className="text-3xl font-black uppercase">Grátis para sempre</h3>
            </div>
            
            <div className="text-4xl font-black mb-8">R$ 0<span className="text-sm text-neutral-400">/mês</span></div>
            
            <ul className="space-y-4 mb-10 flex-grow">
              <li className="flex items-center gap-3 text-sm text-neutral-600">
                 <CheckCircle2 size={18} className="text-emerald-500" />
                 Agendamento Manual Interno
              </li>
              <li className="flex items-center gap-3 text-sm text-neutral-600">
                 <CheckCircle2 size={18} className="text-emerald-500" />
                 Gerenciamento de Serviços
              </li>
              <li className="flex items-center gap-3 text-sm text-neutral-400 line-through">
                 Agendamento Via Link Público
              </li>
              <li className="flex items-center gap-3 text-sm text-neutral-400 line-through">
                 Relatórios e Exportação
              </li>
              <li className="flex items-center gap-3 text-sm text-neutral-600">
                 <ShieldCheck size={18} className="text-neutral-400" />
                 Exibição de Anúncios no Painel
              </li>
            </ul>

            <Link 
              to="/register"
              className="w-full py-5 bg-neutral-100 text-neutral-900 font-bold rounded-2xl text-center hover:bg-neutral-200 transition-colors"
            >
              Selecionar Plano Grátis
            </Link>
          </div>

          {/* Premium Plan */}
          <div className="bg-neutral-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden flex flex-col group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
               <Zap size={150} />
            </div>
            
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 bg-neutral-800 px-3 py-1 rounded-full mb-3">
                 <Zap className="text-yellow-400 fill-yellow-400" size={12} />
                 <span className="text-[10px] font-black uppercase tracking-widest">Mais Popular</span>
              </div>
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest block mb-1">Profissional</span>
              <h3 className="text-3xl font-black uppercase">Premium</h3>
            </div>
            
            <div className="text-4xl font-black mb-1 flex items-baseline gap-2">
               R$ 49,90 <span className="text-sm text-neutral-500 font-medium tracking-normal">/mês</span>
            </div>
            <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mb-8">Primeiros 21 dias grátis</p>
            
            <ul className="space-y-4 mb-10 flex-grow">
              <li className="flex items-center gap-3 text-sm">
                 <CheckCircle2 size={18} className="text-emerald-400" />
                 Tudo do plano Grátis
              </li>
              <li className="flex items-center gap-3 text-sm">
                 <CheckCircle2 size={18} className="text-emerald-400" />
                 Link Público para Clientes Agendarem
              </li>
              <li className="flex items-center gap-3 text-sm">
                 <CheckCircle2 size={18} className="text-emerald-400" />
                 Relatórios de Faturamento Avançados
              </li>
              <li className="flex items-center gap-3 text-sm">
                 <CheckCircle2 size={18} className="text-emerald-400" />
                 Zero Anúncios
              </li>
              <li className="flex items-center gap-3 text-sm font-bold text-yellow-400">
                 <CheckCircle2 size={18} />
                 Exportação para Excel (CSV/XLSX)
              </li>
            </ul>

            <Link 
              to="/register"
              className="w-full py-5 bg-white text-neutral-900 font-black rounded-2xl text-center hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Iniciar 21 Dias Trial
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-neutral-100">
        <div className="max-w-7xl mx-auto px-6">
           <div className="flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-neutral-900 rounded-lg flex items-center justify-center">
                  <Scissors className="text-white" size={16} />
                </div>
                <span className="text-lg font-black uppercase">BarberTool</span>
              </div>
              <p className="text-sm text-neutral-400">© 2026 BarberTool. Todos os direitos reservados.</p>
              <div className="flex items-center gap-6">
                 <a href="#" className="text-xs font-bold text-neutral-500 hover:text-neutral-900 transition-colors">Termos</a>
                 <a href="#" className="text-xs font-bold text-neutral-500 hover:text-neutral-900 transition-colors">Privacidade</a>
                 <a href="#" className="text-xs font-bold text-neutral-500 hover:text-neutral-900 transition-colors">Suporte</a>
              </div>
           </div>
        </div>
      </footer>
    </div>
  );
}
