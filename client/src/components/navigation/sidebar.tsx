import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Home,
  Menu,
  X,
  Settings,
  Key,
  ShoppingCart,
  FileText,
  DollarSign,
  Receipt,
  MessageCircle
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
    id: "dashboard",
    label: "Dashboard",
    icon: Home,
    path: "/dashboard",
  },
  {
    id: "gestao-compras",
    label: "Gestão de Compras",
    icon: ShoppingCart,
    children: [
      {
        id: "solicitacao-compras",
        label: "Solicitação de Compras",
        icon: FileText,
        path: "/dashboard/solicitacao-compras",
      },
    ],
  },
  {
    id: "gestao-financeira",
    label: "Gestão Financeira",
    icon: DollarSign,
    children: [
      {
        id: "lancamentos-contas-pagar",
        label: "Contas a Pagar",
        icon: Receipt,
        path: "/dashboard/lancamentos-contas-pagar",
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
        id: "token-info",
        label: "Informações do Token",
        icon: Key,
        path: "/dashboard/token-info",
      },
    ],
  },
];

interface SidebarProps {
  className?: string;
  isMobile?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  hasGestaoComprasPermission?: boolean;
  hasGestaoFinanceiraPermission?: boolean;
  debugInfo?: {
    username?: string;
    permissions?: any;
    loading?: boolean;
  };
}

export function Sidebar({ 
  className, 
  isMobile = false, 
  isOpen = true, 
  onClose,
  hasGestaoComprasPermission = false,
  hasGestaoFinanceiraPermission = false,
  debugInfo
}: SidebarProps) {
  const [location] = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpanded = (itemId: string) => {
    // Se for o menu de Gestão de Compras e não tiver permissão, não permitir expansão
    if (itemId === 'gestao-compras' && !hasGestaoComprasPermission) {
      return;
    }
    
    // Se for o menu de Gestão Financeira e não tiver permissão, não permitir expansão
    if (itemId === 'gestao-financeira' && !hasGestaoFinanceiraPermission) {
      return;
    }
    
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId) 
        : [...prev, itemId]
    );
  };

  const renderMenuItem = (item: MenuItem) => {
    const isActive = item.path === location;
    const Icon = item.icon;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.id);
    
    // Verificar se o item está desabilitado por falta de permissão
    const isDisabled = (item.id === 'gestao-compras' && !hasGestaoComprasPermission) ||
                      (item.id === 'gestao-financeira' && !hasGestaoFinanceiraPermission);

    if (hasChildren) {
      return (
        <div key={item.id} className="w-full">
          <Button
            variant="ghost"
            disabled={isDisabled}
            className={cn(
              "w-full justify-start text-left h-auto py-2.5 px-4",
              isDisabled 
                ? "opacity-50 cursor-not-allowed text-muted-foreground" 
                : "hover:bg-muted/50"
            )}
            onClick={() => toggleExpanded(item.id)}
          >
            <Icon className={cn("mr-2.5 h-4 w-4 shrink-0", isDisabled && "opacity-50")} />
            <span className="truncate text-sm">{item.label}</span>
            {!isDisabled && (
              <span className="ml-auto">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={cn("transition-transform", isExpanded ? "rotate-180" : "")}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </span>
            )}
            {isDisabled && (
              <span className="ml-auto text-xs text-muted-foreground">🔒</span>
            )}
          </Button>
          {isExpanded && item.children && !isDisabled && (
            <div className="pl-5 mt-2 space-y-2">
              {item.children.map(child => {
                const isChildActive = child.path === location;
                const ChildIcon = child.icon;
                const hasGrandchildren = child.children && child.children.length > 0;
                const isChildExpanded = expandedItems.includes(child.id);
                
                if (hasGrandchildren) {
                  return (
                    <div key={child.id} className="w-full">
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start text-left h-auto py-2.5 px-4",
                          "hover:bg-muted/50"
                        )}
                        onClick={() => toggleExpanded(child.id)}
                      >
                        <ChildIcon className="mr-2.5 h-4 w-4 shrink-0" />
                        <span className="truncate text-sm">{child.label}</span>
                        <span className="ml-auto">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={cn("transition-transform", isChildExpanded ? "rotate-180" : "")}
                          >
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </span>
                      </Button>
                      {isChildExpanded && child.children && (
                        <div className="pl-5 mt-2 space-y-2">
                          {child.children.map(grandchild => {
                            const isGrandchildActive = grandchild.path === location;
                            const GrandchildIcon = grandchild.icon;
                            
                            return (
                              <Link key={grandchild.id} href={grandchild.path!}>
                                <Button
                                  variant={isGrandchildActive ? "secondary" : "ghost"}
                                  className={cn(
                                    "w-full justify-start text-left h-auto py-2.5 px-4",
                                    "hover:bg-muted/50"
                                  )}
                                  onClick={() => isMobile && onClose?.()}
                                >
                                  <GrandchildIcon className="mr-2.5 h-4 w-4 shrink-0" />
                                  <span className="truncate text-sm">{grandchild.label}</span>
                                </Button>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }
                
                return (
                  <Link key={child.id} href={child.path!}>
                    <Button
                      variant={isChildActive ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start text-left h-auto py-2.5 px-4",
                        "hover:bg-muted/50"
                      )}
                      onClick={() => isMobile && onClose?.()}
                    >
                      <ChildIcon className="mr-2.5 h-4 w-4 shrink-0" />
                      <span className="truncate text-sm">{child.label}</span>
                    </Button>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    return (
      <div key={item.id} className="w-full">
        {isDisabled ? (
          <Button
            variant="ghost"
            disabled
            className={cn(
              "w-full justify-start text-left h-auto py-2.5 px-4",
              "opacity-50 cursor-not-allowed text-muted-foreground"
            )}
          >
            <Icon className="mr-2.5 h-4 w-4 shrink-0 opacity-50" />
            <span className="truncate text-sm">{item.label}</span>
            <span className="ml-auto text-xs">🔒</span>
          </Button>
        ) : (
          <Link href={item.path!}>
            <Button
              variant={isActive ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start text-left h-auto py-2.5 px-4",
                "hover:bg-muted/50"
              )}
              onClick={() => isMobile && onClose?.()}
            >
              <Icon className="mr-2.5 h-4 w-4 shrink-0" />
              <span className="truncate text-sm">{item.label}</span>
            </Button>
          </Link>
        )}
      </div>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Portal RM</h2>
          {isMobile && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Menu Items */}
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-2">
          {menuItems.map((item) => renderMenuItem(item))}
        </div>
      </ScrollArea>
    </div>
  );

  if (isMobile) {
    return isOpen ? (
      <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
        <div className="fixed inset-y-0 left-0 w-80 bg-card border-r border-border shadow-lg">
          {sidebarContent}
        </div>
        <div className="fixed inset-0" onClick={onClose} />
      </div>
    ) : null;
  }

  return (
    <div className={cn("w-72 bg-card border-r border-border", className)}>
      {sidebarContent}
    </div>
  );
}