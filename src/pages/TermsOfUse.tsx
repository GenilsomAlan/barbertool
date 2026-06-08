import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Scissors, ArrowLeft, FileText } from "lucide-react";

export default function TermsOfUse() {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans pb-24">
      <Helmet>
        <title>Termos de Uso | BarberTool</title>
        <meta name="description" content="Termos de Uso e Regulamento do BarberTool para Barbeiros, Administradores e Clientes Finais de Agendamento Online." />
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
            
            <div className="inline-flex items-center gap-2 bg-neutral-100 text-neutral-700 px-3.5 py-1.5 rounded-full mb-4">
              <FileText size={14} />
              <span className="text-xs font-bold uppercase tracking-wider">Contrato de Licenciamento Terceiros</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-black text-neutral-900 uppercase">Termos de Uso</h1>
            <p className="text-sm text-neutral-400 mt-2">Última atualização: 22 de Maio de 2026</p>
          </div>

          <div className="prose prose-neutral max-w-none space-y-6 text-neutral-600 leading-relaxed text-sm sm:text-base">
            <p>
              Por favor, leia atentamente as disposições contidas nos presentes Termos de Uso antes de iniciar o uso ativo da ferramenta <strong>BarberTool</strong> ("Plataforma"). Ao se registrar, acessar o Painel Administrativo ou interagir com os Links Públicos de reserva de barbearias credenciadas, você manifesta irrestrito aceite de todas as regras aqui transcritas.
            </p>

            <h3 className="h3 font-black text-neutral-900 text-lg uppercase pt-4 border-b border-neutral-100 pb-2">1. Objeto e Licenciamento de Uso</h3>
            <p>
              O BarberTool opera como um software comercializado sob o modelo de Licenciamento de Uso (SaaS) contendo as seguintes funcionalidades nativas listadas de modo não exclusivo:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Agenda e controle de disponibilidade profissional de barbeiros;</li>
              <li>Links individualizados para agendamento online de clientes finais;</li>
              <li>Relatórios estatísticos retrospectivos de faturamento mercadológico.</li>
            </ul>

            <h3 className="h3 font-black text-neutral-900 text-lg uppercase pt-4 border-b border-neutral-100 pb-2">2. Direitos de Propriedade Intelectual</h3>
            <p>
              A totalidade do material presente nas páginas institucionais e do blog (incluindo layouts visuais exclusivos, animações, textos de artigos originais focados em SEO, logomarcas, paleta corporativa de cores e códigos de execução em TypeScript) são ativos protegidos de titularidade exclusiva de BarberTool. Qualquer reprodução parcial sem prévia consulta por canais oficiais de suporte resultará em ações administrativas cabíveis.
            </p>

            <h3 className="h3 font-black text-neutral-900 text-lg uppercase pt-4 border-b border-neutral-100 pb-2">3. Responsabilidades do Barbeiro Credenciado</h3>
            <p>
              Ao utilizar a plataforma para oferecer serviços de corte de cabelo e barba, o profissional concorda em fornecer informações cadastrais fidedignas e manter sua disponibilidade perfeitamente organizada nos slots mostrados aos consumidores, visando mitigar desagradáveis erros de colisão de horários reservados na rede.
            </p>

            <h3 className="h3 font-black text-neutral-900 text-lg uppercase pt-4 border-b border-neutral-100 pb-2">4. Resiliência do Sistema</h3>
            <p>
              Embora busquemos manter a plataforma operacional com índices superiores a 99.8% de estabilidade (através da escalabilidade oferecida pela hospedagem em Cloud Run), não nos responsabilizamos civil ou financeiramente por ocasionais gargalos pontuais decorrentes do sinal de internet do usuário ou avaria externa involuntária nos provedores globais de nuvem computacional.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
