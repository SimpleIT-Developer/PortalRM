import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AuthService } from "@/lib/auth";
import { getTenant } from "@/lib/tenant";
// import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, ArrowUp, ArrowDown, Eye, RefreshCw, CheckCircle, AlertCircle, UserPlus, FileText, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { Fornecedor, FornecedorResponse } from "@shared/schema";

// Função para formatar CNPJ
function formatCNPJ(cnpj: string) {
  if (!cnpj) return cnpj;
  const numbers = cnpj.replace(/\D/g, '');
  
  if (numbers.length === 14) {
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  
  return cnpj;
}

// Função para formatar data
function formatDate(dateString: string) {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  } catch {
    return dateString;
  }
}

function FornecedoresPage() {
  const { toast } = useToast();
  
  // Estados dos filtros
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [sortBy, setSortBy] = useState("data_cadastro");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Estados dos modais
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedFornecedor, setSelectedFornecedor] = useState<Fornecedor | null>(null);
  const [verificandoERP, setVerificandoERP] = useState<number | null>(null);
  const [realizandoPreCadastro, setRealizandoPreCadastro] = useState<number | null>(null);
  
  // Estados para logs SOAP
  const [soapLogsModalOpen, setSoapLogsModalOpen] = useState(false);
  const [soapLogs, setSoapLogs] = useState<any[]>([]);
  const [buscandoLogs, setBuscandoLogs] = useState<number | null>(null);
  const [limpandoLogs, setLimpandoLogs] = useState(false);
  const [fornecedorSelecionadoLogs, setFornecedorSelecionadoLogs] = useState<any>(null);

  const handleRefreshFornecedores = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/fornecedores"] });
    toast({
      title: "Fornecedores Atualizados",
      description: "Dados dos fornecedores atualizados com sucesso!",
    });
  };

  const { data: fornecedorData, isLoading, error } = useQuery({
    queryKey: ["/api/fornecedores", { 
      search, 
      page, 
      limit, 
      sortBy, 
      sortOrder 
    }],
    queryFn: async () => {
      const params = new URLSearchParams({
        search,
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder
      });
      
      const response = await fetch(`/api/fornecedores?${params}`, {
        headers: {
          Authorization: `Bearer ${AuthService.getStoredToken()?.access_token || ""}`,
          ...(getTenant() ? { "X-Tenant": getTenant()! } : {})
        },
      });
      if (!response.ok) {
        throw new Error("Erro ao carregar fornecedores");
      }
      return response.json() as Promise<FornecedorResponse>;
    },
  });

  // Mutação para verificar cadastro no ERP (comentada - API correspondente foi desabilitada)
  /*
  const verificarERPMutation = useMutation({
    mutationFn: async (fornecedor: Fornecedor) => {
      const cnpjFormatted = formatCNPJ(fornecedor.cnpj);
      const response = await fetch(`/api/fornecedores/verificar-erp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ 
          fornecedorId: fornecedor.id,
          cnpj: cnpjFormatted 
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao verificar cadastro no ERP");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setVerificandoERP(null);
      if (data.cadastrado) {
        toast({
          title: "Sucesso",
          description: "Fornecedor cadastrado no ERP",
        });
      } else {
        toast({
          title: "Informação",
          description: "Fornecedor ainda não foi cadastrado no ERP",
        });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/fornecedores"] });
    },
    onError: (error: any) => {
      setVerificandoERP(null);
      toast({
        title: "Erro",
        description: error.message || "Erro ao verificar cadastro no ERP",
        variant: "destructive",
      });
    },
  });
  */

  // Mutação para realizar pré-cadastro no ERP
  const preCadastroERPMutation = useMutation({
    mutationFn: async (fornecedor: Fornecedor) => {
      const response = await fetch(`/api/fornecedores/pre-cadastro-erp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          ...(getTenant() ? { "X-Tenant": getTenant()! } : {})
        },
        body: JSON.stringify({ 
          fornecedorId: fornecedor.id
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao realizar pré-cadastro no ERP");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setRealizandoPreCadastro(null);
      if (data.success) {
        toast({
          title: "Pré-cadastro Realizado",
          description: data.erpCode 
            ? `Fornecedor pré-cadastrado no ERP com código ${data.erpCode}`
            : "Pré-cadastro realizado com sucesso no ERP",
        });
      } else {
        toast({
          title: "Informação",
          description: data.message || "Não foi possível realizar o pré-cadastro",
          variant: "destructive",
        });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/fornecedores"] });
    },
    onError: (error: any) => {
      setRealizandoPreCadastro(null);
      toast({
        title: "Erro no Pré-cadastro",
        description: error.message || "Erro ao realizar pré-cadastro no ERP",
        variant: "destructive",
      });
    },
  });

  const fornecedores = fornecedorData?.fornecedores || [];
  const total = fornecedorData?.total || 0;
  const totalPages = fornecedorData?.totalPages || 0;

  // Funções de ação
  const handleView = (fornecedor: Fornecedor) => {
    setSelectedFornecedor(fornecedor);
    setViewModalOpen(true);
  };

  // Função para verificar ERP (comentada - funcionalidade desabilitada)
  /*
  const handleVerificarERP = (fornecedor: Fornecedor) => {
    setVerificandoERP(fornecedor.id);
    verificarERPMutation.mutate(fornecedor);
  };
  */

  // Função para realizar pré-cadastro no ERP
  const handlePreCadastroERP = (fornecedor: Fornecedor) => {
    setRealizandoPreCadastro(fornecedor.id);
    preCadastroERPMutation.mutate(fornecedor);
  };

  // Função para buscar logs SOAP
  const handleViewSoapLogs = async (fornecedor: Fornecedor) => {
    setBuscandoLogs(fornecedor.id);
    try {
      const response = await fetch(`/api/fornecedores/soap-logs/${fornecedor.cnpj.replace(/[^\d]/g, '')}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          ...(getTenant() ? { "X-Tenant": getTenant()! } : {})
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setSoapLogs(data.logs || []);
        setFornecedorSelecionadoLogs(fornecedor);
        setSoapLogsModalOpen(true);
      } else {
        toast({
          title: "Erro",
          description: data.message || "Erro ao buscar logs SOAP",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro de Conexão",
        description: "Erro ao conectar com o servidor",
        variant: "destructive",
      });
    } finally {
      setBuscandoLogs(null);
    }
  };

  // Função para limpar logs SOAP
  const handleLimparLogs = async () => {
    if (!fornecedorSelecionadoLogs) return;
    
    setLimpandoLogs(true);
    try {
      const response = await fetch(`/api/fornecedores/soap-logs/${fornecedorSelecionadoLogs.cnpj.replace(/[^\d]/g, '')}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          ...(getTenant() ? { "X-Tenant": getTenant()! } : {})
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setSoapLogs([]);
        toast({
          title: "Logs Limpos",
          description: "Logs SOAP foram excluídos com sucesso",
        });
      } else {
        toast({
          title: "Erro",
          description: data.message || "Erro ao limpar logs SOAP",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro de Conexão",
        description: "Erro ao conectar com o servidor",
        variant: "destructive",
      });
    } finally {
      setLimpandoLogs(false);
    }
  };

  // Função para limpar filtros
  const handleClearFilters = () => {
    setSearch("");
    setPage(1);
  };

  // Função para ordenação de colunas
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
    setPage(1);
  };

  // Função para renderizar ícone de ordenação
  const renderSortIcon = (column: string) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="w-4 h-4 ml-1 text-gray-500" />;
    }
    return sortOrder === "asc" 
      ? <ArrowUp className="w-4 h-4 ml-1 text-primary" />
      : <ArrowDown className="w-4 h-4 ml-1 text-primary" />;
  };

  // Função de busca com debounce
  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">
              Gerencie os fornecedores do sistema
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-primary">
              {total} {total === 1 ? "fornecedor" : "fornecedores"}
            </Badge>
            <Button
              onClick={handleRefreshFornecedores}
              className="bg-yellow-500 hover:bg-yellow-600 text-black"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar Fornecedores
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="glassmorphism border-white/20">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar em todos os campos..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder-gray-400"
                />
              </div>
              {search && (
                <Button 
                  variant="outline" 
                  onClick={handleClearFilters}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Limpar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Data Grid */}
        <Card className="glassmorphism border-white/20">
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="flex items-center justify-center min-h-[400px]">
                  <Card className="glassmorphism border-blue-500/20">
                    <CardContent className="pt-6 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-white">Carregando fornecedores...</p>
                    </CardContent>
                  </Card>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center min-h-[400px]">
                  <Card className="glassmorphism border-red-500/20">
                    <CardContent className="pt-6 text-center">
                      <p className="text-red-400">Erro ao carregar fornecedores</p>
                      <p className="text-gray-400 text-sm mt-2">
                        Verifique sua conexão e tente novamente
                      </p>
                    </CardContent>
                  </Card>
                </div>
              ) : fornecedores.length === 0 ? (
                <div className="flex items-center justify-center min-h-[400px]">
                  <Card className="glassmorphism border-yellow-500/20">
                    <CardContent className="pt-6 text-center">
                      <p className="text-yellow-400">
                        {search
                          ? "Nenhum fornecedor encontrado com os filtros aplicados"
                          : "Nenhum fornecedor encontrado"}
                      </p>
                      <p className="text-gray-400 text-sm mt-2">
                        {search
                          ? "Tente ajustar os filtros de busca"
                          : "Os fornecedores aparecerão aqui quando disponíveis"}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="bg-white/5 rounded-lg">
                  <table className="w-full table-fixed">
                    <thead className="bg-white/10">
                      <tr>
                        <th className="text-left py-3 px-2 w-40">
                          <Button
                            variant="ghost"
                            onClick={() => handleSort("nome")}
                            className="text-gray-300 hover:text-white p-0 h-auto font-semibold text-xs"
                          >
                            Nome {renderSortIcon("nome")}
                          </Button>
                        </th>
                        <th className="text-left py-3 px-2 w-32">
                          <Button
                            variant="ghost"
                            onClick={() => handleSort("cnpj")}
                            className="text-gray-300 hover:text-white p-0 h-auto font-semibold text-xs"
                          >
                            CNPJ {renderSortIcon("cnpj")}
                          </Button>
                        </th>
                        <th className="text-left py-3 px-2 w-32">
                          <Button
                            variant="ghost"
                            onClick={() => handleSort("codigo_erp")}
                            className="text-gray-300 hover:text-white p-0 h-auto font-semibold text-xs"
                          >
                            ERP {renderSortIcon("codigo_erp")}
                          </Button>
                        </th>
                        <th className="text-left py-3 px-2 w-24">
                          <Button
                            variant="ghost"
                            onClick={() => handleSort("data_cadastro")}
                            className="text-gray-300 hover:text-white p-0 h-auto font-semibold text-xs"
                          >
                            Data {renderSortIcon("data_cadastro")}
                          </Button>
                        </th>
                        <th className="text-left py-3 px-2 w-24">
                          <span className="text-gray-300 font-semibold text-xs">Ações</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {fornecedores.map((fornecedor, index) => (
                        <tr 
                          key={fornecedor.id} 
                          className="border-b border-white/5 hover:bg-white/5 transition-colors"
                        >
                          <td className="py-2 px-2 text-white text-sm truncate" title={fornecedor.nome}>
                            {fornecedor.nome}
                          </td>
                          <td className="py-2 px-2 text-gray-300 font-mono text-sm">
                            {formatCNPJ(fornecedor.cnpj)}
                          </td>
                          <td className="py-2 px-2">
                            {fornecedor.codigo_erp ? (
                              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                {fornecedor.codigo_erp}
                              </Badge>
                            ) : (
                              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Não cadastrado no ERP
                              </Badge>
                            )}
                          </td>
                          <td className="py-2 px-2 text-gray-300 text-sm">
                            {formatDate(fornecedor.data_cadastro)}
                          </td>
                          <td className="py-2 px-2">
                            <div className="flex space-x-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleView(fornecedor)}
                                className="border-blue-500/30 text-blue-400 hover:bg-blue-500/20 w-7 h-7 p-0"
                                title="Visualizar"
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                              {/* Novo botão de pré-cadastro no ERP */}
                              {!fornecedor.codigo_erp && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handlePreCadastroERP(fornecedor)}
                                  disabled={realizandoPreCadastro === fornecedor.id}
                                  className="border-purple-500/30 text-purple-400 hover:bg-purple-500/20 w-7 h-7 p-0"
                                  title="Realizar Pré-Cadastro no ERP"
                                >
                                  {realizandoPreCadastro === fornecedor.id ? (
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <UserPlus className="w-3 h-3" />
                                  )}
                                </Button>
                              )}
                              {/* Botão LOG para visualizar logs SOAP */}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewSoapLogs(fornecedor)}
                                disabled={buscandoLogs === fornecedor.id}
                                className="border-orange-500/30 text-orange-400 hover:bg-orange-500/20 w-7 h-7 p-0"
                                title="Visualizar Logs SOAP de Debug"
                              >
                                {buscandoLogs === fornecedor.id ? (
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                ) : (
                                  <FileText className="w-3 h-3" />
                                )}
                              </Button>
                              {/* Botão de verificação ERP comentado - funcionalidade desabilitada
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleVerificarERP(fornecedor)}
                                disabled={verificandoERP === fornecedor.id}
                                className="border-green-500/30 text-green-400 hover:bg-green-500/20 w-7 h-7 p-0"
                                title="Verificar Cadastro no ERP"
                              >
                                {verificandoERP === fornecedor.id ? (
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                ) : (
                                  <RefreshCw className="w-3 h-3" />
                                )}
                              </Button>
                              */}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
                <div className="text-gray-400 text-sm">
                  Mostrando {((page - 1) * limit) + 1} a {Math.min(page * limit, total)} de {total} {total === 1 ? "registro" : "registros"} • Página {page} de {totalPages}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (page > 1) {
                        setPage(1);
                      }
                    }}
                    disabled={page === 1}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (page > 1) {
                        setPage(prev => prev - 1);
                      }
                    }}
                    disabled={page === 1}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-white px-3 py-1 bg-primary/20 rounded border border-primary/30">
                    {page}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (page < totalPages) {
                        setPage(prev => prev + 1);
                      }
                    }}
                    disabled={page >= totalPages}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (page < totalPages) {
                        setPage(totalPages);
                      }
                    }}
                    disabled={page >= totalPages}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de Visualização */}
        <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
          <DialogContent className="glassmorphism border-white/20 bg-black/90 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">Visualizar Fornecedor</DialogTitle>
            </DialogHeader>
            {selectedFornecedor && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-300 text-sm font-medium">ID</label>
                    <p className="text-white">{selectedFornecedor.id}</p>
                  </div>
                  <div>
                    <label className="text-gray-300 text-sm font-medium">CNPJ</label>
                    <p className="text-white">{formatCNPJ(selectedFornecedor.cnpj)}</p>
                  </div>
                </div>
                <div>
                  <label className="text-gray-300 text-sm font-medium">Nome</label>
                  <p className="text-white">{selectedFornecedor.nome}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-300 text-sm font-medium">Código ERP</label>
                    <p className="text-white">
                      {selectedFornecedor.codigo_erp || "Não cadastrado no ERP"}
                    </p>
                  </div>
                  <div>
                    <label className="text-gray-300 text-sm font-medium">Data de Cadastro</label>
                    <p className="text-white">{formatDate(selectedFornecedor.data_cadastro)}</p>
                  </div>
                </div>
                <div className="flex justify-end pt-4">
                  <Button 
                    onClick={() => setViewModalOpen(false)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-black"
                  >
                    Fechar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal de Logs SOAP */}
        <Dialog open={soapLogsModalOpen} onOpenChange={setSoapLogsModalOpen}>
          <DialogContent className="glassmorphism border-white/20 bg-black/90 max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Logs SOAP de Debug - {selectedFornecedor?.nome}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {soapLogs.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">Nenhum log SOAP encontrado para este fornecedor.</p>
                  <p className="text-gray-500 text-sm mt-2">
                    Logs são criados quando você realiza um pré-cadastro no ERP.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {soapLogs.map((log, index) => (
                    <Card key={index} className="glassmorphism border-white/10 bg-white/5">
                      <CardContent className="pt-4">
                        <div className="space-y-3">
                          {/* Header do log */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-blue-400" />
                              <span className="text-blue-400 font-medium">
                                {new Date(log.timestamp).toLocaleString('pt-BR')}
                              </span>
                            </div>
                            {log.erpCode && (
                              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                ERP: {log.erpCode}
                              </Badge>
                            )}
                          </div>
                          
                          {/* Request SOAP */}
                          <div>
                            <h4 className="text-yellow-400 font-medium mb-2">📤 Requisição SOAP Enviada:</h4>
                            <div className="bg-black/40 p-3 rounded border border-white/10 max-h-40 overflow-y-auto">
                              <pre className="text-gray-300 text-xs whitespace-pre-wrap">
                                {log.request}
                              </pre>
                            </div>
                          </div>
                          
                          {/* Response SOAP */}
                          <div>
                            <h4 className="text-green-400 font-medium mb-2">📥 Resposta SOAP Recebida:</h4>
                            <div className="bg-black/40 p-3 rounded border border-white/10 max-h-40 overflow-y-auto">
                              <pre className="text-gray-300 text-xs whitespace-pre-wrap">
                                {log.response}
                              </pre>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              
              <div className="flex justify-between pt-4 border-t border-white/10">
                <Button 
                  onClick={handleLimparLogs}
                  disabled={limpandoLogs}
                  className="bg-red-600 hover:bg-red-700 disabled:opacity-50"
                >
                  {limpandoLogs ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Limpando...
                    </>
                  ) : (
                    'LIMPAR LOG'
                  )}
                </Button>
                
                <Button 
                  onClick={() => setSoapLogsModalOpen(false)}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black"
                >
                  Fechar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}

export default FornecedoresPage;
