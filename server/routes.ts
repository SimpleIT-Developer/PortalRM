import type { Express } from "express";
import { createServer, type Server } from "http";
import { readFileSync, writeFile, unlinkSync } from "fs";
import { join } from "path";
// @ts-ignore
import { storage } from "./storage.js";
import { registerSimpleDFeRoutes } from "./simpledfe/routes";
import { connectToMongo } from "./db-mongo";
import { ConfigUser } from "./models/ConfigUser";
import bcrypt from "bcrypt";

export async function registerRoutes(app: Express): Promise<Server> {
  // Connect to MongoDB
  connectToMongo();

  // Config Auth Routes (Register/Update Environment)
  app.post("/api/config-auth/register", async (req, res) => {
    console.log("📝 Registering/Updating config user:", req.body.CODUSUARIO);
    try {
      const { 
        CODUSUARIO, 
        SENHA, 
        URLWS, 
        NOMEDOAMBIENTE, 
        CODCLIENTE, 
        NOMECLIENTE, 
        _id,
        MOVIMENTOS_SOLICITACAO_COMPRAS,
        MOVIMENTOS_ORDEM_COMPRA,
        MOVIMENTOS_NOTA_FISCAL_PRODUTO,
        MOVIMENTOS_NOTA_FISCAL_SERVICO,
        MOVIMENTOS_OUTRAS_MOVIMENTACOES,
        MODULOS
      } = req.body;
      
      // Check if user exists
      let user = await ConfigUser.findOne({ CODUSUARIO });
      
      const { 
        NOME_CONTATO, 
        EMAIL, 
        TELEFONE 
      } = req.body;

      const envData = {
        URLWS: URLWS || "http://default", // Provide default if not provided (registration)
        NOMEDOAMBIENTE: NOMEDOAMBIENTE || "Default", // Provide default if not provided
        MOVIMENTOS_SOLICITACAO_COMPRAS: MOVIMENTOS_SOLICITACAO_COMPRAS || [],
        MOVIMENTOS_ORDEM_COMPRA: MOVIMENTOS_ORDEM_COMPRA || [],
        MOVIMENTOS_NOTA_FISCAL_PRODUTO: MOVIMENTOS_NOTA_FISCAL_PRODUTO || [],
        MOVIMENTOS_NOTA_FISCAL_SERVICO: MOVIMENTOS_NOTA_FISCAL_SERVICO || [],
        MOVIMENTOS_OUTRAS_MOVIMENTACOES: MOVIMENTOS_OUTRAS_MOVIMENTACOES || [],
        MODULOS: MODULOS || {}
      };

      if (user) {
        let envIndex = -1;

        // If _id is provided, try to find by ID first (for editing/renaming)
        if (_id) {
            // @ts-ignore
            envIndex = user.AMBIENTES.findIndex((env: any) => env._id.toString() === _id);
        }

        // If not found by ID (or no ID), try to find by Name (legacy/fallback)
        if (envIndex === -1 && NOMEDOAMBIENTE) {
            // @ts-ignore
            envIndex = user.AMBIENTES.findIndex((env: any) => env.NOMEDOAMBIENTE === NOMEDOAMBIENTE);
        }
        
        if (envIndex >= 0) {
             console.log(`Updating existing environment at index ${envIndex}:`, NOMEDOAMBIENTE);
             console.log("📦 Payload Movimentos:", {
                SOLICITACAO: envData.MOVIMENTOS_SOLICITACAO_COMPRAS,
                ORDEM: envData.MOVIMENTOS_ORDEM_COMPRA
             });

             // Update existing environment using Mongoose set() for explicit updates
             // @ts-ignore
             const existingEnv = user.AMBIENTES[envIndex];

             // Ensure MODULOS is a plain object to avoid Mongoose Mixed type issues
             const modulosPlain = JSON.parse(JSON.stringify(envData.MODULOS));
             console.log("📦 Payload Modulos:", modulosPlain);

             // Explicitly set the arrays using Mongoose methods if available, or direct assignment
             if (existingEnv.set) {
                 existingEnv.set('URLWS', URLWS);
                 existingEnv.set('NOMEDOAMBIENTE', NOMEDOAMBIENTE);
                 existingEnv.set('MOVIMENTOS_SOLICITACAO_COMPRAS', envData.MOVIMENTOS_SOLICITACAO_COMPRAS);
                 existingEnv.set('MOVIMENTOS_ORDEM_COMPRA', envData.MOVIMENTOS_ORDEM_COMPRA);
                 existingEnv.set('MOVIMENTOS_NOTA_FISCAL_PRODUTO', envData.MOVIMENTOS_NOTA_FISCAL_PRODUTO);
                 existingEnv.set('MOVIMENTOS_NOTA_FISCAL_SERVICO', envData.MOVIMENTOS_NOTA_FISCAL_SERVICO);
                 existingEnv.set('MOVIMENTOS_OUTRAS_MOVIMENTACOES', envData.MOVIMENTOS_OUTRAS_MOVIMENTACOES);
                 // For Mixed types, set explicitly
                 existingEnv.set('MODULOS', modulosPlain);
             } else {
                 existingEnv.URLWS = URLWS;
                 existingEnv.NOMEDOAMBIENTE = NOMEDOAMBIENTE;
                 existingEnv.MOVIMENTOS_SOLICITACAO_COMPRAS = envData.MOVIMENTOS_SOLICITACAO_COMPRAS;
                 existingEnv.MOVIMENTOS_ORDEM_COMPRA = envData.MOVIMENTOS_ORDEM_COMPRA;
                 existingEnv.MOVIMENTOS_NOTA_FISCAL_PRODUTO = envData.MOVIMENTOS_NOTA_FISCAL_PRODUTO;
                 existingEnv.MOVIMENTOS_NOTA_FISCAL_SERVICO = envData.MOVIMENTOS_NOTA_FISCAL_SERVICO;
                 existingEnv.MOVIMENTOS_OUTRAS_MOVIMENTACOES = envData.MOVIMENTOS_OUTRAS_MOVIMENTACOES;
                 existingEnv.MODULOS = modulosPlain;
             }
        } else {
             console.log("Adding new environment:", NOMEDOAMBIENTE);
             // @ts-ignore
             user.AMBIENTES.push(envData);
        }
        
        // Update global fields
        if (CODCLIENTE) user.CODCLIENTE = CODCLIENTE;
        if (NOMECLIENTE) user.NOMECLIENTE = NOMECLIENTE;
        if (NOME_CONTATO) user.NOME_CONTATO = NOME_CONTATO;
        if (EMAIL) user.EMAIL = EMAIL;
        if (TELEFONE) user.TELEFONE = TELEFONE;
        
        // Update password if provided
        if (SENHA) {
            const hashedPassword = await bcrypt.hash(SENHA, 10);
            user.SENHA = hashedPassword;
        }
        
        user.markModified('AMBIENTES'); // Ensure Mongoose detects the change
        const savedUser = await user.save();
        console.log("✅ User saved successfully. Environments count:", savedUser.AMBIENTES.length);
        
        // Log environment details for debugging
        if (envIndex >= 0) {
           // @ts-ignore
           const savedEnv = savedUser.AMBIENTES[envIndex];
           console.log("🔍 Saved Environment Details:", {
               id: savedEnv._id,
               MOVIMENTOS_SOLICITACAO_COMPRAS: savedEnv.MOVIMENTOS_SOLICITACAO_COMPRAS
           });
        }

        // Return the updated user/environments so frontend can refresh
        return res.status(200).json({ 
            message: "Usuário/Ambiente atualizado com sucesso",
            AMBIENTES: savedUser.AMBIENTES,
            CODCLIENTE: savedUser.CODCLIENTE,
            NOMECLIENTE: savedUser.NOMECLIENTE
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(SENHA, 10);

      const newUser = new ConfigUser({
        CODUSUARIO,
        SENHA: hashedPassword,
        CODCLIENTE,
        NOMECLIENTE,
        NOME_CONTATO,
        EMAIL,
        TELEFONE,
        AMBIENTES: URLWS && NOMEDOAMBIENTE ? [envData] : [] // Only add env if provided
      });

      await newUser.save();
      res.status(201).json({ 
          message: "Usuário de configuração criado com sucesso",
          AMBIENTES: newUser.AMBIENTES,
          CODCLIENTE: newUser.CODCLIENTE,
          NOMECLIENTE: newUser.NOMECLIENTE
      });
    } catch (error: any) {
      console.error("Config Auth Register Error:", error);
      res.status(500).json({ error: error.message || "Erro ao criar usuário" });
    }
  });

  // Delete Environment Route
  app.delete("/api/config-auth/environment/:envId", async (req, res) => {
      try {
          const { envId } = req.params;
          const { CODUSUARIO } = req.body; // Pass user in body for auth check

          console.log(`🗑️ Deleting environment ${envId} for user ${CODUSUARIO}`);

          const user = await ConfigUser.findOne({ CODUSUARIO });
          if (!user) {
              return res.status(404).json({ error: "Usuário não encontrado" });
          }

          // @ts-ignore
          user.AMBIENTES = user.AMBIENTES.filter(env => env._id.toString() !== envId);
          
          user.markModified('AMBIENTES');
          await user.save();

          res.json({ 
              message: "Ambiente removido com sucesso",
              AMBIENTES: user.AMBIENTES 
          });

      } catch (error) {
          console.error("Error deleting environment:", error);
          res.status(500).json({ error: "Erro ao remover ambiente" });
      }
  });


  app.post("/api/config-auth/login", async (req, res) => {
    console.log("🔑 Login attempt for config user:", req.body.CODUSUARIO);
    try {
      const { CODUSUARIO, SENHA } = req.body;
      const user = await ConfigUser.findOne({ CODUSUARIO });
      
      if (!user) {
        console.log("❌ User not found:", CODUSUARIO);
        return res.status(401).json({ error: "Credenciais inválidas" });
      }

      const isMatch = await bcrypt.compare(SENHA, user.SENHA);
      if (!isMatch) {
        console.log("❌ Password mismatch for:", CODUSUARIO);
        return res.status(401).json({ error: "Credenciais inválidas" });
      }

      console.log("✅ Login successful for:", CODUSUARIO);
      res.json(user);
    } catch (error) {
      console.error("Config Auth Login Error:", error);
      res.status(500).json({ error: "Erro ao realizar login" });
    }
  });

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

      // Garantir que o endpoint tenha o protocolo correto
      let baseUrl = endpoint.toString();
      if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
        baseUrl = `http://${baseUrl}`;
      }
      // Remove trailing slash if present
      if (baseUrl.endsWith('/')) {
        baseUrl = baseUrl.slice(0, -1);
      }
      
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
      const { endpoint, path, token } = req.query;
      const { xml, action, basicAuth, username, password } = req.body;
      
      if (!endpoint || !path || !xml) {
        return res.status(400).json({ error: "Endpoint, path e xml são obrigatórios" });
      }

      // Garantir que o endpoint tenha o protocolo correto
      let baseUrl = endpoint.toString();
      if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
        baseUrl = `http://${baseUrl}`;
      }
      // Remove trailing slash if present
      if (baseUrl.endsWith('/')) {
        baseUrl = baseUrl.slice(0, -1);
      }
      
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
