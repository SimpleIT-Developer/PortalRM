import { users, auditLogs, type User, type InsertUser, type AuditLog, type CreateAuditLog, type AuditLogFilters, type AuditLogResponse } from "@shared/schema";
import { db } from "./db";
import { eq, desc, count, sql, and, gte, lte, ilike, or, gt } from "drizzle-orm";
// import { pool } from "./db"; // Removed

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
    // Disabled for PortalRM integration
    return undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    // Disabled for PortalRM integration
    return undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    // Disabled for PortalRM integration
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Disabled for PortalRM integration - return mock user
    const now = new Date();
    return {
      id: 1,
      ...insertUser,
      createdAt: now,
      updatedAt: now,
      lastLogin: null,
      resetToken: null,
      resetTokenExpires: null,
      servicealias: null,
      domain: null
    };
  }

  async updateUserResetToken(email: string, token: string, expires: Date): Promise<void> {
    // Disabled for PortalRM integration
    return;
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    // Disabled for PortalRM integration
    return undefined;
  }

  async clearUserResetToken(userId: number): Promise<void> {
    // Disabled for PortalRM integration
    return;
  }

  async updateUserPassword(userId: number, hashedPassword: string): Promise<void> {
    // Disabled for PortalRM integration
    return;
  }

  async ensureUsersTableExists(): Promise<void> {
    // Disabled for PortalRM integration
    return;
  }

  async createAuditLog(auditLog: CreateAuditLog): Promise<AuditLog> {
    // Disabled for PortalRM integration - return mock log
    const now = new Date();
    return {
      id: 1,
      ...auditLog,
      timestamp: now,
      details: auditLog.details || null
    };
  }

  async getAuditLogs(filters?: AuditLogFilters): Promise<AuditLogResponse> {
    // Disabled for PortalRM integration
    return {
      data: [],
      pagination: {
        total: 0,
        page: filters?.page || 1,
        limit: filters?.limit || 50,
        totalPages: 0
      }
    };
  }

  async ensureAuditTableExists(): Promise<void> {
    // Disabled for PortalRM integration
    return;
  }
}

export const storage = new DatabaseStorage();
