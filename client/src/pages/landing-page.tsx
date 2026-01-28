import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Layout, Globe, ShieldCheck, Phone } from "lucide-react";
import { AnimatedLogo } from "@/components/simpledfe/animated-logo";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function LandingPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col font-sans selection:bg-yellow-500/30">
      
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-yellow-500/10 rounded-full blur-[120px] mix-blend-screen animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-yellow-600/5 rounded-full blur-[150px] mix-blend-screen"></div>
      </div>

      {/* Header */}
      <header className="container mx-auto px-6 py-6 flex justify-between items-center relative z-10 border-b border-white/5">
        <div className="flex items-center gap-3">
           <div className="p-2 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
             <AnimatedLogo className="h-8 w-8 text-yellow-500" />
           </div>
           <span className="text-xl font-bold tracking-tight text-white">Portal <span className="text-yellow-500">RM</span></span>
        </div>
        <div className="flex gap-4">
           <Button variant="ghost" className="text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/5 transition-all" onClick={() => setLocation("/login")}>
             Acessar Sistema
           </Button>
           <Button 
             className="bg-yellow-500 hover:bg-yellow-400 text-black font-semibold shadow-lg shadow-yellow-500/20 border-0"
             onClick={() => setLocation("/admin")}
           >
             Criar / Gerenciar Conta
           </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 container mx-auto px-6 flex flex-col items-center justify-center py-20 relative z-10 text-center">
        
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-sm font-medium mb-8 animate-fade-in-up">
          <Zap className="h-4 w-4 fill-yellow-500" />
          <span>Performance e Design Superior para seu ERP</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6 max-w-5xl mx-auto">
          O <span className="text-yellow-500">TOTVS RM</span> como você <br/>
          nunca viu na <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">WEB</span>
        </h1>
        
        <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-12 leading-relaxed">
          Transforme a complexidade do RM em uma experiência visual incrível, intuitiva e rápida.
          Acesse seus processos de qualquer lugar com uma interface moderna e unificada.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-6 justify-center w-full max-w-lg mx-auto">
          <Button 
            size="lg" 
            className="bg-yellow-500 hover:bg-yellow-400 text-black text-lg font-bold px-10 h-14 shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:shadow-[0_0_30px_rgba(234,179,8,0.5)] transition-all transform hover:-translate-y-1" 
            onClick={() => setLocation("/login")}
          >
            Acessar Agora <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="border-gray-700 text-gray-300 hover:bg-white/5 hover:text-white hover:border-gray-500 text-lg px-8 h-14" 
            onClick={() => setLocation("/register")}
          >
            Solicitar Acesso
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 max-w-6xl mx-auto w-full">
           <div className="bg-[#121214] p-8 rounded-2xl border border-white/5 hover:border-yellow-500/20 transition-all group">
             <div className="h-12 w-12 bg-yellow-500/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-yellow-500/20 transition-colors">
               <Layout className="h-6 w-6 text-yellow-500" />
             </div>
             <h3 className="text-xl font-bold mb-3 text-white">Interface Moderna</h3>
             <p className="text-gray-400">UX/UI redesenhada para maximizar a produtividade e reduzir a curva de aprendizado dos usuários.</p>
           </div>
           
           <div className="bg-[#121214] p-8 rounded-2xl border border-white/5 hover:border-yellow-500/20 transition-all group">
             <div className="h-12 w-12 bg-yellow-500/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-yellow-500/20 transition-colors">
               <Globe className="h-6 w-6 text-yellow-500" />
             </div>
             <h3 className="text-xl font-bold mb-3 text-white">Acesso Web Nativo</h3>
             <p className="text-gray-400">Esqueça instalações complexas. Acesse todo o poder do RM diretamente do seu navegador.</p>
           </div>

           <div className="bg-[#121214] p-8 rounded-2xl border border-white/5 hover:border-yellow-500/20 transition-all group">
             <div className="h-12 w-12 bg-yellow-500/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-yellow-500/20 transition-colors">
               <ShieldCheck className="h-6 w-6 text-yellow-500" />
             </div>
             <h3 className="text-xl font-bold mb-3 text-white">Segurança Total</h3>
             <p className="text-gray-400">Integração segura com as credenciais e permissões nativas do seu ambiente TOTVS RM.</p>
           </div>
        </div>

        {/* FAQ Section */}
        <div className="w-full max-w-3xl mx-auto mt-32">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
            Perguntas <span className="text-yellow-500">Frequentes</span>
          </h2>
          
          <Accordion type="single" collapsible className="w-full space-y-4">
            <AccordionItem value="item-1" className="border border-white/5 bg-[#121214] rounded-xl px-6">
              <AccordionTrigger className="text-lg font-medium hover:text-yellow-500 hover:no-underline py-6">
                O Portal RM substitui o TOTVS RM?
              </AccordionTrigger>
              <AccordionContent className="text-gray-400 text-base pb-6 leading-relaxed text-left">
                Não. O Portal RM é uma interface web moderna que se conecta ao seu ambiente TOTVS RM existente. Ele consome os dados e regras de negócio já configurados, oferecendo uma experiência de uso superior sem migração de dados.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="border border-white/5 bg-[#121214] rounded-xl px-6">
              <AccordionTrigger className="text-lg font-medium hover:text-yellow-500 hover:no-underline py-6">
                É seguro utilizar o Portal RM?
              </AccordionTrigger>
              <AccordionContent className="text-gray-400 text-base pb-6 leading-relaxed text-left">
                Sim, a segurança é prioridade. O sistema utiliza as mesmas credenciais de acesso do RM e respeita todas as permissões de usuário já configuradas no seu ERP. Além disso, toda a comunicação é criptografada.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="border border-white/5 bg-[#121214] rounded-xl px-6">
              <AccordionTrigger className="text-lg font-medium hover:text-yellow-500 hover:no-underline py-6">
                Preciso instalar algo nos computadores?
              </AccordionTrigger>
              <AccordionContent className="text-gray-400 text-base pb-6 leading-relaxed text-left">
                Não. O Portal RM é 100% web. Seus usuários podem acessar de qualquer navegador (Chrome, Edge, Firefox) sem necessidade de instalação local ou plugins complexos.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="border border-white/5 bg-[#121214] rounded-xl px-6">
              <AccordionTrigger className="text-lg font-medium hover:text-yellow-500 hover:no-underline py-6">
                Funciona em dispositivos móveis?
              </AccordionTrigger>
              <AccordionContent className="text-gray-400 text-base pb-6 leading-relaxed text-left">
                Sim. A interface é totalmente responsiva e adaptada para uso em smartphones e tablets, permitindo aprovações e consultas de qualquer lugar.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Demo Section */}
        <div className="w-full mt-32 relative">
          <div className="absolute inset-0 bg-yellow-500/5 blur-3xl rounded-full pointer-events-none"></div>
          <div className="bg-[#121214]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-12 max-w-4xl mx-auto relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
            
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
              <div className="text-left max-w-lg">
                <h3 className="text-3xl font-bold mb-4">
                  Quer ver na <span className="text-yellow-500">prática?</span>
                </h3>
                <p className="text-gray-400 text-lg mb-0">
                  Agende uma demonstração exclusiva e descubra como podemos transformar a gestão da sua empresa.
                </p>
              </div>
              
              <Button 
                size="lg" 
                className="bg-yellow-500 hover:bg-yellow-400 text-black text-lg font-bold px-8 h-14 min-w-[200px] shadow-lg shadow-yellow-500/20"
                onClick={() => window.open("https://wa.me/5511944987584?text=Olá, gostaria de agendar uma demonstração do Portal RM.", "_blank")}
              >
                <Phone className="mr-2 h-5 w-5" />
                Agendar Demo
              </Button>
            </div>
          </div>
        </div>

      </main>
      
      {/* Footer */}
      <footer className="border-t border-white/5 py-10 bg-[#09090b] relative z-10">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-gray-500 text-sm">
           <div className="flex items-center gap-2 mb-4 md:mb-0">
             <AnimatedLogo className="h-6 w-6 text-gray-600" />
             <span className="font-semibold text-gray-400">Portal RM © 2026</span>
           </div>
           <div className="flex gap-8">
             <a href="#" className="hover:text-yellow-500 transition-colors">Suporte</a>
             <a href="#" className="hover:text-yellow-500 transition-colors">Documentação</a>
             <a href="#" className="hover:text-yellow-500 transition-colors">Status</a>
           </div>
        </div>
      </footer>
    </div>
  );
}
