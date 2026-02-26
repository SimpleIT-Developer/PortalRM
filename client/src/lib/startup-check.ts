import { AuthService } from "./auth";
import { getTenant } from "@/lib/tenant";
import { getCreateSqlSentenceSoap } from "./soap-templates";
import { parseSentenceContent, findSentenceByCod } from "./sentence-parser";

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

  async fetchSentenceContent(): Promise<string> {
    try {
      const response = await fetch('/api/config/sentence-content', {
        headers: {
          ...(getTenant() ? { 'X-Tenant': getTenant()! } : {})
        }
      });
      if (!response.ok) {
        console.warn("Falha ao carregar conteúdo das sentenças.");
        return "";
      }
      const data = await response.text();
      return data;
    } catch (error) {
      console.error("Erro ao buscar conteúdo das sentenças:", error);
      return "";
    }
  },

  async createMissingSentence(sentenceId: string, sentenceContent: string, username: string): Promise<boolean> {
    const token = AuthService.getStoredToken();

    if (!token || !token.access_token) {
      throw new Error("Usuário não autenticado");
    }

    if (!token.environmentId) {
       throw new Error("Ambiente não identificado no token");
    }

    try {
      // Parse the sentence content to get title and SQL
      const allSentences = parseSentenceContent(sentenceContent);
      const sentenceInfo = findSentenceByCod(sentenceId, allSentences);
      
      if (!sentenceInfo) {
        console.error(`Sentença ${sentenceId} não encontrada no arquivo de conteúdo`);
        return false;
      }

      console.log(`Criando sentença ${sentenceId}: ${sentenceInfo.titulo}`);

      // Create the SOAP request to create the sentence
      const soapXml = getCreateSqlSentenceSoap(
        sentenceInfo.codSentenca,
        sentenceInfo.titulo,
        sentenceInfo.sentenca,
        username
      );

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
          action: "http://www.totvs.com/IwsDataServer/SaveRecord"
        })
      });

      if (!response.ok) {
        console.error(`Falha ao criar sentença ${sentenceId}: ${response.status}`);
        return false;
      }

      const responseText = await response.text();
      
      // Check if creation was successful
      if (responseText.includes("SaveRecordResult") && !responseText.includes("erro")) {
        console.log(`Sentença ${sentenceId} criada com sucesso`);
        return true;
      } else {
        console.error(`Erro ao criar sentença ${sentenceId}: ${responseText}`);
        return false;
      }

    } catch (error) {
      console.error(`Erro ao criar sentença ${sentenceId}:`, error);
      return false;
    }
  },

  async checkAndCreateMissingSentences(onProgress?: (sentence: string, current: number, total: number, action: 'checking' | 'creating') => void): Promise<{ success: boolean; missing: string[]; created: string[] }> {
    const token = AuthService.getStoredToken();

    if (!token || !token.access_token) {
      throw new Error("Usuário não autenticado");
    }

    if (!token.environmentId) {
       throw new Error("Ambiente não identificado no token");
    }

    const requiredSentences = await StartupCheckService.fetchSentences();
    const sentenceContent = await StartupCheckService.fetchSentenceContent();
    
    if (requiredSentences.length === 0) {
      console.log("Nenhuma sentença configurada para verificação.");
      try {
        const logData = {
          timestamp: new Date().toISOString(),
          items: [{ sentence: "-", status: 'ok' as const, message: "Nenhuma sentença configurada para verificação" }]
        };
        localStorage.setItem('startup_check_log', JSON.stringify(logData));
      } catch (e) {
        console.error("Erro ao salvar log de verificação", e);
      }
      return { success: true, missing: [], created: [] };
    }

    const missingSentences: string[] = [];
    const createdSentences: string[] = [];
    const logItems: { sentence: string; status: 'ok' | 'error' | 'created'; message?: string }[] = [];

    // Check sentences sequentially to allow progress updates
    let index = 0;
    const total = requiredSentences.length;

    // Retry configuration
    const MAX_RETRIES = 1; // Tentar mais uma vez no final se falhar
    const REQUEST_TIMEOUT = 5000; // 5 segundos de timeout (reduzido de 10s)

    const pendingRetries: string[] = [];

    // Helper function to check a single sentence
    const checkSentence = async (sentenceId: string): Promise<boolean> => {
        try {
            const soapXml = getReadRecordSoap(sentenceId);
            const soapPath = "/wsDataServer/IwsDataServer";
            const proxyUrl = `/api/proxy-soap?environmentId=${encodeURIComponent(token.environmentId)}&path=${encodeURIComponent(soapPath)}&token=${encodeURIComponent(token.access_token)}`;

            // Timeout para evitar travamento
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

            const response = await fetch(proxyUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(getTenant() ? { 'X-Tenant': getTenant()! } : {})
                },
                body: JSON.stringify({
                    xml: soapXml,
                    action: "http://www.totvs.com/IwsDataServer/ReadRecord"
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                console.error(`Falha na requisição para ${sentenceId}: ${response.status}`);
                return false;
            }

            const responseText = await response.text();

            if (responseText.includes("&lt;GlbConsSql /&gt;") || responseText.includes("<GlbConsSql />") ||
                responseText.includes("<ReadRecordResult/>") || responseText.includes("<ReadRecordResult />")) {
                 return false;
            }

            return true;
        } catch (error: any) {
            console.error(`Erro ao verificar ${sentenceId}:`, error);
            return false;
        }
    };

    // First pass
    for (const sentenceId of requiredSentences) {
      index++;
      if (onProgress) {
        onProgress(sentenceId, index, total, 'checking');
      }

      const isOk = await checkSentence(sentenceId);
      
      if (isOk) {
          logItems.push({ sentence: sentenceId, status: 'ok', message: 'Verificado com sucesso' });
      } else {
          // Add to retry list instead of failing immediately
          pendingRetries.push(sentenceId);
          // Don't log error yet, wait for retry
      }
    }

    // Retry pass for failed items
    if (pendingRetries.length > 0) {
        console.log(`Retrying ${pendingRetries.length} failed sentences...`);
        
        for (const sentenceId of pendingRetries) {
            // Update progress (keep index at 100% basically, or show specific retry message if UI supported it)
             if (onProgress) {
                onProgress(sentenceId, total, total, 'checking');
             }

            const isOk = await checkSentence(sentenceId);

            if (isOk) {
                logItems.push({ sentence: sentenceId, status: 'ok', message: 'Verificado com sucesso (após retry)' });
            } else {
                missingSentences.push(sentenceId);
                logItems.push({ sentence: sentenceId, status: 'error', message: 'Falha na verificação (timeout ou erro)' });
            }
        }
    }

    // Now create missing sentences
    if (missingSentences.length > 0 && sentenceContent) {
      console.log(`Encontradas ${missingSentences.length} sentenças faltantes. Criando automaticamente...`);
      
      for (let i = 0; i < missingSentences.length; i++) {
        const sentenceId = missingSentences[i];
        if (onProgress) {
          onProgress(sentenceId, i + 1, missingSentences.length, 'creating');
        }
        
        const created = await StartupCheckService.createMissingSentence(sentenceId, sentenceContent, token.username);
        if (created) {
          createdSentences.push(sentenceId);
          // Update log to show it was created
          const logIndex = logItems.findIndex(item => item.sentence === sentenceId);
          if (logIndex !== -1) {
            logItems[logIndex].status = 'created';
            logItems[logIndex].message = 'Criada automaticamente';
          }
        }
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
      success: missingSentences.length === createdSentences.length,
      missing: missingSentences.filter(id => !createdSentences.includes(id)),
      created: createdSentences
    };
  },

  // Legacy method for backward compatibility
  async checkConfiguration(onProgress?: (sentence: string, current: number, total: number) => void): Promise<{ success: boolean; missing: string[] }> {
    const result = await StartupCheckService.checkAndCreateMissingSentences((sentence, current, total, action) => {
      if (onProgress && action === 'checking') {
        onProgress(sentence, current, total);
      }
    });
    
    return {
      success: result.success,
      missing: result.missing
    };
  }
};