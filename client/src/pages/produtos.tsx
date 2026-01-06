import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, RefreshCw, Loader2 } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { AuthService } from "@/lib/auth";
import { EndpointService } from "@/lib/endpoint";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

export interface ProdutoItem {
  IDPRD: number;
  CODIGOPRD: string;
  NOMEFANTASIA: string;
  CODUNDCONTROLE: string;
  [key: string]: any;
}

export const columns: ColumnDef<ProdutoItem>[] = [
  {
    accessorKey: "CODIGOPRD",
    header: "Código",
  },
  {
    accessorKey: "NOMEFANTASIA",
    header: "Descrição",
  },
];

export default function ProdutosPage() {
  const [items, setItems] = useState<ProdutoItem[]>([]);
  const [loading, setLoading] = useState(true);
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

      const path = "/api/framework/v1/consultaSQLServer/RealizaConsulta/SIT.PORTALRM.011/1/T";
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
        description: "Não foi possível carregar os produtos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Produtos</h1>
          <p className="text-muted-foreground">
            Gerencie o cadastro de produtos
          </p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm" className="h-8 gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <Card className="border-none bg-black/40 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
             <Package className="h-6 w-6" />
             Lista de Produtos
          </CardTitle>
          <CardDescription>
            Visualização dos produtos cadastrados no sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="rounded-md border-none">
              <DataTable 
                columns={columns} 
                data={items} 
                searchKey="NOMEFANTASIA"
                searchPlaceholder="Filtrar por nome..."
                className="[&_th]:bg-secondary/50 [&_th]:text-gray-300 [&_th]:font-semibold [&_td]:text-gray-300 [&_tr]:border-white/5 [&_tr:hover]:bg-white/5"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
