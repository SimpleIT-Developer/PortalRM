import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  type: text("type"),
  status: integer("status").default(1),
  showVersionNotifications: boolean("show_version_notifications").default(true).notNull(),
  resetToken: text("reset_token"),
  resetTokenExpires: timestamp("reset_token_expires"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tabela de auditoria
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  userName: text("user_name").notNull(),
  action: text("action").notNull(),
  details: text("details"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  name: true,
}).extend({
  type: z.string().optional(),
  status: z.number().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export const totvsLoginSchema = z.object({
  grant_type: z.string().default("password"),
  username: z.string().min(1, "Usuário é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
  servicealias: z.string().optional()
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Email inválido"),
});

export const registerSchema = insertUserSchema.extend({
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
  confirmPassword: z.string(),
  type: z.string().default("user"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type LoginData = z.infer<typeof loginSchema>;
export type TotvsLoginRequest = z.infer<typeof totvsLoginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
export type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;

// Types for Company (MySQL table)
export interface Company {
  company_id: number;
  company_name: string;
  company_fantasy: string;
  company_cpf_cnpj: string;
  company_email: string;
  company_city: string;
  company_uf: string;
}

export interface CompanyFilters {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: keyof Company;
  sortOrder?: 'asc' | 'desc';
}

export interface CompanyResponse {
  companies: Company[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

// Types for NFe Recebidas (MySQL table)
export interface NFeRecebida {
  doc_id: number;
  doc_num: string;
  doc_dest_nome: string;
  doc_emit_nome: string;
  doc_emit_documento: string;
  doc_date_emi: string;
  doc_valor: number;
  doc_nat_op: string;
  doc_status_integracao: number;
  doc_id_integracao: string | null;
  doc_codcfo: string | null;
  doc_id_company?: number;
  doc_status: number;
  doc_serie: string | null;
  doc_chave?: string;
  empresa_nome?: string;
  company_cpf_cnpj?: string;
  has_evento?: number;
}

export interface NFeFilters {
  search?: string;
  status?: 'all' | 'integrated' | 'not_integrated';
  empresa?: string;
  fornecedor?: string;
  dataInicio?: string;
  dataFim?: string;
  page?: number;
  limit?: number;
  sortBy?: keyof NFeRecebida;
  sortOrder?: 'asc' | 'desc';
}

export interface NFeResponse {
  nfes: NFeRecebida[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

// Eventos NFe interfaces
export interface EventoNFe {
  eventos_id: number;
  eventos_id_company: number;
  eventos_chave: string;
  eventos_code_evento: string;
  eventos_desc_evento: string;
  eventos_data: string;
  eventos_prot: string;
}

// NFSe Recebidas interfaces
export interface NFSeRecebida {
  nfse_id: number;
  nfse_emitente: string;
  nfse_doc: string;
  nfse_tomador: string;
  nfse_tipo: string;
  nfse_local_prestacao: string;
  nfse_data_hora: string;
  nfse_valor_servico: number;
  nfse_status_integracao: number;
  nfse_id_integracao: string | null;
  nfse_codcfo: string | null;
  nfse_nsu: string | null;
}

export interface NFSeFilters {
  search?: string;
  status?: 'all' | 'integrated' | 'not_integrated';
  empresa?: string;
  fornecedor?: string;
  local?: string;
  dataInicio?: string;
  dataFim?: string;
  page?: number;
  limit?: number;
  sortBy?: keyof NFSeRecebida;
  sortOrder?: 'asc' | 'desc';
}

export interface NFSeResponse {
  nfses: NFSeRecebida[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

// Usuários interfaces
export interface Usuario {
  id: number;
  nome: string;
  email: string;
  tipo: string;
  ativo: number;
}

export interface CreateUsuarioData {
  nome: string;
  email: string;
  password: string;
  tipo: 'user' | 'admin' | 'system';
}

export interface UpdateUsuarioData {
  nome?: string;
  email?: string;
  password?: string;
  tipo?: 'user' | 'admin' | 'system';
  ativo?: number;
}

export interface UsuarioFilters {
  search?: string;
  status?: 'all' | 'active' | 'inactive';
  page?: number;
  limit?: number;
  sortBy?: keyof Usuario;
  sortOrder?: 'asc' | 'desc';
}

export interface UsuarioResponse {
  usuarios: Usuario[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

// Dashboard Statistics
export interface DashboardStats {
  totalCNPJ: number;
  nfeRecebidas: number;
  nfeIntegradas: number;
  nfseRecebidas: number;
  nfseIntegradas: number;
  fornecedoresSemERP: number;
}

export interface ChartData {
  date: string;
  nfe: number;
  nfse: number;
}

export interface PieChartData {
  name: string;
  value: number;
  color: string;
}

export interface UltimosDocumentos {
  tipo: string;
  emitente: string;
  valor: number;
  data: string;
  status: string;
}

export interface CNPJAtivo {
  cnpj: string;
  nome: string;
  ultimaCaptura: string;
  status: string;
}

// CTe Recebidas interfaces
export interface CTeRecebida {
  cte_id: number;
  cte_numero: string;
  cte_destinatario_nome: string;
  cte_emitente_nome: string;
  cte_emitente_doc: string;
  cte_data_emissao: string;
  cte_valor: number;
  cte_status_integracao: number;
  cte_id_integracao: string | null;
  cte_codcfo: string | null;
  cte_id_company?: number;
  cte_status: number;
  cte_serie: string | null;
  cte_chave_acesso?: string;
  empresa_nome?: string;
  company_cpf_cnpj?: string;
  has_evento?: number;
}

export interface CTeFilters {
  search?: string;
  status?: 'all' | 'integrated' | 'not_integrated';
  empresa?: string;
  fornecedor?: string;
  dataInicio?: string;
  dataFim?: string;
  page?: number;
  limit?: number;
  sortBy?: keyof CTeRecebida;
  sortOrder?: 'asc' | 'desc';
}

export interface CTeResponse {
  ctes: CTeRecebida[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

// Eventos CTe interfaces
export interface EventoCTe {
  cte_evento_id: number;
  cte_evento_id_company: number;
  cte_evento_chave_acesso: string;
  cte_evento_code_evento: string;
  cte_evento_desc_evento: string;
  cte_evento_data: string;
  cte_evento_prot: string;
}

// Fornecedores interfaces
export interface Fornecedor {
  id: number;
  nome: string;
  cnpj: string;
  codigo_erp: string | null;
  data_cadastro: string;
}

export interface FornecedorFilters {
  search?: string;
  nome?: string;
  cnpj?: string;
  page?: number;
  limit?: number;
  sortBy?: keyof Fornecedor;
  sortOrder?: 'asc' | 'desc';
}

export interface FornecedorResponse {
  fornecedores: Fornecedor[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

// Interfaces para Auditoria
export const insertAuditLogSchema = createInsertSchema(auditLogs).pick({
  userId: true,
  userName: true,
  action: true,
  details: true,
  ipAddress: true,
  userAgent: true,
});

export interface AuditLog {
  id: number;
  userId: number;
  userName: string;
  action: string;
  details?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: Date;
}

export interface AuditLogFilters {
  search?: string;
  userId?: number;
  dateStart?: string;
  dateEnd?: string;
  page?: number;
  limit?: number;
  sortBy?: keyof AuditLog;
  sortOrder?: 'asc' | 'desc';
}

export interface AuditLogResponse {
  logs: AuditLog[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type CreateAuditLog = typeof auditLogs.$inferInsert;
