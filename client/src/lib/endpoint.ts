export interface EndpointOption {
  url: string;
  name: string;
}

export class EndpointService {
  private static readonly STORAGE_KEY = 'selected_endpoint';
  private static readonly ENDPOINTS_FILE = '/endpoints.json';

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
    return [
      {
        url: 'http://erp-simpleit.sytes.net:8051',
        name: 'ERP SimpleIT'
      }
    ];
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
   * Obtém o endpoint padrão (primeiro da lista ou último selecionado)
   */
  static async getDefaultEndpoint(): Promise<string> {
    const saved = this.getSelectedEndpoint();
    if (saved) {
      return saved;
    }

    const endpoints = await this.loadEndpoints();
    return endpoints.length > 0 ? endpoints[0].url : 'http://erp-simpleit.sytes.net:8051';
  }
}