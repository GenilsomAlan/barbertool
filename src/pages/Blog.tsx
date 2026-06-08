import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "motion/react";
import { Scissors, Calendar, ArrowLeft, User, Clock, BookOpen, Search, ArrowRight, Share2, Heart } from "lucide-react";

interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string[];
  bannerUrl: string;
  category: string;
  author: {
    name: string;
    role: string;
    avatarUrl: string;
  };
  date: string;
  readTime: string;
  tags: string[];
}

const articles: Article[] = [
  {
    id: "1",
    slug: "como-otimizar-fluxo-de-caixa-barbearia-2026",
    title: "Como Otimizar o Fluxo de Caixa da sua Barbearia para o Ano de 2026",
    excerpt: "Aprenda como gerenciar as finanças do seu negócio com eficiência, reduzindo custos ociosos e maximizando o lucro por atendimento.",
    bannerUrl: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=1000",
    category: "Gestão Financeira",
    author: {
      name: "Marcus Aurelius",
      role: "Especialista em Gestão de Negócios de Beleza",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus"
    },
    date: "15 de Maio de 2026",
    readTime: "8 min de leitura",
    tags: ["Fluxo de Caixa", "Planejamento Financeiro", "Gestão", "SaaS para Barbearia"],
    content: [
      "No mercado de estética masculina e barbearia contemporânea, muito se discute sobre novas técnicas de corte, produtos de alta performance e design de interiores refinado. No entanto, o verdadeiro pilar invisível de qualquer barbearia de sucesso é a saúde e a robustez do seu fluxo de caixa.",
      "Para 2026, com o aumento da competitividade urbana e a flutuação dos custos operacionais (aluguel, energia e insumos cosméticos), a capacidade de prever entradas e saídas de capital de forma milimétrica diferencia as barbearias lucrativas daquelas que encerram as atividades antes do segundo ano. A seguir, destrinchamos as estratégias financeiras essenciais para o seu negócio.",
      "1. Gestão Rigorosa de Tempo Ocioso: Cada minuto em que uma cadeira permanece vazia representa lucro perdido. Implementar um sistema de agendamento automatizado possibilita a detecção de 'gargalos de horário'. Ao analisar quais dias e períodos possuem menor demanda operando na semana, você pode lançar promoções dinâmicas de serviços combinados (por exemplo, corte + barba com desconto em terças-feiras de manhã) para equilibrar a ocupação de seus profissionais.",
      "2. Diversificação do Ticket Médio via Vendas de Varejo (Upselling): Barbearias de destaque geram até 25% de seu faturamento exclusivamente na venda de pomadas modeladoras, óleos para barba, shampoos pós-química, loções pós-barba e condicionadores. Treine seus barbeiros para agirem como consultores de visagismo e saúde capilar, recomendando produtos de manutenção doméstica específicos logo após o atendimento.",
      "3. Controle de Custos Fixos e Variáveis: Estabeleça uma rotina de negociação direta com fornecedores. Compre insumos em maior escala quando possível para reduzir a margem unitária. Ao mesmo tempo, mapeie minuciosamente as taxas de intermediação de pagamentos com cartão ou Pix, otimizando as rotas de faturamento da barbearia.",
      "Utilizar ferramentas tecnológicas integradas, como o BarberTool, permite consolidar o faturamento diário, automatizar o atendimento e agendamento dos clientes, e visualizar o histórico de receitas de forma centralizada. Adotar o controle digital elimina a perda de tempo com anotações manuais e garante uma gestão de agenda muito mais previsível e organizada."
    ]
  },
  {
    id: "2",
    slug: "tendencias-cortes-masculinos-cuidados-2026",
    title: "3 Tendências de Cortes Masculinos e Cuidados Capilares Avançados para 2026",
    excerpt: "Fique por dentro das criações de visagismo, misturas texturizadas e as abordagens de saúde do couro cabeludo que os clientes mais exigentes demandarão.",
    bannerUrl: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&q=80&w=1000",
    category: "Estilo & Estética",
    author: {
      name: "Jean-Louis Dupont",
      role: "Diretor de Visagismo e Estilo",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jean"
    },
    date: "12 de Maio de 2026",
    readTime: "6 min de leitura",
    tags: ["Tendências 2026", "Cortes de Cabelo", "Visagismo", "Barba & Cabelo"],
    content: [
      "A evolução do design capilar masculino tem atingido patamares excepcionais. Já se foi a época do corte genérico de máquina. O homem contemporâneo encara a ida à barbearia como um ritual de autoestima, saúde integrativa e expressão de identidade.",
      "Em 2026, observamos a consolidação definitiva do visagismo sob medida - a arte de harmonizar o corte com o formato do rosto, textura do fio, estilo de vida e até temperamento do cliente. Listamos as principais propostas estéticas que estão moldando o panorama atual das principais capitais do mundo.",
      "1. Textured Crop com Acabamento Fosco (Matte High Fade): O topo volumoso com textura marcada de tesoura desfiada, combinado com uma transição limpa de degradê nas laterais, continua muito forte. A grande novidade reside na exigência por finalizadores invisíveis ricos em argila branca, fornecendo fixação forte sem residual de brilho artificial.",
      "2. Modern Mullet Texturizado: Para clientes que prezam por originalidade, o corte resgatado dos anos 80 ganha releituras extremamente futuristas. As franjas são desconectadas e a nuca possui um comprimento balanceado, criando linhas de movimento que valorizam cabelos ondulados e cacheados.",
      "3. Terapia capilar e Cuidados com o Couro Cabeludo: Mais do que o corte, o foco agora é a saúde capilar integrada. O aumento das pesquisas sobre terapia capilar e controle de oleosidade ou caspa faz com que rituais de argiloterapia, banho de vapor de ozônio e massagens detox no lavatório tornem-se pacotes altamente rentáveis.",
      "Os profissionais de barbearia que dominarem esses rituais de estilização em conjunto com explicações didáticas para o cliente final certamente estarão um passo adiante no mercado."
    ]
  },
  {
    id: "3",
    slug: "formula-perfeita-fidelizar-clientes-sem-desconto",
    title: "A Fórmula Perfeita para Fidelizar Clientes de Barbearia Sem Depreciar seu Preço",
    excerpt: "Descubra como criar um ecossistema de valor, oferecendo experiências sensoriais que fazem o cliente retornar mensalmente sem apelar para descontos.",
    bannerUrl: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&q=80&w=1000",
    category: "Fidelização & Marketing",
    author: {
      name: "Rodrigo Silva",
      role: "Consultor de Marketing de Serviços",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rodrigo"
    },
    date: "08 de Maio de 2026",
    readTime: "7 min de leitura",
    tags: ["Fidelização", "Marketing", "Customer Success", "Atendimento Premium"],
    content: [
      "Muitos proprietários de barbearias acreditam erroneamente que a única forma de reter clientes leais diante de uma concorrência agressiva é oferecendo descontos constantes, reduzindo sua margem de lucro operacional. Esse é o caminho mais rápido para desvalorizar sua marca no mercado.",
      "Fidelização genuína não se compra depreciando seus preços; constrói-se entregando conveniência excepcional, relacionamento humano genuíno e experiências que os clientes não conseguem replicar em nenhum outro lugar.",
      "A primeira regra de fidelização é a conveniência no agendamento. Se o seu cliente precisa telefonar em horários comerciais específicos ou enviar mensagens no WhatsApp e aguardar longas horas por respostas, sua barbearia está gerando fricção. Disponibilizar um link público exclusivo no BarberTool, onde ele pode escolher o profissional de preferência, visualizar horários livres instantaneamente e agendar em 15 segundos às onze da noite, é um diferencial de valor formidável.",
      "A segunda regra é a consistência no atendimento. Garanta que cada cliente receba exatamente o mesmo atendimento qualificado, desde a recepção acolhedora com sua bebida preferida até o acabamento preciso. Registre o histórico de preferências do cliente no banco de dados interno (como o corte predileto, tipo de bebida consumida e tópicos de conversa) para que qualquer barbeiro da equipe possa prestar um atendimento ultra personalizado.",
      "A terceira regra baseia-se na criação de programas de recorrência inteligentes e pacotes por assinatura mensal, estimulando rituais de barbearia recorrentes e garantindo uma excelente previsibilidade de faturamento."
    ]
  }
];

