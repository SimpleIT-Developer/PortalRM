import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, RefreshCw, Loader2 } from "lucide-react";
import { BudgetaryNatureService, BudgetaryNature } from "@/lib/budgetary-nature";
import { useToast } from "@/hooks/use-toast";
import { TreeDataTable } from "@/components/ui/tree-data-table";
import { columns } from "./natureza-orcamentaria-columns";

export default function NaturezaOrcamentariaPage() {
  const [data, setData] = useState<BudgetaryNature[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const result = await BudgetaryNatureService.getBudgetaryNatures();
      const treeData = BudgetaryNatureService.buildTree(result);
      setData(treeData);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar naturezas orçamentárias",
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
            <DollarSign className="h-8 w-8 text-primary" />
            Natureza Orçamentária
          </h1>
          <p className="text-muted-foreground mt-2">
            Visualize as naturezas orçamentárias cadastradas no sistema.
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
          <CardTitle>Listagem de Naturezas</CardTitle>
          <CardDescription>
            Exibindo todas as naturezas orçamentárias disponíveis.
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
              filterColumn="description"
              filterPlaceholder="Filtrar por descrição..."
              getSubRows={(row) => row.children && row.children.length > 0 ? row.children : undefined}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
