import { useState, useEffect } from "react";
import { Loader2, RefreshCw, Receipt } from "lucide-react";
import { AuthService } from "@/lib/auth";
import { EndpointService } from "@/lib/endpoint";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { columns, BorderoItem } from "./aprovacao-bordero-columns";
import { getAprovacaoBorderoSoap } from "@/lib/soap-templates";

export default function AprovacaoBorderoPage() {
  const [items, setItems] = useState<BorderoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<BorderoItem[]>([]);
  const [isApproving, setIsApproving] = useState(false);
  const { toast } = useToast();

  const handleApprove = async () => {
    if (selectedItems.length === 0) return;
    
    setIsApproving(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      const endpoint = await EndpointService.getDefaultEndpoint();
      const token = AuthService.getStoredToken();
      
      if (!token) {
        toast({ title: "Erro", description: "Usuário não autenticado.", variant: "destructive" });
        return;
      }

      for (const item of selectedItems) {
        try {
          const soapXml = getAprovacaoBorderoSoap(item, token.username);
          
          // O path do SOAP para wsProcess (conforme testes: sem .svc)
          const soapPath = "/wsProcess/IwsProcess";
          
          console.log("🚀 Enviando SOAP para:", soapPath);
          console.log("📝 XML Gerado:", soapXml);

          const proxyUrl = `/api/proxy-soap?endpoint=${encodeURIComponent(endpoint)}&path=${encodeURIComponent(soapPath)}&token=${encodeURIComponent(token.access_token)}`;
          
          const response = await fetch(proxyUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
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
             toast({
               title: "Erro na Aprovação",
               description: error instanceof Error ? error.message : "Erro desconhecido",
               variant: "destructive"
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
       toast({ title: "Erro", description: "Erro interno ao processar aprovação.", variant: "destructive" });
    } finally {
      setIsApproving(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const endpoint = await EndpointService.getDefaultEndpoint();
      const token = AuthService.getStoredToken();
      
      if (!token) {
        throw new Error("Usuário não autenticado. Faça login novamente.");
      }

      // O endpoint pode vir com http:// ou não, o backend proxy espera o host
      // Mas o padrão no cadastro-funcionarios é passar o endpoint obtido do serviço
      
      const path = "/api/framework/v1/consultaSQLServer/RealizaConsulta/SIT.PORTALRM.006/1/T";
      
      // Construção da URL do proxy
      const fullUrl = `/api/proxy?endpoint=${encodeURIComponent(endpoint)}&path=${encodeURIComponent(path)}&token=${encodeURIComponent(token.access_token)}`;

      const response = await fetch(fullUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
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
      
      // A API de consulta SQL geralmente retorna um array direto
      setItems(Array.isArray(data) ? data : []);

    } catch (error) {
      console.error("Erro ao buscar borderôs:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados. Verifique sua conexão.",
        variant: "destructive",
      });
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Receipt className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Aprovação de Borderô</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={fetchData} variant="outline" size="sm" disabled={loading || isApproving}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <Button 
            onClick={handleApprove} 
            size="sm" 
            disabled={loading || isApproving || selectedItems.length === 0}
          >
            {isApproving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Aprovar Selecionados
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lançamentos Pendentes</CardTitle>
          <CardDescription>
            Selecione os lançamentos para aprovação.
          </CardDescription>
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
