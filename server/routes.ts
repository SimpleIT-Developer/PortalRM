import type { Express } from "express";
import { createServer, type Server } from "http";
import { readFileSync, writeFile, unlinkSync } from "fs";
import { join } from "path";
// @ts-ignore
import { storage } from "./storage.js";
import { registerSimpleDFeRoutes } from "./simpledfe/routes";
import { connectToMongo } from "./db-mongo";
import { ConfigUser } from "./models/ConfigUser";
import { TenantService } from "./services/tenant-service";
import { Tenant } from "./models/Tenant";
import { PlatformAdmin } from "./models/PlatformAdmin";
import bcrypt from "bcrypt";

function toPlainObject(input: any): Record<string, any> {
  if (!input) return {};
  if (input instanceof Map) return Object.fromEntries(input.entries());
  return input;
}

function normalizeConfigMap(input: any): Record<string, boolean> {
  const source = toPlainObject(input);
  const out: Record<string, boolean> = {};
  for (const [key, value] of Object.entries(source)) {
    const normalizedKey = key.replace(/_/g, "-");
    const isHyphenKey = key === normalizedKey;
    const boolValue = Boolean(value);
    if (!(normalizedKey in out)) {
      out[normalizedKey] = boolValue;
      continue;
    }
    if (isHyphenKey) {
      out[normalizedKey] = boolValue;
    }
  }
  return out;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Connect to MongoDB
  await connectToMongo();

  // Public Tenant Config (For Login Page)
  app.get("/api/public/tenant-config/:tenantKey", async (req, res) => {
    try {
      const { tenantKey } = req.params;
      console.log("🔍 Buscando configuração pública do tenant:", tenantKey);
      
      const tenant = await Tenant.findOne({ tenantKey });
      
      if (!tenant) {
        console.log("❌ Tenant não encontrado:", tenantKey);
        return res.status(404).json({ error: "Tenant não encontrado" });
      }

      if (tenant.status !== 'active' && tenant.status !== 'trial') {
         console.log("⚠️ Tenant inativo ou bloqueado:", tenantKey, tenant.status);
         return res.status(403).json({ error: "Acesso ao tenant indisponível" });
      }

      // Retornar apenas dados seguros/necessários para o login
      const publicConfig = {
        tenantKey: tenant.tenantKey,
        name: tenant.company.tradeName,
        logo: null, // Futuro: tenant.branding.logoUrl
        environments: tenant.environments.filter(env => env.enabled).map(env => ({
          id: env._id,
          name: env.name,
          webserviceBaseUrl: env.webserviceBaseUrl,
          modules: normalizeConfigMap(env.modules),
          menus: normalizeConfigMap(env.menus),
          // Parametrização de Movimentos
          MOVIMENTOS_SOLICITACAO_COMPRAS: env.MOVIMENTOS_SOLICITACAO_COMPRAS,
          MOVIMENTOS_ORDEM_COMPRA: env.MOVIMENTOS_ORDEM_COMPRA,
          MOVIMENTOS_NOTA_FISCAL_PRODUTO: env.MOVIMENTOS_NOTA_FISCAL_PRODUTO,
          MOVIMENTOS_NOTA_FISCAL_SERVICO: env.MOVIMENTOS_NOTA_FISCAL_SERVICO,
          MOVIMENTOS_OUTRAS_MOVIMENTACOES: env.MOVIMENTOS_OUTRAS_MOVIMENTACOES
        }))
      };

      res.json(publicConfig);
    } catch (error: any) {
      console.error("Erro ao buscar configuração pública:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Tenant Admin Login
  app.post("/api/tenant/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const tenantKey = (req as any).tenantKey as string | undefined;
      console.log("🔑 Tenant Admin Login attempt:", email, tenantKey ? `(tenant=${tenantKey})` : "");

      if (!tenantKey) {
        return res.status(400).json({ error: "Tenant não identificado" });
      }

      const tenant = await Tenant.findOne({ tenantKey });
      if (!tenant) {
        return res.status(404).json({ error: "Tenant não encontrado" });
      }

      const admin = await PlatformAdmin.findOne({ email, tenantId: tenant._id });
      if (!admin) {
        console.log("❌ Admin not found for tenant:", email, tenantKey);
        return res.status(401).json({ error: "Credenciais inválidas" });
      }

      const isMatch = await bcrypt.compare(password, admin.passwordHash);
      if (!isMatch) {
          console.log("❌ Password mismatch for:", email);
          return res.status(401).json({ error: "Credenciais inválidas" });
      }

      console.log("✅ Login successful for:", email);
      res.json({
        admin: {
            id: admin._id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
            tenantId: admin.tenantId
        },
        tenant
      });
    } catch (error: any) {
      console.error("Login Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Check Subdomain Availability
  app.get("/api/tenant/check-subdomain/:subdomain", async (req, res) => {
    try {
      const { subdomain } = req.params;
      const isAvailable = await TenantService.checkSubdomainAvailability(subdomain);
      res.json({ available: isAvailable });
    } catch (error: any) {
      console.error("Erro ao verificar subdomínio:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Tenant Registration
  app.post("/api/tenant/register", async (req, res) => {
    try {
      console.log("📝 Recebido pedido de cadastro de tenant:", req.body.subdomain);
      const result = await TenantService.createTenant(req.body);
      console.log("✅ Tenant criado com sucesso:", result.tenant.tenantKey);
      res.status(201).json(result);
    } catch (error: any) {
      console.error("❌ Erro ao criar tenant:", error);
      res.status(400).json({ error: error.message || "Erro desconhecido ao criar conta." });
    }
  });

  // Get Tenant Info
  app.get("/api/tenant/:id", async (req, res) => {
    try {
        const tenantKey = (req as any).tenantKey as string | undefined;
        if (!tenantKey) return res.status(400).json({ error: "Tenant não identificado" });

        const tenant = await Tenant.findById(req.params.id);
        if (!tenant) return res.status(404).json({ error: "Tenant not found" });

        if (tenant.tenantKey !== tenantKey) {
          return res.status(403).json({ error: "Acesso negado" });
        }
        
        const admin = await PlatformAdmin.findOne({ tenantId: tenant._id });
        
        res.json({
            tenant,
            admin: admin ? {
                email: admin.email,
                name: admin.name,
                phone: admin.phone,
                role: admin.role
            } : null
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
  });

  // Update Tenant
  app.put("/api/tenant/:id", async (req, res) => {
    try {
      const tenantKey = (req as any).tenantKey as string | undefined;
      if (!tenantKey) return res.status(400).json({ error: "Tenant não identificado" });

      const existingTenant = await Tenant.findById(req.params.id);
      if (!existingTenant) return res.status(404).json({ error: "Tenant não encontrado" });

      if (existingTenant.tenantKey !== tenantKey) {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const result = await TenantService.updateTenant(req.params.id, req.body);
      res.json(result);
    } catch (error: any) {
      console.error("Erro ao atualizar tenant:", error);
      res.status(400).json({ error: error.message });
    }
  });

  // Add Environment
  app.post("/api/tenant/:id/environments", async (req, res) => {
    try {
      const result = await TenantService.addEnvironment(req.params.id, req.body);
      res.status(201).json(result);
    } catch (error: any) {
      console.error("Erro ao adicionar ambiente:", error);
      res.status(400).json({ error: error.message });
    }
  });

  // Update Environment
  app.put("/api/tenant/:id/environments/:envId", async (req, res) => {
    try {
      const result = await TenantService.updateEnvironment(req.params.id, req.params.envId, req.body);
      res.json(result);
    } catch (error: any) {
      console.error("Erro ao atualizar ambiente:", error);
      res.status(400).json({ error: error.message });
    }
  });

  // Remove Environment
  app.delete("/api/tenant/:id/environments/:envId", async (req, res) => {
    try {
      const result = await TenantService.removeEnvironment(req.params.id, req.params.envId);
      res.json(result);
    } catch (error: any) {
      console.error("Erro ao remover ambiente:", error);
      res.status(400).json({ error: error.message });
    }
  });

  // Sync Legacy Config
  app.post("/api/tenant/:id/sync-legacy", async (req, res) => {
    try {
      const result = await TenantService.syncLegacyConfig(req.params.id);
      res.json(result);
    } catch (error: any) {
      console.error("Erro ao sincronizar legado:", error);
      res.status(400).json({ error: error.message });
    }
  });

  // Config Auth Routes removed (Legacy Login Config)

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
        endpoints: [],
        error: "Arquivo de configuração não encontrado"
      });
    }
  });

  // Sentences configuration
  app.get("/api/config/sentences", (req, res) => {
    try {
      const sentencesPath = join(process.cwd(), "ambiente", "sentencas.txt");
      // Fallback for direct path if needed, or just rely on relative
      
      const content = readFileSync(sentencesPath, "utf-8");
      const lines = content.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.startsWith('#'));
      
      res.json({ sentences: lines });
    } catch (error) {
      console.error("Erro ao ler arquivo de sentenças:", error);
      // Try alternate path just in case (e.g. if cwd is server subdir)
      try {
          const altPath = join(process.cwd(), "..", "ambiente", "sentencas.txt");
          const content = readFileSync(altPath, "utf-8");
          const lines = content.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0 && !line.startsWith('#'));
          res.json({ sentences: lines });
      } catch (err2) {
          res.status(500).json({ 
            error: "Erro ao ler arquivo de configurações",
            details: error instanceof Error ? error.message : "Erro desconhecido"
          });
      }
    }
  });

  // Helper to resolve Environment URL
  async function getEnvironmentUrl(tenantKey: string, environmentId: string): Promise<string> {
    const safeEnvId = environmentId?.trim();
    console.log(`🔍 [getEnvironmentUrl] Buscando tenantKey: '${tenantKey}', environmentId: '${environmentId}' (safe: '${safeEnvId}')`);

    const tenant = await Tenant.findOne({ tenantKey });
    if (!tenant) {
        console.error(`❌ [getEnvironmentUrl] Tenant não encontrado: '${tenantKey}'`);
        throw new Error(`Tenant '${tenantKey}' não encontrado`);
    }

    // Debug: Listar ambientes disponíveis
    if (tenant.environments) {
        console.log(`📋 [getEnvironmentUrl] Ambientes disponíveis no tenant (${tenant.environments.length}):`);
        tenant.environments.forEach(e => {
            const idStr = e._id?.toString();
            const idVirtual = e.id;
            console.log(`   - ID (_id): ${idStr} | ID (virtual): ${idVirtual} | Name: ${e.name} | URL: ${e.webserviceBaseUrl}`);
        });
    } else {
        console.warn(`⚠️ [getEnvironmentUrl] Tenant não possui array de environments inicializado.`);
    }

    const env = tenant.environments.find(e => {
        const idStr = e._id?.toString();
        const idVirtual = e.id;
        return idStr === safeEnvId || idVirtual === safeEnvId;
    });

    if (!env) {
        console.error(`❌ [getEnvironmentUrl] Ambiente não encontrado. ID procurado: '${safeEnvId}'`);
        console.error(`   - Disponíveis: ${tenant.environments.map(e => e._id?.toString()).join(', ')}`);
        throw new Error(`Ambiente '${safeEnvId}' não encontrado no tenant '${tenantKey}'`);
    }
    
    if (!env.webserviceBaseUrl) {
        console.error(`❌ [getEnvironmentUrl] URL Base não configurada para o ambiente '${env.name}'`);
        throw new Error(`URL do ambiente '${env.name}' não configurada`);
    }
    
    let url = env.webserviceBaseUrl.trim();
    
    // Remove trailing slash
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }

    // Heuristic to extract base URL from SOAP/Service endpoints
    // Common RM patterns: 
    // - http://host:port/ws/Corpore.Net/Main.asmx
    // - http://host:port/wsDataServer/IwsDataServer
    // - http://host:port/Corpore.Net/Main.asmx
    // We need http://host:port for the /api/connect/token call
    
    const soapMarkers = ['/ws/', '/wsDataServer/', '/Corpore.Net/'];
    for (const marker of soapMarkers) {
        const index = url.indexOf(marker);
        if (index !== -1) {
            url = url.substring(0, index);
            break;
        }
    }

    return url;
  }

  // TOTVS Authentication Proxy - handles CORS issues
  app.post("/api/auth/login", async (req, res) => {
    // Permitir certificados auto-assinados (comum em ambientes internos TOTVS)
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

    try {
      const { environmentId, ...credentials } = req.body;
      const tenantKey = req.headers['x-tenant'] as string;
      
      if (!tenantKey) {
        return res.status(400).json({ error: "Header X-Tenant é obrigatório" });
      }

      if (!environmentId) {
        return res.status(400).json({ error: "EnvironmentId é obrigatório" });
      }

      const baseUrl = await getEnvironmentUrl(tenantKey, environmentId);
      console.log("🔍 Proxy - Autenticando no ambiente:", environmentId);
      console.log("🔗 URL Base calculada:", baseUrl);

      const targetUrl = `${baseUrl}/api/connect/token`;
      console.log("🚀 Enviando requisição para:", targetUrl);

      const response = await fetch(targetUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.log("⚠️ Proxy - Erro:", response.status, data);
        if (response.status === 404) {
             console.log("❌ Endpoint não encontrado. Verifique se a URL Base está correta e se a API está habilitada.");
        }
        return res.status(response.status).json(data);
      }

      console.log("✅ Proxy - Sucesso");
      res.json(data);
    } catch (error) {
      console.error("❌ Proxy - Erro Crítico:", error);
      res.status(500).json({ 
        error: "Erro interno do servidor",
        message: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });

  // TOTVS Token Refresh Proxy
  app.post("/api/auth/refresh", async (req, res) => {
    try {
      const { environmentId, ...refreshData } = req.body;
      const tenantKey = req.headers['x-tenant'] as string;
      
      if (!tenantKey) {
        return res.status(400).json({ error: "Header X-Tenant é obrigatório" });
      }
      
      if (!environmentId) {
        return res.status(400).json({ error: "EnvironmentId é obrigatório" });
      }

      const baseUrl = await getEnvironmentUrl(tenantKey, environmentId);
      console.log("🔄 Proxy - Renovando token no ambiente:", environmentId);

      const response = await fetch(`${baseUrl}/api/connect/token`, {
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
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.setHeader("Surrogate-Control", "no-store");

      const { environmentId, path, token } = req.query;
      const tenantKey = req.headers['x-tenant'] as string;
      
      if (!tenantKey) {
        return res.status(400).json({ error: "Header X-Tenant é obrigatório" });
      }

      if (!environmentId || !path) {
        return res.status(400).json({ error: "EnvironmentId e path são obrigatórios" });
      }

      const baseUrl = await getEnvironmentUrl(tenantKey, environmentId.toString());
      
      // Ensure path starts with slash
      const cleanPath = path.toString().startsWith('/') ? path.toString() : `/${path.toString()}`;
      const fullUrl = `${baseUrl}${cleanPath}`;
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
      const { environmentId, path, token } = req.query;
      const { xml, action, basicAuth, username, password } = req.body;
      const tenantKey = req.headers['x-tenant'] as string;

      if (!tenantKey) {
        return res.status(400).json({ error: "Header X-Tenant é obrigatório" });
      }
      
      if (!environmentId || !path || !xml) {
        return res.status(400).json({ error: "EnvironmentId, path e xml são obrigatórios" });
      }

      const baseUrl = await getEnvironmentUrl(tenantKey, environmentId.toString());
      
      // Ensure path starts with slash
      const cleanPath = path.toString().startsWith('/') ? path.toString() : `/${path.toString()}`;
      const fullUrl = `${baseUrl}${cleanPath}`;
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
