import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction } from "lucide-react";

export default function PlanoContasPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Plano de Contas</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Módulo em Desenvolvimento</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-10 space-y-4">
          <Construction className="h-16 w-16 text-muted-foreground" />
          <p className="text-muted-foreground text-center max-w-md">
            O módulo de Plano de Contas está sendo implementado. 
            Em breve você poderá visualizar e gerenciar o plano de contas por aqui.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
