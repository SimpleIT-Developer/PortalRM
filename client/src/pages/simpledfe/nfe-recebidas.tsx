import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AuthService } from "@/lib/auth";
// import { Layout } from "@/components/layout";
import { AnimatedLogo } from "@/components/simpledfe/animated-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/ui/date-input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Search as SearchIcon,
  Download, 
  RefreshCw, 
  Printer,
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  Upload,
  Trash2,
  CheckSquare,
  Square,
  MoreVertical,
  FileText,
  CheckCircle2,
  XCircle,
  Eye,
  Clock
} from "lucide-react";
import type { NFeRecebida, NFeResponse, EventoNFe } from "@shared/schema";

// Função para formatar CNPJ
const formatCNPJ = (cnpj: string): string => {
  if (!cnpj) return '';
  const cleaned = cnpj.replace(/\D/g, '');
  if (cleaned.length !== 14) return cnpj;
  return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
};

export default function NFeRecebidasPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "integrated" | "not_integrated">("all");
  const [empresa, setEmpresa] = useState("");
  const [fornecedor, setFornecedor] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [sortBy, setSortBy] = useState<keyof NFeRecebida>("doc_date_emi");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isImporting, setIsImporting] = useState(false);
  
  // Estados para seleção de linhas
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  
  // Estados para dialog de eventos
  const [eventosDialogOpen, setEventosDialogOpen] = useState(false);
  const [eventosData, setEventosData] = useState<EventoNFe[]>([]);
  const [loadingEventos, setLoadingEventos] = useState(false);

  const { data: nfeData, isLoading, error } = useQuery({
    queryKey: ["nfe-recebidas", search, status, empresa, fornecedor, dataInicio, dataFim, page, limit, sortBy, sortOrder],
    queryFn: async () => {
      const params = new URLSearchParams({
        search,
        status,
        empresa,
        fornecedor,
        dataInicio,
        dataFim,
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder
      });
      
      const response = await fetch(`/api/nfe-recebidas?${params}`, {
        headers: {
          ...(getTenant() ? { "X-Tenant": getTenant()! } : {})
        }
      });
      if (!response.ok) {
        throw new Error("Erro ao carregar NFe recebidas");
      }
      return response.json() as Promise<NFeResponse>;
    },
  });

  const handleSort = (column: keyof NFeRecebida) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
    setPage(1);
  };

  // Função para buscar eventos de uma NFe
  const handleVisualizarEventos = async (nfe: NFeRecebida) => {
    setLoadingEventos(true);
    setEventosDialogOpen(true);
    
    try {
      const response = await fetch(`/api/nfe-eventos/${nfe.doc_id}`, {
        headers: {
          'Authorization': `Bearer ${AuthService.getStoredToken()?.access_token || ""}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Erro ao buscar eventos');
      }
      
      const data = await response.json();
      setEventosData(data.eventos || []);
    } catch (error) {
      console.error('Erro ao buscar eventos:', error);
      toast({
        title: "Erro",
        description: "Erro ao buscar eventos da NFe",
        variant: "destructive",
      });
      setEventosData([]);
    } finally {
      setLoadingEventos(false);
    }
  };

  // Funções para controle de seleção
  const handleSelectRow = (docId: number, checked: boolean) => {
    const newSelectedRows = new Set(selectedRows);
    if (checked) {
      newSelectedRows.add(docId);
    } else {
      newSelectedRows.delete(docId);
    }
    setSelectedRows(newSelectedRows);
    setSelectAll(newSelectedRows.size === nfes.length && nfes.length > 0);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(nfes.map(nfe => nfe.doc_id));
      setSelectedRows(allIds);
    } else {
      setSelectedRows(new Set());
    }
    setSelectAll(checked);
  };

  const clearSelection = () => {
    setSelectedRows(new Set());
    setSelectAll(false);
  };

  // Ações em lote
  const handleBulkDownloadXML = async () => {
    if (selectedRows.size === 0) {
      toast({
        title: "Nenhuma NFe selecionada",
        description: "Selecione pelo menos uma NFe para download XML",
        variant: "destructive",
      });
      return;
    }

    try {
      const docIds = Array.from(selectedRows);
      
      const response = await fetch('/api/nfe-bulk-download-xml', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          ...(getTenant() ? { "X-Tenant": getTenant()! } : {})
        },
        body: JSON.stringify({ docIds }),
      });

      if (!response.ok) {
        throw new Error('Erro no download');
      }

      // Criar blob para download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'xml_nfe.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Download XML iniciado",
        description: `Download de ${selectedRows.size} XML(s) NFe iniciado`,
      });

      // Limpar seleção após download
      clearSelection();
    } catch (error) {
      console.error('Erro no download XML:', error);
      toast({
        title: "Erro no download",
        description: "Erro ao iniciar download dos XMLs",
        variant: "destructive",
      });
    }
  };

  const handleBulkDownloadDANFE = async () => {
    if (selectedRows.size === 0) {
      toast({
        title: "Nenhuma NFe selecionada",
        description: "Selecione pelo menos uma NFe para download DANFE",
        variant: "destructive",
      });
      return;
    }

    try {
      const docIds = Array.from(selectedRows);
      
      const response = await fetch('/api/nfe-bulk-download-danfe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ docIds }),
      });

      if (!response.ok) {
        throw new Error('Erro no download');
      }

      // Criar blob para download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'danfe_nfe.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Download DANFE iniciado",
        description: `Download de ${selectedRows.size} DANFE(s) NFe iniciado`,
      });

      // Limpar seleção após download
      clearSelection();
    } catch (error) {
      console.error('Erro no download DANFE:', error);
      toast({
        title: "Erro no download",
        description: "Erro ao iniciar download dos DANFEs",
        variant: "destructive",
      });
    }
  };

  const handleBulkDelete = () => {
    if (selectedRows.size === 0) {
      toast({
        title: "Nenhuma NFe selecionada",
        description: "Selecione pelo menos uma NFe para exclusão",
        variant: "destructive",
      });
      return;
    }

    // Aqui você pode implementar um modal de confirmação
    toast({
      title: "Exclusão em Lote",
      description: `${selectedRows.size} NFe(s) seriam excluída(s). Funcionalidade será implementada.`,
      variant: "destructive",
    });
  };

  const handleRefreshNFe = () => {
    queryClient.invalidateQueries({ queryKey: ["nfe-recebidas"] });
    toast({
      title: "NFe Atualizadas",
      description: "Dados das NFe recebidas atualizados com sucesso!",
    });
  };

  // Função para importar XML de NFe
  const handleImportXML = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Verificar se é um arquivo XML
    if (!file.name.toLowerCase().endsWith('.xml')) {
      toast({
        title: "Erro no Arquivo",
        description: "Por favor, selecione um arquivo XML válido.",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);

    try {
      const formData = new FormData();
      formData.append('xmlFile', file);

      const response = await fetch('/api/nfe-import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AuthService.getStoredToken()?.access_token || ""}`,
          ...(getTenant() ? { "X-Tenant": getTenant()! } : {})
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao importar XML');
      }

      const result = await response.json();

      if (result.success) {
        toast({
          title: "XML Importado com Sucesso",
          description: result.message || "A NFe foi importada com sucesso!",
        });
        
        // Atualizar a lista
        queryClient.invalidateQueries({ queryKey: ["nfe-recebidas"] });
      } else {
        throw new Error(result.message || 'Erro ao processar XML');
      }

    } catch (error) {
      console.error('Erro ao importar XML:', error);
      toast({
        title: "Erro na Importação",
        description: error instanceof Error ? error.message : "Erro desconhecido ao importar XML",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      // Limpar o input
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatus("all");
    setEmpresa("");
    setFornecedor("");
    setDataInicio("");
    setDataFim("");
    setPage(1);
  };

  const handleBaixarXML = async (nfe: NFeRecebida) => {
    try {
      // Chama a API através do nosso backend para evitar problemas de CORS
      const response = await fetch(`/api/nfe-download/${nfe.doc_id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          ...(getTenant() ? { "X-Tenant": getTenant()! } : {})
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao baixar XML da NFe');
      }

      // Extrair o nome do arquivo do cabeçalho Content-Disposition
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `nfe_${nfe.doc_id}.xml`; // fallback
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }

      // Baixa o arquivo
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Download Concluído",
        description: `XML da NFe ${nfe.doc_num} baixado com sucesso!`,
      });
    } catch (error) {
      toast({
        title: "Erro no Download",
        description: "Não foi possível baixar o XML da NFe. Verifique se o serviço está disponível.",
        variant: "destructive",
      });
    }
  };

  const handleIntegrarERP = (nfe: NFeRecebida) => {
    toast({
      title: "Integração Automática",
      description: "As NFe estão sendo integradas automaticamente. A funcionalidade de integração individual será implementada em breve.",
    });
  };

  const handleImprimirDANFE = async (nfe: NFeRecebida) => {
    try {
      // Fazer a requisição com autenticação
      const response = await fetch(`/api/nfe-danfe/${nfe.doc_id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${AuthService.getStoredToken()?.access_token || ""}`,
          ...(getTenant() ? { "X-Tenant": getTenant()! } : {})
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao gerar DANFE');
      }

      // Criar blob do PDF e abrir em nova guia
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      
      // Limpar URL após um breve delay
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);
      
      toast({
        title: "DANFE Aberto",
        description: `DANFE da NFe ${nfe.doc_num} aberto em nova guia`,
      });
    } catch (error) {
      toast({
        title: "Erro ao Abrir DANFE",
        description: "Não foi possível abrir o DANFE. Verifique se o serviço está disponível.",
        variant: "destructive",
      });
    }
  };

  const getSortIcon = (column: keyof NFeRecebida) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="w-4 h-4" />;
    }
    return sortOrder === "asc" ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  const formatCpfCnpj = (value: string) => {
    if (!value) return "";
    const cleanValue = value.replace(/\D/g, "");
    if (cleanValue.length === 11) {
      // CPF
      return cleanValue.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    } else if (cleanValue.length === 14) {
      // CNPJ
      return cleanValue.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
    }
    return value;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    // Ajustar timezone para mostrar data local correta
    const localDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    return localDate.toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (nfe: NFeRecebida) => {
    if (nfe.doc_status_integracao === 1) {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Integrado</Badge>;
    } else if (nfe.doc_status_integracao === 0) {
      if (!nfe.doc_codcfo || nfe.doc_codcfo === null) {
        return <Badge className="bg-red-100 text-red-800 border-red-200">Fornecedor não cadastrado!</Badge>;
      } else {
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Não Integrado</Badge>;
      }
    }
    return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Indefinido</Badge>;
  };

  const nfes = nfeData?.nfes || [];
  const totalPages = nfeData?.totalPages || 1;
  const total = nfeData?.total || 0;

  // Limpar seleção quando os dados mudarem (filtros, paginação, etc.)
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    clearSelection();
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">
              Gerencie as notas fiscais eletrônicas recebidas
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-primary">
              {total} {total === 1 ? "NFe" : "NFes"}
            </Badge>
            
            {/* Ações em Lote - só aparecem quando há seleções */}
            {selectedRows.size > 0 && (
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/20 rounded-md border border-blue-500/30">
                <span className="text-blue-400 text-sm font-medium">
                  {selectedRows.size} selecionada{selectedRows.size > 1 ? 's' : ''}
                </span>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleBulkDownloadXML}
                    className="border-blue-500/30 text-blue-400 hover:bg-blue-500/20 h-7"
                    title="Download XML em lote"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    XML
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleBulkDownloadDANFE}
                    className="border-green-500/30 text-green-400 hover:bg-green-500/20 h-7"
                    title="Download DANFE em lote"
                  >
                    <FileText className="w-3 h-3 mr-1" />
                    DANFE
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={clearSelection}
                    className="border-gray-500/30 text-gray-400 hover:bg-gray-500/20 h-7"
                    title="Limpar seleção"
                  >
                    <Square className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )}
            
            {/* Botão de Importar XML */}
            <div className="relative">
              <input
                type="file"
                accept=".xml"
                onChange={handleImportXML}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isImporting}
              />
              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={isImporting}
              >
                <Upload className="w-4 h-4 mr-2" />
                {isImporting ? "Importando..." : "Importar XML"}
              </Button>
            </div>
            
            <Button
              onClick={handleRefreshNFe}
              className="bg-yellow-500 hover:bg-yellow-600 text-black"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar NFe
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="glassmorphism border-white/20">
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="flex items-center space-x-4">
                <div className="relative flex-1">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar em todos os campos..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Select value={status} onValueChange={(value: any) => setStatus(value)}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="integrated">Integrado</SelectItem>
                    <SelectItem value="not_integrated">Não Integrado</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Empresa"
                  value={empresa}
                  onChange={(e) => setEmpresa(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                />

                <Input
                  placeholder="Fornecedor"
                  value={fornecedor}
                  onChange={(e) => setFornecedor(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                />

                <DateInput
                  placeholder="Data Início"
                  value={dataInicio}
                  onChange={setDataInicio}
                />

                <DateInput
                  placeholder="Data Fim"
                  value={dataFim}
                  onChange={setDataFim}
                />
              </div>

              {/* Clear Filters */}
              {(search || status !== "all" || empresa || fornecedor || dataInicio || dataFim) && (
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Limpar Filtros
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* NFe Table */}
        <Card className="glassmorphism border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Lista de NFe Recebidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full">
              {isLoading ? (
                <div className="flex items-center justify-center min-h-[400px]">
                  <Card className="glassmorphism border-blue-500/20">
                    <CardContent className="pt-6 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-white">Carregando NFe recebidas...</p>
                    </CardContent>
                  </Card>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center min-h-[400px]">
                  <Card className="glassmorphism border-red-500/20">
                    <CardContent className="pt-6 text-center">
                      <p className="text-red-400">Erro ao carregar NFe recebidas</p>
                      <p className="text-gray-400 text-sm mt-2">
                        Verifique sua conexão e tente novamente
                      </p>
                    </CardContent>
                  </Card>
                </div>
              ) : (
              <table className="w-full table-fixed">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 pl-2 pr-0 w-8">
                      <Checkbox
                        checked={selectAll}
                        onCheckedChange={handleSelectAll}
                        className="border-white/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        title="Selecionar todos"
                      />
                    </th>
                    <th className="text-center py-3 pl-1 pr-1 w-10">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("doc_status")}
                        className="text-gray-300 hover:text-white p-0 h-auto font-semibold text-xs"
                      >
                        Status {getSortIcon("doc_status")}
                      </Button>
                    </th>
                    <th className="text-left py-3 px-2 w-20">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("doc_num")}
                        className="text-gray-300 hover:text-white p-0 h-auto font-semibold text-xs"
                      >
                        Número {getSortIcon("doc_num")}
                      </Button>
                    </th>
                    <th className="text-left py-3 px-2 w-32">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("doc_dest_nome")}
                        className="text-gray-300 hover:text-white p-0 h-auto font-semibold text-xs"
                      >
                        Empresa {getSortIcon("doc_dest_nome")}
                      </Button>
                    </th>
                    <th className="text-left py-3 px-2 w-32">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("doc_emit_nome")}
                        className="text-gray-300 hover:text-white p-0 h-auto font-semibold text-xs"
                      >
                        Fornecedor {getSortIcon("doc_emit_nome")}
                      </Button>
                    </th>
                    <th className="text-left py-3 px-2 w-24">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("doc_date_emi")}
                        className="text-gray-300 hover:text-white p-0 h-auto font-semibold text-xs"
                      >
                        Data {getSortIcon("doc_date_emi")}
                      </Button>
                    </th>
                    <th className="text-left py-3 px-2 w-24">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("doc_valor")}
                        className="text-gray-300 hover:text-white p-0 h-auto font-semibold text-xs"
                      >
                        Valor {getSortIcon("doc_valor")}
                      </Button>
                    </th>
                    <th className="text-left py-3 px-2 w-24">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("doc_status_integracao")}
                        className="text-gray-300 hover:text-white p-0 h-auto font-semibold text-xs"
                      >
                        Status {getSortIcon("doc_status_integracao")}
                      </Button>
                    </th>
                    <th className="text-left py-3 px-2 w-28">
                      <span className="text-gray-300 font-semibold text-xs">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {nfes.map((nfe, index) => (
                    <tr
                      key={`${nfe.doc_num}-${index}`}
                      className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
                        selectedRows.has(nfe.doc_id) ? 'bg-blue-500/10' : ''
                      }`}
                    >
                      <td className="py-2 pl-2 pr-0">
                        <Checkbox
                          checked={selectedRows.has(nfe.doc_id)}
                          onCheckedChange={(checked) => handleSelectRow(nfe.doc_id, checked as boolean)}
                          className="border-white/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                      </td>
                      <td className="py-2 pl-1 pr-1 text-center" 
                          title={
                            nfe.doc_serie === null || nfe.doc_serie === undefined || nfe.doc_serie === ''
                              ? (nfe.has_evento === 1 ? 'Cancelada' : 'Em Processamento')
                              : nfe.doc_status === 1 
                                ? 'Cancelada' 
                                : 'Autorizada'
                          }>
                        {(() => {
                          // Nova lógica: doc_serie nulo + tem evento = CANCELADA
                          // doc_serie nulo + sem evento = EM PROCESSAMENTO
                          // doc_serie preenchido + doc_status = 1 = CANCELADA
                          // doc_serie preenchido + doc_status != 1 = AUTORIZADA
                          
                          if (nfe.doc_serie === null || nfe.doc_serie === undefined || nfe.doc_serie === '') {
                            if (nfe.has_evento === 1) {
                              return <XCircle className="w-4 h-4 text-red-500 mx-auto" />;
                            } else {
                              return <Clock className="w-4 h-4 text-yellow-500 mx-auto" />;
                            }
                          } else if (nfe.doc_status === 1) {
                            return <XCircle className="w-4 h-4 text-red-500 mx-auto" />;
                          } else {
                            return <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" />;
                          }
                        })()}
                      </td>
                      <td className="py-2 px-2 text-white font-mono text-sm truncate">
                        {nfe.doc_num}
                      </td>
                      <td 
                        className="py-2 px-2 text-white text-sm truncate" 
                        title={`${nfe.empresa_nome || nfe.doc_dest_nome}${nfe.company_cpf_cnpj ? `\nCNPJ: ${formatCNPJ(nfe.company_cpf_cnpj)}` : ''}`}
                      >
                        {nfe.empresa_nome || nfe.doc_dest_nome}
                      </td>
                      <td className="py-2 px-2 text-gray-300 text-sm truncate" title={nfe.doc_emit_nome}>
                        {nfe.doc_emit_nome}
                      </td>
                      <td className="py-2 px-2 text-gray-300 text-sm">
                        {formatDate(nfe.doc_date_emi)}
                      </td>
                      <td className="py-2 px-2 text-gray-300 font-mono text-sm">
                        {formatCurrency(nfe.doc_valor)}
                      </td>
                      <td className="py-2 px-2">
                        {getStatusBadge(nfe)}
                      </td>
                      <td className="py-2 px-2">
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleBaixarXML(nfe)}
                            className="border-blue-500/30 text-blue-400 hover:bg-blue-500/20 w-7 h-7 p-0"
                            title="Baixar XML"
                          >
                            <Download className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleIntegrarERP(nfe)}
                            className="border-green-500/30 text-green-400 hover:bg-green-500/20 w-7 h-7 p-0"
                            title="Integrar com ERP"
                          >
                            <RefreshCw className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleVisualizarEventos(nfe)}
                            className="border-orange-500/30 text-orange-400 hover:bg-orange-500/20 w-7 h-7 p-0"
                            title="Visualizar Eventos"
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleImprimirDANFE(nfe)}
                            className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20 w-7 h-7 p-0"
                            title="Imprimir DANFE"
                          >
                            <Printer className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              )}

              {!isLoading && !error && nfes.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-400">
                    {search || status !== "all" || empresa || fornecedor || dataInicio || dataFim
                      ? "Nenhuma NFe encontrada para os filtros aplicados."
                      : "Nenhuma NFe recebida encontrada."}
                  </p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {!isLoading && !error && totalPages > 1 && (
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
                        handlePageChange(1);
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
                        handlePageChange(page - 1);
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
                        handlePageChange(page + 1);
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
                        handlePageChange(totalPages);
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
      {/* Dialog para visualizar eventos */}
      <Dialog open={eventosDialogOpen} onOpenChange={setEventosDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Eventos da NFe</DialogTitle>
          </DialogHeader>
          
          {loadingEventos ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              <span>Carregando eventos...</span>
            </div>
          ) : eventosData.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhum evento encontrado para esta NFe.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {eventosData.map((evento, index) => (
                <div key={evento.eventos_id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="font-semibold text-sm text-gray-700">Código do Evento:</label>
                      <p className="text-gray-900">{evento.eventos_code_evento}</p>
                    </div>
                    <div>
                      <label className="font-semibold text-sm text-gray-700">Data do Evento:</label>
                      <p className="text-gray-900">{formatDate(evento.eventos_data)}</p>
                    </div>
                    <div className="col-span-2">
                      <label className="font-semibold text-sm text-gray-700">Descrição do Evento:</label>
                      <p className="text-gray-900">{evento.eventos_desc_evento}</p>
                    </div>
                    <div className="col-span-2">
                      <label className="font-semibold text-sm text-gray-700">Protocolo:</label>
                      <p className="text-gray-900 font-mono">{evento.eventos_prot}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
