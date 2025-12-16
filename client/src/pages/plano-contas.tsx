import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calculator, RefreshCw, Loader2 } from "lucide-react";
import { AccountingPlanService, AccountingAccount } from "@/lib/accounting-plan";
import { useToast } from "@/hooks/use-toast";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./plano-contas-columns";

export default function PlanoContasPage() {
  const [accounts, setAccounts] = useState<AccountingAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      const data = await AccountingPlanService.getAccountingPlan();
      setAccounts(data);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar plano de contas",
        description: "Não foi possível obter os dados. Tente novamente.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Calculator className="h-8 w-8 text-primary" />
            Plano de Contas
          </h1>
          <p className="text-muted-foreground mt-2">
            Visualize e gerencie a estrutura do plano de contas contábil.
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchAccounts} 
          disabled={isLoading}
          className="gap-2"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Atualizar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Estrutura de Contas</CardTitle>
          <CardDescription>
            Total de {accounts.length} contas encontradas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-4" />
              <p>Carregando plano de contas...</p>
            </div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma conta encontrada.</p>
            </div>
          ) : (
            <DataTable 
              columns={columns} 
              data={accounts} 
              filterColumn="description"
              filterPlaceholder="Filtrar por descrição..."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
