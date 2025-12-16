import { AuthService } from './auth';

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
  [key: string]: any;
}

export interface AccountingPlanResponse {
  items: AccountingAccount[];
  hasNext: boolean;
  [key: string]: any;
}

export class AccountingPlanService {
  /**
   * Busca o plano de contas no endpoint TOTVS
   */
  static async getAccountingPlan(): Promise<AccountingAccount[]> {
    try {
      const token = AuthService.getStoredToken();
      if (!token || !token.access_token) {
        console.error('Token não encontrado para consulta de plano de contas');
        throw new Error('Usuário não autenticado');
      }

      const endpoint = token.endpoint || 'http://erp-simpleit.sytes.net:8051';
      const path = '/api/ctb/v1/AccountingPlan';
      
      console.log("🔗 Consultando plano de contas via proxy backend");
      
      const response = await fetch(`/api/proxy?endpoint=${encodeURIComponent(endpoint)}&path=${encodeURIComponent(path)}&token=${encodeURIComponent(token.access_token)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
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
