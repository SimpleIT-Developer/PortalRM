import { useState, useEffect } from "react";
import { useLocation, Switch, Route } from "wouter";
import { AuthService, type StoredToken } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sidebar } from "@/components/navigation/sidebar";
import { MobileMenuButton } from "@/components/navigation/mobile-menu-button";
import { TokenIndicator } from "@/components/ui/token-indicator";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePermissions } from "@/hooks/use-permissions";
import { 
  LogOut,
  Box,
  Home
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Import pages
import TokenInfoPage from "./token-info";
import SolicitacaoCompras from "./solicitacao-compras";
import NovaSolicitacaoCompras from "./nova-solicitacao-compras";
import LancamentosContasPagar from "./lancamentos-contas-pagar";
import AssistenteVirtual from "./assistente-virtual";
import AssistenteVirtualRH from "./assistente-virtual-rh";
import DashboardFinanceiro from "./dashboard-financeiro";
import DashboardCompras from "./dashboard-compras";
import DashboardRH from "./dashboard-rh";

// Import icons for dashboard cards
import { 
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  ShoppingCart,
  BarChart3,
  PieChart,
  Activity
} from "lucide-react";

export default function DashboardPage() {
  const [location, setLocation] = useLocation();
  const [token, setToken] = useState<StoredToken | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const { toast } = useToast();

  // Hook para gerenciar permissões do usuário
  const { 
    hasGestaoComprasPermission,
    hasGestaoFinanceiraPermission,
    hasGestaoRHPermission,
    loading: permissionsLoading, 
    error: permissionsError,
    permissions,
    refetch: refetchPermissions 
  } = usePermissions(token?.username || null);

  // Debug info para o Sidebar
  const debugInfo = {
    username: token?.username,
    permissions,
    loading: permissionsLoading
  };



  useEffect(() => {
    const storedToken = AuthService.getStoredToken();
    if (!storedToken) {
      setLocation("/");
      return;
    }

    if (!AuthService.isTokenValid(storedToken)) {
      toast({
        title: "Sessão Expirada",
        description: "Seu token expirou. Faça login novamente.",
        variant: "destructive",
      });
      AuthService.clearToken();
      setLocation("/");
      return;
    }

    setToken(storedToken);
  }, [setLocation, toast]);

  const handleLogout = () => {
    AuthService.clearToken();
    setLocation("/");
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso.",
    });
  };

  const handleTokenRefresh = (newToken: StoredToken) => {
    setToken(newToken);
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Mostrar loading enquanto carrega as permissões
  if (permissionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando permissões...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <MobileMenuButton onClick={() => setMobileMenuOpen(true)} />
              <div className="h-8 w-8 bg-primary rounded flex items-center justify-center mr-3">
                <Box className="text-primary-foreground text-sm" size={16} />
              </div>
              <h1 className="text-xl font-medium text-foreground">TOTVS RM</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-muted-foreground hidden sm:block">
                <span>Bem-vindo, </span>
                <span className="font-medium text-foreground">{token.username}</span>
              </div>
              <TokenIndicator token={token} onTokenRefresh={handleTokenRefresh} />
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        {!isMobile && (
          <Sidebar 
            className="hidden md:block h-[calc(100vh-4rem)] sticky top-16" 
            hasGestaoComprasPermission={hasGestaoComprasPermission}
            hasGestaoFinanceiraPermission={hasGestaoFinanceiraPermission}
            hasGestaoRHPermission={hasGestaoRHPermission}
            hasAssistenteVirtualRHPermission={permissions?.MNULB !== 0}
            hasAssistenteVirtualFinanceiroPermission={permissions?.MNULF !== 0}
            debugInfo={debugInfo}
          />
        )}

        {/* Mobile Sidebar */}
        <Sidebar
          isMobile
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          hasGestaoComprasPermission={hasGestaoComprasPermission}
          hasGestaoFinanceiraPermission={hasGestaoFinanceiraPermission}
          hasGestaoRHPermission={hasGestaoRHPermission}
          hasAssistenteVirtualRHPermission={permissions?.MNULB !== 0}
          hasAssistenteVirtualFinanceiroPermission={permissions?.MNULF !== 0}
          debugInfo={debugInfo}
        />

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <DashboardContent location={location} />
        </main>
      </div>
    </div>
  );
}

// Define all valid routes and their components
const dashboardRoutes: Record<string, React.ComponentType<any> | (() => JSX.Element)> = {
  '/dashboard': DashboardHome,
  '/dashboard/token-info': TokenInfoPage,
  '/dashboard/solicitacao-compras': SolicitacaoCompras,
  '/dashboard/nova-solicitacao-compras': NovaSolicitacaoCompras,
  '/dashboard/lancamentos-contas-pagar': LancamentosContasPagar,
  '/dashboard/assistente-virtual': AssistenteVirtual,
  '/dashboard/assistente-virtual-rh': AssistenteVirtualRH,
  '/dashboard/financeiro': DashboardFinanceiro,
  '/dashboard/compras': DashboardCompras,
  '/dashboard/rh': DashboardRH,
};

// Router component that handles all dashboard routes
function DashboardContent({ location }: { location: string }) {
  const [, setLocation] = useLocation();
  const token = AuthService.getStoredToken();
  const { 
    hasGestaoComprasPermission, 
    hasGestaoFinanceiraPermission,
    hasGestaoRHPermission,
    hasAssistenteVirtualRHPermission,
    hasAssistenteVirtualFinanceiroPermission
  } = usePermissions(token?.username || null);

  // Verificar permissões para rotas protegidas
  if (location === '/dashboard/solicitacao-compras' && !hasGestaoComprasPermission) {
    // Redirecionar para dashboard se não tiver permissão
    setLocation('/dashboard');
    return <DashboardHome />;
  }

  if (location === '/dashboard/lancamentos-contas-pagar' && !hasGestaoFinanceiraPermission) {
    // Redirecionar para dashboard se não tiver permissão
    setLocation('/dashboard');
    return <DashboardHome />;
  }
  
  if (location === '/dashboard/nova-solicitacao-compras' && !hasGestaoComprasPermission) {
    // Redirecionar para dashboard se não tiver permissão
    setLocation('/dashboard');
    return <DashboardHome />;
  }
  
  if (location === '/dashboard/assistente-virtual-rh' && !hasAssistenteVirtualRHPermission) {
    // Redirecionar para dashboard se não tiver permissão
    setLocation('/dashboard');
    return <DashboardHome />;
  }
  
  // Removida verificação de permissão para o Assistente Virtual - Financeiro
  // Agora o chat abre independentemente do valor de MNULF

  // Render the appropriate component based on the current location
  const Component = dashboardRoutes[location] || dashboardRoutes['/dashboard'];
  return <Component />;
}

function DashboardHome() {
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
          <Home className="mr-3 h-8 w-8 text-primary" />
          Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">
          Visão geral do seu negócio e métricas importantes
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
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Receita Bruta</span>
                <span className="text-sm font-medium text-green-600">R$ 125.430</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Despesas</span>
                <span className="text-sm font-medium text-red-600">R$ 45.230</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Lucro Líquido</span>
                  <span className="text-sm font-bold text-green-600">R$ 80.200</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
