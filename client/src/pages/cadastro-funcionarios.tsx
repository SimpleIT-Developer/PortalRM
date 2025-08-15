import { useState, useEffect } from "react";
import { Users } from "lucide-react";
import { AuthService } from "@/lib/auth";
import { EndpointService } from "@/lib/endpoint";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface Funcionario {
  CHAPA: string;
  CODSITUACAO: string;
  SALARIO: number;
  DATAADMISSAO: string;
  NOME: string;
  EMAIL: string;
  NOME_SECAO: string;
  CPF: string;
  JORNADA_MENSAL: number;
  NOMEFILIAL: string;
  NOMEDOCARGO: string;
  DTNASCIMENTO: string;
  NOMEDEPARTAMENTO: string;
}

export default function CadastroFuncionariosPage() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
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

    fetchFuncionarios();
  }, [toast]);

  // Função para formatar data (YYYY-MM-DD para DD/MM/YYYY)
  const formatarData = (dataString: string) => {
    if (!dataString) return "";
    
    try {
      const data = new Date(dataString);
      return data.toLocaleDateString('pt-BR');
    } catch (error) {
      return dataString;
    }
  };

  // Função para formatar valor monetário
  const formatarMoeda = (valor: number) => {
    return valor?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || "";
  };

  // Função para formatar CPF (XXX.XXX.XXX-XX)
  const formatarCPF = (cpf: string) => {
    if (!cpf) return "";
    
    // Remove caracteres não numéricos
    const cpfNumerico = cpf.replace(/\D/g, '');
    
    // Verifica se tem 11 dígitos
    if (cpfNumerico.length !== 11) return cpf;
    
    // Formata o CPF
    return cpfNumerico.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
  };

  // Função para obter o status baseado no código de situação
  const obterStatus = (codSituacao: string) => {
    const situacoes: Record<string, { label: string, variant: "default" | "outline" | "secondary" | "destructive" }> = {
      "A": { label: "Ativo", variant: "default" },
      "D": { label: "Demitido", variant: "destructive" },
      "F": { label: "Férias", variant: "secondary" },
      "L": { label: "Licença", variant: "outline" },
    };

    return situacoes[codSituacao] || { label: codSituacao, variant: "outline" };
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Página */}
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center">
          <Users className="mr-3 h-8 w-8 text-primary" />
          Cadastro de Funcionários
        </h1>
        <p className="text-muted-foreground mt-2">
          Gerenciamento de funcionários da empresa
        </p>
      </div>

      {/* Tabela de Funcionários */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5 text-primary" />
            Lista de Funcionários
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="p-4 text-center text-red-500">
              <p>{error}</p>
            </div>
          ) : (
            <Table>
              <TableCaption>Lista de funcionários cadastrados no sistema</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Chapa</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Filial</TableHead>
                  <TableHead>Admissão</TableHead>
                  <TableHead>Salário</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  // Esqueleto de carregamento
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={`skeleton-${index}`}>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    </TableRow>
                  ))
                ) : funcionarios.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                      Nenhum funcionário encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  funcionarios.map((funcionario, index) => {
                    const status = obterStatus(funcionario.CODSITUACAO);
                    
                    return (
                      <TableRow key={`${funcionario.CHAPA}-${index}`}>
                        <TableCell className="font-medium">{funcionario.CHAPA}</TableCell>
                        <TableCell>{funcionario.NOME}</TableCell>
                        <TableCell>{funcionario.NOMEDOCARGO}</TableCell>
                        <TableCell>{funcionario.NOMEDEPARTAMENTO}</TableCell>
                        <TableCell>{funcionario.NOMEFILIAL}</TableCell>
                        <TableCell>{formatarData(funcionario.DATAADMISSAO)}</TableCell>
                        <TableCell>{formatarMoeda(funcionario.SALARIO)}</TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}