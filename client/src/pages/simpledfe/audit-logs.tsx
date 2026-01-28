import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
// import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar, Search, User, Clock, Activity, RefreshCw } from "lucide-react";
import { DateInput } from "@/components/ui/date-input";
import type { AuditLogResponse, AuditLog } from "@shared/schema";

import { getTenant } from "@/lib/tenant";

export default function AuditLogsPage() {
  // Buscar dados do usuário para verificar permissões
  const { data: currentUser } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  // Verificar se o usuário tem permissão (ADMIN ou SYSTEM)
  if (currentUser && currentUser.tipo !== 'admin' && currentUser.tipo !== 'system') {
    return (
      <div className="container mx-auto p-6">
        <div className="container mx-auto p-6">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6 text-center">
              <h2 className="text-xl font-semibold mb-2">Acesso Negado</h2>
              <p className="text-gray-600">
                Você não tem permissão para acessar os logs de auditoria.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  const [filters, setfilters] = useState({
    search: "",
    dateStart: "",
    dateEnd: "",
    page: 1,
    limit: 50
  });

  const { data: logsData, isLoading, refetch } = useQuery<AuditLogResponse>({
    queryKey: ['/api/audit-logs', filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        search: filters.search,
        dateStart: filters.dateStart,
        dateEnd: filters.dateEnd,
        page: filters.page.toString(),
        limit: filters.limit.toString()
      });
      
      const response = await fetch(`/api/audit-logs?${params}`, {
        headers: {
          ...(getTenant() ? { 'X-Tenant': getTenant()! } : {})
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar logs');
      }

      return response.json();
    },
    enabled: true,
    refetchOnWindowFocus: true,
    refetchInterval: 30000 // Atualiza a cada 30 segundos
  });

  // Atualizar dados quando a página for carregada
  useEffect(() => {
    refetch();
  }, [refetch]);

  const handleFilterChange = (field: string, value: string | number) => {
    setfilters(prev => ({
      ...prev,
      [field]: value,
      page: field !== 'page' ? 1 : (typeof value === 'number' ? value : parseInt(value.toString()) || 1)
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionColor = (action: string) => {
    if (action.includes('Acessou')) return 'bg-blue-100 text-blue-800';
    if (action.includes('Exportou') || action.includes('Download')) return 'bg-green-100 text-green-800';
    if (action.includes('Criou') || action.includes('Importou')) return 'bg-purple-100 text-purple-800';
    if (action.includes('Alterou') || action.includes('Atualizou')) return 'bg-yellow-100 text-yellow-800';
    if (action.includes('Excluiu')) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Log de Auditoria</h1>
            <p className="text-muted-foreground">
              Histórico completo de ações dos usuários no sistema
            </p>
          </div>
          <Button
            onClick={() => refetch()}
            variant="outline"
            className="flex items-center gap-2"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Buscar</Label>
              <Input
                id="search"
                placeholder="Buscar por usuário, ação ou detalhes..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="dateStart">Data Inicial</Label>
              <DateInput
                value={filters.dateStart}
                onChange={(value) => handleFilterChange('dateStart', value)}
                placeholder="dd/mm/aaaa"
              />
            </div>
            <div>
              <Label htmlFor="dateEnd">Data Final</Label>
              <DateInput
                value={filters.dateEnd}
                onChange={(value) => handleFilterChange('dateEnd', value)}
                placeholder="dd/mm/aaaa"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Registros de Auditoria
            {logsData?.total && (
              <Badge variant="secondary" className="ml-2">
                {logsData.total.toLocaleString('pt-BR')} registros
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : logsData?.logs.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">Nenhum registro encontrado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logsData?.logs.map((log: AuditLog) => (
                <div
                  key={log.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className={getActionColor(log.action)}>
                          {log.action}
                        </Badge>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <User className="h-4 w-4" />
                          {log.userName}
                        </div>
                      </div>
                      {log.details && (
                        <p className="text-sm text-gray-700 mb-2">{log.details}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(log.createdAt.toString())}
                        </div>
                        {log.ipAddress && (
                          <div>IP: {log.ipAddress}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Paginação */}
          {logsData && logsData.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={filters.page <= 1}
                onClick={() => handleFilterChange('page', filters.page - 1)}
              >
                Anterior
              </Button>
              <span className="text-sm text-gray-600">
                Página {filters.page} de {logsData.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={filters.page >= logsData.totalPages}
                onClick={() => handleFilterChange('page', filters.page + 1)}
              >
                Próxima
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
