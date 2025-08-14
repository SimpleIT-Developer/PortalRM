import { useState, useEffect } from 'react';
import { PermissionsService, type UserPermissions } from '@/lib/permissions';

export interface UsePermissionsReturn {
  permissions: UserPermissions | null;
  loading: boolean;
  error: string | null;
  hasGestaoComprasPermission: boolean;
  hasGestaoFinanceiraPermission: boolean;
  hasAssistenteVirtualRHPermission: boolean;
  hasAssistenteVirtualFinanceiroPermission: boolean;
  refetch: () => Promise<void>;
}

export function usePermissions(username: string | null): UsePermissionsReturn {
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPermissions = async () => {
    if (!username) {
      setPermissions(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const userPermissions = await PermissionsService.getUserPermissionsWithCache(username);
      setPermissions(userPermissions);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar permissões';
      setError(errorMessage);
      console.error('Erro no hook usePermissions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, [username]);

  const hasGestaoComprasPermission = permissions ? permissions.MNUSC !== 0 : false;
  const hasGestaoFinanceiraPermission = permissions ? permissions.MNULF !== 0 : false;
  const hasAssistenteVirtualRHPermission = permissions ? permissions.MNULB !== 0 : false;
  // Usando MNULF para o Assistente Virtual Financeiro, conforme solicitado
  // Quando MNULF = 0, o menu Assistente Virtual - Financeiro deve ser bloqueado
  const hasAssistenteVirtualFinanceiroPermission = permissions ? permissions.MNULF !== 0 : false;

  return {
    permissions,
    loading,
    error,
    hasGestaoComprasPermission,
    hasGestaoFinanceiraPermission,
    hasAssistenteVirtualRHPermission,
    hasAssistenteVirtualFinanceiroPermission,
    refetch: fetchPermissions,
  };
}