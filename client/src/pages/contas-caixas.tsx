import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Search, 
  Plus, 
  RefreshCw, 
  X, 
  Settings, 
  Paperclip, 
  Pencil, 
  Trash, 
  ChevronsLeft, 
  ChevronsRight,
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  Eye,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { AuthService } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface Metadata {
  COLUNA: string;
  DESCRICAO: string;
}

interface ContaCaixa {
  CODCOLIGADA?: number;
  CODFILIAL?: number;
  CODCXA: string;
  DESCRICAO: string;
  SALDOINSTANTANEO?: number;
  SALDONAOCOMPENSADO?: number;
  DATAINCLUSAO?: string;
  INATIVO?: number; // 0 or 1
  GLOBAL?: number;
  NUMBANCO?: string;
  CODAGENCIA?: string;
  CONTACORRENTE?: string;
  DATAULTIMOCONCILIACAO?: string;
  USALIMITECHEQUE?: number;
  VLR_LIMITE_CHEQUE?: number;
  // Dynamic fields
  [key: string]: any;
}

export default function ContasCaixas() {
  const [data, setData] = useState<ContaCaixa[]>([]);
  const [metadata, setMetadata] = useState<Metadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ContaCaixa | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  // State for pattern replication
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [sortBy, setSortBy] = useState("CODCXA");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = AuthService.getStoredToken();
      if (!token || !token.environmentId) {
        toast({
          title: "Ambiente não identificado",
          description: "Faça login novamente ou selecione um ambiente.",
          variant: "destructive",
        });
        return;
      }

      // Fetch Metadata
      const metadataPath = `/api/framework/v1/consultaSQLServer/RealizaConsulta/SIT.PORTALRM.016/1/T?parameters=TABELA=FCXA`;
      const metadataResponse = await fetch(
        `/api/proxy?environmentId=${encodeURIComponent(token.environmentId)}&path=${encodeURIComponent(metadataPath)}&token=${encodeURIComponent(token.access_token)}`,
        {
          headers: {
            ...(getTenant() ? { 'X-Tenant': getTenant()! } : {})
          }
        }
      );
      
      if (metadataResponse.ok) {
        const metadataJson = await metadataResponse.json();
        setMetadata(metadataJson);
      }

      // Fetch Data
      const dataPath = `/api/framework/v1/consultaSQLServer/RealizaConsulta/SIT.PORTALRM.017/1/T`;
      const dataResponse = await fetch(
        `/api/proxy?environmentId=${encodeURIComponent(token.environmentId)}&path=${encodeURIComponent(dataPath)}&token=${encodeURIComponent(token.access_token)}`,
        {
            headers: {
                ...(getTenant() ? { 'X-Tenant': getTenant()! } : {})
            }
        }
      );

      if (dataResponse.ok) {
        const dataJson = await dataResponse.json();
        setData(dataJson);
      } else {
        throw new Error("Falha ao carregar dados");
      }

    } catch (error) {
      console.error(error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados das contas/caixas.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter, Sort, Paginate
  const filteredData = useMemo(() => {
    let result = data;

    if (search) {
      const lowerSearch = search.toLowerCase();
      result = result.filter((item) => 
        Object.values(item).some(value => 
          String(value).toLowerCase().includes(lowerSearch)
        )
      );
    }

    return [...result].sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      // Handle null/undefined values
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      // Handle string comparison (case-insensitive and numeric aware)
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === "asc" 
          ? aValue.localeCompare(bValue, undefined, { sensitivity: 'base', numeric: true })
          : bValue.localeCompare(aValue, undefined, { sensitivity: 'base', numeric: true });
      }

      // Handle number comparison
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
      }

      // Fallback for mixed types or other types
      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [data, search, sortBy, sortOrder]);

  const paginatedData = useMemo(() => {
    const startIndex = (page - 1) * limit;
    return filteredData.slice(startIndex, startIndex + limit);
  }, [filteredData, page, limit]);

  const totalPages = Math.ceil(filteredData.length / limit);

  const getLabel = (column: string) => {
    const meta = metadata.find(m => m.COLUNA === column);
    return meta ? meta.DESCRICAO : column;
  };

  const handleEdit = (item: ContaCaixa) => {
    setSelectedItem(item);
    setIsDialogOpen(true);
  };

  const handleNew = () => {
    setSelectedItem({
      CODCXA: "",
      DESCRICAO: "",
      SALDOINSTANTANEO: 0,
      SALDONAOCOMPENSADO: 0,
      INATIVO: 0
    });
    setIsDialogOpen(true);
  };

  const handleInputChange = (field: string, value: any) => {
    setSelectedItem(prev => prev ? { ...prev, [field]: value } : null);
  };

  // Helper to format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearch("");
    setPage(1);
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
    setPage(1);
  };

  const renderSortIcon = (column: string) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="w-4 h-4 ml-1 text-gray-500" />;
    }
    return sortOrder === "asc" 
      ? <ArrowUp className="w-4 h-4 ml-1 text-primary" />
      : <ArrowDown className="w-4 h-4 ml-1 text-primary" />;
  };

  const getHeaderClassName = (column: string) => {
    return `p-0 h-auto font-semibold text-xs uppercase tracking-wider whitespace-nowrap ${
      sortBy === column ? "text-primary hover:text-primary/90" : "text-muted-foreground hover:text-foreground"
    }`;
  };

  return (
    <div className="h-[calc(100vh-10rem)] flex flex-col gap-4">
      {/* Header */}
      <div className="flex-none flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Contas/Caixas</h1>
          <p className="text-gray-400 text-sm">
            Gerencie as contas e caixas do sistema
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-primary bg-primary/10 hover:bg-primary/20 border-primary/20">
            {filteredData.length} registros
          </Badge>
          <Button
            onClick={fetchData}
            className="bg-yellow-500 hover:bg-yellow-600 text-black"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          <Button 
            className="bg-primary hover:bg-primary/90 text-black"
            onClick={handleNew}
          >
            <Plus className="h-4 w-4 mr-2" />
            Incluir
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        {/* Search and Filters */}
        <Card className="flex-none border-muted/20 shadow-sm mb-4">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar em todos os campos..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              {search && (
                <Button 
                  variant="outline" 
                  onClick={handleClearFilters}
                >
                  Limpar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Data Grid */}
        <Card className="flex-1 flex flex-col min-h-0 border-muted/20 shadow-sm overflow-hidden">
          <CardContent className="flex-1 flex flex-col min-h-0 p-0">
            
              {loading ? (
                <div className="flex-1 flex items-center justify-center">
                  <Card className="border-muted/20 bg-muted/5">
                    <CardContent className="pt-6 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Carregando dados...</p>
                    </CardContent>
                  </Card>
                </div>
              ) : filteredData.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <Card className="border-muted/20 bg-muted/5">
                    <CardContent className="pt-6 text-center">
                      <p className="text-muted-foreground">
                        {search
                          ? "Nenhum registro encontrado com os filtros aplicados"
                          : "Nenhum registro encontrado"}
                      </p>
                      <p className="text-muted-foreground text-sm mt-2">
                        {search
                          ? "Tente ajustar os filtros de busca"
                          : "Os registros aparecerão aqui quando disponíveis"}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                        <TableRow>
                          <TableHead className="text-left py-3 px-4">
                            <Button
                              variant="ghost"
                              onClick={() => handleSort("CODCOLIGADA")}
                              className={getHeaderClassName("CODCOLIGADA")}
                            >
                              Coligada {renderSortIcon("CODCOLIGADA")}
                            </Button>
                          </TableHead>
                          <TableHead className="text-left py-3 px-4">
                            <Button
                              variant="ghost"
                              onClick={() => handleSort("CODCXA")}
                              className={getHeaderClassName("CODCXA")}
                            >
                              Código {renderSortIcon("CODCXA")}
                            </Button>
                          </TableHead>
                          <TableHead className="text-left py-3 px-4">
                            <Button
                              variant="ghost"
                              onClick={() => handleSort("DESCRICAO")}
                              className={getHeaderClassName("DESCRICAO")}
                            >
                              Descrição {renderSortIcon("DESCRICAO")}
                            </Button>
                          </TableHead>
                          <TableHead className="text-right py-3 px-4">
                            <Button
                              variant="ghost"
                              onClick={() => handleSort("SALDOINSTANTANEO")}
                              className={getHeaderClassName("SALDOINSTANTANEO")}
                            >
                              Saldo Inst. {renderSortIcon("SALDOINSTANTANEO")}
                            </Button>
                          </TableHead>
                          <TableHead className="text-right py-3 px-4">
                            <Button
                              variant="ghost"
                              onClick={() => handleSort("SALDONAOCOMPENSADO")}
                              className={getHeaderClassName("SALDONAOCOMPENSADO")}
                            >
                              Saldo N/Comp. {renderSortIcon("SALDONAOCOMPENSADO")}
                            </Button>
                          </TableHead>
                          <TableHead className="text-left py-3 px-4">
                            <Button
                              variant="ghost"
                              onClick={() => handleSort("CODFILIAL")}
                              className={getHeaderClassName("CODFILIAL")}
                            >
                              Filial {renderSortIcon("CODFILIAL")}
                            </Button>
                          </TableHead>
                          <TableHead className="text-center py-3 px-4">
                            <Button
                              variant="ghost"
                              onClick={() => handleSort("INATIVO")}
                              className={getHeaderClassName("INATIVO")}
                            >
                              Status {renderSortIcon("INATIVO")}
                            </Button>
                          </TableHead>
                          <TableHead className="text-right py-3 px-4 w-24">
                            <span className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">Ações</span>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedData.map((item, index) => (
                          <TableRow 
                            key={`${item.CODCOLIGADA}-${item.CODCXA}`} 
                            className="cursor-pointer hover:bg-muted/50"
                          >
                            <TableCell className="py-3 px-4 text-muted-foreground text-sm">
                              {item.CODCOLIGADA}
                            </TableCell>
                            <TableCell className="py-3 px-4 text-foreground text-sm font-medium">
                              {item.CODCXA}
                            </TableCell>
                            <TableCell className="py-3 px-4 text-muted-foreground text-sm">
                              {item.DESCRICAO}
                            </TableCell>
                            <TableCell className="py-3 px-4 text-right text-sm font-medium text-emerald-600">
                              {formatCurrency(item.SALDOINSTANTANEO || 0)}
                            </TableCell>
                            <TableCell className="py-3 px-4 text-right text-sm font-medium text-amber-600">
                              {formatCurrency(item.SALDONAOCOMPENSADO || 0)}
                            </TableCell>
                            <TableCell className="py-3 px-4 text-muted-foreground text-sm">
                              {item.CODFILIAL}
                            </TableCell>
                            <TableCell className="py-3 px-4 text-center">
                              {Number(item.INATIVO) !== 1 ? (
                                <Badge className="bg-green-100 text-green-700 border-green-200 text-xs hover:bg-green-200">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Ativo
                                </Badge>
                              ) : (
                                <Badge className="bg-red-100 text-red-700 border-red-200 text-xs hover:bg-red-200">
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  Inativo
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEdit(item)}
                                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                                  title="Editar"
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  title="Excluir"
                                  className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600"
                                >
                                  <Trash className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  <div className="flex-none flex items-center justify-between p-4 border-t border-muted/20 bg-muted/5">
                    <div className="text-muted-foreground text-sm">
                      Mostrando {((page - 1) * limit) + 1} a {Math.min(page * limit, filteredData.length)} de {filteredData.length} {filteredData.length === 1 ? "registro" : "registros"} • Página {page} de {totalPages}
                    </div>
                    {totalPages > 1 && (
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
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="text-foreground px-3 py-1 bg-muted rounded border">
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
                        >
                          <ChevronsRight className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </>
              )}
          </CardContent>
        </Card>
      </div>

      {/* CRUD Dialog - Preserved Structure */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="glassmorphism border-white/20 bg-black/90 max-w-[800px] h-[600px] flex flex-col p-0 gap-0">
          <DialogHeader className="p-4 border-b border-white/10">
            <DialogTitle className="flex items-center gap-2 text-white">
              Conta/Caixa: {selectedItem?.CODCXA} - {selectedItem?.DESCRICAO}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 p-4 overflow-y-auto">
            {/* Toolbar inside Dialog */}
            <div className="flex items-center gap-1 mb-4 border-b border-white/10 pb-2">
               <Button variant="ghost" size="sm" className="h-8 text-gray-300 hover:text-white hover:bg-white/10"><Plus className="h-4 w-4 mr-1"/> Novo</Button>
               <Button variant="ghost" size="sm" className="h-8 text-gray-300 hover:text-white hover:bg-white/10"><X className="h-4 w-4 mr-1"/> Excluir</Button>
               <Button variant="ghost" size="sm" className="h-8 text-gray-300 hover:text-white hover:bg-white/10"><RefreshCw className="h-4 w-4 mr-1"/> Atualizar</Button>
               <div className="h-4 w-px bg-white/10 mx-2" />
               <Button variant="ghost" size="sm" className="h-8 text-gray-300 hover:text-white hover:bg-white/10"><Paperclip className="h-4 w-4 mr-1"/> Anexos</Button>
               <Button variant="ghost" size="sm" className="h-8 text-gray-300 hover:text-white hover:bg-white/10"><Settings className="h-4 w-4 mr-1"/> Processos</Button>
            </div>

            <Tabs defaultValue="identificacao" className="w-full">
              <TabsList className="w-full justify-start rounded-none border-b border-white/10 bg-transparent p-0 mb-4">
                <TabsTrigger value="identificacao" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-gray-400 data-[state=active]:text-white">
                  Identificação
                </TabsTrigger>
                <TabsTrigger value="dados-adicionais" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-gray-400 data-[state=active]:text-white">
                  Dados Adicionais
                </TabsTrigger>
                <TabsTrigger value="integracao" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-gray-400 data-[state=active]:text-white">
                  Integração Bancária
                </TabsTrigger>
                <TabsTrigger value="contabilidade" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-gray-400 data-[state=active]:text-white">
                  Contabilidade
                </TabsTrigger>
              </TabsList>

              {/* Tab: Identificação */}
              <TabsContent value="identificacao" className="space-y-4">
                <div className="flex gap-4 mb-4">
                   <div className="flex items-center gap-2">
                      <Checkbox 
                        id="global" 
                        checked={Number(selectedItem?.GLOBAL) === 1} 
                        onCheckedChange={(checked) => handleInputChange('GLOBAL', checked ? 1 : 0)}
                        className="border-white/20 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground" 
                      />
                      <Label htmlFor="global" className="text-gray-300">Global</Label>
                   </div>
                   <div className="flex items-center gap-2">
                      <Checkbox 
                        id="ativa" 
                        checked={Number(selectedItem?.INATIVO) !== 1} 
                        onCheckedChange={(checked) => handleInputChange('INATIVO', checked ? 0 : 1)}
                        className="border-white/20 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground" 
                      />
                      <Label htmlFor="ativa" className="text-gray-300">Ativa</Label>
                   </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-1 space-y-2">
                    <Label className="text-gray-300">{getLabel('CODCXA') || 'Código'}</Label>
                    <Input value={selectedItem?.CODCXA} readOnly className="bg-white/5 border-white/20 text-gray-400" />
                  </div>
                  <div className="col-span-3 space-y-2">
                    <Label className="text-gray-300">{getLabel('DESCRICAO') || 'Descrição'}</Label>
                    <Input value={selectedItem?.DESCRICAO} className="bg-white/10 border-white/20 text-white" />
                  </div>
                </div>

                <div className="space-y-2">
                   <Label className="text-gray-300">{getLabel('CODFILIAL') || 'Filial'}</Label>
                   <div className="flex gap-2">
                     <Input value={selectedItem?.CODFILIAL || ''} className="w-20 bg-white/10 border-white/20 text-white" />
                     <Input readOnly className="flex-1 bg-white/5 border-white/20 text-gray-400" />
                     <Button variant="outline" size="icon" className="border-white/20 text-gray-300 hover:bg-white/10 hover:text-white"><Search className="h-4 w-4"/></Button>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border border-white/10 p-4 rounded-md">
                   <div className="space-y-2">
                      <Label className="font-semibold text-gray-300">Saldos</Label>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-1">
                           <Label className="text-xs text-gray-400">Instantâneo:</Label>
                           <Input value={formatCurrency(selectedItem?.SALDOINSTANTANEO || 0)} className="text-right bg-white/5 border-white/20 text-white" readOnly />
                         </div>
                         <div className="space-y-1">
                           <Label className="text-xs text-gray-400">Não Compensado:</Label>
                           <Input value={formatCurrency(selectedItem?.SALDONAOCOMPENSADO || 0)} className="text-right bg-white/5 border-white/20 text-white" readOnly />
                         </div>
                      </div>
                   </div>
                   <div className="space-y-2">
                      <Label className="font-semibold text-gray-300">Data Base</Label>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-1">
                           <Label className="text-xs text-gray-400">Saldo na Data Base:</Label>
                           <Input className="text-right bg-white/5 border-white/20 text-white" readOnly />
                         </div>
                         <div className="space-y-1">
                           <Label className="text-xs text-gray-400">Data Base:</Label>
                           <Input type="date" className="bg-white/10 border-white/20 text-white" />
                         </div>
                      </div>
                   </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                   <div className="border border-white/10 p-4 rounded-md space-y-2">
                      <Label className="font-semibold text-gray-300">Banco</Label>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-1">
                           <Label className="text-xs text-gray-400">Saldo Bancário:</Label>
                           <Input className="text-right bg-white/10 border-white/20 text-white" />
                         </div>
                         <div className="space-y-1">
                           <Label className="text-xs text-gray-400">Data do Saldo Bancário:</Label>
                           <Input type="date" className="bg-white/10 border-white/20 text-white" />
                         </div>
                      </div>
                   </div>
                   <div className="space-y-2">
                      <div className="space-y-1">
                        <Label className="text-gray-300">Moeda</Label>
                        <div className="flex gap-2">
                           <Input className="w-16 bg-white/10 border-white/20 text-white" defaultValue="R$" />
                           <Input className="flex-1 text-blue-400 underline cursor-pointer bg-white/5 border-white/20" defaultValue="Real" readOnly />
                           <Button variant="outline" size="icon" className="border-white/20 text-gray-300 hover:bg-white/10 hover:text-white"><Search className="h-4 w-4"/></Button>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-gray-300">Liquidez</Label>
                        <div className="flex gap-2">
                           <Input className="flex-1 bg-white/10 border-white/20 text-white" />
                           <Button variant="outline" size="icon" className="border-white/20 text-gray-300 hover:bg-white/10 hover:text-white"><Search className="h-4 w-4"/></Button>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-gray-300">Tipo</Label>
                        <Select>
                          <SelectTrigger className="bg-white/10 border-white/20 text-white">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent className="glassmorphism border-white/20 bg-black/90">
                             <SelectItem value="corrente" className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer">Conta Corrente</SelectItem>
                             <SelectItem value="caixa" className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer">Caixa</SelectItem>
                             <SelectItem value="aplicacao" className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer">Aplicação</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                   </div>
                </div>
                
                <div className="space-y-2">
                   <Label className="text-gray-300">Coligada Proprietária:</Label>
                   <div className="flex gap-2">
                     <Input value={selectedItem?.CODCOLIGADA || ''} className="w-20 bg-white/10 border-white/20 text-white" />
                     <Input readOnly className="flex-1 text-blue-400 underline bg-white/5 border-white/20" defaultValue="TESTE" />
                     <Button variant="outline" size="icon" className="border-white/20 text-gray-300 hover:bg-white/10 hover:text-white"><Search className="h-4 w-4"/></Button>
                   </div>
                </div>

              </TabsContent>

              {/* Tab: Dados Adicionais */}
              <TabsContent value="dados-adicionais" className="space-y-4">
                <div className="grid grid-cols-2 gap-6">
                   {/* Módulo de Caixa */}
                   <div className="border border-white/10 p-4 rounded-md space-y-4">
                      <Label className="font-semibold block mb-2 text-gray-300">Módulo de Caixa</Label>
                      <div className="flex items-center gap-2">
                         <Checkbox id="sessao-caixa" className="border-white/20 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground" />
                         <Label htmlFor="sessao-caixa" className="text-gray-300">Permitir abertura de Sessão de Caixa</Label>
                      </div>
                      <div className="space-y-1">
                         <Label className="text-gray-300">Último Número de Caixa Aberto:</Label>
                         <Input className="w-32 bg-white/10 border-white/20 text-white" />
                      </div>
                   </div>

                   {/* Limite Inferior */}
                   <div className="border border-white/10 p-4 rounded-md space-y-4">
                      <Label className="font-semibold block mb-2 text-gray-300">Limite Inferior</Label>
                      <div className="flex items-center gap-2">
                         <Checkbox id="usa-limite" className="border-white/20 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground" />
                         <Label htmlFor="usa-limite" className="text-gray-300">Usar Limite Inferior</Label>
                      </div>
                      <div className="space-y-1">
                         <Label className="text-gray-300">Limite Inferior:</Label>
                         <Input className="w-full text-right bg-white/10 border-white/20 text-white" defaultValue="0,00" />
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                   {/* Período Extratos */}
                   <div className="border border-white/10 p-4 rounded-md space-y-4">
                      <Label className="font-semibold block mb-2 text-gray-300">Período para Inclusão de Extratos</Label>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-1">
                            <Label className="text-gray-300">Data inicial do extrato:</Label>
                            <Input type="date" className="bg-white/10 border-white/20 text-white" />
                         </div>
                         <div className="space-y-1">
                            <Label className="text-gray-300">Data final do extrato:</Label>
                            <Input type="date" className="bg-white/10 border-white/20 text-white" />
                         </div>
                      </div>
                   </div>

                   {/* CPMF */}
                   <div className="space-y-4">
                      <div className="space-y-1">
                         <Label className="text-gray-300">Geração de CPMF:</Label>
                         <Select defaultValue="respeitar">
                            <SelectTrigger className="bg-white/10 border-white/20 text-white">
                               <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="glassmorphism border-white/20 bg-black/90">
                               <SelectItem value="respeitar" className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer">Respeitar Parametrização</SelectItem>
                            </SelectContent>
                         </Select>
                      </div>
                      <div className="space-y-1">
                         <Label className="text-gray-300">Último Cheque:</Label>
                         <Input defaultValue="0000000005" className="bg-white/10 border-white/20 text-white" />
                      </div>
                   </div>
                </div>
                
                <div className="border border-white/10 p-4 rounded-md space-y-2">
                   <Label className="font-semibold text-gray-300">Livro Caixa do Produtor Rural</Label>
                   <div className="space-y-1">
                      <Label className="text-gray-300">Código:</Label>
                      <Input className="w-32 bg-white/10 border-white/20 text-white" />
                   </div>
                </div>
              </TabsContent>

              {/* Tab: Integração Bancária */}
              <TabsContent value="integracao" className="space-y-4">
                <div className="border border-white/10 p-6 rounded-md space-y-4">
                   <div className="space-y-2">
                      <Label className="text-gray-300">{getLabel('NUMBANCO') || 'Banco:'}</Label>
                      <div className="flex gap-2">
                         <Input 
                           value={selectedItem?.NUMBANCO || ''} 
                           className="w-32 bg-white/10 border-white/20 text-white" 
                           onChange={(e) => handleInputChange('NUMBANCO', e.target.value)}
                         />
                         <Input className="flex-1 bg-white/5 border-white/20 text-gray-400" readOnly />
                         <Button variant="outline" size="icon" className="border-white/20 text-gray-300 hover:bg-white/10 hover:text-white"><Search className="h-4 w-4"/></Button>
                      </div>
                   </div>
                   <div className="space-y-2">
                      <Label className="text-gray-300">{getLabel('CODAGENCIA') || 'Agência:'}</Label>
                      <div className="flex gap-2">
                         <Input 
                           value={selectedItem?.CODAGENCIA || ''} 
                           className="w-32 bg-white/10 border-white/20 text-white" 
                           onChange={(e) => handleInputChange('CODAGENCIA', e.target.value)}
                         />
                         <Input className="flex-1 bg-white/5 border-white/20 text-gray-400" readOnly />
                         <Button variant="outline" size="icon" className="border-white/20 text-gray-300 hover:bg-white/10 hover:text-white"><Search className="h-4 w-4"/></Button>
                      </div>
                   </div>
                   <div className="space-y-2">
                      <Label className="text-gray-300">{getLabel('CONTACORRENTE') || 'Conta:'}</Label>
                      <div className="flex gap-2">
                         <Input 
                           value={selectedItem?.CONTACORRENTE || ''} 
                           className="w-32 bg-white/10 border-white/20 text-white" 
                           onChange={(e) => handleInputChange('CONTACORRENTE', e.target.value)}
                         />
                         <Input className="flex-1 bg-white/5 border-white/20 text-gray-400" readOnly />
                         <Button variant="outline" size="icon" className="border-white/20 text-gray-300 hover:bg-white/10 hover:text-white"><Search className="h-4 w-4"/></Button>
                      </div>
                   </div>
                </div>
              </TabsContent>

              {/* Tab: Contabilidade */}
              <TabsContent value="contabilidade" className="space-y-4">
                 <div className="grid grid-cols-2 gap-6">
                    <div className="border border-white/10 p-4 rounded-md space-y-4">
                       <Label className="font-semibold block mb-2 text-gray-300">Defaults Contábeis</Label>
                       <div className="flex gap-4 justify-center py-4">
                          <Button variant="outline" className="w-32 border-white/20 text-white hover:bg-white/10">Defaults</Button>
                          <Button variant="outline" className="w-32 border-white/20 text-white hover:bg-white/10">Mútuo</Button>
                       </div>
                    </div>

                    <div className="border border-white/10 p-4 rounded-md space-y-4">
                       <Label className="font-semibold block mb-2 text-gray-300">Lotes contábeis do extrato</Label>
                       <div className="space-y-2">
                          <Label className="text-gray-300">Lote de inclusão do extrato:</Label>
                          <div className="flex gap-2">
                             <Input className="w-24 bg-white/10 border-white/20 text-white" />
                             <Input className="flex-1 bg-white/5 border-white/20 text-gray-400" readOnly />
                             <Button variant="outline" size="icon" className="border-white/20 text-gray-300 hover:bg-white/10 hover:text-white"><Search className="h-4 w-4"/></Button>
                          </div>
                       </div>
                       <div className="space-y-2">
                          <Label className="text-gray-300">Lote de estorno do extrato:</Label>
                          <div className="flex gap-2">
                             <Input className="w-24 bg-white/10 border-white/20 text-white" />
                             <Input className="flex-1 bg-white/5 border-white/20 text-gray-400" readOnly />
                             <Button variant="outline" size="icon" className="border-white/20 text-gray-300 hover:bg-white/10 hover:text-white"><Search className="h-4 w-4"/></Button>
                          </div>
                       </div>
                    </div>
                 </div>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter className="p-4 border-t border-white/10 bg-transparent">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-white/20 text-white hover:bg-white/10">OK</Button>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-white/20 text-white hover:bg-white/10">Cancelar</Button>
            <Button onClick={() => setIsDialogOpen(false)} className="bg-primary text-primary-foreground hover:bg-primary/90">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

