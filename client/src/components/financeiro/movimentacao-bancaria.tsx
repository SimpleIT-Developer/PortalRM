import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Plus, Filter, RefreshCw, X, Settings, Paperclip } from "lucide-react";
import { AuthService } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { getTenant } from "@/lib/tenant";

interface Metadata {
  COLUNA: string;
  DESCRICAO: string;
}

interface ContaCaixa {
  CODCXA: string;
  DESCRICAO: string;
}

interface Movimento {
  IDXCX?: number;
  CODFILIAL?: number;
  CODCONTA?: string;
  DATA?: string;
  COMPENSADO?: number; // 0 or 1
  DATACOMPENSACAO?: string;
  NUMERODOCUMENTO?: string;
  VALOR?: number;
  HISTORICO?: string;
  // Dados Adicionais
  CODCCUSTO?: string;
  CODDEPARTAMENTO?: string;
  CODNATFIN?: string; // Natureza Orçamentária Financeira (Guess)
  CODPAGAMENTO?: string; // Meio de Pagamento (Guess)
  // Tabelas Opcionais
  CODSECAO?: string;
  CODPORTADOR?: string;
  CODCENTRODESPESA?: string;
  CODNATUREZAGASTO?: string;
  CODCONTRATOVENDOR?: string;
  // Contabilização
  TIPOCONTABIL?: string;
  // Livro Caixa Digital
  LCDPR_CLASSIFICACAO?: string;
  LCDPR_TIPO?: string;
  LCDPR_PARTICIPANTE?: string;
  [key: string]: any;
}

