import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building } from "lucide-react";

export default function FiliaisPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-2 mb-6">
        <Building className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Gestão de Filiais</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Filiais</CardTitle>
          <CardDescription>
            Gerencie as filiais da empresa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Building className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Módulo em Desenvolvimento</h3>
            <p className="text-muted-foreground">
              A gestão de filiais estará disponível em breve.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
