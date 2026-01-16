import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowRight, CheckCircle2, Building2, User, Mail, Phone, Lock, Zap, Layout, Globe, ShieldCheck, Server, Link } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AnimatedLogo } from "@/components/simpledfe/animated-logo";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const registrationSchema = z.object({
  NOME_CONTATO: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  EMAIL: z.string().email("Email inválido"),
  TELEFONE: z.string().min(10, "Telefone inválido"),
  NOMECLIENTE: z.string().min(3, "Nome da empresa deve ter pelo menos 3 caracteres"),
  URLWS: z.string().url("URL inválida (ex: http://servidor:8051)"),
  NOMEDOAMBIENTE: z.string().min(3, "Nome do ambiente deve ter pelo menos 3 caracteres"),
  CODUSUARIO: z.string().min(3, "Usuário deve ter pelo menos 3 caracteres"),
  SENHA: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

type RegistrationForm = z.infer<typeof registrationSchema>;

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isRegistering, setIsRegistering] = useState(false);
  const [open, setOpen] = useState(false);

  const form = useForm<RegistrationForm>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      NOME_CONTATO: "",
      EMAIL: "",
      TELEFONE: "",
      NOMECLIENTE: "",
      URLWS: "",
      NOMEDOAMBIENTE: "",
      CODUSUARIO: "",
      SENHA: "",
    },
  });

  const onSubmit = async (data: RegistrationForm) => {
    setIsRegistering(true);
    try {
      const response = await fetch("/api/config-auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Erro ao realizar cadastro");
      }

      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Você já pode acessar o sistema com seu usuário e senha.",
        variant: "default",
      });
      setOpen(false);
    } catch (error) {
      toast({
        title: "Erro no cadastro",
        description: "Verifique os dados e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsRegistering(false);
    }
  };

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
           <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-yellow-500 hover:bg-yellow-400 text-black font-semibold shadow-lg shadow-yellow-500/20 border-0">
                Criar Conta
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#121214] border-gray-800 text-white sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-center mb-2 text-yellow-500">Crie sua conta</DialogTitle>
                <DialogDescription className="text-center text-gray-400">
                  Preencha os dados abaixo para transformar sua experiência com o TOTVS RM.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="NOME_CONTATO"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome Completo</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                              <Input placeholder="Seu nome" {...field} className="pl-9 bg-[#1c1c1f] border-gray-800 focus:border-yellow-500 focus:ring-yellow-500/20 transition-all" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="TELEFONE"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                              <Input 
                                placeholder="(11) 99999-9999" 
                                {...field} 
                                className="pl-9 bg-[#1c1c1f] border-gray-800 focus:border-yellow-500 focus:ring-yellow-500/20 transition-all" 
                                maxLength={15}
                                onChange={(e) => {
                                  let value = e.target.value.replace(/\D/g, "");
                                  if (value.length > 11) value = value.slice(0, 11);
                                  
                                  let formatted = value;
                                  if (value.length > 0) {
                                    formatted = `(${value.slice(0, 2)}`;
                                    if (value.length > 2) {
                                      formatted += `) ${value.slice(2, 7)}`;
                                    }
                                    if (value.length > 7) {
                                      formatted = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
                                    }
                                    if (value.length === 10) { // Ajuste para telefones fixos (XX) XXXX-XXXX se necessário, mas o padrão hoje é celular 9 dígitos
                                       // Lógica para 10 digitos: (11) 4444-4444
                                       // Mas a lógica acima força (11) 44444-444
                                       // Melhor abordagem híbrida:
                                    }
                                  }
                                  
                                  // Simplificando a lógica de máscara híbrida (10 ou 11 dígitos)
                                  if (value.length <= 10) {
                                     // (XX) XXXX-XXXX
                                     formatted = value
                                        .replace(/(\d{2})(\d)/, '($1) $2')
                                        .replace(/(\d{4})(\d)/, '$1-$2');
                                  } else {
                                     // (XX) XXXXX-XXXX
                                     formatted = value
                                        .replace(/(\d{2})(\d)/, '($1) $2')
                                        .replace(/(\d{5})(\d)/, '$1-$2');
                                  }
                                  
                                  field.onChange(formatted);
                                }}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="EMAIL"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Corporativo</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                            <Input placeholder="voce@empresa.com" {...field} className="pl-9 bg-[#1c1c1f] border-gray-800 focus:border-yellow-500 focus:ring-yellow-500/20 transition-all" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                      control={form.control}
                      name="NOMECLIENTE"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome da Empresa</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                              <Input placeholder="Sua Empresa Ltda" {...field} className="pl-9 bg-[#1c1c1f] border-gray-800 focus:border-yellow-500 focus:ring-yellow-500/20 transition-all" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="URLWS"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>URL WebService</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Link className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                                <Input placeholder="http://servidor:8051" {...field} className="pl-9 bg-[#1c1c1f] border-gray-800 focus:border-yellow-500 focus:ring-yellow-500/20 transition-all" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="NOMEDOAMBIENTE"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome do Ambiente</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Server className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                                <Input placeholder="CorporeRM" {...field} className="pl-9 bg-[#1c1c1f] border-gray-800 focus:border-yellow-500 focus:ring-yellow-500/20 transition-all" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="CODUSUARIO"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Usuário de Acesso</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                              <Input placeholder="usuario.rm" {...field} className="pl-9 bg-[#1c1c1f] border-gray-800 focus:border-yellow-500 focus:ring-yellow-500/20 transition-all" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="SENHA"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Senha</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                              <Input type="password" placeholder="******" {...field} className="pl-9 bg-[#1c1c1f] border-gray-800 focus:border-yellow-500 focus:ring-yellow-500/20 transition-all" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold mt-4 h-11" disabled={isRegistering}>
                    {isRegistering ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Finalizar Cadastro"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
           </Dialog>
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
            onClick={() => setOpen(true)}
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
