import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export default function PlaceholderPage({ title, description, icon: Icon }: PlaceholderPageProps) {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-medium text-foreground flex items-center">
          {Icon && <Icon className="mr-2 h-6 w-6 text-primary" />}
          {title}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {description}
        </p>
      </div>

      {/* Content */}
      <Card>
        <CardHeader>
          <CardTitle>Módulo em Desenvolvimento</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Este módulo está em desenvolvimento. Em breve estará disponível com todas as funcionalidades necessárias.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}