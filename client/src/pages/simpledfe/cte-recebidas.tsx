import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
// import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Search, 
  Download, 
  RefreshCw,
  Printer,
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  Upload,
  CheckSquare,
  Square,
  FileText,
  CheckCircle2,
  XCircle,
  Eye,
  Clock
} from "lucide-react";
import { DateInput } from "@/components/ui/date-input";
import type { CTeRecebida, CTeResponse, EventoCTe } from "@shared/schema";

// Função para formatar CNPJ
const formatCNPJ = (cnpj: string): string => {
  if (!cnpj) return '';
  const cleaned = cnpj.replace(/\D/g, '');
  if (cleaned.length !== 14) return cnpj;
  return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
};

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

// Função para formatar valor monetário
function formatCurrency(value: number) {
  if (value === null || value === undefined) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

// Função para obter badge de status
function getStatusBadge(cte: CTeRecebida) {
  if (cte.cte_status_integracao === 1) {
    return <Badge className="bg-green-100 text-green-800 border-green-200">Integrado</Badge>;
  } else if (cte.cte_status_integracao === 0) {
    if (!cte.cte_codcfo || cte.cte_codcfo === null) {
      return <Badge className="bg-red-100 text-red-800 border-red-200">Fornecedor não cadastrado!</Badge>;
    } else {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Não Integrado</Badge>;
    }
  }
  return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Indefinido</Badge>;
}

// Função para obter status do documento
function getDocumentStatus(cte: CTeRecebida) {
  if (cte.cte_serie === null) {
    if (cte.has_evento && cte.has_evento > 0) {
      return { text: "CANCELADA", icon: XCircle, color: "text-red-500" };
    } else {
      return { text: "EM PROCESSAMENTO", icon: CheckCircle2, color: "text-yellow-500" };
    }
  } else {
    if (cte.cte_status === 1) {
      return { text: "CANCELADA", icon: XCircle, color: "text-red-500" };
    } else {
      return { text: "AUTORIZADA", icon: CheckCircle2, color: "text-green-500" };
    }
  }
}

export default function CTeRecebidasPage() {
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
  const [sortBy, setSortBy] = useState<keyof CTeRecebida>("cte_data_emissao");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isImporting, setIsImporting] = useState(false);
  
  // Estados para seleção de linhas
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  
  // Estados para dialog de eventos
  const [eventosDialogOpen, setEventosDialogOpen] = useState(false);
  const [eventosData, setEventosData] = useState<EventoCTe[]>([]);
  const [loadingEventos, setLoadingEventos] = useState(false);

  const { data: cteData, isLoading, error } = useQuery({
    queryKey: ["cte-recebidas", search, status, empresa, fornecedor, dataInicio, dataFim, page, limit, sortBy, sortOrder],
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
      
      const response = await fetch(`/api/cte-recebidas?${params}`);
      if (!response.ok) {
        throw new Error("Erro ao carregar CTe recebidas");
      }
      return response.json() as Promise<CTeResponse>;
    },
  });

  const handleSort = (column: keyof CTeRecebida) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
    setPage(1);
  };

  const ctes = cteData?.ctes || [];
  const total = cteData?.total || 0;
  const totalPages = cteData?.totalPages || 0;

  // Funções de seleção
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(ctes.map(cte => cte.cte_id));
      setSelectedRows(allIds);
    } else {
      setSelectedRows(new Set());
    }
    setSelectAll(checked);
  };

  const handleSelectRow = (cteId: number, checked: boolean) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(cteId);
    } else {
      newSelected.delete(cteId);
    }
    setSelectedRows(newSelected);
    setSelectAll(newSelected.size === ctes.length && ctes.length > 0);
  };

  // Função para baixar XML
  const handleBaixarXML = async (cte: CTeRecebida) => {
    try {
      // Chama a API através do nosso backend para evitar problemas de CORS
      const response = await fetch(`/api/cte-download/${cte.cte_id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao baixar XML da CTe');
      }

      // Extrair o nome do arquivo do cabeçalho Content-Disposition
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `cte_${cte.cte_id}.xml`; // fallback
      
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
        description: `XML da CTe ${cte.cte_numero} baixado com sucesso!`,
      });
    } catch (error) {
      toast({
        title: "Erro no Download",
        description: "Não foi possível baixar o XML da CTe. Verifique se o serviço está disponível.",
        variant: "destructive",
      });
    }
  };

  // Função para visualizar eventos
  const handleVisualizarEventos = async (cte: CTeRecebida) => {
    setLoadingEventos(true);
    try {
      const response = await fetch(`/api/cte-eventos/${cte.cte_id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar eventos');
      }

      const data = await response.json();
      setEventosData(data.eventos || []);
      setEventosDialogOpen(true);
    } catch (error) {
      console.error('Erro ao buscar eventos:', error);
      toast({
        title: "Erro ao buscar eventos",
        description: "Não foi possível carregar os eventos da CTe",
        variant: "destructive",
      });
    } finally {
      setLoadingEventos(false);
    }
  };

  const handleImportarDocumentos = async () => {
    setIsImporting(true);
    try {
      const response = await fetch('/api/importar-cte', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao importar CTe');
      }

      await queryClient.invalidateQueries({ queryKey: ["cte-recebidas"] });
      
      toast({
        title: "Importação iniciada",
        description: "A importação de CTe foi iniciada com sucesso",
      });
    } catch (error) {
      console.error('Erro ao importar:', error);
      toast({
        title: "Erro na importação",
        description: "Ocorreu um erro ao iniciar a importação de CTe",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleBaixarXMLLote = async () => {
    if (selectedRows.size === 0) {
      toast({
        title: "Nenhuma CTe selecionada",
        description: "Selecione pelo menos uma CTe para fazer o download",
        variant: "destructive",
      });
      return;
    }

    try {
      const selectedIds = Array.from(selectedRows);
      
      const response = await fetch('/api/cte-bulk-download-xml', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ cteIds: selectedIds }),
      });

      if (!response.ok) {
        throw new Error('Erro no download em lote');
      }

      // Criar blob do ZIP e fazer download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'xml_cte.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Download Concluído",
        description: `Download de ${selectedIds.length} XMLs de CTe concluído com sucesso!`,
      });

      // Limpar seleção após download
      clearSelection();
    } catch (error) {
      console.error('Erro no download em lote:', error);
      toast({
        title: "Erro no Download",
        description: "Não foi possível fazer o download dos XMLs. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleImprimirDACTE = async (cte: CTeRecebida) => {
    try {
      // Fazer a requisição com autenticação
      const response = await fetch(`/api/cte-dacte/${cte.cte_id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao gerar DACTE');
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
        title: "DACTE Aberto",
        description: `DACTE da CTe ${cte.cte_numero} aberto em nova guia`,
      });
    } catch (error) {
      toast({
        title: "Erro ao Abrir DACTE",
        description: "Não foi possível abrir o DACTE. Verifique se o serviço está disponível.",
        variant: "destructive",
      });
    }
  };

  const handleBulkDownloadDACTE = async () => {
    if (selectedRows.size === 0) {
      toast({
        title: "Nenhuma CTe selecionada",
        description: "Selecione pelo menos uma CTe para download DACTE",
        variant: "destructive",
      });
      return;
    }

    try {
      const cteIds = Array.from(selectedRows);
      
      const response = await fetch('/api/cte-bulk-download-dacte', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ cteIds }),
      });

      if (!response.ok) {
        throw new Error('Erro no download');
      }

      // Criar blob para download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'dacte_cte.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Download DACTE iniciado",
        description: `Download de ${selectedRows.size} DACTE(s) CTe iniciado`,
      });

      // Limpar seleção após download
      clearSelection();
    } catch (error) {
      console.error('Erro no download DACTE:', error);
      toast({
        title: "Erro no download",
        description: "Erro ao iniciar download dos DACTEs",
        variant: "destructive",
      });
    }
  };

  const handleRefreshCTe = () => {
    queryClient.invalidateQueries({ queryKey: ["cte-recebidas"] });
    toast({
      title: "CTe Atualizadas",
      description: "Dados das CTe recebidas atualizados com sucesso!",
    });
  };

  const clearSelection = () => {
    setSelectedRows(new Set());
    setSelectAll(false);
  };

  const getSortIcon = (column: keyof CTeRecebida) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="w-4 h-4" />;
    }
    return sortOrder === "asc" ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  // Limpar seleção quando os dados mudarem (filtros, paginação, etc.)
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    clearSelection();
  };

  return (
      <TooltipProvider>
        <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">
              Gerencie os conhecimentos de transporte eletrônicos recebidos
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-primary">
              {total} {total === 1 ? "CTe" : "CTes"}
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
                    onClick={handleBaixarXMLLote}
                    className="border-blue-500/30 text-blue-400 hover:bg-blue-500/20 h-7"
                    title="Download XML em lote"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    XML
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleBulkDownloadDACTE}
                    className="border-green-500/30 text-green-400 hover:bg-green-500/20 h-7"
                    title="Download DACTE em lote"
                  >
                    <FileText className="w-3 h-3 mr-1" />
                    DACTE
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
            
            <Button
              onClick={handleRefreshCTe}
              className="bg-yellow-500 hover:bg-yellow-600 text-black"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar CTe
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
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
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
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Status Integração</label>
                  <Select value={status} onValueChange={(value: "all" | "integrated" | "not_integrated") => setStatus(value)}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="integrated">Integrado</SelectItem>
                      <SelectItem value="not_integrated">Não Integrado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Empresa</label>
                  <Input
                    placeholder="Filtrar por empresa"
                    value={empresa}
                    onChange={(e) => setEmpresa(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Fornecedor</label>
                  <Input
                    placeholder="Filtrar por fornecedor"
                    value={fornecedor}
                    onChange={(e) => setFornecedor(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Data Início</label>
                  <DateInput
                    value={dataInicio}
                    onChange={setDataInicio}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Data Fim</label>
                  <DateInput
                    value={dataFim}
                    onChange={setDataFim}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
              </div>

              {/* Filter Actions */}
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearch("");
                    setStatus("all");
                    setEmpresa("");
                    setFornecedor("");
                    setDataInicio("");
                    setDataFim("");
                    setPage(1);
                  }}
                  className="text-gray-400 hover:text-white hover:bg-white/10"
                >
                  Limpar filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

          {/* CTe Table */}
          <Card className="glassmorphism border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Lista de CTe Recebidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full">
                {isLoading ? (
                  <div className="flex items-center justify-center min-h-[400px]">
                    <Card className="glassmorphism border-blue-500/20">
                      <CardContent className="pt-6 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-white">Carregando CTe recebidas...</p>
                      </CardContent>
                    </Card>
                  </div>
                ) : error ? (
                  <div className="flex items-center justify-center min-h-[400px]">
                    <Card className="glassmorphism border-red-500/20">
                      <CardContent className="pt-6 text-center">
                        <p className="text-red-400">Erro ao carregar CTe recebidas</p>
                        <p className="text-gray-400 text-sm mt-2">
                          Verifique sua conexão e tente novamente
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                <table className="w-full table-fixed">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="w-12 p-3 text-left">
                        <Checkbox
                          checked={selectAll}
                          onCheckedChange={handleSelectAll}
                          className="border-white/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                      </th>
                      <th className="w-20 p-3 text-left text-white font-medium">Status</th>
                      <th className="w-24 p-3 text-left">
                        <button
                          onClick={() => handleSort("cte_numero")}
                          className="flex items-center gap-1 text-white font-medium hover:text-blue-300"
                        >
                          Número
                          {sortBy === "cte_numero" && (
                            sortOrder === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </th>
                      <th className="w-32 p-3 text-left">
                        <button
                          onClick={() => handleSort("cte_emitente_nome")}
                          className="flex items-center gap-1 text-white font-medium hover:text-blue-300"
                        >
                          Emitente
                          {sortBy === "cte_emitente_nome" && (
                            sortOrder === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </th>
                      <th className="w-32 p-3 text-left">
                        <button
                          onClick={() => handleSort("cte_destinatario_nome")}
                          className="flex items-center gap-1 text-white font-medium hover:text-blue-300"
                        >
                          Destinatário
                          {sortBy === "cte_destinatario_nome" && (
                            sortOrder === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </th>
                      <th className="w-28 p-3 text-left">
                        <button
                          onClick={() => handleSort("cte_data_emissao")}
                          className="flex items-center gap-1 text-white font-medium hover:text-blue-300"
                        >
                          Data Emissão
                          {sortBy === "cte_data_emissao" && (
                            sortOrder === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </th>
                      <th className="w-24 p-3 text-left">
                        <button
                          onClick={() => handleSort("cte_valor")}
                          className="flex items-center gap-1 text-white font-medium hover:text-blue-300"
                        >
                          Valor
                          {sortBy === "cte_valor" && (
                            sortOrder === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </th>
                      <th className="w-32 p-3 text-left text-white font-medium">Integração</th>
                      <th className="w-32 p-3 text-left text-white font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ctes.map((cte) => {
                      const documentStatus = getDocumentStatus(cte);
                      const StatusIcon = documentStatus.icon;
                      
                      return (
                        <tr key={cte.cte_id} className="border-b border-white/10 hover:bg-white/5">
                          <td className="p-3">
                            <Checkbox
                              checked={selectedRows.has(cte.cte_id)}
                              onCheckedChange={(checked) => handleSelectRow(cte.cte_id, checked as boolean)}
                              className="border-white/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                            />
                          </td>
                          <td className="p-3">
                            <Tooltip>
                              <TooltipTrigger>
                                <StatusIcon className={`w-5 h-5 ${documentStatus.color}`} />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{documentStatus.text}</p>
                              </TooltipContent>
                            </Tooltip>
                          </td>
                          <td className="py-2 px-2 text-white font-mono text-sm truncate">{cte.cte_numero || '-'}</td>
                          <td className="py-2 px-2 text-white text-sm truncate">{cte.cte_emitente_nome || '-'}</td>
                          <td className="py-2 px-2 text-gray-300 text-sm truncate">{cte.cte_destinatario_nome || '-'}</td>
                          <td className="py-2 px-2 text-gray-300 text-sm">{formatDate(cte.cte_data_emissao)}</td>
                          <td className="py-2 px-2 text-gray-300 font-mono text-sm">{formatCurrency(cte.cte_valor)}</td>
                          <td className="py-2 px-2">{getStatusBadge(cte)}</td>
                          <td className="py-2 px-2">
                            <div className="flex space-x-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleBaixarXML(cte)}
                                className="border-blue-500/30 text-blue-400 hover:bg-blue-500/20 w-7 h-7 p-0"
                                title="Baixar XML"
                              >
                                <Download className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleImprimirDACTE(cte)}
                                className="border-green-500/30 text-green-400 hover:bg-green-500/20 w-7 h-7 p-0"
                                title="Imprimir DACTE"
                              >
                                <Printer className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleVisualizarEventos(cte)}
                                disabled={loadingEventos}
                                className="border-orange-500/30 text-orange-400 hover:bg-orange-500/20 w-7 h-7 p-0"
                                title="Visualizar Eventos"
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                )}

                {/* Pagination */}
                {!isLoading && !error && totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <p className="text-sm text-gray-400">
                      Mostrando {((page - 1) * limit) + 1} a {Math.min(page * limit, total)} de {total} registros
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className="border-white/20 text-white hover:bg-white/10"
                      >
                        Anterior
                      </Button>
                      <span className="flex items-center px-3 py-1 text-sm text-white">
                        Página {page} de {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(Math.min(totalPages, page + 1))}
                        disabled={page === totalPages}
                        className="border-white/20 text-white hover:bg-white/10"
                      >
                        Próxima
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

        {/* Dialog de Eventos */}
        <Dialog open={eventosDialogOpen} onOpenChange={setEventosDialogOpen}>
          <DialogContent className="max-w-4xl bg-gray-900 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">Eventos da CTe</DialogTitle>
              <DialogDescription className="text-gray-400">
                Lista de eventos relacionados à CTe selecionada
              </DialogDescription>
            </DialogHeader>
            
            <div className="max-h-96 overflow-y-auto">
              {loadingEventos ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-gray-400">Carregando eventos...</p>
                </div>
              ) : eventosData.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">Nenhum evento encontrado para esta CTe</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left p-3 text-white font-medium">Código</th>
                      <th className="text-left p-3 text-white font-medium">Descrição</th>
                      <th className="text-left p-3 text-white font-medium">Data</th>
                      <th className="text-left p-3 text-white font-medium">Protocolo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eventosData.map((evento) => (
                      <tr key={evento.cte_evento_id} className="border-b border-gray-800">
                        <td className="p-3 text-white">{evento.cte_evento_code_evento}</td>
                        <td className="p-3 text-white">{evento.cte_evento_desc_evento}</td>
                        <td className="p-3 text-white">{formatDate(evento.cte_evento_data)}</td>
                        <td className="p-3 text-white">{evento.cte_evento_prot || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
