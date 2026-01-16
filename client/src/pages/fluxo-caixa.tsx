import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";

export default function FluxoCaixaPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-2 mb-6">
        <DollarSign className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold">Fluxo de Caixa</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Visão de Fluxo de Caixa</CardTitle>
          <CardDescription>
            Em breve você poderá acompanhar o fluxo de entradas e saídas de caixa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <DollarSign className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
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

