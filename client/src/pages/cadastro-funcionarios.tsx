import { useState, useEffect } from "react";
import { Users, Loader2, RefreshCw } from "lucide-react";
import { AuthService } from "@/lib/auth";
import { getTenant } from "@/lib/tenant";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { columns, Funcionario } from "./funcionarios-columns";

export default function CadastroFuncionariosPage() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchFuncionarios = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Obter o token de autenticação
      const token = AuthService.getStoredToken();
      if (!token || !token.environmentId) {
        throw new Error("Usuário não autenticado. Faça login novamente.");
      }

      const environmentId = token.environmentId;

      // Fazer a requisição para a API usando o novo endpoint
      let response = await fetch(`/api/proxy?environmentId=${encodeURIComponent(environmentId)}&path=${encodeURIComponent(`/api/framework/v1/consultaSQLServer/RealizaConsulta/IA.RH.FUN.0002/1/P`)}&token=${encodeURIComponent(token.access_token)}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(getTenant() ? { 'X-Tenant': getTenant()! } : {})
        }
      });
      
      // Se o token expirou, tentar fazer refresh
      if (response.status === 401) {
        console.log("Token expirado, tentando renovar...");
        
        try {
            if (token.refresh_token) {
                const newToken = await AuthService.refreshToken(token.refresh_token);
                AuthService.storeToken(newToken);
                
                // Tentar a requisição novamente com o novo token
                response = await fetch(`/api/proxy?environmentId=${encodeURIComponent(environmentId)}&path=${encodeURIComponent(`/api/framework/v1/consultaSQLServer/RealizaConsulta/IA.RH.FUN.0002/1/P`)}&token=${encodeURIComponent(newToken.access_token)}`, {
                  method: "GET",
                  headers: {
                    "Content-Type": "application/json",
                    ...(getTenant() ? { 'X-Tenant': getTenant()! } : {})
                  }
                });
            } else {
                throw new Error("Refresh token indisponível");
            }
        } catch (refreshError) {
             throw new Error("Sessão expirada. Por favor, faça login novamente.");
        }
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao buscar funcionários: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Resposta da API:', data);
      
      // O novo endpoint retorna diretamente um array de funcionários
      setFuncionarios(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao buscar funcionários:", error);
      setError(error instanceof Error ? error.message : "Erro desconhecido ao buscar funcionários");
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro desconhecido ao buscar funcionários",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFuncionarios();
  }, [toast]);

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Página */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            Cadastro de Funcionários
          </h1>
          <p className="text-muted-foreground mt-2">
            Gerenciamento de funcionários da empresa
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchFuncionarios} 
          disabled={loading}
          className="gap-2"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Atualizar
        </Button>
      </div>

      {/* Tabela de Funcionários */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            Lista de Funcionários
          </CardTitle>
          <CardDescription>
            Total de {funcionarios.length} funcionários encontrados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="p-4 text-center text-red-500">
              <p>{error}</p>
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-4" />
              <p>Carregando dados dos funcionários...</p>
            </div>
          ) : (
            <DataTable 
              columns={columns} 
              data={funcionarios} 
              filterColumn="NOME"
              filterPlaceholder="Filtrar por nome..."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
