import { storage } from "./storage";
import type { Request } from "express";

interface AuditLogData {
  userId: number;
  userName: string;
  action: string;
  details?: string;
}

export class AuditLogger {
  static async log(req: Request & { user?: any }, data: AuditLogData): Promise<void> {
    try {
      const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] as string || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';

      await storage.createAuditLog({
        userId: data.userId,
        userName: data.userName,
        action: data.action,
        details: data.details,
        ipAddress,
        userAgent
      });
    } catch (error) {
      // Log de auditoria não deve quebrar o fluxo principal
      console.error('Erro ao criar log de auditoria:', error);
    }
  }

  // Métodos de conveniência para ações comuns
  static async logMenuAccess(req: Request & { user?: any }, menuName: string): Promise<void> {
    if (!req.user) return;
    await this.log(req, {
      userId: req.user.id,
      userName: req.user.name || req.user.username,
      action: `Acessou o Menu ${menuName}`,
    });
  }

  static async logDocumentDownload(req: Request & { user?: any }, docType: string, docId: string, downloadType: string): Promise<void> {
    if (!req.user) return;
    await this.log(req, {
      userId: req.user.id,
      userName: req.user.name || req.user.username,
      action: `Exportou ${downloadType} do documento ${docType}`,
      details: `Documento ID: ${docId}`
    });
  }

  static async logBulkDownload(req: Request & { user?: any }, docType: string, downloadType: string, count: number): Promise<void> {
    if (!req.user) return;
    await this.log(req, {
      userId: req.user.id,
      userName: req.user.name || req.user.username,
      action: `Exportou ${downloadType} em lote`,
      details: `Tipo: ${docType}, Quantidade: ${count} documentos`
    });
  }

  static async logPasswordChange(req: Request & { user?: any }): Promise<void> {
    if (!req.user) return;
    await this.log(req, {
      userId: req.user.id,
      userName: req.user.name || req.user.username,
      action: 'Alterou sua senha'
    });
  }

  static async logVersionView(req: Request & { user?: any }): Promise<void> {
    if (!req.user) return;
    await this.log(req, {
      userId: req.user.id,
      userName: req.user.name || req.user.username,
      action: 'Acessou o Menu Usuário e visualizou as Atualizações'
    });
  }

  static async logXMLImport(req: Request & { user?: any }, fileName: string): Promise<void> {
    if (!req.user) return;
    await this.log(req, {
      userId: req.user.id,
      userName: req.user.name || req.user.username,
      action: 'Importou um XML',
      details: `Arquivo: ${fileName}`
    });
  }

  static async logFornecedorPreCadastro(req: Request & { user?: any }, cnpj: string, fornecedorNome: string): Promise<void> {
    if (!req.user) return;
    await this.log(req, {
      userId: req.user.id,
      userName: req.user.name || req.user.username,
      action: 'Fez um pré-cadastro de Fornecedor',
      details: `CNPJ: ${cnpj}, Nome: ${fornecedorNome}`
    });
  }

  static async logUserCreation(req: Request & { user?: any }, createdUserName: string, createdUserEmail: string): Promise<void> {
    if (!req.user) return;
    await this.log(req, {
      userId: req.user.id,
      userName: req.user.name || req.user.username,
      action: 'Criou um novo usuário',
      details: `Nome: ${createdUserName}, Email: ${createdUserEmail}`
    });
  }

  static async logUserUpdate(req: Request & { user?: any }, updatedUserName: string, updatedUserId: number): Promise<void> {
    if (!req.user) return;
    await this.log(req, {
      userId: req.user.id,
      userName: req.user.name || req.user.username,
      action: 'Atualizou dados de usuário',
      details: `Usuário: ${updatedUserName} (ID: ${updatedUserId})`
    });
  }

  static async logUserDeletion(req: Request & { user?: any }, deletedUserName: string, deletedUserId: number): Promise<void> {
    if (!req.user) return;
    await this.log(req, {
      userId: req.user.id,
      userName: req.user.name || req.user.username,
      action: 'Excluiu um usuário',
      details: `Usuário: ${deletedUserName} (ID: ${deletedUserId})`
    });
  }

  static async logDocumentView(req: Request & { user?: any }, docType: string, docId: string, viewType: string): Promise<void> {
    if (!req.user) return;
    await this.log(req, {
      userId: req.user.id,
      userName: req.user.name || req.user.username,
      action: `Visualizou ${viewType} do documento ${docType}`,
      details: `Documento ID: ${docId}`
    });
  }
}