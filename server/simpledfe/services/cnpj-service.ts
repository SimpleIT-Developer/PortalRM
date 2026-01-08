import { ERP_CONFIG } from "../config/erp-config";

export interface CNPJData {
  cnpj: string;
  nome: string;
  fantasia?: string;
  logradouro?: string;
  numero?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
  cep?: string;
  telefone?: string;
  email?: string;
  situacao?: string;
  status?: string;
  codigo_municipio?: string;
  inscricao_municipal?: string;
}

export class CNPJService {
  static async consultarCNPJ(cnpj: string): Promise<CNPJData | null> {
    try {
      // Remove formatting from CNPJ
      const cleanCNPJ = cnpj.replace(/\D/g, '');
      
      if (cleanCNPJ.length !== 14) {
        throw new Error('CNPJ deve ter 14 dígitos');
      }

      console.log(`[CNPJ-SERVICE] Consultando CNPJ: ${cleanCNPJ}`);
      
      const response = await fetch(`${ERP_CONFIG.RECEITA_WS_API}/${cleanCNPJ}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'SimpleDFe/1.0'
        }
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Muitas consultas realizadas. Tente novamente em alguns minutos.');
        }
        throw new Error(`Erro na consulta: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status === 'ERROR') {
        throw new Error(data.message || 'CNPJ não encontrado');
      }

      console.log(`[CNPJ-SERVICE] Dados recebidos para ${cleanCNPJ}:`, {
        nome: data.nome,
        fantasia: data.fantasia,
        situacao: data.situacao
      });

      return {
        cnpj: cleanCNPJ,
        nome: data.nome || '',
        fantasia: data.fantasia || '',
        logradouro: data.logradouro || '',
        numero: data.numero || '',
        bairro: data.bairro || '',
        municipio: data.municipio || '',
        uf: data.uf || '',
        cep: data.cep || '',
        telefone: data.telefone || '',
        email: data.email || '',
        situacao: data.situacao || '',
        status: data.status || '',
        codigo_municipio: data.codigo_municipio || '',
        inscricao_municipal: data.inscricao_municipal || ''
      };
    } catch (error) {
      console.error('[CNPJ-SERVICE] Erro ao consultar CNPJ:', error);
      throw error;
    }
  }
}