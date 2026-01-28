import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AuthService } from "@/lib/auth";
import { EnvironmentConfigService } from "@/lib/environment-config";
import { useToast } from "@/hooks/use-toast";
import { Search, RefreshCw, Filter, FileText } from "lucide-react";
import { getTenant } from "@/lib/tenant";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface NotaFiscalServicoItem {
  CODCOLIGADA: number;
  IDMOV: number;
  NSEQITMMOV: number;
  IDPRD: number;
  NOMEFANTASIA: string;
  QUANTIDADE: number;
  PRECOUNITARIO: number;
  CODUND: string;
  VALORLIQUIDO: number;
  [key: string]: any;
}

interface NotaFiscalServico {
  IDMOV: number;
  NUMEROMOV: string;
  DATAEMISSAO: string;
  VALORBRUTO: number;
  CODFILIAL: number;
  STATUS: string;
  CODCFO?: string;
  NOME?: string;
  NOMEFANTASIA?: string;
  [key: string]: any;
}

export default function NotasFiscaisServicos() {
  const [data, setData] = useState<NotaFiscalServico[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [dateType, setDateType] = useState("DATAEMISSAO");
  const { toast } = useToast();

  const [itemsDialogOpen, setItemsDialogOpen] = useState(false);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [selectedNf, setSelectedNf] = useState<NotaFiscalServico | null>(null);
  const [nfItems, setNfItems] = useState<NotaFiscalServicoItem[]>([]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const [_, year, month, day] = match;
      return `${day}/${month}/${year}`;
    }
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const toBrDate = (isoDate: string) => {
    const parts = isoDate.split("-");
    if (parts.length !== 3) return isoDate;
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  };

  const normalizeToIso = (dateValue: any): string | null => {
    if (!dateValue) return null;
    if (typeof dateValue === "string") {
      const isoMatch = dateValue.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (isoMatch) {
        const [_, year, month, day] = isoMatch;
        return `${year}-${month}-${day}`;
      }
      const brMatch = dateValue.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
      if (brMatch) {
        const [_, day, month, year] = brMatch;
        return `${year}-${month}-${day}`;
      }
      try {
        return new Date(dateValue).toISOString().split("T")[0];
      } catch {
        return null;
      }
    }
    try {
      return new Date(dateValue).toISOString().split("T")[0];
    } catch {
      return null;
    }
  };

  const fetchData = async () => {
    if (!dateStart || !dateEnd) {
      toast({
        title: "Filtro necessário",
        description: "Selecione as datas inicial e final para buscar.",
        variant: "warning",
      });
      return;
    }

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

      const movements = EnvironmentConfigService.getNfServiceMovements();
      if (!movements || movements.length === 0) {
        toast({
          title: "Movimentos não configurados",
          description: "Configure os movimentos de Nota Fiscal de Serviço no Editar Ambiente.",
          variant: "destructive",
        });
        return;
      }

      let codColigada = "1";
      try {
        const savedColigada = localStorage.getItem("selected_coligada");
        if (savedColigada) {
          codColigada = savedColigada;
        }
      } catch {
        codColigada = "1";
      }

      const dataIniBr = toBrDate(dateStart);
      const dataFimBr = toBrDate(dateEnd);

      const parameters = [
        `CODCOLIGADA=${codColigada}`,
        `CODTMV=${movements.join(",")}`,
        `DATAINI=${dataIniBr}`,
        `DATAFIM=${dataFimBr}`,
        `TIPODATA=${dateType}`,
      ].join(";");

      const path = `/api/framework/v1/consultaSQLServer/RealizaConsulta/SIT.PORTALRM.021/${codColigada}/T?parameters=${parameters}`;

      const response = await fetch(
        `/api/proxy?environmentId=${encodeURIComponent(token.environmentId)}&path=${encodeURIComponent(path)}&token=${encodeURIComponent(
          token.access_token
        )}`, {
          headers: {
            ...(getTenant() ? { 'X-Tenant': getTenant()! } : {})
          }
        }
      );

      if (!response.ok) {
        throw new Error("Falha ao carregar notas fiscais de serviços");
      }

      const json = await response.json();
      const items = Array.isArray(json) ? json : json.data || [];

      const filtered = items.filter((item: any) => {
        const dateValue = item[dateType];
        const iso = normalizeToIso(dateValue);
        if (!iso) return false;
        return iso >= dateStart && iso <= dateEnd;
      });

      setData(filtered);

      if (!filtered || filtered.length === 0) {
        toast({
          title: "Nenhum registro encontrado",
          description: "Não foram encontradas notas fiscais para o período informado.",
        });
      }
    } catch (error: any) {
      console.error("Erro ao buscar notas fiscais de serviços:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível carregar as notas fiscais de serviços.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewItems = async (nf: NotaFiscalServico) => {
    setSelectedNf(nf);
    setItemsDialogOpen(true);
    setItemsLoading(true);
    setNfItems([]);

    try {
      const token = AuthService.getStoredToken();
      if (!token || !token.environmentId) return;

      let codColigada = "1";
      try {
        const savedColigada = localStorage.getItem("selected_coligada");
        if (savedColigada) {
          codColigada = savedColigada;
        }
      } catch {
        codColigada = "1";
      }

      const parameters = [`CODCOLIGADA=${codColigada}`, `IDMOV=${nf.IDMOV}`].join(";");
      const path = `/api/framework/v1/consultaSQLServer/RealizaConsulta/SIT.PORTALRM.010/${codColigada}/T?parameters=${parameters}`;

      const response = await fetch(
        `/api/proxy?environmentId=${encodeURIComponent(token.environmentId)}&path=${encodeURIComponent(path)}&token=${encodeURIComponent(
          token.access_token
        )}`, {
          headers: {
            ...(getTenant() ? { 'X-Tenant': getTenant()! } : {})
          }
        }
      );

      if (response.ok) {
        const json = await response.json();
        const items = Array.isArray(json) ? json : json.data || [];
        setNfItems(items);

        if (items.length === 0) {
          toast({
            title: "Aviso",
            description: "Nenhum item encontrado para esta nota fiscal.",
          });
        }
      } else {
        throw new Error("Falha ao buscar itens");
      }
    } catch (error) {
      console.error("Erro ao buscar itens:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os itens da nota fiscal.",
        variant: "destructive",
      });
    } finally {
      setItemsLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col p-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex-none flex items-center justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Notas Fiscais de Serviços
          </h1>
          <p className="text-muted-foreground text-sm">
            Visualize as notas fiscais de serviços emitidas, filtrando por período.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-primary bg-primary/10 hover:bg-primary/20 border-primary/20">
            {data.length} registros
          </Badge>
          <Button disabled={loading} onClick={fetchData} className="bg-yellow-500 hover:bg-yellow-600 text-black">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>
      </div>

      <Card className="border-muted/20 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Filtros de Busca</CardTitle>
          </div>
          <CardDescription>Selecione o período para buscar as notas fiscais de serviços.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2 w-40">
              <Label htmlFor="dateType">Filtrar por</Label>
              <Input id="dateType" readOnly value="Data de Emissão" className="w-40 bg-muted cursor-not-allowed" />
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

      <Card className="flex-1 flex flex-col overflow-hidden border-muted/20 shadow-sm">
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
              <TableRow>
                <TableHead>ID (IDMOV)</TableHead>
                <TableHead>Número</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Data Emissão</TableHead>
                <TableHead className="text-right">Valor Bruto</TableHead>
                <TableHead>Filial</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center h-24">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                    Use os filtros para buscar notas fiscais de serviços.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item, index) => (
                  <TableRow key={index} className="hover:bg-muted/50">
                    <TableCell>{item.IDMOV}</TableCell>
                    <TableCell>{item.NUMEROMOV}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-mono font-medium">
                          {item.CODCFO || ""}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {item.NOME || item.NOMEFANTASIA || ""}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(item.DATAEMISSAO)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.VALORBRUTO || 0)}
                    </TableCell>
                    <TableCell>{item.CODFILIAL}</TableCell>
                    <TableCell>
                      {item.STATUS === "V" ? (
                        <Badge className="bg-green-500 hover:bg-green-600">VALIDADO</Badge>
                      ) : item.STATUS === "A" ? (
                        <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">PENDENTE</Badge>
                      ) : (
                        <Badge variant="secondary">{item.STATUS}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => handleViewItems(item)}>
                        Itens
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
      <Dialog
        open={itemsDialogOpen}
        onOpenChange={(open) => {
          setItemsDialogOpen(open);
          if (!open) {
            setSelectedNf(null);
            setNfItems([]);
          }
        }}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Itens da Nota Fiscal {selectedNf?.NUMEROMOV ?? ""}
            </DialogTitle>
            <DialogDescription>
              {selectedNf
                ? `IDMOV: ${selectedNf.IDMOV} | Fornecedor: ${
                    selectedNf.CODCFO || ""
                  } - ${selectedNf.NOME || selectedNf.NOMEFANTASIA || ""}`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Qtd</TableHead>
                  <TableHead>Und</TableHead>
                  <TableHead className="text-right">Preço Unitário</TableHead>
                  <TableHead className="text-right">Valor Líquido</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itemsLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">
                      Carregando itens...
                    </TableCell>
                  </TableRow>
                ) : nfItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                      Nenhum item encontrado para esta nota fiscal.
                    </TableCell>
                  </TableRow>
                ) : (
                  nfItems.map((item, index) => (
                    <TableRow key={`${item.IDMOV}-${item.NSEQITMMOV}-${index}`}>
                      <TableCell>{item.NSEQITMMOV}</TableCell>
                      <TableCell>{item.NOMEFANTASIA}</TableCell>
                      <TableCell>{item.QUANTIDADE}</TableCell>
                      <TableCell>{item.CODUND}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.PRECOUNITARIO || 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.VALORLIQUIDO || 0)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
