
/**
 * Helper to determine the current tenant based on the environment and URL.
 */
export function getTenant(): string | undefined {
  // 1. Check URL Query Param (Highest Priority - mostly for Dev/Testing)
  // e.g., http://localhost:5173/?tenant=cliente1
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const tenantParam = params.get('tenant');
    if (tenantParam) return tenantParam;

    // 2. Check Subdomain (Production)
    // e.g., cliente1.portalrm.simpleit.app.br
    const host = window.location.hostname;
    // Check if we are on a subdomain of portalrm.simpleit.app.br
    // Or just grab the first part if it's not localhost/ip
    if (host.includes('.portalrm.simpleit.app.br')) {
      return host.split('.')[0];
    }
  }

  // 3. Check Stored Token (Persistence after login)
  // Se o usuário já fez login, o tenantKey está salvo no token.
  if (typeof localStorage !== 'undefined') {
      try {
          const stored = localStorage.getItem('totvs_token');
          if (stored) {
              const parsed = JSON.parse(stored);
              if (parsed.tenantKey) {
                  return parsed.tenantKey;
              }
          }
      } catch (e) {
          // Silently ignore parsing errors
      }

      // Check Admin Session (Portal Admin Login)
      try {
          const storedAdmin = localStorage.getItem('portal_user');
          if (storedAdmin) {
              const parsedAdmin = JSON.parse(storedAdmin);
              // The login response structure is { token, admin, tenant: { tenantKey, ... } }
              if (parsedAdmin.tenant && parsedAdmin.tenant.tenantKey) {
                  return parsedAdmin.tenant.tenantKey;
              }
          }
      } catch (e) {
          // Silently ignore parsing errors
      }
  }

  // 4. Fallback (Development)
  // In development, if no query param is provided, we might want a default.
  // However, the backend also has a default. 
  // Sending 'cliente1' here ensures consistency if the backend expects the header.
  // REMOVIDO: Não queremos fallback automático para cliente1 em desenvolvimento.
  // Se não houver tenant, deve cair na Landing Page.
  /*
  if (import.meta.env.DEV) {
    return 'cliente1';
  }
  */

  return undefined;
}
