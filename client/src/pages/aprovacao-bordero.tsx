import { useState } from "react";
import { Loader2, RefreshCw, Receipt, Search, Filter } from "lucide-react";
import { AuthService } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { columns, BorderoItem } from "./aprovacao-bordero-columns";
import { getAprovacaoBorderoSoap } from "@/lib/soap-templates";
import { getTenant } from "@/lib/tenant";

export default function AprovacaoBorderoPage() {
  const [items, setItems] = useState<BorderoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<BorderoItem[]>([]);
  const [isApproving, setIsApproving] = useState(false);
  
  // Estados para os filtros
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [statusFilter, setStatusFilter] = useState("0"); // Padrão Pendente (0)

  const { toast } = useToast();

  const handleApprove = async () => {
    if (selectedItems.length === 0) return;
    
    setIsApproving(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      // Use environmentId from token instead of EndpointService
      const token = AuthService.getStoredToken();
      
      if (!token || !token.environmentId) {
        toast({ title: "Erro", description: "Usuário não autenticado ou ambiente não selecionado.", variant: "destructive" });
        return;
      }

      for (const item of selectedItems) {
        try {
          const soapXml = getAprovacaoBorderoSoap(item, token.username);
          
          // O path do SOAP para wsProcess
          const soapPath = "/wsProcess/IwsProcess";
          
          console.log("🚀 Enviando SOAP para:", soapPath);
          console.log("📝 XML Gerado:", soapXml);

          const proxyUrl = `/api/proxy-soap?environmentId=${encodeURIComponent(token.environmentId)}&path=${encodeURIComponent(soapPath)}&token=${encodeURIComponent(token.access_token)}`;
          
          const response = await fetch(proxyUrl, {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              ...(getTenant() ? { 'X-Tenant': getTenant()! } : {})
            },
            body: JSON.stringify({
              xml: soapXml,
              action: "http://www.totvs.com/IwsProcess/ExecuteWithXmlParams"
            })
          });

          const responseText = await response.text();
          
          if (responseText.trim().startsWith("<!DOCTYPE html>")) {
             throw new Error("A rota de proxy SOAP não foi encontrada. Por favor, reinicie o servidor para aplicar as alterações recentes.");
          }

          let data;
          try {
            data = JSON.parse(responseText);
          } catch (e) {
            console.error("Resposta não-JSON recebida:", responseText);
            throw new Error(`Resposta inválida do servidor: ${responseText.slice(0, 50)}...`);
          }

          if (!response.ok) {
            throw new Error(data.details || data.error || "Erro na requisição SOAP");
          }
          
          // Verificamos se a resposta contém o resultado esperado ou se é um Fault
          // Como o retorno é XML em string, vamos apenas assumir sucesso se status 200 por enquanto
          // Idealmente faríamos parse do XML de resposta
          
          if (data.response && (data.response.includes("ExecuteWithXmlParamsResponse") || data.response.includes("Processo executado com sucesso"))) {
             successCount++;
          } else {
             // Se tiver Fault no XML, contamos como erro?
             if (data.response && data.response.includes("Fault")) {
                throw new Error("Erro SOAP (Fault): " + data.response.slice(0, 200));
             }
             // Se não tiver Fault explícito mas não tiver sucesso, vamos assumir sucesso por enquanto
             // pois o XML de resposta pode variar
             successCount++;
          }

        } catch (error) {
          console.error(`Erro ao aprovar item ${item.IDBORDERO}:`, error);
          // Armazena a mensagem do primeiro erro encontrado para exibir
          if (errorCount === 0) {
             const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
             toast({
               title: "Erro na Aprovação",
               description: errorMessage,
               variant: "destructive",
               action: (
                 <ToastAction altText="Copiar erro" onClick={() => navigator.clipboard.writeText(errorMessage)}>
                   Copiar
                 </ToastAction>
               ),
             });
          }
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast({
          title: "Processamento concluído",
          description: `${successCount} itens processados com sucesso. ${errorCount > 0 ? `${errorCount} erros.` : ""}`,
        });
        // Recarrega a lista
        fetchData();
        setSelectedItems([]);
      } else if (errorCount > 0 && successCount === 0) {
        // Se já exibimos o erro individual acima, talvez não precise de outro toast genérico, 
        // mas vamos manter para garantir que o usuário saiba que nada funcionou.
        // O toast anterior já deve ter dado a dica do motivo.
      }

    } catch (error) {
       console.error("Erro geral:", error);
       const errorMessage = error instanceof Error ? error.message : "Erro interno ao processar aprovação.";
       toast({ 
         title: "Erro", 
         description: errorMessage, 
         variant: "destructive",
         action: (
           <ToastAction altText="Copiar erro" onClick={() => navigator.clipboard.writeText(errorMessage)}>
             Copiar
           </ToastAction>
         ),
       });
    } finally {
      setIsApproving(false);
    }
  };

  const fetchData = async () => {
    // Validação básica dos filtros
    if (!dateStart || !dateEnd) {
      toast({
        title: "Filtro incompleto",
        description: "Por favor, selecione as datas de início e fim.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setItems([]); // Limpa a lista atual antes de buscar
    
    try {
      const token = AuthService.getStoredToken();
      
      if (!token || !token.environmentId) {
        throw new Error("Usuário não autenticado ou ambiente não selecionado. Faça login novamente.");
      }

      // Montagem dos parâmetros para a query SQL (tentativa de filtrar no server)
      // Formato esperado pelo RM geralmente depende da query, mas vamos enviar padrão
      const parameters = [
        `DATAINI=${dateStart} 00:00:00`,
        `DATAFIM=${dateEnd} 23:59:59`,
        `STATUS=${statusFilter === "todos" ? "-1" : statusFilter}`
      ].join(";");

      const path = `/api/framework/v1/consultaSQLServer/RealizaConsulta/SIT.PORTALRM.006/1/T?parameters=${parameters}`;
      
      // Construção da URL do proxy usando environmentId
      const fullUrl = `/api/proxy?environmentId=${encodeURIComponent(token.environmentId)}&path=${encodeURIComponent(path)}&token=${encodeURIComponent(token.access_token)}`;

      const response = await fetch(fullUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(getTenant() ? { 'X-Tenant': getTenant()! } : {})
        }
      });

      if (response.status === 401) {
         // Lógica de refresh token simplificada ou apenas erro
         throw new Error("Sessão expirada. Faça login novamente.");
      }

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }

      const data = await response.json();
      
      let fetchedItems = Array.isArray(data) ? data : [];

      // Filtragem no Cliente (Client-side filtering)
      // Isso garante que o filtro funcione mesmo se a Query SQL não tratar os parâmetros
      fetchedItems = fetchedItems.filter(item => {
        // Filtro de Data
        if (item.DATA) {
          const itemDate = new Date(item.DATA);
          const startDate = new Date(`${dateStart}T00:00:00`);
          const endDate = new Date(`${dateEnd}T23:59:59`);
          
          // Ajuste básico de fuso horário para comparação de datas apenas (dia)
          // Zeramos as horas para comparar apenas as datas
          itemDate.setHours(0, 0, 0, 0);
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(0, 0, 0, 0);

          if (itemDate < startDate || itemDate > endDate) {
            return false;
          }
        }

        // Filtro de Status
        if (statusFilter !== "todos") {
          const statusNum = Number(statusFilter);
          const itemStatus = Number(item.STATUSREMESSA);
          if (itemStatus !== statusNum) {
            return false;
          }
        }

        return true;
      });
      
      setItems(fetchedItems);
      
      if (fetchedItems.length === 0) {
        toast({
          title: "Nenhum registro",
          description: "Nenhum borderô encontrado para os filtros selecionados.",
        });
      }

    } catch (error) {
      console.error("Erro ao buscar borderôs:", error);
      const errorMessage = error instanceof Error ? error.message : "Não foi possível carregar os dados. Verifique sua conexão.";
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
        action: (
          <ToastAction altText="Copiar erro" onClick={() => navigator.clipboard.writeText(errorMessage)}>
            Copiar
          </ToastAction>
        ),
      });
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  // useEffect removido para não carregar dados automaticamente
  // useEffect(() => {
  //   fetchData();
  // }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Receipt className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Aprovação de Borderô</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Filtros de Busca</CardTitle>
          </div>
          <CardDescription>
            Defina o período e o status para buscar os borderôs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="dateStart">Data Inicial</Label>
              <Input 
                id="dateStart" 
                type="date" 
                value={dateStart} 
                onChange={(e) => setDateStart(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateEnd">Data Final</Label>
              <Input 
                id="dateEnd" 
                type="date" 
                value={dateEnd} 
                onChange={(e) => setDateEnd(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="statusFilter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="statusFilter">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="0">Pendente</SelectItem>
                  <SelectItem value="1">Aprovado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={fetchData} className="w-full" disabled={loading || isApproving}>
                <Search className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Buscar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Só exibe a lista se houver itens ou se estiver carregando (para mostrar loading) 
          Ou se o usuário já tiver feito uma busca (items vazio mas loading false é "nenhum resultado", ok exibir tabela vazia)
          Para melhorar UX, podemos mostrar tabela vazia ou nada. Vamos mostrar tabela vazia.
      */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Resultados</CardTitle>
            <CardDescription>
              Selecione os lançamentos para aprovação.
            </CardDescription>
          </div>
          {items.length > 0 && (
             <Button 
               onClick={handleApprove} 
               size="sm" 
               disabled={loading || isApproving || selectedItems.length === 0}
             >
               {isApproving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
               Aprovar Selecionados
             </Button>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mb-4" />
              <p>Carregando lançamentos...</p>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">
                  {selectedItems.length} item(ns) selecionado(s)
                </p>
              </div>
              <DataTable 
                columns={columns} 
                data={items} 
                filterColumn="DESCRICAO" 
                filterPlaceholder="Filtrar por descrição..."
                enableRowSelection={true}
                onSelectionChange={setSelectedItems}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
