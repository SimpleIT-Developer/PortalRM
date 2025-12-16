import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Activity,
  ShoppingCart,
  Users
} from "lucide-react";

export default function DashboardFinanceiro() {
  // Dados simulados para demonstração (anteriormente no Dashboard Geral)
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
      title: "Vendas do Mês",
      value: "1.234",
      change: "+8.2%",
      trend: "up",
      icon: ShoppingCart,
      color: "text-blue-600"
    },
    {
      title: "Clientes Ativos",
      value: "856",
      change: "+5.1%",
      trend: "up",
      icon: Users,
      color: "text-purple-600"
    },
    {
      title: "Taxa de Conversão",
      value: "3.2%",
      change: "-2.1%",
      trend: "down",
      icon: Activity,
      color: "text-orange-600"
    }
  ];

  const salesData = [
    { month: "Jan", value: 45000 },
    { month: "Fev", value: 52000 },
    { month: "Mar", value: 48000 },
    { month: "Abr", value: 61000 },
    { month: "Mai", value: 55000 },
    { month: "Jun", value: 67000 }
  ];

  const recentActivities = [
    { id: 1, action: "Nova venda realizada", time: "2 min atrás", type: "sale" },
    { id: 2, action: "Cliente cadastrado", time: "15 min atrás", type: "customer" },
    { id: 3, action: "Pagamento recebido", time: "1 hora atrás", type: "payment" },
    { id: 4, action: "Produto atualizado", time: "2 horas atrás", type: "product" },
    { id: 5, action: "Relatório gerado", time: "3 horas atrás", type: "report" }
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
        {/* Sales Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5 text-primary" />
              Vendas dos Últimos 6 Meses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {salesData.map((item, index) => (
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

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="mr-2 h-5 w-5 text-primary" />
              Atividades Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {activity.action}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="mr-2 h-5 w-5 text-primary" />
              Distribuição de Vendas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Produtos</span>
                <span className="text-sm font-medium">65%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: "65%" }} />
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Serviços</span>
                <span className="text-sm font-medium">35%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: "35%" }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Metas do Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Vendas</span>
                  <span className="text-sm font-medium">78%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: "78%" }} />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Receita</span>
                  <span className="text-sm font-medium">92%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: "92%" }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumo Financeiro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
               <div className="flex justify-between border-b pb-2">
                 <span className="text-sm text-muted-foreground">Entradas</span>
                 <span className="text-sm font-medium text-green-600">+ R$ 145.000</span>
               </div>
               <div className="flex justify-between border-b pb-2">
                 <span className="text-sm text-muted-foreground">Saídas</span>
                 <span className="text-sm font-medium text-red-600">- R$ 85.000</span>
               </div>
               <div className="flex justify-between pt-2">
                 <span className="text-sm font-bold">Saldo</span>
                 <span className="text-sm font-bold text-primary">R$ 60.000</span>
               </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
