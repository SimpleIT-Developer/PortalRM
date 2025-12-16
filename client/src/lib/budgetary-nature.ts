import { EndpointService } from "./endpoint";
import { AuthService } from "./auth";

export interface BudgetaryNature {
  internalId: string;
  companyId: number;
  code: string;
  description: string;
  dontAllowTransfer: boolean;
  nature: number;
  natureType: number;
  inactive: boolean;
  recCreatedOn: string;
  recModifiedOn: string;
  // Optional children property for tree structure if needed in future
  children?: BudgetaryNature[];
}

export interface BudgetaryNatureResponse {
  items: BudgetaryNature[];
  hasNext: boolean;
}

export const BudgetaryNatureService = {
  async getBudgetaryNatures(): Promise<BudgetaryNature[]> {
    const endpoint = await EndpointService.getDefaultEndpoint();
    if (!endpoint) {
      throw new Error("Endpoint padrão não configurado");
    }

    const token = AuthService.getStoredToken();
    if (!token || !token.access_token) {
      throw new Error("Usuário não autenticado");
    }

    const formattedEndpoint = endpoint.replace(/^https?:\/\//i, '');
    const path = "/api/mov/v1/FinancialBudgetaryNatures";
    
    // Using the proxy as seen in other services
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
    
    // Handle different response structures if necessary, but based on user input it's { items: [...] }
    if (data.items && Array.isArray(data.items)) {
      return data.items;
    } else if (Array.isArray(data)) {
      return data;
    }
    
    return [];
  },

  /**
   * Constrói a árvore de naturezas orçamentárias a partir da lista plana
   */
  buildTree(natures: BudgetaryNature[]): BudgetaryNature[] {
    const natureMap = new Map<string, BudgetaryNature>();
    const rootNatures: BudgetaryNature[] = [];

    // Primeiro passo: Criar um mapa para acesso rápido e garantir que children seja inicializado
    const sortedNatures = [...natures].sort((a, b) => a.code.localeCompare(b.code));

    sortedNatures.forEach(nature => {
      const natureWithChildren = { ...nature, children: [] };
      natureMap.set(nature.code, natureWithChildren);
    });

    // Segundo passo: Construir a hierarquia
    sortedNatures.forEach(nature => {
      const currentNature = natureMap.get(nature.code)!;
      
      const parts = nature.code.split('.');
      let parentCode = '';
      
      if (parts.length > 1) {
        parentCode = parts.slice(0, -1).join('.');
      }

      const parentNature = parentCode ? natureMap.get(parentCode) : null;

      if (parentNature) {
        parentNature.children!.push(currentNature);
      } else {
        rootNatures.push(currentNature);
      }
    });

    return rootNatures;
  }
};
