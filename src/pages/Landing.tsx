import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "motion/react";
import { Scissors, Calendar, BarChart3, Zap, ShieldCheck, CheckCircle2, ArrowRight, BookOpen, Clock, Smartphone, TrendingUp, Users } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans overflow-x-hidden">
      <Helmet>
        <title>BarberTool | Sistema de Gestão Inteligente e Agendamento Online para Barbearias</title>
        <meta name="description" content="Potencialize o faturamento da sua barbearia com o BarberTool. Agendamento online prático, controle financeiro completo, comissão de barbeiros e relatórios automatizados." />
        <meta name="keywords" content="sistema de barbearia, software para barbearia, agendamento online de beleza, controle financeiro de salão, comissão de barbeiros" />
        <meta name="robots" content="index, follow" />
      </Helmet>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-neutral-900 rounded-xl flex items-center justify-center">
              <Scissors className="text-white" size={20} />
            </div>
            <span className="text-xl font-black tracking-tight uppercase">BarberTool</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-bold text-neutral-500 hover:text-neutral-900 transition-colors">Funcionalidades</a>
            <a href="#growth-guide" className="text-sm font-bold text-neutral-500 hover:text-neutral-900 transition-colors">Manual de Crescimento</a>
            <a href="#pricing" className="text-sm font-bold text-neutral-500 hover:text-neutral-900 transition-colors">Preços</a>
            <Link to="/blog" className="text-sm font-bold text-neutral-500 hover:text-neutral-900 transition-colors">Blog</Link>
            <Link to="/contact" className="text-sm font-bold text-neutral-500 hover:text-neutral-900 transition-colors">Contato</Link>
            <Link to="/dashboard" className="text-sm font-bold text-neutral-900 hover:underline">Acessar Sistema</Link>
            <Link 
              to="/dashboard" 
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
                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-600">Teste Grátis de 14 Dias</span>
              </div>
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-8 uppercase">
                O Futuro da sua <span className="text-neutral-300">Barbearia</span> Começa Aqui.
              </h1>
              <p className="text-xl text-neutral-500 max-w-lg mb-10 leading-relaxed">
                Gestão simplificada, agendamento online e relatórios poderosos. Tudo o que você precisa para escalar seu negócio de beleza.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Link 
                  to="/dashboard" 
                  className="w-full sm:w-auto px-10 py-5 bg-neutral-900 text-white font-bold rounded-[3rem] flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-neutral-900/20"
                >
                  Começar 14 Dias Grátis
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
                  className="rounded-[2.5rem] shadow-2xl w-full object-cover"
                />
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
          <p className="text-neutral-500 max-w-2xl mx-auto leading-relaxed text-base sm:text-lg">
            Desenvolvido por quem entende de barbearia para quem quer crescer de forma organizada e profissional.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {[
            { 
              icon: <Calendar className="text-neutral-900" size={32} />, 
              title: "Agendamento Online", 
              desc: "Seu cliente agenda o próprio horário através de um link personalizado, 24h por dia, sem precisar ligar ou trocar dezenas de mensagens no WhatsApp." 
            },
            { 
              icon: <BarChart3 className="text-neutral-900" size={32} />, 
              title: "Relatórios Inteligentes", 
              desc: "Visualize seu faturamento, novos clientes e tendências com gráficos fáceis de entender. Mantenha os seus relatórios e exportações sempre atualizados." 
            },
            { 
              icon: <ShieldCheck className="text-neutral-950" size={32} />, 
              title: "Gestão Profissional", 
              desc: "Controle serviços, colaboradores, carteira de clientes, barbeiros parceiros e horários de funcionamento individuais com apenas alguns cliques rápidos." 
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
              <p className="text-neutral-500 leading-relaxed text-sm sm:text-base">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* SEO rich Section: "Manual de Crescimento" (Stage 1 Requirement: long text paragraphs) */}
      <section id="growth-guide" className="py-24 bg-white px-6 border-t border-neutral-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <span className="text-xs font-black uppercase text-neutral-400 tracking-wider">Manual Técnico de Gestão</span>
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-neutral-900">
              Guias de Alta Performance e Crescimento de Barbearias
            </h2>
            <p className="text-neutral-500 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
              Descubra abordagens consolidadas no ramo de estética masculina para otimizar comissões, gerenciar caixa e manter cadeiras sempre ocupadas.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 text-neutral-700 text-sm sm:text-base leading-relaxed space-y-0">
            <div className="space-y-6">
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl bg-neutral-900 shrink-0 flex items-center justify-center text-white font-bold">
                  <TrendingUp size={18} />
                </div>
                <div className="space-y-2">
                  <h3 className="font-extrabold text-neutral-900 text-lg uppercase tracking-tight">Otimização Operacional e Redução de Ociosidade</h3>
                  <p>
                    O maior prejuízo oculto em uma barbearia de médio a grande porte é a ociosidade de cadeiras em dias de menor fluxo, comumente segundas, terças e quartas-feiras. Enquanto nos finais de semana a demanda por corte e barba satura a equipe dos barbeiros, no início da semana os custos fixos continuam vigentes em tempo integral.
                  </p>
                  <p>
                    Com as estatísticas unificadas e dados em mãos no BarberTool, é plenamente viável criar ofertas especiais acionáveis no link de agendamento do cliente, além de realizar disparos com lembretes para aqueles clientes que não efetuaram novos atendimentos nos últimos 30 dias.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start pt-4">
                <div className="w-10 h-10 rounded-xl bg-neutral-900 shrink-0 flex items-center justify-center text-white font-bold">
                  <Users size={18} />
                </div>
                <div className="space-y-2">
                  <h3 className="font-extrabold text-neutral-900 text-lg uppercase tracking-tight">A Arte de Escalar o Faturamento Através do Visagismo</h3>
                  <p>
                    Barbearias modernas deixaram de ser apenas prestadoras de serviços básicos de corte de cabelo industrializado. O visagismo sob medida atrelado à venda consultiva de produtos masculinos como loções hidratantes, ceras de efeito matte e óleos aromatizados constitui um dos maiores canais de elevação de margem líquida.
                  </p>
                  <p>
                    Ao centralizar o prontuário e a ficha de preferências de cada cliente nos registros de nosso sistema SaaS, sua barbearia acumula dados sensoriais que ajudam o barbeiro a surpreender o cliente na próxima visita, oferecendo serviços recorrentes exatamente no ciclo de crescimento dos cabelos.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-neutral-50 rounded-[2.5rem] p-8 sm:p-10 border border-neutral-100 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-neutral-900 rounded-2xl flex items-center justify-center text-white">
                  <BookOpen size={24} />
                </div>
                <h3 className="font-black text-xl uppercase tracking-wider text-neutral-900">Métricas e Controle de Fluxo Financeiro Real</h3>
                <p className="text-neutral-600 text-sm sm:text-base leading-relaxed">
                  Para que uma barbearia se profissionalize e de fato cresça, ela precisa abandonar controles frágeis de papel ou planilhas locais dispersas que são facilmente corrompidas. O acompanhamento em tempo real das receitas, ticket médio e cálculo das comissões geradas por cada funcionário garante transparência jurídica e evita quebras abruptas de caixa.
                </p>
                <p className="text-neutral-600 text-sm leading-relaxed">
                  Utilizando o BarberTool corporativo, você monitora transações digitais, controla o fluxo de agendamentos futuros e projeta o caixa da barbearia de modo automático e 100% livre de planilhas complexas.
                </p>
              </div>

              <div className="pt-4 border-t border-neutral-200/60">
                <Link 
                  to="/blog" 
                  className="inline-flex items-center gap-2 text-sm font-black text-neutral-900 hover:gap-3 transition-all uppercase tracking-widest"
                >
                  Visitar Nosso Blog Com Mais Guias
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6 bg-neutral-50 border-t border-neutral-100">
        <div className="max-w-7xl mx-auto text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-6">Planos Transparentes</h2>
          <p className="text-neutral-500 max-w-2xl mx-auto leading-relaxed text-base sm:text-lg">Escolha o melhor plano para o momento atual do seu negócio.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <div className="bg-white p-10 rounded-[3rem] border border-neutral-200/60 shadow-xl relative overflow-hidden flex flex-col">
            <div className="mb-8">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest block mb-1 font-sans">Iniciante</span>
              <h3 className="text-3xl font-black uppercase">Grátis para sempre</h3>
            </div>
            
            <div className="text-4xl font-black mb-8">R$ 0<span className="text-sm text-neutral-400">/mês</span></div>
            
            <ul className="space-y-4 mb-10 flex-grow">
              <li className="flex items-center gap-3 text-sm text-neutral-600">
                 <CheckCircle2 size={18} className="text-emerald-500 animate-pulse" />
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
              <li className="flex items-center gap-3 text-sm text-neutral-400 line-through">
                 Multi-acessos (Membros de Equipe)
              </li>
            </ul>

            <Link 
              to="/dashboard"
              className="w-full py-5 bg-neutral-100 text-neutral-900 font-bold rounded-2xl text-center hover:bg-neutral-200 transition-colors"
            >
              Iniciar Plano Grátis
            </Link>
          </div>

          {/* Premium Plan */}
          <div className="bg-neutral-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden flex flex-col group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
               <Zap size={150} />
            </div>
            
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 bg-neutral-800 px-3 py-1 rounded-full mb-3">
                 <Zap className="text-yellow-400 fill-yellow-400 animate-bounce" size={12} />
                 <span className="text-[10px] font-black uppercase tracking-widest">Mais Popular</span>
              </div>
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest block mb-1">Profissional</span>
              <h3 className="text-3xl font-black uppercase">Premium</h3>
            </div>
            
            <div className="text-4xl font-black mb-1 flex items-baseline gap-2">
               R$ 5,00 <span className="text-sm text-neutral-500 font-medium tracking-normal">/mês</span>
            </div>
            <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mb-8">Primeiros 14 dias grátis</p>
            
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
                 Multi-acessos (Membros de Equipe)
              </li>
              <li className="flex items-center gap-3 text-sm font-bold text-yellow-400">
                 <CheckCircle2 size={18} />
                 Exportação para Excel (CSV/XLSX)
              </li>
            </ul>

            <Link 
              to="/dashboard"
              className="w-full py-5 bg-white text-neutral-900 font-black rounded-2xl text-center hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Iniciar 14 Dias Trial
            </Link>
          </div>
        </div>
      </section>

      {/* Footer (Stage 5 Requirement: semantic <footer> without empty hashtag (#) links) */}
      <footer className="py-20 border-t border-neutral-100 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-16">
            {/* Description */}
            <div className="md:col-span-5 space-y-4">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-neutral-900 rounded-lg flex items-center justify-center">
                  <Scissors className="text-white" size={16} />
                </div>
                <span className="text-lg font-black uppercase">BarberTool</span>
              </Link>
              <p className="text-sm text-neutral-400 leading-relaxed max-w-sm">
                Tecnologia de vanguarda e inteligência de negócios para automatizar, controlar de ponta a ponta e multiplicar o faturamento das melhores barbearias do país.
              </p>
            </div>

            {/* Quick Links */}
            <div className="md:col-span-3 space-y-4">
              <h4 className="font-extrabold text-neutral-900 text-xs uppercase tracking-widest">Navegação</h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#features" className="text-neutral-500 hover:text-neutral-900 transition-colors font-medium">Funcionalidades</a></li>
                <li><a href="#growth-guide" className="text-neutral-500 hover:text-neutral-900 transition-colors font-medium">Manual de Crescimento</a></li>
                <li><a href="#pricing" className="text-neutral-500 hover:text-neutral-900 transition-colors font-medium">Preços e Planos</a></li>
              </ul>
            </div>

            {/* Blog & Policies */}
            <div className="md:col-span-4 space-y-4">
              <h4 className="font-extrabold text-neutral-900 text-xs uppercase tracking-widest">Institucional</h4>
              <ul className="space-y-2.5 text-sm">
                <li><Link to="/blog" className="text-neutral-500 hover:text-neutral-900 transition-colors font-medium">Blog de Inteligência</Link></li>
                <li><Link to="/privacy-policy" className="text-neutral-500 hover:text-neutral-900 transition-colors font-medium">Política de Privacidade</Link></li>
                <li><Link to="/terms-of-use" className="text-neutral-500 hover:text-neutral-900 transition-colors font-medium">Termos de Uso</Link></li>
                <li><Link to="/contact" className="text-neutral-500 hover:text-neutral-900 transition-colors font-medium">Fale Conosco & Suporte</Link></li>
              </ul>
            </div>
          </div>

          {/* Copyright Row */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-8 border-t border-neutral-100">
            <p className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">© 2026 BarberTool. Todos os direitos reservados.</p>
            <div className="text-xs text-neutral-400 font-medium">
              Orgulhosamente impulsionado por tecnologia nacional
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