export function MovimentacaoBancaria() {
  const [data, setData] = useState<Movimento[]>([]);
  const [metadata, setMetadata] = useState<Metadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Movimento | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  // Filter State
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [dateType, setDateType] = useState("DATA"); // Default to DATA
  const [contaCaixa, setContaCaixa] = useState("");
  const [availableContas, setAvailableContas] = useState<ContaCaixa[]>([]);

  const fetchContas = async () => {
    try {
        const token = AuthService.getStoredToken();
        if (!token || !token.environmentId) return;
        
        const dataPath = `/api/framework/v1/consultaSQLServer/RealizaConsulta/SIT.PORTALRM.017/1/T`;
        const response = await fetch(
            `/api/proxy?environmentId=${encodeURIComponent(token.environmentId)}&path=${encodeURIComponent(dataPath)}&token=${encodeURIComponent(token.access_token)}`,
            {
                headers: {
                    ...(getTenant() ? { 'X-Tenant': getTenant()! } : {})
                }
            }
        );
        if (response.ok) {
            const json = await response.json();
            setAvailableContas(json);
        }
    } catch (error) {
        console.error("Erro ao carregar contas caixa", error);
    }
  };

  const fetchMetadata = async () => {
    try {
      const token = AuthService.getStoredToken();
      if (!token) return;
      const endpoint = await EndpointService.getDefaultEndpoint();
      const metadataPath = `/api/framework/v1/consultaSQLServer/RealizaConsulta/SIT.PORTALRM.016/1/T?parameters=TABELA=FXCX`;
      const response = await fetch(
        `/api/proxy?endpoint=${encodeURIComponent(endpoint)}&path=${encodeURIComponent(metadataPath)}&token=${encodeURIComponent(token.access_token)}`,
        {
            headers: {
                ...(getTenant() ? { 'X-Tenant': getTenant()! } : {})
            }
        }
      );
      if (response.ok) {
        const json = await response.json();
        setMetadata(json);
      }
    } catch (error) {
      console.error("Erro ao carregar metadados", error);
    }
  };

  useEffect(() => {
    fetchMetadata();
    fetchContas();
  }, []);

  const fetchData = async () => {
    if (!dateStart || !dateEnd) {
      toast({
        title: "Filtro Necessário",
        description: "Selecione as datas inicial e final para buscar.",
        variant: "warning",
      });
      return;
    }

    try {
      setLoading(true);
      const token = AuthService.getStoredToken();
      if (!token || !token.environmentId) return;
      
      // Using parameters similar to Contas a Pagar/Receber but for Movimentação
      // Assuming the backend query filters by DATAINI and DATAFIM based on the selected TIPODATA
      const paramsList = [
        `DATAINI=${dateStart}T00:00:00`,
        `DATAFIM=${dateEnd}T23:59:59`,
        `TIPODATA=${dateType}` 
      ];

      if (contaCaixa && contaCaixa !== "ALL") {
        paramsList.push(`CODCONTA=${contaCaixa}`);
      }

      const parameters = paramsList.join(";");

      const dataPath = `/api/framework/v1/consultaSQLServer/RealizaConsulta/SIT.PORTALRM.020/1/T?parameters=${parameters}`;
      
      const response = await fetch(
        `/api/proxy?environmentId=${encodeURIComponent(token.environmentId)}&path=${encodeURIComponent(dataPath)}&token=${encodeURIComponent(token.access_token)}`,
        {
            headers: {
                ...(getTenant() ? { 'X-Tenant': getTenant()! } : {})
            }
        }
      );

      if (response.ok) {
        const json = await response.json();
        const resultItems = Array.isArray(json) ? json : (json.data || []);
        
        // Client-side filtering
        const filtered = resultItems.filter((item: Movimento) => {
            // Filter by Conta Caixa if provided (Client-side fallback)
            if (contaCaixa && contaCaixa !== "ALL") {
                const itemConta = item.CODCXA || item.CODCONTA || item.CODCONTACAIXA || item.CodConta || item.codconta || item.CONTACAIXA || "";
                if (!String(itemConta).toLowerCase().includes(contaCaixa.toLowerCase())) {
                    return false;
                }
            }

            const dateValue = item[dateType];
            if (!dateValue) return false;

            let itemDateStr = "";
            if (typeof dateValue === 'string') {
                itemDateStr = dateValue.split('T')[0];
            } else {
                 try {
                    itemDateStr = new Date(dateValue).toISOString().split('T')[0];
                 } catch (e) {
                    return false;
                 }
            }
            return itemDateStr >= dateStart && itemDateStr <= dateEnd;
        }).map((item: any) => ({
            ...item,
            // Normalize CODCONTA: Prioritize CODCXA as per user request
            CODCONTA: item.CODCXA || item.CODCONTA || item.CODCONTACAIXA || item.CodConta || item.codconta || item.CONTACAIXA || ""
        }));

        setData(filtered);
        
        if (filtered.length === 0) {
            toast({ title: "Aviso", description: "Nenhum registro encontrado no período.", variant: "default" });
        }
      } else {
        throw new Error("Falha ao carregar dados");
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as movimentações.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getLabel = (column: string) => {
    const meta = metadata.find(m => m.COLUNA === column);
    return meta ? meta.DESCRICAO : column;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
        const [_, year, month, day] = match;
        return `${day}/${month}/${year}`;
    }
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const handleEdit = (item: Movimento) => {
    setSelectedItem(item);
    setIsDialogOpen(true);
  };

  const handleNew = () => {
    setSelectedItem({
        IDXCX: 0,
        CODFILIAL: 1,
        DATA: new Date().toISOString().split('T')[0],
        COMPENSADO: 0,
        VALOR: 0
    });
    setIsDialogOpen(true);
  };

  const handleInputChange = (field: string, value: any) => {
    if (selectedItem) {
      setSelectedItem({ ...selectedItem, [field]: value });
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col p-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex-none flex items-center justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">Movimentação Bancária</h1>
          <p className="text-muted-foreground text-sm">
            Gerencie as movimentações e extratos bancários.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-primary bg-primary/10 hover:bg-primary/20 border-primary/20">
            {data.length} registros
          </Badge>
          <Button
            disabled={loading}
            onClick={fetchData}
            className="bg-yellow-500 hover:bg-yellow-600 text-black"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
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

      {/* Filters */}
      <Card className="border-muted/20 shadow-sm">
        <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">Filtros de Busca</CardTitle>
            </div>
        </CardHeader>
        <CardContent>
            <div className="flex flex-wrap items-end gap-4">
                <div className="space-y-2 w-40">
                    <Label htmlFor="dateType">Filtrar por</Label>
                    <Select value={dateType} onValueChange={setDateType}>
                        <SelectTrigger id="dateType">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="DATA">Data</SelectItem>
                            <SelectItem value="DATACOMPENSACAO">Data Compensação</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="dateStart">Data Inicial</Label>
                    <Input 
                        id="dateStart" 
                        type="date" 
                        value={dateStart} 
                        onChange={(e) => setDateStart(e.target.value)}
                        className="w-40"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="dateEnd">Data Final</Label>
                    <Input 
                        id="dateEnd" 
                        type="date" 
                        value={dateEnd} 
                        onChange={(e) => setDateEnd(e.target.value)}
                        className="w-40"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="contaCaixa">Conta Caixa</Label>
                    <Select value={contaCaixa} onValueChange={setContaCaixa}>
                        <SelectTrigger className="w-[300px]" id="contaCaixa">
                            <SelectValue placeholder="Selecione uma conta..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Todas</SelectItem>
                             {availableContas.map((conta) => (
                                <SelectItem key={conta.CODCXA} value={conta.CODCXA}>
                                    {conta.CODCXA} - {conta.DESCRICAO}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <Button onClick={fetchData} disabled={loading} className="mb-0.5">
                    {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                    Buscar
                </Button>
            </div>
        </CardContent>
      </Card>

      {/* Toolbar & Grid */}
      <Card className="flex-1 flex flex-col overflow-hidden border-muted/20 shadow-sm">
        <ScrollArea className="flex-1">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
              <TableRow>
                <TableHead className="w-[50px] text-center">Comp</TableHead>
                <TableHead>Ref (ID)</TableHead>
                <TableHead>Filial</TableHead>
                <TableHead>Conta/Caixa</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Histórico</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center h-24">Carregando...</TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                    Use os filtros para buscar movimentações.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item, index) => (
                  <TableRow 
                    key={index} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleEdit(item)}
                  >
                    <TableCell className="text-center">
                        <Checkbox checked={!!item.COMPENSADO} disabled />
                    </TableCell>
                    <TableCell>{item.IDXCX}</TableCell>
                    <TableCell>{item.CODFILIAL}</TableCell>
                    <TableCell>{item.CODCONTA}</TableCell>
                    <TableCell>{formatDate(item.DATA)}</TableCell>
                    <TableCell>{item.NUMERODOCUMENTO}</TableCell>
                    <TableCell className="max-w-[300px] truncate" title={item.HISTORICO}>{item.HISTORICO}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.VALOR || 0)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </Card>

      {/* CRUD Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[900px] h-[650px] flex flex-col p-0 gap-0">
          <DialogHeader className="p-4 border-b bg-muted/10">
            <DialogTitle className="flex items-center gap-2 text-base">
              Extrato de Caixa: {selectedItem?.IDXCX || 'Novo'}
            </DialogTitle>
          </DialogHeader>
          
          {/* Toolbar inside Dialog */}
          <div className="flex items-center gap-1 px-4 py-2 border-b bg-background">
               <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={handleNew}><Plus className="h-3 w-3 mr-1"/> Novo</Button>
               <Button variant="ghost" size="sm" className="h-8 text-xs text-red-600 hover:text-red-700"><X className="h-3 w-3 mr-1"/> Excluir</Button>
               <Button variant="ghost" size="sm" className="h-8 text-xs"><RefreshCw className="h-3 w-3 mr-1"/> Atualizar</Button>
               <div className="h-4 w-px bg-border mx-2" />
               <Button variant="ghost" size="sm" className="h-8 text-xs"><Paperclip className="h-3 w-3 mr-1"/> Anexos</Button>
               <Button variant="ghost" size="sm" className="h-8 text-xs"><Settings className="h-3 w-3 mr-1"/> Processos</Button>
          </div>

          <div className="flex-1 overflow-hidden bg-muted/10">
            <Tabs defaultValue="identificacao" className="h-full flex flex-col">
              <div className="px-4 pt-2 bg-background border-b">
                <TabsList className="w-full justify-start h-9 bg-transparent p-0">
                    <TabsTrigger value="identificacao" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 pb-2 pt-1">
                    Identificação
                    </TabsTrigger>
                    <TabsTrigger value="dados-adicionais" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 pb-2 pt-1">
                    Dados Adicionais
                    </TabsTrigger>
                    <TabsTrigger value="dados-cheque" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 pb-2 pt-1">
                    Dados do Cheque
                    </TabsTrigger>
                    <TabsTrigger value="campos-complementares" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 pb-2 pt-1">
                    Campos Complementares
                    </TabsTrigger>
                </TabsList>
              </div>

              <ScrollArea className="flex-1 p-4">
                  {/* Tab: Identificação */}
                  <TabsContent value="identificacao" className="space-y-4 m-0">
                    <div className="bg-background p-4 rounded-md border shadow-sm space-y-4">
                        <div className="grid grid-cols-4 gap-4">
                            <div className="col-span-3 space-y-1">
                                <Label>Operação:</Label>
                                <Select>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="op1">Dep. Canc de Cheque</SelectItem>
                                        {/* Add more operations as needed */}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <Label>Ref:</Label>
                                <div className="font-bold text-lg pt-1">{selectedItem?.IDXCX}</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-1">
                                <Label>{getLabel('CODFILIAL') || 'Filial:'}</Label>
                                <div className="flex gap-2">
                                    <Input value={selectedItem?.CODFILIAL || ''} className="w-16" onChange={(e) => handleInputChange('CODFILIAL', e.target.value)} />
                                    <Input readOnly className="flex-1 bg-muted" value="Matriz" />
                                    <Button variant="outline" size="icon" className="h-9 w-9"><Search className="h-4 w-4"/></Button>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-1">
                                <Label>{getLabel('CODCONTA') || 'Conta/Caixa:'}</Label>
                                <div className="flex gap-2">
                                    <Input value={selectedItem?.CODCONTA || ''} className="w-20" onChange={(e) => handleInputChange('CODCONTA', e.target.value)} />
                                    <Input readOnly className="flex-1 bg-muted" value="CAIXA GERAL" />
                                    <Button variant="outline" size="icon" className="h-9 w-9"><Search className="h-4 w-4"/></Button>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-4 items-end">
                            <div className="space-y-1">
                                <Label>{getLabel('DATA') || 'Data:'}</Label>
                                <Input 
                                    type="date" 
                                    value={selectedItem?.DATA ? selectedItem.DATA.split('T')[0] : ''} 
                                    onChange={(e) => handleInputChange('DATA', e.target.value)}
                                />
                            </div>
                            <div className="space-y-1 border p-2 rounded bg-muted/5">
                                <div className="flex items-center space-x-2 mb-2">
                                    <Checkbox 
                                        id="compensado" 
                                        checked={!!selectedItem?.COMPENSADO}
                                        onCheckedChange={(c) => handleInputChange('COMPENSADO', c ? 1 : 0)}
                                    />
                                    <Label htmlFor="compensado">Compensado</Label>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Data de Compensação:</Label>
                                    <Input 
                                        type="date" 
                                        className="h-8"
                                        value={selectedItem?.DATACOMPENSACAO ? selectedItem.DATACOMPENSACAO.split('T')[0] : ''} 
                                        onChange={(e) => handleInputChange('DATACOMPENSACAO', e.target.value)}
                                        disabled={!selectedItem?.COMPENSADO}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label>{getLabel('NUMERODOCUMENTO') || 'Número Documento:'}</Label>
                                <Input value={selectedItem?.NUMERODOCUMENTO || ''} onChange={(e) => handleInputChange('NUMERODOCUMENTO', e.target.value)} />
                            </div>
                            <div className="space-y-1">
                                <Label>{getLabel('VALOR') || 'Valor:'}</Label>
                                <Input 
                                    type="number" 
                                    className="text-right font-bold"
                                    value={selectedItem?.VALOR || ''} 
                                    onChange={(e) => handleInputChange('VALOR', parseFloat(e.target.value))} 
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label>{getLabel('HISTORICO') || 'Histórico:'}</Label>
                            <Textarea 
                                value={selectedItem?.HISTORICO || ''} 
                                onChange={(e) => handleInputChange('HISTORICO', e.target.value)}
                                className="resize-none"
                                rows={2}
                            />
                        </div>
                    </div>
                  </TabsContent>

                  {/* Tab: Dados Adicionais */}
                  <TabsContent value="dados-adicionais" className="space-y-4 m-0">
                    <div className="bg-background p-4 rounded-md border shadow-sm space-y-4">
                        {/* First Block */}
                        <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-1">
                                <Label>Centro de Custo:</Label>
                                <div className="flex gap-2">
                                    <Input value={selectedItem?.CODCCUSTO || ''} className="flex-1" onChange={(e) => handleInputChange('CODCCUSTO', e.target.value)} />
                                    <Button variant="outline" size="icon" className="h-9 w-9"><Search className="h-4 w-4"/></Button>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label>Departamento:</Label>
                                <div className="flex gap-2">
                                    <Input value={selectedItem?.CODDEPARTAMENTO || ''} className="flex-1" onChange={(e) => handleInputChange('CODDEPARTAMENTO', e.target.value)} />
                                    <Button variant="outline" size="icon" className="h-9 w-9"><Search className="h-4 w-4"/></Button>
                                </div>
                            </div>
                             <div className="space-y-1">
                                <Label>Natureza Orçamentária Financeira:</Label>
                                <div className="flex gap-2">
                                    <Input value={selectedItem?.CODNATFIN || ''} className="flex-1" onChange={(e) => handleInputChange('CODNATFIN', e.target.value)} />
                                    <Button variant="outline" size="icon" className="h-9 w-9"><Search className="h-4 w-4"/></Button>
                                </div>
                            </div>
                             <div className="space-y-1">
                                <Label>Meio de Pagamento:</Label>
                                <div className="flex gap-2">
                                    <Input value={selectedItem?.CODPAGAMENTO || ''} className="flex-1" onChange={(e) => handleInputChange('CODPAGAMENTO', e.target.value)} />
                                    <Button variant="outline" size="icon" className="h-9 w-9"><Search className="h-4 w-4"/></Button>
                                </div>
                            </div>
                        </div>
                        
                        {/* Tabelas Opcionais */}
                        <fieldset className="border p-4 rounded-md space-y-3">
                            <legend className="px-2 text-sm font-semibold text-muted-foreground">Tabelas Opcionais</legend>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label>Seção:</Label>
                                    <div className="flex gap-2">
                                        <Input value={selectedItem?.CODSECAO || ''} className="flex-1" onChange={(e) => handleInputChange('CODSECAO', e.target.value)} />
                                        <Button variant="outline" size="icon" className="h-9 w-9"><Search className="h-4 w-4"/></Button>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label>Portador:</Label>
                                    <div className="flex gap-2">
                                        <Input value={selectedItem?.CODPORTADOR || ''} className="flex-1" onChange={(e) => handleInputChange('CODPORTADOR', e.target.value)} />
                                        <Button variant="outline" size="icon" className="h-9 w-9"><Search className="h-4 w-4"/></Button>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label>Centro de Despesa:</Label>
                                    <div className="flex gap-2">
                                        <Input value={selectedItem?.CODCENTRODESPESA || ''} className="flex-1" onChange={(e) => handleInputChange('CODCENTRODESPESA', e.target.value)} />
                                        <Button variant="outline" size="icon" className="h-9 w-9"><Search className="h-4 w-4"/></Button>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label>Natureza de Gasto:</Label>
                                    <div className="flex gap-2">
                                        <Input value={selectedItem?.CODNATUREZAGASTO || ''} className="flex-1" onChange={(e) => handleInputChange('CODNATUREZAGASTO', e.target.value)} />
                                        <Button variant="outline" size="icon" className="h-9 w-9"><Search className="h-4 w-4"/></Button>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label>Contratos Vendor:</Label>
                                    <div className="flex gap-2">
                                        <Input value={selectedItem?.CODCONTRATOVENDOR || ''} className="flex-1" onChange={(e) => handleInputChange('CODCONTRATOVENDOR', e.target.value)} />
                                        <Button variant="outline" size="icon" className="h-9 w-9"><Search className="h-4 w-4"/></Button>
                                    </div>
                                </div>
                            </div>
                        </fieldset>

                        {/* Contabilização */}
                        <fieldset className="border p-4 rounded-md space-y-3">
                            <legend className="px-2 text-sm font-semibold text-muted-foreground">Contabilização</legend>
                            <div className="flex items-end gap-4">
                                <div className="space-y-1 flex-1">
                                    <Label>Tipo Contábil:</Label>
                                    <Select value={selectedItem?.TIPOCONTABIL} onValueChange={(v) => handleInputChange('TIPOCONTABIL', v)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Não Contábil" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="nao-contabil">Não Contábil</SelectItem>
                                            <SelectItem value="contabil">Contábil</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button variant="outline">Contabilização</Button>
                            </div>
                        </fieldset>

                        {/* Livro Caixa Digital */}
                        <fieldset className="border p-4 rounded-md space-y-3">
                            <legend className="px-2 text-sm font-semibold text-muted-foreground">Livro Caixa Digital do produtor rural</legend>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label>Classificação do lançamento no LCDPR:</Label>
                                    <Select value={selectedItem?.LCDPR_CLASSIFICACAO} onValueChange={(v) => handleInputChange('LCDPR_CLASSIFICACAO', v)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="item1">Item 1</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label>CPF/CNPJ do Participante:</Label>
                                    <Input value={selectedItem?.LCDPR_PARTICIPANTE || ''} onChange={(e) => handleInputChange('LCDPR_PARTICIPANTE', e.target.value)} />
                                </div>
                                <div className="space-y-1 col-span-2">
                                    <Label>Tipo de lançamento no LCDPR:</Label>
                                    <Select value={selectedItem?.LCDPR_TIPO} onValueChange={(v) => handleInputChange('LCDPR_TIPO', v)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="item1">Item 1</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </fieldset>
                    </div>
                  </TabsContent>

                  <TabsContent value="dados-cheque" className="m-0">
                    <div className="bg-background p-4 rounded-md border shadow-sm flex items-center justify-center h-40 text-muted-foreground">
                        Dados do cheque (Em desenvolvimento)
                    </div>
                  </TabsContent>

                  <TabsContent value="campos-complementares" className="m-0">
                    <div className="bg-background p-4 rounded-md border shadow-sm flex items-center justify-center h-40 text-muted-foreground">
                        Campos complementares (Em desenvolvimento)
                    </div>
                  </TabsContent>
              </ScrollArea>
            </Tabs>
          </div>
          
          <DialogFooter className="p-4 border-t bg-muted/10">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => setIsDialogOpen(false)}>OK</Button>
            <Button variant="default">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
