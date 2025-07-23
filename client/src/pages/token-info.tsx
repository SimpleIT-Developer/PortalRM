import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { AuthService, type StoredToken } from "@/lib/auth";
import { EndpointService } from "@/lib/endpoint";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  Copy, 
  RefreshCw, 
  Key, 
  Clock, 
  Shield, 
  Code, 
  Play, 
  Book,
  AlertCircle,
  CheckCircle,
  User
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function TokenInfoPage() {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState<StoredToken | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiEndpoint, setApiEndpoint] = useState("");
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isExpiringSoon, setIsExpiringSoon] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadTokenAndEndpoint = async () => {
      const storedToken = AuthService.getStoredToken();
      if (!storedToken) {
        setLocation("/");
        return;
      }

      if (!AuthService.isTokenValid(storedToken)) {
        toast({
          title: "Sessão Expirada",
          description: "Seu token expirou. Faça login novamente.",
          variant: "destructive",
        });
        setLocation("/");
        return;
      }

      setToken(storedToken);
      
      // Carregar endpoint configurado
      try {
        const defaultEndpoint = await EndpointService.getDefaultEndpoint();
        setApiEndpoint(`${defaultEndpoint}/api/`);
      } catch (error) {
        console.error('Erro ao carregar endpoint:', error);
        setApiEndpoint("https://erp-simpleit.sytes.net:8051/api/");
      }
    };

    loadTokenAndEndpoint();
  }, [setLocation, toast]);

  // Atualizar tempo restante em tempo real
  useEffect(() => {
    if (!token) return;

    const updateTimeRemaining = () => {
      if (token.expires_at) {
        // Usar o mesmo método do TokenIndicator
        const now = Date.now();
        const expiresAt = new Date(token.expires_at).getTime();
        const diff = Math.max(0, Math.floor((expiresAt - now) / 1000));
        setTimeRemaining(diff);
        setIsExpiringSoon(diff < 60);
      } else {
        // Fallback para o método antigo se expires_at não estiver disponível
        const remaining = Math.max(0, token.expires_in - Math.floor((Date.now() - token.timestamp) / 1000));
        setTimeRemaining(remaining);
        setIsExpiringSoon(remaining < 60);
      }
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [token]);

  const handleRefreshToken = async () => {
    if (!token) {
      console.warn("TokenInfo: Tentativa de renovar token nulo");
      return;
    }
    
    try {
      console.log("TokenInfo: Iniciando renovação de token...");
      const newStoredToken = await AuthService.renewTokenWithToast(setIsRefreshing);
      
      if (newStoredToken) {
        console.log("TokenInfo: Token renovado com sucesso");
        // Atualiza o token local
        setToken(newStoredToken);
        
        // Recarrega a página para garantir que todos os componentes usem o token atualizado
        console.log("TokenInfo: Recarregando página...");
        window.location.reload();
      } else {
        console.warn("TokenInfo: Falha ao renovar token");
      }
    } catch (error) {
      console.error("TokenInfo: Erro ao renovar token:", error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao renovar o token. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleCopyToken = () => {
    if (token?.access_token) {
      navigator.clipboard.writeText(token.access_token).then(() => {
        toast({
          title: "Copiado",
          description: "Token copiado para a área de transferência!",
        });
      }).catch(() => {
        toast({
          title: "Erro",
          description: "Erro ao copiar token",
          variant: "destructive",
        });
      });
    }
  };

  const handleTestApi = async () => {
    if (!apiEndpoint.trim()) {
      toast({
        title: "Erro",
        description: "Informe um endpoint para testar",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await AuthService.makeAuthenticatedRequest(apiEndpoint);
      const status = response.status;
      const statusText = response.ok ? "Sucesso" : "Erro";
      
      toast({
        title: `Teste da API - ${statusText}`,
        description: `Status: ${status} ${response.statusText}`,
        variant: response.ok ? "default" : "destructive",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro na requisição";
      toast({
        title: "Erro na API",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Função para formatar o tempo de forma legível
  const formatTimeRemaining = (seconds: number): string => {
    if (seconds <= 0) return "Expirado";
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  if (!token) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-medium text-foreground">Informações do Token</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie e monitore seu token de autenticação TOTVS RM
        </p>
      </div>

      {/* Token Expiry Warning */}
      {isExpiringSoon && timeRemaining > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Atenção:</strong> Seu token expira em {formatTimeRemaining(timeRemaining)}. 
            Considere renová-lo para manter o acesso.
          </AlertDescription>
        </Alert>
      )}

      {/* Token Expired Warning */}
      {timeRemaining <= 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Token Expirado:</strong> Faça login novamente para obter um novo token.
          </AlertDescription>
        </Alert>
      )}

      {/* Token Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Key className="mr-2 h-5 w-5 text-primary" />
            Informações do Token
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-sm font-medium text-foreground">Access Token</Label>
              <div className="bg-muted p-3 rounded-lg mt-2">
                <code className="text-xs text-muted-foreground break-all">
                  {token.access_token}
                </code>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-foreground">Refresh Token</Label>
              <div className="bg-muted p-3 rounded-lg mt-2">
                <code className="text-xs text-muted-foreground break-all">
                  {token.refresh_token || "N/A"}
                </code>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-foreground">Expira em</Label>
              <div className="flex items-center text-sm text-muted-foreground mt-2">
                <Clock className="mr-2 h-4 w-4 text-primary" />
                <span className={timeRemaining <= 0 ? "text-destructive font-medium" : isExpiringSoon ? "text-yellow-600 font-medium" : ""}>
                  {formatTimeRemaining(timeRemaining)}
                </span>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-foreground">Tipo do Token</Label>
              <div className="flex items-center text-sm text-muted-foreground mt-2">
                <Shield className="mr-2 h-4 w-4 text-primary" />
                <span>{token.token_type || "Bearer"}</span>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-foreground">Usuário</Label>
              <div className="flex items-center text-sm text-muted-foreground mt-2">
                <User className="mr-2 h-4 w-4 text-primary" />
                <span>{token.username}</span>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-foreground">Endpoint</Label>
              <div className="bg-muted p-3 rounded-lg mt-2">
                <code className="text-xs text-muted-foreground break-all">
                  {token.endpoint}
                </code>
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex flex-wrap gap-4">
            {/* Só mostrar o botão de renovar se o token não estiver expirado */}
            {timeRemaining > 0 && (
              <Button 
                onClick={handleRefreshToken}
                disabled={isRefreshing || !token.refresh_token}
                variant="default"
              >
                {isRefreshing ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Renovar Token
              </Button>
            )}
            
            <Button 
              onClick={handleCopyToken}
              variant="outline"
            >
              <Copy className="mr-2 h-4 w-4" />
              Copiar Token
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* API Testing Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Code className="mr-2 h-5 w-5 text-primary" />
            Testar APIs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="apiEndpoint" className="text-sm font-medium text-foreground">
              Endpoint da API
            </Label>
            <Input
              id="apiEndpoint"
              type="url"
              value={apiEndpoint}
              onChange={(e) => setApiEndpoint(e.target.value)}
              placeholder="https://erp-simpleit.sytes.net:8051/api/..."
              className="mt-2"
            />
          </div>
          
          <div className="flex flex-wrap gap-4">
            <Button 
              onClick={handleTestApi}
              variant="default"
              className="bg-green-600 hover:bg-green-700"
            >
              <Play className="mr-2 h-4 w-4" />
              Testar GET
            </Button>
            
            <Button variant="outline">
              <Book className="mr-2 h-4 w-4" />
              Documentação
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}