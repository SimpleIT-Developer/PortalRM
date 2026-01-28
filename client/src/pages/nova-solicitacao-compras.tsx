import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { AuthService } from "@/lib/auth";
import { getTenant } from "@/lib/tenant";
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Save, 
  Calculator,
  Package,
  Building,
  Calendar,
  DollarSign,
  User,
  Loader2,
  Check,
  ChevronsUpDown
} from "lucide-react";

// Interface para coligada
interface Coligada {
  CODCOLIGADA: string;
  NOMEFANTASIA: string;
  CGC?: string;
  NOME?: string;
  ATIVO: string;
}

// Interface para filial
interface Filial {
  CODCOLIGADA: string;
  CODFILIAL: string;
  NOMEFANTASIA: string;
  CGC?: string;
  NOME?: string;
  ATIVO: number;
}

// Interface para fornecedor
interface Fornecedor {
  NOME: string;
  [key: string]: any; // Para outros campos que possam vir da API
}

interface MovementData {
  companyId: string;
  branchId: string;
  movementTypeCode: string;
  series: string;
  warehouseCode: string;
  customerVendorCode: string;
  costCenterCode: string;
  date: string;
  entryDate: string;
  registerDate: string;
  processingDate: string;
  exitDate: string;
  extraDate1: string;
  extraDate2: string;
  creationDate: string;
  netValueCurrencyCode: string;
  grossValue: number;
  internalGrossValue: number;
  netValue: number;
  status: string;
  userCode: string;
}

interface MovementItem {
  id: string;
  companyId: string;
  branchId: string;
  sequentialId: number;
  productId: string;
  quantity: number;
  costCenterCode: string;
  budgetNatureCompanyId: string;
  budgetNatureCode: string;
  unitPrice: number;
  costCenterApportionments: {
    companyId: string;
    movementItemSequentialId: number;
    costCenterCode: string;
    value: number;
  };
}

