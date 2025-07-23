import { AuthService } from './auth';

export interface UserPermissions {
  MNUSC: number;
  MNULF: number;
  // Adicione outras permissões conforme necessário
}

export interface PermissionResponse {
  data: UserPermissions[];
  success: boolean;
  message?: string;
}

export class PermissionsService {

  /**
   * Consulta as permissões do usuário no endpoint TOTVS
   */
  static async getUserPermissions(username: string): Promise<UserPermissions | null> {
    try {
      const token = AuthService.getStoredToken();
      if (!token || !token.access_token) {
        console.error('Token não encontrado para consulta de permissões');
        return null;
      }

      const endpoint = token.endpoint || 'http://erp-simpleit.sytes.net:8051';
      const path = `/api/framework/v1/consultaSQLServer/RealizaConsulta/SIT.PORTALRM.002/1/T?parameters=CODUSUARIO=${username}`;
      
      // Consulta via proxy backend para evitar problemas de CORS
      console.log("🔗 Consultando permissões via proxy backend");
      
      const response = await fetch(`/api/proxy?endpoint=${encodeURIComponent(endpoint)}&path=${encodeURIComponent(path)}&token=${encodeURIComponent(token.access_token)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Verificação silenciosa da resposta

      if (!response.ok) {
        console.error('Erro na consulta de permissões:', {
          status: response.status,
          statusText: response.statusText
        });
        return null;
      }

      const rawText = await response.text();
      // Parse silencioso da resposta

      let data: any;
      try {
        data = JSON.parse(rawText);
      } catch (parseError) {
        console.error('Erro ao fazer parse do JSON:', parseError);
        return null;
      }
      
      // Processamento silencioso das permissões

      let permissions: UserPermissions | null = null;

      // Caso 1: Retorno com wrapper {success: true, data: [...]}
      if (data.success && data.data && Array.isArray(data.data) && data.data.length > 0) {
        permissions = data.data[0];
      }
      // Caso 2: Retorno direto como array [{"MNUSC": 1}]
      else if (Array.isArray(data) && data.length > 0) {
        permissions = data[0];
      }

      if (permissions) {
        return permissions;
      }

      console.warn('Nenhuma permissão encontrada para o usuário:', username);
      return null;

    } catch (error) {
      console.error('Erro ao consultar permissões do usuário:', error);
      return null;
    }
  }

  /**
   * Verifica se o usuário tem permissão para acessar o menu de Gestão de Compras
   */
  static async hasGestaoComprasPermission(username: string): Promise<boolean> {
    try {
      const permissions = await this.getUserPermissions(username);
      
      if (!permissions) {
        return false;
      }

      const hasPermission = permissions.MNUSC !== 0;
      return hasPermission;

    } catch (error) {
      console.error('Erro ao verificar permissão de Gestão de Compras:', error);
      return false;
    }
  }

  /**
   * Verifica se o usuário tem permissão para acessar o menu de Gestão Financeira
   */
  static async hasGestaoFinanceiraPermission(username: string): Promise<boolean> {
    try {
      const permissions = await this.getUserPermissions(username);
      
      if (!permissions) {
        return false;
      }

      const hasPermission = permissions.MNULF !== 0;
      return hasPermission;

    } catch (error) {
      console.error('Erro ao verificar permissão de Gestão Financeira:', error);
      return false;
    }
  }

  /**
   * Cache das permissões do usuário para evitar consultas desnecessárias
   */
  private static permissionsCache: Map<string, { permissions: UserPermissions; timestamp: number }> = new Map();
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  /**
   * Obtém as permissões do usuário com cache
   */
  static async getUserPermissionsWithCache(username: string): Promise<UserPermissions | null> {
    const cached = this.permissionsCache.get(username);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < this.CACHE_DURATION) {
      return cached.permissions;
    }

    const permissions = await this.getUserPermissions(username);
    
    if (permissions) {
      this.permissionsCache.set(username, {
        permissions,
        timestamp: now
      });
    }

    return permissions;
  }

  /**
   * Limpa o cache de permissões
   */
  static clearPermissionsCache(username?: string): void {
    if (username) {
      this.permissionsCache.delete(username);
    } else {
      this.permissionsCache.clear();
    }
  }
}