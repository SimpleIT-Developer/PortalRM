import type { Express } from "express";
import { createServer, type Server } from "http";
import { readFileSync } from "fs";
import { join } from "path";
import { storage } from "./storage";
import { queryExternalDb } from "./external-db";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      message: "TOTVS RM Authentication Service" 
    });
  });

  // Endpoint configuration
  app.get("/api/endpoints", (req, res) => {
    try {
      const endpointsPath = join(process.cwd(), "env", "endpoint.txt");
      const content = readFileSync(endpointsPath, "utf-8");
      const lines = content.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
      
      res.json({ endpoints: lines });
    } catch (error) {
      console.error("Erro ao ler arquivo de endpoints:", error);
      res.json({ 
        endpoints: ["erp-simpleit.sytes.net:8051"],
        error: "Arquivo de configuração não encontrado, usando padrão"
      });
    }
  });

  // TOTVS Authentication Proxy - handles CORS issues
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { endpoint, ...credentials } = req.body;
      
      if (!endpoint) {
        return res.status(400).json({ error: "Endpoint é obrigatório" });
      }

      console.log("🔗 Proxy - Autenticando em:", `${endpoint}/api/connect/token`);
      console.log("📤 Proxy - Dados:", credentials);

      const response = await fetch(`${endpoint}/api/connect/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.log("⚠️ Proxy - Erro:", response.status, data);
        return res.status(response.status).json(data);
      }

      console.log("✅ Proxy - Sucesso");
      res.json(data);
    } catch (error) {
      console.error("❌ Proxy - Erro:", error);
      res.status(500).json({ 
        error: "Erro interno do servidor",
        message: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });

  // TOTVS Token Refresh Proxy
  app.post("/api/auth/refresh", async (req, res) => {
    try {
      const { endpoint, ...refreshData } = req.body;
      
      if (!endpoint) {
        return res.status(400).json({ error: "Endpoint é obrigatório" });
      }

      console.log("🔄 Proxy - Renovando token em:", `${endpoint}/api/connect/token`);

      const response = await fetch(`${endpoint}/api/connect/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(refreshData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.log("⚠️ Proxy - Erro na renovação:", response.status, data);
        return res.status(response.status).json(data);
      }

      console.log("✅ Proxy - Token renovado com sucesso");
      res.json(data);
    } catch (error) {
      console.error("❌ Proxy - Erro na renovação:", error);
      res.status(500).json({ 
        error: "Erro interno do servidor",
        message: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });

  // TOTVS API Proxy - handles CORS for all API calls
  app.get("/api/proxy", async (req, res) => {
    try {
      const { endpoint, path, token } = req.query;
      
      if (!endpoint || !path) {
        return res.status(400).json({ error: "Endpoint e path são obrigatórios" });
      }

      // Garantir que o endpoint tenha o protocolo http://
      const formattedEndpoint = endpoint.toString().replace(/^https?:\/\//i, '');
      const fullUrl = `http://${formattedEndpoint}${path}`;
      console.log("🔗 Proxy GET - Consultando:", fullUrl);

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (token) {
        // Usar o token exatamente como foi passado pelo cliente
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(fullUrl, {
        method: "GET",
        headers,
      });

      // Verificar se a resposta é válida antes de tentar parsear como JSON
      let data;
      try {
        const text = await response.text();
        data = text ? JSON.parse(text) : {};
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
        console.log("❌ Proxy GET - Erro ao parsear resposta:", errorMessage);
        return res.status(500).json({ error: "Erro ao processar resposta do servidor", message: errorMessage });
      }
      
      if (!response.ok) {
        console.log("⚠️ Proxy GET - Erro:", response.status, data);
        return res.status(response.status).json(data);
      }

      console.log("✅ Proxy GET - Sucesso");
      res.json(data);
    } catch (error) {
      console.error("❌ Proxy GET - Erro:", error);
      res.status(500).json({ 
        error: "Erro interno do servidor",
        message: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });

  // TOTVS SOAP Proxy
  app.post("/api/proxy-soap", async (req, res) => {
    try {
      const { endpoint, path, token } = req.query;
      const { xml, action, basicAuth, username, password } = req.body;
      
      if (!endpoint || !path || !xml) {
        return res.status(400).json({ error: "Endpoint, path e xml são obrigatórios" });
      }

      // Garantir que o endpoint tenha o protocolo http://
      const formattedEndpoint = endpoint.toString().replace(/^https?:\/\//i, '');
      const fullUrl = `http://${formattedEndpoint}${path}`;
      console.log("🔗 Proxy SOAP - Enviando para:", fullUrl);
      console.log("⚡ Action:", action);

      const headers: Record<string, string> = {
        "Content-Type": "text/xml; charset=utf-8",
      };

      if (action) {
        headers["SOAPAction"] = action;
      }

      if (basicAuth && username && password) {
         // Se for Basic Auth, usa as credenciais fornecidas
         const credentials = Buffer.from(`${username}:${password}`).toString('base64');
         headers["Authorization"] = `Basic ${credentials}`;
      } else if (token) {
         // Se tiver token Bearer, usa ele
         headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(fullUrl, {
        method: "POST",
        headers,
        body: xml
      });

      const responseText = await response.text();
      
      console.log("📥 Proxy SOAP - Status:", response.status);
      
      if (!response.ok) {
        console.log("⚠️ Proxy SOAP - Erro Body:", responseText);
        return res.status(response.status).json({ error: "Erro na requisição SOAP", details: responseText });
      }

      console.log("✅ Proxy SOAP - Sucesso (tamanho):", responseText.length);
      res.json({ response: responseText });

    } catch (error) {
      console.error("❌ Proxy SOAP - Erro:", error);
      res.status(500).json({ 
        error: "Erro interno do servidor",
        message: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });

  // Endpoint NFe
  app.get("/api/nfe", async (req, res) => {
    try {
      console.log("🔄 [MySQL] Buscando dados da tabela doc (Aplicação-Side Join)...");
      
      // 1. Buscar Documentos (Limite reduzido para performance inicial, mas paginável no futuro)
      // Selecionando apenas colunas necessárias + chaves para o join
      const docsResult = await queryExternalDb(`
        SELECT doc_id, doc_num, doc_dest_nome, doc_emit_nome, doc_date_emi, 
               doc_valor, doc_status, doc_status_integracao, doc_chave, doc_id_company,
               doc_codcfo 
        FROM doc 
        ORDER BY doc_id DESC 
        LIMIT 100
      `);
      
      const docs = docsResult.rows || [];
      console.log(`✅ [MySQL] Docs encontrados: ${docs.length} registros`);

      if (docs.length === 0) {
        return res.json([]);
      }

      // 2. Coletar Chaves para buscar eventos
      // Filtra chaves válidas para evitar query inválida
      const validDocs = docs.filter((d: any) => d.doc_chave && typeof d.doc_chave === 'string' && d.doc_chave.length > 0);
      
      if (validDocs.length > 0) {
        // Formatar chaves para cláusula IN ('chave1', 'chave2')
        const chaves = validDocs.map((d: any) => `'${d.doc_chave}'`).join(',');
        
        console.log(`🔄 [MySQL] Buscando eventos de cancelamento para ${validDocs.length} notas...`);
        
        // 3. Buscar Eventos de Cancelamento
        // Trazemos eventos_chave para mapear de volta
        const eventsQuery = `
          SELECT eventos_chave, eventos_desc_evento 
          FROM eventos 
          WHERE eventos_chave IN (${chaves}) 
          AND (eventos_desc_evento LIKE '%cancelamento%' OR eventos_desc_evento LIKE '%Cancelamento%')
        `;
        
        try {
            const eventsResult = await queryExternalDb(eventsQuery);
            const events = eventsResult.rows || [];
            console.log(`✅ [MySQL] Eventos de cancelamento encontrados: ${events.length}`);

            // 4. Merge em Memória
            const docsWithStatus = docs.map((doc: any) => {
                // Encontrar evento correspondente
                // Normaliza para lowercase para garantir
                const cancelEvent = events.find((e: any) => 
                    e.eventos_chave === doc.doc_chave && 
                    e.eventos_desc_evento && 
                    e.eventos_desc_evento.toLowerCase().includes('cancelamento')
                );

                return {
                    ...doc,
                    eventos_desc_evento: cancelEvent ? cancelEvent.eventos_desc_evento : null,
                    is_cancelled: !!cancelEvent
                };
            });
            
            res.json(docsWithStatus);
            return;

        } catch (eventError) {
            console.error("❌ [MySQL] Erro ao buscar eventos:", eventError);
            // Em caso de erro nos eventos, retorna os docs sem status de cancelamento para não quebrar a grid
            res.json(docs);
            return;
        }
      }

      // Se não tem chaves válidas, retorna docs
      res.json(docs);

    } catch (error) {
      console.error("❌ [MySQL] Erro ao buscar dados:", error);
      
      res.status(500).json({ 
        error: "Erro ao buscar dados",
        message: error instanceof Error ? error.message : "Erro desconhecido",
        details: "Verifique a conexão com o banco de dados MySQL."
      });
    }
  });

  // Endpoint NFSe
  app.get("/api/nfse", async (req, res) => {
    try {
      console.log("🔄 [MySQL] Buscando dados da tabela nfse (Aplicação-Side Join)...");
      
      // 1. Buscar Documentos
      const result = await queryExternalDb(`
        SELECT nfse_id, nfse_nsu, nfse_tomador, nfse_emitente, 
               nfse_data_hora, nfse_valor_servico, nfse_status_integracao, 
               nfse_chave, nfse_cod_cfo 
        FROM nfse 
        ORDER BY nfse_id DESC 
        LIMIT 100
      `);
      const docs = result.rows || [];
      
      console.log(`✅ [MySQL] NFSe encontradas: ${docs.length} registros`);
      
      if (docs.length === 0) {
        return res.json([]);
      }

      // 2. Coletar Chaves (Tentando identificar a chave da NFSe, geralmente nfse_chave ou nfse_cod_verificacao)
      // Assumindo nfse_chave para compatibilidade com eventos
      const validDocs = docs.filter((d: any) => d.nfse_chave && typeof d.nfse_chave === 'string' && d.nfse_chave.length > 0);

      if (validDocs.length > 0) {
         const chaves = validDocs.map((d: any) => `'${d.nfse_chave}'`).join(',');
         
         // 3. Buscar Eventos
         const eventsQuery = `
           SELECT eventos_chave, eventos_desc_evento 
           FROM eventos 
           WHERE eventos_chave IN (${chaves}) 
           AND (eventos_desc_evento LIKE '%cancelamento%' OR eventos_desc_evento LIKE '%Cancelamento%')
         `;
         
         try {
             const eventsResult = await queryExternalDb(eventsQuery);
             const events = eventsResult.rows || [];
             
             // 4. Merge
             const docsWithStatus = docs.map((doc: any) => {
                 const cancelEvent = events.find((e: any) => 
                     e.eventos_chave === doc.nfse_chave && 
                     e.eventos_desc_evento && 
                     e.eventos_desc_evento.toLowerCase().includes('cancelamento')
                 );

                 return {
                     ...doc,
                     eventos_desc_evento: cancelEvent ? cancelEvent.eventos_desc_evento : null,
                     is_cancelled: !!cancelEvent
                 };
             });
             
             res.json(docsWithStatus);
             return;
         } catch (e) {
             console.error("❌ [MySQL] Erro ao buscar eventos NFSe:", e);
             res.json(docs); // Fallback
             return;
         }
      }
      
      res.json(docs);
    } catch (error) {
      console.error("❌ [MySQL] Erro ao buscar NFSe:", error);
      
      // Fallback para erro de coluna
      if (error instanceof Error && error.message.includes("column")) {
        try {
            const result = await queryExternalDb("SELECT * FROM nfse LIMIT 100");
            res.json(result.rows || []);
            return;
        } catch (retryError) {
            console.error("❌ [MySQL] Erro no retry NFSe:", retryError);
        }
      }

      res.status(500).json({ 
        error: "Erro ao buscar dados",
        message: error instanceof Error ? error.message : "Erro desconhecido",
        details: "Verifique se a tabela 'nfse' existe no banco de dados."
      });
    }
  });

  // Endpoint CTe
  app.get("/api/cte", async (req, res) => {
    try {
      console.log("🔄 [MySQL] Buscando dados da tabela cte (Aplicação-Side Join)...");
      
      // 1. Buscar Documentos
      const result = await queryExternalDb(`
        SELECT cte_id, cte_num, cte_tom_raz_social, cte_emit_raz_social, 
               cte_emissao, cte_valor_total, cte_status_integracao, 
               cte_chave, cte_cod_cfo, cte_cod_emitente, cte_status 
        FROM cte 
        ORDER BY STR_TO_DATE(cte_emissao, '%d/%m/%Y') DESC 
        LIMIT 100
      `);
      const docs = result.rows || [];
      
      console.log(`✅ [MySQL] CTe encontrados: ${docs.length} registros`);
      
      if (docs.length === 0) {
        return res.json([]);
      }
      
      // 2. Coletar Chaves
      const validDocs = docs.filter((d: any) => d.cte_chave && typeof d.cte_chave === 'string' && d.cte_chave.length > 0);

      if (validDocs.length > 0) {
         const chaves = validDocs.map((d: any) => `'${d.cte_chave}'`).join(',');
         
         // 3. Buscar Eventos
         const eventsQuery = `
           SELECT eventos_chave, eventos_desc_evento 
           FROM eventos 
           WHERE eventos_chave IN (${chaves}) 
           AND (eventos_desc_evento LIKE '%cancelamento%' OR eventos_desc_evento LIKE '%Cancelamento%')
         `;
         
         try {
             const eventsResult = await queryExternalDb(eventsQuery);
             const events = eventsResult.rows || [];
             
             // 4. Merge
             const docsWithStatus = docs.map((doc: any) => {
                 const cancelEvent = events.find((e: any) => 
                     e.eventos_chave === doc.cte_chave && 
                     e.eventos_desc_evento && 
                     e.eventos_desc_evento.toLowerCase().includes('cancelamento')
                 );

                 return {
                     ...doc,
                     eventos_desc_evento: cancelEvent ? cancelEvent.eventos_desc_evento : null,
                     is_cancelled: !!cancelEvent
                 };
             });
             
             res.json(docsWithStatus);
             return;
         } catch (e) {
             console.error("❌ [MySQL] Erro ao buscar eventos CTe:", e);
             res.json(docs); // Fallback
             return;
         }
      }

      res.json(docs);
    } catch (error) {
      console.error("❌ [MySQL] Erro ao buscar CTe:", error);
      
      // Fallback
      if (error instanceof Error && error.message.includes("column")) {
        try {
            const result = await queryExternalDb("SELECT * FROM cte LIMIT 100");
            res.json(result.rows || []);
            return;
        } catch (retryError) {
             console.error("❌ [MySQL] Erro no retry CTe:", retryError);
        }
      }

      res.status(500).json({ 
        error: "Erro ao buscar dados",
        message: error instanceof Error ? error.message : "Erro desconhecido",
        details: "Verifique se a tabela 'cte' existe no banco de dados."
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
