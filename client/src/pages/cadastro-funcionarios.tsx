import { useState, useEffect } from "react";
import { Users, Loader2, RefreshCw } from "lucide-react";
import { AuthService } from "@/lib/auth";
import { EndpointService } from "@/lib/endpoint";
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
      // Obter o endpoint configurado
      const endpoint = await EndpointService.getDefaultEndpoint();
      
      // Obter o token de autenticação
      const token = AuthService.getStoredToken();
      if (!token) {
        throw new Error("Usuário não autenticado. Faça login novamente.");
      }

      // Fazer a requisição para a API usando o novo endpoint
      let response = await fetch(`/api/proxy?endpoint=${encodeURIComponent(endpoint)}&path=${encodeURIComponent(`/api/framework/v1/consultaSQLServer/RealizaConsulta/IA.RH.FUN.0002/1/P`)}&token=${encodeURIComponent(token.access_token)}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      });
      
      // Se o token expirou, tentar fazer login novamente
      if (response.status === 401) {
        console.log("Token expirado, tentando fazer login novamente...");
        
        // Fazer login novamente usando as credenciais armazenadas
        const loginResponse = await fetch(`/api/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            endpoint: `http://${endpoint}`,
            grant_type: "password",
            username: "mestre",  // Usar credenciais padrão para demonstração
            password: "totvs"    // Em produção, isso deveria vir de um armazenamento seguro
          })
        });
        
        if (!loginResponse.ok) {
          throw new Error("Falha ao renovar a sessão. Por favor, faça login novamente.");
        }
        
        const newToken = await loginResponse.json();
        AuthService.storeToken({
          ...newToken,
          username: "mestre",
          endpoint: endpoint
        });
        
        // Tentar a requisição novamente com o novo token
        response = await fetch(`/api/proxy?endpoint=${encodeURIComponent(endpoint)}&path=${encodeURIComponent(`/api/framework/v1/consultaSQLServer/RealizaConsulta/IA.RH.FUN.0002/1/P`)}&token=${encodeURIComponent(newToken.access_token)}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json"
          }
        });
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
