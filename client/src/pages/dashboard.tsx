import { useState, useEffect } from "react";
import { useLocation, Switch, Route } from "wouter";
import { AuthService, type StoredToken } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sidebar } from "@/components/navigation/sidebar";
import { MobileMenuButton } from "@/components/navigation/mobile-menu-button";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  LogOut,
  Box,
  Home
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Import pages
import TokenInfoPage from "./token-info";
import GlobaisPage from "./globais";
import PlaceholderPage from "./placeholder";

// Import icons for placeholder pages
import { 
  CreditCard, 
  Banknote, 
  Wallet, 
  FileText, 
  ShoppingCart, 
  ClipboardList, 
  Package, 
  Truck, 
  Receipt 
} from "lucide-react";

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState<StoredToken | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const { toast } = useToast();

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

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
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
          <Sidebar className="hidden md:block" />
        )}

        {/* Mobile Sidebar */}
        <Sidebar 
          isMobile 
          isOpen={mobileMenuOpen} 
          onClose={() => setMobileMenuOpen(false)} 
        />

        {/* Main Content */}
        <main className="flex-1 p-6">
          <Switch>
            <Route path="/dashboard" exact component={DashboardHome} />
            <Route path="/dashboard/parametros/token-info" component={TokenInfoPage} />
            <Route path="/dashboard/globais" component={GlobaisPage} />
            
            {/* Financeira routes */}
            <Route path="/dashboard/financeira/contas-pagar/lancamentos">
              <PlaceholderPage
                title="Lançamentos - Contas a Pagar"
                description="Gerencie os lançamentos de contas a pagar"
                icon={CreditCard}
              />
            </Route>
            <Route path="/dashboard/financeira/contas-receber/lancamentos">
              <PlaceholderPage
                title="Lançamentos - Contas a Receber"
                description="Gerencie os lançamentos de contas a receber"
                icon={Banknote}
              />
            </Route>
            <Route path="/dashboard/financeira/movimentacao-bancaria/conta-caixa">
              <PlaceholderPage
                title="Conta/Caixa"
                description="Controle de contas e caixas bancárias"
                icon={Wallet}
              />
            </Route>
            <Route path="/dashboard/financeira/movimentacao-bancaria/extrato-caixa">
              <PlaceholderPage
                title="Extrato de Caixa"
                description="Visualize extratos de movimentação de caixa"
                icon={FileText}
              />
            </Route>

            {/* Compras routes */}
            <Route path="/dashboard/compras-faturamento/compras/solicitacao-compras">
              <PlaceholderPage
                title="Solicitação de Compras"
                description="Gerencie solicitações de compras"
                icon={ClipboardList}
              />
            </Route>
            <Route path="/dashboard/compras-faturamento/compras/ordem-compras">
              <PlaceholderPage
                title="Ordem de Compras"
                description="Controle de ordens de compras"
                icon={FileText}
              />
            </Route>
            <Route path="/dashboard/compras-faturamento/compras/recebimento-materiais">
              <PlaceholderPage
                title="Recebimento de Materiais"
                description="Controle de recebimento de materiais"
                icon={Package}
              />
            </Route>
            <Route path="/dashboard/compras-faturamento/compras/aquisicao-servicos">
              <PlaceholderPage
                title="Aquisição de Serviços"
                description="Gerencie aquisições de serviços"
                icon={Truck}
              />
            </Route>

            {/* Faturamento routes */}
            <Route path="/dashboard/compras-faturamento/faturamento/pedido-venda">
              <PlaceholderPage
                title="Pedido de Venda"
                description="Gerencie pedidos de venda"
                icon={ClipboardList}
              />
            </Route>
            <Route path="/dashboard/compras-faturamento/faturamento/faturamento">
              <PlaceholderPage
                title="Faturamento"
                description="Controle de faturamento"
                icon={Receipt}
              />
            </Route>

            {/* Default fallback for any unmatched dashboard route */}
            <Route>
              <PlaceholderPage
                title="Funcionalidade em Desenvolvimento"
                description="Esta funcionalidade está sendo desenvolvida"
                icon={Home}
              />
            </Route>
          </Switch>
        </main>
      </div>
    </div>
  );
}

function DashboardHome() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-medium text-foreground flex items-center">
          <Home className="mr-2 h-6 w-6 text-primary" />
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Bem-vindo ao sistema TOTVS RM
        </p>
      </div>

      {/* Welcome Card */}
      <Card>
        <CardHeader>
          <CardTitle>Bem-vindo ao TOTVS RM</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Utilize o menu lateral para navegar pelos módulos do sistema. Você pode acessar as funcionalidades de:
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
            <li>Configurações Globais</li>
            <li>Gestão Financeira (Contas a Pagar, Contas a Receber, Movimentação Bancária)</li>
            <li>Gestão de Compras e Faturamento</li>
            <li>Parâmetros do Sistema</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
