import { AuthService } from './auth';

export interface Branch {
  BranchInternalId?: string;
  CompanyCode: number;
  Code: number;
  Description: string;
  Title?: string;
  CGC?: string;
  StateRegistration?: string;
  Phone?: string;
  Street?: string;
  Complement?: string;
  Neighborhood?: string;
  State?: string;
  City?: string;
  ZipCode?: string;
  CityCode?: string;
  DTRE?: string;
  Suframa?: string;
  Active?: number;
  [key: string]: any;
}

export interface BranchResponse {
  data: Branch[];
  success: boolean;
  message?: string;
}

export class BranchesService {
  /**
   * Busca a lista de filiais no endpoint TOTVS
   */
  static async getBranches(): Promise<Branch[]> {
    try {
      const token = AuthService.getStoredToken();
      if (!token || !token.access_token) {
        console.error('Token não encontrado para consulta de filiais');
        throw new Error('Usuário não autenticado');
      }

      const endpoint = token.endpoint;
      if (!endpoint) {
        throw new Error('Endpoint não configurado no token');
      }
      const path = '/api/framework/v1/Branches';
      
      console.log("🔗 Consultando filiais via proxy backend");
      
      const response = await fetch(`/api/proxy?endpoint=${encodeURIComponent(endpoint)}&path=${encodeURIComponent(path)}&token=${encodeURIComponent(token.access_token)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('Erro na consulta de filiais:', {
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
      
      // A resposta do TOTVS pode variar, vamos tentar normalizar
      if (data.items && Array.isArray(data.items)) {
        return data.items;
      } else if (Array.isArray(data)) {
        return data;
      } else if (data.value && Array.isArray(data.value)) {
         return data.value;
      } else {
        console.warn('Formato de resposta desconhecido:', data);
        return [];
      }

    } catch (error) {
      console.error('Erro ao buscar filiais:', error);
      throw error;
    }
  }
}
