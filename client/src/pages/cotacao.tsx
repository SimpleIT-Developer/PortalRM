import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AuthService } from "@/lib/auth";
import { EndpointService } from "@/lib/endpoint";
import { useToast } from "@/hooks/use-toast";
import { Search, RefreshCw, Filter, FileText } from "lucide-react";

interface CotacaoItem {
  CODCOLIGADA: number;
  CODCOTACAO: string;
  DATCOTACAO: string;
  DATLIMRESPTA?: string;
  CODCOMPRADOR: string;
  STSCOTACAO: string;
  OBSERVACAO?: string;
  CODFILIAL?: number;
  CODMOE?: string;
  CODCPG?: string;
  CODTRA?: string;
  [key: string]: any;
}

export default function Cotacao() {
  const [data, setData] = useState<CotacaoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [dateType, setDateType] = useState("DATCOTACAO");
  const { toast } = useToast();

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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "0": return "Concluída";
      case "1": return "Composição";
      case "2": return "Aguardando Resposta Fornecedores";
      case "3": return "Ordem de Compra Parcialmente Gerada";
      case "4": return "Quadro Comparativo";
      case "5": return "Negociação da Melhor Oferta";
      case "6": return "Pedido de Compra";
      case "7": return "Cancelada";
      case "8": return "Liberada";
      case "9": return "Aguardando Análise da Cotação";
      default: return status;
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
      if (!token) {
        toast({
          title: "Autenticação necessária",
          description: "Faça login novamente para buscar as cotações.",
          variant: "destructive",
        });
        return;
      }

      const endpoint = await EndpointService.getDefaultEndpoint();
      if (!endpoint) {
        toast({
          title: "Endpoint não configurado",
          description: "Selecione um ambiente válido antes de buscar.",
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

      const parameters = [`CODCOLIGADA=${codColigada}`].join(";");

      const path = `/api/framework/v1/consultaSQLServer/RealizaConsulta/SIT.PORTALRM.022/${codColigada}/T?parameters=${parameters}`;

      const response = await fetch(
        `/api/proxy?endpoint=${encodeURIComponent(endpoint)}&path=${encodeURIComponent(path)}&token=${encodeURIComponent(
          token.access_token
        )}`
      );

      if (!response.ok) {
        throw new Error("Falha ao carregar cotações");
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
          description: "Não foram encontradas cotações para o período informado.",
        });
      }
    } catch (error: any) {
      console.error("Erro ao buscar cotações:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível carregar as cotações.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col p-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex-none flex items-center justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Cotações
          </h1>
          <p className="text-muted-foreground text-sm">
            Visualize as cotações emitidas, filtrando por período.
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
          <CardDescription>Selecione o período para buscar as cotações.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2 w-40">
              <Label htmlFor="dateType">Filtrar por</Label>
              <Input id="dateType" readOnly value="Data Cotação" className="w-40 bg-muted cursor-not-allowed" />
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
                <TableHead>Código (CODCOTACAO)</TableHead>
                <TableHead>Data Cotação</TableHead>
                <TableHead>Data Limite</TableHead>
                <TableHead>Cod. Comprador</TableHead>
                <TableHead>Observação</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Cod. Filial</TableHead>
                <TableHead>Cond. Pagamento</TableHead>
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
                    Use os filtros para buscar cotações.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item, index) => (
                  <TableRow key={index} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{item.CODCOTACAO}</TableCell>
                    <TableCell>{formatDate(item.DATCOTACAO)}</TableCell>
                    <TableCell>{formatDate(item.DATLIMRESPTA)}</TableCell>
                    <TableCell>{item.CODCOMPRADOR || item.CODUSUARIO}</TableCell>
                    <TableCell className="max-w-xs truncate" title={item.OBSERVACAO}>
                      {item.OBSERVACAO || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {getStatusLabel(item.STSCOTACAO)}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.CODFILIAL}</TableCell>
                    <TableCell>{item.CODCPG}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
