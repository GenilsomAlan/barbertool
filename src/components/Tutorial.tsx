import React from "react";
import { Link } from "react-router-dom";
import { BookOpen, Scissors, Calendar, Users, Settings, ExternalLink, CheckCircle, Info } from "lucide-react";
import { motion } from "motion/react";

export default function Tutorial({ primaryColor, secondaryColor }: { primaryColor: string, secondaryColor: string }) {
  return (
    <div className="space-y-8 pb-12">
      <div className="bg-white p-10 rounded-3xl border border-neutral-100 shadow-sm relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-3xl font-bold text-neutral-900 mb-4 tracking-tight">Bem-vindo ao BarberTool!</h2>
          <p className="text-neutral-500 text-lg leading-relaxed mb-6">
            O BarberTool é a sua ferramenta completa para gerenciar barbearias com agilidade e inteligência. 
            Este guia rápido ajudará você a configurar sua conta e aproveitar ao máximo o sistema.
          </p>
          <div className="flex flex-wrap gap-4">
            <div className="px-4 py-2 bg-neutral-50 rounded-xl text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
              <CheckCircle size={14} className="text-emerald-500" />
              Sistema Pronto
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
          <BookOpen size={240} className="text-neutral-900" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Step 1: Configuration */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm"
        >
          <div className="w-12 h-12 rounded-2xl bg-neutral-900 flex items-center justify-center mb-6 shadow-lg rotate-3" style={{ backgroundColor: primaryColor }}>
            <Settings className="w-6 h-6" style={{ color: secondaryColor }} />
          </div>
          <h3 className="text-xl font-bold text-neutral-900 mb-3">1. Configurações Iniciais</h3>
          <p className="text-neutral-500 text-sm leading-relaxed mb-4">
            O primeiro passo é deixar o sistema com a cara da sua barbearia. Vá até a aba <strong>Configurações</strong> para:
          </p>
          <ul className="space-y-3">
            {[
              "Definir suas cores de marca (Primária e Secundária)",
              "Fazer upload do seu Logo",
              "Ajustar o nome e link (URL) da barbearia",
              "Verificar e alterar seu e-mail de acesso"
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-neutral-600">
                <div className="mt-1 w-4 h-4 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={10} className="text-emerald-500" />
                </div>
                {item}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Step 2: Services */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm"
        >
          <div className="w-12 h-12 rounded-2xl bg-neutral-900 flex items-center justify-center mb-6 shadow-lg -rotate-3" style={{ backgroundColor: primaryColor }}>
            <Scissors className="w-6 h-6" style={{ color: secondaryColor }} />
          </div>
          <h3 className="text-xl font-bold text-neutral-900 mb-3">2. Serviços e Preços</h3>
          <p className="text-neutral-500 text-sm leading-relaxed mb-4">
            Ainda em <strong>Configurações</strong>, você encontrará a área de Serviços. É aqui que você define o que oferece aos seus clientes.
          </p>
          <ul className="space-y-3">
            {[
              "Adicione nomes de serviços (Cabelo, Barba, etc.)",
              "Defina o preço de cada serviço",
              "Ajuste a duração média (importante para a agenda)",
              "Remova serviços que não oferece mais"
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-neutral-600">
                <div className="mt-1 w-4 h-4 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={10} className="text-emerald-500" />
                </div>
                {item}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Step 3: Online Booking */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm"
        >
          <div className="w-12 h-12 rounded-2xl bg-neutral-900 flex items-center justify-center mb-6 shadow-lg rotate-3" style={{ backgroundColor: primaryColor }}>
            <Calendar className="w-6 h-6" style={{ color: secondaryColor }} />
          </div>
          <h3 className="text-xl font-bold text-neutral-900 mb-3">3. Link de Agendamento</h3>
          <p className="text-neutral-500 text-sm leading-relaxed mb-4">
            Este é o coração do sistema! Você possui uma página exclusiva para seus clientes agendarem online sem precisar ligar.
          </p>
          <div className="p-4 bg-neutral-50 rounded-2xl mb-4 border border-neutral-100">
            <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
              <Info size={12} />
              Dica Pro
            </p>
            <p className="text-xs text-neutral-600 leading-normal">
              Coloque o link da sua página (ex: /book/seu-slug) na BIO do seu Instagram para facilitar o acesso dos seus clientes.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <div className="mt-1 w-4 h-4 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <CheckCircle size={10} className="text-emerald-500" />
            </div>
            Os agendamentos feitos pelos clientes aparecem instantaneamente na sua <strong>Agenda</strong>.
          </div>
        </motion.div>

        {/* Step 4: Reports */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm"
        >
          <div className="w-12 h-12 rounded-2xl bg-neutral-900 flex items-center justify-center mb-6 shadow-lg -rotate-3" style={{ backgroundColor: primaryColor }}>
            <Users className="w-6 h-6" style={{ color: secondaryColor }} />
          </div>
          <h3 className="text-xl font-bold text-neutral-900 mb-3">4. Relatórios e Gestão</h3>
          <p className="text-neutral-500 text-sm leading-relaxed mb-4">
            Acompanhe a saúde do seu negócio. O BarberTool consolida seus dados automaticamente.
          </p>
          <ul className="space-y-3">
            {[
              "Veja sua receita total no Painel",
              "Acesse a lista completa de clientes na aba Clientes",
              "Exporte relatórios unificados (Excel) para sua contabilidade",
              "Receba notificações de novos agendamentos em tempo real"
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-neutral-600">
                <div className="mt-1 w-4 h-4 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={10} className="text-emerald-500" />
                </div>
                {item}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      <div className="bg-neutral-900 p-10 rounded-3xl text-white flex flex-col md:flex-row items-center justify-between gap-8" style={{ backgroundColor: primaryColor }}>
        <div>
          <h3 className="text-2xl font-bold mb-2">Precisa de ajuda avançada?</h3>
          <p className="text-neutral-400 text-sm" style={{ color: `${secondaryColor}b3` }}>Consulte nossa documentação técnica ou entre em contato com o suporte.</p>
        </div>
        <Link 
          to="/contact"
          target="_blank"
          rel="noopener noreferrer"
          className="px-8 py-4 bg-white text-neutral-900 rounded-2xl font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-xl flex items-center gap-2 decoration-none"
          style={{ backgroundColor: secondaryColor, color: primaryColor }}
        >
          <ExternalLink size={18} />
          Acessar Canal de Suporte
        </Link>
      </div>
    </div>
  );
}
