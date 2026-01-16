export interface EndpointOption {
  url: string;
  name: string;
}

export class EndpointService {
  private static readonly STORAGE_KEY = 'selected_endpoint';
  private static readonly ENDPOINTS_FILE = '/endpoints.json';
  public static readonly MODULES_UPDATED_EVENT = 'modules_updated';
  private static readonly ORDER_MOVEMENTS_KEY = 'mov_ordem_compra';
  private static readonly NF_PRODUCT_MOVEMENTS_KEY = 'mov_nf_produto';
  private static readonly NF_SERVICE_MOVEMENTS_KEY = 'mov_nf_servico';
  private static readonly OTHER_MOVEMENTS_KEY = 'mov_outras_movimentacoes';

  /**
   * Carrega a lista de endpoints do arquivo estático
   */
  static async loadEndpoints(): Promise<EndpointOption[]> {
    try {
      const response = await fetch(this.ENDPOINTS_FILE);
      if (!response.ok) {
        console.warn('Arquivo de endpoints não encontrado, usando endpoint padrão');
        return this.getDefaultEndpoints();
      }

      const data = await response.json();
      const endpoints = data.endpoints || [];

      if (endpoints.length === 0) {
        return this.getDefaultEndpoints();
      }

      return endpoints.map((endpoint: string) => ({
        url: this.normalizeEndpoint(endpoint),
        name: this.formatEndpointLabel(endpoint)
      }));

    } catch (error) {
      console.error('Erro ao carregar endpoints:', error);
      return this.getDefaultEndpoints();
    }
  }

  /**
   * Normaliza o endpoint adicionando protocolo se necessário
   */
  private static normalizeEndpoint(endpoint: string): string {
    if (!endpoint.startsWith('http://') && !endpoint.startsWith('https://')) {
      // Para desenvolvimento local, usar http. Em produção, considerar https
      return `http://${endpoint}`;
    }
    return endpoint;
  }

  /**
   * Formata o label do endpoint para exibição
   */
  private static formatEndpointLabel(endpoint: string): string {
    // Remove protocolo para exibição mais limpa
    return endpoint.replace(/^https?:\/\//, '');
  }

  /**
   * Retorna endpoints padrão caso o arquivo não seja encontrado
   */
  private static getDefaultEndpoints(): EndpointOption[] {
    return [];
  }

  /**
   * Salva o endpoint selecionado no localStorage
   */
  static saveSelectedEndpoint(endpoint: string): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, endpoint);
    } catch (error) {
      console.error('Erro ao salvar endpoint selecionado:', error);
    }
  }

  /**
   * Recupera o último endpoint selecionado
   */
  static getSelectedEndpoint(): string | null {
    try {
      return localStorage.getItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Erro ao recuperar endpoint selecionado:', error);
      return null;
    }
  }

  /**
   * Salva a configuração de módulos habilitados
   */
  static saveEnabledModules(modules: Record<string, boolean> | null): void {
    try {
      if (modules) {
        localStorage.setItem('enabled_modules', JSON.stringify(modules));
      } else {
        localStorage.removeItem('enabled_modules');
      }
      // Dispara evento para notificar componentes
      window.dispatchEvent(new Event(this.MODULES_UPDATED_EVENT));
    } catch (error) {
      console.error('Erro ao salvar módulos habilitados:', error);
    }
  }

  /**
   * Recupera a configuração de módulos habilitados
   */
  static getEnabledModules(): Record<string, boolean> | null {
    try {
      const saved = localStorage.getItem('enabled_modules');
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('Erro ao recuperar módulos habilitados:', error);
      return null;
    }
  }

  static saveOrderMovements(movements: string[] | null): void {
    try {
      if (movements && movements.length > 0) {
        localStorage.setItem(this.ORDER_MOVEMENTS_KEY, JSON.stringify(movements));
      } else {
        localStorage.removeItem(this.ORDER_MOVEMENTS_KEY);
      }
    } catch (error) {
      console.error('Erro ao salvar movimentos de ordem de compra:', error);
    }
  }

  static getOrderMovements(): string[] {
    try {
      const saved = localStorage.getItem(this.ORDER_MOVEMENTS_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Erro ao recuperar movimentos de ordem de compra:', error);
      return [];
    }
  }

  static saveNfProductMovements(movements: string[] | null): void {
    try {
      if (movements && movements.length > 0) {
        localStorage.setItem(this.NF_PRODUCT_MOVEMENTS_KEY, JSON.stringify(movements));
      } else {
        localStorage.removeItem(this.NF_PRODUCT_MOVEMENTS_KEY);
      }
    } catch (error) {
      console.error('Erro ao salvar movimentos de nota fiscal de produto:', error);
    }
  }

  static getNfProductMovements(): string[] {
    try {
      const saved = localStorage.getItem(this.NF_PRODUCT_MOVEMENTS_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Erro ao recuperar movimentos de nota fiscal de produto:', error);
      return [];
    }
  }

  static saveNfServiceMovements(movements: string[] | null): void {
    try {
      if (movements && movements.length > 0) {
        localStorage.setItem(this.NF_SERVICE_MOVEMENTS_KEY, JSON.stringify(movements));
      } else {
        localStorage.removeItem(this.NF_SERVICE_MOVEMENTS_KEY);
      }
    } catch (error) {
      console.error('Erro ao salvar movimentos de nota fiscal de serviço:', error);
    }
  }

  static getNfServiceMovements(): string[] {
    try {
      const saved = localStorage.getItem(this.NF_SERVICE_MOVEMENTS_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Erro ao recuperar movimentos de nota fiscal de serviço:', error);
      return [];
    }
  }

  static saveOtherMovements(movements: string[] | null): void {
    try {
      if (movements && movements.length > 0) {
        localStorage.setItem(this.OTHER_MOVEMENTS_KEY, JSON.stringify(movements));
      } else {
        localStorage.removeItem(this.OTHER_MOVEMENTS_KEY);
      }
    } catch (error) {
      console.error('Erro ao salvar outras movimentações:', error);
    }
  }

  static getOtherMovements(): string[] {
    try {
      const saved = localStorage.getItem(this.OTHER_MOVEMENTS_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Erro ao recuperar outras movimentações:', error);
      return [];
    }
  }

  /**
   * Obtém o endpoint padrão (primeiro da lista ou último selecionado)
   */
  static async getDefaultEndpoint(): Promise<string> {
    const saved = this.getSelectedEndpoint();
    if (saved) {
      return saved;
    }

    const endpoints = await this.loadEndpoints();
    return endpoints.length > 0 ? endpoints[0].url : '';
  }
}
