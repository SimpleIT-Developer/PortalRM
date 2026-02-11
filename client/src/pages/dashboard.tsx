import { useState, useEffect } from "react";
import { useLocation, Switch, Route } from "wouter";
import { AuthService, type StoredToken } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sidebar } from "@/components/navigation/sidebar";
import { menuItems } from "@/config/menu-items";
import { MobileMenuButton } from "@/components/navigation/mobile-menu-button";
import { TokenIndicator } from "@/components/ui/token-indicator";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePermissions } from "@/hooks/use-permissions";
import { 
  LogOut,
  Box,
  Home,
  Clock,
  CloudSun,
  Calendar as CalendarIcon
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { EnvironmentConfigService } from "@/lib/environment-config";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ColigadaSelector } from "@/components/coligada-selector";
import { getTenant } from "@/lib/tenant";

// Import pages
import TokenInfoPage from "./token-info";
import SolicitacaoCompras from "./solicitacao-compras";
import OrdemCompras from "./ordem-compras";
import Cotacao from "./cotacao";
import NotasFiscaisProdutos from "./notas-fiscais-produtos";
import NotasFiscaisServicos from "./notas-fiscais-servicos";
import OutrasMovimentacoes from "./outras-movimentacoes";
import NovaSolicitacaoCompras from "./nova-solicitacao-compras";
import LancamentosContasPagar from "./lancamentos-contas-pagar";
import AprovacaoBordero from "./aprovacao-bordero";
import AssistenteVirtual from "./assistente-virtual";
import AssistenteVirtualRH from "./assistente-virtual-rh";
import DashboardFinanceiro from "./dashboard-financeiro";
import DashboardCompras from "./dashboard-compras";
import DashboardRH from "./dashboard-rh";
import CadastroFuncionarios from "./cadastro-funcionarios";
import FiliaisPage from "./filiais";
import PlanoContasPage from "./plano-contas";
import NaturezaOrcamentariaPage from "./natureza-orcamentaria";
import CentroCustoPage from "./centro-custo";
import LotesContabeis from "./lotes-contabeis";
import LancamentosContabeis from "./lancamentos-contabeis";
import BalancetePage from "./balancete";
import RazaoPage from "./razao";
import FluxoCaixaPage from "./fluxo-caixa";
import ImportacaoXmlPage from "./importacao-xml";
import ProdutosPage from "./produtos";
import ServicosPage from "./servicos";
import LoginLogPage from "./admin/login-log";
import LancamentosContasReceber from "./lancamentos-contas-receber";
import MovimentacaoBancaria from "./movimentacao-bancaria";
import ConciliacaoBancaria from "./conciliacao-bancaria";
import ConciliationLogsPage from "./conciliation-logs";
import ContasCaixas from "./contas-caixas";

// Import SimpleDFe pages
import SimpleDfeDashboard from "./simpledfe/dashboard";
import SimpleDfeCompanies from "./simpledfe/companies";
import SimpleDfeNfeRecebidas from "./simpledfe/nfe-recebidas";
import SimpleDfeCteRecebidas from "./simpledfe/cte-recebidas";
import SimpleDfeNfseRecebidas from "./simpledfe/nfse-recebidas";
import SimpleDfeFornecedores from "./simpledfe/fornecedores";
import SimpleDfeRelatorios from "./simpledfe/relatorios";

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
import { ChangelogModal } from "@/components/changelog-modal";

import { MenuVisibilityService } from "@/lib/menu-visibility";

