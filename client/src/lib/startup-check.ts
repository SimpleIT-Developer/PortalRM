import { AuthService } from "./auth";
import { getTenant } from "@/lib/tenant";

const getReadRecordSoap = (sentenceId: string) => {
  return `
 <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tot="http://www.totvs.com/"> 
    <soapenv:Header/> 
    <soapenv:Body> 
       <tot:ReadRecord> 
          <!--Optional:--> 
          <tot:DataServerName>GlbConsSqlData</tot:DataServerName> 
          <!--Optional:--> 
          <tot:PrimaryKey>1;T;${sentenceId}</tot:PrimaryKey> 
          <!--Optional:--> 
          <tot:Contexto>CODCOLIGADA=1;CODUSUARIO='mestre';CODSISTEMA=T</tot:Contexto> 
       </tot:ReadRecord> 
    </soapenv:Body> 
 </soapenv:Envelope>`;
};

export const StartupCheckService = {
  async fetchSentences(): Promise<string[]> {
    try {
      const response = await fetch('/api/config/sentences', {
        headers: {
          ...(getTenant() ? { 'X-Tenant': getTenant()! } : {})
        }
      });
      if (!response.ok) {
        console.warn("Falha ao carregar lista de sentenças, usando lista padrão vazia.");
        return [];
      }
      const data = await response.json();
      return data.sentences || [];
    } catch (error) {
      console.error("Erro ao buscar sentenças:", error);
      return [];
    }
  },

  async checkConfiguration(onProgress?: (sentence: string, current: number, total: number) => void): Promise<{ success: boolean; missing: string[] }> {
    const token = AuthService.getStoredToken();

    if (!token || !token.access_token) {
      throw new Error("Usuário não autenticado");
    }

    if (!token.environmentId) {
       throw new Error("Ambiente não identificado no token");
    }

    const requiredSentences = await StartupCheckService.fetchSentences();
    
    if (requiredSentences.length === 0) {
      console.log("Nenhuma sentença configurada para verificação.");
      return { success: true, missing: [] };
    }

    const missingSentences: string[] = [];
    const logItems: { sentence: string; status: 'ok' | 'error'; message?: string }[] = [];

    // Check sentences sequentially to allow progress updates
    let index = 0;
    const total = requiredSentences.length;

    for (const sentenceId of requiredSentences) {
      index++;
      if (onProgress) {
        onProgress(sentenceId, index, total);
      }

      try {
        const soapXml = getReadRecordSoap(sentenceId);
        const soapPath = "/wsDataServer/IwsDataServer";
        const proxyUrl = `/api/proxy-soap?environmentId=${encodeURIComponent(token.environmentId)}&path=${encodeURIComponent(soapPath)}&token=${encodeURIComponent(token.access_token)}`;

        const response = await fetch(proxyUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(getTenant() ? { 'X-Tenant': getTenant()! } : {})
          },
          body: JSON.stringify({
            xml: soapXml,
            action: "http://www.totvs.com/IwsDataServer/ReadRecord"
          })
        });

        if (!response.ok) {
           console.error(`Falha na requisição para ${sentenceId}: ${response.status}`);
           missingSentences.push(sentenceId);
           logItems.push({ sentence: sentenceId, status: 'error', message: `Erro HTTP: ${response.status}` });
           continue;
        }

        const responseText = await response.text();
        
        if (responseText.includes("&lt;GlbConsSql /&gt;") || responseText.includes("<GlbConsSql />")) {
             missingSentences.push(sentenceId);
             logItems.push({ sentence: sentenceId, status: 'error', message: 'Retorno vazio (GlbConsSql)' });
             continue;
        }
        
        if (responseText.includes("<ReadRecordResult/>") || responseText.includes("<ReadRecordResult />")) {
            missingSentences.push(sentenceId);
            logItems.push({ sentence: sentenceId, status: 'error', message: 'Retorno vazio (ReadRecordResult)' });
            continue;
        }

        logItems.push({ sentence: sentenceId, status: 'ok', message: 'Verificado com sucesso' });

      } catch (error) {
        console.error(`Erro ao verificar ${sentenceId}:`, error);
        missingSentences.push(sentenceId);
        logItems.push({ sentence: sentenceId, status: 'error', message: error instanceof Error ? error.message : String(error) });
      }
    }

    // Salvar log no localStorage para consulta posterior
    try {
        const logData = {
            timestamp: new Date().toISOString(),
            items: logItems
        };
        localStorage.setItem('startup_check_log', JSON.stringify(logData));
    } catch (e) {
        console.error("Erro ao salvar log de verificação", e);
    }

    return {
      success: missingSentences.length === 0,
      missing: missingSentences
    };
  }
};
