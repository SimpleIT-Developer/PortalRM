import { MenuItem } from "@/config/menu-items";
import { EnvironmentConfigService } from "@/lib/environment-config";

export interface PermissionFlags {
  hasGestaoComprasPermission: boolean;
  hasGestaoFinanceiraPermission: boolean;
  hasGestaoRHPermission: boolean;
  hasAssistenteVirtualRHPermission: boolean;
  hasAssistenteVirtualFinanceiroPermission: boolean;
}

export class MenuVisibilityService {
  /**
   * Verifica se um item específico deve estar visível baseado na configuração do ambiente.
   */
  private static isItemEnabledInEnvironment(
    itemId: string,
    enabledModules: Record<string, boolean> | null,
    enabledMenus: Record<string, boolean> | null
  ): boolean {
    // 1. Core modules/menus are always enabled in environment config
    if (itemId === 'dashboard-principal' || itemId === 'parametros') return true;

    // 2. If NO configuration exists at all (first run), default to FALSE (Opt-in)
    // Only core items are allowed if no config is present.
    if (!enabledModules && !enabledMenus) {
        return false;
    }

    let isEnabled: boolean | undefined = undefined;

    // 3. Check Module Config (Modules are usually top-level)
    if (enabledModules) {
        if (itemId in enabledModules) {
            isEnabled = enabledModules[itemId];
        } else {
             // Fallback for key mismatch (underscore vs hyphen)
             const underscoreId = itemId.replace(/-/g, '_');
             if (underscoreId in enabledModules) {
                 isEnabled = enabledModules[underscoreId];
             }
        }
    }

    // 4. Check Menu Config (Sub-items)
    // If not found in modules, or to be safe, check menus.
    // If we found a value in modules, we typically respect it, but let's check if there's a specific menu override?
    // Usually, if a module is disabled, the menu shouldn't matter. But here we treat them flatly for lookup.
    // If isEnabled is still undefined, check menus.
    if (isEnabled === undefined && enabledMenus) {
         if (itemId in enabledMenus) {
             isEnabled = enabledMenus[itemId];
         } else {
             const underscoreId = itemId.replace(/-/g, '_');
             if (underscoreId in enabledMenus) {
                 isEnabled = enabledMenus[underscoreId];
             }
         }
    }

    // 5. Strict Opt-in: If configuration exists but item is not found, return FALSE.
    if (isEnabled === undefined) return false;

    return isEnabled;
  }

  /**
   * Verifica permissões de usuário (Role-based access).
   */
  private static hasUserPermission(itemId: string, permissions: PermissionFlags): boolean {
    // Mapeamento de permissões específicas
    if (itemId === 'gestao-compras') return permissions.hasGestaoComprasPermission;
    if (itemId === 'simpledfe') return permissions.hasGestaoComprasPermission; // SimpleDFe usa permissão de Compras
    
    if (itemId === 'gestao-financeira') return permissions.hasGestaoFinanceiraPermission;
    
    if (itemId === 'gestao-rh') return permissions.hasGestaoRHPermission;
    
    // Assistentes Virtuais
    if (itemId === 'assistente-virtual-rh') return permissions.hasAssistenteVirtualRHPermission;
    if (itemId === 'assistente-virtual-financeiro') return permissions.hasAssistenteVirtualFinanceiroPermission;

    // Default: no specific permission required
    return true;
  }

  /**
   * Retorna a árvore de menus filtrada.
   */
  public static getVisibleItems(
    items: MenuItem[], 
    permissions: PermissionFlags
  ): MenuItem[] {
    const enabledModules = EnvironmentConfigService.getEnabledModules();
    const enabledMenus = EnvironmentConfigService.getEnabledMenus();

    const filterItem = (item: MenuItem): MenuItem | null => {
        // 1. Check Environment Config
        const isEnvEnabled = this.isItemEnabledInEnvironment(item.id, enabledModules, enabledMenus);
        if (!isEnvEnabled) return null;

        // 2. Check User Permissions
        const hasPerm = this.hasUserPermission(item.id, permissions);
        if (!hasPerm) return null;

        // 3. Process Children Recursively
        if (item.children && item.children.length > 0) {
            const visibleChildren = item.children
                .map(child => filterItem(child))
                .filter((child): child is MenuItem => child !== null);
            
            // If item has children definition but all are hidden, hide the parent
            if (visibleChildren.length === 0) return null;

            return { ...item, children: visibleChildren };
        }

        // Leaf item (no children) - already passed checks
        return item;
    };

    return items
        .map(item => filterItem(item))
        .filter((item): item is MenuItem => item !== null);
  }
}
