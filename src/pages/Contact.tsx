import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "motion/react";
import { Scissors, ArrowLeft, Mail, Phone, MapPin, Send, CheckCircle2, HelpCircle } from "lucide-react";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      setErrorMsg("Por favor, preencha todos os campos obrigatórios (*).");
      return;
    }
    setErrorMsg("");
    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/public/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Houve uma falha ao enviar a mensagem. Tente novamente.");
      }
      
      setIsSubmitting(false);
      setShowSuccess(true);
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(err.message || "Não foi possível conectar ao servidor. Tente mais tarde.");
    }
  };

  const faqs = [
    {
      q: "Como o BarberTool pode otimizar a minha agenda de barbeiro?",
      a: "Nossa plataforma disponibiliza um link de agendamento online personalizado para que os seus clientes reservem horários sozinhos. Isso elimina conversas demoradas de WhatsApp e preenche sua grade 24 horas por dia."
    },
    {
      q: "O plano gratuito realmente não possui taxas mensais?",
      a: "Sim! O plano básico é gratuito para sempre, suportando agendamentos manuais e gestão de serviços completa. Para exibir zero anúncios e liberar o link de agendamento público dos clientes, você pode realizar o upgrade para o plano Premium."
    },
    {
      q: "Como posso integrar o suporte ou relatar problemas técnicos?",
      a: "Você pode encaminhar um e-mail diretamente por esta seção de Contato ou através da nossa central de ajuda dentro do painel administrativo. Nossa equipe responderá em até 12 horas úteis."
    }
  ];

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans pb-24">
      <Helmet>
        <title>Fale Conosco e Suporte | BarberTool</title>
        <meta name="description" content="Central de Contato, Atendimento ao Cliente e Suporte Técnico do BarberTool. Esclareça dúvidas técnicas e envie sugestões." />
        <meta name="robots" content="index, follow" />
      </Helmet>

      {/* Header */}
      <header className="bg-white border-b border-neutral-100 mb-12 sticky top-0 z-40 backdrop-blur-md bg-white/90">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-neutral-900 rounded-xl flex items-center justify-center">
              <Scissors className="text-white" size={20} />
            </div>
            <span className="text-xl font-black tracking-tight uppercase">BarberTool</span>
          </Link>
          <Link to="/" className="text-sm font-bold text-neutral-500 hover:text-neutral-900 transition-colors">Voltar para Home</Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-12 gap-8 items-start">
          {/* Form Area */}
          <div className="md:col-span-7 bg-white rounded-[2.5rem] border border-neutral-100 shadow-sm p-8 sm:p-12 space-y-6">
            <div>
              <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-neutral-400 hover:text-neutral-900 transition-colors mb-4">
                <ArrowLeft size={16} />
                Voltar à página inicial
              </Link>
              <h1 className="text-3xl font-black uppercase text-neutral-900 tracking-tight">Fale Conosco</h1>
              <p className="text-neutral-400 text-sm mt-1">Dúvidas comerciais, sugestões ou suporte técnico? Preencha o formulário abaixo.</p>
            </div>

            {errorMsg && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-600 font-semibold text-xs rounded-xl">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Nome Completo *</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 focus:border-neutral-900 rounded-xl text-sm outline-none transition-all"
                  placeholder="Nome e Sobrenome"
                  required
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5 font-sans">E-mail Comercial *</label>
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 focus:border-neutral-900 rounded-xl text-sm outline-none transition-all"
                    placeholder="exemplo@seuemail.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Assunto</label>
                  <input 
                    type="text" 
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 focus:border-neutral-900 rounded-xl text-sm outline-none transition-all"
                    placeholder="ex: Contratar Plano Premium de Barbearia"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Sua Mensagem *</label>
                <textarea 
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  rows={4}
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 focus:border-neutral-900 rounded-xl text-sm outline-none transition-all resize-none"
                  placeholder="Descreva detalhadamente a sua solicitação..."
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-neutral-900 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-neutral-800 transition-all text-sm shadow-md"
              >
                {isSubmitting ? "Enviando..." : "Enviar Mensagem"}
                <Send size={16} />
              </button>
            </form>
          </div>

          {/* Contact Details & FAQs */}
          <div className="md:col-span-5 space-y-8">
            {/* Quick Details Card */}
            <div className="bg-neutral-900 text-white rounded-[2.5rem] p-8 sm:p-10 space-y-6">
              <h2 className="text-xl font-black uppercase text-white tracking-tight">Informações de Suporte</h2>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-neutral-800 rounded-xl flex items-center justify-center text-neutral-300">
                    <Mail size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-neutral-400 uppercase font-bold">Email de Suporte</p>
                    <p className="text-sm font-semibold">barbertoolsuporte@gmail.com</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-neutral-800 rounded-xl flex items-center justify-center text-neutral-300">
                    <Phone size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-neutral-400 uppercase font-bold">Contato Telefônico</p>
                    <p className="text-sm font-semibold">+55 (34) 9 9741-0717</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-neutral-800 rounded-xl flex items-center justify-center text-neutral-300">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-neutral-400 uppercase font-bold">Base Matriz</p>
                    <p className="text-sm font-semibold">Uberlândia, MG - Brasil</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Micro FAQs */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-neutral-100 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-neutral-950">
                <HelpCircle size={18} className="text-neutral-900" />
                <h3 className="font-bold text-sm uppercase tracking-wide">Dúvidas Rápidas</h3>
              </div>
              
              <div className="space-y-4">
                {faqs.map((faq, i) => (
                  <div key={i} className="space-y-1">
                    <p className="text-xs font-bold text-neutral-800">{faq.q}</p>
                    <p className="text-xs text-neutral-500 leading-relaxed">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSuccess(false)}
              className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl relative z-10 overflow-hidden p-8 text-center space-y-4 border border-neutral-100"
            >
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 size={32} />
              </div>
              <div>
                <h3 className="font-black text-neutral-900 text-lg uppercase">Mensagem Enviada!</h3>
                <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
                  Agradecemos o seu contato. Um dos nossos especialistas em gestão de barbearias entrará em contato em breve.
                </p>
              </div>
              <button
                onClick={() => setShowSuccess(false)}
                className="w-full py-3 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-xl text-xs uppercase tracking-widest transition-all"
              >
                Compreendido
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
