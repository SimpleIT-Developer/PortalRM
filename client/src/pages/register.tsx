import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User, Mail, Lock, Building2, Link, ArrowLeft, Globe, Check, X } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AnimatedLogo } from "@/components/simpledfe/animated-logo";

const registrationSchema = z.object({
  legalName: z.string().min(3, "Razão Social deve ter pelo menos 3 caracteres"),
  tradeName: z.string().min(3, "Nome Fantasia deve ter pelo menos 3 caracteres"),
  cnpj: z.string().min(14, "CNPJ deve ter 14 dígitos").max(18, "CNPJ inválido"),
  subdomain: z.string()
    .min(3, "Subdomínio deve ter pelo menos 3 caracteres")
    .regex(/^[a-z0-9-]+$/, "Subdomínio deve conter apenas letras minúsculas, números e hífens"),
  email: z.string().email("Email inválido"),
  adminName: z.string().min(3, "Nome do administrador deve ter pelo menos 3 caracteres"),
  phone: z.string().optional(),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  webserviceBaseUrl: z.string().url("URL inválida").optional().or(z.literal("")),
});

type RegistrationForm = z.infer<typeof registrationSchema>;

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSubdomainAvailable, setIsSubdomainAvailable] = useState<boolean | null>(null);
  const [isCheckingSubdomain, setIsCheckingSubdomain] = useState(false);

  const form = useForm<RegistrationForm>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      legalName: "",
      tradeName: "",
      cnpj: "",
      subdomain: "",
      email: "",
      adminName: "",
      phone: "",
      password: "",
      webserviceBaseUrl: "",
    },
  });

  const subdomain = form.watch("subdomain");

  useEffect(() => {
    const checkAvailability = async () => {
      if (!subdomain || subdomain.length < 3) {
        setIsSubdomainAvailable(null);
        return;
      }

      setIsCheckingSubdomain(true);
      try {
        const response = await fetch(`/api/tenant/check-subdomain/${subdomain}`);
        const data = await response.json();
        setIsSubdomainAvailable(data.available);
      } catch (error) {
        console.error("Error checking subdomain:", error);
        setIsSubdomainAvailable(null);
      } finally {
        setIsCheckingSubdomain(false);
      }
    };

    const timeoutId = setTimeout(checkAvailability, 500);
    return () => clearTimeout(timeoutId);
  }, [subdomain]);

  const onSubmit = async (data: RegistrationForm) => {
    setIsRegistering(true);
    try {
      const payload = {
        company: {
          legalName: data.legalName,
          tradeName: data.tradeName,
          cnpj: data.cnpj.replace(/\D/g, ""),
        },
        admin: {
          email: data.email,
          password: data.password,
          name: data.adminName,
          phone: data.phone,
        },
        subdomain: data.subdomain,
        initialEnvironment: data.webserviceBaseUrl ? {
          webserviceBaseUrl: data.webserviceBaseUrl,
          authMode: 'bearer'
        } : undefined
      };

      const response = await fetch("/api/tenant/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Erro ao realizar cadastro");
      }

      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Sua conta foi criada. Faça login para continuar.",
        variant: "default",
      });
      setLocation("/admin");
    } catch (error: any) {
      toast({
        title: "Erro no cadastro",
        description: error.message || "Verifique os dados e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8">
        <div className="flex flex-col items-center space-y-2">
          <div className="p-3 bg-yellow-500/10 rounded-2xl border border-yellow-500/20 mb-4">
            <AnimatedLogo className="h-10 w-10 text-yellow-500" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Crie sua conta</h1>
          <p className="text-gray-400">Preencha os dados abaixo para transformar sua experiência com o TOTVS RM.</p>
        </div>

        <div className="bg-[#121214] border border-white/5 rounded-2xl p-8 shadow-2xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              
              {/* Informações da Empresa */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="tradeName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Fantasia</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                          <Input placeholder="Sua Empresa" {...field} className="pl-9 bg-[#1c1c1f] border-gray-800 focus:border-yellow-500 focus:ring-yellow-500/20 transition-all" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="legalName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Razão Social</FormLabel>
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cnpj"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CNPJ</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                          <Input 
                            placeholder="00.000.000/0001-00" 
                            {...field} 
                            maxLength={18}
                            onChange={(e) => {
                              let v = e.target.value.replace(/\D/g, "");
                              if (v.length > 14) v = v.slice(0, 14);
                              v = v.replace(/^(\d{2})(\d)/, "$1.$2");
                              v = v.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
                              v = v.replace(/\.(\d{3})(\d)/, ".$1/$2");
                              v = v.replace(/(\d{4})(\d)/, "$1-$2");
                              field.onChange(v);
                            }}
                            className="pl-9 bg-[#1c1c1f] border-gray-800 focus:border-yellow-500 focus:ring-yellow-500/20 transition-all" 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="subdomain"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subdomínio</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Globe className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                          <Input 
                            placeholder="cliente1" 
                            {...field} 
                            className={`pl-9 pr-10 bg-[#1c1c1f] border-gray-800 focus:border-yellow-500 focus:ring-yellow-500/20 transition-all ${
                              isSubdomainAvailable === false ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 
                              isSubdomainAvailable === true ? 'border-green-500 focus:border-green-500 focus:ring-green-500/20' : ''
                            }`}
                            onChange={(e) => field.onChange(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                          />
                          <div className="absolute right-3 top-2.5">
                            {isCheckingSubdomain ? (
                              <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />
                            ) : isSubdomainAvailable === true ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : isSubdomainAvailable === false ? (
                              <X className="h-4 w-4 text-red-500" />
                            ) : null}
                          </div>
                        </div>
                      </FormControl>
                      {isSubdomainAvailable === false && (
                         <p className="text-xs text-red-500 mt-1 font-medium">Este subdomínio já está em uso.</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Seu acesso será: {field.value ? field.value : 'cliente'}.portalrm.simpleit.app.br
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Informações do Administrador */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="adminName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Administrador</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                          <Input placeholder="Seu Nome" {...field} className="pl-9 bg-[#1c1c1f] border-gray-800 focus:border-yellow-500 focus:ring-yellow-500/20 transition-all" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone / WhatsApp</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                          <Input placeholder="(00) 00000-0000" {...field} className="pl-9 bg-[#1c1c1f] border-gray-800 focus:border-yellow-500 focus:ring-yellow-500/20 transition-all" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email do Administrador</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                          <Input placeholder="admin@empresa.com" {...field} className="pl-9 bg-[#1c1c1f] border-gray-800 focus:border-yellow-500 focus:ring-yellow-500/20 transition-all" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
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

              {/* Configuração RM Opcional */}
              <FormField
                control={form.control}
                name="webserviceBaseUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL WebService RM (Opcional)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Link className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                        <Input placeholder="http://seu-servidor-rm:8051" {...field} className="pl-9 bg-[#1c1c1f] border-gray-800 focus:border-yellow-500 focus:ring-yellow-500/20 transition-all" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold mt-4 h-11" disabled={isRegistering || isSubdomainAvailable === false}>
                {isRegistering ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Finalizar Cadastro"}
              </Button>
            </form>
          </Form>
        </div>

        <div className="text-center">
          <Button variant="link" className="text-gray-400 hover:text-yellow-500" onClick={() => setLocation("/admin")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Login
          </Button>
        </div>
      </div>
    </div>
  );
}
