import { Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function GlobaisPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-medium text-foreground flex items-center">
          <Globe className="mr-2 h-6 w-6 text-primary" />
          Globais
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configurações e funcionalidades globais do sistema
        </p>
      </div>

      {/* Content */}
      <Card>
        <CardHeader>
          <CardTitle>Funcionalidade em Desenvolvimento</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Esta funcionalidade está em desenvolvimento. Em breve estará disponível com todas as configurações globais do sistema.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}