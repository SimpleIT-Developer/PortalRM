import { users, auditLogs, type User, type InsertUser, type AuditLog, type CreateAuditLog, type AuditLogFilters, type AuditLogResponse } from "@shared/schema";
import { db } from "./db";
import { eq, desc, count, sql, and, gte, lte, ilike, or, gt } from "drizzle-orm";
import { pool } from "./db";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;
  ensureUsersTableExists(): Promise<void>;
  // Métodos de reset de senha
  updateUserResetToken(email: string, token: string, expires: Date): Promise<void>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  clearUserResetToken(userId: number): Promise<void>;
  updateUserPassword(userId: number, hashedPassword: string): Promise<void>;
  // Métodos de auditoria
  createAuditLog(auditLog: CreateAuditLog): Promise<AuditLog>;
  getAuditLogs(filters?: AuditLogFilters): Promise<AuditLogResponse>;
  ensureAuditTableExists(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUserResetToken(email: string, token: string, expires: Date): Promise<void> {
    await db
      .update(users)
      .set({ 
        resetToken: token, 
        resetTokenExpires: expires 
      })
      .where(eq(users.email, email.toLowerCase()));
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.resetToken, token),
          gt(users.resetTokenExpires, new Date())
        )
      );
    return user || undefined;
  }

  async clearUserResetToken(userId: number): Promise<void> {
    await db
      .update(users)
      .set({ 
        resetToken: null, 
        resetTokenExpires: null 
      })
      .where(eq(users.id, userId));
  }

  async updateUserPassword(userId: number, hashedPassword: string): Promise<void> {
    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, userId));
  }

  async ensureUsersTableExists(): Promise<void> {
    try {
      // Verificar se a tabela existe no PostgreSQL
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'users'
        );
      `);
      
      const tableExists = result.rows[0].exists;
      
      if (!tableExists) {
        console.log('Tabela users não encontrada. Criando tabela...');
        
        // Criar tabela users
        await pool.query(`
          CREATE TABLE users (
            id SERIAL PRIMARY KEY,
            username TEXT NOT NULL UNIQUE,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            name TEXT NOT NULL,
            type TEXT,
            status INTEGER DEFAULT 1,
            show_version_notifications BOOLEAN DEFAULT true NOT NULL,
            reset_token TEXT,
            reset_token_expires TIMESTAMP,
            created_at TIMESTAMP DEFAULT NOW() NOT NULL
          );
        `);
        
        console.log('Tabela users criada com sucesso');
      } else {
        console.log('Tabela users já existe');
      }
    } catch (error) {
      console.error('Erro ao verificar/criar tabela users:', error);
      throw error;
    }
  }

  // Métodos de auditoria
  async createAuditLog(auditLog: CreateAuditLog): Promise<AuditLog> {
    const [log] = await db
      .insert(auditLogs)
      .values(auditLog)
      .returning();
    return log;
  }

  async getAuditLogs(filters: AuditLogFilters = {}): Promise<AuditLogResponse> {
    const {
      search,
      userId,
      dateStart,
      dateEnd,
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = filters;

    // Construir condições WHERE
    const conditions = [];
    
    if (search) {
      conditions.push(
        or(
          ilike(auditLogs.userName, `%${search}%`),
          ilike(auditLogs.action, `%${search}%`),
          ilike(auditLogs.details, `%${search}%`)
        )
      );
    }

    if (userId) {
      conditions.push(eq(auditLogs.userId, userId));
    }

    if (dateStart) {
      conditions.push(gte(auditLogs.createdAt, new Date(dateStart)));
    }

    if (dateEnd) {
      conditions.push(lte(auditLogs.createdAt, new Date(dateEnd + ' 23:59:59')));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Contar total de registros
    const [totalResult] = await db
      .select({ count: count() })
      .from(auditLogs)
      .where(whereClause);

    const total = totalResult.count;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;

    // Buscar logs com paginação
    const logs = await db
      .select()
      .from(auditLogs)
      .where(whereClause)
      .orderBy(sortOrder === 'desc' ? desc(auditLogs[sortBy]) : auditLogs[sortBy])
      .limit(limit)
      .offset(offset);

    return {
      logs,
      total,
      page,
      totalPages,
      limit
    };
  }

  async ensureAuditTableExists(): Promise<void> {
    try {
      // Verificar se a tabela audit_logs existe no PostgreSQL
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'audit_logs'
        );
      `);
      
      const tableExists = result.rows[0].exists;
      
      if (!tableExists) {
        console.log('Tabela audit_logs não encontrada. Criando tabela...');
        
        // Criar tabela audit_logs
        await pool.query(`
          CREATE TABLE audit_logs (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL,
            user_name TEXT NOT NULL,
            action TEXT NOT NULL,
            details TEXT,
            ip_address TEXT,
            user_agent TEXT,
            created_at TIMESTAMP DEFAULT NOW() NOT NULL
          );
        `);
        
        // Criar índices para performance
        await pool.query(`
          CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
          CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
          CREATE INDEX idx_audit_logs_action ON audit_logs(action);
        `);
        
        console.log('Tabela audit_logs criada com sucesso');
      } else {
        console.log('Tabela audit_logs já existe');
      }
    } catch (error) {
      console.error('Erro ao verificar/criar tabela audit_logs:', error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();