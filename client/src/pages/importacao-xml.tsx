import { useState, useEffect, useMemo, useCallback } from "react";
import { Loader2, RefreshCw, FileText, ArrowUpDown, Eye, List, ShoppingCart, FileCode, Play, Link as LinkIcon, Check, X, ArrowRight, Search } from "lucide-react";
import { AuthService } from "@/lib/auth";
import { EndpointService } from "@/lib/endpoint";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { getRecebimentoXmlSoap, getFaturamentoMovimentoSoap, getReadRecordMovDocNfeEntradaSoap, getSaveRecordMovDocNfeEntradaSoap } from "@/lib/soap-templates";
import { cn } from "@/lib/utils";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";

export interface XmlItem {
  CODCOLIGADA: number;
  ID: number;
  CODFILIAL: number;
  CODCOLCFO: number;
  CODCFO: string;
  NOMEFANTASIA: string;
  CHAVEACESSO: string;
  DATAEMISSAO: string;
  NUMERO: string;
  DATAAUTORIZACAO: string;
  DATAATUALIZACAO: string;
  STATUS: string;
  XML: string;
  RECCREATEDBY: string;
  RECCREATEDON: string;
  RECMODIFIEDBY: string;
  RECMODIFIEDON: string;
  TIPOXML: number;
  IDMOV?: number;
  [key: string]: any;
}

const parseNfeItems = (xmlContent: string) => {
  if (!xmlContent) return [];
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
    const dets = xmlDoc.getElementsByTagName("det");
    const parsedItems = [];
    for (let i = 0; i < dets.length; i++) {
      const prod = dets[i].getElementsByTagName("prod")[0];
      const nItem = dets[i].getAttribute("nItem") || (i + 1).toString();
      if (prod) {
        parsedItems.push({
          nItem: nItem,
          cProd: prod.getElementsByTagName("cProd")[0]?.textContent || "",
          xProd: prod.getElementsByTagName("xProd")[0]?.textContent || "",
          qCom: parseFloat(prod.getElementsByTagName("qCom")[0]?.textContent || "0"),
          uCom: prod.getElementsByTagName("uCom")[0]?.textContent || "",
          vUnCom: parseFloat(prod.getElementsByTagName("vUnCom")[0]?.textContent || "0"),
          vProd: parseFloat(prod.getElementsByTagName("vProd")[0]?.textContent || "0"),
        });
      }
    }
    return parsedItems;
  } catch (e) {
    console.error("Error parsing XML", e);
    return [];
  }
};

interface PurchaseOrderLineItem {
  CODCOLIGADA: number;
  IDMOV: number;
  NSEQITMMOV: number;
  IDPRD: number;
  NOMEFANTASIA: string;
  QUANTIDADE: number;
  PRECOUNITARIO: number;
  CODUND: string;
  VALORLIQUIDO: number;
  [key: string]: any;
}

export interface PurchaseOrderItem {
  IDMOV: number;
  CODCOLIGADA: number;
  CODFILIAL: number;
  NUMEROMOV: string;
  DATAEMISSAO: string;
  VALORBRUTO: number;
  STATUS: string;
  CODCFO: string;
  NOMEFANTASIA: string;
  [key: string]: any;
}

