import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getTenant } from "./tenant";
import { useLocation } from "wouter";
import { EnvironmentConfigService } from "./environment-config";

// Tipos baseados no que definimos no backend
export interface TenantEnvironment {
  id: string;
  name: string;
  webserviceBaseUrl: string;
  modules: Record<string, boolean>;
  menus?: Record<string, boolean>;
  MOVIMENTOS_SOLICITACAO_COMPRAS: string[];
  MOVIMENTOS_ORDEM_COMPRA: string[];
  MOVIMENTOS_NOTA_FISCAL_PRODUTO: string[];
  MOVIMENTOS_NOTA_FISCAL_SERVICO: string[];
  MOVIMENTOS_OUTRAS_MOVIMENTACOES: string[];
}

export interface TenantConfig {
  tenantKey: string;
  name: string;
  logo: string | null;
  environments: TenantEnvironment[];
}

interface TenantContextType {
  tenant: TenantConfig | null;
  isLoading: boolean;
  error: string | null;
  selectedEnvironment: TenantEnvironment | null;
  selectEnvironment: (envId: string) => void;
  refreshTenant: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenant] = useState<TenantConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEnvironment, setSelectedEnvironment] = useState<TenantEnvironment | null>(null);
  const [location, setLocation] = useLocation();

  const loadTenant = async () => {
    if (location.startsWith("/superadmin")) {
      setIsLoading(false);
      return;
    }

    const tenantKey = getTenant();

    if (!tenantKey) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/public/tenant-config/${tenantKey}?t=${new Date().getTime()}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (response.status === 404) {
        setError("Tenant not found");
        if (location !== '/company-not-found') {
            setLocation("/company-not-found");
        }
        return;
      }

      if (response.status === 403) {
        let message = "Acesso ao tenant indisponível";
        try {
          const body = await response.json();
          if (body?.error) message = String(body.error);
        } catch {}

        setError(message);

        if (message.toLowerCase().includes("avaliação expirado") || message.toLowerCase().includes("avaliacao expirado")) {
          if (location !== "/trial-expired") {
            setLocation("/trial-expired");
          }
          return;
        }

        if (location !== "/company-not-found") {
          setLocation("/company-not-found");
        }
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to load tenant config");
      }

      const data: TenantConfig = await response.json();
      setTenant(data);

      // Se encontrou o tenant e está na landing page, redirecionar para login
      if (location === '/') {
          setLocation("/login");
      }

      // Tentar restaurar ambiente selecionado do localStorage se existir e pertencer a este tenant
      // Ou atualizar o ambiente selecionado com os novos dados
      const currentEnvId = selectedEnvironment?.id || localStorage.getItem(`selected_env_${tenantKey}`);
      
      if (currentEnvId) {
          const savedEnv = data.environments.find(e => e.id === currentEnvId);
          if (savedEnv) {
              setSelectedEnvironment(savedEnv);
              localStorage.setItem(`selected_env_${tenantKey}`, savedEnv.id);
              localStorage.setItem('selected_endpoint', savedEnv.webserviceBaseUrl);
              // Sync modules with legacy service for Sidebar
              EnvironmentConfigService.saveEnabledModules(savedEnv.modules);
              EnvironmentConfigService.saveEnabledMenus(savedEnv.menus || null);
              return;
          }
      }

      const fallbackEnv = data.environments[0];
      if (fallbackEnv) {
        setSelectedEnvironment(fallbackEnv);
        localStorage.setItem(`selected_env_${tenantKey}`, fallbackEnv.id);
        localStorage.setItem('selected_endpoint', fallbackEnv.webserviceBaseUrl);
        EnvironmentConfigService.saveEnabledModules(fallbackEnv.modules);
        EnvironmentConfigService.saveEnabledMenus(fallbackEnv.menus || null);
      }

    } catch (err: any) {
      console.error("Error loading tenant:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTenant();
  }, []); // Remove setLocation from deps to avoid loop, though it was there before. Kept loadTenant call.

  const selectEnvironment = (envId: string) => {
    if (!tenant) return;
    const env = tenant.environments.find(e => e.id === envId);
    if (env) {
      setSelectedEnvironment(env);
      localStorage.setItem(`selected_env_${tenant.tenantKey}`, envId);
      
      // Persistir URL do Webservice globalmente se necessário
      localStorage.setItem('selected_endpoint', env.webserviceBaseUrl);

      // Sync modules with legacy service for Sidebar
      EnvironmentConfigService.saveEnabledModules(env.modules);
      EnvironmentConfigService.saveEnabledMenus(env.menus || null);
    }
  };

  return (
    <TenantContext.Provider value={{ 
      tenant, 
      isLoading, 
      error, 
      selectedEnvironment, 
      selectEnvironment,
      refreshTenant: loadTenant 
    }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
}
