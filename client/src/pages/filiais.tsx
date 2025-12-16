import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Building, RefreshCw, Loader2 } from "lucide-react";
import { BranchesService, Branch } from "@/lib/branches";
import { useToast } from "@/hooks/use-toast";

export default function FiliaisPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchBranches = async () => {
    setIsLoading(true);
    try {
      const data = await BranchesService.getBranches();
      setBranches(data);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar filiais",
        description: "Não foi possível obter a lista de filiais. Tente novamente.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCNPJ = (cnpj: string | undefined) => {
    if (!cnpj) return '-';
    
    // Remove caracteres não numéricos
    const numbers = cnpj.replace(/\D/g, '');
    
    // Verifica se tem 14 dígitos
    if (numbers.length !== 14) return cnpj;
    
    // Formata: XX.XXX.XXX/0001-XX
    return numbers.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Building className="h-8 w-8 text-primary" />
            Gestão de Filiais
          </h1>
          <p className="text-muted-foreground mt-2">
            Visualize e gerencie as filiais da sua empresa.
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchBranches} 
          disabled={isLoading}
          className="gap-2"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Atualizar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listagem de Filiais</CardTitle>
          <CardDescription>
            Total de {branches.length} filiais encontradas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-4" />
              <p>Carregando dados das filiais...</p>
            </div>
          ) : branches.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma filial encontrada.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Coligada</TableHead>
                    <TableHead className="w-[100px]">Código</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Nome Fantasia</TableHead>
                    <TableHead>CNPJ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {branches.map((branch) => (
                    <TableRow key={`${branch.CompanyCode}-${branch.Code}`}>
                      <TableCell className="font-medium">{branch.CompanyCode}</TableCell>
                      <TableCell>{branch.Code}</TableCell>
                      <TableCell>{branch.Description}</TableCell>
                      <TableCell>{branch.Title || '-'}</TableCell>
                      <TableCell>{formatCNPJ(branch.CGC)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
