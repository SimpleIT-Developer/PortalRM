import { 
  Home,
  FileText,
  DollarSign,
  ShoppingCart,
  Users,
  Building,
  Settings,
  Key,
  PieChart,
  Package,
  Box,
  Wrench,
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  Landmark,
  CheckCircle,
  Receipt,
  MessageCircle,
  Calculator,
  FileCode
} from "lucide-react";

export interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path?: string;
  children?: MenuItem[];
  inDevelopment?: boolean;
}

export const menuItems: MenuItem[] = [
  {
    id: "dashboard-principal",
    label: "Dashboards",
    icon: Home,
    children: [
      {
        id: "dashboard",
        label: "Dashboard Geral",
        icon: Home,
        path: "/dashboard",
      },
      {
        id: "dashboard-financeiro",
        label: "Dashboard Financeiro",
        icon: DollarSign,
        path: "/dashboard/financeiro",
      },
      {
        id: "dashboard-compras",
        label: "Dashboard Compras",
        icon: ShoppingCart,
        path: "/dashboard/compras",
      },
      {
        id: "dashboard-rh",
        label: "Dashboard RH",
        icon: Users,
        path: "/dashboard/rh",
      },
    ],
  },
  {
    id: "simpledfe",
    label: "SimpleDFe",
    icon: FileText,
    children: [
      {
        id: "simpledfe-dashboard",
        label: "Dashboard",
        icon: Home,
        path: "/dashboard/simpledfe/dashboard",
      },
      {
        id: "simpledfe-empresas",
        label: "Empresas",
        icon: Building,
        path: "/dashboard/simpledfe/empresas",
      },
      {
        id: "simpledfe-nfe",
        label: "NFe Recebidas",
        icon: FileText,
        path: "/dashboard/simpledfe/nfe-recebidas",
      },
      {
        id: "simpledfe-cte",
        label: "CTe Recebidas",
        icon: FileText,
        path: "/dashboard/simpledfe/cte-recebidas",
      },
      {
        id: "simpledfe-nfse",
        label: "NFSe Recebidas",
        icon: FileText,
        path: "/dashboard/simpledfe/nfse-recebidas",
      },
      {
        id: "simpledfe-fornecedores",
        label: "Fornecedores",
        icon: Users,
        path: "/dashboard/simpledfe/fornecedores",
      },
      {
        id: "simpledfe-relatorios",
        label: "Relatórios",
        icon: PieChart,
        path: "/dashboard/simpledfe/relatorios",
      },
    ],
  },
  {
    id: "gestao-compras",
    label: "Gestão de Compras",
    icon: ShoppingCart,
    children: [
      {
        id: "itens",
        label: "Itens",
        icon: Package,
        children: [
          {
            id: "produtos",
            label: "Produtos",
            icon: Box,
            path: "/dashboard/produtos",
          },
          {
            id: "servicos",
            label: "Serviços",
            icon: Wrench,
            path: "/dashboard/servicos",
          },
        ],
      },
      {
        id: "solicitacao-compras",
        label: "Solicitação de Compras",
        icon: FileText,
        path: "/dashboard/solicitacao-compras",
      },
      {
        id: "ordem-compras",
        label: "Ordem de Compras",
        icon: FileText,
        path: "/dashboard/ordem-compras",
      },
      {
        id: "cotacao",
        label: "Cotação",
        icon: FileText,
        path: "/dashboard/cotacao",
      },
      {
        id: "notas-fiscais",
        label: "Notas Fiscais",
        icon: FileText,
        children: [
          {
            id: "notas-fiscais-produtos",
            label: "Notas Fiscais de Produtos",
            icon: FileText,
            path: "/dashboard/notas-fiscais-produtos",
          },
          {
            id: "notas-fiscais-servicos",
            label: "Notas Fiscais de Serviços",
            icon: FileText,
            path: "/dashboard/notas-fiscais-servicos",
          },
        ],
      },
      {
        id: "outras-movimentacoes",
        label: "Outras Movimentações",
        icon: FileText,
        path: "/dashboard/outras-movimentacoes",
      },
      {
        id: "importacao-xml",
        label: "Importação de Arquivo XML",
        icon: FileCode,
        path: "/dashboard/importacao-xml",
      },
    ],
  },
  {
    id: "gestao-financeira",
    label: "Gestão Financeira",
    icon: DollarSign,
    children: [
      {
        id: "contas-caixas",
        label: "Contas/Caixas",
        icon: Wallet,
        path: "/dashboard/contas-caixas",
      },
      {
        id: "lancamentos-contas-pagar",
        label: "Contas a Pagar",
        icon: ArrowDownRight,
        path: "/dashboard/lancamentos-contas-pagar",
      },
      {
        id: "lancamentos-contas-receber",
        label: "Contas a Receber",
        icon: ArrowUpRight,
        path: "/dashboard/lancamentos-contas-receber",
      },
      {
        id: "movimentacao-bancaria",
        label: "Movimentação Bancária",
        icon: Landmark,
        path: "/dashboard/movimentacao-bancaria",
      },
      {
        id: "conciliacao-bancaria",
        label: "Conciliação Bancária",
        icon: CheckCircle,
        path: "/dashboard/conciliacao-bancaria",
      },
      {
        id: "fluxo-caixa",
        label: "Fluxo de Caixa",
        icon: DollarSign,
        path: "/dashboard/fluxo-caixa",
      },
      {
        id: "aprovacao-bordero",
        label: "Aprovação de Borderô",
        icon: Receipt,
        path: "/dashboard/aprovacao-bordero",
      },
      {
        id: "natureza-orcamentaria",
        label: "Natureza Orçamentária",
        icon: PieChart,
        path: "/dashboard/natureza-orcamentaria",
      },
    ],
  },
  {
    id: "gestao-contabil",
    label: "Gestão Contábil",
    icon: Calculator,
    children: [
      {
        id: "plano-contas",
        label: "Plano de Contas",
        icon: FileText,
        path: "/dashboard/plano-contas",
      },
      {
        id: "centro-custo",
        label: "Centro de Custo",
        icon: Building,
        path: "/dashboard/centro-custo",
      },
      {
        id: "lotes-contabeis",
        label: "Lotes Contábeis",
        icon: FileText,
        path: "/dashboard/lotes-contabeis",
      },
      {
        id: "lancamentos-contabeis",
        label: "Lançamentos Contábeis",
        icon: FileText,
        path: "/dashboard/lancamentos-contabeis",
      },
      {
        id: "relatorios-contabeis",
        label: "Relatórios",
        icon: FileText,
        children: [
          {
            id: "balancete",
            label: "Balancete",
            icon: FileText,
            path: "/dashboard/balancete",
          },
          {
            id: "razao",
            label: "Razão",
            icon: FileText,
            path: "/dashboard/razao",
          },
        ],
      },
    ],
  },
  {
    id: "gestao-fiscal",
    label: "Gestão Fiscal",
    icon: Building,
    children: [
      {
        id: "filiais",
        label: "Filiais",
        icon: Building,
        path: "/dashboard/filiais",
      },
    ],
  },
  {
    id: "gestao-rh",
    label: "Gestão de RH",
    icon: Users,
    children: [
      {
        id: "cadastro-funcionarios",
        label: "Cadastro de Funcionários",
        icon: Users,
        path: "/dashboard/cadastro-funcionarios",
      },
    ],
  },
  {
    id: "assistentes-virtuais",
    label: "Assistentes Virtuais",
    icon: MessageCircle,
    children: [
      {
        id: "assistente-virtual-financeiro",
        label: "Assistente Virtual - Financeiro",
        icon: MessageCircle,
        path: "/dashboard/assistente-virtual",
      },
      {
        id: "assistente-virtual-rh",
        label: "Assistente Virtual - RH",
        icon: MessageCircle,
        path: "/dashboard/assistente-virtual-rh",
      },
    ],
  },
  {
    id: "parametros",
    label: "Parâmetros",
    icon: Settings,
    children: [
      {
        id: "tenant-settings",
        label: "Configurações do Ambiente",
        icon: Settings,
        path: "/tenant-settings",
      },
      {
        id: "token-info",
        label: "Informações do Token",
        icon: Key,
        path: "/dashboard/token-info",
      },
      {
        id: "login-log",
        label: "Log de Login",
        icon: FileText,
        path: "/dashboard/login-log",
      },
      {
        id: "conciliation-logs",
        label: "Logs de Conciliação",
        icon: FileCode,
        path: "/dashboard/conciliation-logs",
      },
    ],
  },
];
