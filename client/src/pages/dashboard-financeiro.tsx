import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, BarChart3, PieChart, Activity } from "lucide-react";

export default function DashboardFinanceiro() {
  // Dados simulados para demonstração
  const metricsData = [
    {
      title: "Receita Total",
      value: "R$ 125.430,00",
      change: "+12.5%",
      trend: "up",
      icon: DollarSign,
      color: "text-green-600"
    },
    {
      title: "Contas a Pagar",
      value: "R$ 45.230,00",
      change: "+5.2%",
      trend: "up",
      icon: DollarSign,
      color: "text-blue-600"
    },
    {
      title: "Contas a Receber",
      value: "R$ 78.450,00",
      change: "+8.7%",
      trend: "up",
      icon: DollarSign,
      color: "text-purple-600"
    },
    {
      title: "Fluxo de Caixa",
      value: "R$ 33.220,00",
      change: "-2.1%",
      trend: "down",
      icon: Activity,
      color: "text-orange-600"
    }
  ];

  const fluxoCaixaData = [
    { month: "Jan", value: 45000 },
    { month: "Fev", value: 52000 },
    { month: "Mar", value: 48000 },
    { month: "Abr", value: 61000 },
    { month: "Mai", value: 55000 },
    { month: "Jun", value: 67000 }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center">
          <DollarSign className="mr-3 h-8 w-8 text-primary" />
          Dashboard Financeiro
        </h1>
        <p className="text-muted-foreground mt-2">
          Visão geral das métricas financeiras da empresa
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
        {/* Fluxo de Caixa Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5 text-primary" />
              Fluxo de Caixa - Últimos 6 Meses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {fluxoCaixaData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    {item.month}
                  </span>
                  <div className="flex items-center space-x-2 flex-1 mx-4">
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(item.value / 70000) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-bold text-foreground">
                    R$ {(item.value / 1000).toFixed(0)}k
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Distribuição de Despesas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="mr-2 h-5 w-5 text-primary" />
              Distribuição de Despesas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Operacionais</span>
                <span className="text-sm font-medium">45%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: "45%" }} />
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Administrativas</span>
                <span className="text-sm font-medium">30%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: "30%" }} />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Financeiras</span>
                <span className="text-sm font-medium">15%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-purple-600 h-2 rounded-full" style={{ width: "15%" }} />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Outras</span>
                <span className="text-sm font-medium">10%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-orange-600 h-2 rounded-full" style={{ width: "10%" }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}