const ReceiveXmlWizard = ({ xmlItem, open, onOpenChange, onBack, onSuccess }: { xmlItem: XmlItem, open: boolean, onOpenChange: (open: boolean) => void, onBack?: () => void, onSuccess?: () => void }) => {
  const [step, setStep] = useState(1);
  const [poList, setPoList] = useState<PurchaseOrderItem[]>([]);
  const [loadingPo, setLoadingPo] = useState(false);
  const [selectedPo, setSelectedPo] = useState<PurchaseOrderItem | null>(null);
  const [xmlLines, setXmlLines] = useState<any[]>([]);
  const [poLines, setPoLines] = useState<PurchaseOrderLineItem[]>([]);
  const [loadingLines, setLoadingLines] = useState(false);
  
  const [selectedXmlLineIndex, setSelectedXmlLineIndex] = useState<number | null>(null);
  const [selectedPoLineIndex, setSelectedPoLineIndex] = useState<number | null>(null);
  
  const [mappings, setMappings] = useState<{ xmlIndex: number, poIndex: number }[]>([]);
  const [showPartialAlert, setShowPartialAlert] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setStep(1);
      setMappings([]);
      setSelectedPo(null);
      setSelectedXmlLineIndex(null);
      setSelectedPoLineIndex(null);
      fetchPurchaseOrders();
      if (xmlItem.XML) {
        setXmlLines(parseNfeItems(xmlItem.XML));
      }
    }
  }, [open, xmlItem]);

  const fetchPurchaseOrders = async () => {
    console.log("Iniciando busca de ordens de compra...");
    console.log("XML Item:", xmlItem);

    if (!xmlItem.CODCFO) {
        console.warn("Fornecedor (CODCFO) não identificado no XML.");
        toast({ 
            title: "Aviso", 
            description: "O código do fornecedor (CODCFO) não está preenchido neste item. Verifique se o cadastro está correto.", 
            variant: "destructive" 
        });
        return;
    }

    setLoadingPo(true);
    try {
      const endpoint = await EndpointService.getDefaultEndpoint();
      const token = AuthService.getStoredToken();
      
      console.log("Endpoint:", endpoint);
      console.log("Token exists:", !!token);

      if (!token) {
        console.error("Token não encontrado.");
        toast({ title: "Erro de Autenticação", description: "Token não encontrado. Faça login novamente.", variant: "destructive" });
        return;
      }

      // Ensure endpoint has protocol
      const formattedEndpoint = endpoint.replace(/^https?:\/\//i, '');
      
      // Use dynamic CODCOLIGADA if available, otherwise default to 1
      const coligada = xmlItem.CODCOLIGADA || 1;
      const path = `/api/framework/v1/consultaSQLServer/RealizaConsulta/SIT.PORTALRM.009/${coligada}/T?parameters=CODCFO=${encodeURIComponent(xmlItem.CODCFO)}`;
      const fullUrl = `/api/proxy?endpoint=${encodeURIComponent(formattedEndpoint)}&path=${encodeURIComponent(path)}&token=${encodeURIComponent(token.access_token)}`;

      console.log("URL de requisição:", fullUrl);

      const response = await fetch(fullUrl);
      console.log("Response status:", response.status);

      if (response.ok) {
        const responseText = await response.text();
        console.log("Response text:", responseText);
        
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            console.error("Erro ao fazer parse do JSON:", e);
            throw new Error(`Resposta inválida do servidor: ${responseText.substring(0, 100)}...`);
        }
        
        // Handle "data" wrapper if present (common in some RM APIs or proxy responses)
        const items = Array.isArray(data) ? data : (data.data || []);
        
        console.log("Itens retornados:", items);

        // Filter for A (Aberto) or V (Validado/Vinculado?) as per request
        const filtered = Array.isArray(items) ? items.filter((d: any) => d.STATUS === "A" || d.STATUS === "V") : [];
        console.log("Itens filtrados (STATUS=A ou V):", filtered);
        
        setPoList(filtered);
      } else {
        const errorText = await response.text();
        console.error("Erro na resposta:", errorText);
        throw new Error(`Erro ${response.status}: ${errorText}`);
      }
    } catch (error: any) {
      console.error("Erro no fetchPurchaseOrders:", error);
      toast({ 
        title: "Erro ao buscar ordens de compra", 
        description: error.message || "Erro desconhecido. Verifique o console.", 
        variant: "destructive" 
      });
    } finally {
      setLoadingPo(false);
    }
  };

  const handleNextStep = async () => {
    if (!selectedPo) return;
    setLoadingLines(true);
    try {
      const endpoint = await EndpointService.getDefaultEndpoint();
      const token = AuthService.getStoredToken();
      if (!token) return;

      const path = `/api/framework/v1/consultaSQLServer/RealizaConsulta/SIT.PORTALRM.010/1/T?parameters=IDMOV=${selectedPo.IDMOV}`;
      const fullUrl = `/api/proxy?endpoint=${encodeURIComponent(endpoint)}&path=${encodeURIComponent(path)}&token=${encodeURIComponent(token.access_token)}`;

      const response = await fetch(fullUrl);
      if (response.ok) {
        const data = await response.json();
        setPoLines(Array.isArray(data) ? data : []);
        setStep(2);
      }
    } catch (error) {
      console.error(error);
      toast({ title: "Erro", description: "Falha ao buscar itens da ordem.", variant: "destructive" });
    } finally {
      setLoadingLines(false);
    }
  };

  const handleLink = () => {
    if (selectedXmlLineIndex !== null && selectedPoLineIndex !== null) {
      const xmlItem = xmlLines[selectedXmlLineIndex];
      const poItem = poLines[selectedPoLineIndex];

      // Validação de Quantidade
      // Usando uma pequena margem de erro para ponto flutuante
      if (Math.abs(xmlItem.qCom - poItem.QUANTIDADE) > 0.001) {
          toast({
              title: "Divergência de Quantidade",
              description: `A quantidade do XML (${xmlItem.qCom}) é diferente da Ordem de Compra (${poItem.QUANTIDADE}).`,
              variant: "destructive"
          });
          return;
      }

      // Validação de Valor
      // xmlItem.vProd vs poItem.VALORLIQUIDO
      if (Math.abs(xmlItem.vProd - poItem.VALORLIQUIDO) > 0.01) {
          toast({
              title: "Divergência de Valor",
              description: `O valor do XML (${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(xmlItem.vProd)}) é diferente da Ordem de Compra (${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(poItem.VALORLIQUIDO)}).`,
              variant: "destructive"
          });
          return;
      }

      setMappings([...mappings, { xmlIndex: selectedXmlLineIndex, poIndex: selectedPoLineIndex }]);
      setSelectedXmlLineIndex(null);
      setSelectedPoLineIndex(null);
    }
  };

  const handleUnlink = (xmlIndex: number) => {
    setMappings(mappings.filter(m => m.xmlIndex !== xmlIndex));
  };

  const isXmlItemMapped = (index: number) => mappings.some(m => m.xmlIndex === index);
  const isPoItemMapped = (index: number) => mappings.some(m => m.poIndex === index);

  const handleFinish = () => {
      // Check if all PO items are mapped? Or if all XML items are mapped?
      // Usually we want to ensure all XML items are accounted for.
      // But we also want to know if PO is fully consumed.
      
      // For now, let's just assume we want to process what is mapped.
      // But if there are unmapped PO items, warn about partial receipt?
      const unmappedPoItems = poLines.filter((_, idx) => !isPoItemMapped(idx));
      
      if (unmappedPoItems.length > 0) {
          setShowPartialAlert(true);
      } else {
          confirmPartialFinish();
      }
  };

  const confirmPartialFinish = async () => {
    setShowPartialAlert(false);

    if (!selectedPo) {
        toast({ title: "Erro", description: "Nenhuma Ordem de Compra selecionada.", variant: "destructive" });
        return;
    }

    const token = AuthService.getStoredToken();
    if (!token) {
        toast({ title: "Erro", description: "Usuário não autenticado.", variant: "destructive" });
        return;
    }

    setIsProcessing(true); // Bloqueia a interface

    try {
        const endpoint = await EndpointService.getDefaultEndpoint();
        const soapXml = getFaturamentoMovimentoSoap(token.username, selectedPo.IDMOV, selectedPo.CODCOLIGADA, selectedPo.CODFILIAL);
        
        const soapPath = "/wsProcess/IwsProcess";
        const proxyUrl = `/api/proxy-soap?endpoint=${encodeURIComponent(endpoint)}&path=${encodeURIComponent(soapPath)}&token=${encodeURIComponent(token.access_token)}`;

        toast({
            title: "Processando...",
            description: "Enviando dados para o RM...",
        });

        console.log("🚀 [1/4] Enviando Processo SOAP para:", proxyUrl);

        const response = await fetch(proxyUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                xml: soapXml,
                action: "http://www.totvs.com/IwsProcess/ExecuteWithXmlParams"
            })
        });

        const responseText = await response.text();
        console.log("📥 [1/4] Resposta SOAP Recebimento:", responseText);

        if (response.ok && !responseText.includes(":Fault>")) {
             console.log("✅ [1/4] Recebimento OK. Iniciando atualização TNFEENTRADA...");
             
             // Início da atualização da TNFEENTRADA
             try {
                 toast({ title: "Atualizando...", description: "Atualizando vínculo da NFe..." });

                 // 1. ReadRecord
                 console.log(`🚀 [2/4] ReadRecord (ID: ${xmlItem.ID})...`);
                 const readXml = getReadRecordMovDocNfeEntradaSoap(xmlItem.ID, xmlItem.CODCOLIGADA, token.username);
                 const readPath = "/wsDataServer/IwsDataServer";
                 const readProxyUrl = `/api/proxy-soap?endpoint=${encodeURIComponent(endpoint)}&path=${encodeURIComponent(readPath)}&token=${encodeURIComponent(token.access_token)}`;

                 const readResponse = await fetch(readProxyUrl, {
                     method: "POST",
                     headers: { "Content-Type": "application/json" },
                     body: JSON.stringify({
                         xml: readXml,
                         action: "http://www.totvs.com/IwsDataServer/ReadRecord"
                     })
                 });

                 const readRespText = await readResponse.text();
                 console.log("📥 [2/4] Resposta ReadRecord:", readRespText);

                 if (!readResponse.ok || readRespText.includes(":Fault>")) {
                     console.error("❌ Erro ReadRecord:", readRespText);
                     throw new Error("Erro ao ler dados da NFe (ReadRecord).");
                 }

                 const matchResult = readRespText.match(/<ReadRecordResult>([\s\S]*?)<\/ReadRecordResult>/);
                 if (!matchResult) throw new Error("Não foi possível ler o retorno do ReadRecord.");
                 
                 let innerXml = matchResult[1];
                 
                 // Handle CDATA if present
                 if (innerXml.trim().startsWith("<![CDATA[")) {
                    innerXml = innerXml.replace(/^<!\[CDATA\[|\]\]>$/g, "");
                 }

                 // Unescape entities
                const unescapeXml = (str: string) => {
                   return str
                       .replace(/&lt;/g, '<')
                       .replace(/&gt;/g, '>')
                       .replace(/&amp;/g, '&')
                       .replace(/&quot;/g, '"')
                       .replace(/&apos;/g, "'");
                };
                
                // Unescape until we find the start tag, but be careful not to over-unescape inner content
                let loopCount = 0;
                while (!innerXml.includes("<TNFEENTRADA") && innerXml.includes("&lt;") && loopCount < 5) {
                   innerXml = unescapeXml(innerXml);
                   loopCount++;
                }

                // Protect XML tag content from cleanup
                let xmlContentPlaceholder = "";
                const xmlTagMatch = innerXml.match(/<XML>([\s\S]*?)<\/XML>/i);
                if (xmlTagMatch) {
                    let rawContent = xmlTagMatch[1];
                    console.log("📜 Conteúdo ORIGINAL da tag XML:", rawContent);
                    
                    // CORREÇÃO: Remover escape de aspas duplas tipo JSON (\") se existir
                    // Isso corrige o erro "Uma cadeia de caracteres literal era esperada"
                    if (rawContent.includes('\\"')) {
                        console.warn("⚠️ Detectado escape incorreto (\\\") no XML. Corrigindo...");
                        rawContent = rawContent.replace(/\\"/g, '"');
                    }
                    
                    xmlContentPlaceholder = rawContent;
                    innerXml = innerXml.replace(xmlTagMatch[0], `<XML>__XML_CONTENT_PLACEHOLDER__</XML>`);
                }

                // Cleanup artifacts from the structure only
                innerXml = innerXml
                    .replace(/&#xD;/g, "")
                    .replace(/&#xA;/g, "");

                // Restore XML tag content
                if (xmlContentPlaceholder) {
                    innerXml = innerXml.replace("__XML_CONTENT_PLACEHOLDER__", xmlContentPlaceholder);
                }

                console.log("📜 XML Lido (Processado):", innerXml);

                 // Extract TNFEENTRADA block
                 const tnfeMatch = innerXml.match(/<TNFEENTRADA[\s\S]*?<\/TNFEENTRADA>/i);
                 if (!tnfeMatch) {
                     console.error("❌ TNFEENTRADA não encontrada no XML:", innerXml);
                     throw new Error("Estrutura TNFEENTRADA não encontrada no XML.");
                 }
                 let tnfeBlock = tnfeMatch[0];

                 // 2. Buscar IDMOVDESTINO via REST
                 console.log(`🚀 [3/4] Buscando IDMOVDESTINO para IDMOV ${selectedPo.IDMOV}...`);
                 const formattedEndpoint = endpoint.replace(/^https?:\/\//i, '');
                 const restPath = `/api/framework/v1/consultaSQLServer/RealizaConsulta/SIT.PORTALRM.013/1/T?parameters=IDMOVORIGEM=${selectedPo.IDMOV}`;
                 const restUrl = `/api/proxy?endpoint=${encodeURIComponent(formattedEndpoint)}&path=${encodeURIComponent(restPath)}&token=${encodeURIComponent(token.access_token)}`;

                 const restResponse = await fetch(restUrl);
                 if (!restResponse.ok) throw new Error("Erro ao consultar IDMOV destino.");
                 
                 const restData = await restResponse.json();
                 console.log("📥 [3/4] Dados REST IDMOVDESTINO:", restData);

                 let idMovDestino = null;
                 
                 // Handle different response structures
                 if (Array.isArray(restData) && restData.length > 0) {
                     idMovDestino = restData[0].IDMOVDESTINO;
                 } else if (restData.data && Array.isArray(restData.data) && restData.data.length > 0) {
                     idMovDestino = restData.data[0].IDMOVDESTINO;
                 } else if (restData.IDMOVDESTINO) {
                     idMovDestino = restData.IDMOVDESTINO;
                 }

                 if (!idMovDestino) {
                     console.error("❌ IDMOVDESTINO não encontrado. Dados:", restData);
                     throw new Error("IDMOVDESTINO não encontrado na consulta.");
                 }
                 console.log("✅ IDMOVDESTINO encontrado:", idMovDestino);

                 // 3. Atualizar IDMOV no XML
                 const idMovRegex = /<IDMOV(\s[^>]*)?>[\s\S]*?<\/IDMOV>|<IDMOV(\s[^>]*)?\/>/gi;
                 
                 if (idMovRegex.test(tnfeBlock)) {
                    tnfeBlock = tnfeBlock.replace(idMovRegex, `<IDMOV>${idMovDestino}</IDMOV>`);
                 } else {
                    tnfeBlock = tnfeBlock.replace(/<\/TNFEENTRADA>/i, `<IDMOV>${idMovDestino}</IDMOV></TNFEENTRADA>`);
                 }
                 
                 // Re-wrap with specific MovNfeEntrada tag (with space) as requested
                 const finalXml = `<MovNfeEntrada >\n${tnfeBlock}\n</MovNfeEntrada>`;

                 console.log("🚀 [4/4] Enviando SaveRecord com XML:", finalXml);

                 // 4. SaveRecord
                 const saveXml = getSaveRecordMovDocNfeEntradaSoap(finalXml, token.username, xmlItem.CODCOLIGADA);
                 
                 const saveResponse = await fetch(readProxyUrl, {
                     method: "POST",
                     headers: { "Content-Type": "application/json" },
                     body: JSON.stringify({
                         xml: saveXml,
                         action: "http://www.totvs.com/IwsDataServer/SaveRecord"
                     })
                 });

                 const saveRespText = await saveResponse.text();
                 console.log("📥 [4/4] Resposta SaveRecord:", saveRespText);

                 if (!saveResponse.ok || saveRespText.includes(":Fault>")) {
                     console.error("❌ Erro SaveRecord:", saveRespText);
                     throw new Error("Erro ao salvar dados da NFe (SaveRecord).");
                 }

                 console.log("✅ Atualização TNFEENTRADA concluída com sucesso.");

             } catch (updateError: any) {
                 console.error("❌ Erro na atualização da TNFEENTRADA:", updateError);
                 toast({
                     title: "Aviso",
                     description: "Recebimento realizado, mas houve erro ao atualizar NFe: " + (updateError.message || "Erro desconhecido"),
                     variant: "warning"
                 });
             }

             toast({
                title: "Sucesso",
                description: "Recebimento realizado com sucesso!",
             });
             onOpenChange(false);
             processFinish();
        } else {
            console.error("❌ Erro na resposta SOAP Recebimento:", responseText);
            
            let errorMessage = "Ocorreu um erro ao processar no RM.";
            if (responseText.includes(":Fault>")) {
                const faultStringMatch = responseText.match(/<faultstring>(.*?)<\/faultstring>/);
                if (faultStringMatch) {
                    errorMessage = faultStringMatch[1];
                }
            }

            toast({
                title: "Erro no RM",
                description: errorMessage,
                variant: "destructive"
            });
        }

    } catch (error: any) {
        console.error("❌ Erro fatal ao finalizar:", error);
        toast({
            title: "Erro",
            description: error.message || "Erro desconhecido ao finalizar.",
            variant: "destructive"
        });
    } finally {
        setIsProcessing(false); // Libera a interface
    }
  };
  
  const processFinish = () => {
      // triggers parent refresh if needed
      onSuccess?.();
  }

  return (
    <>
      <DialogContent className="max-w-[95vw] w-full max-h-[95vh] flex flex-col sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle>Recebimento de NF via XML - Passo {step}</DialogTitle>
          <DialogDescription>
            {step === 1 
                ? `Selecione a Ordem de Compra para vincular. (Fornecedor: ${xmlItem.CODCFO || "N/A"})` 
                : "Vincule os itens da NF com os itens da Ordem de Compra."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {step === 1 && (
            <div className="flex-1 overflow-auto border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Sel</TableHead>
                    <TableHead>ID (IDMOV)</TableHead>
                    <TableHead>Número</TableHead>
                    <TableHead>Data Emissão</TableHead>
                    <TableHead>Valor Bruto</TableHead>
                    <TableHead>Filial</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingPo ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
                  ) : poList.length > 0 ? (
                    poList.map((po) => (
                      <TableRow key={po.IDMOV} className="cursor-pointer" onClick={() => setSelectedPo(po)}>
                        <TableCell>
                          <div className={cn("h-4 w-4 rounded-full border border-primary flex items-center justify-center", selectedPo?.IDMOV === po.IDMOV ? "bg-primary" : "")}>
                            {selectedPo?.IDMOV === po.IDMOV && <Check className="h-3 w-3 text-white" />}
                          </div>
                        </TableCell>
                        <TableCell>{po.IDMOV}</TableCell>
                        <TableCell>{po.NUMEROMOV}</TableCell>
                        <TableCell>{new Date(po.DATAEMISSAO).toLocaleDateString()}</TableCell>
                        <TableCell>{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(po.VALORBRUTO)}</TableCell>
                        <TableCell>{po.CODFILIAL}</TableCell>
                        <TableCell>
                            {po.STATUS === 'V' ? (
                                <Badge className="bg-green-500 hover:bg-green-600">VALIDADO</Badge>
                            ) : po.STATUS === 'A' ? (
                                <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">PENDENTE</Badge>
                            ) : (
                                <Badge variant="secondary">{po.STATUS}</Badge>
                            )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={7} className="text-center">Nenhuma ordem de compra encontrada.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {step === 2 && (
            <div className="flex-1 flex gap-4 overflow-hidden">
              {/* Left Side: XML Items */}
              <div className="flex-1 flex flex-col border rounded-md overflow-hidden">
                <div className="bg-muted p-2 font-semibold text-center border-b">Itens do XML</div>
                <div className="flex-1 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Produto</TableHead>
                        <TableHead>Qtd</TableHead>
                        <TableHead>Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {xmlLines.map((item, idx) => {
                        const isMapped = isXmlItemMapped(idx);
                        if (isMapped) return null; // Hide if mapped

                        const isSelected = selectedXmlLineIndex === idx;
                        
                        return (
                          <TableRow 
                            key={idx} 
                            className={cn(
                              "cursor-pointer transition-colors",
                              isSelected && "bg-accent text-accent-foreground"
                            )}
                            onClick={() => setSelectedXmlLineIndex(idx)}
                          >
                            <TableCell className="font-medium">
                              {item.nItem}
                            </TableCell>
                            <TableCell>
                              <div className="text-xs font-semibold">{item.cProd}</div>
                              <div className="text-xs text-muted-foreground mt-1" title={item.xProd}>{item.xProd}</div>
                            </TableCell>
                            <TableCell>{item.qCom} {item.uCom}</TableCell>
                            <TableCell>{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(item.vProd)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Actions Middle */}
              <div className="flex flex-col justify-center gap-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  disabled={selectedXmlLineIndex === null || selectedPoLineIndex === null}
                  onClick={handleLink}
                >
                  <LinkIcon className="h-4 w-4" />
                </Button>
              </div>

              {/* Right Side: PO Items */}
              <div className="flex-1 flex flex-col border rounded-md overflow-hidden">
                <div className="bg-muted p-2 font-semibold text-center border-b">Itens da Ordem de Compra</div>
                <div className="flex-1 overflow-auto">
                   <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Produto</TableHead>
                        <TableHead>Qtd</TableHead>
                        <TableHead>Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loadingLines ? (
                         <TableRow><TableCell colSpan={4} className="text-center py-8"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
                      ) : poLines.map((item, idx) => {
                        const isMapped = isPoItemMapped(idx);
                        if (isMapped) return null; // Hide if mapped

                        const isSelected = selectedPoLineIndex === idx;

                        return (
                          <TableRow 
                            key={idx}
                            className={cn(
                              "cursor-pointer transition-colors",
                              isSelected && "bg-accent text-accent-foreground"
                            )}
                            onClick={() => setSelectedPoLineIndex(idx)}
                          >
                            <TableCell className="font-medium">
                               {item.NSEQITMMOV}
                            </TableCell>
                            <TableCell>
                              <div className="text-xs font-semibold">{item.IDPRD}</div>
                              <div className="text-xs text-muted-foreground mt-1" title={item.NOMEFANTASIA}>{item.NOMEFANTASIA}</div>
                            </TableCell>
                            <TableCell>{item.QUANTIDADE} {item.CODUND}</TableCell>
                            <TableCell>{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(item.VALORLIQUIDO)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}

          {/* Mapped Items Summary */}
          {step === 2 && mappings.length > 0 && (
            <div className="mt-4 border rounded-md p-2 bg-muted/20 h-32 overflow-auto">
               <h4 className="text-sm font-semibold mb-2">Itens Vinculados ({mappings.length})</h4>
               <div className="space-y-1">
                 {mappings.map((m, i) => {
                   const xml = xmlLines[m.xmlIndex];
                   const po = poLines[m.poIndex];
                   return (
                     <div key={i} className="flex items-center text-xs gap-2 border-b pb-1 last:border-0">
                       <span className="font-medium">XML Item {xml.nItem} ({xml.xProd})</span>
                       <ArrowRight className="h-3 w-3 text-muted-foreground" />
                       <span className="font-medium">PO Item {po.NSEQITMMOV} (IDPRD: {po.IDPRD})</span>
                       <Button variant="ghost" size="icon" className="h-4 w-4 ml-auto" onClick={() => handleUnlink(m.xmlIndex)}>
                         <X className="h-3 w-3" />
                       </Button>
                     </div>
                   )
                 })}
               </div>
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          {step === 2 && (
            <Button variant="outline" onClick={() => setStep(1)} disabled={isProcessing}>
              Voltar
            </Button>
          )}
          {step === 1 && (
            <>
              {onBack && (
                <Button variant="outline" onClick={onBack} className="mr-auto" disabled={isProcessing}>
                  Voltar
                </Button>
              )}
              <Button onClick={handleNextStep} disabled={!selectedPo || isProcessing}>
                Avançar
              </Button>
            </>
          )}
          {step === 2 && (
            <Button 
              onClick={handleFinish}
              disabled={mappings.length !== xmlLines.length || isProcessing}
              title={mappings.length !== xmlLines.length ? "Vincule todos os itens do XML para finalizar" : ""}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                "Finalizar"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
      
      <Dialog open={showPartialAlert} onOpenChange={setShowPartialAlert}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Baixa Parcial</DialogTitle>
            <DialogDescription>
              Atenção: Existem itens na Ordem de Compra que não foram vinculados. Isso resultará em uma baixa parcial da Ordem de Compra. Deseja continuar?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPartialAlert(false)}>Cancelar</Button>
            <Button onClick={confirmPartialFinish}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

interface SystemItem {
  IDPRD: number;
  CODIGOPRD: string;
  NOMEFANTASIA: string;
  CODUNDCONTROLE: string;
  TIPO: "Produto" | "Serviço";
}

const ReceiveXmlWithoutPoWizard = ({ xmlItem, open, onOpenChange, onBack }: { xmlItem: XmlItem, open: boolean, onOpenChange: (open: boolean) => void, onBack: () => void }) => {
  const [xmlLines, setXmlLines] = useState<any[]>([]);
  const [selectedXmlLineIndex, setSelectedXmlLineIndex] = useState<number | null>(null);
  
  const [searchType, setSearchType] = useState<"produto" | "servico">("produto");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SystemItem[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [selectedSystemItem, setSelectedSystemItem] = useState<SystemItem | null>(null);
  
  const [mappings, setMappings] = useState<{ xmlIndex: number, systemItem: SystemItem }[]>([]);
  
  const { toast } = useToast();

  useEffect(() => {
    if (xmlItem?.XML) {
      const items = parseNfeItems(xmlItem.XML);
      setXmlLines(items);
    }
    setMappings([]);
    setSelectedXmlLineIndex(null);
    setSelectedSystemItem(null);
    setSearchResults([]);
    setSearchTerm("");
  }, [xmlItem, open]);

  const handleSearch = async () => {
    // Permite busca vazia para trazer todos, ou exige termo? 
    // O usuario disse "a busca... nao funciona". 
    // Se ele digita e nao vem nada, eh o problema.
    // Vamos permitir buscar tudo se ele quiser, mas o foco eh corrigir o filtro.
    
    setLoadingSearch(true);
    try {
      const endpoint = await EndpointService.getDefaultEndpoint();
      const token = AuthService.getStoredToken();
      if (!token) return;

      const dataServer = searchType === "produto" ? "SIT.PORTALRM.011" : "SIT.PORTALRM.012";
      // Removido filtro de URL para garantir compatibilidade com a consulta SQL existente
      const path = `/api/framework/v1/consultaSQLServer/RealizaConsulta/${dataServer}/1/T`;
      const fullUrl = `/api/proxy?endpoint=${encodeURIComponent(endpoint)}&path=${encodeURIComponent(path)}&token=${encodeURIComponent(token.access_token)}`;

      const response = await fetch(fullUrl);
      if (response.ok) {
        const data = await response.json();
        let items = Array.isArray(data) ? data.map((item: any) => ({
          ...item,
          TIPO: searchType === "produto" ? "Produto" : "Serviço"
        })) : [];
        
        // Filtragem no cliente
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            items = items.filter((item: SystemItem) => 
                (item.NOMEFANTASIA && item.NOMEFANTASIA.toLowerCase().includes(lowerTerm)) ||
                (item.CODIGOPRD && item.CODIGOPRD.toLowerCase().includes(lowerTerm))
            );
        }
        
        setSearchResults(items);
      } else {
          setSearchResults([]);
          toast({ title: "Aviso", description: "Nenhum item retornado pelo servidor.", variant: "warning" });
      }
    } catch (error) {
      console.error(error);
      toast({ title: "Erro na busca", description: "Não foi possível buscar os itens. Verifique a conexão.", variant: "destructive" });
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleLink = () => {
    if (selectedXmlLineIndex !== null && selectedSystemItem) {
      setMappings([...mappings, { xmlIndex: selectedXmlLineIndex, systemItem: selectedSystemItem }]);
      setSelectedXmlLineIndex(null);
      setSelectedSystemItem(null);
    }
  };

  const handleUnlink = (index: number) => {
    setMappings(mappings.filter(m => m.xmlIndex !== index));
  };

  const isXmlItemMapped = (index: number) => mappings.some(m => m.xmlIndex === index);

  const handleFinish = () => {
    // Placeholder for finish logic
    toast({ title: "Sucesso", description: "Itens vinculados com sucesso! (Gravação simulada)" });
    onOpenChange(false);
  };

  return (
    <DialogContent className="max-w-[95vw] w-full max-h-[95vh] flex flex-col sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle>Vincular Itens sem Ordem de Compra</DialogTitle>
          <DialogDescription>
            Vincule os itens do XML com Produtos ou Serviços do sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex gap-4">
             {/* Left Side: XML Items */}
              <div className="flex-1 flex flex-col border rounded-md overflow-hidden">
                <div className="bg-muted p-2 font-semibold text-center border-b">Itens do XML</div>
                <div className="flex-1 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Produto XML</TableHead>
                        <TableHead>Qtd</TableHead>
                        <TableHead>Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {xmlLines.map((item, idx) => {
                        const isMapped = isXmlItemMapped(idx);
                        if (isMapped) return null;

                        const isSelected = selectedXmlLineIndex === idx;
                        return (
                          <TableRow 
                            key={idx} 
                            className={cn("cursor-pointer transition-colors", isSelected && "bg-accent text-accent-foreground")}
                            onClick={() => setSelectedXmlLineIndex(idx)}
                          >
                            <TableCell>{item.nItem}</TableCell>
                            <TableCell>
                              <div className="text-xs font-semibold">{item.cProd}</div>
                              <div className="text-xs text-muted-foreground" title={item.xProd}>{item.xProd}</div>
                            </TableCell>
                            <TableCell>{item.qCom} {item.uCom}</TableCell>
                            <TableCell>{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(item.vProd)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col justify-center gap-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  disabled={selectedXmlLineIndex === null || !selectedSystemItem}
                  onClick={handleLink}
                >
                  <LinkIcon className="h-4 w-4" />
                </Button>
              </div>

              {/* Right Side: System Items */}
              <div className="flex-1 flex flex-col border rounded-md overflow-hidden">
                 <div className="bg-muted p-2 font-semibold text-center border-b">
                    Itens do Sistema
                 </div>
                 <div className="p-2 border-b space-y-2 bg-background">
                    <Tabs value={searchType} onValueChange={(v: any) => { setSearchType(v); setSearchResults([]); setSearchTerm(""); }}>
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="produto">Produtos</TabsTrigger>
                            <TabsTrigger value="servico">Serviços</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    <div className="flex gap-2">
                        <Input 
                            placeholder={`Buscar ${searchType}...`}
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <Button size="icon" onClick={handleSearch} disabled={loadingSearch}>
                            {loadingSearch ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        </Button>
                    </div>
                 </div>
                 <div className="flex-1 overflow-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Cód.</TableHead>
                                <TableHead>Nome</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {searchResults.map((item) => (
                                <TableRow 
                                    key={item.IDPRD} 
                                    className={cn("cursor-pointer", selectedSystemItem?.IDPRD === item.IDPRD && "bg-accent text-accent-foreground")}
                                    onClick={() => setSelectedSystemItem(item)}
                                >
                                    <TableCell className="text-xs">{item.CODIGOPRD}</TableCell>
                                    <TableCell className="text-xs">{item.NOMEFANTASIA}</TableCell>
                                </TableRow>
                            ))}
                            {searchResults.length === 0 && !loadingSearch && (
                                <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground text-sm py-4">
                                    {searchTerm ? "Nenhum item encontrado" : "Digite para buscar"}
                                </TableCell></TableRow>
                            )}
                            {loadingSearch && (
                                <TableRow><TableCell colSpan={2} className="text-center py-4"><Loader2 className="animate-spin mx-auto h-6 w-6" /></TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                 </div>
              </div>
        </div>

        {/* Mapped Items */}
        {mappings.length > 0 && (
            <div className="mt-4 border rounded-md p-2 bg-muted/20 h-32 overflow-auto">
               <h4 className="text-sm font-semibold mb-2">Itens Vinculados ({mappings.length})</h4>
               <div className="space-y-1">
                 {mappings.map((m, i) => {
                   const xml = xmlLines[m.xmlIndex];
                   return (
                     <div key={i} className="flex items-center text-xs gap-2 border-b pb-1 last:border-0">
                       <div className="flex-1 flex items-center gap-2">
                            <span className="font-medium">XML: {xml.nItem} - {xml.xProd}</span>
                            <span className="text-muted-foreground">({xml.qCom} {xml.uCom} - {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(xml.vProd)})</span>
                       </div>
                       <ArrowRight className="h-3 w-3 text-muted-foreground" />
                       <div className="flex-1 flex items-center gap-2">
                            <span className="font-medium">Sistema: {m.systemItem.CODIGOPRD} - {m.systemItem.NOMEFANTASIA}</span>
                            <span className="text-muted-foreground">({xml.qCom} {xml.uCom} - {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(xml.vProd)})</span>
                       </div>
                       <Button variant="ghost" size="icon" className="h-4 w-4 ml-auto" onClick={() => handleUnlink(m.xmlIndex)}>
                         <X className="h-3 w-3" />
                       </Button>
                     </div>
                   )
                 })}
               </div>
            </div>
        )}

        <DialogFooter className="mt-4">
            <Button variant="outline" onClick={onBack} className="mr-auto">Voltar</Button>
            <Button 
                onClick={handleFinish} 
                disabled={mappings.length !== xmlLines.length}
                title={mappings.length !== xmlLines.length ? "Vincule todos os itens do XML para finalizar" : ""}
            >
                Finalizar
            </Button>
        </DialogFooter>
    </DialogContent>
  );
};

const formatXml = (xml: string) => {
  let formatted = '';
  let reg = /(>)(<)(\/*)/g;
  xml = xml.replace(reg, '$1\r\n$2$3');
  let pad = 0;
  xml.split('\r\n').forEach((node, index) => {
      let indent = 0;
      if (node.match( /.+<\/\w[^>]*>$/ )) {
          indent = 0;
      } else if (node.match( /^<\/\w/ )) {
          if (pad !== 0) {
              pad -= 1;
          }
      } else if (node.match( /^<\w[^>]*[^\/]>.*$/ )) {
          indent = 1;
      } else {
          indent = 0;
      }

      let padding = '';
      for (let i = 0; i < pad; i++) {
          padding += '  ';
      }

      formatted += padding + node + '\r\n';
      pad += indent;
  });
  return formatted;
}

const XmlContentDialog = ({ xmlContent }: { xmlContent: string }) => {
  const formattedXml = formatXml(xmlContent);
  const items = parseNfeItems(xmlContent);

  return (
    <div className="h-[600px] flex flex-col">
      <Tabs defaultValue="items" className="h-full flex flex-col">
        <TabsList>
          <TabsTrigger value="items">Itens da Nota</TabsTrigger>
          <TabsTrigger value="xml">XML Original</TabsTrigger>
        </TabsList>
        <TabsContent value="items" className="flex-1 overflow-auto border rounded-md mt-2">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Código</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Qtd</TableHead>
                        <TableHead>Valor Unit.</TableHead>
                        <TableHead>Valor Total</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.map((item: any, idx: number) => (
                        <TableRow key={idx}>
                            <TableCell>{item.nItem}</TableCell>
                            <TableCell>{item.cProd}</TableCell>
                            <TableCell>{item.xProd}</TableCell>
                            <TableCell>{item.qCom} {item.uCom}</TableCell>
                            <TableCell>{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(item.vUnCom)}</TableCell>
                            <TableCell>{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(item.vProd)}</TableCell>
                        </TableRow>
                    ))}
                    {items.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center py-4">Nenhum item encontrado no XML</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </TabsContent>
        <TabsContent value="xml" className="flex-1 overflow-auto border rounded-md bg-muted p-4 mt-2">
            <pre className="text-xs font-mono whitespace-pre-wrap break-all">{formattedXml}</pre>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const ReceiveXmlDialog = ({ xmlItem, open, onOpenChange, onSuccess }: { xmlItem: XmlItem, open: boolean, onOpenChange: (open: boolean) => void, onSuccess?: () => void }) => {
  const [mode, setMode] = useState<"selection" | "with-po" | "without-po">("selection");

  useEffect(() => {
    if (open) {
      setMode("selection");
    }
  }, [open]);

  if (mode === "with-po") {
    return (
      <ReceiveXmlWizard 
        xmlItem={xmlItem} 
        open={open} 
        onOpenChange={onOpenChange} 
        onBack={() => setMode("selection")} 
        onSuccess={onSuccess}
      />
    );
  }

  if (mode === "without-po") {
    return (
      <ReceiveXmlWithoutPoWizard
        xmlItem={xmlItem}
        open={open}
        onOpenChange={onOpenChange}
        onBack={() => setMode("selection")}
      />
    );
  }

  return (
    <DialogContent className="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>Como deseja receber esta Nota Fiscal?</DialogTitle>
        <DialogDescription>
          Selecione o método de recebimento para a nota {xmlItem.NUMERO}.
        </DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-2 gap-4 py-6">
        <Button 
          variant="outline" 
          className="h-32 flex flex-col gap-3 hover:border-primary hover:bg-primary/5" 
          onClick={() => setMode("with-po")}
        >
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
             <FileText className="h-6 w-6 text-primary" />
          </div>
          <span className="font-semibold">Com Ordem de Compra</span>
        </Button>
        <Button 
          variant="outline" 
          className="h-32 flex flex-col gap-3 hover:border-primary hover:bg-primary/5" 
          onClick={() => setMode("without-po")}
        >
          <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
             <FileCode className="h-6 w-6 text-orange-600" />
          </div>
          <span className="font-semibold">Sem Ordem de Compra</span>
        </Button>
      </div>
    </DialogContent>
  );
};



export default function ImportacaoXmlPage() {
  const [items, setItems] = useState<XmlItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = await EndpointService.getDefaultEndpoint();
      const token = AuthService.getStoredToken();

      if (!token) {
        return;
      }

      // Assuming 008 is the correct query for XML list based on sequence
      const path = "/api/framework/v1/consultaSQLServer/RealizaConsulta/SIT.PORTALRM.008/1/T";
      const fullUrl = `/api/proxy?endpoint=${encodeURIComponent(endpoint)}&path=${encodeURIComponent(path)}&token=${encodeURIComponent(token.access_token)}`;

      const response = await fetch(fullUrl);
      if (response.ok) {
        const data = await response.json();
        setItems(Array.isArray(data) ? data : []);
      } else {
        toast({
            title: "Erro",
            description: "Falha ao carregar lista de XMLs.",
            variant: "destructive"
        });
      }
    } catch (error) {
       console.error(error);
       toast({
           title: "Erro",
           description: "Falha na comunicação com o servidor.",
           variant: "destructive"
       });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const columns = useMemo<ColumnDef<XmlItem>[]>(() => [
    {
      accessorKey: "ID",
      header: "ID",
    },
    {
      accessorKey: "IDMOV",
      header: "IDMOV",
    },
    {
      accessorKey: "NUMERO",
      header: "Número",
    },
    {
      accessorKey: "DATAEMISSAO",
      header: "Emissão",
      cell: ({ row }) => {
          const date = new Date(row.getValue("DATAEMISSAO"));
          return date.toLocaleDateString("pt-BR");
      }
    },
    {
      accessorKey: "CODCFO",
      header: "Fornecedor",
    },
    {
      accessorKey: "NOMEFANTASIA",
      header: "Nome Fantasia",
    },
    {
      accessorKey: "STATUS",
      header: "Status",
       cell: ({ row }) => {
        const idMov = row.original.IDMOV;
        const status = row.getValue("STATUS") as string;
        
        if (idMov && Number(idMov) > 0) {
            return <Badge className="bg-blue-500 hover:bg-blue-600">LANÇADO</Badge>;
        }
  
        if (status === 'V') {
            return <Badge className="bg-green-500 hover:bg-green-600">VALIDADO</Badge>;
        }
  
        return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">PENDENTE</Badge>;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const [showXml, setShowXml] = useState(false);
        const [showReceive, setShowReceive] = useState(false);
        const item = row.original;
  
        return (
          <div className="flex items-center gap-2">
             <Dialog open={showXml} onOpenChange={setShowXml}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon" title="Ver Itens / XML" className="bg-primary/10 hover:bg-primary/20 border-primary/20">
                      <List className="h-4 w-4 text-primary" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh]">
                   <DialogHeader>
                      <DialogTitle>Conteúdo da Nota - {item.NUMERO}</DialogTitle>
                   </DialogHeader>
                   <XmlContentDialog xmlContent={item.XML} />
                </DialogContent>
             </Dialog>
  
             <Button 
               variant="ghost" 
               size="icon" 
               title={item.IDMOV && Number(item.IDMOV) > 0 ? "Item já lançado" : "Receber"} 
               onClick={() => setShowReceive(true)}
               disabled={!!item.IDMOV && Number(item.IDMOV) > 0}
               className={!!item.IDMOV && Number(item.IDMOV) > 0 ? "opacity-50 cursor-not-allowed" : ""}
             >
                 <Play className="h-4 w-4" />
             </Button>
  
             <Dialog open={showReceive} onOpenChange={setShowReceive}>
                <ReceiveXmlDialog xmlItem={item} open={showReceive} onOpenChange={setShowReceive} onSuccess={fetchData} />
             </Dialog>
          </div>
        )
      }
    }
  ], [fetchData]);

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="p-8 space-y-8">
        <Card className="border-none bg-black/40 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
                <FileCode className="h-6 w-6" />
                Importação de Arquivo XML
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {loading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="rounded-md border-none">
                <DataTable 
                  columns={columns} 
                  data={items} 
                  searchKey="NUMERO"
                  searchPlaceholder="Filtrar por número..."
                  className="[&_th]:bg-secondary/50 [&_th]:text-gray-300 [&_th]:font-semibold [&_td]:text-gray-300 [&_tr]:border-white/5 [&_tr:hover]:bg-white/5"
                />
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  );
}