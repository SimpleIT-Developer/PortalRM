import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { totvsLoginSchema, type TotvsLoginRequest } from "@shared/schema";
import { AuthService, AuthenticationError } from "@/lib/auth";
import { EndpointService, type EndpointOption } from "@/lib/endpoint";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Eye, EyeOff, User, Server, AlertCircle, CheckCircle, Box, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<AuthenticationError | null>(null);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Estados para gerenciamento de endpoints
  const [endpoints, setEndpoints] = useState<EndpointOption[]>([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('');
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
        const endpointList = await EndpointService.loadEndpoints();
        setEndpoints(endpointList);
        
        // Definir endpoint padrão (último selecionado ou primeiro da lista)
        const defaultEndpoint = await EndpointService.getDefaultEndpoint();
        setSelectedEndpoint(defaultEndpoint);
      } catch (error) {
        console.error('Erro ao carregar endpoints:', error);
        // Definir endpoint padrão em caso de erro
        setSelectedEndpoint('http://legiaoda142256.rm.cloudtotvs.com.br:8051');
        setEndpoints([{
          url: 'http://legiaoda142256.rm.cloudtotvs.com.br:8051',
          name: 'legiaoda142256.rm.cloudtotvs.com.br:8051'
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

  // Salvar endpoint selecionado quando alterado
  const handleEndpointChange = (endpoint: string) => {
    setSelectedEndpoint(endpoint);
    EndpointService.saveSelectedEndpoint(endpoint);
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

    try {
      // Remove servicealias if empty
      const credentials = { ...data };
      if (!credentials.servicealias?.trim()) {
        delete credentials.servicealias;
      }

      const tokenData = await AuthService.authenticate({ ...credentials, endpoint: selectedEndpoint });
      AuthService.storeToken(tokenData, data.username, selectedEndpoint);
      
      setShowSuccess(true);
      toast({
        title: "Login realizado com sucesso!",
        description: "Redirecionando para o dashboard...",
      });

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        setLocation("/dashboard");
      }, 1500);

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

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-primary rounded-full flex items-center justify-center mb-6">
            <Box className="text-primary-foreground text-2xl" size={24} />
          </div>
          <h1 className="text-3xl font-medium text-foreground mb-2">TOTVS RM</h1>
          <p className="text-sm text-muted-foreground">Entre com suas credenciais para acessar o sistema</p>
        </div>

        {/* Login Form */}
        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center">
              <div className="text-center w-full pt-2" />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Username Field */}
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Usuário</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type="text"
                            placeholder="Digite seu usuário"
                            className="pr-10"
                            disabled={isLoading}
                            onChange={(e) => {
                              field.onChange(e);
                              clearErrors();
                            }}
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <User className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Password Field */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            placeholder="Digite sua senha"
                            className="pr-10"
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
                            className="absolute inset-y-0 right-0 px-3 py-0 h-full hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={isLoading}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Service Alias Field */}
                <FormField
                  control={form.control}
                  name="servicealias"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alias do Serviço (Opcional)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type="text"
                            placeholder="Digite o alias do serviço"
                            className="pr-10"
                            disabled={isLoading}
                            onChange={(e) => {
                              field.onChange(e);
                              clearErrors();
                            }}
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <Server className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Error Message */}
                {authError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
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
                            className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
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
                          <div className="bg-muted/50 p-2 rounded text-xs font-mono text-muted-foreground border">
                            {authError.technicalDetails}
                          </div>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Success Message */}
                {showSuccess && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      <strong>Login Realizado com Sucesso</strong>
                      <br />
                      Redirecionando para o sistema...
                    </AlertDescription>
                  </Alert>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Autenticando...
                    </>
                  ) : (
                    "Entrar"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* System Info */}
        <div className="text-center text-xs text-muted-foreground space-y-2">
          {/* Endpoint Selection */}
          {isLoadingEndpoints ? (
            <div className="flex items-center justify-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Carregando endpoint...</span>
            </div>
          ) : endpoints.length > 1 ? (
            <Select value={selectedEndpoint} onValueChange={handleEndpointChange}>
              <SelectTrigger className="h-7 text-xs px-3 py-1 w-auto min-w-64 mx-auto">
                <SelectValue placeholder="Selecione o endpoint" />
              </SelectTrigger>
              <SelectContent>
                {endpoints.map((endpoint) => (
                  <SelectItem key={endpoint.url} value={endpoint.url}>
                    {endpoint.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="text-xs text-muted-foreground">
              {selectedEndpoint ? selectedEndpoint.replace('https://', '').replace('http://', '') : 'Carregando...'}
            </div>
          )}
          
          {/* Copyright */}
          <p>© 2024 TOTVS S.A. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
}
