import { Request } from "express";

export class AuditLogger {
  static async log(req: Request & { user?: any }, data: any): Promise<void> {
    console.log('[AuditLogger]', data.action, data.details || '');
  }

  static async logMenuAccess(req: Request & { user?: any }, menuName: string): Promise<void> {
    console.log('[AuditLogger] Access Menu:', menuName);
  }

  static async logDocumentDownload(req: Request & { user?: any }, docType: string, docId: string, downloadType: string): Promise<void> {
    console.log('[AuditLogger] Download:', docType, docId, downloadType);
  }

  static async logBulkDownload(req: Request & { user?: any }, docType: string, downloadType: string, count: number): Promise<void> {
    console.log('[AuditLogger] Bulk Download:', docType, downloadType, count);
  }

  static async logDocumentView(req: Request & { user?: any }, docType: string, docId: string, viewType: string): Promise<void> {
    console.log('[AuditLogger] View:', docType, docId, viewType);
  }
}
