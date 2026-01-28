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
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenant] = useState<TenantConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEnvironment, setSelectedEnvironment] = useState<TenantEnvironment | null>(null);
  const [location, setLocation] = useLocation();

  useEffect(() => {
    const loadTenant = async () => {
      const tenantKey = getTenant();

      if (!tenantKey) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/public/tenant-config/${tenantKey}`);
        
        if (response.status === 404) {
          setError("Tenant not found");
          // Redirecionamento é tratado no componente visual ou App.tsx se necessário
          // Mas aqui já sinalizamos o erro
          if (location !== '/company-not-found') {
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
        const savedEnvId = localStorage.getItem(`selected_env_${tenantKey}`);
        if (savedEnvId) {
            const savedEnv = data.environments.find(e => e.id === savedEnvId);
            if (savedEnv) {
                setSelectedEnvironment(savedEnv);
                // Sync modules with legacy service for Sidebar
                EnvironmentConfigService.saveEnabledModules(savedEnv.modules);
            }
        }

      } catch (err: any) {
        console.error("Error loading tenant:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadTenant();
  }, [setLocation]);

  const selectEnvironment = (envId: string) => {
    if (!tenant) return;
    const env = tenant.environments.find(e => e.id === envId);
    if (env) {
      setSelectedEnvironment(env);
      localStorage.setItem(`selected_env_${tenant.tenantKey}`, envId);
      
      // Persistir URL do Webservice globalmente se necessário (para compatibilidade com código legado)
      // Mas o ideal é usar o contexto.
      localStorage.setItem('selected_endpoint', env.webserviceBaseUrl);

      // Sync modules with legacy service for Sidebar
      EnvironmentConfigService.saveEnabledModules(env.modules);
    }
  };

  return (
    <TenantContext.Provider value={{ tenant, isLoading, error, selectedEnvironment, selectEnvironment }}>
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