export default function Blog() {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredArticles = articles.filter(article => 
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans pb-24">
      <Helmet>
        <title>{selectedArticle ? `${selectedArticle.title} | Blog BarberTool` : "Blog Oficial BarberTool - Inteligência para Barbearias"}</title>
        <meta name="description" content={selectedArticle ? selectedArticle.excerpt : "Dicas, artigos e novidades do mundo das barbearias. Aprenda sobre gestão financeira, marketing, visagismo e as principais novidades do ramo."} />
        <meta name="keywords" content="gestão de barbearias, marketing de beleza, fluxo de caixa barbearia, tendências de cortes masculinos, fidelização de clientes" />
        <meta name="robots" content="index, follow" />
      </Helmet>

      {/* Header */}
      <header className="bg-white border-b border-neutral-100 sticky top-0 z-40 backdrop-blur-md bg-white/90">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-neutral-900 rounded-xl flex items-center justify-center">
              <Scissors className="text-white" size={20} />
            </div>
            <span className="text-xl font-black tracking-tight uppercase">BarberTool</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/" className="text-sm font-bold text-neutral-500 hover:text-neutral-900 transition-colors">Voltar para o site</Link>
            <Link to="/login" className="px-5 py-2.5 bg-neutral-900 text-white text-xs font-bold rounded-2xl uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">Plataforma</Link>
          </div>
        </div>
      </header>

      {/* Hero / Banner do Blog */}
      {!selectedArticle && (
        <section className="bg-white border-b border-neutral-100 py-16 px-6 text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 bg-neutral-100 px-4 py-1.5 rounded-full">
              <BookOpen size={14} className="text-neutral-600" />
              <span className="text-xs font-bold uppercase tracking-widest text-neutral-600">Conteúdo Rico & Inteligência</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-neutral-900">Blog BarberTool</h1>
            <p className="text-neutral-500 text-lg leading-relaxed">
              O espaço definitivo com artigos, insights práticos e guias completos para transformar a sua barbearia em um negócio próspero e automatizado.
            </p>
            
            {/* Search Input */}
            <div className="max-w-md mx-auto relative pt-4">
              <input 
                type="text" 
                placeholder="Buscar artigos por tema, tags..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-5 py-3.5 pl-12 bg-neutral-50 border border-neutral-200 focus:border-neutral-950 focus:bg-white rounded-2xl text-sm outline-none transition-all"
              />
              <Search className="absolute left-4 top-8 text-neutral-400" size={18} />
            </div>
          </div>
        </section>
      )}

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 mt-12">
        <AnimatePresence mode="wait">
          {selectedArticle ? (
            <motion.article 
              key="article"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="max-w-3xl mx-auto bg-white rounded-[2.5rem] border border-neutral-100 shadow-sm overflow-hidden"
            >
              {/* Voltar trigger */}
              <div className="p-8 pb-0">
                <button 
                  onClick={() => setSelectedArticle(null)}
                  className="inline-flex items-center gap-2 text-sm font-bold text-neutral-500 hover:text-neutral-900 transition-colors pointer-events-auto cursor-pointer"
                >
                  <ArrowLeft size={16} />
                  Voltar para lista de artigos
                </button>
              </div>

              {/* Banner */}
              <div className="px-8 pt-6">
                <div className="h-64 sm:h-96 w-full rounded-[2rem] overflow-hidden relative shadow-inner">
                  <img src={selectedArticle.bannerUrl} alt={selectedArticle.title} className="w-full h-full object-cover" />
                  <span className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-xl text-xs font-black text-neutral-950 tracking-wider uppercase">
                    {selectedArticle.category}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="p-8 sm:p-12 space-y-6">
                {/* Meta info */}
                <div className="flex flex-wrap items-center gap-6 text-xs text-neutral-500 border-b border-neutral-100 pb-6">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} />
                    <span>{selectedArticle.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={14} />
                    <span>{selectedArticle.readTime}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {selectedArticle.tags.map((tag, idx) => (
                      <span key={idx} className="bg-neutral-100 text-neutral-600 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Main Heading */}
                <h2 className="text-3xl sm:text-4xl font-black text-neutral-900 leading-tight uppercase">
                  {selectedArticle.title}
                </h2>

                {/* Author Info */}
                <div className="flex items-center gap-4 py-2">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-neutral-100 border border-neutral-200">
                    <img src={selectedArticle.author.avatarUrl} alt={selectedArticle.author.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="font-bold text-neutral-900 text-sm">{selectedArticle.author.name}</h4>
                    <p className="text-xs text-neutral-500 font-medium">{selectedArticle.author.role}</p>
                  </div>
                </div>

                {/* Rich text sections */}
                <div className="space-y-6 text-neutral-700 leading-relaxed text-base sm:text-lg">
                  {selectedArticle.content.map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>

                {/* Conversion area */}
                <div className="mt-12 bg-neutral-900 text-white rounded-3xl p-8 text-center space-y-4">
                  <h3 className="text-2xl font-black uppercase">Pronto para modernizar seu negócio?</h3>
                  <p className="text-neutral-400 text-sm max-w-lg mx-auto leading-relaxed">
                    Utilize o BarberTool de forma integrada para otimizar seu fluxo de caixa, controlar agendamentos de clientes de forma segura e automatizada.
                  </p>
                  <div className="pt-2">
                    <Link to="/register" className="inline-flex items-center gap-2 bg-white text-neutral-950 px-8 py-4 rounded-xl font-bold hover:scale-105 active:scale-95 transition-transform">
                      Experimentar Plataforma de Graça
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              </div>
            </motion.article>
          ) : (
            <motion.div 
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-12"
            >
              {/* Empty state check */}
              {filteredArticles.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-[2.5rem] border border-neutral-100 p-8">
                  <p className="text-neutral-400 font-medium">Nenhum artigo encontrado com as palavras pesquisadas.</p>
                  <button onClick={() => setSearchQuery("")} className="mt-4 text-sm font-bold text-neutral-900 underline">Limpar busca</button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredArticles.map((article) => (
                    <motion.div 
                      key={article.id}
                      whileHover={{ y: -8 }}
                      className="bg-white rounded-[2rem] border border-neutral-100 shadow-sm overflow-hidden flex flex-col h-full cursor-pointer hover:shadow-lg transition-all"
                      onClick={() => setSelectedArticle(article)}
                    >
                      <div className="h-48 w-full overflow-hidden relative">
                        <img src={article.bannerUrl} alt={article.title} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
                        <span className="absolute top-4 left-4 bg-white/95 backdrop-blur px-2.5 py-1 rounded-lg text-[10px] font-black text-neutral-950 tracking-wider uppercase">
                          {article.category}
                        </span>
                      </div>
                      
                      <div className="p-6 flex flex-col flex-1 space-y-4">
                        <div className="flex items-center gap-4 text-[11px] text-neutral-400">
                          <span className="font-medium">{article.date}</span>
                          <span>•</span>
                          <span className="font-semibold">{article.readTime}</span>
                        </div>
                        
                        <h3 className="font-black text-neutral-900 text-lg sm:text-xl line-clamp-2 uppercase leading-tight hover:text-black">
                          {article.title}
                        </h3>
                        
                        <p className="text-neutral-500 text-sm leading-relaxed line-clamp-3">
                          {article.excerpt}
                        </p>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-neutral-50 mt-auto">
                          <div className="flex items-center gap-2">
                            <span className="w-8 h-8 rounded-full overflow-hidden bg-neutral-100 block border border-neutral-200">
                              <img src={article.author.avatarUrl} alt={article.author.name} className="w-full h-full object-cover" />
                            </span>
                            <span className="text-xs font-bold text-neutral-700">{article.author.name}</span>
                          </div>
                          
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-neutral-900 hover:gap-2 transition-all">
                            Ler artigo
                            <ArrowRight size={14} />
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
