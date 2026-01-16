import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { totvsLoginSchema, type TotvsLoginRequest } from "@shared/schema";
import { AuthService, AuthenticationError } from "@/lib/auth";
import { StartupCheckService } from "@/lib/startup-check";
import { EndpointService, type EndpointOption } from "@/lib/endpoint";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Eye, EyeOff, User, Server, AlertCircle, CheckCircle, Box, ChevronDown, ChevronUp, Globe, Settings, LogOut, Pencil, Trash2, Plus, X, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import LoadingScreen from "@/components/loading-screen";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const SYSTEM_MODULES = [
  { id: 'dashboard-principal', label: 'Dashboards' },
  { id: 'simpledfe', label: 'SimpleDFe' },
  { id: 'gestao-compras', label: 'Gestão de Compras' },
  { id: 'gestao-financeira', label: 'Gestão Financeira' },
  { id: 'gestao-contabil', label: 'Gestão Contábil' },
  { id: 'gestao-fiscal', label: 'Gestão Fiscal' },
  { id: 'gestao-rh', label: 'Gestão de RH' },
  { id: 'assistentes-virtuais', label: 'Assistentes Virtuais' },
  { id: 'parametros', label: 'Parâmetros' },
];

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<AuthenticationError | null>(null);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [verificationProgress, setVerificationProgress] = useState<number | undefined>(undefined);
  const [verificationMessage, setVerificationMessage] = useState<string | undefined>(undefined);
  
  // Estados para gerenciamento de endpoints
  const [endpoints, setEndpoints] = useState<EndpointOption[]>([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('');
  const [tempEndpoint, setTempEndpoint] = useState<string>('');
  const [isLoadingEndpoints, setIsLoadingEndpoints] = useState(true);

  // Estados para edição de ambientes
  const [configViewMode, setConfigViewMode] = useState<'list' | 'edit'>('list');
  const [editingEnvId, setEditingEnvId] = useState<string | null>(null);
  const [envName, setEnvName] = useState('');
  const [envUrl, setEnvUrl] = useState('');
  const [modulesConfig, setModulesConfig] = useState<Record<string, boolean>>({});
  
  // Estados para parametrização de movimentos (Arrays de Strings)
  const [movSolicitacaoCompras, setMovSolicitacaoCompras] = useState<string[]>([]);
  const [movOrdemCompra, setMovOrdemCompra] = useState<string[]>([]);
  const [movNotaFiscalProduto, setMovNotaFiscalProduto] = useState<string[]>([]);
  const [movNotaFiscalServico, setMovNotaFiscalServico] = useState<string[]>([]);
  const [movOutrasMovimentacoes, setMovOutrasMovimentacoes] = useState<string[]>([]);
  
  // Inputs temporários para adição de tags
  const [inputSolicitacaoCompras, setInputSolicitacaoCompras] = useState("");
  const [inputOrdemCompra, setInputOrdemCompra] = useState("");
  const [inputNotaFiscalProduto, setInputNotaFiscalProduto] = useState("");
  const [inputNotaFiscalServico, setInputNotaFiscalServico] = useState("");
  const [inputOutrasMovimentacoes, setInputOutrasMovimentacoes] = useState("");

  const [isSavingEnv, setIsSavingEnv] = useState(false);

  // Helper para adicionar tag
  const addTag = (value: string, list: string[], setList: (l: string[]) => void, setInput: (s: string) => void) => {
      const trimmed = value.trim();
      if (trimmed && !list.includes(trimmed)) {
          setList([...list, trimmed]);
          setInput("");
      }
  };

  // Helper para remover tag
  const removeTag = (value: string, list: string[], setList: (l: string[]) => void) => {
      setList(list.filter(item => item !== value));
  };

  // Helper para evento de tecla (Enter/Vírgula)
  const handleTagKeyDown = (e: React.KeyboardEvent, value: string, list: string[], setList: (l: string[]) => void, setInput: (s: string) => void) => {
      if (e.key === 'Enter' || e.key === ',') {
          e.preventDefault();
          addTag(value, list, setList, setInput);
      }
  };

  // Estados para Login de Configuração
  const [showConfigLoginDialog, setShowConfigLoginDialog] = useState(false);
  const [configUsername, setConfigUsername] = useState('');
  const [configPassword, setConfigPassword] = useState('');
  const [isConfigLoginLoading, setIsConfigLoginLoading] = useState(false);
  const [debugError, setDebugError] = useState<string | null>(null);
  const [showDebugDialog, setShowDebugDialog] = useState(false);
  
  // Estados para seleção de ambiente
  const [availableEnvironments, setAvailableEnvironments] = useState<any[]>([]);
  const [selectedEnvName, setSelectedEnvName] = useState<string>('');
  const [globalClientCode, setGlobalClientCode] = useState<string>('');
  const [globalClientName, setGlobalClientName] = useState<string>('');
  // Novos estados para a aba Geral
  const [globalContactName, setGlobalContactName] = useState<string>('');
  const [globalEmail, setGlobalEmail] = useState<string>('');
  const [globalPhone, setGlobalPhone] = useState<string>('');
  const [globalAccessUser, setGlobalAccessUser] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');

  // Controle de acesso ao login principal
  const [isEnvironmentConfigured, setIsEnvironmentConfigured] = useState(false);

  const form = useForm<TotvsLoginRequest>({
    resolver: zodResolver(totvsLoginSchema),
    defaultValues: {
      grant_type: "password",
      username: "",
      password: "",
      servicealias: "",
    },
  });

  // Carregar endpoints na inicialização
  useEffect(() => {
    const loadEndpoints = async () => {
      try {
        setIsLoadingEndpoints(true);
        // Limpar endpoint antigo hardcoded se existir
        const oldEndpoint = localStorage.getItem('selected_endpoint');
        if (oldEndpoint && oldEndpoint.includes('legiaoda142256')) {
          localStorage.removeItem('selected_endpoint');
        }

        const endpointList = await EndpointService.loadEndpoints();
        setEndpoints(endpointList);
        
        // Inicializar como "Não Conectado"
        setSelectedEndpoint('');
        setTempEndpoint('');
      } catch (error) {
        console.error('Erro ao carregar endpoints:', error);
        setSelectedEndpoint('');
        setEndpoints([]);
        toast({
          title: "Aviso",
          description: "Não foi possível carregar a lista de endpoints. Usando configuração padrão.",
          variant: "default",
        });
      } finally {
        setIsLoadingEndpoints(false);
      }
    };

    loadEndpoints();
  }, [toast]);

  // Salvar endpoint selecionado
  const handleSaveEndpoint = () => {
    setSelectedEndpoint(tempEndpoint);
    EndpointService.saveSelectedEndpoint(tempEndpoint);
    setShowConfigDialog(false);
    toast({
      title: "Ambiente Configurado",
      description: `Conectado a: ${tempEndpoint}`,
    });
  };

  // Login de Configuração
  const handleConfigLogin = async () => {
    if (!configUsername || !configPassword) {
        toast({
            title: "Campos obrigatórios",
            description: "Por favor, preencha usuário e senha.",
            variant: "destructive"
        });
        return;
    }

    setIsConfigLoginLoading(true);
    try {
        console.log('🔄 Iniciando login de configuração...');
        const response = await fetch('/api/config-auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                CODUSUARIO: configUsername,
                SENHA: configPassword
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Falha no login');
        }

        const data = await response.json();
        console.log('✅ Login de configuração realizado com sucesso:', data);
        
        // Atualizar estados globais de cliente
        if (data.CODCLIENTE) setGlobalClientCode(data.CODCLIENTE);
        if (data.NOMECLIENTE) setGlobalClientName(data.NOMECLIENTE);
        
        // Atualizar novos estados globais
        if (data.NOME_CONTATO) setGlobalContactName(data.NOME_CONTATO);
        if (data.EMAIL) setGlobalEmail(data.EMAIL);
        if (data.TELEFONE) setGlobalPhone(data.TELEFONE);
        if (data.CODUSUARIO) setGlobalAccessUser(data.CODUSUARIO);
        setNewPassword(''); // Limpar senha ao carregar

        // Processar ambientes retornados
        let environments = [];
        if (data.AMBIENTES && Array.isArray(data.AMBIENTES) && data.AMBIENTES.length > 0) {
            environments = data.AMBIENTES;
        } else if (data.URLWS) {
            // Fallback para estrutura antiga ou registro único
            environments = [{
                URLWS: data.URLWS,
                NOMEDOAMBIENTE: data.NOMEDOAMBIENTE,
                CODCLIENTE: data.CODCLIENTE,
                NOMECLIENTE: data.NOMECLIENTE
            }];
        }

        if (environments.length > 0) {
            setAvailableEnvironments(environments);
            setShowConfigLoginDialog(false);
            
            toast({
                title: "Login de Configuração Realizado",
                description: "Selecione o ambiente para conectar.",
                variant: "default"
            });
        } else {
             throw new Error('Nenhum ambiente configurado para este usuário.');
        }

    } catch (error: any) {
        console.error("Erro completo no login de config:", error);
        
        // Preparar mensagem de debug detalhada
        let detailedError = "";
        if (typeof error === 'object') {
            detailedError = JSON.stringify(error, Object.getOwnPropertyNames(error), 2);
        } else {
            detailedError = String(error);
        }

        setDebugError(detailedError);
        setShowDebugDialog(true);

        toast({
            title: "Erro no Login",
            description: error.message || "Não foi possível carregar as configurações.",
            variant: "destructive"
        });
    } finally {
        setIsConfigLoginLoading(false);
    }
  };

  const handleConfigLogout = () => {
    setAvailableEnvironments([]);
    setSelectedEnvName('');
    setIsEnvironmentConfigured(false);
    setSelectedEndpoint('');
    setTempEndpoint('');
    setConfigUsername('');
    setConfigPassword('');
    
    // Clear storage
    localStorage.removeItem('config_client_code');
    localStorage.removeItem('config_client_name');
    EndpointService.saveEnabledModules(null);
    EndpointService.saveOrderMovements(null);
    EndpointService.saveNfProductMovements(null);
    EndpointService.saveNfServiceMovements(null);
    EndpointService.saveOtherMovements(null);
    
    toast({
        title: "Logout realizado",
        description: "Ambiente desconectado com sucesso.",
    });
  };

  const handleConfigKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
          handleConfigLogin();
      }
  };

  // Funções de Gerenciamento de Ambientes
  const handleAddNewEnv = () => {
      setEditingEnvId(null);
      setEnvName('');
      setEnvUrl('');
      
      // Default modules to true
      const defaultModules: Record<string, boolean> = {};
      SYSTEM_MODULES.forEach(m => defaultModules[m.id] = true);
      setModulesConfig(defaultModules);

      setMovSolicitacaoCompras([]);
      setMovOrdemCompra([]);
      setMovNotaFiscalProduto([]);
      setMovNotaFiscalServico([]);
      setMovOutrasMovimentacoes([]);
      setConfigViewMode('edit');
  };

  const handleEditEnv = (env: any) => {
      console.log("📝 Editing Env:", env);
      console.log("📦 Loaded Modules:", env.MODULOS);
      setEditingEnvId(env._id);
      setEnvName(env.NOMEDOAMBIENTE);
      setEnvUrl(env.URLWS);
      
      // Load modules or default to true if missing
      const loadedModules: Record<string, boolean> = {};
      SYSTEM_MODULES.forEach(m => {
          if (env.MODULOS && typeof env.MODULOS[m.id] === 'boolean') {
              loadedModules[m.id] = env.MODULOS[m.id];
          } else {
              loadedModules[m.id] = true;
          }
      });
      setModulesConfig(loadedModules);

      setMovSolicitacaoCompras(env.MOVIMENTOS_SOLICITACAO_COMPRAS || []);
      setMovOrdemCompra(env.MOVIMENTOS_ORDEM_COMPRA || []);
      setMovNotaFiscalProduto(env.MOVIMENTOS_NOTA_FISCAL_PRODUTO || []);
      setMovNotaFiscalServico(env.MOVIMENTOS_NOTA_FISCAL_SERVICO || []);
      setMovOutrasMovimentacoes(env.MOVIMENTOS_OUTRAS_MOVIMENTACOES || []);
      setConfigViewMode('edit');
  };

  const handleCancelEdit = () => {
      setConfigViewMode('list');
      setEditingEnvId(null);
  };

  const handleSaveEnv = async () => {
      if (!envName || !envUrl) {
          toast({
              title: "Campos obrigatórios",
              description: "Preencha todos os campos.",
              variant: "destructive"
          });
          return;
      }

      setIsSavingEnv(true);
      try {
          const payload: any = {
              CODUSUARIO: configUsername,
              SENHA: configPassword,
              URLWS: envUrl,
              NOMEDOAMBIENTE: envName,
              // Campos globais editáveis
              NOME_CONTATO: globalContactName,
              EMAIL: globalEmail,
              TELEFONE: globalPhone,
              NOMECLIENTE: globalClientName,
              // Se senha nova foi digitada, envia ela
              ...(newPassword ? { SENHA: newPassword } : {}),
              
              MODULOS: modulesConfig,
              MOVIMENTOS_SOLICITACAO_COMPRAS: movSolicitacaoCompras,
              MOVIMENTOS_ORDEM_COMPRA: movOrdemCompra,
              MOVIMENTOS_NOTA_FISCAL_PRODUTO: movNotaFiscalProduto,
              MOVIMENTOS_NOTA_FISCAL_SERVICO: movNotaFiscalServico,
              MOVIMENTOS_OUTRAS_MOVIMENTACOES: movOutrasMovimentacoes
          };

          if (editingEnvId) {
              payload._id = editingEnvId;
          }

          const response = await fetch('/api/config-auth/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
          });

          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || errorData.message || 'Falha ao salvar ambiente');
          }

          const data = await response.json();
          
          if (data.AMBIENTES) {
              setAvailableEnvironments(data.AMBIENTES);

              // Atualizar estados globais de cliente
              if (data.CODCLIENTE) setGlobalClientCode(data.CODCLIENTE);
              if (data.NOMECLIENTE) setGlobalClientName(data.NOMECLIENTE);
              if (data.NOME_CONTATO) setGlobalContactName(data.NOME_CONTATO);
              if (data.EMAIL) setGlobalEmail(data.EMAIL);
              if (data.TELEFONE) setGlobalPhone(data.TELEFONE);
              if (newPassword) {
                  setConfigPassword(newPassword); // Atualizar senha local se alterada
                  setNewPassword('');
              }
              
              // Verificar se o ambiente editado era o selecionado
              let wasSelected = false;
              
              // Lógica mais robusta para detectar se estamos editando o ambiente ativo
              if (editingEnvId) {
                  // Verifica por ID no array antigo
                  const oldEnv = availableEnvironments.find(e => e._id === editingEnvId);
                  if (oldEnv && (oldEnv.NOMEDOAMBIENTE === selectedEnvName || oldEnv.URLWS === selectedEndpoint)) {
                      wasSelected = true;
                  }
              } else {
                  // Se é novo, verifica se o nome bate
                  if (selectedEnvName === envName) wasSelected = true;
              }

              // Se por acaso o nome não mudou, mas é o selecionado atual
              if (selectedEnvName === envName) {
                  wasSelected = true;
              }

              // Encontrar o ambiente atualizado na nova lista
              const updatedEnv = data.AMBIENTES.find((e: any) => e.NOMEDOAMBIENTE === envName);

              // Se era o selecionado OU se acabamos de criar e já queremos selecionar
              if (updatedEnv && wasSelected) {
                  console.log("🔄 Aplicando atualização online do ambiente:", updatedEnv);
                  
                  // Atualizar todos os estados "Online"
                  setSelectedEnvName(updatedEnv.NOMEDOAMBIENTE);
                  setSelectedEndpoint(updatedEnv.URLWS);
                  setTempEndpoint(updatedEnv.URLWS);
                  EndpointService.saveSelectedEndpoint(updatedEnv.URLWS);
                  
                  // Atualizar storage global
                  localStorage.setItem('config_client_code', data.CODCLIENTE || globalClientCode);
                  localStorage.setItem('config_client_name', data.NOMECLIENTE || globalClientName);
                  if (updatedEnv.MODULOS) {
                      EndpointService.saveEnabledModules(updatedEnv.MODULOS);
                  } else {
                      EndpointService.saveEnabledModules(null);
                  }
                  if (updatedEnv.MOVIMENTOS_ORDEM_COMPRA && Array.isArray(updatedEnv.MOVIMENTOS_ORDEM_COMPRA)) {
                      EndpointService.saveOrderMovements(updatedEnv.MOVIMENTOS_ORDEM_COMPRA);
                  } else {
                      EndpointService.saveOrderMovements(null);
                  }
                  if (updatedEnv.MOVIMENTOS_NOTA_FISCAL_PRODUTO && Array.isArray(updatedEnv.MOVIMENTOS_NOTA_FISCAL_PRODUTO)) {
                      EndpointService.saveNfProductMovements(updatedEnv.MOVIMENTOS_NOTA_FISCAL_PRODUTO);
                  } else {
                      EndpointService.saveNfProductMovements(null);
                  }
                  if (updatedEnv.MOVIMENTOS_NOTA_FISCAL_SERVICO && Array.isArray(updatedEnv.MOVIMENTOS_NOTA_FISCAL_SERVICO)) {
                      EndpointService.saveNfServiceMovements(updatedEnv.MOVIMENTOS_NOTA_FISCAL_SERVICO);
                  } else {
                      EndpointService.saveNfServiceMovements(null);
                  }
                  if (updatedEnv.MOVIMENTOS_OUTRAS_MOVIMENTACOES && Array.isArray(updatedEnv.MOVIMENTOS_OUTRAS_MOVIMENTACOES)) {
                      EndpointService.saveOtherMovements(updatedEnv.MOVIMENTOS_OUTRAS_MOVIMENTACOES);
                  } else {
                      EndpointService.saveOtherMovements(null);
                  }

                  toast({
                      title: "Conexão Atualizada Online",
                      description: `Ambiente ${envName} atualizado e ativo com URL: ${updatedEnv.URLWS}`,
                  });
              }
          }

          toast({
              title: "Sucesso",
              description: editingEnvId ? "Ambiente atualizado." : "Ambiente criado.",
          });
          setConfigViewMode('list');
      } catch (error: any) {
          console.error("Erro ao salvar ambiente:", error);
          toast({
              title: "Erro",
              description: error.message || "Não foi possível salvar as alterações.",
              variant: "destructive"
          });
      } finally {
          setIsSavingEnv(false);
      }
  };

  const handleDeleteEnv = async (envId: string) => {
      if (!confirm("Tem certeza que deseja excluir este ambiente?")) return;

      try {
          const response = await fetch(`/api/config-auth/environment/${envId}`, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ CODUSUARIO: configUsername })
          });

          if (!response.ok) throw new Error('Falha ao excluir');

          const data = await response.json();
          if (data.AMBIENTES) {
              setAvailableEnvironments(data.AMBIENTES);
          }
          
          // Se o ambiente excluído era o selecionado, limpar seleção
          const deletedEnv = availableEnvironments.find(e => e._id === envId);
          if (deletedEnv && deletedEnv.NOMEDOAMBIENTE === selectedEnvName) {
              handleConfigLogout(); // Ou apenas limpar a seleção
          }

          toast({ title: "Ambiente removido" });
      } catch (error) {
          console.error("Erro ao excluir:", error);
          toast({
              title: "Erro",
              description: "Não foi possível excluir o ambiente.",
              variant: "destructive"
          });
      }
  };

  const handleEnvironmentSelect = (envName: string) => {
    const env = availableEnvironments.find(e => e.NOMEDOAMBIENTE === envName);
    if (env) {
        setSelectedEnvName(envName);
        setSelectedEndpoint(env.URLWS);
        setTempEndpoint(env.URLWS);
        EndpointService.saveSelectedEndpoint(env.URLWS);
        
        // Liberar o login principal
        setIsEnvironmentConfigured(true);
        
        localStorage.setItem('config_client_code', globalClientCode || '');
        localStorage.setItem('config_client_name', globalClientName || '');
        
        if (env.MODULOS) {
            EndpointService.saveEnabledModules(env.MODULOS);
        } else {
            EndpointService.saveEnabledModules(null);
        }
        if (env.MOVIMENTOS_ORDEM_COMPRA && Array.isArray(env.MOVIMENTOS_ORDEM_COMPRA)) {
            EndpointService.saveOrderMovements(env.MOVIMENTOS_ORDEM_COMPRA);
        } else {
            EndpointService.saveOrderMovements(null);
        }
        if (env.MOVIMENTOS_NOTA_FISCAL_PRODUTO && Array.isArray(env.MOVIMENTOS_NOTA_FISCAL_PRODUTO)) {
            EndpointService.saveNfProductMovements(env.MOVIMENTOS_NOTA_FISCAL_PRODUTO);
        } else {
            EndpointService.saveNfProductMovements(null);
        }
        if (env.MOVIMENTOS_NOTA_FISCAL_SERVICO && Array.isArray(env.MOVIMENTOS_NOTA_FISCAL_SERVICO)) {
            EndpointService.saveNfServiceMovements(env.MOVIMENTOS_NOTA_FISCAL_SERVICO);
        } else {
            EndpointService.saveNfServiceMovements(null);
        }
        if (env.MOVIMENTOS_OUTRAS_MOVIMENTACOES && Array.isArray(env.MOVIMENTOS_OUTRAS_MOVIMENTACOES)) {
            EndpointService.saveOtherMovements(env.MOVIMENTOS_OUTRAS_MOVIMENTACOES);
        } else {
            EndpointService.saveOtherMovements(null);
        }
        
        toast({
            title: "Ambiente Selecionado",
            description: (
                <div className="flex flex-col gap-1">
                    <span>Conectado a: {env.NOMEDOAMBIENTE}</span>
                    <span className="text-xs text-muted-foreground break-all">{env.URLWS}</span>
                </div>
            ),
        });
    }
  };

  // Clear errors when user starts typing
  const clearErrors = () => {
    if (authError) {
      setAuthError(null);
      setShowTechnicalDetails(false);
    }
  };

  const onSubmit = async (data: TotvsLoginRequest) => {
    setIsLoading(true);
    setAuthError(null);
    setShowTechnicalDetails(false);
    setShowSuccess(false);

    console.log("🚀 Iniciando autenticação...");
    console.log("📍 Endpoint selecionado:", selectedEndpoint);

    try {
      // Salvar a senha temporariamente para o SOAP proxy
      // ATENÇÃO: Isso não é ideal para segurança, mas necessário para o requisito de 
      // usar as credenciais do login na chamada SOAP via proxy
      sessionStorage.setItem("totvs_password", data.password);

      // Remove servicealias if empty
      const credentials = { ...data };
      if (!credentials.servicealias?.trim()) {
        delete credentials.servicealias;
      }

      const tokenData = await AuthService.authenticate({ ...credentials, endpoint: selectedEndpoint });
      AuthService.storeToken(tokenData, data.username, selectedEndpoint);
      
      // Verificação de Configuração (Sentenças SQL)
      // Mostrar tela de loading para verificação
      setShowLoadingScreen(true);
      setVerificationProgress(0);
      setVerificationMessage("Iniciando verificação de sentenças...");

      const checkResult = await StartupCheckService.checkConfiguration((sentence, index, total) => {
          const percent = Math.floor((index / total) * 100);
          setVerificationProgress(percent);
          setVerificationMessage(`Verificando ${sentence} (${index}/${total})...`);
      });
      
      if (!checkResult.success) {
        setShowLoadingScreen(false);
        setVerificationProgress(undefined);
        setVerificationMessage(undefined);

        toast({
          title: "Erro de Configuração",
          description: `Faltando configurações: ${checkResult.missing.join(", ")}. Acesso negado.`,
          variant: "destructive",
          duration: 6000,
        });
        return;
      }

      // Verificação concluída com sucesso
      // Transição para o modo de carregamento automático
      setVerificationProgress(undefined);
      setVerificationMessage(undefined);

      toast({
        title: "Ambiente Verificado",
        description: "Todas as configurações foram encontradas.",
        className: "bg-green-600 text-white border-green-700",
      });

      setShowSuccess(true);
      toast({
        title: "Login realizado com sucesso!",
        description: "Carregando sistema...",
      });

      // A tela de loading continua exibida (showLoadingScreen=true), 
      // mas agora entra no modo automático (progressValue=undefined)

    } catch (error) {
      if (error instanceof AuthenticationError) {
        setAuthError(error);
        toast({
          title: "Erro de Autenticação",
          description: error.message,
          variant: "destructive",
        });
      } else {
        const friendlyMessage = "Erro inesperado. Verifique sua conexão e tente novamente.";
        const technicalDetails = error instanceof Error ? error.message : "Erro desconhecido";
        const authError = new AuthenticationError(friendlyMessage, technicalDetails);
        setAuthError(authError);
        toast({
          title: "Erro de Autenticação",
          description: friendlyMessage,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Função para redirecionar após o loading
  const handleLoadingComplete = () => {
    setLocation("/dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#121212] text-white">
      {/* Header de Configuração do Ambiente */}
      <header className="w-full bg-[#1E1E1E] border-b border-yellow-500/20 px-4 py-3 shadow-md z-20">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {availableEnvironments.length > 0 ? (
            <div className="flex items-center gap-2 w-full justify-between">
                <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium text-gray-300">Ambiente:</span>
                    <Select onValueChange={handleEnvironmentSelect} value={selectedEnvName}>
                        <SelectTrigger className="w-[250px] h-8 bg-[#2D2D2D] border-yellow-500/20 text-yellow-500">
                            <SelectValue placeholder="Selecione o ambiente..." />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1E1E1E] border-yellow-500/20 text-white">
                            {availableEnvironments.map((env, index) => (
                                <SelectItem key={index} value={env.NOMEDOAMBIENTE} className="focus:bg-yellow-500/20 focus:text-yellow-500">
                                    {env.NOMEDOAMBIENTE}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                
                 <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 border-yellow-500/30 hover:border-yellow-500 text-gray-300 hover:text-yellow-500 hover:bg-yellow-500/10 text-xs uppercase tracking-wider"
                        onClick={() => setTempEndpoint(selectedEndpoint)}
                      >
                        <Settings className="h-3 w-3 mr-2" />
                        Configurar Conexão
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-[#1E1E1E] border-yellow-500/20 text-white sm:max-w-2xl">
                      <DialogHeader>
                        <DialogTitle className="text-yellow-500 flex items-center gap-2">
                          <Server className="h-5 w-5" />
                          {configViewMode === 'list' ? 'Meus Ambientes' : (editingEnvId ? 'Editar Ambiente' : 'Novo Ambiente')}
                        </DialogTitle>
                        <DialogDescription className="text-gray-400">
                          {configViewMode === 'list' 
                            ? 'Gerencie seus ambientes de conexão.' 
                            : 'Preencha os dados do ambiente TOTVS RM.'}
                        </DialogDescription>
                      </DialogHeader>

                      {configViewMode === 'list' ? (
                        <div className="space-y-4 py-4">
                          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                             {availableEnvironments.length === 0 ? (
                                 <p className="text-sm text-gray-500 text-center py-4">Nenhum ambiente configurado.</p>
                             ) : (
                                 availableEnvironments.map((env, idx) => (
                                     <div key={idx} className="flex items-center justify-between p-3 rounded-md bg-[#2D2D2D] border border-gray-700 hover:border-yellow-500/50 transition-colors">
                                         <div className="overflow-hidden">
                                             <p className="font-medium text-white truncate">{env.NOMEDOAMBIENTE}</p>
                                             <p className="text-xs text-gray-400 truncate">{env.URLWS}</p>
                                         </div>
                                         <div className="flex items-center gap-1">
                                             <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-yellow-500" onClick={() => handleEditEnv(env)}>
                                                 <Pencil className="h-3.5 w-3.5" />
                                             </Button>
                                             <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-red-500" onClick={() => handleDeleteEnv(env._id)}>
                                                 <Trash2 className="h-3.5 w-3.5" />
                                             </Button>
                                         </div>
                                     </div>
                                 ))
                             )}
                          </div>
                          <Button onClick={handleAddNewEnv} className="w-full bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border border-yellow-500/50">
                              <Plus className="h-4 w-4 mr-2" />
                              Adicionar Novo Ambiente
                          </Button>
                        </div>
                      ) : (
                        <Tabs defaultValue="geral" className="w-full">
                          <TabsList className="w-full justify-start h-10 bg-transparent p-0 border-b border-gray-800 mb-4">
                              <TabsTrigger 
                                value="geral"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-yellow-500 data-[state=active]:bg-transparent data-[state=active]:text-yellow-500 text-gray-400 hover:text-gray-200 px-4"
                              >
                                Geral
                              </TabsTrigger>
                              <TabsTrigger 
                                value="ambiente"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-yellow-500 data-[state=active]:bg-transparent data-[state=active]:text-yellow-500 text-gray-400 hover:text-gray-200 px-4"
                              >
                                Ambiente
                              </TabsTrigger>
                              <TabsTrigger 
                                value="movimentos"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-yellow-500 data-[state=active]:bg-transparent data-[state=active]:text-yellow-500 text-gray-400 hover:text-gray-200 px-4"
                              >
                                Parametrização de Movimentos
                              </TabsTrigger>
                              <TabsTrigger 
                                value="modulos"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-yellow-500 data-[state=active]:bg-transparent data-[state=active]:text-yellow-500 text-gray-400 hover:text-gray-200 px-4"
                              >
                                Gestão de Módulos
                              </TabsTrigger>
                          </TabsList>

                          <TabsContent value="geral" className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                            <div className="space-y-2">
                                <Label>Nome do Usuário</Label>
                                <Input 
                                  value={globalContactName} 
                                  onChange={e => setGlobalContactName(e.target.value)} 
                                  placeholder="Seu nome completo" 
                                  className="bg-[#2D2D2D] border-gray-700 text-white" 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input 
                                  value={globalEmail} 
                                  onChange={e => setGlobalEmail(e.target.value)} 
                                  placeholder="seu@email.com" 
                                  className="bg-[#2D2D2D] border-gray-700 text-white" 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Telefone</Label>
                                <Input 
                                  value={globalPhone} 
                                  onChange={e => setGlobalPhone(e.target.value)} 
                                  placeholder="(00) 00000-0000" 
                                  className="bg-[#2D2D2D] border-gray-700 text-white" 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Nome da Empresa</Label>
                                <Input 
                                  value={globalClientName} 
                                  onChange={e => setGlobalClientName(e.target.value)} 
                                  placeholder="Nome da sua empresa" 
                                  className="bg-[#2D2D2D] border-gray-700 text-white" 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Usuário de Acesso</Label>
                                <Input 
                                  value={globalAccessUser} 
                                  disabled
                                  className="bg-[#2D2D2D] border-gray-700 text-gray-400 cursor-not-allowed" 
                                />
                                <span className="text-xs text-gray-500">O usuário de acesso não pode ser alterado aqui.</span>
                            </div>
                            <div className="space-y-2">
                                <Label>Senha</Label>
                                <div className="relative">
                                  <Input 
                                    type={showPassword ? "text" : "password"}
                                    value={newPassword} 
                                    onChange={e => setNewPassword(e.target.value)} 
                                    placeholder="Digite para alterar a senha" 
                                    className="bg-[#2D2D2D] border-gray-700 text-white pr-10" 
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                  >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                  </button>
                                </div>
                            </div>
                          </TabsContent>

                          <TabsContent value="ambiente" className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                            <div className="space-y-2">
                                <Label>Nome do Ambiente</Label>
                                <Input value={envName} onChange={e => setEnvName(e.target.value)} placeholder="Ex: Produção" className="bg-[#2D2D2D] border-gray-700 text-white" />
                            </div>
                            <div className="space-y-2">
                                <Label>URL do WebService</Label>
                                <div className="relative">
                                    <Input value={envUrl} onChange={e => setEnvUrl(e.target.value)} placeholder="http://servidor:8051" className="bg-[#2D2D2D] border-gray-700 text-white pl-9" />
                                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                </div>
                            </div>
                          </TabsContent>

                          <TabsContent value="movimentos" className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                                {/* Solicitação de Compras */}
                                <div className="space-y-2">
                                    <Label>Movimentos de Solicitação de Compras</Label>
                                    <div className="flex gap-2">
                                        <Input 
                                            value={inputSolicitacaoCompras} 
                                            onChange={e => setInputSolicitacaoCompras(e.target.value)} 
                                            onKeyDown={e => handleTagKeyDown(e, inputSolicitacaoCompras, movSolicitacaoCompras, setMovSolicitacaoCompras, setInputSolicitacaoCompras)}
                                            placeholder="Ex: 1.1.01" 
                                            className="bg-[#2D2D2D] border-gray-700 text-white" 
                                        />
                                        <Button type="button" onClick={() => addTag(inputSolicitacaoCompras, movSolicitacaoCompras, setMovSolicitacaoCompras, setInputSolicitacaoCompras)} variant="secondary">
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {movSolicitacaoCompras.map((tag, i) => (
                                            <Badge key={i} variant="secondary" className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border-yellow-500/20 gap-1 pr-1">
                                                {tag}
                                                <div role="button" onClick={() => removeTag(tag, movSolicitacaoCompras, setMovSolicitacaoCompras)} className="cursor-pointer hover:text-red-400">
                                                    <X className="h-3 w-3" />
                                                </div>
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                {/* Ordem de Compra */}
                                <div className="space-y-2">
                                    <Label>Movimentos de Ordem de Compra</Label>
                                    <div className="flex gap-2">
                                        <Input 
                                            value={inputOrdemCompra} 
                                            onChange={e => setInputOrdemCompra(e.target.value)} 
                                            onKeyDown={e => handleTagKeyDown(e, inputOrdemCompra, movOrdemCompra, setMovOrdemCompra, setInputOrdemCompra)}
                                            placeholder="Ex: 1.1.05" 
                                            className="bg-[#2D2D2D] border-gray-700 text-white" 
                                        />
                                        <Button type="button" onClick={() => addTag(inputOrdemCompra, movOrdemCompra, setMovOrdemCompra, setInputOrdemCompra)} variant="secondary">
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {movOrdemCompra.map((tag, i) => (
                                            <Badge key={i} variant="secondary" className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border-yellow-500/20 gap-1 pr-1">
                                                {tag}
                                                <div role="button" onClick={() => removeTag(tag, movOrdemCompra, setMovOrdemCompra)} className="cursor-pointer hover:text-red-400">
                                                    <X className="h-3 w-3" />
                                                </div>
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                {/* Nota Fiscal de Produto */}
                                <div className="space-y-2">
                                    <Label>Movimentos de Nota Fiscal de Produto</Label>
                                    <div className="flex gap-2">
                                        <Input 
                                            value={inputNotaFiscalProduto} 
                                            onChange={e => setInputNotaFiscalProduto(e.target.value)} 
                                            onKeyDown={e => handleTagKeyDown(e, inputNotaFiscalProduto, movNotaFiscalProduto, setMovNotaFiscalProduto, setInputNotaFiscalProduto)}
                                            placeholder="Ex: 1.2.01" 
                                            className="bg-[#2D2D2D] border-gray-700 text-white" 
                                        />
                                        <Button type="button" onClick={() => addTag(inputNotaFiscalProduto, movNotaFiscalProduto, setMovNotaFiscalProduto, setInputNotaFiscalProduto)} variant="secondary">
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {movNotaFiscalProduto.map((tag, i) => (
                                            <Badge key={i} variant="secondary" className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border-yellow-500/20 gap-1 pr-1">
                                                {tag}
                                                <div role="button" onClick={() => removeTag(tag, movNotaFiscalProduto, setMovNotaFiscalProduto)} className="cursor-pointer hover:text-red-400">
                                                    <X className="h-3 w-3" />
                                                </div>
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                {/* Nota Fiscal de Serviço */}
                                <div className="space-y-2">
                                    <Label>Movimentos de Nota Fiscal de Serviço</Label>
                                    <div className="flex gap-2">
                                        <Input 
                                            value={inputNotaFiscalServico} 
                                            onChange={e => setInputNotaFiscalServico(e.target.value)} 
                                            onKeyDown={e => handleTagKeyDown(e, inputNotaFiscalServico, movNotaFiscalServico, setMovNotaFiscalServico, setInputNotaFiscalServico)}
                                            placeholder="Ex: 1.2.02" 
                                            className="bg-[#2D2D2D] border-gray-700 text-white" 
                                        />
                                        <Button type="button" onClick={() => addTag(inputNotaFiscalServico, movNotaFiscalServico, setMovNotaFiscalServico, setInputNotaFiscalServico)} variant="secondary">
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {movNotaFiscalServico.map((tag, i) => (
                                            <Badge key={i} variant="secondary" className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border-yellow-500/20 gap-1 pr-1">
                                                {tag}
                                                <div role="button" onClick={() => removeTag(tag, movNotaFiscalServico, setMovNotaFiscalServico)} className="cursor-pointer hover:text-red-400">
                                                    <X className="h-3 w-3" />
                                                </div>
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                {/* Outras Movimentações */}
                                <div className="space-y-2">
                                    <Label>Outras Movimentações</Label>
                                    <div className="flex gap-2">
                                        <Input 
                                            value={inputOutrasMovimentacoes} 
                                            onChange={e => setInputOutrasMovimentacoes(e.target.value)} 
                                            onKeyDown={e => handleTagKeyDown(e, inputOutrasMovimentacoes, movOutrasMovimentacoes, setMovOutrasMovimentacoes, setInputOutrasMovimentacoes)}
                                            placeholder="Ex: 2.1.01" 
                                            className="bg-[#2D2D2D] border-gray-700 text-white" 
                                        />
                                        <Button type="button" onClick={() => addTag(inputOutrasMovimentacoes, movOutrasMovimentacoes, setMovOutrasMovimentacoes, setInputOutrasMovimentacoes)} variant="secondary">
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {movOutrasMovimentacoes.map((tag, i) => (
                                            <Badge key={i} variant="secondary" className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border-yellow-500/20 gap-1 pr-1">
                                                {tag}
                                                <div role="button" onClick={() => removeTag(tag, movOutrasMovimentacoes, setMovOutrasMovimentacoes)} className="cursor-pointer hover:text-red-400">
                                                    <X className="h-3 w-3" />
                                                </div>
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                          </TabsContent>

                          <TabsContent value="modulos" className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <Label className="text-base font-medium text-yellow-500">Módulos do Sistema</Label>
                                <span className="text-xs text-gray-400">Habilite ou desabilite o acesso aos módulos neste ambiente</span>
                              </div>
                              <div className="grid gap-4 border border-gray-800 rounded-md p-4 bg-[#2D2D2D]/30">
                                {SYSTEM_MODULES.map((module) => (
                                  <div key={module.id} className="flex items-center justify-between space-x-2 border-b border-gray-800 last:border-0 pb-3 last:pb-0">
                                    <Label htmlFor={`module-${module.id}`} className="flex flex-col space-y-1 cursor-pointer flex-1">
                                      <span className="font-medium text-white">{module.label}</span>
                                      <span className="text-xs text-gray-500 font-normal">ID: {module.id}</span>
                                    </Label>
                                    <Switch
                                      id={`module-${module.id}`}
                                      checked={modulesConfig[module.id] ?? true}
                                      onCheckedChange={(checked) => setModulesConfig(prev => ({ ...prev, [module.id]: checked }))}
                                      className="data-[state=checked]:bg-yellow-500"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          </TabsContent>
                        </Tabs>
                      )}

                      <DialogFooter>
                        {configViewMode === 'list' ? (
                            <Button variant="ghost" onClick={() => setShowConfigDialog(false)} className="text-gray-400 hover:text-white hover:bg-white/10">
                                Fechar
                            </Button>
                        ) : (
                            <div className="flex gap-2 w-full justify-end">
                                <Button variant="ghost" onClick={handleCancelEdit} className="text-gray-400 hover:text-white">
                                    Cancelar
                                </Button>
                                <Button onClick={handleSaveEnv} disabled={isSavingEnv} className="bg-yellow-500 text-black hover:bg-yellow-400">
                                    {isSavingEnv ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                    Salvar
                                </Button>
                            </div>
                        )}
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-red-400 hover:text-red-500 hover:bg-red-500/10 ml-1"
                    onClick={handleConfigLogout}
                    title="Sair da Configuração"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
            </div>
        ) : (
             <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2 text-yellow-500">
                    <Globe className="h-4 w-4" />
                    <span className="text-sm font-medium text-gray-300">Ambiente Conectado:</span>
                    <span className="text-sm font-mono text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20 truncate max-w-[200px] sm:max-w-md">
                      {selectedEndpoint || "Não Conectado"}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Dialog open={showConfigLoginDialog} onOpenChange={setShowConfigLoginDialog}>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 text-gray-400 hover:text-yellow-500 hover:bg-yellow-500/10 text-xs uppercase tracking-wider">
                                <User className="h-3 w-3 mr-2" />
                                Login Config
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-[#1E1E1E] border-yellow-500/20 text-white sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle className="text-yellow-500">Login de Configuração</DialogTitle>
                                <DialogDescription className="text-gray-400">Acesse para carregar as configurações do ambiente.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label className="text-gray-300">Usuário</Label>
                                    <Input 
                                        value={configUsername} 
                                        onChange={(e) => setConfigUsername(e.target.value)} 
                                        onKeyDown={handleConfigKeyDown}
                                        className="bg-[#2D2D2D] border-gray-700 text-white"
                                        placeholder="Usuário de configuração"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-gray-300">Senha</Label>
                                    <Input 
                                        type="password" 
                                        value={configPassword} 
                                        onChange={(e) => setConfigPassword(e.target.value)} 
                                        onKeyDown={handleConfigKeyDown}
                                        className="bg-[#2D2D2D] border-gray-700 text-white"
                                        placeholder="Senha"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleConfigLogin} disabled={isConfigLoginLoading} className="bg-yellow-500 text-black hover:bg-yellow-400 w-full">
                                    {isConfigLoginLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                    Carregar Configurações
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                     </Dialog>
                  </div>
             </div>
        )}

            <Dialog open={showDebugDialog} onOpenChange={setShowDebugDialog}>
                <DialogContent className="bg-[#1E1E1E] border-red-500/50 text-white sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-red-500 flex items-center gap-2">
                            <AlertCircle className="h-5 w-5" />
                            Erro de Depuração
                        </DialogTitle>
                        <DialogDescription className="text-gray-400">
                            Detalhes técnicos do erro ocorrido durante o login de configuração.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="bg-black/50 p-4 rounded-md overflow-auto max-h-[300px]">
                        <pre className="text-xs text-red-300 font-mono whitespace-pre-wrap break-all">
                            {debugError}
                        </pre>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setShowDebugDialog(false)} variant="secondary" className="w-full">
                            Fechar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 relative">
        {showLoadingScreen && (
          <LoadingScreen
            duration={5000}
            onComplete={handleLoadingComplete}
            customMessage={verificationMessage}
            progressValue={verificationProgress}
          />
        )}
        
        <div className="max-w-md w-full space-y-8 relative z-10">
          {/* Header with Logo */}
          <div className="text-center">
            <div className="mx-auto h-20 w-20 bg-yellow-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(234,179,8,0.5)]">
              <Box className="text-black text-4xl" size={40} />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">TOTVS RM</h1>
            <p className="text-sm text-gray-400">Entre com suas credenciais para acessar o sistema</p>
          </div>

          {/* Login Form Card */}
          <Card className={`bg-[#1E1E1E] border-t-4 border-t-yellow-500 border-x-0 border-b-0 shadow-2xl transition-opacity duration-500 ${!isEnvironmentConfigured ? 'opacity-50 grayscale' : 'opacity-100'}`}>
            {!isEnvironmentConfigured && (
              <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm rounded-lg">
                <AlertCircle className="h-12 w-12 text-yellow-500 mb-4 animate-bounce" />
                <h3 className="text-xl font-bold text-white mb-2">Ambiente Não Identificado</h3>
                <p className="text-gray-300 text-center max-w-xs mb-6">
                    Por favor, realize o <strong>Login de Configuração</strong> no cabeçalho acima para liberar o acesso.
                </p>
                <Button 
                    variant="outline" 
                    className="border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black"
                    onClick={() => setShowConfigLoginDialog(true)}
                >
                    <User className="mr-2 h-4 w-4" />
                    Fazer Login de Configuração
                </Button>
            </div>
            )}
            <CardContent className={`space-y-6 pt-8 pb-8 px-8 ${!isEnvironmentConfigured ? 'pointer-events-none' : ''}`}>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  {/* Username Field */}
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Usuário</FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <Input
                              {...field}
                              type="text"
                              placeholder="Digite seu usuário"
                              className="bg-[#2D2D2D] border-gray-700 text-white placeholder:text-gray-500 focus:border-yellow-500 focus:ring-yellow-500/20 h-12 pr-10 transition-all"
                              disabled={isLoading}
                              onChange={(e) => {
                                field.onChange(e);
                                clearErrors();
                              }}
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                              <User className="h-5 w-5 text-gray-500 group-focus-within:text-yellow-500 transition-colors" />
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  {/* Password Field */}
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Senha</FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <Input
                              {...field}
                              type={showPassword ? "text" : "password"}
                              placeholder="Digite sua senha"
                              className="bg-[#2D2D2D] border-gray-700 text-white placeholder:text-gray-500 focus:border-yellow-500 focus:ring-yellow-500/20 h-12 pr-10 transition-all"
                              disabled={isLoading}
                              onChange={(e) => {
                                field.onChange(e);
                                clearErrors();
                              }}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute inset-y-0 right-0 px-3 py-0 h-full hover:bg-transparent text-gray-500 hover:text-yellow-500 transition-colors"
                              onClick={() => setShowPassword(!showPassword)}
                              disabled={isLoading}
                            >
                              {showPassword ? (
                                <EyeOff className="h-5 w-5" />
                              ) : (
                                <Eye className="h-5 w-5" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  {/* Service Alias Field */}
                  <FormField
                    control={form.control}
                    name="servicealias"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Alias do Serviço (Opcional)</FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <Input
                              {...field}
                              type="text"
                              placeholder="Digite o alias do serviço"
                              className="bg-[#2D2D2D] border-gray-700 text-white placeholder:text-gray-500 focus:border-yellow-500 focus:ring-yellow-500/20 h-12 pr-10 transition-all"
                              disabled={isLoading}
                              onChange={(e) => {
                                field.onChange(e);
                                clearErrors();
                              }}
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                              <Server className="h-5 w-5 text-gray-500 group-focus-within:text-yellow-500 transition-colors" />
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  {/* Error Message */}
                  {authError && (
                    <Alert variant="destructive" className="bg-red-900/20 border-red-900/50 text-red-200">
                      <AlertCircle className="h-4 w-4 text-red-400" />
                      <AlertDescription className="text-red-200">
                        <div className="space-y-3">
                          <div>
                            <strong>Não foi possível fazer o login</strong>
                            <br />
                            {authError.message}
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                              className="h-auto p-1 text-xs text-red-300 hover:text-red-100 hover:bg-red-900/40"
                            >
                              {showTechnicalDetails ? (
                                <>
                                  <ChevronUp className="h-3 w-3 mr-1" />
                                  Ocultar detalhes técnicos
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="h-3 w-3 mr-1" />
                                  Ver detalhes técnicos
                                </>
                              )}
                            </Button>
                          </div>
                          
                          {showTechnicalDetails && (
                            <div className="bg-black/50 p-2 rounded text-xs font-mono text-red-300 border border-red-900/30">
                              {authError.technicalDetails}
                            </div>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Success Message */}
                  {showSuccess && (
                    <Alert className="bg-green-900/20 border-green-900/50 text-green-200">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <AlertDescription className="text-green-200">
                        <strong>Login Realizado com Sucesso</strong>
                        <br />
                        Redirecionando para o sistema...
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-bold bg-yellow-500 text-black hover:bg-yellow-400 transition-all shadow-lg hover:shadow-yellow-500/20"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Autenticando...
                      </>
                    ) : (
                      "ENTRAR"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* System Info */}
          <div className="text-center text-xs text-gray-500 space-y-4">
            {/* Copyright */}
            <p>© 2024 TOTVS S.A. Todos os direitos reservados.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
