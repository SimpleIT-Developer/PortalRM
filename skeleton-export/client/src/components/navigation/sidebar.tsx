import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  MessageCircle,
  Users,
  Building,
  Calculator,
  PieChart,
  ChevronLeft,
  ChevronRight,
  FileCode,
  Package,
  Box,
  Wrench,
  Landmark,
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EnvironmentConfigService } from "@/lib/environment-config";
import { MenuVisibilityService } from "@/lib/menu-visibility";

import { menuItems, MenuItem } from "@/config/menu-items";

export function Sidebar({ 
  className, 
  isMobile = false, 
  isOpen = true, 
  onClose,
  hasGestaoComprasPermission = false,
  hasGestaoFinanceiraPermission = false,
  hasGestaoRHPermission = false,
  hasAssistenteVirtualRHPermission = false,
  hasAssistenteVirtualFinanceiroPermission = false,
  items,
  debugInfo
}: SidebarProps) {
  const [location] = useLocation();
  // Recuperar estado expandido do sessionStorage
  const [expandedItems, setExpandedItems] = useState<string[]>(() => {
    try {
      // Ao acessar o sistema, todos os menus iniciam fechados
      // Limpar qualquer estado salvo anteriormente
      sessionStorage.removeItem('sidebar-expanded-items');
      return [];
    } catch {
      return [];
    }
  });
  const [isToggling, setIsToggling] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem('sidebar-collapsed');
      return saved === 'true';
    } catch {
      return false;
    }
  });

  const [visibleItems, setVisibleItems] = useState<MenuItem[]>([]);

  // Salvar estado expandido no sessionStorage sempre que mudar
  useEffect(() => {
    try {
      sessionStorage.setItem('sidebar-expanded-items', JSON.stringify(expandedItems));
    } catch {
      // Ignorar erros de storage
    }
  }, [expandedItems]);

  useEffect(() => {
    try {
      localStorage.setItem('sidebar-collapsed', String(isCollapsed));
    } catch {}
  }, [isCollapsed]);
  
  // Efeito para colapsar menus ao pressionar ESC
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setExpandedItems([]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Update visible items based on config and permissions
  useEffect(() => {
    const updateVisibility = () => {
      const sourceItems = items || menuItems;
      const permissions = {
        hasGestaoComprasPermission,
        hasGestaoFinanceiraPermission,
        hasGestaoRHPermission,
        hasAssistenteVirtualRHPermission,
        hasAssistenteVirtualFinanceiroPermission
      };
      
      const filtered = MenuVisibilityService.getVisibleItems(sourceItems, permissions);
      setVisibleItems(filtered);
    };

    updateVisibility();

    const handleUpdate = () => updateVisibility();
    window.addEventListener(EnvironmentConfigService.MODULES_UPDATED_EVENT, handleUpdate);
    window.addEventListener(EnvironmentConfigService.MENUS_UPDATED_EVENT, handleUpdate);
    
    return () => {
      window.removeEventListener(EnvironmentConfigService.MODULES_UPDATED_EVENT, handleUpdate);
      window.removeEventListener(EnvironmentConfigService.MENUS_UPDATED_EVENT, handleUpdate);
    };
  }, [
    items, 
    hasGestaoComprasPermission, 
    hasGestaoFinanceiraPermission, 
    hasGestaoRHPermission,
    hasAssistenteVirtualRHPermission,
    hasAssistenteVirtualFinanceiroPermission
  ]);

  const displayedItems = visibleItems;

  const toggleExpanded = (itemId: string, event?: React.MouseEvent) => {
    // Se estiver colapsado e o usuário clicar em um item pai, expandir a sidebar
    if (isCollapsed) {
        setIsCollapsed(false);
        // Pequeno delay para permitir a animação da sidebar antes de expandir o item
        setTimeout(() => {
             setExpandedItems(prev => 
                prev.includes(itemId) 
                  ? prev.filter(id => id !== itemId) 
                  : [...prev, itemId]
              );
        }, 100);
        return;
    }

    // Prevenir propagação de eventos e múltiplos cliques
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    
    // Prevenir múltiplas chamadas rápidas
    if (isToggling) {
      return;
    }
    
    setIsToggling(true);
    
    // Se for o menu de Gestão de Compras e não tiver permissão, permitir expansão mas manter indicador visual
    // if ((itemId === 'gestao-compras' || itemId === 'simpledfe') && !hasGestaoComprasPermission) {
    //   setIsToggling(false);
    //   return;
    // }
    
    // Se for o menu de Gestão Financeira e não tiver permissão, permitir expansão mas manter indicador visual
    // if (itemId === 'gestao-financeira' && !hasGestaoFinanceiraPermission) {
    //   setIsToggling(false);
    //   return;
    // }
    
    // Se for o menu de Gestão de RH e não tiver permissão, permitir expansão mas manter indicador visual
    // if (itemId === 'gestao-rh' && !hasGestaoRHPermission) {
    //   setIsToggling(false);
    //   return;
    // }
    
    // Removida a condição que impedia a expansão do menu de Assistentes Virtuais sem permissão
    // Agora o menu pode ser expandido mesmo sem permissão, mostrando os sub-menus com cadeados
    
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId) 
        : [...prev, itemId]
    );
    
    // Reset do flag após um delay pequeno
    setTimeout(() => setIsToggling(false), 100);
  };

  const renderMenuItem = (item: MenuItem) => {
    const isActive = item.path === location;
    const Icon = item.icon;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.id);
    
    
    // Verificar se o item está desabilitado por falta de permissão
    // Removida a verificação para o menu de Assistentes Virtuais
    const isDisabled = ((item.id === 'gestao-compras' || item.id === 'simpledfe') && !hasGestaoComprasPermission) ||
                      (item.id === 'gestao-financeira' && !hasGestaoFinanceiraPermission) ||
                      (item.id === 'gestao-rh' && !hasGestaoRHPermission);
    
    // Para o menu de Assistentes Virtuais, não mostramos cadeado no menu pai
    // Os cadeados ficam apenas nos sub-menus que não têm permissão
    const showLockIcon = false;

    if (hasChildren) {
      const buttonContent = (
          <Button
            variant="ghost"
            // Não desabilitar o botão para permitir expansão e visualização dos submenus
            // disabled={isDisabled}
            className={cn(
              "w-full justify-start text-left h-auto py-2.5 px-4",
              isDisabled 
                ? "text-muted-foreground" // Apenas mudar a cor, não a opacidade total
                : "hover:bg-muted/50",
              isCollapsed && "px-2 justify-center"
            )}
            onClick={(e) => toggleExpanded(item.id, e)}
          >
            <Icon className={cn("h-4 w-4 shrink-0", isDisabled && "opacity-50", !isCollapsed && "mr-2.5")} />
            {!isCollapsed && (
              <>
                <span className="truncate text-sm">{item.label}</span>
                <span className="ml-auto">
                  {!isDisabled && (
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
                  )}
                  {isDisabled && (
                    <span className="text-xs text-muted-foreground">🔒</span>
                  )}
                </span>
              </>
            )}
          </Button>
      );

      return (
        <div key={item.id} className="w-full">
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                {buttonContent}
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{item.label}</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            buttonContent
          )}
          
          {isExpanded && !isCollapsed && item.children && (
            <div className="pl-5 mt-2 space-y-2">
              {item.children
                .filter(child => {
                  // Se não houver configuração de menus, mostrar tudo
                  if (!enabledMenus) return true;
                  
                  const childState = getMenuState(child.id);

                  // Debug para itens específicos
                  if (item.id === 'gestao-compras' || item.id === 'parametros') {
                      console.log(`[Sidebar] Filtering child ${child.id} of ${item.id}: state=${childState}`, {
                          enabledMenusKeys: enabledMenus ? Object.keys(enabledMenus) : 'null',
                          explicitValue: enabledMenus ? enabledMenus[child.id] : 'N/A'
                      });
                  }

                  // 1. Se estiver explicitamente habilitado, mostrar
                  if (childState === true) return true;

                  // 2. Se estiver explicitamente desabilitado
                  if (childState === false) {
                      // Verificar se tem filhos explicitamente habilitados (ou padrão/undefined)
                      if (child.children && child.children.length > 0) {
                          return child.children.some(grandchild => getMenuState(grandchild.id) !== false);
                      }
                      return false;
                  }

                  // 3. Se estiver indefinido (implícito)
                  // Assumimos habilitado por padrão (true)
                  return true;
                })
                .map((child, index) => {
                  const isChildActive = child.path === location;
                  const ChildIcon = child.icon;
                  const hasGrandchildren = child.children && child.children.length > 0;
                  const isChildExpanded = expandedItems.includes(child.id);
                  
                  // Verificar se o item está desabilitado por falta de permissão
                  // Aqui você pode adicionar lógica específica para desabilitar filhos se necessário
                  const isChildDisabled = false; // Por enquanto, não temos lógica específica para desabilitar filhos
                  // Se tiver submenus (netos), renderizar como acordeão
                  if (hasGrandchildren) {
                    return (
                      <div key={child.id} className="w-full">
                      <Button
                        variant="ghost"
                        disabled={isChildDisabled}
                        className={cn(
                          "w-full justify-start text-left h-auto py-2.5 px-4",
                          isChildDisabled 
                            ? "opacity-50 cursor-not-allowed text-muted-foreground" 
                            : "hover:bg-muted/50"
                        )}
                        onClick={(e) => !isChildDisabled && toggleExpanded(child.id, e)}
                      >
                        <ChildIcon className={cn("mr-2.5 h-4 w-4 shrink-0", isChildDisabled && "opacity-50")} />
                        <span className="truncate text-sm">{child.label}</span>
                        <span className="ml-auto">
                          {isChildDisabled ? (
                            <span className="text-xs mr-2">🔒</span>
                          ) : (
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
                          )}
                        </span>
                      </Button>
                      {isChildExpanded && child.children && (
                        <div className="pl-5 mt-2 space-y-2">
                          {child.children
                            .filter(grandchild => {
                                const state = getMenuState(grandchild.id);
                                return state !== false;
                            })
                            .map(grandchild => {
                            const isGrandchildActive = grandchild.path === location;
                            const GrandchildIcon = grandchild.icon;
                            
                            // Verificar se o grandchild está desabilitado por falta de permissão
                            // Aqui você pode adicionar lógica específica para desabilitar grandchildren se necessário
                            const isGrandchildDisabled = false; // Por enquanto, não temos lógica específica para desabilitar grandchildren
                            
                            return isGrandchildDisabled ? (
                              // Renderizar botão desabilitado quando não tem permissão
                              <Button
                                key={grandchild.id}
                                variant="ghost"
                                disabled
                                className={cn(
                                  "w-full justify-start text-left h-auto py-2.5 px-4",
                                  "opacity-50 cursor-not-allowed text-muted-foreground"
                                )}
                              >
                                <GrandchildIcon className="mr-2.5 h-4 w-4 shrink-0 opacity-50" />
                                <span className="truncate text-sm">{grandchild.label}</span>
                                <span className="ml-auto text-xs">🔒</span>
                              </Button>
                            ) : (
                              // Renderizar link normal quando tem permissão
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
                
                return isChildDisabled ? (
                  // Renderizar botão desabilitado quando não tem permissão
                  <Button
                    key={`${child.id}-disabled-${isChildDisabled}`}
                    variant="ghost"
                    disabled
                    className={cn(
                      "w-full justify-start text-left h-auto py-2.5 px-4",
                      "opacity-50 cursor-not-allowed text-muted-foreground"
                    )}
                  >
                    <ChildIcon className="mr-2.5 h-4 w-4 shrink-0 opacity-50" />
                    <span className="truncate text-sm">{child.label}</span>
                    <span className="ml-auto text-xs">🔒</span>
                  </Button>
                ) : (
                  // Renderizar link normal quando tem permissão
                  <Link key={`${child.id}-enabled-${!isChildDisabled}`} href={child.path!}>
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
                      {child.inDevelopment && (
                        <Badge variant="outline" className="ml-auto text-[10px] h-5 px-1.5 border-yellow-600 text-yellow-600">
                          Em Desenv.
                        </Badge>
                      )}
                    </Button>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    const buttonContent = (
        <Button
          variant={isActive ? "secondary" : "ghost"}
          className={cn(
            "w-full justify-start text-left h-auto py-2.5 px-4",
            "hover:bg-muted/50",
            isCollapsed && "px-2 justify-center"
          )}
          onClick={() => isMobile && onClose?.()}
        >
          <Icon className={cn("h-4 w-4 shrink-0", !isCollapsed && "mr-2.5")} />
          {!isCollapsed && (
            <>
              <span className="truncate text-sm">{item.label}</span>
              {item.inDevelopment && (
                <Badge variant="outline" className="ml-auto text-[10px] h-5 px-1.5 border-yellow-600 text-yellow-600">
                  Em Desenv.
                </Badge>
              )}
            </>
          )}
        </Button>
    );

    return (
      <div key={item.id} className="w-full">
        {isDisabled ? (
          <Button
            variant="ghost"
            disabled
            className={cn(
              "w-full justify-start text-left h-auto py-2.5 px-4",
              "opacity-50 cursor-not-allowed text-muted-foreground",
              isCollapsed && "px-2 justify-center"
            )}
          >
            <Icon className={cn("h-4 w-4 shrink-0 opacity-50", !isCollapsed && "mr-2.5")} />
            {!isCollapsed && (
              <>
                <span className="truncate text-sm">{item.label}</span>
                <span className="ml-auto text-xs">🔒</span>
              </>
            )}
          </Button>
        ) : (
          isCollapsed ? (
            <Link href={item.path!}>
              <Tooltip>
                <TooltipTrigger asChild>
                  {buttonContent}
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{item.label}</p>
                </TooltipContent>
              </Tooltip>
            </Link>
          ) : (
            <Link href={item.path!}>
              {buttonContent}
            </Link>
          )
        )}
      </div>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={cn("flex items-center border-b border-border h-16", isCollapsed ? "justify-center p-2" : "justify-between p-4")}>
        {!isCollapsed && <h2 className="text-lg font-semibold whitespace-nowrap overflow-hidden">Portal RM</h2>}
        {isCollapsed && <h2 className="text-lg font-semibold">RM</h2>}
        {isMobile && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Menu Items */}
      <ScrollArea className="flex-1 p-3">
        <TooltipProvider delayDuration={0}>
          <div className="space-y-2">
            {displayedItems.map((item) => renderMenuItem(item))}
          </div>
        </TooltipProvider>
      </ScrollArea>

      {/* Footer Toggle */}
      {!isMobile && (
        <div className="p-4 border-t border-border flex justify-end">
           <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="ml-auto"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
           </Button>
        </div>
      )}
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
    <div className={cn(isCollapsed ? "w-16" : "w-72", "bg-card border-r border-border transition-all duration-300", className)}>
      {sidebarContent}
    </div>
  );
}
