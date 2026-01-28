export class EnvironmentConfigService {
  public static readonly MODULES_UPDATED_EVENT = 'modules_updated';
  private static readonly ORDER_MOVEMENTS_KEY = 'mov_ordem_compra';
  private static readonly NF_PRODUCT_MOVEMENTS_KEY = 'mov_nf_produto';
  private static readonly NF_SERVICE_MOVEMENTS_KEY = 'mov_nf_servico';
  private static readonly OTHER_MOVEMENTS_KEY = 'mov_outras_movimentacoes';

  /**
   * Salva a configuração de módulos habilitados
   */
  static saveEnabledModules(modules: Record<string, boolean> | null): void {
    try {
      if (modules) {
        // Normalizar chaves: substituir underscores por hifens para corresponder aos IDs do menu
        const normalizedModules: Record<string, boolean> = {};
        Object.entries(modules).forEach(([key, value]) => {
          const normalizedKey = key.replace(/_/g, '-');
          normalizedModules[normalizedKey] = value;
        });
        localStorage.setItem('enabled_modules', JSON.stringify(normalizedModules));
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
}
