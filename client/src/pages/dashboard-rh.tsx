import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, TrendingDown, BarChart3, PieChart, Activity } from "lucide-react";

export default function DashboardRH() {
  // Dados simulados para demonstração
  const metricsData = [
    {
      title: "Total de Funcionários",
      value: "342",
      change: "+5.2%",
      trend: "up",
      icon: Users,
      color: "text-green-600"
    },
    {
      title: "Contratações no Mês",
      value: "18",
      change: "+12.5%",
      trend: "up",
      icon: Users,
      color: "text-blue-600"
    },
    {
      title: "Taxa de Retenção",
      value: "94.8%",
      change: "+1.2%",
      trend: "up",
      icon: Activity,
      color: "text-purple-600"
    },
    {
      title: "Custo por Contratação",
      value: "R$ 3.250,00",
      change: "-8.5%",
      trend: "up",
      icon: Activity,
      color: "text-orange-600"
    }
  ];

  const rotatividade = [
    { month: "Jan", value: 3.2 },
    { month: "Fev", value: 2.8 },
    { month: "Mar", value: 3.5 },
    { month: "Abr", value: 2.5 },
    { month: "Mai", value: 2.2 },
    { month: "Jun", value: 1.8 }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center">
          <Users className="mr-3 h-8 w-8 text-primary" />
          Dashboard de RH
        </h1>
        <p className="text-muted-foreground mt-2">
          Visão geral das métricas de recursos humanos
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricsData.map((metric, index) => {
          const Icon = metric.icon;
          const TrendIcon = metric.trend === "up" ? TrendingUp : TrendingDown;
          
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {metric.title}
                    </p>
                    <p className="text-2xl font-bold text-foreground mt-2">
                      {metric.value}
                    </p>
                    <div className="flex items-center mt-2">
                      <TrendIcon className={`h-4 w-4 mr-1 ${
                        metric.trend === "up" ? "text-green-600" : "text-red-600"
                      }`} />
                      <span className={`text-sm font-medium ${
                        metric.trend === "up" ? "text-green-600" : "text-red-600"
                      }`}>
                        {metric.change}
                      </span>
                      <span className="text-sm text-muted-foreground ml-1">
                        vs mês anterior
                      </span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-full bg-muted ${metric.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rotatividade Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5 text-primary" />
              Taxa de Rotatividade - Últimos 6 Meses (%)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {rotatividade.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    {item.month}
                  </span>
                  <div className="flex items-center space-x-2 flex-1 mx-4">
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(item.value / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-bold text-foreground">
                    {item.value.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Distribuição por Departamento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="mr-2 h-5 w-5 text-primary" />
              Distribuição por Departamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Produção</span>
                <span className="text-sm font-medium">35%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: "35%" }} />
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Administrativo</span>
                <span className="text-sm font-medium">25%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: "25%" }} />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Vendas</span>
                <span className="text-sm font-medium">20%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-purple-600 h-2 rounded-full" style={{ width: "20%" }} />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">TI</span>
                <span className="text-sm font-medium">12%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-orange-600 h-2 rounded-full" style={{ width: "12%" }} />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Outros</span>
                <span className="text-sm font-medium">8%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-red-600 h-2 rounded-full" style={{ width: "8%" }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}