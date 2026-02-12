import { Request, Response, NextFunction } from "express";

declare module "express-session" {
  interface SessionData {
    superadmin?: {
      email: string;
      createdAt: number;
    };
  }
}

export function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.session?.superadmin) return next();
  return res.status(401).json({ error: "Não autenticado" });
}

