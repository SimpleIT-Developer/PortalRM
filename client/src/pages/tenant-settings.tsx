import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Save, Building, Server, List, Box, X, ArrowLeft, Plus, Edit2, Trash2, RefreshCw, ChevronRight, ChevronDown } from "lucide-react";
import { getTenant } from "@/lib/tenant";
import { useTenant } from "@/lib/tenant-context";
import { menuItems, MenuItem } from "@/config/menu-items";
import { cn } from "@/lib/utils";
import { EnvironmentConfigService } from "@/lib/environment-config";

const DEFAULT_MODULES = menuItems.reduce((acc, mod) => {
    // Only core modules are enabled by default
    const isCore = ['dashboard-principal', 'parametros'].includes(mod.id);
    return { ...acc, [mod.id]: isCore };
}, {});

// Helper to generate default menus map (all children set to false by default)
const generateDefaultMenus = () => {
    const menus: Record<string, boolean> = {};
    const traverse = (item: MenuItem) => {
        // Only core sub-menus are enabled by default if needed, but usually we rely on module level
        // For safety, we default to false unless it's a core path
        menus[item.id] = false;
        if (item.children) {
            item.children.forEach(traverse);
        }
    };
    
    menuItems.forEach(module => {
        if (module.children) {
            module.children.forEach(traverse);
        }
    });
    return menus;
};

const DEFAULT_MENUS = generateDefaultMenus();

// Helper functions for masking
const formatCnpj = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

const formatPhone = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{4})\d+?$/, '$1');
};

interface Environment {
    _id?: string;
    tempId?: string; // For client-side tracking before save
    name: string;
    enabled: boolean;
    webserviceBaseUrl: string;
    restBaseUrl: string;
    soapDataServerUrl: string;
    authMode: 'basic' | 'bearer';
    tokenEndpoint: string;
    modules: Record<string, boolean>;
    menus?: Record<string, boolean>;
    MOVIMENTOS_SOLICITACAO_COMPRAS: string[];
    MOVIMENTOS_ORDEM_COMPRA: string[];
    MOVIMENTOS_NOTA_FISCAL_PRODUTO: string[];
    MOVIMENTOS_NOTA_FISCAL_SERVICO: string[];
    MOVIMENTOS_OUTRAS_MOVIMENTACOES: string[];
}

