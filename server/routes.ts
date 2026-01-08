import type { Express } from "express";
import { createServer, type Server } from "http";
import { readFileSync, writeFile, unlinkSync } from "fs";
import { join } from "path";
// @ts-ignore
import { storage } from "./storage.js";
import { registerSimpleDFeRoutes } from "./simpledfe/routes";

export async function registerRoutes(app: Express): Promise<Server> {
  // Register SimpleDFe routes first
  await registerSimpleDFeRoutes(app);

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
    } catch (err) {
      const error = err as any;
      console.error("❌ Proxy GET - Erro:", error);
      res.status(500).json({ 
        error: "Erro interno do servidor",
        message: error.message || "Erro desconhecido"
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

      // Log request to file
      try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const actionName = action ? action.split('/').pop() : 'unknown';
        const filename = `req_${timestamp}_${actionName}.xml`;
        const filePath = join("d:\\PortalRM\\requisições", filename);
        
        writeFile(filePath, xml, (err) => {
            if (err) console.error("❌ Erro ao salvar log da requisição:", err);
            else console.log("📝 Log da requisição salvo em:", filePath);
        });
      } catch (logError) {
        console.error("❌ Erro ao tentar salvar log:", logError);
      }

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

  const httpServer = createServer(app);

  return httpServer;
}
