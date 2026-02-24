import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCw, Shield, Save, LogOut, Settings, Server, List, ChevronRight, ChevronDown, Switch as SwitchIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { menuItems, MenuItem } from "@/config/menu-items";

type TenantStatus = "active" | "inactive" | "trial" | "blocked" | "cancelled";

type TenantRow = {
  _id: string;
  tenantKey: string;
  status: TenantStatus;
  company?: { tradeName?: string };
  domains?: { tenantHost?: string };
  trial?: { startedAt?: string; endsAt?: string; days?: number };
  access?: { blocked?: boolean; blockedReason?: string | null };
  createdAt?: string;
  updatedAt?: string;
};

type EnvironmentModule = {
  id: string;
  name: string;
  enabled: boolean;
  modules: Record<string, boolean>;
  menus: Record<string, boolean>;
  webserviceBaseUrl?: string;
  restBaseUrl?: string;
  soapDataServerUrl?: string;
};

export default function SuperAdminTenantsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<TenantRow[]>([]);
  const [query, setQuery] = useState("");

  const [editing, setEditing] = useState<TenantRow | null>(null);
  const [editStatus, setEditStatus] = useState<TenantStatus>("trial");
  const [editTrialEndsAt, setEditTrialEndsAt] = useState<string>("");
  const [editBlocked, setEditBlocked] = useState<boolean>(false);
  const [editBlockedReason, setEditBlockedReason] = useState<string>("");

  // Modules management state
  const [modulesDialogOpen, setModulesDialogOpen] = useState(false);
  const [environments, setEnvironments] = useState<EnvironmentModule[]>([]);
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>("");
  const [modulesConfig, setModulesConfig] = useState<Record<string, boolean>>({});
  const [menusConfig, setMenusConfig] = useState<Record<string, boolean>>({});
  const [savingModules, setSavingModules] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const me = await fetch("/api/superadmin/me");
      if (!me.ok) {
        setLocation("/superadmin");
        return;
      }

      const response = await fetch("/api/superadmin/tenants", { cache: "no-store" });
      if (!response.ok) throw new Error("Falha ao carregar tenants");
      const data = await response.json();
      setRows(Array.isArray(data?.data) ? data.data : []);
    } catch (err: any) {
      toast({ title: "Erro", description: err?.message || "Falha ao carregar tenants.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((t) => {
      const name = (t.company?.tradeName || "").toLowerCase();
      const key = (t.tenantKey || "").toLowerCase();
      const host = (t.domains?.tenantHost || "").toLowerCase();
      return name.includes(q) || key.includes(q) || host.includes(q);
    });
  }, [rows, query]);

  const statusBadge = (status: TenantStatus) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-600 hover:bg-green-600">ATIVO</Badge>;
      case "trial":
        return <Badge className="bg-yellow-600 hover:bg-yellow-600 text-black">TRIAL</Badge>;
      case "blocked":
        return <Badge className="bg-red-600 hover:bg-red-600">BLOQUEADO</Badge>;
      case "inactive":
        return <Badge variant="secondary">INATIVO</Badge>;
      case "cancelled":
        return <Badge variant="secondary">CANCELADO</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const toIsoDateInput = (value?: string) => {
    if (!value) return "";
    const d = new Date(value);
    if (isNaN(d.getTime())) return "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const openEdit = (t: TenantRow) => {
    setEditing(t);
    setEditStatus(t.status);
    setEditTrialEndsAt(toIsoDateInput(t.trial?.endsAt));
    setEditBlocked(Boolean(t.access?.blocked));
    setEditBlockedReason(t.access?.blockedReason ? String(t.access.blockedReason) : "");
  };

  const save = async () => {
    if (!editing) return;
    setLoading(true);
    try {
      const payload: any = {
        status: editStatus,
        blocked: editBlocked,
        blockedReason: editBlockedReason || null,
      };

      if (editTrialEndsAt) {
        payload.trialEndsAt = `${editTrialEndsAt}T23:59:59.999Z`;
      }

      const response = await fetch(`/api/superadmin/tenants/${editing._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const txt = await response.text().catch(() => "");
        throw new Error(txt || "Falha ao salvar");
      }

      toast({ title: "Salvo", description: "Tenant atualizado com sucesso." });
      setEditing(null);
      await load();
    } catch (err: any) {
      toast({ title: "Erro", description: err?.message || "Falha ao salvar.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/superadmin/logout", { method: "POST" });
    } finally {
      setLocation("/superadmin");
    }
  };

  // Modules management functions
  const openModulesDialog = async (tenant: TenantRow) => {
    try {
      setEditing(tenant);
      setModulesDialogOpen(true);
      
      const response = await fetch(`/api/superadmin/tenants/${tenant._id}/modules`);
      if (!response.ok) throw new Error("Falha ao carregar módulos");
      
      const data = await response.json();
      setEnvironments(data.environments || []);
      
      // Select first environment by default
      if (data.environments?.length > 0) {
        setSelectedEnvironment(data.environments[0].id);
        setModulesConfig(data.environments[0].modules || {});
        setMenusConfig(data.environments[0].menus || {});
      }
    } catch (err: any) {
      toast({ title: "Erro", description: err?.message || "Falha ao carregar módulos.", variant: "destructive" });
    }
  };

  const handleEnvironmentChange = (envId: string) => {
    const env = environments.find(e => e.id === envId);
    if (env) {
      setSelectedEnvironment(envId);
      setModulesConfig(env.modules || {});
      setMenusConfig(env.menus || {});
    }
  };

  const toggleModule = (moduleId: string, checked: boolean) => {
    setModulesConfig(prev => ({ ...prev, [moduleId]: checked }));
  };

  const toggleMenu = (menuId: string, checked: boolean) => {
    setMenusConfig(prev => ({ ...prev, [menuId]: checked }));
  };

  const saveModules = async () => {
    if (!editing || !selectedEnvironment) return;
    
    setSavingModules(true);
    try {
      const response = await fetch(`/api/superadmin/tenants/${editing._id}/environments/${selectedEnvironment}/modules`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modules: modulesConfig, menus: menusConfig }),
      });

      if (!response.ok) {
        const txt = await response.text().catch(() => "");
        throw new Error(txt || "Falha ao salvar módulos");
      }

      toast({ title: "Salvo", description: "Módulos atualizados com sucesso." });
      setModulesDialogOpen(false);
      setEditing(null);
    } catch (err: any) {
      toast({ title: "Erro", description: err?.message || "Falha ao salvar módulos.", variant: "destructive" });
    } finally {
      setSavingModules(false);
    }
  };

  return (
    <div className="min-h-screen p-6 space-y-6">
      <Card className="border-muted/20 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4 text-yellow-500" />
                Superadmin · Tenants
              </CardTitle>
              <CardDescription>Gerencie trials e status de acesso.</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={load} disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Atualizar
              </Button>
              <Button variant="destructive" onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por tenantKey, nome ou host..."
              className="max-w-md"
            />
            <div className="text-sm text-muted-foreground">{filtered.length} tenants</div>
          </div>

          <div className="rounded-lg overflow-hidden border border-muted/20">
            <Table>
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead>TenantKey</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Trial fim</TableHead>
                  <TableHead>Host</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((t) => (
                  <TableRow key={t._id}>
                    <TableCell className="font-mono text-xs">{t.tenantKey}</TableCell>
                    <TableCell>{t.company?.tradeName || "-"}</TableCell>
                    <TableCell className="space-x-2">
                      {statusBadge(t.status)}
                      {t.access?.blocked ? <Badge className="bg-red-700 hover:bg-red-700">BLOQ</Badge> : null}
                    </TableCell>
                    <TableCell>{t.trial?.endsAt ? new Date(t.trial.endsAt).toLocaleDateString("pt-BR") : "-"}</TableCell>
                    <TableCell className="font-mono text-xs">{t.domains?.tenantHost || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="sm" onClick={() => openModulesDialog(t)}>
                          <Settings className="mr-1 h-3 w-3" />
                          Módulos
                        </Button>
                        <Dialog open={editing?._id === t._id} onOpenChange={(open) => (open ? openEdit(t) : setEditing(null))}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              Editar
                            </Button>
                          </DialogTrigger>
                        <DialogContent className="max-w-lg">
                          <DialogHeader>
                            <DialogTitle>Editar Tenant</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <div className="text-sm text-muted-foreground">TenantKey</div>
                                <div className="font-mono text-sm">{t.tenantKey}</div>
                              </div>
                              <div className="space-y-2">
                                <div className="text-sm text-muted-foreground">Status</div>
                                <Select value={editStatus} onValueChange={(v) => setEditStatus(v as TenantStatus)}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="active">Ativo</SelectItem>
                                    <SelectItem value="trial">Trial</SelectItem>
                                    <SelectItem value="inactive">Inativo</SelectItem>
                                    <SelectItem value="blocked">Bloqueado</SelectItem>
                                    <SelectItem value="cancelled">Cancelado</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <div className="text-sm text-muted-foreground">Trial fim</div>
                                <Input type="date" value={editTrialEndsAt} onChange={(e) => setEditTrialEndsAt(e.target.value)} />
                              </div>
                              <div className="space-y-2">
                                <div className="text-sm text-muted-foreground">Bloqueado</div>
                                <Select value={editBlocked ? "1" : "0"} onValueChange={(v) => setEditBlocked(v === "1")}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="0">Não</SelectItem>
                                    <SelectItem value="1">Sim</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="text-sm text-muted-foreground">Motivo do bloqueio</div>
                              <Input value={editBlockedReason} onChange={(e) => setEditBlockedReason(e.target.value)} placeholder="Opcional" />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button onClick={save} disabled={loading}>
                              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                              Salvar
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                      Nenhum tenant encontrado.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modules Management Dialog */}
      <Dialog open={modulesDialogOpen} onOpenChange={setModulesDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerenciar Módulos e Menus</DialogTitle>
            <div className="text-sm text-muted-foreground">
              {editing?.company?.tradeName} ({editing?.tenantKey})
            </div>
          </DialogHeader>

          <div className="space-y-4">
            {/* Environment Selection */}
            <div className="space-y-2">
              <Label>Ambiente</Label>
              <Select value={selectedEnvironment} onValueChange={handleEnvironmentChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {environments.map((env) => (
                    <SelectItem key={env.id} value={env.id}>
                      {env.name} {env.enabled ? "" : "(Desativado)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Modules Configuration */}
            <Tabs defaultValue="modules" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="modules">
                  <Server className="mr-2 h-4 w-4" />
                  Módulos
                </TabsTrigger>
                <TabsTrigger value="menus">
                  <List className="mr-2 h-4 w-4" />
                  Menus
                </TabsTrigger>
              </TabsList>

              <TabsContent value="modules" className="space-y-4">
                <div className="grid gap-4 max-h-96 overflow-y-auto">
                  {menuItems.map((item) => (
                    <ModuleItem key={item.id} item={item} level={0} />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="menus" className="space-y-4">
                <div className="grid gap-4 max-h-96 overflow-y-auto">
                  {menuItems.map((item) => (
                    <MenuItemComponent key={item.id} item={item} level={0} />
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModulesDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveModules} disabled={savingModules}>
              {savingModules ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Salvar Módulos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  // Module Item Component
  function ModuleItem({ item, level = 0 }: { item: MenuItem; level?: number }) {
    const isEnabled = modulesConfig[item.id] || false;
    
    return (
      <div className={`flex items-center justify-between p-3 rounded-lg border ${level > 0 ? 'ml-4' : ''}`}>
        <div className="flex items-center gap-3">
          {item.icon && <item.icon className="h-4 w-4" />}
          <span className={level > 0 ? 'text-sm' : 'font-medium'}>{item.label}</span>
        </div>
        <Switch
          checked={isEnabled}
          onCheckedChange={(checked) => toggleModule(item.id, checked)}
        />
      </div>
    );
  }

  // Menu Item Component (for sub-menus)
  function MenuItemComponent({ item, level = 0 }: { item: MenuItem; level?: number }) {
    const [expanded, setExpanded] = useState(level === 0);
    const isEnabled = menusConfig[item.id] || false;
    
    return (
      <div className={`space-y-2 ${level > 0 ? 'ml-4' : ''}`}>
        <div className="flex items-center justify-between p-3 rounded-lg border">
          <div className="flex items-center gap-3">
            {item.children && (
              <button onClick={() => setExpanded(!expanded)} className="p-1">
                {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            )}
            {item.icon && <item.icon className="h-4 w-4" />}
            <span className={level > 0 ? 'text-sm' : 'font-medium'}>{item.label}</span>
          </div>
          <Switch
            checked={isEnabled}
            onCheckedChange={(checked) => toggleMenu(item.id, checked)}
          />
        </div>
        
        {expanded && item.children && (
          <div className="space-y-2">
            {item.children.map((child) => (
              <MenuItemComponent key={child.id} item={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }
}

