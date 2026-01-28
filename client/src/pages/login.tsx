import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { totvsLoginSchema, type TotvsLoginRequest } from "@shared/schema";
import { AuthService, AuthenticationError } from "@/lib/auth";
import { EnvironmentConfigService } from "@/lib/environment-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Eye, EyeOff, User, AlertCircle, Globe, ChevronDown, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTenant } from "@/lib/tenant-context";

import LoadingScreen from "@/components/loading-screen";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { tenant, selectedEnvironment, selectEnvironment, isLoading: isTenantLoading } = useTenant();

  const [isLoading, setIsLoading] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<AuthenticationError | null>(null);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  
  // Controle de acesso ao login principal
  const [isEnvironmentConfigured, setIsEnvironmentConfigured] = useState(false);

  const form = useForm<TotvsLoginRequest>({
    resolver: zodResolver(totvsLoginSchema),
    defaultValues: {
      grant_type: "password",
      username: "",
      password: "",
      servicealias: "",
    },
  });

  // Sincronizar estado local com seleção do Tenant
  useEffect(() => {
    if (tenant && selectedEnvironment) {
        setIsEnvironmentConfigured(true);
        
        // Propagar configurações para o EnvironmentConfigService
        if (selectedEnvironment.modules) EnvironmentConfigService.saveEnabledModules(selectedEnvironment.modules);
        
        // Movimentos
        const saveMovements = (movements: string[] | undefined, saver: (m: string[] | null) => void) => {
            if (movements && Array.isArray(movements)) {
                saver(movements);
            } else {
                saver(null);
            }
        };

        // Usando saveOrderMovements como fallback se não tiver específico
        // Ajuste conforme os métodos disponíveis no EnvironmentConfigService:
        if (selectedEnvironment.MOVIMENTOS_SOLICITACAO_COMPRAS) EnvironmentConfigService.saveOrderMovements(selectedEnvironment.MOVIMENTOS_SOLICITACAO_COMPRAS);
        if (selectedEnvironment.MOVIMENTOS_ORDEM_COMPRA) EnvironmentConfigService.saveOrderMovements(selectedEnvironment.MOVIMENTOS_ORDEM_COMPRA);
        if (selectedEnvironment.MOVIMENTOS_NOTA_FISCAL_PRODUTO) EnvironmentConfigService.saveNfProductMovements(selectedEnvironment.MOVIMENTOS_NOTA_FISCAL_PRODUTO);
        if (selectedEnvironment.MOVIMENTOS_NOTA_FISCAL_SERVICO) EnvironmentConfigService.saveNfServiceMovements(selectedEnvironment.MOVIMENTOS_NOTA_FISCAL_SERVICO);
        if (selectedEnvironment.MOVIMENTOS_OUTRAS_MOVIMENTACOES) EnvironmentConfigService.saveOtherMovements(selectedEnvironment.MOVIMENTOS_OUTRAS_MOVIMENTACOES);

    } else {
        setIsEnvironmentConfigured(false);
    }
  }, [tenant, selectedEnvironment]);


  // Clear errors when user starts typing
  const clearErrors = () => {
    if (authError) {
      setAuthError(null);
      setShowTechnicalDetails(false);
    }
  };

  const onSubmit = async (data: TotvsLoginRequest) => {
    if (!selectedEnvironment) {
        toast({
            title: "Ambiente não selecionado",
            description: "Por favor, selecione um ambiente para continuar.",
            variant: "destructive"
        });
        return;
    }

    setIsLoading(true);
    setAuthError(null);
    setShowTechnicalDetails(false);

    console.log("🚀 Iniciando autenticação...");
    console.log("📍 Ambiente:", selectedEnvironment.name);

    try {
      // Salvar a senha temporariamente para o SOAP proxy
      sessionStorage.setItem("totvs_password", data.password);

      // Remove servicealias if empty
      const credentials = { ...data };
      if (!credentials.servicealias?.trim()) {
        delete credentials.servicealias;
      }

      if (!tenant) throw new Error("Tenant não identificado");

      const tokenData = await AuthService.authenticate({ 
        ...credentials, 
        environmentId: selectedEnvironment.id,
        tenantKey: tenant.tenantKey
      });
      AuthService.storeToken(tokenData, data.username, selectedEnvironment.id, tenant.tenantKey);
      
      toast({
        title: "Login realizado com sucesso!",
        description: "Entrando no sistema...",
      });
      
      // Iniciar tela de carregamento antes de ir para o dashboard
      setShowLoadingScreen(true);
      // setLocation("/dashboard"); // Será chamado pelo onComplete do LoadingScreen

    } catch (error) {
      if (error instanceof AuthenticationError) {
        setAuthError(error);
        toast({
          title: "Erro de Autenticação",
          description: error.message,
          variant: "destructive",
        });
      } else {
        const friendlyMessage = "Erro inesperado. Verifique sua conexão e tente novamente.";
        const technicalDetails = error instanceof Error ? error.message : "Erro desconhecido";
        const authError = new AuthenticationError(friendlyMessage, technicalDetails);
        setAuthError(authError);
        toast({
          title: "Erro de Autenticação",
          description: friendlyMessage,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadingComplete = () => {
    setLocation("/dashboard");
  };

  if (showLoadingScreen) {
    return <LoadingScreen onComplete={handleLoadingComplete} />;
  }

  if (isTenantLoading) {
      return (
          <div className="min-h-screen bg-[#121212] flex items-center justify-center text-white">
              <div className="flex flex-col items-center gap-4">
                  <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
                  <p className="text-gray-400">Carregando ambiente...</p>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#121212] text-white font-sans selection:bg-yellow-500/30">
      {/* Header de Seleção de Ambiente */}
      <header className="w-full bg-[#1E1E1E] border-b border-yellow-500/20 px-6 py-4 shadow-md z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3 w-full max-w-2xl">
                <Globe className="h-5 w-5 text-yellow-500 shrink-0" />
                <span className="text-sm font-medium text-gray-300 shrink-0">Ambiente:</span>
                
                {tenant && tenant.environments.length > 0 ? (
                    <div className="flex-1">
                        <Select 
                            value={selectedEnvironment?.id} 
                            onValueChange={(value) => selectEnvironment(value)}
                        >
                            <SelectTrigger className="w-full h-10 bg-[#2D2D2D] border-yellow-500/20 text-yellow-500 focus:ring-yellow-500/20 focus:border-yellow-500/50 transition-all">
                                <SelectValue placeholder="Selecione um ambiente de trabalho..." />
                            </SelectTrigger>
                            <SelectContent className="bg-[#1E1E1E] border-yellow-500/20 text-white">
                                {tenant.environments.map((env) => (
                                    <SelectItem key={env.id} value={env.id} className="focus:bg-yellow-500/20 focus:text-yellow-500 cursor-pointer py-3">
                                        <div className="flex flex-col items-start gap-1">
                                            <span className="font-medium">{env.name}</span>
                                            {/* URL removida por segurança/arquitetura */}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                ) : (
                    <span className="text-sm text-red-400 italic">Nenhum ambiente disponível para este tenant.</span>
                )}
            </div>
            
            <div className="hidden sm:flex items-center gap-2">
                 <div className="h-8 w-px bg-white/10 mx-2"></div>
                 <span className="text-sm font-bold tracking-tight text-white">Portal <span className="text-yellow-500">RM</span></span>
            </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-yellow-500/5 rounded-full blur-[100px]"></div>
            <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px]"></div>
        </div>

        <Card className="w-full max-w-md bg-[#1E1E1E]/80 backdrop-blur-sm border-yellow-500/20 shadow-2xl relative z-10">
          <CardHeader className="space-y-4 pb-2 text-center">
             <div className="mx-auto p-3 bg-yellow-500/10 rounded-2xl border border-yellow-500/20 w-fit mb-2">
                 {/* Logo Placeholder - Usando ícone User como fallback se não tiver logo */}
                 {tenant?.logo ? (
                     <img src={tenant.logo} alt={tenant.name} className="h-10 w-auto object-contain" />
                 ) : (
                     <User className="h-8 w-8 text-yellow-500" />
                 )}
             </div>
             <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Bem-vindo de volta</h1>
                <p className="text-sm text-gray-400 mt-1">
                    {tenant?.name ? `Acesso restrito - ${tenant.name}` : "Entre com suas credenciais TOTVS RM"}
                </p>
             </div>
          </CardHeader>
          <CardContent className="pt-6">
             {!isEnvironmentConfigured ? (
                 <Alert className="bg-yellow-500/10 border-yellow-500/20 mb-6">
                     <AlertCircle className="h-4 w-4 text-yellow-500" />
                     <AlertDescription className="text-yellow-200/80 text-sm">
                         Selecione um ambiente acima para habilitar o login.
                     </AlertDescription>
                 </Alert>
             ) : (
                 <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300">Usuário</FormLabel>
                          <FormControl>
                            <div className="relative group">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-yellow-500 transition-colors" />
                                <Input 
                                    {...field} 
                                    disabled={isLoading} 
                                    className="pl-10 bg-[#2D2D2D] border-gray-700 text-white focus:border-yellow-500 focus:ring-yellow-500/20 transition-all h-11" 
                                    placeholder="Seu usuário de rede"
                                    onChange={(e) => {
                                        field.onChange(e);
                                        clearErrors();
                                    }}
                                />
                            </div>
                          </FormControl>
                          <FormMessage className="text-red-400" />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300">Senha</FormLabel>
                          <FormControl>
                            <div className="relative group">
                                <Input 
                                    type={showPassword ? "text" : "password"} 
                                    {...field} 
                                    disabled={isLoading} 
                                    className="pl-3 pr-10 bg-[#2D2D2D] border-gray-700 text-white focus:border-yellow-500 focus:ring-yellow-500/20 transition-all h-11" 
                                    placeholder="Sua senha"
                                    onChange={(e) => {
                                        field.onChange(e);
                                        clearErrors();
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors p-1"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                          </FormControl>
                          <FormMessage className="text-red-400" />
                        </FormItem>
                      )}
                    />

                    {authError && (
                        <div className="rounded-md bg-red-500/10 border border-red-500/20 p-3 animate-in fade-in slide-in-from-top-2">
                            <div className="flex gap-3">
                                <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                                <div className="flex-1 space-y-1">
                                    <p className="text-sm font-medium text-red-200">{authError.message}</p>
                                    {authError.technicalDetails && (
                                        <div className="pt-1">
                                            <button 
                                                type="button"
                                                onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                                                className="text-xs text-red-400 hover:text-red-300 underline flex items-center gap-1"
                                            >
                                                {showTechnicalDetails ? <ChevronDown className="h-3 w-3" /> : <ChevronDown className="h-3 w-3 -rotate-90" />}
                                                Detalhes técnicos
                                            </button>
                                            
                                            {showTechnicalDetails && (
                                                <div className="mt-2 p-2 bg-black/40 rounded text-[10px] font-mono text-red-300 break-all border border-red-500/10">
                                                    {authError.technicalDetails}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <Button 
                        type="submit" 
                        disabled={isLoading} 
                        className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold h-11 text-base shadow-[0_0_15px_rgba(234,179,8,0.2)] hover:shadow-[0_0_25px_rgba(234,179,8,0.4)] transition-all"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Autenticando...
                            </>
                        ) : (
                            "Entrar no Sistema"
                        )}
                    </Button>
                  </form>
                </Form>
             )}
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-gray-600 bg-[#09090b] border-t border-white/5 relative z-10">
        <p>&copy; {new Date().getFullYear()} Portal RM - SimpleIT. Todos os direitos reservados.</p>
        {selectedEnvironment && (
            <p className="mt-1 text-gray-700 font-mono">
                Conectado a: {selectedEnvironment.name}
            </p>
        )}
      </footer>
    </div>
  );
}
