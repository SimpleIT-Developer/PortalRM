import { ERP_CONFIG } from "../config/erp-config";
import { CNPJData } from "./cnpj-service";

export interface SoapLog {
  request: string;
  response: string;
  timestamp: string;
  erpCode?: string;
}

// In-memory storage for SOAP logs (for debugging purposes)
const soapLogs = new Map<string, SoapLog[]>();

export class ERPService {
  static createSOAPEnvelope(cnpjData: CNPJData): string {
    const currentDate = new Date().toISOString().split('T')[0] + 'T00:00:00'; // Format: YYYY-MM-DDTHH:mm:ss
    
    // Formatar CNPJ (XX.XXX.XXX/XXXX-XX)
    const formatCNPJ = (cnpj: string): string => {
      const numbers = cnpj.replace(/\D/g, '');
      if (numbers.length === 14) {
        return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
      }
      return cnpj;
    };
    
    // Formatar CEP (XXXXX-XXX)
    const formatCEP = (cep: string): string => {
      if (!cep) return '';
      const numbers = cep.replace(/\D/g, '');
      if (numbers.length === 8) {
        return numbers.replace(/(\d{5})(\d{3})/, '$1-$2');
      }
      return cep;
    };
    
    // Escapar caracteres especiais XML
    const escapeXML = (str: string): string => {
      if (!str) return '';
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    };
    
    return `<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" xmlns="http://www.totvs.com/">
   <s:Header/>
   <s:Body>
      <SaveRecord>
         <DataServerName>FinCFODataBr</DataServerName>
         <XML><![CDATA[<FinCFOBR>
  <FCFO>
    <CODEXTERNO>00000000</CODEXTERNO>
    <CODCOLIGADA>${ERP_CONFIG.DEFAULTS.CODCOLIGADA}</CODCOLIGADA>
    <CODCFO>-1</CODCFO>
    <NOMEFANTASIA>${escapeXML(cnpjData.fantasia || cnpjData.nome)}</NOMEFANTASIA>
    <NOME>${escapeXML(cnpjData.nome)}</NOME>
    <CGCCFO>${formatCNPJ(cnpjData.cnpj)}</CGCCFO>
    <PAGREC>${ERP_CONFIG.DEFAULTS.PAGREC}</PAGREC>
    <RUA>${escapeXML(cnpjData.logradouro || '')}</RUA>
    <NUMERO>${escapeXML(cnpjData.numero || '')}</NUMERO>
    <BAIRRO>${escapeXML(cnpjData.bairro || '')}</BAIRRO>
    <CIDADE>${escapeXML(cnpjData.municipio || '')}</CIDADE>
    <CODETD>${escapeXML(cnpjData.uf || '')}</CODETD>
    <CEP>${formatCEP(cnpjData.cep || '')}</CEP>
    <TELEFONE>${escapeXML(cnpjData.telefone || '')}</TELEFONE>
    <EMAIL>${escapeXML(cnpjData.email || '')}</EMAIL>
    <CONTATO>${escapeXML(cnpjData.nome)}</CONTATO>
    <ATIVO>${ERP_CONFIG.DEFAULTS.ATIVO}</ATIVO>
    <LIMITECREDITO>${ERP_CONFIG.DEFAULTS.LIMITECREDITO}</LIMITECREDITO>
    <DATAULTALTERACAO>${currentDate}</DATAULTALTERACAO>
    <DATACRIACAO>${currentDate}</DATACRIACAO>
    <DATAULTMOVIMENTO>${currentDate}</DATAULTMOVIMENTO>
    <VALOROP1>${ERP_CONFIG.DEFAULTS.VALOROP1}</VALOROP1>
    <VALOROP2>${ERP_CONFIG.DEFAULTS.VALOROP2}</VALOROP2>
    <VALOROP3>${ERP_CONFIG.DEFAULTS.VALOROP3}</VALOROP3>
    <PATRIMONIO>${ERP_CONFIG.DEFAULTS.PATRIMONIO}</PATRIMONIO>
    <NUMFUNCIONARIOS>${ERP_CONFIG.DEFAULTS.NUMFUNCIONARIOS}</NUMFUNCIONARIOS>
    <CODMUNICIPIO>${cnpjData.codigo_municipio || ''}</CODMUNICIPIO>
    <INSCRMUNICIPAL>${cnpjData.inscricao_municipal || ''}</INSCRMUNICIPAL>
    <PESSOAFISOUJUR>J</PESSOAFISOUJUR>
    <PAIS>${ERP_CONFIG.DEFAULTS.PAIS}</PAIS>
    <CONTRIBUINTE>${ERP_CONFIG.DEFAULTS.CONTRIBUINTE}</CONTRIBUINTE>
    <CFOIMOB>${ERP_CONFIG.DEFAULTS.CFOIMOB}</CFOIMOB>
    <VALFRETE>${ERP_CONFIG.DEFAULTS.VALFRETE}</VALFRETE>
    <TPTOMADOR>${ERP_CONFIG.DEFAULTS.TPTOMADOR}</TPTOMADOR>
    <CONTRIBUINTEISS>${ERP_CONFIG.DEFAULTS.CONTRIBUINTEISS}</CONTRIBUINTEISS>
    <NUMDEPENDENTES>${ERP_CONFIG.DEFAULTS.NUMDEPENDENTES}</NUMDEPENDENTES>
    <USUARIOALTERACAO>${ERP_CONFIG.DEFAULTS.USUARIOALTERACAO}</USUARIOALTERACAO>
    <ORGAOPUBLICO>${ERP_CONFIG.DEFAULTS.ORGAOPUBLICO}</ORGAOPUBLICO>
    <IDCFO></IDCFO>
    <VROUTRASDEDUCOESIRRF>${ERP_CONFIG.DEFAULTS.VROUTRASDEDUCOESIRRF}</VROUTRASDEDUCOESIRRF>
    <CODRECEITA>${ERP_CONFIG.DEFAULTS.CODRECEITA}</CODRECEITA>
    <RAMOATIV>${ERP_CONFIG.DEFAULTS.RAMOATIV}</RAMOATIV>
    <OPTANTEPELOSIMPLES>${ERP_CONFIG.DEFAULTS.OPTANTEPELOSIMPLES}</OPTANTEPELOSIMPLES>
    <TIPORUA>${ERP_CONFIG.DEFAULTS.TIPORUA}</TIPORUA>
    <TIPOBAIRRO>${ERP_CONFIG.DEFAULTS.TIPOBAIRRO}</TIPOBAIRRO>
    <REGIMEISS>${ERP_CONFIG.DEFAULTS.REGIMEISS}</REGIMEISS>
    <RETENCAOISS>${ERP_CONFIG.DEFAULTS.RETENCAOISS}</RETENCAOISS>
    <USUARIOCRIACAO>${ERP_CONFIG.DEFAULTS.USUARIOCRIACAO}</USUARIOCRIACAO>
    <PORTE>${ERP_CONFIG.DEFAULTS.PORTE}</PORTE>
    <TIPOOPCOMBUSTIVEL>${ERP_CONFIG.DEFAULTS.TIPOOPCOMBUSTIVEL}</TIPOOPCOMBUSTIVEL>
    <IDPAIS>${ERP_CONFIG.DEFAULTS.IDPAIS}</IDPAIS>
    <NACIONALIDADE>${ERP_CONFIG.DEFAULTS.NACIONALIDADE}</NACIONALIDADE>
    <CALCULAAVP>${ERP_CONFIG.DEFAULTS.CALCULAAVP}</CALCULAAVP>
    <RECCREATEDBY>${ERP_CONFIG.DEFAULTS.RECCREATEDBY}</RECCREATEDBY>
    <RECCREATEDON>${currentDate}</RECCREATEDON>
    <RECMODIFIEDBY>${ERP_CONFIG.DEFAULTS.RECMODIFIEDBY}</RECMODIFIEDBY>
    <RECMODIFIEDON>${currentDate}</RECMODIFIEDON>
    <TIPORENDIMENTO>${ERP_CONFIG.DEFAULTS.TIPORENDIMENTO}</TIPORENDIMENTO>
    <FORMATRIBUTACAO>${ERP_CONFIG.DEFAULTS.FORMATRIBUTACAO}</FORMATRIBUTACAO>
    <SITUACAONIF>${ERP_CONFIG.DEFAULTS.SITUACAONIF}</SITUACAONIF>
    <ISTOTVSMESSAGE>${ERP_CONFIG.DEFAULTS.ISTOTVSMESSAGE}</ISTOTVSMESSAGE>
    <INOVAR_AUTO>${ERP_CONFIG.DEFAULTS.INOVAR_AUTO}</INOVAR_AUTO>
    <APLICFORMULA>${ERP_CONFIG.DEFAULTS.APLICFORMULA}</APLICFORMULA>
    <CODCFOCOLINTEGRACAO>${ERP_CONFIG.DEFAULTS.CODCFOCOLINTEGRACAO}</CODCFOCOLINTEGRACAO>
    <DIGVERIFICDEBAUTOMATICO>${ERP_CONFIG.DEFAULTS.DIGVERIFICDEBAUTOMATICO}</DIGVERIFICDEBAUTOMATICO>
    <ENTIDADEEXECUTORAPAA>${ERP_CONFIG.DEFAULTS.ENTIDADEEXECUTORAPAA}</ENTIDADEEXECUTORAPAA>
    <APOSENTADOOUPENSIONISTA>${ERP_CONFIG.DEFAULTS.APOSENTADOOUPENSIONISTA}</APOSENTADOOUPENSIONISTA>
    <SOCIOCOOPERADO>${ERP_CONFIG.DEFAULTS.SOCIOCOOPERADO}</SOCIOCOOPERADO>
  </FCFO>
  <FCFOCOMPL>
    <CODCOLIGADA>${ERP_CONFIG.DEFAULTS.CODCOLIGADA}</CODCOLIGADA>
    <CODCFO>-1</CODCFO>
    <NAOUSARCALCSIMPIRPF>${ERP_CONFIG.DEFAULTS.NAOUSARCALCSIMPIRPF}</NAOUSARCALCSIMPIRPF>
  </FCFOCOMPL>
</FinCFOBR>]]></XML>
         <Contexto>CODCOLIGADA=${ERP_CONFIG.DEFAULTS.CODCOLIGADA};CODUSUARIO='${ERP_CONFIG.AUTH.USERNAME}';CODSISTEMA=F</Contexto>
      </SaveRecord>
   </s:Body>
</s:Envelope>`;
  }

