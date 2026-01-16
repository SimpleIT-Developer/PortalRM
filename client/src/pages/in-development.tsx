import { Card, CardContent } from "@/components/ui/card";
import { Hammer } from "lucide-react";

export default function InDevelopmentPage() {
  return (
    <div className="flex items-center justify-center h-[calc(100vh-200px)]">
      <Card className="w-full max-w-md mx-4 border-dashed">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-yellow-100 p-4 rounded-full dark:bg-yellow-900/30">
              <Hammer className="h-10 w-10 text-yellow-600 dark:text-yellow-500" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Módulo em Desenvolvimento</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Esta funcionalidade está sendo construída e estará disponível em breve.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
