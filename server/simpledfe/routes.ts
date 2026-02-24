import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { loginSchema, registerSchema, forgotPasswordSchema, users, type Company, type CompanyFilters, type CompanyResponse, type NFeRecebida, type NFeFilters, type NFeResponse, type NFSeRecebida, type NFSeResponse, type CTeRecebida, type CTeFilters, type CTeResponse, type EventoCTe, type Usuario, type UsuarioResponse, type FornecedorResponse } from "@shared/schema";
import { z } from "zod";
import { mysqlPool, testMysqlConnection } from "./mysql-config";
import { db } from "./db";
import { sendWelcomeEmail } from "./email-service";
import { sendWelcomeEmail as sendWelcomeEmailResend } from "./resend-service";
import { sendNewPasswordEmail } from "./new-password-service";
import * as crypto from "crypto";

import { eq, ilike, or, and, count, desc, asc } from "drizzle-orm";
import { generateNfeRelatorioPDF } from "./nfe-relatorio-generator";
import { generateNfseRelatorioPDF } from "./nfse-relatorio-generator";
import { generateNfseTributosRelatorioPDF } from "./nfse-tributos-relatorio-generator";
import multer from 'multer';
import * as XLSX from 'xlsx';
import { CNPJService } from "./services/cnpj-service";
import { ERPService } from "./services/erp-service";
import { ERP_CONFIG } from "./config/erp-config";
import { AuditLogger } from "./audit-logger";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Configuração do multer para upload de arquivos
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/xml' || file.originalname.toLowerCase().endsWith('.xml')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos XML são permitidos'));
    }
  }
});

// Middleware to verify JWT token - MOCKED for PortalRM Integration
function authenticateToken(req: any, res: any, next: any) {
  // Mock user for integration with PortalRM to preserve functionality of existing routes
  // that depend on req.user
  req.user = { 
    id: 1, 
    type: 'admin', 
    username: 'portalrm_user', 
    email: 'admin@portalrm.com.br' 
  };
  next();
}