  static async realizarPreCadastro(cnpjData: CNPJData): Promise<{ success: boolean; message: string; erpCode?: string }> {
    try {
      console.log(`[ERP-SERVICE] Iniciando pré-cadastro no ERP para ${cnpjData.nome} (${cnpjData.cnpj})`);
      
      const soapEnvelope = this.createSOAPEnvelope(cnpjData);
      
      // Create Basic Auth header
      const credentials = Buffer.from(`${ERP_CONFIG.AUTH.USERNAME}:${ERP_CONFIG.AUTH.PASSWORD}`).toString('base64');
      
      console.log(`[ERP-SERVICE] Enviando requisição SOAP para ${ERP_CONFIG.SOAP_ENDPOINT}`);
      console.log(`[ERP-SERVICE] Username: ${ERP_CONFIG.AUTH.USERNAME}`);
      console.log(`[ERP-SERVICE] Credenciais Base64: ${credentials.substring(0, 20)}...`);
      console.log(`[ERP-SERVICE] Tamanho do envelope SOAP: ${soapEnvelope.length} caracteres`);
      console.log(`[ERP-SERVICE] === ENVELOPE SOAP COMPLETO ===`);
      console.log(soapEnvelope);
      console.log(`[ERP-SERVICE] === FIM ENVELOPE SOAP ===`);
      
      console.log(`[ERP-SERVICE] === DEBUG HEADERS SENDO ENVIADOS ===`);
      console.log(`[ERP-SERVICE] Accept-Encoding: gzip,deflate`);
      console.log(`[ERP-SERVICE] Content-Type: text/xml;charset=UTF-8`);
      console.log(`[ERP-SERVICE] SOAPAction: "http://www.totvs.com/IwsDataServer/SaveRecord"`);
      console.log(`[ERP-SERVICE] Authorization: Basic ${credentials}`);
      console.log(`[ERP-SERVICE] Content-Length: ${soapEnvelope.length}`);
      console.log(`[ERP-SERVICE] Host: legiaoda142257.rm.cloudtotvs.com.br:2201`);
      console.log(`[ERP-SERVICE] Connection: Keep-Alive`);
      console.log(`[ERP-SERVICE] User-Agent: Apache-HttpClient/4.5.5 (Java/16.0.2)`);
      console.log(`[ERP-SERVICE] === FIM DEBUG HEADERS ===`);

      const response = await fetch(ERP_CONFIG.SOAP_ENDPOINT, {
        method: 'POST',
        headers: {
          'Accept-Encoding': 'gzip,deflate',
          'Content-Type': 'text/xml;charset=UTF-8',
          'SOAPAction': '"http://www.totvs.com/IwsDataServer/SaveRecord"',
          'Authorization': `Basic ${credentials}`,
          'Content-Length': soapEnvelope.length.toString(),
          'Host': 'legiaoda142257.rm.cloudtotvs.com.br:2201',
          'Connection': 'Keep-Alive',
          'User-Agent': 'Apache-HttpClient/4.5.5 (Java/16.0.2)'
        },
        body: soapEnvelope,
        timeout: 30000 // 30 second timeout
      });

      const responseText = await response.text();
      console.log(`[ERP-SERVICE] Status da resposta: ${response.status} ${response.statusText}`);
      console.log(`[ERP-SERVICE] Headers de resposta:`, Object.fromEntries(response.headers.entries()));
      console.log(`[ERP-SERVICE] Tamanho da resposta: ${responseText.length} caracteres`);
      console.log(`[ERP-SERVICE] Resposta completa:`, responseText);

      if (!response.ok) {
        let errorMessage = `Erro na requisição ERP: ${response.status} - ${response.statusText}`;
        
        if (response.status === 404) {
          errorMessage = `Serviço ERP não encontrado no caminho especificado. Status: ${response.status}`;
        } else if (response.status === 401 || response.status === 403) {
          errorMessage = `Erro de autenticação no ERP. Verifique as credenciais. Status: ${response.status}`;
        } else if (response.status === 500) {
          errorMessage = `Erro interno do servidor ERP. O serviço pode estar temporariamente indisponível. Status: ${response.status}`;
        }
        
        // Log additional details for debugging
        console.log(`[ERP-SERVICE] Headers de resposta:`, Object.fromEntries(response.headers.entries()));
        
        throw new Error(errorMessage);
      }

      // Check if the response contains an error
      if (responseText.includes('soap:Fault') || responseText.includes('faultstring')) {
        const errorMatch = responseText.match(/<faultstring>(.*?)<\/faultstring>/);
        const errorMessage = errorMatch ? errorMatch[1] : 'Erro desconhecido no ERP';
        throw new Error(`Erro do ERP: ${errorMessage}`);
      }

      // Try to extract the ERP code from the response using the correct format
      let erpCode: string | undefined;
      // Look for the pattern <SaveRecordResult>1;09989435</SaveRecordResult>
      const resultMatch = responseText.match(/<SaveRecordResult>([^<]+)<\/SaveRecordResult>/);
      if (resultMatch) {
        const resultContent = resultMatch[1];
        // Split by semicolon and get the second part (the ERP code)
        const parts = resultContent.split(';');
        if (parts.length >= 2) {
          erpCode = parts[1];
        }
      }

      // Store the SOAP response for debugging
      this.storeSoapLog(cnpjData.cnpj, {
        request: soapEnvelope,
        response: responseText,
        timestamp: new Date().toISOString(),
        erpCode
      });

      console.log(`[ERP-SERVICE] Pré-cadastro realizado com sucesso. Código ERP: ${erpCode || 'não informado'}`);

      return {
        success: true,
        message: erpCode 
          ? `Pré-cadastro realizado com sucesso no ERP! Código do fornecedor: ${erpCode}`
          : 'Pré-cadastro enviado para o ERP. Aguarde o processamento.',
        erpCode
      };
    } catch (error) {
      console.error('[ERP-SERVICE] Erro no pré-cadastro:', error);
      
      // Store error log for debugging
      this.storeSoapLog(cnpjData.cnpj, {
        request: this.createSOAPEnvelope(cnpjData),
        response: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString(),
        erpCode: undefined
      });
      
      // Return more user-friendly error messages
      let message = 'Erro ao realizar pré-cadastro no ERP';
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          message = 'Erro de conexão com o ERP. Verifique sua internet e tente novamente.';
        } else if (error.message.includes('timeout')) {
          message = 'Tempo limite excedido. O ERP pode estar temporariamente indisponível.';
        } else {
          message = error.message;
        }
      }