export default function TenantSettingsPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { refreshTenant } = useTenant();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Data State
  const [tenantId, setTenantId] = useState<string | null>(null);
  
  // Geral
  const [companyLegalName, setCompanyLegalName] = useState("");
  const [companyTradeName, setCompanyTradeName] = useState("");
  const [companyCnpj, setCompanyCnpj] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminPhone, setAdminPhone] = useState("");
  const [adminEmail, setAdminEmail] = useState("");

  // Ambientes
  const [environments, setEnvironments] = useState<Environment[]>([]);
  
  // Environment Editing State
  const [isEnvDialogOpen, setIsEnvDialogOpen] = useState(false);
  const [editingEnv, setEditingEnv] = useState<Environment | null>(null);

  // Input States for Tags (Shared for the modal)
  const [inputSolicitacao, setInputSolicitacao] = useState("");
  const [inputOrdem, setInputOrdem] = useState("");
  const [inputNfProduto, setInputNfProduto] = useState("");
  const [inputNfServico, setInputNfServico] = useState("");
  const [inputOutras, setInputOutras] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const storedUser = localStorage.getItem('portal_user');
      if (!storedUser) {
        toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
        setLocation("/admin-login");
        return;
      }

      const userData = JSON.parse(storedUser);
      const tId = userData.admin?.tenantId;
      
      if (!tId) throw new Error("ID do Tenant não encontrado na sessão");
      setTenantId(tId);

      const headers: Record<string, string> = {};
      const tenant = getTenant();
      if (tenant) headers['X-Tenant'] = tenant;

      const response = await fetch(`/api/tenant/${tId}`, { headers });
      if (!response.ok) throw new Error("Falha ao carregar dados do tenant");
      
      const data = await response.json();
      const t = data.tenant;
      const a = data.admin;

      // Populate Geral
      setCompanyLegalName(t.company?.legalName || "");
      setCompanyTradeName(t.company?.tradeName || "");
      setCompanyCnpj(formatCnpj(t.company?.cnpj || ""));
      setSubdomain(t.tenantKey || "");
      
      setAdminName(a?.name || "");
      setAdminPhone(formatPhone(a?.phone || ""));
      setAdminEmail(a?.email || "");

      // Populate Environments
      if (t.environments && Array.isArray(t.environments)) {
          // Ensure all environments have complete module/menu maps
          const processedEnvs = t.environments.map((env: Environment) => ({
              ...env,
              modules: { ...DEFAULT_MODULES, ...env.modules },
              menus: { ...DEFAULT_MENUS, ...(env.menus || {}) }
          }));
          setEnvironments(processedEnvs);
      } else {
          // Fallback logic if needed, but schema should handle it
          setEnvironments([]);
      }

    } catch (error: any) {
      console.error("Erro ao carregar:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível carregar as configurações.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!tenantId) return;
    setIsSaving(true);
    try {
      const payload = {
        company: {
            legalName: companyLegalName,
            tradeName: companyTradeName,
            cnpj: companyCnpj
        },
        admin: {
            name: adminName,
            phone: adminPhone
        }
      };

      const response = await fetch(`/api/tenant/${tenantId}`, {
        method: 'PUT',
        headers: { 
            'Content-Type': 'application/json',
            ...(getTenant() ? { 'X-Tenant': getTenant()! } : {})
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || "Falha ao salvar");
      }

      const updated = await response.json();
      // Update local state if needed, but we already have it
      
      toast({
        title: "Sucesso",
        description: "Configurações salvas com sucesso.",
      });

    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSyncLegacy = async () => {
      if (!tenantId) return;
      if (!confirm("Isso irá importar ambientes da configuração antiga (baseada no email do admin). Deseja continuar?")) return;
      
      setIsLoading(true);
      try {
          const headers: Record<string, string> = {};
          const tenant = getTenant();
          if (tenant) headers['X-Tenant'] = tenant;

          const response = await fetch(`/api/tenant/${tenantId}/sync-legacy`, { 
              method: 'POST',
              headers
          });
          
          if (!response.ok) {
              const err = await response.json();
              throw new Error(err.error || "Falha na sincronização");
          }

          const result = await response.json();
          toast({
              title: "Sincronização",
              description: result.message
          });
          
          // Reload data
          loadData();
          await refreshTenant();

      } catch (error: any) {
          toast({
              title: "Erro",
              description: error.message,
              variant: "destructive"
          });
          setIsLoading(false);
      }
  };

  // Environment Management
  const handleAddEnvironment = () => {
      const newEnv: Environment = {
          tempId: crypto.randomUUID(),
          name: "Novo Ambiente",
          enabled: true,
          webserviceBaseUrl: "",
          restBaseUrl: "",
          soapDataServerUrl: "",
          authMode: 'basic',
          tokenEndpoint: "",
          modules: { ...DEFAULT_MODULES },
          menus: { ...DEFAULT_MENUS },
          MOVIMENTOS_SOLICITACAO_COMPRAS: [],
          MOVIMENTOS_ORDEM_COMPRA: [],
          MOVIMENTOS_NOTA_FISCAL_PRODUTO: [],
          MOVIMENTOS_NOTA_FISCAL_SERVICO: [],
          MOVIMENTOS_OUTRAS_MOVIMENTACOES: []
      };
      setEditingEnv(newEnv);
      setIsEnvDialogOpen(true);
  };

  const handleEditEnvironment = (env: Environment) => {
      // Ensure we have all keys populated when editing
      setEditingEnv({ 
          ...env,
          modules: { ...DEFAULT_MODULES, ...env.modules },
          menus: { ...DEFAULT_MENUS, ...(env.menus || {}) }
      }); 
      setIsEnvDialogOpen(true);
  };

  const handleDeleteEnvironment = async (envToDelete: Environment) => {
      if (!confirm(`Tem certeza que deseja excluir o ambiente "${envToDelete.name}"?`)) return;
      
      if (!envToDelete._id) {
          // If it's a temp environment (not saved yet), just remove from state
          setEnvironments(environments.filter(e => e.tempId !== envToDelete.tempId));
          return;
      }

      try {
          const headers: Record<string, string> = {};
          const tenant = getTenant();
          if (tenant) headers['X-Tenant'] = tenant;

          const response = await fetch(`/api/tenant/${tenantId}/environments/${envToDelete._id}`, {
              method: 'DELETE',
              headers
          });

          if (!response.ok) {
              const err = await response.json();
              throw new Error(err.error || "Falha ao excluir ambiente");
          }

          setEnvironments(environments.filter(e => e._id !== envToDelete._id));
          await refreshTenant();
          toast({ title: "Sucesso", description: "Ambiente excluído com sucesso." });
      } catch (error: any) {
          console.error("Erro ao excluir:", error);
          toast({
              title: "Erro",
              description: error.message,
              variant: "destructive"
          });
      }
  };

  const saveEditingEnv = async () => {
      if (!editingEnv || !tenantId) return;
      
      try {
          const normalizeConfigMap = (input: Record<string, boolean> | undefined) => {
              if (!input) return input;
              const out: Record<string, boolean> = {};
              for (const [key, value] of Object.entries(input)) {
                  const normalizedKey = key.replace(/_/g, '-');
                  const isHyphenKey = key === normalizedKey;
                  if (!(normalizedKey in out)) {
                      out[normalizedKey] = value;
                      continue;
                  }
                  if (isHyphenKey) {
                      out[normalizedKey] = value;
                  }
              }
              return out;
          };

          const headers: Record<string, string> = {
              'Content-Type': 'application/json'
          };
          const tenant = getTenant();
          if (tenant) headers['X-Tenant'] = tenant;

          const payload = {
              ...editingEnv,
              modules: normalizeConfigMap(editingEnv.modules),
              menus: normalizeConfigMap(editingEnv.menus)
          };

          let response;
          if (editingEnv._id) {
              // Update
              response = await fetch(`/api/tenant/${tenantId}/environments/${editingEnv._id}`, {
                  method: 'PUT',
                  headers,
                  body: JSON.stringify(payload)
              });
          } else {
              // Create
              response = await fetch(`/api/tenant/${tenantId}/environments`, {
                  method: 'POST',
                  headers,
                  body: JSON.stringify(payload)
              });
          }

          if (!response.ok) {
              const err = await response.json();
              throw new Error(err.error || "Falha ao salvar ambiente");
          }

          const savedEnv = await response.json();

          setEnvironments(prev => {
              if (editingEnv._id) {
                  return prev.map(e => e._id === savedEnv._id ? savedEnv : e);
              } else {
                  return [...prev, savedEnv];
              }
          });

          // Se o ambiente editado for o atual, atualizar localStorage e notificar Sidebar imediatamente
          const currentEnvId = localStorage.getItem(`selected_env_${getTenant()}`);
          if (savedEnv._id === currentEnvId || savedEnv.id === currentEnvId) {
              EnvironmentConfigService.saveEnabledModules(savedEnv.modules);
              EnvironmentConfigService.saveEnabledMenus(savedEnv.menus || null);
          }

          await refreshTenant();
          setIsEnvDialogOpen(false);
          setEditingEnv(null);
          toast({ title: "Sucesso", description: "Ambiente salvo com sucesso." });

      } catch (error: any) {
          console.error("Erro ao salvar ambiente:", error);
          toast({
              title: "Erro",
              description: error.message,
              variant: "destructive"
          });
      }
  };

  // Tag Helpers for Modal
  const addTag = (value: string, list: string[], setList: (l: string[]) => void, setInput: (s: string) => void) => {
      const trimmed = value.trim();
      if (trimmed && !list.includes(trimmed)) {
          setList([...list, trimmed]);
          setInput("");
      }
  };

  const removeTag = (value: string, list: string[], setList: (l: string[]) => void) => {
      setList(list.filter(item => item !== value));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent, value: string, list: string[], setList: (l: string[]) => void, setInput: (s: string) => void) => {
      if (e.key === 'Enter' || e.key === ',') {
          e.preventDefault();
          addTag(value, list, setList, setInput);
      }
  };

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCompanyCnpj(formatCnpj(e.target.value));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAdminPhone(formatPhone(e.target.value));
  };

  if (isLoading) {
      return <div className="flex h-screen items-center justify-center bg-[#121212] text-white"><Loader2 className="h-8 w-8 animate-spin text-yellow-500" /></div>;
  }

  const ModuleItem = ({ item, level = 0 }: { item: MenuItem, level?: number }) => {
    const isTopLevel = level === 0;
    
    // Fallback para chaves antigas com underscore (ex: gestao_financeira vs gestao-financeira)
    const getModuleEnabled = (id: string) => {
        if (!editingEnv?.modules) return false;
        // Check for hyphenated key first (standard)
        if (editingEnv.modules[id] !== undefined) return editingEnv.modules[id];
        // Fallback for underscore
        const underscoreId = id.replace(/-/g, '_');
        return editingEnv.modules[underscoreId] ?? false;
    };

    const getMenuEnabled = (id: string) => {
        if (!editingEnv?.menus) return false; 
        // Check for hyphenated key first
        if (editingEnv.menus[id] !== undefined) return editingEnv.menus[id];
        // Fallback for underscore
        const underscoreId = id.replace(/-/g, '_');
        return editingEnv.menus[underscoreId] ?? false;
    };

    const isEnabled = isTopLevel 
        ? getModuleEnabled(item.id)
        : getMenuEnabled(item.id);

    const handleToggle = (checked: boolean) => {
        if (!editingEnv) return;
        
        if (isTopLevel) {
             const normalizedId = item.id.replace(/_/g, '-');
             const underscoreId = normalizedId.replace(/-/g, '_');
             const nextModules = { ...editingEnv.modules };
             delete nextModules[underscoreId];
             delete nextModules[normalizedId];
             setEditingEnv({
                 ...editingEnv,
                 modules: { ...nextModules, [normalizedId]: checked }
             });
        } else {
             const normalizedId = item.id.replace(/_/g, '-');
             const underscoreId = normalizedId.replace(/-/g, '_');
             const nextMenus = { ...(editingEnv.menus || {}) };
             delete nextMenus[underscoreId];
             delete nextMenus[normalizedId];
             setEditingEnv({
                 ...editingEnv,
                 menus: { ...nextMenus, [normalizedId]: checked }
             });
        }
    };

    const hasChildren = item.children && item.children.length > 0;

    return (
        <div className="w-full">
            <div className={cn("flex items-center justify-between p-3 rounded-lg border-gray-700 mb-2", level === 0 ? "bg-[#2D2D2D] border" : "bg-transparent border-0 pl-0")}>
                <Label htmlFor={`mod-${item.id}`} className={cn("cursor-pointer flex-1", level > 0 && "text-sm text-gray-300")}>{item.label}</Label>
                <Switch 
                    id={`mod-${item.id}`}
                    checked={isEnabled} 
                    onCheckedChange={handleToggle}
                    className="data-[state=checked]:bg-yellow-500"
                />
            </div>
            {hasChildren && isEnabled && (
                <div className={cn("ml-4 pl-4 border-l border-gray-700", level === 0 && "mb-4")}>
                    {item.children!.map(child => (
                        <ModuleItem key={child.id} item={child} level={level + 1} />
                    ))}
                </div>
            )}
        </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => setLocation("/dashboard")} className="text-gray-400 hover:text-white pl-0 gap-2">
            <ArrowLeft className="h-4 w-4" /> Voltar para Dashboard
        </Button>
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold text-white">Configurações do Ambiente</h1>
                <p className="text-gray-400">Gerencie os dados da sua empresa, conexões e módulos.</p>
            </div>
            <Button onClick={handleSave} disabled={isSaving} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold">
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Salvar Alterações
            </Button>
        </div>

        <Tabs defaultValue="geral" className="w-full">
            <TabsList className="bg-[#1E1E1E] border border-gray-800 p-1">
                <TabsTrigger value="geral" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black"><Building className="mr-2 h-4 w-4"/> Geral</TabsTrigger>
                <TabsTrigger value="ambientes" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black"><Server className="mr-2 h-4 w-4"/> Ambientes</TabsTrigger>
            </TabsList>

            {/* ABAS - GERAL */}
            <TabsContent value="geral">
                <Card className="bg-[#1E1E1E] border-gray-800">
                    <CardHeader>
                        <CardTitle className="text-white">Dados da Empresa e Administrador</CardTitle>
                        <CardDescription>Informações cadastrais principais.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-gray-300">Razão Social</Label>
                                <Input value={companyLegalName} onChange={e => setCompanyLegalName(e.target.value)} className="bg-[#2D2D2D] border-gray-700 text-white" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-gray-300">Nome Fantasia</Label>
                                <Input value={companyTradeName} onChange={e => setCompanyTradeName(e.target.value)} className="bg-[#2D2D2D] border-gray-700 text-white" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-gray-300">CNPJ</Label>
                                <Input 
                                    value={companyCnpj} 
                                    onChange={handleCnpjChange} 
                                    maxLength={18}
                                    placeholder="00.000.000/0000-00"
                                    className="bg-[#2D2D2D] border-gray-700 text-white" 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-gray-300">Subdomínio</Label>
                                <div className="flex items-center gap-2">
                                    <Input value={subdomain} disabled className="bg-[#2D2D2D] border-gray-700 text-gray-400 cursor-not-allowed w-1/3" />
                                    <span className="text-gray-400">.portalrm.simpleit.app.br</span>
                                </div>
                            </div>
                        </div>
                        <div className="h-px bg-gray-800 my-4" />
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-gray-300">Nome do Administrador</Label>
                                <Input value={adminName} onChange={e => setAdminName(e.target.value)} className="bg-[#2D2D2D] border-gray-700 text-white" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-gray-300">Email (Login)</Label>
                                <Input value={adminEmail} disabled className="bg-[#2D2D2D] border-gray-700 text-gray-500 cursor-not-allowed" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-gray-300">Telefone</Label>
                                <Input 
                                    value={adminPhone} 
                                    onChange={handlePhoneChange} 
                                    maxLength={15}
                                    placeholder="(00) 00000-0000"
                                    className="bg-[#2D2D2D] border-gray-700 text-white" 
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* ABAS - AMBIENTES (LISTA) */}
            <TabsContent value="ambientes">
                <Card className="bg-[#1E1E1E] border-gray-800">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-white">Meus Ambientes</CardTitle>
                            <CardDescription>Gerencie seus ambientes de conexão.</CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={handleSyncLegacy} variant="outline" className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white">
                                <RefreshCw className="mr-2 h-4 w-4" /> Sincronizar Legado
                            </Button>
                            <Button onClick={handleAddEnvironment} variant="outline" className="border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black">
                                <Plus className="mr-2 h-4 w-4" /> Adicionar Novo Ambiente
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {environments.length === 0 && (
                            <p className="text-center text-gray-500 py-8">Nenhum ambiente configurado.</p>
                        )}
                        {environments.map((env, index) => (
                            <div key={env._id || env.tempId || index} className="flex items-center justify-between p-4 rounded-lg bg-[#2D2D2D] border border-gray-700">
                                <div>
                                    <h3 className="text-lg font-bold text-white">{env.name}</h3>
                                    <p className="text-sm text-gray-400">{env.webserviceBaseUrl || "URL não configurada"}</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button size="icon" variant="ghost" onClick={() => handleEditEnvironment(env)} className="text-gray-400 hover:text-white">
                                        <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button size="icon" variant="ghost" onClick={() => handleDeleteEnvironment(env)} className="text-red-400 hover:text-red-300">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>

        {/* DIALOG DE EDIÇÃO DE AMBIENTE */}
        <Dialog open={isEnvDialogOpen} onOpenChange={setIsEnvDialogOpen}>
            <DialogContent className="bg-[#1E1E1E] border-gray-800 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{editingEnv?.name || "Novo Ambiente"}</DialogTitle>
                    <DialogDescription>Configure os detalhes deste ambiente.</DialogDescription>
                </DialogHeader>
                
                {editingEnv && (
                    <Tabs defaultValue="conexao" className="w-full mt-4">
                        <TabsList className="bg-[#2D2D2D] w-full justify-start">
                            <TabsTrigger value="conexao">Ambiente</TabsTrigger>
                            <TabsTrigger value="parametrizacao">Parametrização</TabsTrigger>
                            <TabsTrigger value="modulos">Módulos</TabsTrigger>
                        </TabsList>

                        {/* SUB-ABA CONEXÃO */}
                        <TabsContent value="conexao" className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Nome do Ambiente</Label>
                                <Input 
                                    value={editingEnv.name} 
                                    onChange={e => setEditingEnv({...editingEnv, name: e.target.value})}
                                    className="bg-[#2D2D2D] border-gray-700" 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>URL do WebService (SOAP)</Label>
                                <Input 
                                    value={editingEnv.webserviceBaseUrl} 
                                    onChange={e => setEditingEnv({...editingEnv, webserviceBaseUrl: e.target.value})}
                                    placeholder="http://servidor:8051"
                                    className="bg-[#2D2D2D] border-gray-700" 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>URL do DataServer (SOAP Action - Opcional)</Label>
                                <Input 
                                    value={editingEnv.soapDataServerUrl || ""} 
                                    onChange={e => setEditingEnv({...editingEnv, soapDataServerUrl: e.target.value})}
                                    placeholder="http://servidor:8051/wsDataServer/IwsDataServer"
                                    className="bg-[#2D2D2D] border-gray-700" 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>URL da API REST</Label>
                                <Input 
                                    value={editingEnv.restBaseUrl || ""} 
                                    onChange={e => setEditingEnv({...editingEnv, restBaseUrl: e.target.value})}
                                    placeholder="http://servidor:8051/api/rm"
                                    className="bg-[#2D2D2D] border-gray-700" 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>URL de Token (Opcional)</Label>
                                <Input 
                                    value={editingEnv.tokenEndpoint || ""} 
                                    onChange={e => setEditingEnv({...editingEnv, tokenEndpoint: e.target.value})}
                                    placeholder="Caso seja diferente da URL base"
                                    className="bg-[#2D2D2D] border-gray-700" 
                                />
                            </div>

                            <div className="space-y-2 pt-2">
                                <Label>Modo de Autenticação</Label>
                                <div className="flex gap-4">
                                    <label className="flex items-center space-x-2">
                                        <input 
                                            type="radio" 
                                            name="authMode" 
                                            checked={editingEnv.authMode === 'bearer'}
                                            onChange={() => setEditingEnv({...editingEnv, authMode: 'bearer'})}
                                            className="accent-yellow-500"
                                        />
                                        <span>Bearer Token</span>
                                    </label>
                                    <label className="flex items-center space-x-2">
                                        <input 
                                            type="radio" 
                                            name="authMode" 
                                            checked={editingEnv.authMode === 'basic'}
                                            onChange={() => setEditingEnv({...editingEnv, authMode: 'basic'})}
                                            className="accent-yellow-500"
                                        />
                                        <span>Basic Auth</span>
                                    </label>
                                </div>
                            </div>

                             <div className="flex items-center space-x-2 pt-2">
                                <Switch 
                                    id="env-enabled"
                                    checked={editingEnv.enabled}
                                    onCheckedChange={checked => setEditingEnv({...editingEnv, enabled: checked})}
                                    className="data-[state=checked]:bg-yellow-500"
                                />
                                <Label htmlFor="env-enabled">Ambiente Ativo</Label>
                            </div>
                        </TabsContent>

                        {/* SUB-ABA PARAMETRIZAÇÃO */}
                        <TabsContent value="parametrizacao" className="space-y-6 py-4">
                             {/* Solicitação de Compras */}
                            <div className="space-y-2">
                                <Label className="text-gray-300">Solicitação de Compras (1.1.XX)</Label>
                                <div className="flex gap-2">
                                    <Input 
                                        value={inputSolicitacao}
                                        onChange={e => setInputSolicitacao(e.target.value)}
                                        onKeyDown={e => handleTagKeyDown(e, inputSolicitacao, editingEnv.MOVIMENTOS_SOLICITACAO_COMPRAS, (l) => setEditingEnv({...editingEnv, MOVIMENTOS_SOLICITACAO_COMPRAS: l}), setInputSolicitacao)}
                                        placeholder="Digite e Enter"
                                        className="bg-[#2D2D2D] border-gray-700"
                                    />
                                    <Button onClick={() => addTag(inputSolicitacao, editingEnv.MOVIMENTOS_SOLICITACAO_COMPRAS, (l) => setEditingEnv({...editingEnv, MOVIMENTOS_SOLICITACAO_COMPRAS: l}), setInputSolicitacao)} variant="secondary">Add</Button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {editingEnv.MOVIMENTOS_SOLICITACAO_COMPRAS.map(tag => (
                                        <div key={tag} className="bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded-md text-sm flex items-center gap-1 border border-yellow-500/30">
                                            {tag}
                                            <button onClick={() => removeTag(tag, editingEnv.MOVIMENTOS_SOLICITACAO_COMPRAS, (l) => setEditingEnv({...editingEnv, MOVIMENTOS_SOLICITACAO_COMPRAS: l}))}><X className="h-3 w-3" /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                             {/* Ordem de Compra */}
                             <div className="space-y-2">
                                <Label className="text-gray-300">Ordem de Compra (1.2.XX)</Label>
                                <div className="flex gap-2">
                                    <Input 
                                        value={inputOrdem}
                                        onChange={e => setInputOrdem(e.target.value)}
                                        onKeyDown={e => handleTagKeyDown(e, inputOrdem, editingEnv.MOVIMENTOS_ORDEM_COMPRA, (l) => setEditingEnv({...editingEnv, MOVIMENTOS_ORDEM_COMPRA: l}), setInputOrdem)}
                                        placeholder="Digite e Enter"
                                        className="bg-[#2D2D2D] border-gray-700"
                                    />
                                    <Button onClick={() => addTag(inputOrdem, editingEnv.MOVIMENTOS_ORDEM_COMPRA, (l) => setEditingEnv({...editingEnv, MOVIMENTOS_ORDEM_COMPRA: l}), setInputOrdem)} variant="secondary">Add</Button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {editingEnv.MOVIMENTOS_ORDEM_COMPRA.map(tag => (
                                        <div key={tag} className="bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded-md text-sm flex items-center gap-1 border border-yellow-500/30">
                                            {tag}
                                            <button onClick={() => removeTag(tag, editingEnv.MOVIMENTOS_ORDEM_COMPRA, (l) => setEditingEnv({...editingEnv, MOVIMENTOS_ORDEM_COMPRA: l}))}><X className="h-3 w-3" /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                             {/* NF Produto */}
                             <div className="space-y-2">
                                <Label className="text-gray-300">Nota Fiscal de Produto</Label>
                                <div className="flex gap-2">
                                    <Input 
                                        value={inputNfProduto}
                                        onChange={e => setInputNfProduto(e.target.value)}
                                        onKeyDown={e => handleTagKeyDown(e, inputNfProduto, editingEnv.MOVIMENTOS_NOTA_FISCAL_PRODUTO, (l) => setEditingEnv({...editingEnv, MOVIMENTOS_NOTA_FISCAL_PRODUTO: l}), setInputNfProduto)}
                                        placeholder="Digite e Enter"
                                        className="bg-[#2D2D2D] border-gray-700"
                                    />
                                    <Button onClick={() => addTag(inputNfProduto, editingEnv.MOVIMENTOS_NOTA_FISCAL_PRODUTO, (l) => setEditingEnv({...editingEnv, MOVIMENTOS_NOTA_FISCAL_PRODUTO: l}), setInputNfProduto)} variant="secondary">Add</Button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {editingEnv.MOVIMENTOS_NOTA_FISCAL_PRODUTO.map(tag => (
                                        <div key={tag} className="bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded-md text-sm flex items-center gap-1 border border-yellow-500/30">
                                            {tag}
                                            <button onClick={() => removeTag(tag, editingEnv.MOVIMENTOS_NOTA_FISCAL_PRODUTO, (l) => setEditingEnv({...editingEnv, MOVIMENTOS_NOTA_FISCAL_PRODUTO: l}))}><X className="h-3 w-3" /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* NF Serviço */}
                            <div className="space-y-2">
                                <Label className="text-gray-300">Nota Fiscal de Serviço</Label>
                                <div className="flex gap-2">
                                    <Input 
                                        value={inputNfServico}
                                        onChange={e => setInputNfServico(e.target.value)}
                                        onKeyDown={e => handleTagKeyDown(e, inputNfServico, editingEnv.MOVIMENTOS_NOTA_FISCAL_SERVICO, (l) => setEditingEnv({...editingEnv, MOVIMENTOS_NOTA_FISCAL_SERVICO: l}), setInputNfServico)}
                                        placeholder="Digite e Enter"
                                        className="bg-[#2D2D2D] border-gray-700"
                                    />
                                    <Button onClick={() => addTag(inputNfServico, editingEnv.MOVIMENTOS_NOTA_FISCAL_SERVICO, (l) => setEditingEnv({...editingEnv, MOVIMENTOS_NOTA_FISCAL_SERVICO: l}), setInputNfServico)} variant="secondary">Add</Button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {editingEnv.MOVIMENTOS_NOTA_FISCAL_SERVICO.map(tag => (
                                        <div key={tag} className="bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded-md text-sm flex items-center gap-1 border border-yellow-500/30">
                                            {tag}
                                            <button onClick={() => removeTag(tag, editingEnv.MOVIMENTOS_NOTA_FISCAL_SERVICO, (l) => setEditingEnv({...editingEnv, MOVIMENTOS_NOTA_FISCAL_SERVICO: l}))}><X className="h-3 w-3" /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </TabsContent>

                        {/* SUB-ABA MÓDULOS */}
                        <TabsContent value="modulos" className="py-4">
                            <div className="grid grid-cols-1 gap-4">
                                {menuItems.map((item) => (
                                    <ModuleItem key={item.id} item={item} />
                                ))}
                            </div>
                        </TabsContent>
                    </Tabs>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsEnvDialogOpen(false)} className="text-gray-400 border-gray-700 hover:bg-gray-800">Cancelar</Button>
                    <Button onClick={saveEditingEnv} className="bg-yellow-500 text-black hover:bg-yellow-600">Confirmar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