export default function DashboardPage() {
  const [location, setLocation] = useLocation();
  const [token, setToken] = useState<StoredToken | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [rmVersion, setRmVersion] = useState<string>("");
  const [currentEndpoint, setCurrentEndpoint] = useState<string>("");
  const isMobile = useIsMobile();
  const { toast } = useToast();

  // Hook para gerenciar permissões do usuário
  const { 
    hasGestaoComprasPermission,
    hasGestaoFinanceiraPermission,
    hasGestaoRHPermission,
    hasAssistenteVirtualRHPermission,
    hasAssistenteVirtualFinanceiroPermission,
    loading: permissionsLoading, 
    error: permissionsError,
    permissions,
    refetch: refetchPermissions 
  } = usePermissions(token?.username || null);

  const [selectedModuleId, setSelectedModuleId] = useState<string>("dashboard-principal");
  const [availableModules, setAvailableModules] = useState<MenuItem[]>([]);

  // Filtrar módulos disponíveis com base nas permissões e configuração do ambiente
  useEffect(() => {
    const updateModules = () => {
      const perms = {
        hasGestaoComprasPermission,
        hasGestaoFinanceiraPermission,
        hasGestaoRHPermission,
        hasAssistenteVirtualRHPermission,
        hasAssistenteVirtualFinanceiroPermission
      };
      
      const filtered = MenuVisibilityService.getVisibleItems(menuItems, perms);
      setAvailableModules(filtered);
    };

    updateModules();

    const handleUpdate = () => updateModules();
    window.addEventListener(EnvironmentConfigService.MODULES_UPDATED_EVENT, handleUpdate);
    window.addEventListener(EnvironmentConfigService.MENUS_UPDATED_EVENT, handleUpdate);
    
    return () => {
      window.removeEventListener(EnvironmentConfigService.MODULES_UPDATED_EVENT, handleUpdate);
      window.removeEventListener(EnvironmentConfigService.MENUS_UPDATED_EVENT, handleUpdate);
    };
  }, [
    hasGestaoComprasPermission,
    hasGestaoFinanceiraPermission,
    hasGestaoRHPermission,
    hasAssistenteVirtualRHPermission,
    hasAssistenteVirtualFinanceiroPermission
  ]);

  // Atualizar o módulo selecionado se o atual não estiver mais disponível (ex: perdeu permissão)
  useEffect(() => {
    const isCurrentModuleAvailable = availableModules.some(m => m.id === selectedModuleId);
    if (!isCurrentModuleAvailable && availableModules.length > 0) {
      setSelectedModuleId(availableModules[0].id);
    }
  }, [availableModules, selectedModuleId]);

  // Obter os itens do sidebar para o módulo selecionado
  // Usa availableModules para garantir que os itens exibidos no sidebar também respeitem a filtragem
  const sidebarItems = availableModules.find(m => m.id === selectedModuleId)?.children || [];

  // Debug info para o Sidebar
  const debugInfo = {
    username: token?.username,
    permissions,
    loading: permissionsLoading
  };



  // Função para buscar a versão do RM
  const fetchRmVersion = async (environmentId: string) => {
    console.log("🔄 Iniciando busca da versão do RM...");
    console.log("🔄 Ambiente recebido:", environmentId);
    
    try {
      // Verificar se o usuário está autenticado
      const token = AuthService.getStoredToken();
      console.log("🔄 Token obtido:", token ? "Sim" : "Não");
      
      if (!token || !token.access_token) {
        console.error('❌ Token não encontrado para consulta da versão do RM');
        setRmVersion("Erro: Não autenticado");
        return;
      }
      
      // Caminho da API para consulta SQL que retorna a versão do RM
      // Adicionando os parâmetros '/1/T' conforme solicitado (T = Traz colunas tipadas/formatadas)
      const path = `/api/framework/v1/consultaSQLServer/RealizaConsulta/SIT.PORTALRM.015/1/T`;
      console.log("🔗 Path da consulta:", path);
      
      // Consulta via proxy backend para evitar problemas de CORS
      console.log("🔗 Consultando versão do RM via proxy backend");
      
      // Importante: O token deve ser passado como parâmetro de consulta na URL
      const fullUrl = `/api/proxy?environmentId=${encodeURIComponent(environmentId)}&path=${encodeURIComponent(path)}&token=${encodeURIComponent(token.access_token)}`;
      console.log("🔗 URL completa da requisição:", fullUrl);
      
      // Fazer a requisição
      console.log("🔄 Iniciando requisição fetch...");
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(getTenant() ? { 'X-Tenant': getTenant()! } : {})
        }
      });

      console.log("🔄 Resposta recebida. Status:", response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro na consulta da versão do RM:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        setRmVersion(`Erro: ${response.status} ${response.statusText}`);
        return;
      }

      // Ler o corpo da resposta como texto
      console.log("🔄 Lendo corpo da resposta...");
      const responseText = await response.text();
      console.log("🔄 Texto da resposta recebido. Tamanho:", responseText.length);
      
      if (!responseText || responseText.trim() === '') {
        console.error('❌ Resposta vazia recebida');
        setRmVersion("Erro: Resposta vazia");
        return;
      }
      
      // Tentar fazer o parse do JSON
      console.log("🔄 Tentando fazer parse do JSON...");
      let data;
      try {
        data = JSON.parse(responseText);
        console.log("✅ Parse JSON bem-sucedido");
      } catch (parseError) {
        console.error('❌ Erro ao fazer parse da resposta JSON:', parseError);
        console.log('❌ Resposta recebida (não é JSON válido):', responseText.substring(0, 200) + '...');
        setRmVersion("Erro: Formato inválido");
        return;
      }
      
      console.log("🔄 Estrutura da resposta:", JSON.stringify(data).substring(0, 200) + '...');
      
      // Verificar a estrutura da resposta e extrair a versão
      // Suportar múltiplos formatos de resposta
      let dataArray = null;
      
      // Verificar diferentes estruturas possíveis
      if (data && data.data && Array.isArray(data.data)) {
        // Formato: { data: [...] }
        dataArray = data.data;
        console.log("🔄 Dados encontrados no formato data.data. Quantidade:", dataArray.length);
      } else if (Array.isArray(data)) {
        // Formato: [...]
        dataArray = data;
        console.log("🔄 Dados encontrados no formato array direto. Quantidade:", dataArray.length);
      } else if (data && typeof data === 'object') {
        // Tentar encontrar a versão diretamente no objeto
        if (data.VERSAOBASE) {
          console.log("✅ Versão do RM encontrada diretamente no objeto:", data.VERSAOBASE);
          setRmVersion(data.VERSAOBASE);
          return;
        }
        
        // Verificar se há alguma propriedade que seja um array
        const arrayProps = Object.keys(data).filter(key => Array.isArray(data[key]));
        if (arrayProps.length > 0) {
          dataArray = data[arrayProps[0]];
          console.log(`🔄 Dados encontrados no formato data.${arrayProps[0]}. Quantidade:`, dataArray.length);
        }
      }
      
      // Processar o array de dados se foi encontrado
      if (dataArray && dataArray.length > 0) {
        console.log("🔄 Primeiro item:", JSON.stringify(dataArray[0]).substring(0, 200) + '...');
        
        // Extrair a tag VERSAOBASE da resposta
        const versaoBase = dataArray[0].VERSAOBASE;
        console.log("🔄 VERSAOBASE encontrada:", versaoBase);
        
        if (versaoBase) {
          console.log("✅ Versão do RM encontrada:", versaoBase);
          setRmVersion(versaoBase);
        } else {
          // Tentar encontrar qualquer campo que possa conter a versão
          const firstItem = dataArray[0];
          const versionFields = Object.keys(firstItem).filter(key => 
            key.toLowerCase().includes('versao') || 
            key.toLowerCase().includes('version')
          );
          
          if (versionFields.length > 0) {
            const version = firstItem[versionFields[0]];
            console.log(`✅ Versão encontrada no campo ${versionFields[0]}:`, version);
            setRmVersion(version);
          } else {
            console.error('❌ Nenhum campo de versão encontrado no item');
            setRmVersion("Versão não identificada");
          }
        }
      } else {
        console.error('❌ Não foi possível encontrar dados na resposta');
        setRmVersion("Dados não disponíveis");
      }
    } catch (error) {
      console.error('❌ Erro ao buscar versão do RM:', error);
      setRmVersion("Erro: Exceção");
    }
  };

  // Função para verificar a validade do token e redirecionar se necessário
  const checkTokenValidity = () => {
    const storedToken = AuthService.getStoredToken();
    if (!storedToken) {
      setLocation("/");
      return false;
    }

    if (!AuthService.isTokenValid(storedToken)) {
      toast({
        title: "Sessão Expirada",
        description: "Seu token expirou. Faça login novamente.",
        variant: "destructive",
      });
      AuthService.clearToken();
      setLocation("/");
      return false;
    }

    setToken(storedToken);
    return true;
  };

  useEffect(() => {
    // Verificação inicial do token
    if (!checkTokenValidity()) return;
    
    // Verificar o token periodicamente a cada 30 segundos
    const tokenCheckInterval = setInterval(() => {
      checkTokenValidity();
    }, 30000);
    
    // Buscar a versão do RM
    const loadEndpointAndFetchVersion = async () => {
      try {
        const token = AuthService.getStoredToken();
        if (token && token.environmentId) {
          setCurrentEndpoint(token.environmentId);
          fetchRmVersion(token.environmentId);
        }
      } catch (error) {
        console.error('Erro ao carregar endpoint:', error);
      }
    };

    loadEndpointAndFetchVersion();
    
    return () => clearInterval(tokenCheckInterval);
  }, [setLocation, toast]);

  // Global keyboard shortcut: Esc returns to Dashboard Geral
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setLocation('/dashboard');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setLocation]);

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
      <ChangelogModal />
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <MobileMenuButton onClick={() => setMobileMenuOpen(true)} />
              <div className="h-8 w-8 bg-primary rounded flex items-center justify-center mr-3">
                <Box className="text-primary-foreground text-sm" size={16} />
              </div>
              <h1 className="text-xl font-medium text-foreground mr-6 hidden md:block">TOTVS RM</h1>
              
              <div className="mr-2 hidden md:block">
                <ColigadaSelector />
              </div>

              <div className="w-[200px] md:w-[280px]">
                <Select value={selectedModuleId} onValueChange={setSelectedModuleId}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Selecione o Módulo" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableModules.map((module) => (
                      <SelectItem key={module.id} value={module.id}>
                        <div className="flex items-center gap-2">
                          <module.icon className="h-4 w-4" />
                          <span>{module.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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

      <div className="flex flex-col min-h-[calc(100vh-4rem)]">
        <div className="flex flex-1">
          {/* Desktop Sidebar */}
          {!isMobile && (
            <Sidebar 
              className="hidden md:block h-[calc(100vh-4rem-24px)] sticky top-16" 
              items={sidebarItems}
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
            items={sidebarItems}
            hasGestaoComprasPermission={hasGestaoComprasPermission}
            hasGestaoFinanceiraPermission={hasGestaoFinanceiraPermission}
            hasGestaoRHPermission={hasGestaoRHPermission}
            hasAssistenteVirtualRHPermission={permissions?.MNULB !== 0}
            hasAssistenteVirtualFinanceiroPermission={permissions?.MNULF !== 0}
            debugInfo={debugInfo}
          />

          {/* Main Content */}
          <main className="flex-1 p-4 md:p-6 lg:p-8 pb-6">
            <DashboardContent location={location} />
          </main>
        </div>
        
        {/* Status Bar */}
        <div className="h-6 bg-card border-t border-border text-xs text-muted-foreground px-4 fixed bottom-0 left-0 right-0 z-10">
          <div className="flex justify-between items-center h-full max-w-full">
            <div className="flex items-center space-x-4">
              <span>Ambiente: {currentEndpoint || "Não configurado"}</span>
              <span>Versão RM: {rmVersion || "Carregando..."}</span>
              <span>Versão Portal: 1.0.01</span>
            </div>
            <div className="flex items-center space-x-4">
              <span>Data: {new Date().toLocaleDateString('pt-BR')}</span>
              <span>Usuário: {token?.username}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Define all valid routes and their components
const dashboardRoutes: Record<string, React.ComponentType<any> | (() => JSX.Element)> = {
  '/dashboard': DashboardHome,
  '/dashboard/token-info': TokenInfoPage,
  '/dashboard/solicitacao-compras': SolicitacaoCompras,
  '/dashboard/ordem-compras': OrdemCompras,
  '/dashboard/cotacao': Cotacao,
  '/dashboard/notas-fiscais-produtos': NotasFiscaisProdutos,
  '/dashboard/notas-fiscais-servicos': NotasFiscaisServicos,
  '/dashboard/outras-movimentacoes': OutrasMovimentacoes,
  '/dashboard/nova-solicitacao-compras': NovaSolicitacaoCompras,
  '/dashboard/importacao-xml': ImportacaoXmlPage,
  '/dashboard/produtos': ProdutosPage,
  '/dashboard/servicos': ServicosPage,
  '/dashboard/contas-caixas': ContasCaixas,
  '/dashboard/lancamentos-contas-pagar': LancamentosContasPagar,
  '/dashboard/lancamentos-contas-receber': LancamentosContasReceber,
  '/dashboard/movimentacao-bancaria': MovimentacaoBancaria,
  '/dashboard/conciliacao-bancaria': ConciliacaoBancaria,
  '/dashboard/aprovacao-bordero': AprovacaoBordero,
  '/dashboard/assistente-virtual': AssistenteVirtual,
  '/dashboard/assistente-virtual-rh': AssistenteVirtualRH,
  '/dashboard/financeiro': DashboardFinanceiro,
  '/dashboard/compras': DashboardCompras,
  '/dashboard/rh': DashboardRH,
  '/dashboard/cadastro-funcionarios': CadastroFuncionarios,
  '/dashboard/filiais': FiliaisPage,
  '/dashboard/plano-contas': PlanoContasPage,
  '/dashboard/natureza-orcamentaria': NaturezaOrcamentariaPage,
  '/dashboard/centro-custo': CentroCustoPage,
  '/dashboard/lotes-contabeis': LotesContabeis,
  '/dashboard/lancamentos-contabeis': LancamentosContabeis,
  '/dashboard/balancete': BalancetePage,
  '/dashboard/razao': RazaoPage,
  '/dashboard/fluxo-caixa': FluxoCaixaPage,
  '/dashboard/login-log': LoginLogPage,
  '/dashboard/conciliation-logs': ConciliationLogsPage,

  // Rotas SimpleDFe
  '/dashboard/simpledfe/dashboard': SimpleDfeDashboard,
  '/dashboard/simpledfe/empresas': SimpleDfeCompanies,
  '/dashboard/simpledfe/nfe-recebidas': SimpleDfeNfeRecebidas,
  '/dashboard/simpledfe/cte-recebidas': SimpleDfeCteRecebidas,
  '/dashboard/simpledfe/nfse-recebidas': SimpleDfeNfseRecebidas,
  '/dashboard/simpledfe/fornecedores': SimpleDfeFornecedores,
  '/dashboard/simpledfe/relatorios': SimpleDfeRelatorios,
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

  if (location === '/dashboard/ordem-compras' && !hasGestaoComprasPermission) {
    // Redirecionar para dashboard se não tiver permissão
    setLocation('/dashboard');
    return <DashboardHome />;
  }

  if (location === '/dashboard/cotacao' && !hasGestaoComprasPermission) {
    // Redirecionar para dashboard se não tiver permissão
    setLocation('/dashboard');
    return <DashboardHome />;
  }

  if ((location === '/dashboard/notas-fiscais-produtos' || location === '/dashboard/notas-fiscais-servicos') && !hasGestaoComprasPermission) {
    // Redirecionar para dashboard se não tiver permissão
    setLocation('/dashboard');
    return <DashboardHome />;
  }

  if (location === '/dashboard/outras-movimentacoes' && !hasGestaoComprasPermission) {
    // Redirecionar para dashboard se não tiver permissão
    setLocation('/dashboard');
    return <DashboardHome />;
  }

  if (location === '/dashboard/lancamentos-contas-pagar' && !hasGestaoFinanceiraPermission) {
    // Redirecionar para dashboard se não tiver permissão
    setLocation('/dashboard');
    return <DashboardHome />;
  }

  if (location === '/dashboard/aprovacao-bordero' && !hasGestaoFinanceiraPermission) {
    // Redirecionar para dashboard se não tiver permissão
    setLocation('/dashboard');
    return <DashboardHome />;
  }

  if (location === '/dashboard/conciliacao-bancaria' && !hasGestaoFinanceiraPermission) {
    // Redirecionar para dashboard se não tiver permissão
    setLocation('/dashboard');
    return <DashboardHome />;
  }
  
  if (location === '/dashboard/nova-solicitacao-compras' && !hasGestaoComprasPermission) {
    // Redirecionar para dashboard se não tiver permissão
    setLocation('/dashboard');
    return <DashboardHome />;
  }

  if (location === '/dashboard/importacao-xml' && !hasGestaoComprasPermission) {
    // Redirecionar para dashboard se não tiver permissão
    setLocation('/dashboard');
    return <DashboardHome />;
  }


  if ((location === '/dashboard/produtos' || location === '/dashboard/servicos') && !hasGestaoComprasPermission) {
    // Redirecionar para dashboard se não tiver permissão
    setLocation('/dashboard');
    return <DashboardHome />;
  }

  
  if (location === '/dashboard/assistente-virtual-rh' && !hasAssistenteVirtualRHPermission) {
    // Redirecionar para dashboard se não tiver permissão
    setLocation('/dashboard');
    return <DashboardHome />;
  }
  
  if (location === '/dashboard/cadastro-funcionarios' && !hasGestaoRHPermission) {
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
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());
  const token = AuthService.getStoredToken();
  const username = token?.username || "Usuário";

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center">
          <Home className="mr-3 h-8 w-8 text-primary" />
          Olá, {username}!
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Seja bem-vindo ao Portal RM. Tenha um excelente trabalho.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Date and Weather Widget */}
        <Card className="flex flex-col justify-between hover:shadow-lg transition-shadow">
            <CardHeader>
                <CardTitle className="flex items-center">
                    <CloudSun className="mr-2 h-5 w-5 text-primary" />
                    Data e Clima
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col items-center justify-center p-6">
                <div className="text-4xl font-bold text-foreground mb-2 text-center capitalize">
                    {format(currentTime, "dd 'de' MMMM", { locale: ptBR })}
                </div>
                <div className="text-xl text-muted-foreground mb-6 capitalize">
                    {format(currentTime, "EEEE", { locale: ptBR })}
                </div>
                <div className="flex items-center space-x-4 bg-muted/30 p-4 rounded-xl">
                     <CloudSun className="h-12 w-12 text-yellow-500" />
                     <div className="text-left">
                        <div className="text-3xl font-bold">25°C</div>
                        <div className="text-sm text-muted-foreground">Ensolarado</div>
                     </div>
                </div>
            </CardContent>
        </Card>

        {/* Clock Widget */}
        <Card className="flex flex-col justify-between hover:shadow-lg transition-shadow">
            <CardHeader>
                <CardTitle className="flex items-center">
                    <Clock className="mr-2 h-5 w-5 text-primary" />
                    Horário
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center p-6">
                 <div className="flex flex-col items-center">
                    <div className="text-6xl font-mono font-bold text-primary tracking-widest tabular-nums">
                        {format(currentTime, "HH:mm:ss")}
                    </div>
                 </div>
            </CardContent>
        </Card>

        {/* Calendar Widget */}
        <Card className="flex flex-col hover:shadow-lg transition-shadow h-full">
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center">
                    <CalendarIcon className="mr-2 h-5 w-5 text-primary" />
                    Calendário
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="w-full h-full flex flex-col items-center justify-center border-none shadow-none rounded-b-xl p-0"
                    locale={ptBR}
                    classNames={{
                        months: "flex w-full flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 flex-1",
                        month: "space-y-4 w-full flex flex-col flex-1",
                        table: "w-full h-full border-collapse space-y-1",
                        head_row: "flex w-full mt-2",
                        head_cell: "text-muted-foreground rounded-md w-full font-normal text-[0.8rem] flex-1",
                        row: "flex w-full mt-2 flex-1",
                        cell: "h-auto w-full text-center text-sm p-0 relative flex-1 [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                        day: cn(
                            buttonVariants({ variant: "ghost" }),
                            "h-full w-full p-0 font-normal aria-selected:opacity-100 aspect-square"
                        ),
                    }}
                />
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
