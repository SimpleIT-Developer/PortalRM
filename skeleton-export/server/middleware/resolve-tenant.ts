
import { Request, Response, NextFunction } from 'express';

// Extend Express Request type to include tenantKey
declare global {
  namespace Express {
    interface Request {
      tenantKey?: string;
    }
  }
}

export function resolveTenant(req: Request, res: Response, next: NextFunction) {
  const isDev = process.env.NODE_ENV !== 'production';

  // 1. Check Header (Highest Priority)
  // Used by both Dev (manual override) and Prod (sent by frontend)
  let tenantKey = req.headers['x-tenant'] as string;

  // 2. Check Query Param (Dev/Testing only)
  // Useful for quick switching: http://localhost:5000/api/some-route?tenant=cliente1
  if (!tenantKey && isDev) {
    tenantKey = req.query.tenant as string;
  }

  // 3. Check Hostname (Production Fallback / Direct Access)
  // If the request comes directly to the backend (e.g. server-side rendering or direct API call)
  // and no header is set, try to infer from subdomain.
  if (!tenantKey && !isDev && req.hostname) {
     const host = req.hostname;
     // Assuming format: tenant.portalrm.simpleit.app.br
     if (host.includes('.portalrm.simpleit.app.br')) {
         tenantKey = host.split('.')[0];
     }
  }

  // 4. Fallback (Dev only)
  if (!tenantKey && isDev) {
    tenantKey = 'cliente1'; // Default for local development
  }

  // Attach to request object
  if (tenantKey) {
    req.tenantKey = tenantKey;
    // Also set it back to header so downstream services/logs can see it
    req.headers['x-tenant'] = tenantKey;
  }

  // Note: We don't block the request here if tenant is missing.
  // Some routes might be public (like /register, /login).
  // Specific routes requiring tenant should check req.tenantKey.

  next();
}
