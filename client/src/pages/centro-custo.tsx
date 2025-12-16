import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building, RefreshCw, Loader2 } from "lucide-react";
import { CostCenterService, CostCenter } from "@/lib/cost-center";
import { useToast } from "@/hooks/use-toast";
import { TreeDataTable } from "@/components/ui/tree-data-table";
import { columns } from "./centro-custo-columns";

export default function CentroCustoPage() {
  const [data, setData] = useState<CostCenter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const result = await CostCenterService.getCostCenters();
      const treeData = CostCenterService.buildTree(result);
      setData(treeData);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar centros de custo",
        description: "Não foi possível obter os dados. Tente novamente.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Building className="h-8 w-8 text-primary" />
            Centro de Custo
          </h1>
          <p className="text-muted-foreground mt-2">
            Visualize os centros de custo cadastrados no sistema.
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchData} 
          disabled={isLoading}
          className="gap-2"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Atualizar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listagem de Centros de Custo</CardTitle>
          <CardDescription>
            Exibindo todos os centros de custo disponíveis em estrutura hierárquica.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-4" />
              <p>Carregando dados...</p>
            </div>
          ) : (
            <TreeDataTable 
              columns={columns} 
              data={data} 
              filterColumn="name"
              filterPlaceholder="Filtrar por nome..."
              getSubRows={(row) => row.children && row.children.length > 0 ? row.children : undefined}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