      return {
        success: false,
        message
      };
    }
  }

  // Store SOAP log for debugging
  static storeSoapLog(cnpj: string, log: SoapLog): void {
    if (!soapLogs.has(cnpj)) {
      soapLogs.set(cnpj, []);
    }
    const logs = soapLogs.get(cnpj)!;
    logs.push(log);
    
    // Keep only the last 10 logs per CNPJ
    if (logs.length > 10) {
      logs.shift();
    }
  }

  // Get SOAP logs for a specific CNPJ
  static getSoapLogs(cnpj: string): SoapLog[] {
    return soapLogs.get(cnpj) || [];
  }

  // Clear SOAP logs for a specific CNPJ
  static clearSoapLogs(cnpj: string): boolean {
    const existed = soapLogs.has(cnpj);
    soapLogs.delete(cnpj);
    return existed;
  }

  // Get all SOAP logs (for admin purposes)
  static getAllSoapLogs(): Map<string, SoapLog[]> {
    return soapLogs;
  }

  /**
   * Verifica se um DPS já existe na Sefin Nacional
   * @param dpsNumber Número completo do DPS (ex: DPS355400325743108800011300900000000000000063)
   * @returns Objeto com status de existência e dados da NFSe se existir
   */
  static async verificarDPSExistente(dpsNumber: string): Promise<{
    exists: boolean;
    chaveAcesso?: string;
    erro?: string;
    codigo?: string;
  }> {
    try {
      console.log(`[ERP-SERVICE] Verificando DPS na Sefin Nacional: ${dpsNumber}`);
      
      const url = `https://sefin.nfse.gov.br/SefinNacional/dps/${dpsNumber}`;
      
      console.log(`[ERP-SERVICE] Fazendo GET em: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'PortalRM/1.0'
        }
      });

      console.log(`[ERP-SERVICE] Resposta da Sefin: ${response.status} ${response.statusText}`);
       
      let responseData;
      const responseText = await response.text();
      
      try {
        responseData = JSON.parse(responseText);
        console.log(`[ERP-SERVICE] Dados retornados:`, responseData);
      } catch (parseError) {
        // Se não for JSON, provavelmente é HTML (página de erro ou não encontrado)
        console.log(`[ERP-SERVICE] Resposta não é JSON, tratando como DPS não encontrado`);
        console.log(`[ERP-SERVICE] Texto da resposta: ${responseText.substring(0, 200)}...`);
        
        // Para DPS não encontrado, a Sefin geralmente retorna 404 ou página HTML
        if (response.status === 404 || responseText.includes('not found') || responseText.includes('não encontrado')) {
          return {
            exists: false,
            codigo: 'E2404',
            erro: 'Não foi gerada uma NFS-e com o identificador de DPS informado'
          };
        }
        
        // Para outros erros de HTML
        return {
          exists: false,
          erro: `Erro na consulta: ${response.status} - Página HTML retornada`,
          codigo: `HTTP_${response.status}`
        };
      }

      // Se retornou 200 com chave de acesso, o DPS já existe
      if (response.ok && responseData.chaveAcesso) {
        console.log(`[ERP-SERVICE] DPS ${dpsNumber} já existe! Chave: ${responseData.chaveAcesso}`);
        return {
          exists: true,
          chaveAcesso: responseData.chaveAcesso
        };
      }
      
      // Se retornou erro E2404, o DPS não existe (disponível)
      if (responseData.erro?.codigo === 'E2404') {
        console.log(`[ERP-SERVICE] DPS ${dpsNumber} está disponível!`);
        return {
          exists: false,
          codigo: responseData.erro.codigo
        };
      }
      
      // Outros erros
      if (responseData.erro) {
        console.log(`[ERP-SERVICE] Erro ao verificar DPS: ${responseData.erro.descricao}`);
        return {
          exists: false,
          erro: responseData.erro.descricao,
          codigo: responseData.erro.codigo
        };
      }
      
      // Resposta inesperada
      console.log(`[ERP-SERVICE] Resposta inesperada da Sefin:`, responseData);
      return {
        exists: false,
        erro: 'Resposta inesperada da Sefin Nacional'
      };
      
    } catch (error) {
      console.error(`[ERP-SERVICE] Erro ao verificar DPS:`, error);
      
      // Se for erro de rede, consideramos como "não existe" para não bloquear
      if (error instanceof Error && error.message.includes('fetch')) {
        console.log(`[ERP-SERVICE] Erro de rede - assumindo DPS como disponível`);
        return {
          exists: false,
          erro: 'Erro de conexão com Sefin Nacional - DPS considerado disponível'
        };
      }
      
      return {
        exists: false,
        erro: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Encontra o próximo DPS disponível incrementando o número
   * @param dpsBase Número base do DPS (sem o sufixo incremental)
   * @param maxTentativas Número máximo de tentativas (padrão: 100)
   * @returns Próximo DPS disponível ou null se não encontrar
   */
  static async encontrarDPSDisponivel(dpsBase: string, maxTentativas: number = 100): Promise<string | null> {
    console.log(`[ERP-SERVICE] Procurando DPS disponível a partir de: ${dpsBase}`);
    
    // Extrair partes do DPS para incrementar
    const partes = dpsBase.match(/^(DPS\d+)(\d+)$/);
    if (!partes) {
      console.error(`[ERP-SERVICE] Formato de DPS inválido: ${dpsBase}`);
      return null;
    }
    
    const prefixo = partes[1]; // DPS3554003257431088000113009
    const numeroStr = partes[2]; // 000000000000063
    const comprimento = numeroStr.length; // Manter zeros à esquerda
    
    let numero = parseInt(numeroStr, 10);
    
    for (let tentativa = 0; tentativa < maxTentativas; tentativa++) {
      const dpsTestado = prefixo + numero.toString().padStart(comprimento, '0');
      
      console.log(`[ERP-SERVICE] Tentativa ${tentativa + 1}: Verificando ${dpsTestado}`);
      
      const resultado = await this.verificarDPSExistente(dpsTestado);
      
      if (!resultado.exists) {
        console.log(`[ERP-SERVICE] DPS disponível encontrado: ${dpsTestado}`);
        return dpsTestado;
      }
      
      console.log(`[ERP-SERVICE] DPS ${dpsTestado} já existe, tentando próximo...`);
      numero++;
    }
    
    console.error(`[ERP-SERVICE] Nenhum DPS disponível encontrado após ${maxTentativas} tentativas`);
    return null;
  }
}