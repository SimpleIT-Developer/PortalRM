import { useMemo, useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, Loader2, Search } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { AuthService } from "@/lib/auth";
import { EndpointService } from "@/lib/endpoint";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export interface ServicoItem {
  IDPRD: number;
  CODIGOPRD: string;
  NOMEFANTASIA: string;
  CODUNDCONTROLE: string;
  CODUNDCOMPRA: string;
  CODUNDVENDA: string;
  [key: string]: any;
}

export const columns: ColumnDef<ServicoItem>[] = [
  {
    accessorKey: "IDPRD",
    header: "ID",
    cell: ({ getValue }) => (
      <span className="text-white font-mono text-sm">{String(getValue() ?? "-")}</span>
    ),
  },
  {
    accessorKey: "CODIGOPRD",
    header: "Código",
    cell: ({ getValue }) => (
      <span className="text-white font-mono text-sm">{String(getValue() ?? "-")}</span>
    ),
  },
  {
    accessorKey: "NOMEFANTASIA",
    header: "Descrição",
    cell: ({ getValue }) => (
      <span className="text-white text-sm">{String(getValue() ?? "-")}</span>
    ),
  },
  {
    accessorKey: "CODUNDCOMPRA",
    header: "Unidade de Venda",
    cell: ({ getValue }) => (
      <span className="text-white text-sm">{String(getValue() ?? "-")}</span>
    ),
  },
  {
    accessorKey: "CODUNDVENDA",
    header: "Unidade de Compra",
    cell: ({ getValue }) => (
      <span className="text-white text-sm">{String(getValue() ?? "-")}</span>
    ),
  },
  {
    accessorKey: "CODUNDCONTROLE",
    header: "Unidade de Controle",
    cell: ({ getValue }) => (
      <span className="text-white text-sm">{String(getValue() ?? "-")}</span>
    ),
  },
];

export default function ServicosPage() {
  const [items, setItems] = useState<ServicoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const endpoint = await EndpointService.getDefaultEndpoint();
      const token = AuthService.getStoredToken();

      if (!token) {
        toast({
          title: "Erro de autenticação",
          description: "Você precisa estar logado para acessar esta página.",
          variant: "destructive",
          });
        return;
      }

      const path = "/api/framework/v1/consultaSQLServer/RealizaConsulta/SIT.PORTALRM.012/1/T";
      const fullUrl = `/api/proxy?endpoint=${encodeURIComponent(endpoint)}&path=${encodeURIComponent(path)}&token=${encodeURIComponent(token.access_token)}`;

      const response = await fetch(fullUrl);
      if (!response.ok) {
        throw new Error("Falha ao buscar dados");
      }

      const data = await response.json();
      
      if (Array.isArray(data)) {
        setItems(data);
      } else if (data && typeof data === 'object') {
        setItems([data]); 
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os serviços.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;

    return items.filter((item) => {
      const haystack = `${item.IDPRD ?? ""} ${item.CODIGOPRD ?? ""} ${item.NOMEFANTASIA ?? ""} ${item.CODUNDCONTROLE ?? ""}`
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [items, search]);

  return (
    <div className="flex flex-col gap-4 overflow-x-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-gray-400 text-sm">
            Gerencie os serviços cadastrados no sistema
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:justify-end">
          <Badge variant="secondary" className="text-primary">
            {filteredItems.length} {filteredItems.length === 1 ? "serviço" : "serviços"}
          </Badge>
          <Button
            onClick={fetchData}
            className="bg-yellow-500 hover:bg-yellow-600 text-black w-full sm:w-auto"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Atualizar Serviços
          </Button>
        </div>
      </div>

      <Card className="glassmorphism border-white/20">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar em todos os campos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder-gray-400"
              />
            </div>
            {search && (
              <Button
                variant="outline"
                onClick={() => setSearch("")}
                className="border-white/20 text-white hover:bg-white/10 w-full sm:w-auto"
              >
                Limpar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="glassmorphism border-white/20">
        <CardContent className="p-4">
          {loading ? (
            <div className="flex items-center justify-center min-h-[240px]">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                <p className="text-white/80">Carregando serviços...</p>
              </div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">
                {search ? "Nenhum serviço encontrado para sua busca." : "Nenhum serviço encontrado."}
              </p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredItems}
              tableContainerClassName="bg-white/5 rounded-lg overflow-hidden border-none shadow-none"
              tableHeaderClassName="bg-white/10"
              tableHeaderRowClassName="border-b border-white/10 hover:bg-transparent"
              tableHeadClassName="text-left py-3 px-2 text-gray-300 font-semibold text-xs h-auto"
              tableRowClassName="border-b border-white/5 hover:bg-white/5 transition-colors"
              tableCellClassName="py-2 px-2"
              paginationVariant="icons"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
