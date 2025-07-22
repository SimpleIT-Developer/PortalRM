import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { AuthService, type StoredToken } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  LogOut, 
  Copy, 
  RefreshCw, 
  Key, 
  Clock, 
  Shield, 
  Code, 
  Play, 
  Book,
  Box,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState<StoredToken | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiEndpoint, setApiEndpoint] = useState("https://legiaoda142256.rm.cloudtotvs.com.br:8051/api/");
  const { toast } = useToast();

  useEffect(() => {
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
      AuthService.clearToken();
      setLocation("/");
      return;
    }

    setToken(storedToken);
  }, [setLocation, toast]);

  const handleLogout = () => {
    AuthService.clearToken();
    setLocation("/");
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso.",
    });
  };

  const handleRefreshToken = async () => {
    if (!token?.refresh_token) {
      toast({
        title: "Erro",
        description: "Nenhum refresh token disponível",
        variant: "destructive",
      });
      return;
    }

    setIsRefreshing(true);
    try {
      const newTokenData = await AuthService.refreshToken({
        grant_type: "refresh_token",
        refresh_token: token.refresh_token,
      });

      AuthService.storeToken(newTokenData, token.username);
      const updatedToken = AuthService.getStoredToken();
      setToken(updatedToken);

      toast({
        title: "Sucesso",
        description: "Token renovado com sucesso!",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao renovar token";
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
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

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const timeRemaining = Math.max(0, token.expires_in - Math.floor((Date.now() - token.timestamp) / 1000));
  const isExpiringSoon = timeRemaining < 60;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-primary rounded flex items-center justify-center mr-3">
                <Box className="text-primary-foreground text-sm" size={16} />
              </div>
              <h1 className="text-xl font-medium text-foreground">TOTVS RM</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-muted-foreground">
                <span>Bem-vindo, </span>
                <span className="font-medium text-foreground">{token.username}</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Token Expiry Warning */}
        {isExpiringSoon && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Atenção:</strong> Seu token expira em {timeRemaining} segundos. 
              Considere renová-lo para manter o acesso.
            </AlertDescription>
          </Alert>
        )}

        {/* Token Info Card */}
        <Card className="mb-8">
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
                  <span className={isExpiringSoon ? "text-destructive font-medium" : ""}>
                    {timeRemaining} segundos
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
            </div>

            <Separator />

            <div className="flex flex-wrap gap-4">
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
                placeholder="https://legiaoda142256.rm.cloudtotvs.com.br:8051/api/..."
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
      </main>
    </div>
  );
}
