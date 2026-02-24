import { AuthService } from './auth';
import { getTenant } from "@/lib/tenant";

export interface AccountingAccount {
  id: string;
  companyId: number;
  code: string;
  reduced: string;
  description: string;
  analytics: number; // 0 = Sintética, 1 = Analítica
  apportionment: number;
  nature: number;
  inactive: number; // 0 = Ativa, 1 = Inativa
  correctionType: number;
  accountType: number;
  historyAffiliateCode: number;
  spedNature: string;
  recordModifiedOn: string;
  children?: AccountingAccount[]; // Para estrutura de árvore
  [key: string]: any;
}

export interface AccountingPlanResponse {
  items: AccountingAccount[];
  hasNext: boolean;
  [key: string]: any;
}

export class AccountingPlanService {
  /**
   * Constrói a árvore de contas a partir da lista plana
   */
  static buildTree(accounts: AccountingAccount[]): AccountingAccount[] {
    const accountMap = new Map<string, AccountingAccount>();
    const rootAccounts: AccountingAccount[] = [];

    // Primeiro passo: Criar um mapa de contas para acesso rápido e garantir que children seja inicializado
    // Também ordenamos por código para garantir que pais venham antes (ou pelo menos estejam disponíveis)
    const sortedAccounts = [...accounts].sort((a, b) => a.code.localeCompare(b.code));

    sortedAccounts.forEach(account => {
      // Cria uma cópia rasa para não mutar o objeto original se ele for usado em outro lugar
      // e inicializa o array de filhos
      const accountWithChildren = { ...account, children: [] };
      accountMap.set(account.code, accountWithChildren);
    });

    // Segundo passo: Construir a hierarquia
    sortedAccounts.forEach(account => {
      const currentAccount = accountMap.get(account.code)!;
      
      // Tenta encontrar o pai
      // A lógica assume que o pai tem o código igual ao do filho sem o último nível
      // Ex: 1.1.01 -> Pai é 1.1
      // Ex: 1.1 -> Pai é 1
      // Ex: 1 -> Não tem pai (Raiz)
      
      // Remove o último segmento do código para achar o potencial pai
      const parts = account.code.split('.');
      let parentCode = '';
      
      if (parts.length > 1) {
        // Se tem pontos (ex: 1.1.01), remove o último
        parentCode = parts.slice(0, -1).join('.');
      } else {
         // Se não tem pontos, mas pode ser um sub-nível implícito (menos comum em planos bem estruturados, mas possível)
         // Vamos assumir que se não tem pontos, é raiz, a menos que a lógica de negócio seja diferente.
         // Para este caso, vamos considerar apenas a estrutura com pontos.
      }

      const parentAccount = parentCode ? accountMap.get(parentCode) : null;

      if (parentAccount) {
        parentAccount.children!.push(currentAccount);
      } else {
        rootAccounts.push(currentAccount);
      }
    });

    return rootAccounts;
  }

  /**
   * Busca o plano de contas no endpoint TOTVS
   */
  static async getAccountingPlan(): Promise<AccountingAccount[]> {
    try {
      const token = AuthService.getStoredToken();
      if (!token || !token.access_token || !token.environmentId) {
        console.error('Token não encontrado para consulta de plano de contas');
        throw new Error('Usuário não autenticado');
      }

      const path = '/api/ctb/v1/AccountingPlan';
      
      console.log("🔗 Consultando plano de contas via proxy backend");
      
      const response = await fetch(`/api/proxy?environmentId=${encodeURIComponent(token.environmentId)}&path=${encodeURIComponent(path)}&token=${encodeURIComponent(token.access_token)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(getTenant() ? { 'X-Tenant': getTenant()! } : {})
        }
      });

      if (!response.ok) {
        console.error('Erro na consulta de plano de contas:', {
          status: response.status,
          statusText: response.statusText
        });
        throw new Error(`Erro na consulta: ${response.statusText}`);
      }

      const rawText = await response.text();
      let data: any;
      try {
        data = JSON.parse(rawText);
      } catch (parseError) {
        console.error('Erro ao fazer parse do JSON:', parseError);
        throw new Error('Erro ao processar resposta do servidor');
      }
      
      // Normalização da resposta
      if (data.items && Array.isArray(data.items)) {
        return data.items;
      } else if (Array.isArray(data)) {
        return data;
      } else {
        console.warn('Formato de resposta desconhecido:', data);
        return [];
      }

    } catch (error) {
      console.error('Erro ao buscar plano de contas:', error);
      throw error;
    }
  }
}