export default function NovaSolicitacaoCompras() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Estado para coligadas
  const [coligadas, setColigadas] = useState<Coligada[]>([]);
  const [loadingColigadas, setLoadingColigadas] = useState(false);

  // Estado para filiais
  const [filiais, setFiliais] = useState<Filial[]>([]);
  const [loadingFiliais, setLoadingFiliais] = useState(false);

  // Estado para fornecedores
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loadingFornecedores, setLoadingFornecedores] = useState(false);
  const [filteredFornecedores, setFilteredFornecedores] = useState<Fornecedor[]>([]);
  const [fornecedorFilter, setFornecedorFilter] = useState("");
  const [selectedFornecedor, setSelectedFornecedor] = useState<Fornecedor | null>(null);
  const [fornecedorPopoverOpen, setFornecedorPopoverOpen] = useState(false);

  // Estado para dados do movimento
  const [movementData, setMovementData] = useState<MovementData>({
    companyId: "",
    branchId: "",
    movementTypeCode: "1.1.80",
    series: "",
    warehouseCode: "01",
    customerVendorCode: "",
    costCenterCode: "",
    date: new Date().toISOString().split('T')[0],
    entryDate: new Date().toISOString().split('T')[0],
    registerDate: new Date().toISOString().split('T')[0],
    processingDate: new Date().toISOString().split('T')[0],
    exitDate: new Date().toISOString().split('T')[0],
    extraDate1: new Date().toISOString().split('T')[0],
    extraDate2: new Date().toISOString().split('T')[0],
    creationDate: new Date().toISOString().split('T')[0],
    netValueCurrencyCode: "R$",
    grossValue: 0,
    internalGrossValue: 0,
    netValue: 0,
    status: "A",
    userCode: "srvintegracaormfluig"
  });

  // Estado para itens do movimento
  const [movementItems, setMovementItems] = useState<MovementItem[]>([
    {
      id: "1",
      companyId: "",
      branchId: "",
      sequentialId: 1,
      productId: "",
      quantity: 1,
      costCenterCode: "",
      budgetNatureCompanyId: "",
      budgetNatureCode: "",
      unitPrice: 0,
      costCenterApportionments: {
        companyId: "",
        movementItemSequentialId: 1,
        costCenterCode: "",
        value: 0
      }
    }
  ]);

  // Função para buscar coligadas
  const fetchColigadas = async () => {
    setLoadingColigadas(true);
    try {
      const token = AuthService.getStoredToken();
      if (!token) {
        throw new Error("Usuário não autenticado. Faça login novamente.");
      }

      if (!token.access_token) {
        throw new Error("Token de acesso inválido. Faça login novamente.");
      }

      console.log("Buscando coligadas com token do usuário logado...");
      const response = await fetch("/api/coligadas", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token.access_token}`,
          "Content-Type": "application/json",
          ...(getTenant() ? { 'X-Tenant': getTenant()! } : {})
        }
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Erro na resposta:", errorText);
        throw new Error(`Erro ao buscar coligadas: ${response.status} - ${errorText}`);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const responseText = await response.text();
        console.error("Resposta não é JSON:", responseText);
        throw new Error("Resposta da API não é JSON válido");
      }

      const data = await response.json();
      console.log("Dados recebidos:", data);
      
      // Verificar se os dados têm a estrutura esperada
      if (Array.isArray(data)) {
        setColigadas(data);
      } else if (data && Array.isArray(data.data)) {
        setColigadas(data.data);
      } else {
        console.warn("Estrutura de dados inesperada:", data);
        setColigadas([]);
      }
    } catch (error) {
      console.error("Erro ao buscar coligadas:", error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao carregar lista de coligadas. Tente novamente.",
        variant: "destructive",
      });
      setColigadas([]);
    } finally {
      setLoadingColigadas(false);
    }
  };

  // Função para buscar filiais por coligada
  const fetchFiliais = async (codColigada: string) => {
    if (!codColigada) {
      setFiliais([]);
      return;
    }

    setLoadingFiliais(true);
    try {
      const token = AuthService.getStoredToken();
      if (!token) {
        throw new Error("Usuário não autenticado. Faça login novamente.");
      }

      if (!token.access_token) {
        throw new Error("Token de acesso inválido. Faça login novamente.");
      }

      console.log(`Buscando filiais para coligada ${codColigada}...`);
      const response = await fetch(`/api/filiais/${codColigada}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token.access_token}`,
          "Content-Type": "application/json",
          ...(getTenant() ? { 'X-Tenant': getTenant()! } : {})
        }
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Erro na resposta:", errorText);
        throw new Error(`Erro ao buscar filiais: ${response.status} - ${errorText}`);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const responseText = await response.text();
        console.error("Resposta não é JSON:", responseText);
        throw new Error("Resposta da API não é JSON válido");
      }

      const data = await response.json();
      console.log("Filiais recebidas:", data);
      
      // Verificar se os dados têm a estrutura esperada
      if (Array.isArray(data)) {
        setFiliais(data);
      } else if (data && Array.isArray(data.data)) {
        setFiliais(data.data);
      } else {
        console.warn("Estrutura de dados inesperada:", data);
        setFiliais([]);
      }
    } catch (error) {
      console.error("Erro ao buscar filiais:", error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao carregar lista de filiais. Tente novamente.",
        variant: "destructive",
      });
      setFiliais([]);
    } finally {
      setLoadingFiliais(false);
    }
  };

  // Função para buscar fornecedores por coligada
  const fetchFornecedores = async (codColigada: string) => {
    if (!codColigada) {
      setFornecedores([]);
      setFilteredFornecedores([]);
      return;
    }

    setLoadingFornecedores(true);
    try {
      const token = AuthService.getStoredToken();
      if (!token) {
        throw new Error("Usuário não autenticado. Faça login novamente.");
      }

      if (!token.access_token) {
        throw new Error("Token de acesso inválido. Faça login novamente.");
      }

      console.log(`Buscando fornecedores para coligada ${codColigada}...`);
      const response = await fetch(`/api/fornecedores/${codColigada}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token.access_token}`,
          "Content-Type": "application/json",
          ...(getTenant() ? { 'X-Tenant': getTenant()! } : {})
        }
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Erro na resposta:", errorText);
        throw new Error(`Erro ao buscar fornecedores: ${response.status} - ${errorText}`);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const responseText = await response.text();
        console.error("Resposta não é JSON:", responseText);
        throw new Error("Resposta da API não é JSON válido");
      }

      const data = await response.json();
      console.log("Fornecedores recebidos:", data);
      
      // Verificar se os dados têm a estrutura esperada
      let fornecedoresList: Fornecedor[] = [];
      if (Array.isArray(data)) {
        fornecedoresList = data;
      } else if (data && Array.isArray(data.data)) {
        fornecedoresList = data.data;
      } else {
        console.warn("Estrutura de dados inesperada:", data);
        fornecedoresList = [];
      }
      
      setFornecedores(fornecedoresList);
      setFilteredFornecedores(fornecedoresList);
    } catch (error) {
      console.error("Erro ao buscar fornecedores:", error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao carregar lista de fornecedores. Tente novamente.",
        variant: "destructive",
      });
      setFornecedores([]);
      setFilteredFornecedores([]);
    } finally {
      setLoadingFornecedores(false);
    }
  };

  // Função para filtrar fornecedores
  const filterFornecedores = (searchTerm: string) => {
    setFornecedorFilter(searchTerm);
    if (!searchTerm.trim()) {
      setFilteredFornecedores(fornecedores);
    } else {
      const filtered = fornecedores.filter(fornecedor =>
        fornecedor.NOME.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredFornecedores(filtered);
    }
  };

  // Carregar coligadas ao montar o componente
  useEffect(() => {
    fetchColigadas();
  }, []);

  // Função para adicionar novo item
  const addMovementItem = () => {
    const newItem: MovementItem = {
      id: Date.now().toString(),
      companyId: movementData.companyId,
      branchId: movementData.branchId,
      sequentialId: movementItems.length + 1,
      productId: "",
      quantity: 1,
      costCenterCode: "",
      budgetNatureCompanyId: "",
      budgetNatureCode: "",
      unitPrice: 0,
      costCenterApportionments: {
        companyId: movementData.companyId,
        movementItemSequentialId: movementItems.length + 1,
        costCenterCode: "",
        value: 0
      }
    };
    setMovementItems([...movementItems, newItem]);
  };

  // Função para remover item
  const removeMovementItem = (id: string) => {
    if (movementItems.length > 1) {
      setMovementItems(movementItems.filter(item => item.id !== id));
    }
  };

  // Função para atualizar item
  const updateMovementItem = (id: string, field: keyof MovementItem, value: any) => {
    setMovementItems(movementItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  // Função para calcular valor total
  const calculateTotalValue = () => {
    return movementItems.reduce((total, item) => total + (item.quantity * item.unitPrice), 0);
  };

  // Função para submeter o formulário
  const handleSubmit = async () => {
    setIsLoading(true);
    
    try {
      // Preparar dados da requisição conforme estrutura fornecida
      const requestParams = {
        companyId: parseInt(movementData.companyId),
        branchId: parseInt(movementData.branchId),
        movementTypeCode: movementData.movementTypeCode,
        series: movementData.series,
        warehouseCode: movementData.warehouseCode,
        customerVendorCode: movementData.customerVendorCode,
        costCenterCode: movementData.costCenterCode,
        date: movementData.date,
        entryDate: movementData.entryDate,
        registerDate: movementData.registerDate,
        processingDate: movementData.processingDate,
        exitDate: movementData.exitDate,
        extraDate1: movementData.extraDate1,
        extraDate2: movementData.extraDate2,
        creationDate: movementData.creationDate,
        netValueCurrencyCode: movementData.netValueCurrencyCode,
        grossValue: calculateTotalValue(),
        internalGrossValue: calculateTotalValue(),
        netValue: calculateTotalValue(),
        status: movementData.status,
        userCode: movementData.userCode,
        movementItems: movementItems.map(item => ({
          companyId: parseInt(item.companyId),
          branchId: parseInt(item.branchId),
          sequentialId: item.sequentialId,
          productId: parseInt(item.productId),
          quantity: item.quantity,
          costCenterCode: item.costCenterCode,
          budgetNatureCompanyId: parseInt(item.budgetNatureCompanyId),
          budgetNatureCode: item.budgetNatureCode,
          unitPrice: parseFloat(item.unitPrice.toString()),
          costCenterApportionments: {
            companyId: parseInt(item.costCenterApportionments.companyId),
            movementItemSequentialId: item.costCenterApportionments.movementItemSequentialId,
            costCenterCode: item.costCenterApportionments.costCenterCode,
            value: parseFloat(item.costCenterApportionments.value.toString())
          }
        }))
      };

      console.log("Dados da requisição:", requestParams);
      
      // Aqui você faria a chamada para a API
      // await apiCall(requestParams);
      
      toast({
        title: "Sucesso!",
        description: "Solicitação de compras criada com sucesso.",
      });
      
      // Redirecionar de volta para a lista
      setLocation("/dashboard/solicitacao-compras");
      
    } catch (error) {
      console.error("Erro ao criar solicitação:", error);
      toast({
        title: "Erro",
        description: "Erro ao criar solicitação de compras. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setLocation("/dashboard/solicitacao-compras")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Nova Solicitação de Compras</h1>
            <p className="text-muted-foreground">
              Preencha os dados do movimento e itens para criar uma nova solicitação
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Calculator className="h-3 w-3" />
            Total: R$ {calculateTotalValue().toFixed(2)}
          </Badge>
        </div>
      </div>

      {/* Dados do Movimento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Dados do Movimento
          </CardTitle>
          <CardDescription>
            Informações gerais da solicitação de compras
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyId">Código da Coligada *</Label>
              <Select
                value={movementData.companyId}
                onValueChange={(value) => {
                  setMovementData({...movementData, companyId: value, branchId: ""});
                  fetchFiliais(value);
                  fetchFornecedores(value);
                  setSelectedFornecedor(null);
                  setFornecedorFilter("");
                  setFornecedorPopoverOpen(false);
                }}
                disabled={loadingColigadas}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    loadingColigadas 
                      ? "Carregando..." 
                      : coligadas.length === 0 
                        ? "Nenhuma coligada encontrada"
                        : "Selecione uma coligada"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {coligadas.length > 0 && coligadas.map((coligada) => (
                    <SelectItem key={coligada.CODCOLIGADA} value={coligada.CODCOLIGADA}>
                      <div className="flex items-center justify-between w-full">
                        <span>{coligada.CODCOLIGADA} - {coligada.NOMEFANTASIA}</span>
                        <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                          coligada.ATIVO === "T" 
                            ? "bg-green-100 text-green-800" 
                            : "bg-red-100 text-red-800"
                        }`}>
                          {coligada.ATIVO === "T" ? "Ativa" : "Inativa"}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="branchId">Código da Filial *</Label>
              <Select
                value={movementData.branchId}
                onValueChange={(value) => setMovementData({...movementData, branchId: value})}
                disabled={loadingFiliais || !movementData.companyId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    !movementData.companyId
                      ? "Selecione uma coligada primeiro"
                      : loadingFiliais 
                        ? "Carregando filiais..." 
                        : filiais.length === 0 
                          ? "Nenhuma filial encontrada"
                          : "Selecione uma filial"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {filiais.length > 0 && filiais.map((filial) => (
                    <SelectItem key={filial.CODFILIAL} value={filial.CODFILIAL}>
                      <div className="flex items-center justify-between w-full">
                        <span>{filial.CODFILIAL} - {filial.NOMEFANTASIA}</span>
                        <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                          filial.ATIVO === 1 
                            ? "bg-green-100 text-green-800" 
                            : "bg-red-100 text-red-800"
                        }`}>
                          {filial.ATIVO === 1 ? "Ativa" : "Inativa"}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="series">Série *</Label>
              <Input
                id="series"
                value={movementData.series}
                onChange={(e) => setMovementData({...movementData, series: e.target.value})}
                placeholder="Ex: UNI"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fornecedor">Fornecedor *</Label>
              <Popover open={fornecedorPopoverOpen} onOpenChange={setFornecedorPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={fornecedorPopoverOpen}
                    className="w-full justify-between"
                    disabled={!movementData.companyId || loadingFornecedores}
                  >
                    {loadingFornecedores ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Carregando...
                      </div>
                    ) : selectedFornecedor ? (
                      selectedFornecedor.NOME
                    ) : !movementData.companyId ? (
                      "Selecione uma coligada primeiro"
                    ) : fornecedores.length === 0 ? (
                      "Nenhum fornecedor encontrado"
                    ) : (
                      "Selecione um fornecedor"
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput 
                      placeholder="Buscar fornecedor..." 
                      value={fornecedorFilter}
                      onValueChange={filterFornecedores}
                    />
                    <CommandList>
                      <CommandEmpty>Nenhum fornecedor encontrado.</CommandEmpty>
                      <CommandGroup>
                        {filteredFornecedores.map((fornecedor, index) => (
                          <CommandItem
                            key={index}
                            value={fornecedor.NOME}
                            onSelect={() => {
                              setSelectedFornecedor(fornecedor);
                              setMovementData({...movementData, customerVendorCode: fornecedor.NOME});
                              setFornecedorPopoverOpen(false);
                            }}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${
                                selectedFornecedor?.NOME === fornecedor.NOME ? "opacity-100" : "opacity-0"
                              }`}
                            />
                            {fornecedor.NOME}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="costCenterCode">Centro de Custo *</Label>
              <Input
                id="costCenterCode"
                value={movementData.costCenterCode}
                onChange={(e) => setMovementData({...movementData, costCenterCode: e.target.value})}
                placeholder="Ex: 001"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Data do Movimento *</Label>
              <Input
                id="date"
                type="date"
                value={movementData.date}
                onChange={(e) => setMovementData({...movementData, date: e.target.value})}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Itens do Movimento */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Itens do Movimento
              </CardTitle>
              <CardDescription>
                Adicione os produtos/serviços da solicitação
              </CardDescription>
            </div>
            <Button onClick={addMovementItem} size="sm" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Item
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {movementItems.map((item, index) => (
            <div key={item.id} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Item {index + 1}</h4>
                {movementItems.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeMovementItem(item.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>ID do Produto *</Label>
                  <Input
                    value={item.productId}
                    onChange={(e) => updateMovementItem(item.id, 'productId', e.target.value)}
                    placeholder="Ex: 12345"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Quantidade *</Label>
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateMovementItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                    placeholder="Ex: 1"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Preço Unitário *</Label>
                  <Input
                    type="number"
                    value={item.unitPrice}
                    onChange={(e) => updateMovementItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                    placeholder="Ex: 100.00"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Centro de Custo *</Label>
                  <Input
                    value={item.costCenterCode}
                    onChange={(e) => updateMovementItem(item.id, 'costCenterCode', e.target.value)}
                    placeholder="Ex: 001"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Código Coligada Natureza Orçamentária *</Label>
                  <Input
                    value={item.budgetNatureCompanyId}
                    onChange={(e) => updateMovementItem(item.id, 'budgetNatureCompanyId', e.target.value)}
                    placeholder="Ex: 1"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Código Natureza Orçamentária *</Label>
                  <Input
                    value={item.budgetNatureCode}
                    onChange={(e) => updateMovementItem(item.id, 'budgetNatureCode', e.target.value)}
                    placeholder="Ex: 001"
                  />
                </div>
              </div>

              <Separator />

              <div className="bg-muted/50 p-3 rounded-lg">
                <h5 className="font-medium mb-3">Rateio de Centro de Custo</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Centro de Custo do Rateio</Label>
                    <Input
                      value={item.costCenterApportionments.costCenterCode}
                      onChange={(e) => updateMovementItem(item.id, 'costCenterApportionments', {
                        ...item.costCenterApportionments,
                        costCenterCode: e.target.value
                      })}
                      placeholder="Ex: 001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Valor do Rateio</Label>
                    <Input
                      type="number"
                      value={item.costCenterApportionments.value}
                      onChange={(e) => updateMovementItem(item.id, 'costCenterApportionments', {
                        ...item.costCenterApportionments,
                        value: parseFloat(e.target.value) || 0
                      })}
                      placeholder="Ex: 100.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Badge variant="outline" className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  Subtotal: R$ {(item.quantity * item.unitPrice).toFixed(2)}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Ações */}
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          onClick={() => setLocation("/dashboard/solicitacao-compras")}
        >
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {isLoading ? "Salvando..." : "Salvar Solicitação"}
        </Button>
      </div>
    </div>
  );
}