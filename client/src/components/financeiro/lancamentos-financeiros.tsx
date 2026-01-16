import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Search, Plus, Filter, RefreshCw, X, Save, FileText, Settings, Paperclip, Calendar, MoreVertical, DollarSign, Wallet } from "lucide-react";
import { AuthService } from "@/lib/auth";
import { EndpointService } from "@/lib/endpoint";
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

interface Metadata {
  COLUNA: string;
  DESCRICAO: string;
}

interface Lancamento {
  IDLAN?: number;
  CODCOLIGADA?: number;
  CODFILIAL?: number;
  PAGREC?: number; // 1-Receber, 2-Pagar
  CODCFO?: string;
  NOME?: string; // Nome do Cliente/Fornecedor
  NOMEFANTASIA?: string; // Do Cliente/Fornecedor
  CGCCFO?: string;
  NUMERODOCUMENTO?: string;
  SEGUNDONUMERO?: string;
  DATAEMISSAO?: string;
  DATAVENCIMENTO?: string;
  DATABAIXA?: string;
  DATAPREVBAIXA?: string;
  DATACRIACAO?: string;
  VALORORIGINAL?: number;
  VALORBAIXADO?: number;
  VALORLIQUIDO?: number;
  CODTDO?: string; // Tipo de Documento
  DESCRICAOTDO?: string;
  HISTORICO?: string;
  SERIEDOCUMENTO?: string;
  CODMOEDA?: string;
  CODCONTA?: string; // Conta/Caixa
  STATUSLAN?: number; // 0-Aberto, 1-Baixado, 2-Cancelado
  [key: string]: any;
}

interface LancamentosFinanceirosProps {
  title: string;
  description: string;
  endpoint: string;
  defaultPagRec: number; // 1-Receber, 2-Pagar
}

