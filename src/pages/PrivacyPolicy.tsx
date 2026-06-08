import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Scissors, ArrowLeft, Shield } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans pb-24">
      <Helmet>
        <title>Política de Privacidade | BarberTool</title>
        <meta name="description" content="Política de Privacidade e Cookies do BarberTool. Conheça as nossas diretrizes de coleta de dados, conformidade e segurança." />
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

      {/* Content wrapper */}
      <main className="max-w-4xl mx-auto px-6">
        <div className="bg-white rounded-[2.5rem] border border-neutral-100 shadow-sm p-8 sm:p-14 space-y-8">
          <div>
            <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-neutral-400 hover:text-neutral-900 transition-colors mb-6">
              <ArrowLeft size={16} />
              Voltar ao início
            </Link>
            
            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-600 px-3.5 py-1.5 rounded-full mb-4">
              <Shield size={14} />
              <span className="text-xs font-bold uppercase tracking-wider">Conformidade e Segurança</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-black text-neutral-900 uppercase">Política de Privacidade</h1>
            <p className="text-sm text-neutral-400 mt-2">Última atualização: 22 de Maio de 2026</p>
          </div>

          <div className="prose prose-neutral max-w-none space-y-6 text-neutral-600 leading-relaxed text-sm sm:text-base">
            <p>
              A sua privacidade é extremamente importante para nós do <strong>BarberTool</strong> ("Plataforma"). Esta Política de Privacidade descreve formalmente as informações que coletamos, como são processadas quando você utiliza nossa plataforma de faturamento e agendamento virtual de beleza, e de que forma asseguramos a transparência total perante as diretrizes da LGPD (Lei Geral de Proteção de Dados).
            </p>

            <h3 className="h3 font-black text-neutral-900 text-lg uppercase pt-4 border-b border-neutral-100 pb-2">1. Coleta de Informações</h3>
            <p>
              Coletamos categorias específicas de dados pessoais para fornecer, aprimorar de modo constante e viabilizar transações comerciais seguras e adequadas para o cotidiano do seu salão de beleza ou barbearia:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Dados de Registro:</strong> Nome completo, endereço de e-mail, telefone celular para contato rápido, senha criptografada e informações essenciais do salão (nome comercial da barbearia, localização base de atuação).</li>
              <li><strong>Dados de Agendamento dos Clientes:</strong> Nome e telefone celular providos para realizar a reserva de horários nos links públicos, além dos serviços solicitados, para fornecer as mensagens automáticas de confirmação.</li>
              <li><strong>Informações do Dispositivo & Estatísticas:</strong> Endereço IP do visitante, tipo de navegador web correspondente, páginas de referência originais, duração de permanência no domínio de rede, sistema operacional ativo e IDs internos de cookies exclusivos.</li>
            </ul>

            <h3 className="h3 font-black text-neutral-900 text-lg uppercase pt-4 border-b border-neutral-100 pb-2">2. Uso de Cookies</h3>
            <p>
              Empregar o uso de cookies nos permite fornecer uma navegação totalmente otimizada. Os cookies são pequenos arquivos de registro hospedados na sua máquina com o propósito de lembrar suas preferências de login e idioma, por exemplo. Eles são utilizados para melhorar a sua experiência na plataforma e garantir o funcionamento correto de todos os recursos de segurança e agendamento.
            </p>

            <h3 className="h3 font-black text-neutral-900 text-lg uppercase pt-4 border-b border-neutral-100 pb-2">3. Compartilhamento e Proteção de Dados</h3>
            <p>
              O BarberTool não comercializa ou repassa as informações pessoais dos clientes ou barbeiros para quaisquer fins comerciais escusos. As informações coletadas servem estritamente para o faturamento interno, envio de comprovantes de reserva via canais informados e controle operacional de serviços prestados.
            </p>
            <p>
              Utilizamos chaves de segurança TLS/SSL para proteger informações de faturamento e canais de banco de dados robustos (Firebase Firestore), assegurando redundância completa contra invasões sistemáticas ou violação acidental de privacidade corporativa.
            </p>

            <h3 className="h3 font-black text-neutral-900 text-lg uppercase pt-4 border-b border-neutral-100 pb-2">4. DIREITOS DOS TITULARES DE DADOS</h3>
            <p>
              Em conformidade total com a Lei Geral de Proteção de Dados (LGPD) brasileira, quaisquer barbeiros cadastrados ou usuários finais de agendamento podem acionar nossos canais oficiais de suporte técnico para solicitar o acesso aos seus dados históricos armazenados, modificações imediatas, limitações de processamento ou até mesmo a exclusão definitiva dos bancos de dados do BarberTool.
            </p>

            <h3 className="h3 font-black text-neutral-900 text-lg uppercase pt-4 border-b border-neutral-100 pb-2">5. Acordo Geral</h3>
            <p>
              Ao usufruir ativamente das ferramentas descritas no BarberTool, o usuário manifesta concordância plena com as diretrizes descritas nesta Política de Privacidade. Caso discorde de quaisquer termos expressos, a recomendação recomendada é interromper imediatamente as visitas às nossas rotas.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
