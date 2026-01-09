import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { totvsLoginSchema, type TotvsLoginRequest } from "@shared/schema";
import { AuthService, AuthenticationError } from "@/lib/auth";
import { StartupCheckService } from "@/lib/startup-check";
import { EndpointService, type EndpointOption } from "@/lib/endpoint";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Eye, EyeOff, User, Server, AlertCircle, CheckCircle, Box, ChevronDown, ChevronUp, Globe, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import LoadingScreen from "@/components/loading-screen";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<AuthenticationError | null>(null);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [verificationProgress, setVerificationProgress] = useState<number | undefined>(undefined);
  const [verificationMessage, setVerificationMessage] = useState<string | undefined>(undefined);
  
  // Estados para gerenciamento de endpoints
  const [endpoints, setEndpoints] = useState<EndpointOption[]>([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('');
  const [tempEndpoint, setTempEndpoint] = useState<string>('');
  const [isLoadingEndpoints, setIsLoadingEndpoints] = useState(true);

  const form = useForm<TotvsLoginRequest>({
    resolver: zodResolver(totvsLoginSchema),
    defaultValues: {
      grant_type: "password",
      username: "",
      password: "",
      servicealias: "",
    },
  });

  // Carregar endpoints na inicialização
  useEffect(() => {
    const loadEndpoints = async () => {
      try {
        setIsLoadingEndpoints(true);
        // Limpar endpoint antigo hardcoded se existir
        const oldEndpoint = localStorage.getItem('selected_endpoint');
        if (oldEndpoint && oldEndpoint.includes('legiaoda142256')) {
          localStorage.removeItem('selected_endpoint');
        }

        const endpointList = await EndpointService.loadEndpoints();
        setEndpoints(endpointList);
        
        const defaultEndpoint = await EndpointService.getDefaultEndpoint();
        setSelectedEndpoint(defaultEndpoint);
        setTempEndpoint(defaultEndpoint);
      } catch (error) {
        console.error('Erro ao carregar endpoints:', error);
        setSelectedEndpoint('http://erp-simpleit.sytes.net:8051');
        setEndpoints([{
          url: 'http://erp-simpleit.sytes.net:8051',
          name: 'ERP SimpleIT'
        }]);
        toast({
          title: "Aviso",
          description: "Não foi possível carregar a lista de endpoints. Usando configuração padrão.",
          variant: "default",
        });
      } finally {
        setIsLoadingEndpoints(false);
      }
    };

    loadEndpoints();
  }, [toast]);

  // Salvar endpoint selecionado
  const handleSaveEndpoint = () => {
    setSelectedEndpoint(tempEndpoint);
    EndpointService.saveSelectedEndpoint(tempEndpoint);
    setShowConfigDialog(false);
    toast({
      title: "Ambiente Configurado",
      description: `Conectado a: ${tempEndpoint}`,
    });
  };

  // Clear errors when user starts typing
  const clearErrors = () => {
    if (authError) {
      setAuthError(null);
      setShowTechnicalDetails(false);
    }
  };

  const onSubmit = async (data: TotvsLoginRequest) => {
    setIsLoading(true);
    setAuthError(null);
    setShowTechnicalDetails(false);
    setShowSuccess(false);

    console.log("🚀 Iniciando autenticação...");
    console.log("📍 Endpoint selecionado:", selectedEndpoint);

    try {
      // Salvar a senha temporariamente para o SOAP proxy
      // ATENÇÃO: Isso não é ideal para segurança, mas necessário para o requisito de 
      // usar as credenciais do login na chamada SOAP via proxy
      sessionStorage.setItem("totvs_password", data.password);

      // Remove servicealias if empty
      const credentials = { ...data };
      if (!credentials.servicealias?.trim()) {
        delete credentials.servicealias;
      }

      const tokenData = await AuthService.authenticate({ ...credentials, endpoint: selectedEndpoint });
      AuthService.storeToken(tokenData, data.username, selectedEndpoint);
      
      // Verificação de Configuração (Sentenças SQL)
      // Mostrar tela de loading para verificação
      setShowLoadingScreen(true);
      setVerificationProgress(0);
      setVerificationMessage("Iniciando verificação de sentenças...");

      const checkResult = await StartupCheckService.checkConfiguration((sentence, index, total) => {
          const percent = Math.floor((index / total) * 100);
          setVerificationProgress(percent);
          setVerificationMessage(`Verificando ${sentence} (${index}/${total})...`);
      });
      
      if (!checkResult.success) {
        setShowLoadingScreen(false);
        setVerificationProgress(undefined);
        setVerificationMessage(undefined);

        toast({
          title: "Erro de Configuração",
          description: `Faltando configurações: ${checkResult.missing.join(", ")}. Acesso negado.`,
          variant: "destructive",
          duration: 6000,
        });
        return;
      }

      // Verificação concluída com sucesso
      // Transição para o modo de carregamento automático
      setVerificationProgress(undefined);
      setVerificationMessage(undefined);

      toast({
        title: "Ambiente Verificado",
        description: "Todas as configurações foram encontradas.",
        className: "bg-green-600 text-white border-green-700",
      });

      setShowSuccess(true);
      toast({
        title: "Login realizado com sucesso!",
        description: "Carregando sistema...",
      });

      // A tela de loading continua exibida (showLoadingScreen=true), 
      // mas agora entra no modo automático (progressValue=undefined)

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

  // Função para redirecionar após o loading
  const handleLoadingComplete = () => {
    setLocation("/dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#121212] text-white">
      {/* Header de Configuração do Ambiente */}
      <header className="w-full bg-[#1E1E1E] border-b border-yellow-500/20 px-4 py-3 shadow-md z-20">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-yellow-500">
            <Globe className="h-4 w-4" />
            <span className="text-sm font-medium text-gray-300">Ambiente Conectado:</span>
            <span className="text-sm font-mono text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20 truncate max-w-[200px] sm:max-w-md">
              {selectedEndpoint || "Não configurado"}
            </span>
          </div>
          
          <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 border-yellow-500/30 hover:border-yellow-500 text-gray-300 hover:text-yellow-500 hover:bg-yellow-500/10 text-xs uppercase tracking-wider"
                onClick={() => setTempEndpoint(selectedEndpoint)}
              >
                <Settings className="h-3 w-3 mr-2" />
                Configurar Conexão
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1E1E1E] border-yellow-500/20 text-white sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-yellow-500 flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Configuração do WebService
                </DialogTitle>
                <DialogDescription className="text-gray-400">
                  Defina a URL do servidor TOTVS RM para conexão.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="endpoint-url" className="text-gray-300">URL do WebService</Label>
                  <div className="relative">
                    <Input
                      id="endpoint-url"
                      value={tempEndpoint}
                      onChange={(e) => setTempEndpoint(e.target.value)}
                      placeholder="Ex: http://servidor:8051"
                      className="bg-[#2D2D2D] border-gray-700 text-white placeholder:text-gray-500 focus:border-yellow-500 focus:ring-yellow-500/20 pl-9"
                    />
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  </div>
                  <p className="text-[10px] text-gray-500">
                    Insira o endereço IP ou domínio e a porta do serviço.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setShowConfigDialog(false)} className="text-gray-400 hover:text-white hover:bg-white/10">
                  Cancelar
                </Button>
                <Button onClick={handleSaveEndpoint} className="bg-yellow-500 text-black hover:bg-yellow-400">
                  Salvar e Conectar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 relative">
        {showLoadingScreen && (
          <LoadingScreen
            duration={5000}
            onComplete={handleLoadingComplete}
            customMessage={verificationMessage}
            progressValue={verificationProgress}
          />
        )}
        
        <div className="max-w-md w-full space-y-8 relative z-10">
          {/* Header with Logo */}
          <div className="text-center">
            <div className="mx-auto h-20 w-20 bg-yellow-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(234,179,8,0.5)]">
              <Box className="text-black text-4xl" size={40} />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">TOTVS RM</h1>
            <p className="text-sm text-gray-400">Entre com suas credenciais para acessar o sistema</p>
          </div>

          {/* Login Form Card */}
          <Card className="bg-[#1E1E1E] border-t-4 border-t-yellow-500 border-x-0 border-b-0 shadow-2xl">
            <CardContent className="space-y-6 pt-8 pb-8 px-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  {/* Username Field */}
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Usuário</FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <Input
                              {...field}
                              type="text"
                              placeholder="Digite seu usuário"
                              className="bg-[#2D2D2D] border-gray-700 text-white placeholder:text-gray-500 focus:border-yellow-500 focus:ring-yellow-500/20 h-12 pr-10 transition-all"
                              disabled={isLoading}
                              onChange={(e) => {
                                field.onChange(e);
                                clearErrors();
                              }}
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                              <User className="h-5 w-5 text-gray-500 group-focus-within:text-yellow-500 transition-colors" />
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  {/* Password Field */}
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Senha</FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <Input
                              {...field}
                              type={showPassword ? "text" : "password"}
                              placeholder="Digite sua senha"
                              className="bg-[#2D2D2D] border-gray-700 text-white placeholder:text-gray-500 focus:border-yellow-500 focus:ring-yellow-500/20 h-12 pr-10 transition-all"
                              disabled={isLoading}
                              onChange={(e) => {
                                field.onChange(e);
                                clearErrors();
                              }}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute inset-y-0 right-0 px-3 py-0 h-full hover:bg-transparent text-gray-500 hover:text-yellow-500 transition-colors"
                              onClick={() => setShowPassword(!showPassword)}
                              disabled={isLoading}
                            >
                              {showPassword ? (
                                <EyeOff className="h-5 w-5" />
                              ) : (
                                <Eye className="h-5 w-5" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  {/* Service Alias Field */}
                  <FormField
                    control={form.control}
                    name="servicealias"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Alias do Serviço (Opcional)</FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <Input
                              {...field}
                              type="text"
                              placeholder="Digite o alias do serviço"
                              className="bg-[#2D2D2D] border-gray-700 text-white placeholder:text-gray-500 focus:border-yellow-500 focus:ring-yellow-500/20 h-12 pr-10 transition-all"
                              disabled={isLoading}
                              onChange={(e) => {
                                field.onChange(e);
                                clearErrors();
                              }}
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                              <Server className="h-5 w-5 text-gray-500 group-focus-within:text-yellow-500 transition-colors" />
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  {/* Error Message */}
                  {authError && (
                    <Alert variant="destructive" className="bg-red-900/20 border-red-900/50 text-red-200">
                      <AlertCircle className="h-4 w-4 text-red-400" />
                      <AlertDescription className="text-red-200">
                        <div className="space-y-3">
                          <div>
                            <strong>Não foi possível fazer o login</strong>
                            <br />
                            {authError.message}
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                              className="h-auto p-1 text-xs text-red-300 hover:text-red-100 hover:bg-red-900/40"
                            >
                              {showTechnicalDetails ? (
                                <>
                                  <ChevronUp className="h-3 w-3 mr-1" />
                                  Ocultar detalhes técnicos
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="h-3 w-3 mr-1" />
                                  Ver detalhes técnicos
                                </>
                              )}
                            </Button>
                          </div>
                          
                          {showTechnicalDetails && (
                            <div className="bg-black/50 p-2 rounded text-xs font-mono text-red-300 border border-red-900/30">
                              {authError.technicalDetails}
                            </div>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Success Message */}
                  {showSuccess && (
                    <Alert className="bg-green-900/20 border-green-900/50 text-green-200">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <AlertDescription className="text-green-200">
                        <strong>Login Realizado com Sucesso</strong>
                        <br />
                        Redirecionando para o sistema...
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-bold bg-yellow-500 text-black hover:bg-yellow-400 transition-all shadow-lg hover:shadow-yellow-500/20"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Autenticando...
                      </>
                    ) : (
                      "ENTRAR"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* System Info */}
          <div className="text-center text-xs text-gray-500 space-y-4">
            {/* Copyright */}
            <p>© 2024 TOTVS S.A. Todos os direitos reservados.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