export function LancamentosFinanceiros({ title, description, endpoint: dataEndpoint, defaultPagRec }: LancamentosFinanceirosProps) {
  const [data, setData] = useState<Lancamento[]>([]);
  const [metadata, setMetadata] = useState<Metadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Lancamento | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  // Filter State
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [dateType, setDateType] = useState("DATAEMISSAO"); // DATAEMISSAO, DATAVENCIMENTO, DATACRIACAO

  const fetchMetadata = async () => {
    try {
      const token = AuthService.getStoredToken();
      if (!token) return;
      const endpoint = await EndpointService.getDefaultEndpoint();
      const metadataPath = `/api/framework/v1/consultaSQLServer/RealizaConsulta/SIT.PORTALRM.016/1/T?parameters=TABELA=FLAN`;
      const response = await fetch(
        `/api/proxy?endpoint=${encodeURIComponent(endpoint)}&path=${encodeURIComponent(metadataPath)}&token=${encodeURIComponent(token.access_token)}`
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
      if (!token) return;

      const endpoint = await EndpointService.getDefaultEndpoint();

      // Assuming parameters are DATAINI and DATAFIM like in importacao-xml
      const parameters = [
        `DATAINI=${dateStart}T00:00:00`,
        `DATAFIM=${dateEnd}T23:59:59`,
        `TIPODATA=${dateType}` // Tentativa de passar o tipo de data se o backend suportar
      ].join(";");

      const dataPath = `/api/framework/v1/consultaSQLServer/RealizaConsulta/${dataEndpoint}/1/T?parameters=${parameters}`;
      
      const response = await fetch(
        `/api/proxy?endpoint=${encodeURIComponent(endpoint)}&path=${encodeURIComponent(dataPath)}&token=${encodeURIComponent(token.access_token)}`
      );

      if (response.ok) {
        const json = await response.json();
        const resultItems = Array.isArray(json) ? json : (json.data || []);
        
        // Client-side filtering to ensure accuracy (ignoring time)
        const filtered = resultItems.filter((item: Lancamento) => {
            const dateValue = item[dateType];
            if (!dateValue) return false;

            // Extract YYYY-MM-DD part from the date string to compare only dates
            let itemDateStr = "";
            if (typeof dateValue === 'string') {
                itemDateStr = dateValue.split('T')[0];
            } else {
                 // Fallback safely
                 try {
                    itemDateStr = new Date(dateValue).toISOString().split('T')[0];
                 } catch (e) {
                    return false;
                 }
            }

            return itemDateStr >= dateStart && itemDateStr <= dateEnd;
        });

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
        description: "Não foi possível carregar os lançamentos.",
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
    // Parse manually to avoid timezone issues (UTC vs Local)
    // Assumes YYYY-MM-DD format from backend
    const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
        const [_, year, month, day] = match;
        return `${day}/${month}/${year}`;
    }
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const handleEdit = (item: Lancamento) => {
    setSelectedItem(item);
    setIsDialogOpen(true);
  };

  const handleNew = () => {
    setSelectedItem({
        IDLAN: 0,
        PAGREC: defaultPagRec, 
        CODCOLIGADA: 1,
        CODFILIAL: 1,
        DATAEMISSAO: new Date().toISOString().split('T')[0],
        DATAVENCIMENTO: new Date().toISOString().split('T')[0],
        VALORORIGINAL: 0
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
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground text-sm">
            {description}
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
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
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
                            <SelectItem value="DATAEMISSAO">Data de Emissão</SelectItem>
                            <SelectItem value="DATAVENCIMENTO">Data de Vencimento</SelectItem>
                            <SelectItem value="DATACRIACAO">Data de Criação</SelectItem>
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
                <TableHead className="w-[50px] text-center">Status</TableHead>
                <TableHead>Ref (ID)</TableHead>
                <TableHead>Pagar/Receber</TableHead>
                <TableHead>Filial</TableHead>
                <TableHead>Cliente/Fornecedor</TableHead>
                <TableHead>Num. Documento</TableHead>
                <TableHead>Emissão</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead className="text-right">Valor Original</TableHead>
                <TableHead className="text-right">Valor Baixado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center h-24">Carregando...</TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center h-24 text-muted-foreground">
                    Use os filtros para buscar lançamentos.
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
                        <div className={`h-3 w-3 rounded-full mx-auto ${item.STATUSLAN === 1 ? 'bg-green-500' : item.STATUSLAN === 2 ? 'bg-red-500' : 'bg-yellow-500'}`} title={item.STATUSLAN === 1 ? 'Baixado' : item.STATUSLAN === 2 ? 'Cancelado' : 'Aberto'} />
                    </TableCell>
                    <TableCell>{item.IDLAN}</TableCell>
                    <TableCell>{item.PAGREC === 1 ? 'Receber' : 'Pagar'}</TableCell>
                    <TableCell>{item.CODFILIAL}</TableCell>
                    <TableCell>
                        <div className="flex flex-col">
                            <span className="font-medium">{item.NOME || item.CODCFO}</span>
                            <span className="text-xs text-muted-foreground">{item.NOMEFANTASIA}</span>
                        </div>
                    </TableCell>
                    <TableCell>{item.NUMERODOCUMENTO}</TableCell>
                    <TableCell>{formatDate(item.DATAEMISSAO)}</TableCell>
                    <TableCell>{formatDate(item.DATAVENCIMENTO)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.VALORORIGINAL || 0)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatCurrency(item.VALORBAIXADO || 0)}
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
              Lançamento: {selectedItem?.IDLAN || 'Novo'} - {selectedItem?.CODCFO || ''} - {selectedItem?.NUMERODOCUMENTO || ''} - {formatCurrency(selectedItem?.VALORORIGINAL || 0)}
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
                    <TabsTrigger value="valores" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 pb-2 pt-1">
                    Valores
                    </TabsTrigger>
                    <TabsTrigger value="integracao" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 pb-2 pt-1">
                    Integração Bancária
                    </TabsTrigger>
                    <TabsTrigger value="fiscal" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 pb-2 pt-1">
                    Integração Fiscal
                    </TabsTrigger>
                    <TabsTrigger value="folha" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 pb-2 pt-1">
                    Integração Folha
                    </TabsTrigger>
                    <TabsTrigger value="dados-adicionais" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 pb-2 pt-1">
                    Dados Adicionais
                    </TabsTrigger>
                </TabsList>
              </div>

              <ScrollArea className="flex-1 p-4">
                  {/* Tab: Identificação */}
                  <TabsContent value="identificacao" className="space-y-4 m-0">
                    <div className="bg-background p-4 rounded-md border shadow-sm space-y-4">
                        <div className="grid grid-cols-4 gap-4">
                            <div className="space-y-1">
                                <Label>{getLabel('PAGREC') || 'Pagar ou Receber:'}</Label>
                                <Select value={String(selectedItem?.PAGREC || '1')} onValueChange={(v) => handleInputChange('PAGREC', parseInt(v))}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">Receber</SelectItem>
                                        <SelectItem value="2">Pagar</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="col-span-2 space-y-1">
                                <Label>{getLabel('CODFILIAL') || 'Filial:'}</Label>
                                <div className="flex gap-2">
                                    <Input value={selectedItem?.CODFILIAL || ''} className="w-16" onChange={(e) => handleInputChange('CODFILIAL', e.target.value)} />
                                    <Input readOnly className="flex-1 bg-muted" value="Matriz" />
                                    <Button variant="outline" size="icon" className="h-9 w-9"><Search className="h-4 w-4"/></Button>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label>Ref:</Label>
                                <div className="font-bold text-lg pt-1">{selectedItem?.IDLAN}</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-4">
                            <div className="col-span-3 space-y-1">
                                <Label>{getLabel('CODCFO') || 'Cliente/Fornecedor:'}</Label>
                                <div className="flex gap-2">
                                    <Input value={selectedItem?.CODCFO || ''} className="w-24" onChange={(e) => handleInputChange('CODCFO', e.target.value)} />
                                    <Input readOnly className="flex-1 text-blue-600" value={selectedItem?.NOMEFANTASIA || ''} />
                                    <Button variant="outline" size="icon" className="h-9 w-9"><Search className="h-4 w-4"/></Button>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label>{getLabel('CGCCFO') || 'CNPJ/CPF:'}</Label>
                                <Input value={selectedItem?.CGCCFO || ''} readOnly className="bg-muted" />
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-4">
                            <div className="col-span-2 space-y-1">
                                <Label>{getLabel('CODTDO') || 'Tipo de Documento:'}</Label>
                                <div className="flex gap-2">
                                    <Input value={selectedItem?.CODTDO || ''} className="w-16" onChange={(e) => handleInputChange('CODTDO', e.target.value)} />
                                    <Input readOnly className="flex-1 text-blue-600" value={selectedItem?.DESCRICAOTDO || ''} />
                                    <Button variant="outline" size="icon" className="h-9 w-9"><Search className="h-4 w-4"/></Button>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label>{getLabel('NUMERODOCUMENTO') || 'Núm. Documento:'}</Label>
                                <Input value={selectedItem?.NUMERODOCUMENTO || ''} onChange={(e) => handleInputChange('NUMERODOCUMENTO', e.target.value)} />
                            </div>
                            <div className="space-y-1">
                                <Label>{getLabel('SEGUNDONUMERO') || 'Segundo Número:'}</Label>
                                <Input value={selectedItem?.SEGUNDONUMERO || ''} onChange={(e) => handleInputChange('SEGUNDONUMERO', e.target.value)} />
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-4">
                            <div className="space-y-1">
                                <Label>{getLabel('DATAEMISSAO') || 'Data de Emissão:'}</Label>
                                <div className="relative">
                                    <Input type="date" value={selectedItem?.DATAEMISSAO?.split('T')[0] || ''} onChange={(e) => handleInputChange('DATAEMISSAO', e.target.value)} />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label>{getLabel('DATAVENCIMENTO') || 'Data de Vencimento:'}</Label>
                                <div className="relative">
                                    <Input type="date" value={selectedItem?.DATAVENCIMENTO?.split('T')[0] || ''} onChange={(e) => handleInputChange('DATAVENCIMENTO', e.target.value)} />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label>{getLabel('DATABAIXA') || 'Data de Baixa:'}</Label>
                                <Input type="date" value={selectedItem?.DATABAIXA?.split('T')[0] || ''} readOnly className="bg-muted" />
                            </div>
                            <div className="space-y-1">
                                <Label>{getLabel('DATAPREVBAIXA') || 'Data Prev. Baixa:'}</Label>
                                <Input type="date" value={selectedItem?.DATAPREVBAIXA?.split('T')[0] || ''} onChange={(e) => handleInputChange('DATAPREVBAIXA', e.target.value)} />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label>{getLabel('HISTORICO') || 'Histórico:'}</Label>
                            <Input value={selectedItem?.HISTORICO || ''} onChange={(e) => handleInputChange('HISTORICO', e.target.value)} />
                        </div>

                        <div className="space-y-1 w-1/4">
                            <Label>{getLabel('SERIEDOCUMENTO') || 'Série do Documento:'}</Label>
                            <Input value={selectedItem?.SERIEDOCUMENTO || ''} onChange={(e) => handleInputChange('SERIEDOCUMENTO', e.target.value)} />
                        </div>
                    </div>
                  </TabsContent>

                  {/* Tab: Valores */}
                  <TabsContent value="valores" className="space-y-4 m-0">
                    <Tabs defaultValue="gerais" className="w-full">
                        <TabsList className="w-full justify-start h-8 bg-transparent p-0 border-b mb-4">
                            <TabsTrigger value="gerais" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 text-xs">Gerais</TabsTrigger>
                            <TabsTrigger value="adicionais" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 text-xs">Adicionais</TabsTrigger>
                            <TabsTrigger value="tributos" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 text-xs">Tributos</TabsTrigger>
                            <TabsTrigger value="valores-integracao" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 text-xs">Valores de Integração</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="gerais" className="space-y-4">
                            <div className="bg-background p-4 rounded-md border shadow-sm space-y-4">
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-1">
                                        <Label className="font-bold">{getLabel('VALORORIGINAL') || 'Valor Original:'}</Label>
                                        <Input className="text-right font-bold" value={formatCurrency(selectedItem?.VALORORIGINAL || 0)} onChange={(e) => handleInputChange('VALORORIGINAL', parseFloat(e.target.value.replace(/[^0-9,-]+/g,"").replace(",", ".")))} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label>{getLabel('CODMOEDA') || 'Moeda:'}</Label>
                                        <div className="flex gap-2">
                                            <Input value={selectedItem?.CODMOEDA || 'R$'} className="w-16" />
                                            <Input value="Real" readOnly className="flex-1 text-blue-600 underline" />
                                            <Button variant="outline" size="icon" className="h-9 w-9"><Search className="h-4 w-4"/></Button>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Indexador:</Label>
                                        <div className="flex gap-2">
                                            <Input className="flex-1" />
                                            <Button variant="outline" size="icon" className="h-9 w-9"><Search className="h-4 w-4"/></Button>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-1">
                                        <Label className="text-muted-foreground">{getLabel('VALORBAIXADO') || 'Valor Baixado:'}</Label>
                                        <Input className="text-right bg-muted" readOnly value={formatCurrency(selectedItem?.VALORBAIXADO || 0)} />
                                    </div>
                                    <div className="col-span-2 space-y-1">
                                        <Label>{getLabel('CODCONTA') || 'Conta/Caixa:'}</Label>
                                        <div className="flex gap-2">
                                            <Input value={selectedItem?.CODCONTA || ''} className="w-24" onChange={(e) => handleInputChange('CODCONTA', e.target.value)} />
                                            <Input readOnly className="flex-1 text-blue-600" value="CAIXA GERAL" />
                                            <Button variant="outline" size="icon" className="h-9 w-9"><Search className="h-4 w-4"/></Button>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <Label>Convênio:</Label>
                                    <div className="flex gap-2">
                                        <Input className="w-24" />
                                        <Input className="flex-1 text-blue-600 underline" />
                                        <Button variant="outline" size="icon" className="h-9 w-9"><Search className="h-4 w-4"/></Button>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <div className="grid grid-cols-3 gap-2 items-end">
                                            <div className="space-y-1">
                                                <Label>Juros:</Label>
                                                <Input className="text-right" defaultValue="0,00" />
                                            </div>
                                            <div className="space-y-1">
                                                <Label>%:</Label>
                                                <Input className="text-right" defaultValue="0,000" />
                                            </div>
                                            <div className="space-y-1">
                                                <Label>Fórmula:</Label>
                                                <div className="flex gap-1">
                                                    <Input className="flex-1" />
                                                    <Button variant="outline" size="icon" className="h-9 w-9"><Search className="h-3 w-3"/></Button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 items-end">
                                            <div className="space-y-1">
                                                <Label>Multa:</Label>
                                                <Input className="text-right" defaultValue="0,00" />
                                            </div>
                                            <div className="space-y-1">
                                                <Label>%:</Label>
                                                <Input className="text-right" defaultValue="0,000" />
                                            </div>
                                            <div className="space-y-1">
                                                <Label>Fórmula:</Label>
                                                <div className="flex gap-1">
                                                    <Input className="flex-1" />
                                                    <Button variant="outline" size="icon" className="h-9 w-9"><Search className="h-3 w-3"/></Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2 border p-2 rounded">
                                        <div className="flex justify-between items-center">
                                            <Label>Valor Líquido</Label>
                                            <Label className="text-xs text-muted-foreground">Data Valor Líquido:</Label>
                                        </div>
                                        <div className="flex gap-2">
                                             <div className="flex-1 p-2 bg-muted/50 rounded text-right font-bold text-lg">
                                                {formatCurrency((selectedItem?.VALORORIGINAL || 0) - (selectedItem?.VALORBAIXADO || 0))}
                                             </div>
                                             <Input type="date" className="w-32" />
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <Button variant="outline" size="sm" className="h-6 w-6 p-0 rounded-full bg-blue-100 text-blue-600">i</Button>
                                            <Button variant="outline" size="sm" className="h-6 w-6 p-0 rounded-full bg-green-100 text-green-600">$</Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                  </TabsContent>

                  {/* Other tabs can be placeholders for now as per screenshots provided only Identificacao and Valores */}
                  <TabsContent value="integracao" className="p-4 bg-background rounded-md border text-center text-muted-foreground">
                      Integração Bancária
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
