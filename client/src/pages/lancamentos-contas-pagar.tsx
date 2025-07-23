import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Receipt } from "lucide-react";

export default function LancamentosContasPagar() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-2 mb-6">
        <Receipt className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Contas a Pagar</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Gestão de Contas a Pagar</CardTitle>
          <CardDescription>
            Gerencie e acompanhe as contas a pagar da empresa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Receipt className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Módulo em Desenvolvimento</h3>
            <p className="text-muted-foreground">
              Esta funcionalidade está sendo desenvolvida e estará disponível em breve.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}