export async function registerSimpleDFeRoutes(app: Express) {
  // Inicializar tabelas no início - DISABLED for PortalRM Integration
  /*
  try {
    await storage.ensureUsersTableExists();
    await storage.ensureAuditTableExists();
  } catch (error) {
    console.error('Erro ao inicializar tabelas:', error);
  }
  */

  // Register endpoint
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email já está em uso" });
      }

      const existingUsername = await storage.getUserByUsername(validatedData.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Nome de usuário já está em uso" });
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(validatedData.password, saltRounds);

      // Create user
      const newUser = await storage.createUser({
        username: validatedData.username,
        email: validatedData.email.toLowerCase(),
        password: hashedPassword,
        name: validatedData.name,
        type: validatedData.type,
        status: 1,
      });

      // Buscar código do cliente no MySQL
      let codigoCliente = '';
      let nomeEmpresa = '';
      try {
        const [clienteResult] = await mysqlPool.execute('SELECT codigo, nome_fantasia as nome FROM cliente LIMIT 1') as any;
        if (clienteResult.length > 0) {
          codigoCliente = clienteResult[0].codigo || '';
          nomeEmpresa = clienteResult[0].nome || '';
        }
      } catch (error) {
        console.warn('Erro ao buscar código do cliente:', error);
      }

      // Enviar email de boas-vindas em background
      setImmediate(async () => {
        try {
          console.log(`📧 Iniciando envio de email de boas-vindas para: ${newUser.email}`);
          
          const emailData = {
            nome: newUser.name,
            email: newUser.email,
            senha: validatedData.password,
            codigoCliente,
            nomeEmpresa,
            baseUrl: 'https://www.simpledfe.com.br'
          };

          const emailSent = await sendWelcomeEmailResend(emailData);
          
          if (emailSent) {
            console.log(`✅ Email de boas-vindas enviado com sucesso para: ${newUser.email}`);
          } else {
            console.error(`❌ Falha no envio do email de boas-vindas para: ${newUser.email}`);
          }
        } catch (error) {
          console.error(`❌ Erro crítico ao enviar email para ${newUser.email}:`, error);
        }
      });

      // Generate JWT token
      const token = jwt.sign(
        { id: newUser.id, email: newUser.email, username: newUser.username },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Return user data without password
      const { password, ...userWithoutPassword } = newUser;
      res.status(201).json({
        message: "Usuário criado com sucesso",
        user: userWithoutPassword,
        token
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: error.errors 
        });
      }
      console.error("Registration error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Login endpoint (DISABLED)
  app.post("/api/auth/login_disabled", async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);

      // Find user by email (case-insensitive)
      const user = await storage.getUserByEmail(validatedData.email.toLowerCase());
      if (!user) {
        return res.status(401).json({ message: "Email ou senha incorretos" });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(validatedData.password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Email ou senha incorretos" });
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email, username: user.username, type: user.type },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Return user data without password
      const { password, ...userWithoutPassword } = user;
      res.json({
        message: "Login realizado com sucesso",
        user: userWithoutPassword,
        token
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: error.errors 
        });
      }
      console.error("Login error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Get current user endpoint - returns mocked user aligned with PortalRM auth
  app.get("/api/auth/me", authenticateToken, async (req: any, res) => {
    try {
      const { id, type, username, email } = req.user;
      res.json({ user: { id, type, username, email, name: username, status: 1 } });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Endpoint para testar envio de email
  app.post("/api/auth/test-email", authenticateToken, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      console.log(`Testando envio de email para usuário: ${user.email}`);

      const emailData = {
        nome: user.name,
        email: user.email,
        senha: '[SENHA_TESTE]',
        codigoCliente: 'TESTE123',
        nomeEmpresa: 'Empresa Teste'
      };

      const emailSent = await sendWelcomeEmailResend(emailData);

      if (emailSent) {
        res.json({ 
          success: true, 
          message: "Email de teste enviado com sucesso",
          email: user.email 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: "Falha no envio do email de teste" 
        });
      }
    } catch (error) {
      console.error("Erro no teste de email:", error);
      res.status(500).json({ 
        success: false, 
        message: "Erro interno do servidor ao testar email" 
      });
    }
  });

  // Logout endpoint (client-side handles token removal)
  app.post("/api/auth/logout", authenticateToken, (req, res) => {
    res.json({ message: "Logout realizado com sucesso" });
  });

  // Generate random password function
  function generateRandomPassword(length: number = 8): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%&*';
    const allChars = uppercase + lowercase + numbers + symbols;
    
    let password = '';
    // Garantir pelo menos um caractere de cada tipo
    password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));
    password += symbols.charAt(Math.floor(Math.random() * symbols.length));
    
    // Preencher o resto aleatoriamente
    for (let i = password.length; i < length; i++) {
      password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }
    
    // Embaralhar a senha
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  // Forgot password endpoint - Generate new password
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const validatedData = forgotPasswordSchema.parse(req.body);
      
      // Find user by email
      const user = await storage.getUserByEmail(validatedData.email.toLowerCase());
      if (!user) {
        // Always return success to prevent email enumeration
        return res.json({ 
          message: "Se o email existir em nossa base, você receberá uma nova senha temporária" 
        });
      }

      // Generate new random password
      const newPassword = generateRandomPassword(10);
      
      // Hash the new password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
      
      // Update user password in database
      await storage.updateUserPassword(user.id, hashedPassword);
      
      // Send new password email in background
      setImmediate(async () => {
        try {
          console.log(`📧 Iniciando envio de email de nova senha para: ${user.email}`);
          
          const emailData = {
            nome: user.name,
            email: user.email,
            novaSenha: newPassword,
            baseUrl: process.env.NODE_ENV === 'development' ? `http://localhost:5000` : 'https://www.simpledfe.com.br'
          };

          const emailSent = await sendNewPasswordEmail(emailData);
          
          if (emailSent) {
            console.log(`✅ Email de nova senha enviado com sucesso para: ${user.email}`);
          } else {
            console.error(`❌ Falha no envio do email de nova senha para: ${user.email}`);
          }
        } catch (error) {
          console.error(`❌ Erro crítico ao enviar email de nova senha para ${user.email}:`, error);
        }
      });
      
      res.json({ 
        message: "Se o email existir em nossa base, você receberá uma nova senha temporária" 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: error.errors 
        });
      }
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });


  // Test MySQL connection on startup
  await testMysqlConnection();

  // Companies endpoints
  app.get("/api/companies", authenticateToken, async (req: any, res) => {
    try {
      const {
        search = "",
        page = "1",
        limit = "10",
        sortBy = "company_id",
        sortOrder = "asc"
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);
      
      // Build search condition
      let searchCondition = "";
      const searchParams: any[] = [];
      
      if (search) {
        searchCondition = `WHERE 
          company_name LIKE ? OR 
          company_fantasy LIKE ? OR 
          company_cpf_cnpj LIKE ? OR 
          company_email LIKE ? OR 
          company_city LIKE ? OR 
          company_uf LIKE ?`;
        const searchTerm = `%${search}%`;
        searchParams.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
      }

      // Count total records
      const countQuery = `SELECT COUNT(*) as total FROM company ${searchCondition}`;
      const [countResult] = await mysqlPool.execute(countQuery, searchParams) as any;
      const total = countResult[0].total;

      // Get companies with pagination and sorting
      const dataQuery = `
        SELECT 
          company_id,
          company_name,
          company_fantasy,
          company_cpf_cnpj,
          company_email,
          company_city,
          company_uf
        FROM company 
        ${searchCondition}
        ORDER BY ${sortBy} ${sortOrder.toUpperCase()}
        LIMIT ? OFFSET ?
      `;

      const [companies] = await mysqlPool.execute(dataQuery, [
        ...searchParams,
        String(parseInt(limit)),
        String(offset)
      ]) as any;

      const totalPages = Math.ceil(total / parseInt(limit));

      const response: CompanyResponse = {
        companies,
        total,
        page: parseInt(page),
        totalPages,
        limit: parseInt(limit)
      };

      res.json(response);
    } catch (error) {
      console.error("Companies fetch error:", error);
      res.status(500).json({ message: "Erro ao buscar empresas" });
    }
  });

  // Get single company
  app.get("/api/companies/:id", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      const query = `
        SELECT 
          company_id,
          company_name,
          company_fantasy,
          company_cpf_cnpj,
          company_email,
          company_city,
          company_uf
        FROM company 
        WHERE company_id = ?
      `;

      const [companies] = await mysqlPool.execute(query, [id]) as any;
      
      if (companies.length === 0) {
        return res.status(404).json({ message: "Empresa não encontrada" });
      }

      res.json({ company: companies[0] });
    } catch (error) {
      console.error("Company fetch error:", error);
      res.status(500).json({ message: "Erro ao buscar empresa" });
    }
  });

  // Update company
  app.put("/api/companies/:id", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { company_name, company_fantasy, company_cpf_cnpj, company_email, company_city, company_uf } = req.body;

      if (!company_name || !company_fantasy || !company_cpf_cnpj || !company_email || !company_city || !company_uf) {
        return res.status(400).json({ message: "Todos os campos são obrigatórios" });
      }

      const updateQuery = `
        UPDATE company 
        SET company_name = ?, company_fantasy = ?, company_cpf_cnpj = ?, company_email = ?, company_city = ?, company_uf = ?
        WHERE company_id = ?
      `;

      await mysqlPool.execute(updateQuery, [
        company_name, 
        company_fantasy, 
        company_cpf_cnpj, 
        company_email, 
        company_city, 
        company_uf, 
        parseInt(id)
      ]);

      res.json({ message: "Empresa atualizada com sucesso" });
    } catch (error) {
      console.error("Company update error:", error);
      res.status(500).json({ message: "Erro ao atualizar empresa" });
    }
  });

  // NFe Recebidas endpoints
  app.get("/api/nfe-recebidas", authenticateToken, async (req: any, res) => {
    try {
      // Log de auditoria para acesso ao menu
      await AuditLogger.logMenuAccess(req, "NFe Recebidas");
      
      console.log("NFe Recebidas - Starting request");
      const {
        search = "",
        status = "all",
        empresa = "",
        fornecedor = "",
        dataInicio = "",
        dataFim = "",
        page = "1",
        limit = "10",
        sortBy = "doc_num",
        sortOrder = "desc"
      } = req.query;
      
      console.log("NFe Recebidas - Query params:", { search, status, empresa, fornecedor, dataInicio, dataFim, page, limit, sortBy, sortOrder });

      const offset = (parseInt(page) - 1) * parseInt(limit);
      
      // Build search conditions
      let searchConditions: string[] = [];
      const searchParams: any[] = [];
      
      if (search) {
        searchConditions.push(`(
          d.doc_num LIKE ? OR 
          d.doc_dest_nome LIKE ? OR 
          d.doc_emit_nome LIKE ? OR 
          d.doc_emit_documento LIKE ? OR 
          d.doc_nat_op LIKE ? OR
          d.doc_id_integracao LIKE ? OR
          c.company_name LIKE ?
        )`);
        const searchTerm = `%${search}%`;
        searchParams.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
      }

      if (status !== "all") {
        if (status === "integrated") {
          searchConditions.push("d.doc_status_integracao = 1");
        } else if (status === "not_integrated") {
          searchConditions.push("d.doc_status_integracao = 0");
        }
      }

      if (empresa) {
        searchConditions.push("(d.doc_dest_nome LIKE ? OR c.company_name LIKE ?)");
        searchParams.push(`%${empresa}%`, `%${empresa}%`);
      }

      if (fornecedor) {
        searchConditions.push("d.doc_emit_nome LIKE ?");
        searchParams.push(`%${fornecedor}%`);
      }

      if (dataInicio) {
        searchConditions.push("DATE(d.doc_date_emi) >= ?");
        searchParams.push(dataInicio);
      }

      if (dataFim) {
        searchConditions.push("DATE(d.doc_date_emi) <= ?");
        searchParams.push(dataFim);
      }

      const whereClause = searchConditions.length > 0 ? `WHERE ${searchConditions.join(" AND ")}` : "";

      // Count total records
      const countQuery = `SELECT COUNT(*) as total FROM doc d LEFT JOIN company c ON d.doc_id_company = c.company_id ${whereClause}`;
      const [countResult] = await mysqlPool.execute(countQuery, searchParams) as any;
      const total = countResult[0].total;

      // Get NFes with pagination and sorting + company relationship + eventos info
      const dataQuery = `
        SELECT 
          d.doc_id,
          d.doc_num,
          d.doc_dest_nome,
          d.doc_emit_nome,
          d.doc_emit_documento,
          d.doc_date_emi,
          d.doc_valor,
          d.doc_nat_op,
          d.doc_status_integracao,
          d.doc_id_integracao,
          d.doc_codcfo,
          d.doc_id_company,
          d.doc_status,
          d.doc_serie,
          d.doc_chave,
          COALESCE(c.company_name, d.doc_dest_nome) as empresa_nome,
          c.company_cpf_cnpj,
          CASE 
            WHEN EXISTS (SELECT 1 FROM eventos e WHERE d.doc_chave = e.eventos_chave AND d.doc_id_company = e.eventos_id_company) THEN 1 
            ELSE 0 
          END as has_evento
        FROM doc d
        LEFT JOIN company c ON d.doc_id_company = c.company_id
        ${whereClause}
        ORDER BY ${sortBy.startsWith('doc_') ? 'd.' + sortBy : sortBy} ${sortOrder.toUpperCase()}
        LIMIT ${parseInt(limit)} OFFSET ${offset}
      `;

      const [nfes] = await mysqlPool.execute(dataQuery, searchParams) as any;

      const totalPages = Math.ceil(total / parseInt(limit));

      const response: NFeResponse = {
        nfes,
        total,
        page: parseInt(page),
        totalPages,
        limit: parseInt(limit)
      };

      res.json(response);
    } catch (error) {
      console.error("NFe fetch error:", error);
      res.status(500).json({ message: "Erro ao buscar NFe recebidas" });
    }
  });

  // Get single NFe
  app.get("/api/nfe-recebidas/:numero", authenticateToken, async (req: any, res) => {
    try {
      const { numero } = req.params;
      
      const query = `
        SELECT 
          doc_num,
          doc_dest_nome,
          doc_emit_nome,
          doc_emit_documento,
          doc_date_emi,
          doc_valor,
          doc_nat_op,
          doc_status_integracao,
          doc_id_integracao,
          doc_codcfo
        FROM doc 
        WHERE doc_num = ?
      `;

      const [nfes] = await mysqlPool.execute(query, [numero]) as any;
      
      if (nfes.length === 0) {
        return res.status(404).json({ message: "NFe não encontrada" });
      }

      res.json({ nfe: nfes[0] });
    } catch (error) {
      console.error("NFe fetch error:", error);
      res.status(500).json({ message: "Erro ao buscar NFe" });
    }
  });

  // NFSe Recebidas endpoints
  app.get("/api/nfse-recebidas", authenticateToken, async (req: any, res) => {
    try {
      // Log de auditoria para acesso ao menu
      await AuditLogger.logMenuAccess(req, "NFSe Recebidas");
      const {
        search = "",
        status = "all",
        empresa = "",
        fornecedor = "",
        dataInicio = "",
        dataFim = "",
        page = "1",
        limit = "10",
        sortBy = "nfse_data_hora",
        sortOrder = "desc"
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);
      
      // Build search conditions (idêntico ao NFe Recebidas)
      let searchConditions: string[] = [];
      const searchParams: any[] = [];
      
      if (search) {
        searchConditions.push(`(
          nfse_emitente LIKE ? OR 
          nfse_doc LIKE ? OR 
          nfse_tomador LIKE ? OR 
          nfse_tipo LIKE ? OR 
          nfse_local_prestacao LIKE ? OR
          nfse_id_integracao LIKE ?
        )`);
        const searchTerm = `%${search}%`;
        searchParams.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
      }

      if (status !== "all") {
        if (status === "integrated") {
          searchConditions.push("nfse_status_integracao = 1");
        } else if (status === "not_integrated") {
          searchConditions.push("nfse_status_integracao = 0");
        }
      }

      if (empresa) {
        searchConditions.push("nfse_tomador LIKE ?");
        searchParams.push(`%${empresa}%`);
      }

      if (fornecedor) {
        searchConditions.push("nfse_emitente LIKE ?");
        searchParams.push(`%${fornecedor}%`);
      }

      if (dataInicio) {
        searchConditions.push("DATE(nfse_data_hora) >= ?");
        searchParams.push(dataInicio);
      }

      if (dataFim) {
        searchConditions.push("DATE(nfse_data_hora) <= ?");
        searchParams.push(dataFim);
      }

      const whereClause = searchConditions.length > 0 ? `WHERE ${searchConditions.join(" AND ")}` : "";

      // Count total records
      const countQuery = `SELECT COUNT(*) as total FROM nfse ${whereClause}`;
      const [countResult] = await mysqlPool.execute(countQuery, searchParams) as any;
      const total = countResult[0].total;

      // Get NFSes with pagination and sorting  
      const dataQuery = `SELECT nfse_id, nfse_emitente, nfse_doc, nfse_tomador, nfse_tipo, nfse_local_prestacao, nfse_data_hora, nfse_valor_servico, nfse_status_integracao, nfse_id_integracao, nfse_codcfo, nfse_nsu FROM nfse ${whereClause} ORDER BY ${sortBy} ${sortOrder.toUpperCase()} LIMIT ${parseInt(limit)} OFFSET ${offset}`;
      
      const [nfses] = await mysqlPool.execute(dataQuery, searchParams) as any;

      const totalPages = Math.ceil(total / parseInt(limit));

      const response: NFSeResponse = {
        nfses: nfses,
        total,
        page: parseInt(page),
        totalPages,
        limit: parseInt(limit)
      };

      res.json(response);
    } catch (error) {
      console.error("Erro ao buscar NFSe recebidas:", error);
      res.status(500).json({ message: "Erro ao buscar NFSe recebidas" });
    }
  });

  // Usuários endpoints - PostgreSQL com Drizzle e controle de acesso
  app.get("/api/usuarios", authenticateToken, async (req: any, res) => {
    try {
      // Log de auditoria para acesso ao menu
      await AuditLogger.logMenuAccess(req, "Usuários");
      const {
        search = "",
        status = "all", 
        page = "1",
        limit = "10",
        sortBy = "name",
        sortOrder = "asc"
      } = req.query;

      const userType = req.user.type || 'user';
      const currentUserId = req.user.id;
      const offset = (parseInt(page) - 1) * parseInt(limit);
      
      // Construir condições WHERE usando Drizzle
      let whereConditions = [];

      // Controle de acesso baseado no tipo de usuário
      if (userType === 'user') {
        // Usuários do tipo 'user' só podem ver eles mesmos
        whereConditions.push(eq(users.id, currentUserId));
      } else if (userType === 'admin') {
        // Usuários do tipo 'admin' podem ver 'admin' e 'user'
        whereConditions.push(or(eq(users.type, 'admin'), eq(users.type, 'user')));
      }
      // Usuários do tipo 'system' podem ver todos (sem restrição)

      if (search) {
        whereConditions.push(
          or(
            ilike(users.name, `%${search}%`),
            ilike(users.email, `%${search}%`)
          )
        );
      }

      if (status !== "all") {
        const statusValue = status === "active" ? 1 : 0;
        whereConditions.push(eq(users.status, statusValue));
      }

      // Count total usando Drizzle
      const [countResult] = await db
        .select({ count: count() })
        .from(users)
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

      const total = countResult.count;

      // Buscar usuários usando Drizzle
      const orderByField = sortBy === "name" ? users.name : 
                          sortBy === "email" ? users.email :
                          sortBy === "type" ? users.type :
                          sortBy === "status" ? users.status : users.name;

      const orderDirection = sortOrder === "desc" ? desc(orderByField) : asc(orderByField);

      const allUsers = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          type: users.type,
          status: users.status
        })
        .from(users)
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
        .orderBy(orderDirection)
        .limit(parseInt(limit))
        .offset(offset);

      const totalPages = Math.ceil(total / parseInt(limit));

      const response = {
        usuarios: allUsers.map((user: any) => ({
          id: user.id,
          nome: user.name,
          email: user.email,
          tipo: user.type || "user",
          ativo: user.status || 1
        })),
        total,
        page: parseInt(page),
        totalPages,
        limit: parseInt(limit)
      };

      res.json(response);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      res.status(500).json({ message: "Erro ao buscar usuários" });
    }
  });

  // Rota para criar usuário
  app.post("/api/usuarios", authenticateToken, async (req: any, res) => {
    try {
      const userType = req.user.type || 'user';
      
      // Apenas admins e system podem criar usuários
      if (userType !== 'admin' && userType !== 'system') {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const { nome, email, password, tipo, ativo } = req.body;

      if (!nome || !email || !password || !tipo) {
        return res.status(400).json({ message: "Todos os campos são obrigatórios" });
      }

      // Admins só podem criar users e admins
      if (userType === 'admin' && tipo === 'system') {
        return res.status(403).json({ message: "Admins não podem criar usuários do tipo system" });
      }

      // Verificar se email já existe (case-insensitive)
      const existingUser = await storage.getUserByEmail(email.toLowerCase());
      if (existingUser) {
        return res.status(400).json({ message: "Email já está em uso" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      
      const newUser = await storage.createUser({
        username: nome,
        email: email.toLowerCase(),
        password: hashedPassword,
        name: nome,
        type: tipo,
        status: ativo !== undefined ? ativo : 1
      });

      // Buscar código do cliente no MySQL
      let codigoCliente = '';
      let nomeEmpresa = '';
      try {
        const [clienteResult] = await mysqlPool.execute('SELECT codigo, nome_fantasia as nome FROM cliente LIMIT 1') as any;
        if (clienteResult.length > 0) {
          codigoCliente = clienteResult[0].codigo || '';
          nomeEmpresa = clienteResult[0].nome || '';
        }
      } catch (error) {
        console.warn('Erro ao buscar código do cliente:', error);
      }

      // Enviar email de boas-vindas em background
      setImmediate(async () => {
        try {
          console.log(`📧 Iniciando envio de email de boas-vindas para: ${newUser.email}`);
          
          const emailData = {
            nome: newUser.name,
            email: newUser.email,
            senha: password, // Senha original antes do hash
            codigoCliente,
            nomeEmpresa,
            baseUrl: 'https://www.simpledfe.com.br'
          };

          const emailSent = await sendWelcomeEmailResend(emailData);
          
          if (emailSent) {
            console.log(`✅ Email de boas-vindas enviado com sucesso para: ${newUser.email}`);
          } else {
            console.error(`❌ Falha no envio do email de boas-vindas para: ${newUser.email}`);
          }
        } catch (error) {
          console.error(`❌ Erro crítico ao enviar email para ${newUser.email}:`, error);
        }
      });

      // Log de auditoria para criação de usuário
      await AuditLogger.logUserCreation(req, nome, email);

      res.status(201).json({ 
        message: "Usuário criado com sucesso",
        usuario: {
          id: newUser.id,
          nome: newUser.username,
          email: newUser.email,
          tipo: newUser.type,
          ativo: newUser.status
        }
      });
    } catch (error) {
      console.error("Erro ao criar usuário:", error);
      res.status(500).json({ message: "Erro ao criar usuário" });
    }
  });

  // Rota para atualizar usuário
  app.put("/api/usuarios/:id", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userType = req.user.type || 'user';
      const currentUserId = req.user.id;
      
      // Users só podem editar eles mesmos
      if (userType === 'user' && parseInt(id) !== currentUserId) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const targetUser = await storage.getUser(parseInt(id));
      if (!targetUser) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      // Admins não podem editar usuários system
      if (userType === 'admin' && targetUser.type === 'system') {
        return res.status(403).json({ message: "Admins não podem editar usuários do tipo system" });
      }

      const { nome, email, password, tipo, ativo } = req.body;
      const updateData: any = {};

      if (nome) updateData.name = nome;
      if (email) {
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser && existingUser.id !== parseInt(id)) {
          return res.status(400).json({ message: "Email já está em uso" });
        }
        updateData.email = email;
      }
      if (password) updateData.password = await bcrypt.hash(password, 10);
      
      // Users não podem alterar tipo e status
      if (userType !== 'user') {
        if (tipo !== undefined) {
          // Admins não podem criar/alterar para system
          if (userType === 'admin' && tipo === 'system') {
            return res.status(403).json({ message: "Admins não podem alterar usuários para tipo system" });
          }
          updateData.type = tipo;
        }
        if (ativo !== undefined) updateData.status = ativo;
      }

      // await db.update(users)
      //   .set(updateData)
      //   .where(eq(users.id, parseInt(id)));

      res.json({ message: "Usuário atualizado com sucesso" });
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
      res.status(500).json({ message: "Erro ao atualizar usuário" });
    }
  });

  // Rota para excluir usuário
  app.delete("/api/usuarios/:id", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userType = req.user.type || 'user';
      const currentUserId = req.user.id;
      
      // Users não podem excluir usuários
      if (userType === 'user') {
        return res.status(403).json({ message: "Acesso negado" });
      }

      // Não pode excluir a si mesmo
      if (parseInt(id) === currentUserId) {
        return res.status(400).json({ message: "Não é possível excluir seu próprio usuário" });
      }

      const targetUser = await storage.getUser(parseInt(id));
      if (!targetUser) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      // Admins não podem excluir usuários system
      if (userType === 'admin' && targetUser.type === 'system') {
        return res.status(403).json({ message: "Admins não podem excluir usuários do tipo system" });
      }

      // await db.delete(users).where(eq(users.id, parseInt(id)));

      res.json({ message: "Usuário excluído com sucesso" });
    } catch (error) {
      console.error("Erro ao excluir usuário:", error);
      res.status(500).json({ message: "Erro ao excluir usuário" });
    }
  });

  // Dashboard endpoints
  app.get("/api/dashboard/stats", authenticateToken, async (req: any, res) => {
    try {
      // Consultas para obter estatísticas usando as tabelas corretas
      const [totalCNPJResult] = await mysqlPool.execute('SELECT COUNT(*) as total FROM company') as any;
      const [nfeRecebidasResult] = await mysqlPool.execute('SELECT COUNT(*) as total FROM doc') as any;
      const [nfeIntegradasResult] = await mysqlPool.execute('SELECT COUNT(*) as total FROM doc WHERE doc_status_integracao = 1') as any;
      const [nfseRecebidasResult] = await mysqlPool.execute('SELECT COUNT(*) as total FROM nfse') as any;
      const [nfseIntegradasResult] = await mysqlPool.execute('SELECT COUNT(*) as total FROM nfse WHERE nfse_status_integracao = 1') as any;
      // Consulta reativada para mostrar estatísticas corretas
      const [fornecedoresSemERPResult] = await mysqlPool.execute("SELECT COUNT(*) as total FROM simplefcfo WHERE codigo_erp IS NULL OR codigo_erp = ''") as any;

      const stats = {
        totalCNPJ: totalCNPJResult[0]?.total || 0,
        nfeRecebidas: nfeRecebidasResult[0]?.total || 0,
        nfeIntegradas: nfeIntegradasResult[0]?.total || 0,
        nfseRecebidas: nfseRecebidasResult[0]?.total || 0,
        nfseIntegradas: nfseIntegradasResult[0]?.total || 0,
        fornecedoresSemERP: fornecedoresSemERPResult[0]?.total || 0
      };

      res.json(stats);
    } catch (error) {
      console.error('Erro ao obter estatísticas do dashboard:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // Rota para obter dados do gráfico de barras - Resumo dos Documentos Fiscais
  app.get("/api/dashboard/chart", authenticateToken, async (req: any, res) => {
    try {
      const { period = 'daily' } = req.query;
      let dateFormat, docGroupBy, nfseGroupBy, interval;
      
      switch (period) {
        case 'daily':
          dateFormat = '%d/%m';
          docGroupBy = 'DATE(doc_date_emi)';
          nfseGroupBy = 'DATE(nfse_data_hora)';
          interval = '7 DAY';
          break;
        case 'weekly':
          dateFormat = 'Sem %u';
          docGroupBy = 'YEARWEEK(doc_date_emi)';
          nfseGroupBy = 'YEARWEEK(nfse_data_hora)';
          interval = '8 WEEK';
          break;
        case 'monthly':
          dateFormat = '%m/%Y';
          docGroupBy = 'YEAR(doc_date_emi), MONTH(doc_date_emi)';
          nfseGroupBy = 'YEAR(nfse_data_hora), MONTH(nfse_data_hora)';
          interval = '12 MONTH';
          break;
        case 'yearly':
          dateFormat = '%Y';
          docGroupBy = 'YEAR(doc_date_emi)';
          nfseGroupBy = 'YEAR(nfse_data_hora)';
          interval = '5 YEAR';
          break;
        default:
          dateFormat = '%d/%m';
          docGroupBy = 'DATE(doc_date_emi)';
          nfseGroupBy = 'DATE(nfse_data_hora)';
          interval = '7 DAY';
      }

      // Consulta dados da tabela DOC (NFe)
      const [docData] = await mysqlPool.execute(`
        SELECT 
          DATE_FORMAT(MIN(doc_date_emi), ?) as date, 
          COUNT(*) as count 
        FROM doc 
        WHERE doc_date_emi IS NOT NULL 
          AND doc_date_emi >= DATE_SUB(NOW(), INTERVAL ${interval})
        GROUP BY ${docGroupBy}
        ORDER BY MIN(doc_date_emi) DESC
        LIMIT 15
      `, [dateFormat]) as any;

      // Consulta dados da tabela NFSE
      const [nfseData] = await mysqlPool.execute(`
        SELECT 
          DATE_FORMAT(MIN(nfse_data_hora), ?) as date, 
          COUNT(*) as count 
        FROM nfse 
        WHERE nfse_data_hora IS NOT NULL 
          AND nfse_data_hora >= DATE_SUB(NOW(), INTERVAL ${interval})
        GROUP BY ${nfseGroupBy}
        ORDER BY MIN(nfse_data_hora) DESC
        LIMIT 15
      `, [dateFormat]) as any;

      // Combina os dados das duas tabelas
      const dateMap: any = {};

      // Processa dados da tabela DOC (NFe)
      docData.forEach((item: any) => {
        dateMap[item.date] = { date: item.date, nfe: item.count, nfse: 0 };
      });

      // Processa dados da tabela NFSE
      nfseData.forEach((item: any) => {
        if (dateMap[item.date]) {
          dateMap[item.date].nfse = item.count;
        } else {
          dateMap[item.date] = { date: item.date, nfe: 0, nfse: item.count };
        }
      });

      // Converte para array e ordena por data
      const chartData = Object.values(dateMap).sort((a: any, b: any) => {
        return a.date.localeCompare(b.date);
      });

      res.json(chartData);
    } catch (error) {
      console.error('Erro ao obter dados do gráfico:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // Rota para obter últimos documentos
  app.get("/api/dashboard/ultimos-documentos", authenticateToken, async (req: any, res) => {
    try {
      const [nfeData] = await mysqlPool.execute(`
        SELECT 'NF-e' as tipo, doc_emit_nome as emitente, doc_valor as valor, 
               doc_date_emi as data, 
               CASE WHEN doc_status_integracao = 1 THEN 'Integrado' ELSE 'Não Integrado' END as status,
               doc_num as numero
        FROM doc 
        ORDER BY doc_date_emi DESC 
        LIMIT 5
      `) as any;

      const [nfseData] = await mysqlPool.execute(`
        SELECT 'NFS-e' as tipo, nfse_emitente as emitente, nfse_valor_servico as valor,
               nfse_data_hora as data,
               CASE WHEN nfse_status_integracao = 1 THEN 'Integrado' ELSE 'Não Integrado' END as status,
               nfse_doc as numero
        FROM nfse 
        ORDER BY nfse_data_hora DESC 
        LIMIT 5
      `) as any;

      const documentos = [...nfeData, ...nfseData]
        .map(doc => ({
          tipo: `${doc.tipo} ${doc.numero}`,
          emitente: doc.emitente,
          valor: doc.valor,
          data: doc.data,
          status: doc.status
        }))
        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
        .slice(0, 10);

      res.json(documentos);
    } catch (error) {
      console.error('Erro ao obter últimos documentos:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // Rota para obter CNPJs ativos
  app.get("/api/dashboard/cnpj-ativos", authenticateToken, async (req: any, res) => {
    try {
      const [cnpjData] = await mysqlPool.execute(`
        SELECT company_cpf_cnpj as cnpj, company_name as nome, 
               'Ativo' as status, NOW() as ultimaCaptura
        FROM company 
        ORDER BY company_name 
        LIMIT 10
      `) as any;

      res.json(cnpjData);
    } catch (error) {
      console.error('Erro ao obter CNPJs ativos:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // Rota para buscar fornecedores (reativada - apenas busca, sem verificação ERP)
  app.get("/api/fornecedores", authenticateToken, async (req: any, res) => {
    try {
      const {
        search = "",
        page = "1",
        limit = "10",
        sortBy = "data_cadastro",
        sortOrder = "desc"
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);
      
      // Build search conditions
      let whereClause = "";
      const queryParams: any[] = [];

      if (search) {
        whereClause = "WHERE (nome LIKE ? OR cnpj LIKE ? OR codigo_erp LIKE ?)";
        queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      // Count total records
      const countQuery = `SELECT COUNT(*) as total FROM simplefcfo ${whereClause}`;
      const [countResult] = await mysqlPool.execute(countQuery, queryParams) as any;
      const total = countResult[0].total;

      // Get fornecedores with pagination and sorting
      const dataQuery = `SELECT id, nome, cnpj, codigo_erp, data_cadastro FROM simplefcfo ${whereClause} ORDER BY ${sortBy} ${sortOrder.toUpperCase()} LIMIT ${parseInt(limit)} OFFSET ${offset}`;
      
      const [fornecedores] = await mysqlPool.execute(dataQuery, queryParams) as any;

      const totalPages = Math.ceil(total / parseInt(limit));

      const response = {
        fornecedores: fornecedores,
        total,
        page: parseInt(page),
        totalPages,
        limit: parseInt(limit)
      };

      res.json(response);
    } catch (error) {
      console.error("Erro ao buscar fornecedores:", error);
      res.status(500).json({ message: "Erro ao buscar fornecedores" });
    }
  });

  // Rota para verificar cadastro no ERP (comentada conforme solicitação)
  /*
  app.post("/api/fornecedores/verificar-erp", authenticateToken, async (req: any, res) => {
    try {
      const { fornecedorId, cnpj } = req.body;

      // Validação básica
      if (!fornecedorId || !cnpj) {
        return res.status(400).json({ message: "ID do fornecedor e CNPJ são obrigatórios" });
      }

      // Verificar se o fornecedor existe (comentado - cadastro na tabela simplefcfo)
      const checkQuery = "SELECT id, nome, cnpj FROM simplefcfo WHERE id = ?";
      const [existing] = await mysqlPool.execute(checkQuery, [fornecedorId]) as any;
      
      if (!existing || existing.length === 0) {
        return res.status(404).json({ message: "Fornecedor não encontrado" });
      }

      const fornecedor = existing[0];

      try {
        // Fazer consulta ao webhook (comentado - webhook https://webhook-n8n.simpleit.app.br/webhook/3f78d932-bba2-426b-995c-42dedea1c8ef)
        const webhookUrl = `https://webhook-n8n.simpleit.app.br/webhook/3f78d932-bba2-426b-995c-42dedea1c8ef?cnpj=${encodeURIComponent(cnpj)}`;
        
        console.log(`Consultando webhook para CNPJ: ${cnpj}`);
        
        const webhookResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        console.log(`Webhook response status: ${webhookResponse.status}`);

        if (webhookResponse.ok) {
          // Verificar se a resposta tem conteúdo
          const responseText = await webhookResponse.text();
          console.log(`Webhook response text: ${responseText}`);
          
          let webhookData = null;
          
          // Tentar fazer parse do JSON apenas se houver conteúdo
          if (responseText && responseText.trim() !== '') {
            try {
              webhookData = JSON.parse(responseText);
            } catch (jsonError) {
              console.error("Erro ao fazer parse do JSON:", jsonError);
              console.log("Response text que causou erro:", responseText);
            }
          }
          
          // Verificar se retornou CODCFO
          if (webhookData && webhookData.CODCFO) {
            // Fornecedor cadastrado no ERP - excluir da tabela (comentado - operação na tabela simplefcfo)
            const deleteQuery = "DELETE FROM simplefcfo WHERE id = ?";
            await mysqlPool.execute(deleteQuery, [fornecedorId]);
            
            console.log(`Fornecedor ${fornecedorId} removido da tabela - CODCFO: ${webhookData.CODCFO}`);
            
            res.json({ 
              cadastrado: true, 
              message: "Fornecedor cadastrado no ERP",
              codcfo: webhookData.CODCFO
            });
          } else {
            // Não retornou CODCFO ou resposta vazia
            res.json({ 
              cadastrado: false, 
              message: "Fornecedor não foi encontrado no ERP" 
            });
          }
        } else {
          // Webhook retornou erro
          console.log(`Webhook retornou erro: ${webhookResponse.status} - ${webhookResponse.statusText}`);
          res.json({ 
            cadastrado: false, 
            message: "Fornecedor não foi encontrado no ERP" 
          });
        }
      } catch (webhookError) {
        console.error("Erro ao consultar webhook:", webhookError);
        // Se houver erro no webhook, assumir que não está cadastrado
        res.json({ 
          cadastrado: false, 
          message: "Erro ao consultar o ERP. Tente novamente." 
        });
      }
    } catch (error) {
      console.error("Erro ao verificar cadastro no ERP:", error);
      res.status(500).json({ message: "Erro ao verificar cadastro no ERP" });
    }
  });
  */

  // Rota para testar conectividade com ERP
  app.get("/api/fornecedores/test-erp", authenticateToken, async (req: any, res) => {
    try {
      console.log('[TEST-ERP] Testando conectividade com ERP');
      
      const response = await fetch(ERP_CONFIG.SOAP_ENDPOINT, {
        method: 'GET',
        headers: {
          'User-Agent': 'SimpleDFe/1.0'
        }
      });

      console.log(`[TEST-ERP] Status da resposta: ${response.status}`);
      const responseText = await response.text();
      console.log(`[TEST-ERP] Resposta: ${responseText.substring(0, 500)}`);

      res.json({
        success: true,
        status: response.status,
        endpoint: ERP_CONFIG.SOAP_ENDPOINT,
        message: `Endpoint respondeu com status ${response.status}`,
        response: responseText.substring(0, 200)
      });

    } catch (error) {
      console.error('[TEST-ERP] Erro no teste:', error);
      res.status(500).json({
        success: false,
        endpoint: ERP_CONFIG.SOAP_ENDPOINT,
        message: `Erro ao conectar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      });
    }
  });

  // Rota para realizar pré-cadastro no ERP
  app.post("/api/fornecedores/pre-cadastro-erp", authenticateToken, async (req: any, res) => {
    try {
      const { fornecedorId } = req.body;

      // Validação básica
      if (!fornecedorId) {
        return res.status(400).json({ message: "ID do fornecedor é obrigatório" });
      }

      console.log(`[PRE-CADASTRO-ERP] Iniciando pré-cadastro para fornecedor ID: ${fornecedorId}`);

      // Buscar dados do fornecedor na base local
      const checkQuery = "SELECT id, nome, cnpj FROM simplefcfo WHERE id = ?";
      const [existing] = await mysqlPool.execute(checkQuery, [fornecedorId]) as any;
      
      if (!existing || existing.length === 0) {
        return res.status(404).json({ message: "Fornecedor não encontrado" });
      }

      const fornecedor = existing[0];
      console.log(`[PRE-CADASTRO-ERP] Fornecedor encontrado: ${fornecedor.nome} (${fornecedor.cnpj})`);

      // Passo 1: Consultar dados do CNPJ na ReceitaWS
      let cnpjData;
      try {
        cnpjData = await CNPJService.consultarCNPJ(fornecedor.cnpj);
        if (!cnpjData) {
          return res.status(400).json({ 
            message: "Não foi possível obter dados do CNPJ na Receita Federal" 
          });
        }
        console.log(`[PRE-CADASTRO-ERP] Dados do CNPJ obtidos com sucesso`);
      } catch (cnpjError) {
        console.error('[PRE-CADASTRO-ERP] Erro ao consultar CNPJ:', cnpjError);
        return res.status(400).json({ 
          message: `Erro ao consultar CNPJ: ${cnpjError instanceof Error ? cnpjError.message : 'Erro desconhecido'}` 
        });
      }

      // Passo 2: Realizar pré-cadastro no ERP via SOAP
      try {
        const erpResult = await ERPService.realizarPreCadastro(cnpjData);
        
        if (erpResult.success) {
          // Se o pré-cadastro foi bem-sucedido e retornou código ERP, atualizar na base local
          if (erpResult.erpCode) {
            const updateQuery = "UPDATE simplefcfo SET codigo_erp = ?, data_cadastro = NOW() WHERE id = ?";
            await mysqlPool.execute(updateQuery, [erpResult.erpCode, fornecedorId]);
            console.log(`[PRE-CADASTRO-ERP] Código ERP ${erpResult.erpCode} atualizado para fornecedor ${fornecedorId}`);
          }

          res.json({
            success: true,
            message: erpResult.message,
            erpCode: erpResult.erpCode,
            fornecedor: {
              id: fornecedor.id,
              nome: fornecedor.nome,
              cnpj: fornecedor.cnpj
            },
            cnpjData: {
              nome: cnpjData.nome,
              fantasia: cnpjData.fantasia,
              municipio: cnpjData.municipio,
              uf: cnpjData.uf,
              situacao: cnpjData.situacao
            }
          });
        } else {
          res.status(400).json({
            success: false,
            message: erpResult.message
          });
        }
      } catch (erpError) {
        console.error('[PRE-CADASTRO-ERP] Erro no ERP:', erpError);
        res.status(500).json({
          success: false,
          message: `Erro no sistema ERP: ${erpError instanceof Error ? erpError.message : 'Erro desconhecido'}`
        });
      }

    } catch (error) {
      console.error("[PRE-CADASTRO-ERP] Erro geral:", error);
      res.status(500).json({ 
        success: false,
        message: "Erro interno do servidor ao realizar pré-cadastro" 
      });
    }
  });

  // Rota para visualizar logs SOAP de debug
  app.get("/api/fornecedores/soap-logs/:cnpj", authenticateToken, async (req: any, res) => {
    try {
      const { cnpj } = req.params;
      
      if (!cnpj) {
        return res.status(400).json({ message: "CNPJ é obrigatório" });
      }

      // Remove formatação do CNPJ para busca
      const cleanCNPJ = cnpj.replace(/[^\d]/g, '');
      const logs = ERPService.getSoapLogs(cleanCNPJ);

      res.json({
        success: true,
        cnpj: cleanCNPJ,
        logs: logs
      });

    } catch (error) {
      console.error('[SOAP-LOGS] Erro ao buscar logs:', error);
      res.status(500).json({
        success: false,
        message: `Erro ao buscar logs SOAP: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      });
    }
  });

  // Rota para limpar logs SOAP de debug
  app.delete("/api/fornecedores/soap-logs/:cnpj", authenticateToken, async (req: any, res) => {
    try {
      const { cnpj } = req.params;
      
      if (!cnpj) {
        return res.status(400).json({ message: "CNPJ é obrigatório" });
      }

      // Remove formatação do CNPJ para busca
      const cleanCNPJ = cnpj.replace(/[^\d]/g, '');
      
      // Limpar logs SOAP para este CNPJ
      const cleared = ERPService.clearSoapLogs(cleanCNPJ);

      res.json({
        success: true,
        message: cleared ? "Logs SOAP limpos com sucesso" : "Nenhum log encontrado para limpar",
        cnpj: cleanCNPJ
      });

    } catch (error) {
      console.error('[SOAP-LOGS] Erro ao limpar logs:', error);
      res.status(500).json({
        success: false,
        message: `Erro ao limpar logs SOAP: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      });
    }
  });

  // Rota para download em lote de XMLs da NFe
  app.post('/api/nfe-bulk-download-xml', authenticateToken, async (req: any, res) => {
    try {
      // Log de auditoria para download em lote
      const { docIds } = req.body;
      await AuditLogger.logBulkDownload(req, "NFe", "XML", docIds?.length || 0);
      
      if (!docIds || !Array.isArray(docIds) || docIds.length === 0) {
        return res.status(400).json({ error: 'IDs dos documentos são obrigatórios' });
      }

      const idsString = docIds.join(',');
      const apiUrl = `http://robolbv.simpledfe.com.br/api/pegar_varios_nfe.php?id=${idsString}`;
      
      console.log('Fazendo requisição para:', apiUrl);
      
      // Fazer requisição para a API externa
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`Erro na API externa: ${response.status}`);
      }

      // Configurar headers para download do ZIP
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="xml_nfe.zip"');
      
      // Retornar o buffer da resposta
      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));
      
    } catch (error) {
      console.error('Erro no download em lote de XMLs:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Rota para download em lote de DANFEs da NFe
  app.post('/api/nfe-bulk-download-danfe', authenticateToken, async (req: any, res) => {
    try {
      // Log de auditoria para download em lote
      const { docIds } = req.body;
      await AuditLogger.logBulkDownload(req, "NFe", "DANFE", docIds?.length || 0);
      
      if (!docIds || !Array.isArray(docIds) || docIds.length === 0) {
        return res.status(400).json({ error: 'IDs dos documentos são obrigatórios' });
      }

      const idsString = docIds.join(',');
      const apiUrl = `http://robolbv.simpledfe.com.br/api/baixar_danfe_lote.php?id=${idsString}`;
      
      console.log('Fazendo requisição para:', apiUrl);
      
      // Fazer requisição para a API externa
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`Erro na API externa: ${response.status}`);
      }

      // Configurar headers para download do ZIP
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="danfe_nfe.zip"');
      
      // Retornar o buffer da resposta
      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));
      
    } catch (error) {
      console.error('Erro no download em lote de DANFEs:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Rota para download em lote de XMLs da NFSe
  app.post('/api/nfse-bulk-download-xml', authenticateToken, async (req: any, res) => {
    try {
      // Log de auditoria para download em lote
      const { nfseIds } = req.body;
      await AuditLogger.logBulkDownload(req, "NFSe", "XML", nfseIds?.length || 0);
      
      if (!nfseIds || !Array.isArray(nfseIds) || nfseIds.length === 0) {
        return res.status(400).json({ error: 'IDs das NFSe são obrigatórios' });
      }

      console.log('Download em lote XMLs NFSe - IDs:', nfseIds);

      const AdmZip = (await import('adm-zip')).default;
      const zip = new AdmZip();

      // Buscar XMLs de cada NFSe
      for (const nfseId of nfseIds) {
        try {
          const [rows] = await mysqlPool.execute(
            'SELECT nfse_xml FROM nfse WHERE nfse_id = ?',
            [nfseId]
          ) as any;

          if (rows.length > 0) {
            let xmlContent = rows[0].nfse_xml;
            
            // Converter Buffer para string se necessário
            if (Buffer.isBuffer(xmlContent)) {
              xmlContent = xmlContent.toString('utf-8');
            }
            
            // Decodificar base64 se necessário
            if (typeof xmlContent === 'string' && xmlContent.match(/^[A-Za-z0-9+/=]+$/)) {
              try {
                xmlContent = Buffer.from(xmlContent, 'base64').toString('utf-8');
              } catch (e) {
                // Se falhar na decodificação, usar string original
              }
            }

            // Adicionar XML ao ZIP
            zip.addFile(`nfse_${nfseId}.xml`, Buffer.from(xmlContent, 'utf-8'));
          }
        } catch (error) {
          console.error(`Erro ao buscar XML da NFSe ${nfseId}:`, error);
        }
      }

      // Configurar headers para download do ZIP
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="xml_nfse.zip"');
      
      // Enviar o ZIP
      const zipBuffer = zip.toBuffer();
      res.send(zipBuffer);
      
    } catch (error) {
      console.error('Erro no download em lote de XMLs NFSe:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Rota para download em lote de DANFSe
  app.post('/api/nfse-bulk-download-danfse', authenticateToken, async (req: any, res) => {
    try {
      // Log de auditoria para download em lote
      const { nfseIds } = req.body;
      await AuditLogger.logBulkDownload(req, "NFSe", "DANFSe", nfseIds?.length || 0);
      
      if (!nfseIds || !Array.isArray(nfseIds) || nfseIds.length === 0) {
        return res.status(400).json({ error: 'IDs das NFSe são obrigatórios' });
      }

      console.log('Download em lote DANFSe - IDs:', nfseIds);

      const AdmZip = (await import('adm-zip')).default;
      const zip = new AdmZip();

      // Gerar DANFSe para cada NFSe
      for (const nfseId of nfseIds) {
        try {
          const [rows] = await mysqlPool.execute(
            'SELECT nfse_xml FROM nfse WHERE nfse_id = ?',
            [nfseId]
          ) as any;

          if (rows.length > 0) {
            let xmlContent = rows[0].nfse_xml;
            
            // Converter Buffer para string se necessário
            if (Buffer.isBuffer(xmlContent)) {
              xmlContent = xmlContent.toString('utf-8');
            }
            
            // Decodificar base64 se necessário
            if (typeof xmlContent === 'string' && xmlContent.match(/^[A-Za-z0-9+/=]+$/)) {
              try {
                xmlContent = Buffer.from(xmlContent, 'base64').toString('utf-8');
              } catch (e) {
                // Se falhar na decodificação, usar string original
              }
            }

            // Gerar DANFSe usando a função existente
            const { generateDANFSE } = await import('./danfse-layout-final');
            const result = await generateDANFSE(xmlContent);
            
            if (result.success && result.pdfPath) {
              // Ler o arquivo PDF gerado
              const fs = await import('fs');
              const pdfBuffer = fs.readFileSync(result.pdfPath);
              
              // Adicionar PDF ao ZIP
              zip.addFile(`danfse_${nfseId}.pdf`, pdfBuffer);
              
              // Remover arquivo temporário
              fs.unlinkSync(result.pdfPath);
            }
          }
        } catch (error) {
          console.error(`Erro ao gerar DANFSe ${nfseId}:`, error);
        }
      }

      // Configurar headers para download do ZIP
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="danfse_nfse.zip"');
      
      // Enviar o ZIP
      const zipBuffer = zip.toBuffer();
      res.send(zipBuffer);
      
    } catch (error) {
      console.error('Erro no download em lote de DANFSe:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Rota para exportação de XMLs NFe por data e empresa
  app.post('/api/relatorios/nfe-export-xml', authenticateToken, async (req: any, res) => {
    try {
      const { dataInicial, dataFinal, empresa } = req.body;
      
      if (!dataInicial || !dataFinal) {
        return res.status(400).json({ error: 'Datas são obrigatórias' });
      }

      console.log('Exportação XML NFe - Filtros:', { dataInicial, dataFinal, empresa });

      // Construir query para buscar NFes do período
      let query = `
        SELECT doc_id 
        FROM doc 
        WHERE DATE(doc_date_emi) >= ? AND DATE(doc_date_emi) <= ?
      `;
      const params = [dataInicial, dataFinal];

      // Adicionar filtro de empresa se especificado
      if (empresa && empresa !== 'all') {
        query += ' AND doc_dest_cnpj = ?';
        params.push(empresa);
      }

      const [nfes] = await mysqlPool.execute(query, params) as any;
      
      if (nfes.length === 0) {
        return res.status(404).json({ error: 'Nenhuma NFe encontrada no período especificado' });
      }

      // Usar a mesma API de download em lote
      const docIds = nfes.map((nfe: any) => nfe.doc_id);
      const idsString = docIds.join(',');
      const apiUrl = `http://robolbv.simpledfe.com.br/api/pegar_varios_nfe.php?id=${idsString}`;
      
      console.log('Fazendo requisição para:', apiUrl);
      
      // Fazer requisição para a API externa
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`Erro na API externa: ${response.status}`);
      }

      // Configurar headers para download do ZIP
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="xml_nfe.zip"');
      
      // Retornar o buffer da resposta
      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));
      
    } catch (error) {
      console.error('Erro na exportação de XMLs NFe:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Rota para exportação de DANFEs NFe por data e empresa
  app.post('/api/relatorios/nfe-export-danfe', authenticateToken, async (req: any, res) => {
    try {
      const { dataInicial, dataFinal, empresa } = req.body;
      
      if (!dataInicial || !dataFinal) {
        return res.status(400).json({ error: 'Datas são obrigatórias' });
      }

      console.log('Exportação DANFE NFe - Filtros:', { dataInicial, dataFinal, empresa });

      // Construir query para buscar NFes do período
      let query = `
        SELECT doc_id 
        FROM doc 
        WHERE DATE(doc_date_emi) >= ? AND DATE(doc_date_emi) <= ?
      `;
      const params = [dataInicial, dataFinal];

      // Adicionar filtro de empresa se especificado
      if (empresa && empresa !== 'all') {
        query += ' AND doc_dest_cnpj = ?';
        params.push(empresa);
      }

      const [nfes] = await mysqlPool.execute(query, params) as any;
      
      if (nfes.length === 0) {
        return res.status(404).json({ error: 'Nenhuma NFe encontrada no período especificado' });
      }

      // Usar a mesma API de download em lote
      const docIds = nfes.map((nfe: any) => nfe.doc_id);
      const idsString = docIds.join(',');
      const apiUrl = `http://robolbv.simpledfe.com.br/api/baixar_danfe_lote.php?id=${idsString}`;
      
      console.log('Fazendo requisição para:', apiUrl);
      
      // Fazer requisição para a API externa
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`Erro na API externa: ${response.status}`);
      }

      // Configurar headers para download do ZIP
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="danfe_nfe.zip"');
      
      // Retornar o buffer da resposta
      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));
      
    } catch (error) {
      console.error('Erro na exportação de DANFEs NFe:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Rota para exportação de XMLs NFSe por data e empresa
  app.post('/api/relatorios/nfse-export-xml', authenticateToken, async (req: any, res) => {
    try {
      const { dataInicial, dataFinal, empresa } = req.body;
      
      if (!dataInicial || !dataFinal) {
        return res.status(400).json({ error: 'Datas são obrigatórias' });
      }

      console.log('Exportação XML NFSe - Filtros:', { dataInicial, dataFinal, empresa });

      // Construir query para buscar NFSes do período
      let query = `
        SELECT nfse_id 
        FROM nfse 
        WHERE DATE(nfse_data_hora) >= ? AND DATE(nfse_data_hora) <= ?
      `;
      const params = [dataInicial, dataFinal];

      // Adicionar filtro de empresa se especificado
      if (empresa && empresa !== 'all') {
        query += ' AND nfse_tomador_cnpj = ?';
        params.push(empresa);
      }

      const [nfses] = await mysqlPool.execute(query, params) as any;
      
      if (nfses.length === 0) {
        return res.status(404).json({ error: 'Nenhuma NFSe encontrada no período especificado' });
      }

      // Usar as APIs de download em lote existentes
      const nfseIds = nfses.map((nfse: any) => nfse.nfse_id);
      
      const AdmZip = (await import('adm-zip')).default;
      const zip = new AdmZip();

      // Buscar XMLs de cada NFSe
      for (const nfseId of nfseIds) {
        try {
          const [rows] = await mysqlPool.execute(
            'SELECT nfse_xml FROM nfse WHERE nfse_id = ?',
            [nfseId]
          ) as any;

          if (rows.length > 0) {
            let xmlContent = rows[0].nfse_xml;
            
            // Converter Buffer para string se necessário
            if (Buffer.isBuffer(xmlContent)) {
              xmlContent = xmlContent.toString('utf-8');
            }
            
            // Decodificar base64 se necessário
            if (typeof xmlContent === 'string' && xmlContent.match(/^[A-Za-z0-9+/=]+$/)) {
              try {
                xmlContent = Buffer.from(xmlContent, 'base64').toString('utf-8');
              } catch (e) {
                // Se falhar na decodificação, usar string original
              }
            }

            // Adicionar XML ao ZIP
            zip.addFile(`nfse_${nfseId}.xml`, Buffer.from(xmlContent, 'utf-8'));
          }
        } catch (error) {
          console.error(`Erro ao buscar XML da NFSe ${nfseId}:`, error);
        }
      }

      // Configurar headers para download do ZIP
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="xml_nfse.zip"');
      
      // Enviar o ZIP
      const zipBuffer = zip.toBuffer();
      res.send(zipBuffer);
      
    } catch (error) {
      console.error('Erro na exportação de XMLs NFSe:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Rota para exportação de DANFSe por data e empresa
  app.post('/api/relatorios/nfse-export-danfse', authenticateToken, async (req: any, res) => {
    try {
      const { dataInicial, dataFinal, empresa } = req.body;
      
      if (!dataInicial || !dataFinal) {
        return res.status(400).json({ error: 'Datas são obrigatórias' });
      }

      console.log('Exportação DANFSe NFSe - Filtros:', { dataInicial, dataFinal, empresa });

      // Construir query para buscar NFSes do período
      let query = `
        SELECT nfse_id 
        FROM nfse 
        WHERE DATE(nfse_data_hora) >= ? AND DATE(nfse_data_hora) <= ?
      `;
      const params = [dataInicial, dataFinal];

      // Adicionar filtro de empresa se especificado
      if (empresa && empresa !== 'all') {
        query += ' AND nfse_tomador_cnpj = ?';
        params.push(empresa);
      }

      const [nfses] = await mysqlPool.execute(query, params) as any;
      
      if (nfses.length === 0) {
        return res.status(404).json({ error: 'Nenhuma NFSe encontrada no período especificado' });
      }

      // Usar as APIs de download em lote existentes
      const nfseIds = nfses.map((nfse: any) => nfse.nfse_id);
      
      const AdmZip = (await import('adm-zip')).default;
      const zip = new AdmZip();

      // Gerar DANFSe para cada NFSe
      for (const nfseId of nfseIds) {
        try {
          const [rows] = await mysqlPool.execute(
            'SELECT nfse_xml FROM nfse WHERE nfse_id = ?',
            [nfseId]
          ) as any;

          if (rows.length > 0) {
            let xmlContent = rows[0].nfse_xml;
            
            // Converter Buffer para string se necessário
            if (Buffer.isBuffer(xmlContent)) {
              xmlContent = xmlContent.toString('utf-8');
            }
            
            // Decodificar base64 se necessário
            if (typeof xmlContent === 'string' && xmlContent.match(/^[A-Za-z0-9+/=]+$/)) {
              try {
                xmlContent = Buffer.from(xmlContent, 'base64').toString('utf-8');
              } catch (e) {
                // Se falhar na decodificação, usar string original
              }
            }

            // Gerar DANFSe usando a função existente
            const { generateDANFSE } = await import('./danfse-layout-final');
            const result = await generateDANFSE(xmlContent);
            
            if (result.success && result.pdfPath) {
              // Ler o arquivo PDF gerado
              const fs = await import('fs');
              const pdfBuffer = fs.readFileSync(result.pdfPath);
              
              // Adicionar PDF ao ZIP
              zip.addFile(`danfse_${nfseId}.pdf`, pdfBuffer);
              
              // Remover arquivo temporário
              fs.unlinkSync(result.pdfPath);
            }
          }
        } catch (error) {
          console.error(`Erro ao gerar DANFSe ${nfseId}:`, error);
        }
      }

      // Configurar headers para download do ZIP
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="danfse_nfse.zip"');
      
      // Enviar o ZIP
      const zipBuffer = zip.toBuffer();
      res.send(zipBuffer);
      
    } catch (error) {
      console.error('Erro na exportação de DANFSe NFSe:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Rota para download de XML da NFe via API externa
  app.get("/api/nfe-download/:doc_id", authenticateToken, async (req: any, res) => {
    try {
      const { doc_id } = req.params;
      
      // Log de auditoria para download individual
      await AuditLogger.logDocumentDownload(req, "NFe", doc_id, "XML");
      
      const apiUrl = `https://robolbv.simpledfe.com.br/api/doc_download_api.php?doc_id=${doc_id}`;
      
      // Fazer a chamada para a API externa
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`Erro na API externa: ${response.status}`);
      }
      
      // Extrair o nome do arquivo do cabeçalho Content-Disposition
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `nfe_${doc_id}.xml`; // fallback
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }
      
      // Encaminhar o arquivo para o cliente
      const buffer = await response.arrayBuffer();
      
      res.setHeader('Content-Type', response.headers.get('content-type') || 'application/xml');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(Buffer.from(buffer));
      
    } catch (error) {
      console.error("Erro ao baixar XML da NFe:", error);
      res.status(500).json({ message: "Erro ao baixar XML da NFe" });
    }
  });

  // Rota para buscar eventos de uma NFe
  app.get("/api/nfe-eventos/:doc_id", authenticateToken, async (req: any, res) => {
    try {
      const { doc_id } = req.params;
      
      // Log de auditoria para visualização de eventos NFe
      await AuditLogger.logDocumentView(req, "NFe", doc_id, "Eventos");
      
      // Primeiro buscar a NFe para obter doc_id_company e doc_chave
      const nfeQuery = `
        SELECT doc_id_company, doc_chave 
        FROM doc 
        WHERE doc_id = ?
      `;
      
      const [nfeResult] = await mysqlPool.execute(nfeQuery, [doc_id]) as any;
      
      if (nfeResult.length === 0) {
        return res.status(404).json({ message: "NFe não encontrada" });
      }
      
      const { doc_id_company, doc_chave } = nfeResult[0];
      
      // Buscar eventos relacionados
      const eventosQuery = `
        SELECT 
          eventos_id,
          eventos_id_company,
          eventos_chave,
          eventos_code_evento,
          eventos_desc_evento,
          eventos_data,
          eventos_prot
        FROM eventos 
        WHERE eventos_id_company = ? AND eventos_chave = ?
        ORDER BY eventos_data DESC
      `;
      
      const [eventos] = await mysqlPool.execute(eventosQuery, [doc_id_company, doc_chave]) as any;
      
      res.json({ eventos });
    } catch (error) {
      console.error("Eventos fetch error:", error);
      res.status(500).json({ message: "Erro ao buscar eventos da NFe" });
    }
  });

  // CTe Recebidas endpoints
  app.get("/api/cte-recebidas", authenticateToken, async (req: any, res) => {
    try {
      // Log de auditoria para acesso ao menu
      await AuditLogger.logMenuAccess(req, "CTe Recebidas");
      console.log("CTe Recebidas - Starting request");
      const {
        search = "",
        status = "all",
        empresa = "",
        fornecedor = "",
        dataInicio = "",
        dataFim = "",
        page = "1",
        limit = "10",
        sortBy = "cte_numero",
        sortOrder = "desc"
      } = req.query;
      
      console.log("CTe Recebidas - Query params:", { search, status, empresa, fornecedor, dataInicio, dataFim, page, limit, sortBy, sortOrder });

      const offset = (parseInt(page) - 1) * parseInt(limit);
      
      // Build search conditions
      let searchConditions: string[] = [];
      const searchParams: any[] = [];
      
      if (search) {
        searchConditions.push(`(
          c.cte_numero LIKE ? OR 
          c.cte_destinatario_nome LIKE ? OR 
          c.cte_emitente_nome LIKE ? OR 
          c.cte_emitente_doc LIKE ? OR 
          c.cte_id_integracao LIKE ? OR
          co.company_name LIKE ?
        )`);
        const searchTerm = `%${search}%`;
        searchParams.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
      }

      if (status !== "all") {
        if (status === "integrated") {
          searchConditions.push("c.cte_status_integracao = 1");
        } else if (status === "not_integrated") {
          searchConditions.push("c.cte_status_integracao = 0");
        }
      }

      if (empresa) {
        searchConditions.push("(c.cte_destinatario_nome LIKE ? OR co.company_name LIKE ?)");
        searchParams.push(`%${empresa}%`, `%${empresa}%`);
      }

      if (fornecedor) {
        searchConditions.push("c.cte_emitente_nome LIKE ?");
        searchParams.push(`%${fornecedor}%`);
      }

      if (dataInicio) {
        searchConditions.push("DATE(c.cte_data_emissao) >= ?");
        searchParams.push(dataInicio);
      }

      if (dataFim) {
        searchConditions.push("DATE(c.cte_data_emissao) <= ?");
        searchParams.push(dataFim);
      }

      const whereClause = searchConditions.length > 0 ? `WHERE ${searchConditions.join(" AND ")}` : "";

      // Count total records
      const countQuery = `SELECT COUNT(*) as total FROM cte c LEFT JOIN company co ON c.cte_id_company = co.company_id ${whereClause}`;
      const [countResult] = await mysqlPool.execute(countQuery, searchParams) as any;
      const total = countResult[0].total;

      // Get CTes with pagination and sorting + company relationship + eventos info
      const dataQuery = `
        SELECT 
          c.cte_id,
          c.cte_numero,
          c.cte_destinatario_nome,
          c.cte_emitente_nome,
          c.cte_emitente_doc,
          c.cte_data_emissao,
          c.cte_valor,
          c.cte_status_integracao,
          c.cte_id_integracao,
          c.cte_codcfo,
          c.cte_id_company,
          c.cte_status,
          c.cte_serie,
          c.cte_chave_acesso,
          COALESCE(co.company_name, c.cte_destinatario_nome) as empresa_nome,
          co.company_cpf_cnpj,
          CASE 
            WHEN e.cte_evento_id IS NOT NULL THEN 1 
            ELSE 0 
          END as has_evento
        FROM cte c
        LEFT JOIN company co ON c.cte_id_company = co.company_id
        LEFT JOIN cte_evento e ON c.cte_chave_acesso = e.cte_evento_chave_acesso AND c.cte_id_company = e.cte_evento_id_empresa
        ${whereClause}
        GROUP BY c.cte_id
        ORDER BY ${sortBy.startsWith('cte_') ? 'c.' + sortBy : sortBy} ${sortOrder.toUpperCase()}
        LIMIT ${parseInt(limit)} OFFSET ${offset}
      `;

      const [ctes] = await mysqlPool.execute(dataQuery, searchParams) as any;

      const totalPages = Math.ceil(total / parseInt(limit));

      const response: CTeResponse = {
        ctes,
        total,
        page: parseInt(page),
        totalPages,
        limit: parseInt(limit)
      };

      res.json(response);
    } catch (error) {
      console.error("CTe fetch error:", error);
      res.status(500).json({ message: "Erro ao buscar CTe recebidas" });
    }
  });

  // Get single CTe
  app.get("/api/cte-recebidas/:numero", authenticateToken, async (req: any, res) => {
    try {
      const { numero } = req.params;
      
      const query = `
        SELECT 
          cte_numero,
          cte_destinatario_nome,
          cte_emitente_nome,
          cte_emitente_doc,
          cte_data_emissao,
          cte_valor,
          cte_status_integracao,
          cte_id_integracao,
          cte_codcfo
        FROM cte 
        WHERE cte_numero = ?
      `;

      const [ctes] = await mysqlPool.execute(query, [numero]) as any;
      
      if (ctes.length === 0) {
        return res.status(404).json({ message: "CTe não encontrada" });
      }

      res.json({ cte: ctes[0] });
    } catch (error) {
      console.error("CTe fetch error:", error);
      res.status(500).json({ message: "Erro ao buscar CTe" });
    }
  });

  // Rota para download de XML da CTe via API externa
  app.get("/api/cte-download/:cte_id", authenticateToken, async (req: any, res) => {
    try {
      const { cte_id } = req.params;
      
      // Log de auditoria para download individual de XML CTe
      await AuditLogger.logDocumentDownload(req, "CTe", cte_id, "XML");
      
      const apiUrl = `https://robolbv.simpledfe.com.br/api/cte_download_api.php?cte_id=${cte_id}`;
      
      // Fazer a chamada para a API externa
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`Erro na API externa: ${response.status}`);
      }
      
      // Extrair o nome do arquivo do cabeçalho Content-Disposition
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `cte_${cte_id}.xml`; // fallback
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }
      
      // Encaminhar o arquivo para o cliente
      const buffer = await response.arrayBuffer();
      
      res.setHeader('Content-Type', response.headers.get('content-type') || 'application/xml');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      res.send(Buffer.from(buffer));
      
    } catch (error) {
      console.error("Erro no download de XML da CTe:", error);
      res.status(500).json({ message: "Erro ao baixar XML da CTe" });
    }
  });

  // Rota para download em lote de XMLs da CTe
  app.post('/api/cte-bulk-download-xml', authenticateToken, async (req: any, res) => {
    try {
      const { cteIds } = req.body;
      
      // Log de auditoria para download em lote
      await AuditLogger.logBulkDownload(req, "CTe", "XML", cteIds?.length || 0);
      
      if (!cteIds || !Array.isArray(cteIds) || cteIds.length === 0) {
        return res.status(400).json({ error: 'IDs das CTe são obrigatórios' });
      }

      const idsString = cteIds.join(',');
      const apiUrl = `http://robolbv.simpledfe.com.br/api/pegar_varios_cte.php?id=${idsString}`;
      
      console.log('Fazendo requisição para:', apiUrl);
      
      // Fazer requisição para a API externa
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`Erro na API externa: ${response.status}`);
      }

      // Configurar headers para download do ZIP
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="xml_cte.zip"');
      
      // Retornar o buffer da resposta
      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));
      
    } catch (error) {
      console.error('Erro no download em lote de XMLs CTe:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Rota para gerar e exibir DACTE da CTe
  app.get("/api/cte-dacte/:cte_id", authenticateToken, async (req: any, res) => {
    try {
      const { cte_id } = req.params;
      
      // Log de auditoria para visualização de DACTE
      await AuditLogger.logDocumentView(req, "CTe", cte_id, "DACTE");
      
      // Log de auditoria para impressão de DACTE
      await AuditLogger.logDocumentDownload(req, "CTe", cte_id, "DACTE");
      
      // Primeiro, baixar o XML da API externa
      const apiUrl = `https://robolbv.simpledfe.com.br/api/cte_download_api.php?cte_id=${cte_id}`;
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`Erro ao baixar XML da API externa: ${response.status}`);
      }
      
      const xmlContent = await response.text();
      
      // Importar a função para gerar DACTE
      const { generateDACTE } = await import('./dacte-utils');
      
      // Gerar o PDF do DACTE
      const result = await generateDACTE(xmlContent);
      
      if (!result.success) {
        throw new Error(`Erro ao gerar DACTE: ${result.error}`);
      }
      
      // Ler o arquivo PDF gerado
      const fs = await import('fs');
      const pdfBuffer = fs.readFileSync(result.pdfPath!);
      
      // Definir headers para exibir o PDF no navegador
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="dacte_${cte_id}.pdf"`);
      res.send(pdfBuffer);
      
      // Limpar o arquivo temporário
      try {
        fs.unlinkSync(result.pdfPath!);
      } catch (cleanupError) {
        console.warn('Erro ao limpar arquivo temporário:', cleanupError);
      }
      
    } catch (error) {
      console.error("Erro ao gerar DACTE:", error);
      res.status(500).json({ message: "Erro ao gerar DACTE da CTe" });
    }
  });

  // Rota para download em lote de DACTEs da CTe
  app.post('/api/cte-bulk-download-dacte', authenticateToken, async (req: any, res) => {
    try {
      // Log de auditoria para download em lote
      const { cteIds } = req.body;
      await AuditLogger.logBulkDownload(req, "CTe", "DACTE", cteIds?.length || 0);
      
      if (!cteIds || !Array.isArray(cteIds) || cteIds.length === 0) {
        return res.status(400).json({ error: 'IDs das CTe são obrigatórios' });
      }

      console.log('Download em lote DACTEs CTe - IDs:', cteIds);

      const AdmZip = (await import('adm-zip')).default;
      const zip = new AdmZip();
      const { generateDACTE } = await import('./dacte-utils');

      let successCount = 0;
      let errorCount = 0;

      // Gerar DACTE para cada CTe
      for (const cteId of cteIds) {
        try {
          console.log(`Gerando DACTE para CTe ID: ${cteId}`);
          
          // Baixar o XML da API externa
          const apiUrl = `https://robolbv.simpledfe.com.br/api/cte_download_api.php?cte_id=${cteId}`;
          const response = await fetch(apiUrl);
          
          if (!response.ok) {
            console.error(`Erro ao baixar XML da CTe ${cteId}: ${response.status}`);
            errorCount++;
            continue;
          }
          
          const xmlContent = await response.text();
          
          // Gerar o PDF do DACTE
          const result = await generateDACTE(xmlContent);
          
          if (!result.success) {
            console.error(`Erro ao gerar DACTE da CTe ${cteId}: ${result.error}`);
            errorCount++;
            continue;
          }
          
          // Ler o arquivo PDF gerado
          const fs = await import('fs');
          const pdfBuffer = fs.readFileSync(result.pdfPath!);
          
          // Adicionar PDF ao ZIP
          zip.addFile(`dacte_${cteId}.pdf`, pdfBuffer);
          successCount++;
          
          // Limpar o arquivo temporário
          try {
            fs.unlinkSync(result.pdfPath!);
          } catch (cleanupError) {
            console.warn('Erro ao limpar arquivo temporário:', cleanupError);
          }
          
        } catch (error) {
          console.error(`Erro ao processar CTe ${cteId}:`, error);
          errorCount++;
        }
      }

      if (successCount === 0) {
        return res.status(500).json({ error: 'Nenhum DACTE pôde ser gerado' });
      }

      // Configurar headers para download do ZIP
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="dacte_cte.zip"');
      
      // Enviar o ZIP
      const zipBuffer = zip.toBuffer();
      console.log(`ZIP gerado com ${successCount} DACTEs (${errorCount} erros)`);
      res.send(zipBuffer);
      
    } catch (error) {
      console.error('Erro no download em lote de DACTEs CTe:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Rota para buscar eventos de uma CTe
  app.get("/api/cte-eventos/:cte_id", authenticateToken, async (req: any, res) => {
    try {
      const { cte_id } = req.params;
      
      // Log de auditoria para visualização de eventos CTe
      await AuditLogger.logDocumentView(req, "CTe", cte_id, "Eventos");
      
      // Primeiro buscar a CTe para obter cte_id_company e cte_chave_acesso
      const cteQuery = `
        SELECT cte_id_company, cte_chave_acesso 
        FROM cte 
        WHERE cte_id = ?
      `;
      
      const [cteResult] = await mysqlPool.execute(cteQuery, [cte_id]) as any;
      
      if (cteResult.length === 0) {
        return res.status(404).json({ message: "CTe não encontrada" });
      }
      
      const { cte_id_company, cte_chave_acesso } = cteResult[0];
      
      // Buscar eventos relacionados
      const eventosQuery = `
        SELECT 
          cte_evento_id,
          cte_evento_id_empresa,
          cte_evento_chave_acesso,
          cte_evento_tipo,
          cte_evento_descricao,
          cte_evento_data,
          cte_evento_xml
        FROM cte_evento 
        WHERE cte_evento_id_empresa = ? AND cte_evento_chave_acesso = ?
        ORDER BY cte_evento_data DESC
      `;
      
      const [eventos] = await mysqlPool.execute(eventosQuery, [cte_id_company, cte_chave_acesso]) as any;
      
      res.json({ eventos });
    } catch (error) {
      console.error("CTe Eventos fetch error:", error);
      res.status(500).json({ message: "Erro ao buscar eventos da CTe" });
    }
  });

  // Rota para download de XML da NFSe via API externa
  app.get("/api/nfse-download/:nfse_id", authenticateToken, async (req: any, res) => {
    try {
      const { nfse_id } = req.params;
      
      // Log de auditoria para download individual
      await AuditLogger.logDocumentDownload(req, "NFSe", nfse_id, "XML");
      const apiUrl = `https://robolbv.simpledfe.com.br/api/nfse_download_api.php?nfse_id=${nfse_id}`;
      
      // Fazer a chamada para a API externa
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`Erro na API externa: ${response.status}`);
      }
      
      // Extrair o nome do arquivo do cabeçalho Content-Disposition
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `nfse_${nfse_id}.xml`; // fallback
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }
      
      // Encaminhar o arquivo para o cliente
      const buffer = await response.arrayBuffer();
      
      res.setHeader('Content-Type', response.headers.get('content-type') || 'application/xml');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(Buffer.from(buffer));
      
    } catch (error) {
      console.error("Erro ao baixar XML da NFSe:", error);
      res.status(500).json({ message: "Erro ao baixar XML da NFSe" });
    }
  });

  // Rota para gerar e exibir DANFE da NFe
  app.get("/api/nfe-danfe/:doc_id", authenticateToken, async (req: any, res) => {
    try {
      const { doc_id } = req.params;
      
      // Log de auditoria para visualização de DANFE
      await AuditLogger.logDocumentView(req, "NFe", doc_id, "DANFE");
      
      // Log de auditoria para impressão de DANFE
      await AuditLogger.logDocumentDownload(req, "NFe", doc_id, "DANFE");
      
      // Primeiro, baixar o XML da API externa
      const apiUrl = `https://robolbv.simpledfe.com.br/api/doc_download_api.php?doc_id=${doc_id}`;
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`Erro ao baixar XML da API externa: ${response.status}`);
      }
      
      const xmlContent = await response.text();
      
      // Importar a função para gerar DANFE
      const { generateDANFE } = await import('./danfe-utils');
      
      // Gerar o PDF do DANFE
      const result = await generateDANFE(xmlContent);
      
      if (!result.success) {
        throw new Error(`Erro ao gerar DANFE: ${result.error}`);
      }
      
      // Ler o arquivo PDF gerado
      const fs = await import('fs');
      const pdfBuffer = fs.readFileSync(result.pdfPath!);
      
      // Definir headers para exibir o PDF no navegador
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="danfe_${doc_id}.pdf"`);
      res.send(pdfBuffer);
      
      // Limpar arquivo temporário
      fs.unlinkSync(result.pdfPath!);
      
    } catch (error) {
      console.error("Erro ao gerar DANFE:", error);
      res.status(500).json({ message: "Erro ao gerar DANFE", error: (error as Error).message });
    }
  });

  // Rota para gerar e exibir DANFSe da NFSe
  app.get("/api/nfse-danfse/:nfse_id", authenticateToken, async (req: any, res) => {
    try {
      const { nfse_id } = req.params;
      
      // Log de auditoria para visualização de DANFSe
      await AuditLogger.logDocumentView(req, "NFSe", nfse_id, "DANFSe");
      
      // Log de auditoria para impressão de DANFSe
      await AuditLogger.logDocumentDownload(req, "NFSe", nfse_id, "DANFSe");
      console.log('DANFSe - Requisição recebida para NFSe ID:', nfse_id);
      
      // Buscar o XML da NFSe na base de dados MySQL
      const query = "SELECT nfse_xml FROM nfse WHERE nfse_id = ?";
      console.log('Executando query MySQL:', query);
      
      const [results] = await mysqlPool.execute(query, [nfse_id]) as any[];
      console.log('Query executada, resultados:', results?.length || 0, 'registros');
      
      if (!results || results.length === 0) {
        console.log('NFSe não encontrada para ID:', nfse_id);
        return res.status(404).json({ message: "NFSe não encontrada" });
      }
      
      let xmlContent = results[0].nfse_xml;
      
      if (!xmlContent) {
        console.log('XML da NFSe não encontrado para ID:', nfse_id);
        return res.status(404).json({ message: "XML da NFSe não encontrado" });
      }
      
      // Converter para string se for Buffer
      if (Buffer.isBuffer(xmlContent)) {
        xmlContent = xmlContent.toString('utf-8');
        console.log('XML convertido de Buffer para string');
      } else if (typeof xmlContent !== 'string') {
        xmlContent = String(xmlContent);
        console.log('XML convertido para string, tipo original:', typeof results[0].nfse_xml);
      }
      
      console.log('XML encontrado, tamanho:', xmlContent.length, 'caracteres');
      console.log('Primeiros 100 caracteres do XML:', xmlContent.substring(0, 100));
      
      // Importar e usar a função para gerar DANFSe layout final
      const { generateDANFSE } = await import('./danfse-layout-final');
      
      // Gerar o PDF da DANFSe
      console.log('Iniciando geração da DANFSe...');
      const result = await generateDANFSE(xmlContent);
      
      if (!result.success) {
        console.error('Erro ao gerar DANFSe:', result.error);
        throw new Error(`Erro ao gerar DANFSe: ${result.error}`);
      }
      
      console.log('DANFSe gerada com sucesso:', result.pdfPath);
      
      // Ler o arquivo PDF gerado
      const fs = await import('fs');
      const pdfBuffer = fs.readFileSync(result.pdfPath!);
      
      console.log('PDF lido, tamanho:', pdfBuffer.length, 'bytes');
      
      // Definir headers para exibir o PDF no navegador
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="danfse_${nfse_id}.pdf"`);
      res.send(pdfBuffer);
      
      // Limpar arquivo temporário
      fs.unlinkSync(result.pdfPath!);
      console.log('Arquivo temporário removido');
      
    } catch (error) {
      console.error("Erro ao gerar DANFSe:", error);
      res.status(500).json({ message: "Erro ao gerar DANFSe", error: (error as Error).message });
    }
  });

  // Rota para gerar relatório de NFe
  app.post("/api/relatorios/nfe-resumo", authenticateToken, async (req: any, res) => {
    try {
      const { dataInicial, dataFinal, empresa } = req.body;
      
      // Debug: verificar dados específicos
      console.log('Verificando dados para:', dataInicial, 'até', dataFinal);
      
      // Primeiro, ver quais datas existem na tabela
      const [allDates] = await mysqlPool.execute(`
        SELECT 
          DATE(doc_date_emi) as data_emissao,
          COUNT(*) as quantidade
        FROM doc 
        GROUP BY DATE(doc_date_emi)
        ORDER BY data_emissao DESC
        LIMIT 10
      `) as any;
      console.log('Datas disponíveis na tabela:', allDates);
      
      // Agora verificar nossa consulta específica
      const [debugData] = await mysqlPool.execute(`
        SELECT 
          doc_num,
          DATE(doc_date_emi) as data_emissao,
          doc_emit_nome,
          doc_valor
        FROM doc 
        WHERE DATE(doc_date_emi) BETWEEN ? AND ?
        LIMIT 5
      `, [dataInicial, dataFinal]) as any;
      console.log('Dados encontrados para o período:', debugData);
      
      let query = `
        SELECT 
          doc_num as numero_nfe,
          doc_date_emi as data_emissao,
          doc_emit_nome as fornecedor,
          doc_emit_documento as cnpj_fornecedor,
          doc_valor as valor_total_nfe,
          doc_dest_nome as empresa_tomadora,
          doc_dest_documento as cnpj_tomadora
        FROM doc
        WHERE DATE(doc_date_emi) BETWEEN ? AND ?
      `;
      
      const params = [dataInicial, dataFinal];
      
      if (empresa && empresa !== 'all') {
        query += ' AND doc_dest_documento = ?';
        params.push(empresa);
      }
      
      query += ' ORDER BY doc_dest_nome, doc_date_emi';
      
      const [results] = await mysqlPool.execute(query, params) as any;
      
      // Agrupar por empresa
      const empresas = new Map();
      let totalGeral = 0;
      
      results.forEach((nfe: any) => {
        const empresaKey = nfe.cnpj_tomadora || 'sem_empresa';
        if (!empresas.has(empresaKey)) {
          empresas.set(empresaKey, {
            nome: nfe.empresa_tomadora || 'Empresa não identificada',
            cnpj: nfe.cnpj_tomadora || '',
            nfes: [],
            total: 0
          });
        }
        
        const empresa = empresas.get(empresaKey);
        empresa.nfes.push({
          numero: nfe.numero_nfe,
          dataEmissao: nfe.data_emissao,
          fornecedor: nfe.fornecedor,
          cnpjFornecedor: nfe.cnpj_fornecedor,
          valor: parseFloat(nfe.valor_total_nfe) || 0
        });
        empresa.total += parseFloat(nfe.valor_total_nfe) || 0;
        totalGeral += parseFloat(nfe.valor_total_nfe) || 0;
      });
      
      // Gerar PDF
      const pdfBuffer = await generateNfeRelatorioPDF({
        dataInicial,
        dataFinal,
        empresas: Array.from(empresas.values()),
        totalGeral,
        totalRegistros: results.length
      });

      // Converter para base64 para enviar ao frontend
      const pdfBase64 = pdfBuffer.toString('base64');
      
      res.json({
        success: true,
        pdf: pdfBase64,
        filename: `relatorio-nfe-${dataInicial}-${dataFinal}.pdf`
      });
      
    } catch (error) {
      console.error("Erro ao gerar relatório de NFe:", error);
      res.status(500).json({ message: "Erro ao gerar relatório", error: (error as Error).message });
    }
  });

  // Rota para gerar relatório de NFSe
  app.post("/api/relatorios/nfse-resumo", authenticateToken, async (req: any, res) => {
    try {
      const { dataInicial, dataFinal, empresa } = req.body;
      
      console.log('Gerando relatório NFSe para:', dataInicial, 'até', dataFinal);
      
      let query = `
        SELECT 
          nfse_nsu as numero_nfse,
          nfse_data_hora as data_emissao,
          nfse_emitente as fornecedor,
          nfse_doc as cnpj_fornecedor,
          nfse_valor_servico as valor_total_nfse,
          nfse_tomador as empresa_tomadora,
          nfse_tomador_doc as cnpj_tomadora
        FROM nfse
        WHERE DATE(nfse_data_hora) BETWEEN ? AND ?
      `;
      
      const params = [dataInicial, dataFinal];
      
      if (empresa && empresa !== 'all') {
        query += ' AND nfse_tomador_doc = ?';
        params.push(empresa);
      }
      
      query += ' ORDER BY nfse_tomador, nfse_data_hora';
      
      const [results] = await mysqlPool.execute(query, params) as any;
      
      console.log(`Encontradas ${results.length} NFSe para o período`);
      
      // Agrupar por empresa tomadora (igual ao NFe)
      const empresas = new Map();
      let totalGeral = 0;
      
      results.forEach((nfse: any) => {
        const empresaKey = nfse.cnpj_tomadora || 'sem_empresa';
        if (!empresas.has(empresaKey)) {
          empresas.set(empresaKey, {
            nome: nfse.empresa_tomadora || 'Empresa não identificada',
            cnpj: nfse.cnpj_tomadora || '',
            nfses: [],
            total: 0
          });
        }
        
        const empresa = empresas.get(empresaKey);
        empresa.nfses.push({
          numero: nfse.numero_nfse,
          dataEmissao: nfse.data_emissao,
          fornecedor: nfse.fornecedor,
          cnpjFornecedor: nfse.cnpj_fornecedor,
          valor: parseFloat(nfse.valor_total_nfse) || 0
        });
        empresa.total += parseFloat(nfse.valor_total_nfse) || 0;
        totalGeral += parseFloat(nfse.valor_total_nfse) || 0;
      });
      
      // Gerar PDF
      const pdfBuffer = await generateNfseRelatorioPDF({
        dataInicial,
        dataFinal,
        empresa,
        empresas,
        totalGeral,
        totalNfses: results.length
      });

      // Converter para base64 para enviar ao frontend
      const pdfBase64 = pdfBuffer.toString('base64');
      
      res.json({
        success: true,
        pdf: pdfBase64,
        filename: `relatorio-nfse-${dataInicial}-${dataFinal}.pdf`
      });
      
    } catch (error) {
      console.error("Erro ao gerar relatório de NFSe:", error);
      res.status(500).json({ message: "Erro ao gerar relatório NFSe", error: (error as Error).message });
    }
  });

  // Rota para gerar relatório de tributos NFSe
  app.post("/api/relatorios/nfse-tributos", authenticateToken, async (req: any, res) => {
    try {
      const { dataInicial, dataFinal, empresa } = req.body;
      
      console.log('Gerando relatório de tributos NFSe para:', dataInicial, 'até', dataFinal);
      
      let query = `
        SELECT 
          nfse_nsu as numero_nfse,
          nfse_data_hora as data_emissao,
          nfse_emitente as fornecedor,
          nfse_doc as cnpj_fornecedor,
          nfse_valor_servico as valor_total_nfse,
          nfse_tomador as empresa_tomadora,
          nfse_tomador_doc as cnpj_tomadora,
          nfse_xml as xml_content
        FROM nfse
        WHERE DATE(nfse_data_hora) BETWEEN ? AND ?
      `;
      
      const params = [dataInicial, dataFinal];
      
      if (empresa && empresa !== 'all') {
        query += ' AND nfse_tomador_doc = ?';
        params.push(empresa);
      }
      
      query += ' ORDER BY nfse_tomador, nfse_data_hora';
      
      const [results] = await mysqlPool.execute(query, params) as any;
      
      console.log(`Processando ${results.length} NFSe para extração de tributos`);
      
      // Função para extrair tributos do XML (usando as mesmas funções do DANFSe)
      const extractTributesFromXML = async (xmlContent: any, nfseId: string): Promise<{
        valorISS: number;
        valorPIS: number;
        valorCOFINS: number;
        valorINSS: number;
        valorIRRF: number;
        valorCSLL: number;
      }> => {
        try {
          let cleanXml = '';
          
          if (Buffer.isBuffer(xmlContent)) {
            cleanXml = xmlContent.toString('utf-8');
          } else if (typeof xmlContent === 'string') {
            cleanXml = xmlContent;
          } else {
            console.log(`NFSe ${nfseId}: XML não é Buffer nem string`);
            return { valorISS: 0, valorPIS: 0, valorCOFINS: 0, valorINSS: 0, valorIRRF: 0, valorCSLL: 0 };
          }
          
          // Decodificar base64 se necessário
          if (!cleanXml.startsWith('<')) {
            cleanXml = Buffer.from(cleanXml, 'base64').toString('utf-8');
          }
          
          console.log(`NFSe ${nfseId}: Processando XML de tamanho ${cleanXml.length}`);
          
          // Mostrar primeiros 200 caracteres do XML para debug
          console.log(`NFSe ${nfseId}: Início do XML:`, cleanXml.substring(0, 200));
          
          // Parse do XML
          const xml2js = await import('xml2js');
          const parsed = await xml2js.parseStringPromise(cleanXml, { explicitArray: false });
          
          console.log(`NFSe ${nfseId}: Estrutura principal do XML:`, Object.keys(parsed));
          
          // Função para buscar valores recursivamente
          const buscarValorRecursivo = (obj: any, chaves: string[]): number => {
            if (!obj || typeof obj !== 'object') return 0;
            
            for (const chave of chaves) {
              for (const [key, value] of Object.entries(obj)) {
                if (key.toLowerCase() === chave.toLowerCase() && value !== null && value !== undefined) {
                  const valorNumerico = parseFloat(String(value));
                  if (!isNaN(valorNumerico) && valorNumerico > 0) {
                    console.log(`NFSe ${nfseId}: Encontrado ${chave} = ${valorNumerico}`);
                    return valorNumerico;
                  }
                }
                
                if (typeof value === 'object') {
                  const resultado = buscarValorRecursivo(value, [chave]);
                  if (resultado > 0) return resultado;
                }
              }
            }
            return 0;
          };
          
          // Buscar cada tributo com todas as variações possíveis
          const tributos = {
            valorISS: buscarValorRecursivo(parsed, ['vISSQN', 'vISS', 'ISSQN', 'ISS', 'vissqn', 'viss']),
            valorPIS: buscarValorRecursivo(parsed, ['vPis', 'vPIS', 'Pis', 'PIS', 'vpis']),
            valorCOFINS: buscarValorRecursivo(parsed, ['vCofins', 'vCOFINS', 'Cofins', 'COFINS', 'vcofins']),
            valorINSS: buscarValorRecursivo(parsed, ['vRetINSS', 'vINSS', 'INSS', 'RetINSS', 'vretinss', 'vinss']),
            valorIRRF: buscarValorRecursivo(parsed, ['vRetIRRF', 'vIRRF', 'IRRF', 'IR', 'vretirrf', 'virrf']),
            valorCSLL: buscarValorRecursivo(parsed, ['vRetCSLL', 'vCSLL', 'CSLL', 'RetCSLL', 'vretcsll', 'vcsll'])
          };
          
          console.log(`NFSe ${nfseId}: Tributos extraídos:`, tributos);
          return tributos;
          
        } catch (error) {
          console.error(`NFSe ${nfseId}: Erro ao processar XML:`, error);
          return { valorISS: 0, valorPIS: 0, valorCOFINS: 0, valorINSS: 0, valorIRRF: 0, valorCSLL: 0 };
        }
      };
      
      // Agrupar por empresa tomadora e processar XMLs
      const empresasMap = new Map();
      let totaisGerais = {
        valorServico: 0,
        valorISS: 0,
        valorPIS: 0,
        valorCOFINS: 0,
        valorINSS: 0,
        valorIRRF: 0,
        valorCSLL: 0
      };
      
      for (const nfse of results) {
        const empresaKey = nfse.cnpj_tomadora || 'sem_empresa';
        
        if (!empresasMap.has(empresaKey)) {
          empresasMap.set(empresaKey, {
            nome: nfse.empresa_tomadora || 'Empresa não identificada',
            cnpj: nfse.cnpj_tomadora || '',
            nfses: [],
            totais: {
              valorServico: 0,
              valorISS: 0,
              valorPIS: 0,
              valorCOFINS: 0,
              valorINSS: 0,
              valorIRRF: 0,
              valorCSLL: 0
            }
          });
        }
        
        // Extrair tributos do XML
        const tributos = await extractTributesFromXML(nfse.xml_content, nfse.numero_nfse);
        const valorServico = parseFloat(nfse.valor_total_nfse) || 0;
        
        const nfseCompleta = {
          numero: nfse.numero_nfse,
          dataEmissao: nfse.data_emissao,
          fornecedor: nfse.fornecedor,
          cnpjFornecedor: nfse.cnpj_fornecedor,
          valorServico,
          ...tributos
        };
        
        const empresa = empresasMap.get(empresaKey);
        empresa.nfses.push(nfseCompleta);
        
        // Somar totais da empresa
        empresa.totais.valorServico += valorServico;
        empresa.totais.valorISS += tributos.valorISS;
        empresa.totais.valorPIS += tributos.valorPIS;
        empresa.totais.valorCOFINS += tributos.valorCOFINS;
        empresa.totais.valorINSS += tributos.valorINSS;
        empresa.totais.valorIRRF += tributos.valorIRRF;
        empresa.totais.valorCSLL += tributos.valorCSLL;
        
        // Somar totais gerais
        totaisGerais.valorServico += valorServico;
        totaisGerais.valorISS += tributos.valorISS;
        totaisGerais.valorPIS += tributos.valorPIS;
        totaisGerais.valorCOFINS += tributos.valorCOFINS;
        totaisGerais.valorINSS += tributos.valorINSS;
        totaisGerais.valorIRRF += tributos.valorIRRF;
        totaisGerais.valorCSLL += tributos.valorCSLL;
      }
      
      // Gerar PDF
      const pdfBuffer = await generateNfseTributosRelatorioPDF({
        dataInicial,
        dataFinal,
        empresa,
        empresas: Array.from(empresasMap.values()),
        totaisGerais,
        totalNfses: results.length
      });

      // Converter para base64
      const pdfBase64 = pdfBuffer.toString('base64');
      
      res.json({
        success: true,
        pdf: pdfBase64,
        filename: `relatorio-tributos-nfse-${dataInicial}-${dataFinal}.pdf`
      });
      
    } catch (error) {
      console.error("Erro ao gerar relatório de tributos NFSe:", error);
      res.status(500).json({ message: "Erro ao gerar relatório de tributos NFSe", error: (error as Error).message });
    }
  });

  // Rota para gerar relatório de NFe em Excel
  app.post("/api/relatorios/nfe-resumo-excel", authenticateToken, async (req: any, res) => {
    try {
      const { dataInicial, dataFinal, empresa } = req.body;
      
      console.log('Gerando relatório NFe Excel para:', dataInicial, 'até', dataFinal);
      
      let query = `
        SELECT 
          doc_num as numero_nfe,
          doc_date_emi as data_emissao,
          doc_emit_nome as fornecedor,
          doc_emit_documento as cnpj_fornecedor,
          doc_valor as valor_total_nfe,
          doc_dest_nome as empresa_tomadora,
          doc_dest_documento as cnpj_tomadora
        FROM doc
        WHERE DATE(doc_date_emi) BETWEEN ? AND ?
      `;
      
      const params = [dataInicial, dataFinal];
      
      if (empresa && empresa !== 'all') {
        query += ' AND doc_dest_documento = ?';
        params.push(empresa);
      }
      
      query += ' ORDER BY doc_dest_nome, doc_date_emi';
      
      const [results] = await mysqlPool.execute(query, params) as any;
      
      // Preparar dados para Excel
      const excelData = results.map((nfe: any) => ({
        'Número NFe': nfe.numero_nfe,
        'Data Emissão': new Date(nfe.data_emissao).toLocaleDateString('pt-BR'),
        'Fornecedor': nfe.fornecedor,
        'CNPJ Fornecedor': nfe.cnpj_fornecedor,
        'Empresa Tomadora': nfe.empresa_tomadora,
        'CNPJ Tomadora': nfe.cnpj_tomadora,
        'Valor Total': parseFloat(nfe.valor_total_nfe) || 0
      }));

      // Criar workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Ajustar largura das colunas
      const colWidths = [
        { wch: 15 }, // Número NFe
        { wch: 12 }, // Data Emissão
        { wch: 30 }, // Fornecedor
        { wch: 18 }, // CNPJ Fornecedor
        { wch: 30 }, // Empresa Tomadora
        { wch: 18 }, // CNPJ Tomadora
        { wch: 15 }  // Valor Total
      ];
      ws['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, 'Relatório NFe');

      // Gerar buffer do Excel
      const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      // Definir headers para download
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="relatorio-nfe-${dataInicial}-${dataFinal}.xlsx"`);
      
      res.send(excelBuffer);
      
    } catch (error) {
      console.error("Erro ao gerar relatório Excel de NFe:", error);
      res.status(500).json({ message: "Erro ao gerar relatório Excel", error: (error as Error).message });
    }
  });

  // Rota para gerar relatório de NFSe em Excel
  app.post("/api/relatorios/nfse-resumo-excel", authenticateToken, async (req: any, res) => {
    try {
      const { dataInicial, dataFinal, empresa } = req.body;
      
      console.log('Gerando relatório NFSe Excel para:', dataInicial, 'até', dataFinal);
      
      let query = `
        SELECT 
          nfse_nsu as numero_nfse,
          nfse_data_hora as data_emissao,
          nfse_emitente as fornecedor,
          nfse_doc as cnpj_fornecedor,
          nfse_valor_servico as valor_total_nfse,
          nfse_tomador as empresa_tomadora,
          nfse_tomador_doc as cnpj_tomadora
        FROM nfse
        WHERE DATE(nfse_data_hora) BETWEEN ? AND ?
      `;
      
      const params = [dataInicial, dataFinal];
      
      if (empresa && empresa !== 'all') {
        query += ' AND nfse_tomador_doc = ?';
        params.push(empresa);
      }
      
      query += ' ORDER BY nfse_tomador, nfse_data_hora';
      
      const [results] = await mysqlPool.execute(query, params) as any;
      
      // Preparar dados para Excel
      const excelData = results.map((nfse: any) => ({
        'Número NFSe': nfse.numero_nfse,
        'Data Emissão': new Date(nfse.data_emissao).toLocaleDateString('pt-BR'),
        'Fornecedor': nfse.fornecedor,
        'CNPJ Fornecedor': nfse.cnpj_fornecedor,
        'Empresa Tomadora': nfse.empresa_tomadora,
        'CNPJ Tomadora': nfse.cnpj_tomadora,
        'Valor Total': parseFloat(nfse.valor_total_nfse) || 0
      }));

      // Criar workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Ajustar largura das colunas
      const colWidths = [
        { wch: 15 }, // Número NFSe
        { wch: 12 }, // Data Emissão
        { wch: 30 }, // Fornecedor
        { wch: 18 }, // CNPJ Fornecedor
        { wch: 30 }, // Empresa Tomadora
        { wch: 18 }, // CNPJ Tomadora
        { wch: 15 }  // Valor Total
      ];
      ws['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, 'Relatório NFSe');

      // Gerar buffer do Excel
      const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      // Definir headers para download
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="relatorio-nfse-${dataInicial}-${dataFinal}.xlsx"`);
      
      res.send(excelBuffer);
      
    } catch (error) {
      console.error("Erro ao gerar relatório Excel de NFSe:", error);
      res.status(500).json({ message: "Erro ao gerar relatório Excel", error: (error as Error).message });
    }
  });

  // Rota para importar XML de NFSe
  app.post("/api/nfse-import", authenticateToken, upload.single('xmlFile'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          message: "Nenhum arquivo XML foi enviado" 
        });
      }

      const xmlContent = req.file.buffer.toString('utf-8');
      console.log('Importando XML NFSe, tamanho:', xmlContent.length);

      // Parse do XML para validação
      const xml2js = await import('xml2js');
      const parsed = await xml2js.parseStringPromise(xmlContent, { explicitArray: false });

      // Verificar se contém as tags obrigatórias para NFSe
      const hasNFSeTag = !!parsed.NFSe;
      const hasChaveRPS = xmlContent.includes('<ChaveRPS>') || xmlContent.includes('<chaveRPS>');
      const hasNNFSe = xmlContent.includes('<nNFSe>') || xmlContent.includes('<numeroNfse>');
      const hasInfNFSe = xmlContent.includes('<infNFSe>') || xmlContent.includes('<InfNFSe>');

      console.log('Validação de tags:', { hasNFSeTag, hasChaveRPS, hasNNFSe, hasInfNFSe });

      if (!hasNFSeTag && !hasChaveRPS && !hasNNFSe && !hasInfNFSe) {
        return res.status(400).json({
          success: false,
          message: "O arquivo XML não é uma Nota Fiscal de Serviço válida. Tags obrigatórias não encontradas."
        });
      }

      // Extrair dados do XML
      const extractNFSeData = (xmlData: any) => {
        let nfseData: any = {};

        // Função para buscar valores recursivamente
        const findValue = (obj: any, keys: string[]): any => {
          if (!obj || typeof obj !== 'object') return null;
          
          for (const key of keys) {
            for (const [objKey, value] of Object.entries(obj)) {
              if (objKey.toLowerCase() === key.toLowerCase() && value) {
                return value;
              }
              if (typeof value === 'object') {
                const result = findValue(value, [key]);
                if (result) return result;
              }
            }
          }
          return null;
        };

        // Extrair chave de verificação
        const codigoVerificacao = findValue(xmlData, ['CodigoVerificacao', 'codigo_verificacao']);
        const infNFSeId = findValue(xmlData, ['infNFSe']);
        let chaveAcesso = codigoVerificacao;
        
        // Se não encontrou código de verificação, usar números do ID da infNFSe
        if (!chaveAcesso && infNFSeId && typeof infNFSeId === 'object' && infNFSeId.$?.Id) {
          chaveAcesso = infNFSeId.$.Id.replace(/\D/g, ''); // Apenas números
        }

        // Dados básicos
        nfseData.nfse_chave = chaveAcesso || '';
        nfseData.nfse_tipo = 'NFSE';
        nfseData.nfse_nsu = '0';
        nfseData.nfse_status = 0;
        nfseData.nfse_status_integracao = 0;
        nfseData.nfse_id_integracao = 0;
        nfseData.nfse_consulta = 0;
        nfseData.nfse_codcfo = 0;

        // Data de emissão
        const dataEmissao = findValue(xmlData, ['DataEmissaoNFe', 'dhEmi', 'dataEmissao', 'DataEmissao']);
        nfseData.nfse_data_hora = dataEmissao || new Date().toISOString();

        // Dados do prestador (emit)
        const cnpjPrestador = findValue(xmlData, ['CNPJ']) || findValue(xmlData, ['CNPJPrestador']);
        const nomePrestador = findValue(xmlData, ['nome', 'xNome', 'RazaoSocialPrestador', 'razaoSocial']);
        
        nfseData.nfse_doc = cnpjPrestador || '';
        nfseData.nfse_emitente = nomePrestador || '';

        // Local de prestação
        const localPrestacao = findValue(xmlData, ['cLocPrestacao', 'MunicipioPrestacao', 'municipioPrestacao']);
        nfseData.nfse_local_prestacao = localPrestacao || '';

        // Valor dos serviços
        const valorServicos = findValue(xmlData, ['ValorServicos', 'vServ', 'valorServicos']);
        nfseData.nfse_valor_servico = valorServicos ? parseFloat(valorServicos) : 0;

        // Dados do tomador
        const cnpjTomador = findValue(xmlData, ['CNPJTomador']) || findValue(xmlData, ['cnpjTomador']);
        const nomeTomador = findValue(xmlData, ['RazaoSocialTomador', 'razaoSocialTomador', 'xNomeTomador']);
        
        nfseData.nfse_tomador_doc = cnpjTomador || '';
        nfseData.nfse_tomador = nomeTomador || '';

        // XML em base64
        nfseData.nfse_xml = Buffer.from(xmlContent).toString('base64');

        // ID da empresa (usar primeira empresa por enquanto)
        nfseData.nfse_id_company = 42; // Você pode ajustar isso conforme necessário

        return nfseData;
      };

      const nfseData = extractNFSeData(parsed);

      // Verificar se a chave já existe
      if (nfseData.nfse_chave) {
        const [existingRecords] = await mysqlPool.execute(
          'SELECT nfse_id FROM nfse WHERE nfse_chave = ?',
          [nfseData.nfse_chave]
        ) as any;

        if (existingRecords.length > 0) {
          return res.status(400).json({
            success: false,
            message: `NFSe com chave ${nfseData.nfse_chave} já existe no sistema.`
          });
        }
      }

      // Inserir no banco de dados
      const insertQuery = `
        INSERT INTO nfse (
          nfse_id_company, nfse_nsu, nfse_chave, nfse_tipo, nfse_data_hora,
          nfse_doc, nfse_emitente, nfse_local_prestacao, nfse_xml, nfse_valor_servico,
          nfse_tomador_doc, nfse_tomador, nfse_status, nfse_status_integracao,
          nfse_id_integracao, nfse_consulta, nfse_codcfo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const insertValues = [
        nfseData.nfse_id_company,
        nfseData.nfse_nsu,
        nfseData.nfse_chave,
        nfseData.nfse_tipo,
        nfseData.nfse_data_hora,
        nfseData.nfse_doc,
        nfseData.nfse_emitente,
        nfseData.nfse_local_prestacao,
        nfseData.nfse_xml,
        nfseData.nfse_valor_servico,
        nfseData.nfse_tomador_doc,
        nfseData.nfse_tomador,
        nfseData.nfse_status,
        nfseData.nfse_status_integracao,
        nfseData.nfse_id_integracao,
        nfseData.nfse_consulta,
        nfseData.nfse_codcfo
      ];

      console.log('Inserindo NFSe:', nfseData);

      const [result] = await mysqlPool.execute(insertQuery, insertValues) as any;

      res.json({
        success: true,
        message: `NFSe importada com sucesso! Emitente: ${nfseData.nfse_emitente}, Valor: R$ ${nfseData.nfse_valor_servico.toFixed(2)}`,
        nfseId: result.insertId
      });

    } catch (error) {
      console.error("Erro ao importar XML de NFSe:", error);
      res.status(500).json({ 
        success: false, 
        message: "Erro interno do servidor ao processar XML",
        error: (error as Error).message 
      });
    }
  });

  // Rota para importar XML de NFe
  app.post("/api/nfe-import", authenticateToken, upload.single('xmlFile'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          message: "Nenhum arquivo XML foi enviado" 
        });
      }

      const xmlContent = req.file.buffer.toString('utf-8');
      console.log('Importando XML NFe, tamanho:', xmlContent.length);

      // Parse do XML para validação
      const xml2js = await import('xml2js');
      const parsed = await xml2js.parseStringPromise(xmlContent, { explicitArray: false });

      // Verificar se contém as tags obrigatórias para NFe
      const hasNfeProc = !!parsed.nfeProc;
      const hasNFe = xmlContent.includes('<NFe>') || xmlContent.includes('<nfe>');
      const hasInfNFe = xmlContent.includes('<infNFe>') || xmlContent.includes('<infnfe>');

      console.log('Validação de tags:', { hasNfeProc, hasNFe, hasInfNFe });

      if (!hasNfeProc && !hasNFe && !hasInfNFe) {
        return res.status(400).json({
          success: false,
          message: "O arquivo XML não é uma Nota Fiscal Eletrônica válida. Tags obrigatórias não encontradas."
        });
      }

      // Extrair dados do XML
      const extractNFeData = (xmlData: any) => {
        let nfeData: any = {};

        // Função para buscar valores recursivamente
        const findValue = (obj: any, keys: string[]): any => {
          if (!obj || typeof obj !== 'object') return null;
          
          for (const key of keys) {
            for (const [objKey, value] of Object.entries(obj)) {
              if (objKey.toLowerCase() === key.toLowerCase() && value) {
                return value;
              }
              if (typeof value === 'object') {
                const result = findValue(value, [key]);
                if (result) return result;
              }
            }
          }
          return null;
        };

        // Navegar pela estrutura nfeProc -> NFe -> infNFe
        let infNFe = findValue(xmlData, ['infNFe']);
        if (!infNFe) {
          // Tentar encontrar NFe diretamente
          const nfe = findValue(xmlData, ['NFe']);
          if (nfe) {
            infNFe = findValue(nfe, ['infNFe']);
          }
        }

        if (!infNFe) {
          throw new Error('Estrutura XML inválida: infNFe não encontrada');
        }

        // Extrair chave de acesso do ID da infNFe
        let chaveAcesso = '';
        if (infNFe.$ && infNFe.$.Id) {
          chaveAcesso = infNFe.$.Id.replace(/[^0-9]/g, ''); // Apenas números
        }

        // Dados básicos
        nfeData.doc_chave = chaveAcesso;
        nfeData.doc_mod = 55;
        nfeData.doc_status = 0;
        nfeData.doc_status_download = 1;
        nfeData.doc_status_manifestacao = 1;
        nfeData.doc_consulta = 0;
        nfeData.doc_status_integracao = 0;
        nfeData.doc_id_integracao = 0;
        nfeData.doc_codcfo = 0;

        // Dados da identificação
        const ide = findValue(infNFe, ['ide']);
        if (ide) {
          nfeData.doc_code = findValue(ide, ['cNF']) || '';
          nfeData.doc_nat_op = findValue(ide, ['natOp']) || '';
          nfeData.doc_serie = findValue(ide, ['serie']) || '';
          nfeData.doc_num = findValue(ide, ['nNF']) || '';
          nfeData.doc_date_emi = findValue(ide, ['dhEmi']) || new Date().toISOString();
          nfeData.doc_date_sai = findValue(ide, ['dhSaiEnt']) || null;
        }

        // Dados do emitente
        const emit = findValue(infNFe, ['emit']);
        if (emit) {
          nfeData.doc_emit_documento = findValue(emit, ['CNPJ']) || '';
          nfeData.doc_emit_nome = findValue(emit, ['xNome']) || '';
          nfeData.doc_emit_fantasia = findValue(emit, ['xFant']) || '';
          nfeData.doc_emit_ie = findValue(emit, ['IE']) || '';
          
          const enderEmit = findValue(emit, ['enderEmit']);
          if (enderEmit) {
            nfeData.doc_uf_inicio = findValue(enderEmit, ['UF']) || '';
          }
        }

        // Dados do destinatário
        const dest = findValue(infNFe, ['dest']);
        if (dest) {
          nfeData.doc_dest_documento = findValue(dest, ['CNPJ']) || '';
          nfeData.doc_dest_nome = findValue(dest, ['xNome']) || '';
          nfeData.doc_dest_ie = null;
          
          const enderDest = findValue(dest, ['enderDest']);
          if (enderDest) {
            nfeData.doc_uf_final = findValue(enderDest, ['UF']) || '';
          }
        }

        // Dados dos totais
        const total = findValue(infNFe, ['total']);
        if (total) {
          const icmsTot = findValue(total, ['ICMSTot']);
          if (icmsTot) {
            nfeData.doc_valor = parseFloat(findValue(icmsTot, ['vNF']) || '0');
            nfeData.doc_valor_trib = parseFloat(findValue(icmsTot, ['vTotTrib']) || '0');
            nfeData.doc_valor_base_icms = parseFloat(findValue(icmsTot, ['vBC']) || '0');
            nfeData.doc_valor_icms = parseFloat(findValue(icmsTot, ['vICMS']) || '0');
            nfeData.doc_valor_frete = parseFloat(findValue(icmsTot, ['vFrete']) || '0');
            nfeData.doc_valor_seguro = parseFloat(findValue(icmsTot, ['vSeg']) || '0');
            nfeData.doc_valor_desconto = parseFloat(findValue(icmsTot, ['vDesc']) || '0');
          }
        }

        // XML em base64
        nfeData.doc_file = Buffer.from(xmlContent).toString('base64');

        // ID da empresa (usar primeira empresa por enquanto)
        nfeData.doc_id_company = 42; // Ajustar conforme necessário

        return nfeData;
      };

      const nfeData = extractNFeData(parsed);

      // Verificar se a chave já existe
      if (nfeData.doc_chave) {
        const [existingRecords] = await mysqlPool.execute(
          'SELECT doc_id FROM doc WHERE doc_chave = ?',
          [nfeData.doc_chave]
        ) as any;

        if (existingRecords.length > 0) {
          return res.status(400).json({
            success: false,
            message: `NFe com chave ${nfeData.doc_chave} já existe no sistema.`
          });
        }
      }

      // Inserir no banco de dados
      const insertQuery = `
        INSERT INTO doc (
          doc_id_company, doc_mod, doc_code, doc_nat_op, doc_serie, doc_num,
          doc_date_emi, doc_date_sai, doc_emit_documento, doc_emit_nome,
          doc_emit_fantasia, doc_emit_ie, doc_dest_documento, doc_dest_nome,
          doc_dest_ie, doc_valor, doc_valor_trib, doc_valor_base_icms,
          doc_valor_icms, doc_valor_frete, doc_valor_seguro, doc_valor_desconto,
          doc_uf_inicio, doc_uf_final, doc_status, doc_status_download,
          doc_status_manifestacao, doc_file, doc_chave, doc_consulta,
          doc_status_integracao, doc_id_integracao, doc_codcfo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const insertValues = [
        nfeData.doc_id_company,
        nfeData.doc_mod,
        nfeData.doc_code,
        nfeData.doc_nat_op,
        nfeData.doc_serie,
        nfeData.doc_num,
        nfeData.doc_date_emi,
        nfeData.doc_date_sai,
        nfeData.doc_emit_documento,
        nfeData.doc_emit_nome,
        nfeData.doc_emit_fantasia,
        nfeData.doc_emit_ie,
        nfeData.doc_dest_documento,
        nfeData.doc_dest_nome,
        nfeData.doc_dest_ie,
        nfeData.doc_valor,
        nfeData.doc_valor_trib,
        nfeData.doc_valor_base_icms,
        nfeData.doc_valor_icms,
        nfeData.doc_valor_frete,
        nfeData.doc_valor_seguro,
        nfeData.doc_valor_desconto,
        nfeData.doc_uf_inicio,
        nfeData.doc_uf_final,
        nfeData.doc_status,
        nfeData.doc_status_download,
        nfeData.doc_status_manifestacao,
        nfeData.doc_file,
        nfeData.doc_chave,
        nfeData.doc_consulta,
        nfeData.doc_status_integracao,
        nfeData.doc_id_integracao,
        nfeData.doc_codcfo
      ];

      console.log('Inserindo NFe:', nfeData);

      const [result] = await mysqlPool.execute(insertQuery, insertValues) as any;

      res.json({
        success: true,
        message: `NFe importada com sucesso! Emitente: ${nfeData.doc_emit_nome}, Número: ${nfeData.doc_num}, Valor: R$ ${nfeData.doc_valor.toFixed(2)}`,
        nfeId: result.insertId
      });

    } catch (error) {
      console.error("Erro ao importar XML de NFe:", error);
      res.status(500).json({ 
        success: false, 
        message: "Erro interno do servidor ao processar XML",
        error: (error as Error).message 
      });
    }
  });

  // Rota para estatísticas dos relatórios
  app.get("/api/relatorios/stats", authenticateToken, async (req: any, res) => {
    try {
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;

      // NFe este mês
      const [nfeCurrentMonth] = await mysqlPool.execute(`
        SELECT COUNT(*) as count
        FROM doc 
        WHERE MONTH(doc_date_emi) = ? AND YEAR(doc_date_emi) = ?
      `, [currentMonth, currentYear]) as any;

      // NFe mês anterior
      const [nfePreviousMonth] = await mysqlPool.execute(`
        SELECT COUNT(*) as count
        FROM doc 
        WHERE MONTH(doc_date_emi) = ? AND YEAR(doc_date_emi) = ?
      `, [previousMonth, previousYear]) as any;

      // NFSe este mês
      const [nfseCurrentMonth] = await mysqlPool.execute(`
        SELECT COUNT(*) as count
        FROM nfse 
        WHERE MONTH(nfse_data_hora) = ? AND YEAR(nfse_data_hora) = ?
      `, [currentMonth, currentYear]) as any;

      // NFSe mês anterior
      const [nfsePreviousMonth] = await mysqlPool.execute(`
        SELECT COUNT(*) as count
        FROM nfse 
        WHERE MONTH(nfse_data_hora) = ? AND YEAR(nfse_data_hora) = ?
      `, [previousMonth, previousYear]) as any;

      // Empresas ativas (contar CNPJs únicos da tabela doc)
      const [empresasAtivas] = await mysqlPool.execute(`
        SELECT COUNT(DISTINCT doc_dest_documento) as count
        FROM doc 
        WHERE doc_dest_documento IS NOT NULL AND doc_dest_documento != ''
      `) as any;

      // Calcular crescimento
      const totalCurrentMonth = nfeCurrentMonth[0].count + nfseCurrentMonth[0].count;
      const totalPreviousMonth = nfePreviousMonth[0].count + nfsePreviousMonth[0].count;
      
      let crescimento = 0;
      if (totalPreviousMonth > 0) {
        crescimento = ((totalCurrentMonth - totalPreviousMonth) / totalPreviousMonth) * 100;
      } else if (totalCurrentMonth > 0) {
        crescimento = 100; // Se não havia dados no mês anterior e agora há, crescimento de 100%
      }

      res.json({
        nfeEsteMes: nfeCurrentMonth[0].count,
        nfseEsteMes: nfseCurrentMonth[0].count,
        empresasAtivas: empresasAtivas[0].count,
        crescimento: Math.round(crescimento * 100) / 100, // Arredondar para 2 casas decimais
        crescimentoPositivo: crescimento >= 0
      });

    } catch (error) {
      console.error("Erro ao buscar estatísticas dos relatórios:", error);
      res.status(500).json({ message: "Erro ao buscar estatísticas", error: (error as Error).message });
    }
  });

  // Rota para buscar conteúdo da versão
  app.get("/api/version-content", authenticateToken, async (req: any, res) => {
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      const versionFilePath = path.join(process.cwd(), 'version', 'version.txt');
      
      if (fs.existsSync(versionFilePath)) {
        const content = fs.readFileSync(versionFilePath, 'utf-8');
        res.json({ content, hasVersion: true });
      } else {
        res.json({ content: '', hasVersion: false });
      }
    } catch (error) {
      console.error("Erro ao buscar conteúdo da versão:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Rota para atualizar preferência de notificação de versão
  app.post("/api/users/version-notification", authenticateToken, async (req: any, res) => {
    try {
      const { showNotifications } = req.body;
      const userId = req.user.id;
      
      // await db.update(users)
      //   .set({ showVersionNotifications: showNotifications })
      //   .where(eq(users.id, userId));
      
      res.json({ message: "Preferência atualizada com sucesso" });
    } catch (error) {
      console.error("Erro ao atualizar preferência:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Rota para buscar preferências do usuário
  app.get("/api/users/preferences", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // const user = await db.select({
      //   showVersionNotifications: users.showVersionNotifications
      // }).from(users).where(eq(users.id, userId)).limit(1);
      
      // if (user.length === 0) {
      //   return res.status(404).json({ message: "Usuário não encontrado" });
      // }
      
      // res.json(user[0]);
      res.json({ showVersionNotifications: true });
    } catch (error) {
      console.error("Erro ao buscar preferências do usuário:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Rota de teste para envio de email
  app.post("/api/test-email", authenticateToken, async (req: any, res) => {
    try {
      const { email, name } = req.body;
      const success = await sendWelcomeEmail(name || "Teste", email || "simpleit.solucoes@gmail.com");
      
      if (success) {
        res.json({ message: "Email de teste enviado com sucesso!" });
      } else {
        res.status(500).json({ message: "Erro ao enviar email de teste" });
      }
    } catch (error) {
      console.error("Erro no teste de email:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // ===== ROTAS DE AUDITORIA =====
  
  // Rota para testar audit log
  app.post('/api/test-audit-log', authenticateToken, async (req: any, res) => {
    try {
      await AuditLogger.logBulkDownload(req, "NFe", "XML", 5);
      res.json({ success: true, message: "Log de teste criado com sucesso" });
    } catch (error) {
      console.error('Erro no teste de audit log:', error);
      res.status(500).json({ error: 'Erro ao criar log de teste' });
    }
  });
  
  // Rota para buscar logs de auditoria (apenas admins e system)
  app.get("/api/audit-logs", authenticateToken, async (req: any, res) => {
    try {
      const userType = req.user.type || 'user';
      
      // Apenas admins e system podem ver logs
      if (userType !== 'admin' && userType !== 'system') {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const filters = {
        search: req.query.search as string,
        userId: req.query.userId ? parseInt(req.query.userId as string) : undefined,
        dateStart: req.query.dateStart as string,
        dateEnd: req.query.dateEnd as string,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        sortBy: req.query.sortBy as any || 'createdAt',
        sortOrder: req.query.sortOrder as 'asc' | 'desc' || 'desc'
      };

      const logs = await storage.getAuditLogs(filters);
      res.json(logs);
    } catch (error) {
      console.error("Erro ao buscar logs de auditoria:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
