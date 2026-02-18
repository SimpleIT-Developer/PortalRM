import { ERPService } from "./erp-service";
import { AuditLogger } from "../audit-logger";
import { ReciboService } from "./recibo-service";

export interface EmissaoNFSeData {
  cnpjPrestador: string;
  cnpjTomador: string;
  valorServico: number;
  descricaoServico: string;
  dpsNumber?: string; // DPS opcional - se não fornecido, será gerado automaticamente
  municipioPrestacao: string;
  serie: string;
  numeroNota?: string;
  reciboId?: number;
}

export interface EmissaoNFSeResult {
  success: boolean;
  message: string;
  dpsNumber?: string;
  chaveAcesso?: string;
  protocolo?: string;
  xmlGerado?: string;
  erro?: string;
}

export class NFSeEmissaoService {
  
  /**
   * Emite uma NFSe com verificação automática de DPS
   */
  static async emitirNFSe(data: EmissaoNFSeData, req?: any): Promise<EmissaoNFSeResult> {
    console.log(`[NFSE-EMISSAO] Iniciando emissão de NFSe para CNPJ ${data.cnpjPrestador}`);
    
    let dpsNumber = data.dpsNumber;
    let xmlGerado = "";
    
    try {
      // Se não foi fornecido DPS, gerar um baseado no CNPJ e data
      if (!dpsNumber) {
        dpsNumber = this.gerarDPSNumber(data.cnpjPrestador);
        console.log(`[NFSE-EMISSAO] DPS gerado automaticamente: ${dpsNumber}`);
      }
      
      // Verificar se o DPS já existe
      console.log(`[NFSE-EMISSAO] Verificando disponibilidade do DPS: ${dpsNumber}`);
      const dpsExistente = await ERPService.verificarDPSExistente(dpsNumber);
      
      if (dpsExistente.exists) {
        console.log(`[NFSE-EMISSAO] DPS ${dpsNumber} já existe! Buscando próximo disponível...`);
        
        // Encontrar próximo DPS disponível
        const dpsDisponivel = await ERPService.encontrarDPSDisponivel(dpsNumber);
        
        if (!dpsDisponivel) {
          const erro = "Não foi possível encontrar um DPS disponível";
          console.error(`[NFSE-EMISSAO] ${erro}`);
          
          // Log de erro
          if (req) {
            await AuditLogger.logNFSeEmission(req, {
              success: false,
              dpsNumber,
              error: erro,
              xmlContent: ""
            });
          }
          
          return {
            success: false,
            message: erro,
            dpsNumber,
            erro
          };
        }
        
        dpsNumber = dpsDisponivel;
        console.log(`[NFSE-EMISSAO] DPS disponível encontrado: ${dpsNumber}`);
      }
      
      // Gerar XML da NFSe
      console.log(`[NFSE-EMISSAO] Gerando XML para DPS ${dpsNumber}`);
      xmlGerado = this.gerarXMLNFSe(data, dpsNumber);
      
      console.log(`[NFSE-EMISSAO] XML gerado com sucesso. Tamanho: ${xmlGerado.length} caracteres`);
      
      // Aqui você implementaria o envio para a Sefin Nacional
      // Por enquanto, vamos simular o envio bem-sucedido
      console.log(`[NFSE-EMISSAO] Enviando para Sefin Nacional...`);
      
      // Simular resposta da Sefin
      const chaveAcesso = this.gerarChaveAcesso(dpsNumber);
      const protocolo = `PROT${Date.now()}`;
      
      console.log(`[NFSE-EMISSAO] NFSe emitida com sucesso!`);
      console.log(`[NFSE-EMISSAO] Chave de Acesso: ${chaveAcesso}`);
      console.log(`[NFSE-EMISSAO] Protocolo: ${protocolo}`);
      
      // Log de sucesso
      if (req) {
        await AuditLogger.logNFSeEmission(req, {
          success: true,
          dpsNumber,
          protocol: protocolo,
          xmlContent: xmlGerado
        });
      }

      // Atualiza o status do recibo
      if (data.reciboId) {
        await ReciboService.atualizarStatusRecibo(data.reciboId, "Emitida");
      }
      
      return {
        success: true,
        message: "NFSe emitida com sucesso",
        dpsNumber,
        chaveAcesso,
        protocolo,
        xmlGerado
      };
      
    } catch (error) {
      const erro = error instanceof Error ? error.message : "Erro desconhecido";
      console.error(`[NFSE-EMISSAO] Erro na emissão: ${erro}`);
      
      // Log de erro
      if (req) {
        await AuditLogger.logNFSeEmission(req, {
          success: false,
          dpsNumber,
          error: erro,
          xmlContent: xmlGerado
        });
      }
      
      return {
        success: false,
        message: `Erro ao emitir NFSe: ${erro}`,
        dpsNumber,
        xmlGerado,
        erro
      };
    }
  }
  
  /**
   * Gera um número de DPS baseado no CNPJ e timestamp
   */
  private static gerarDPSNumber(cnpj: string): string {
    const timestamp = Date.now().toString();
    const cnpjLimpo = cnpj.replace(/\D/g, '');
    
    // Formato: DPS + CNPJ (14) + timestamp (13) + sequencial (5)
    const sequencial = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
    
    return `DPS${cnpjLimpo}${timestamp}${sequencial}`;
  }
  
  /**
   * Gera chave de acesso para a NFSe
   */
  private static gerarChaveAcesso(dpsNumber: string): string {
    const timestamp = Date.now().toString();
    return `CHV${dpsNumber.substring(3)}${timestamp}`.substring(0, 44);
  }
  
  /**
   * Gera XML da NFSe (simplificado para demonstração)
   */
  private static gerarXMLNFSe(data: EmissaoNFSeData, dpsNumber: string): string {
    const dataEmissao = new Date().toISOString();
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<NFSe xmlns="http://www.abrasf.org.br/nfse.xsd">
  <InfNFSe Id="${dpsNumber}">
    <DPS>
      <InfDPS Id="${dpsNumber}">
        <dhEmi>${dataEmissao}</dhEmi>
        <toma>
          <CNPJ>${data.cnpjTomador}</CNPJ>
        </toma>
        <prest>
          <CNPJ>${data.cnpjPrestador}</CNPJ>
        </prest>
        <serv>
          <valServ>${data.valorServico.toFixed(2)}</valServ>
          <discr>${data.descricaoServico}</discr>
        </serv>
        <municipioPrestacao>${data.municipioPrestacao}</municipioPrestacao>
        <serie>${data.serie}</serie>
      </InfDPS>
    </DPS>
  </InfNFSe>
</NFSe>`;
  }
}