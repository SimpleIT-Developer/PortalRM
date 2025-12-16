import { EndpointService } from "./endpoint";
import { AuthService } from "./auth";

export interface CostCenter {
  id: string;
  companyId: number;
  code: string;
  name: string;
  shortCode: string;
  registerSituation: string;
  allowEntry: string;
  classification: string;
  createDate: string;
  SPED: string;
  recordModifiedOn: string;
  // Optional children property for tree structure
  children?: CostCenter[];
}

export const CostCenterService = {
  async getCostCenters(): Promise<CostCenter[]> {
    const endpoint = await EndpointService.getDefaultEndpoint();
    if (!endpoint) {
      throw new Error("Endpoint padrão não configurado");
    }

    const token = AuthService.getStoredToken();
    if (!token || !token.access_token) {
      throw new Error("Usuário não autenticado");
    }

    const formattedEndpoint = endpoint.replace(/^https?:\/\//i, '');
    const path = "/api/ctb/v1/costcenters";
    
    const fullUrl = `/api/proxy?endpoint=${encodeURIComponent(formattedEndpoint)}&path=${encodeURIComponent(path)}&token=${encodeURIComponent(token.access_token)}`;

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.items && Array.isArray(data.items)) {
      return data.items;
    } else if (Array.isArray(data)) {
      return data;
    }
    
    return [];
  },

  /**
   * Constrói a árvore de centros de custo a partir da lista plana
   */
  buildTree(items: CostCenter[]): CostCenter[] {
    const map = new Map<string, CostCenter>();
    const roots: CostCenter[] = [];

    // Primeiro passo: Criar um mapa para acesso rápido e garantir que children seja inicializado
    const sortedItems = [...items].sort((a, b) => a.code.localeCompare(b.code));

    sortedItems.forEach(item => {
      const itemWithChildren = { ...item, children: [] };
      map.set(item.code, itemWithChildren);
    });

    // Segundo passo: Construir a hierarquia
    sortedItems.forEach(item => {
      const currentItem = map.get(item.code)!;
      
      const parts = item.code.split('.');
      let parentCode = '';
      
      if (parts.length > 1) {
        parentCode = parts.slice(0, -1).join('.');
      }

      const parentItem = parentCode ? map.get(parentCode) : null;

      if (parentItem) {
        parentItem.children!.push(currentItem);
      } else {
        roots.push(currentItem);
      }
    });

    return roots;
  }
};
