import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  ChevronDown, 
  ChevronRight,
  Globe,
  DollarSign,
  CreditCard,
  Receipt,
  Banknote,
  Wallet,
  FileText,
  ShoppingCart,
  ClipboardList,
  Package,
  Truck,
  Settings,
  Key,
  Menu,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path?: string;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    id: "globais",
    label: "Globais",
    icon: Globe,
    path: "/dashboard/globais",
  },
  {
    id: "financeira",
    label: "Gestão Financeira",
    icon: DollarSign,
    children: [
      {
        id: "contas-pagar",
        label: "Contas a Pagar",
        icon: CreditCard,
        children: [
          {
            id: "lancamentos-pagar",
            label: "Lançamentos",
            icon: Receipt,
            path: "/dashboard/financeira/contas-pagar/lancamentos",
          },
        ],
      },
      {
        id: "contas-receber",
        label: "Contas a Receber",
        icon: Banknote,
        children: [
          {
            id: "lancamentos-receber",
            label: "Lançamentos",
            icon: Receipt,
            path: "/dashboard/financeira/contas-receber/lancamentos",
          },
        ],
      },
      {
        id: "movimentacao-bancaria",
        label: "Movimentação Bancária",
        icon: Wallet,
        children: [
          {
            id: "conta-caixa",
            label: "Conta/Caixa",
            icon: Wallet,
            path: "/dashboard/financeira/movimentacao-bancaria/conta-caixa",
          },
          {
            id: "extrato-caixa",
            label: "Extrato de Caixa",
            icon: FileText,
            path: "/dashboard/financeira/movimentacao-bancaria/extrato-caixa",
          },
        ],
      },
    ],
  },
  {
    id: "compras-faturamento",
    label: "Compras e Faturamento",
    icon: ShoppingCart,
    children: [
      {
        id: "compras",
        label: "Compras",
        icon: ShoppingCart,
        children: [
          {
            id: "solicitacao-compras",
            label: "Solicitação de Compras",
            icon: ClipboardList,
            path: "/dashboard/compras-faturamento/compras/solicitacao-compras",
          },
          {
            id: "ordem-compras",
            label: "Ordem de Compras",
            icon: FileText,
            path: "/dashboard/compras-faturamento/compras/ordem-compras",
          },
          {
            id: "recebimento-materiais",
            label: "Recebimento de Materiais",
            icon: Package,
            path: "/dashboard/compras-faturamento/compras/recebimento-materiais",
          },
          {
            id: "aquisicao-servicos",
            label: "Aquisição de Serviços",
            icon: Truck,
            path: "/dashboard/compras-faturamento/compras/aquisicao-servicos",
          },
        ],
      },
      {
        id: "faturamento",
        label: "Faturamento",
        icon: Receipt,
        children: [
          {
            id: "pedido-venda",
            label: "Pedido de Venda",
            icon: ClipboardList,
            path: "/dashboard/compras-faturamento/faturamento/pedido-venda",
          },
          {
            id: "faturamento-vendas",
            label: "Faturamento",
            icon: Receipt,
            path: "/dashboard/compras-faturamento/faturamento/faturamento",
          },
        ],
      },
    ],
  },
  {
    id: "parametros",
    label: "Parâmetros",
    icon: Settings,
    children: [
      {
        id: "informacoes-token",
        label: "Informações do Token",
        icon: Key,
        path: "/dashboard/parametros/token-info",
      },
    ],
  },
];

interface SidebarProps {
  className?: string;
  isMobile?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ className, isMobile = false, isOpen = true, onClose }: SidebarProps) {
  const [location] = useLocation();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(["financeira", "compras-faturamento", "parametros"]));

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const isExpanded = expandedItems.has(item.id);
    const hasChildren = item.children && item.children.length > 0;
    const isActive = item.path === location;
    const Icon = item.icon;

    return (
      <div key={item.id} className="w-full">
        {item.path ? (
          <Link href={item.path}>
            <Button
              variant={isActive ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start text-left h-auto py-2 px-3",
                level === 1 && "ml-4 pl-4",
                level === 2 && "ml-8 pl-6", 
                level >= 3 && "ml-12 pl-8",
                "hover:bg-muted/50"
              )}
              onClick={() => isMobile && onClose?.()}
            >
              <Icon className="mr-2 h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Button>
          </Link>
        ) : (
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-between text-left h-auto py-2 px-3",
              level === 1 && "ml-4 pl-4",
              level === 2 && "ml-8 pl-6", 
              level >= 3 && "ml-12 pl-8",
              "hover:bg-muted/50"
            )}
            onClick={() => toggleExpanded(item.id)}
          >
            <div className="flex items-center">
              <Icon className="mr-2 h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </div>
            {hasChildren && (
              isExpanded ? (
                <ChevronDown className="h-4 w-4 shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0" />
              )
            )}
          </Button>
        )}
        
        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.children!.map((child) => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Menu Principal</h2>
          {isMobile && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Menu Items */}
      <ScrollArea className="flex-1 p-2">
        <div className="space-y-1">
          {menuItems.map((item) => renderMenuItem(item))}
        </div>
      </ScrollArea>
    </div>
  );

  if (isMobile) {
    return isOpen ? (
      <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
        <div className="fixed inset-y-0 left-0 w-72 bg-card border-r border-border shadow-lg">
          {sidebarContent}
        </div>
        <div className="fixed inset-0" onClick={onClose} />
      </div>
    ) : null;
  }

  return (
    <div className={cn("w-64 bg-card border-r border-border", className)}>
      {sidebarContent}
    </div>
  );
}