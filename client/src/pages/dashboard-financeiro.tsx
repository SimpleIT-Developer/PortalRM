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
            <Card key={index} className="bg-card border-none hover:shadow-[0_0_15px_rgba(234,179,8,0.1)] transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
                      {metric.title}
                    </p>
                    <p className="text-2xl font-bold text-white mt-2">
                      {metric.value}
                    </p>
                    <div className="flex items-center mt-2">
                      <TrendIcon className={`h-4 w-4 mr-1 ${
                        metric.trend === "up" ? "text-green-500" : "text-red-500"
                      }`} />
                      <span className={`text-sm font-medium ${
                        metric.trend === "up" ? "text-green-500" : "text-red-500"
                      }`}>
                        {metric.change}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2">vs. mês anterior</span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-full ${metric.color.replace('text-', 'bg-').replace('600', '500/10')} border border-white/5`}>
                    <Icon className={`h-6 w-6 ${metric.color === "text-green-600" ? "text-green-500" : metric.color === "text-blue-600" ? "text-blue-500" : metric.color === "text-purple-600" ? "text-purple-500" : "text-orange-500"}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <Card className="lg:col-span-2 bg-card border-none">
          <CardHeader>
            <CardTitle className="text-white">Receita Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center bg-secondary/30 rounded-lg border border-white/5">
              <BarChart3 className="h-16 w-16 text-muted-foreground/20" />
              <span className="ml-4 text-muted-foreground">Gráfico de Receita (Simulação)</span>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-card border-none">
          <CardHeader>
            <CardTitle className="text-white">Atividade Recente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start pb-4 border-b border-white/5 last:border-0 last:pb-0">
                  <div className={`mt-1 h-2 w-2 rounded-full ${
                    activity.type === "sale" ? "bg-green-500" :
                    activity.type === "customer" ? "bg-blue-500" :
                    activity.type === "payment" ? "bg-yellow-500" :
                    "bg-gray-500"
                  }`} />
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium text-white leading-none">
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
