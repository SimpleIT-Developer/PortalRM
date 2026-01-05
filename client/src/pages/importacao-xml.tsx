import { useState, useEffect } from "react";
import { Loader2, RefreshCw, FileText, ArrowUpDown, Eye, List, ShoppingCart, FileCode, Play, Link as LinkIcon, Check, X, ArrowRight } from "lucide-react";
import { AuthService } from "@/lib/auth";
import { EndpointService } from "@/lib/endpoint";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { getRecebimentoXmlSoap } from "@/lib/soap-templates";
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

export interface XmlItem {
  CODCOLIGADA: number;
  ID: number;
  CODFILIAL: number;
  CODCOLCFO: number;
  CODCFO: string;
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
  CODTMV: string;
  [key: string]: any;
}

const ReceiveXmlWizard = ({ xmlItem, open, onOpenChange }: { xmlItem: XmlItem, open: boolean, onOpenChange: (open: boolean) => void }) => {
  const [step, setStep] = useState(1);
  const [selectedPo, setSelectedPo] = useState<PurchaseOrderItem | null>(null);
  
  // Step 1 data
  const [poList, setPoList] = useState<PurchaseOrderItem[]>([]);
  const [loadingPo, setLoadingPo] = useState(false);

  // Step 2 data
  const [xmlLines, setXmlLines] = useState<any[]>([]);
  const [poLines, setPoLines] = useState<PurchaseOrderLineItem[]>([]);
  const [loadingLines, setLoadingLines] = useState(false);
  
  const [selectedXmlLineIndex, setSelectedXmlLineIndex] = useState<number | null>(null);
  const [selectedPoLineIndex, setSelectedPoLineIndex] = useState<number | null>(null);
  const [mappings, setMappings] = useState<{xmlIndex: number, poIndex: number}[]>([]);

  const { toast } = useToast();

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setStep(1);
      setSelectedPo(null);
      setMappings([]);
      setSelectedXmlLineIndex(null);
      setSelectedPoLineIndex(null);
      fetchOrders();
    }
  }, [open, xmlItem]);

  const fetchOrders = async () => {
    if (!xmlItem.CODCFO) return;
    
    setLoadingPo(true);
    try {
      const endpoint = await EndpointService.getDefaultEndpoint();
      const token = AuthService.getStoredToken();

      if (!token) return;

      const path = `/api/framework/v1/consultaSQLServer/RealizaConsulta/SIT.PORTALRM.009/1/T?parameters=CODCFO=${xmlItem.CODCFO}`;
      const fullUrl = `/api/proxy?endpoint=${encodeURIComponent(endpoint)}&path=${encodeURIComponent(path)}&token=${encodeURIComponent(token.access_token)}`;

      const response = await fetch(fullUrl);
      if (!response.ok) throw new Error("Falha ao buscar ordens");

      const data = await response.json();
      const filteredItems = Array.isArray(data) 
        ? data.filter((item: any) => item.STATUS === "A" && item.CODTMV === "1.1.03") 
        : [];
        
      setPoList(filteredItems);
    } catch (error) {
      console.error("Error fetching orders", error);
      toast({ title: "Erro", description: "Falha ao carregar ordens de compra.", variant: "destructive" });
    } finally {
      setLoadingPo(false);
    }
  };

  const handleNextStep = async () => {
    if (!selectedPo) return;
    setStep(2);
    setLoadingLines(true);
    
    // Parse XML Items
    const parsedXmlItems = parseNfeItems(xmlItem.XML);
    setXmlLines(parsedXmlItems);

    // Fetch PO Lines
    try {
      const endpoint = await EndpointService.getDefaultEndpoint();
      const token = AuthService.getStoredToken();
      if (!token) return;

      const path = `/api/framework/v1/consultaSQLServer/RealizaConsulta/SIT.PORTALRM.010/1/T?parameters=IDMOV=${selectedPo.IDMOV}`;
      const fullUrl = `/api/proxy?endpoint=${encodeURIComponent(endpoint)}&path=${encodeURIComponent(path)}&token=${encodeURIComponent(token.access_token)}`;

      const response = await fetch(fullUrl);
      if (!response.ok) throw new Error("Falha ao buscar itens da ordem");

      const data = await response.json();
      setPoLines(Array.isArray(data) ? data : [data].filter(Boolean));
    } catch (error) {
      console.error("Error fetching order lines", error);
      toast({ title: "Erro", description: "Falha ao carregar itens da ordem.", variant: "destructive" });
    } finally {
      setLoadingLines(false);
    }
  };

  const handleLink = () => {
    if (selectedXmlLineIndex !== null && selectedPoLineIndex !== null) {
      // Check if already mapped
      const isXmlMapped = mappings.some(m => m.xmlIndex === selectedXmlLineIndex);
      const isPoMapped = mappings.some(m => m.poIndex === selectedPoLineIndex);
      
      if (isXmlMapped || isPoMapped) {
        toast({ title: "Aviso", description: "Um dos itens já está vinculado.", variant: "destructive" });
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
  const getMappedPoIndex = (xmlIndex: number) => mappings.find(m => m.xmlIndex === xmlIndex)?.poIndex;

  const [showPartialAlert, setShowPartialAlert] = useState(false);

  const processFinish = async () => {
    if (!selectedPo) return;

    try {
      const token = AuthService.getStoredToken();
      if (!token) {
        toast({ title: "Erro", description: "Usuário não autenticado.", variant: "destructive" });
        return;
      }
      
      const endpoint = await EndpointService.getDefaultEndpoint();
      const soapXml = getRecebimentoXmlSoap(
        xmlItem as any, 
        selectedPo as any, 
        xmlLines, 
        poLines, 
        mappings, 
        token.username
      );
      
      const soapPath = "/wsProcess/IwsProcess";
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
      let data;
      try {
        data = JSON.parse(responseText);
      } catch(e) {
        throw new Error("Resposta inválida do servidor.");
      }

      if (!response.ok) {
         throw new Error(data.details || data.error || "Erro na requisição SOAP");
      }

      if (data.response && (data.response.includes("Processo executado com sucesso") || data.response.includes("ExecuteWithXmlParamsResponse"))) {
         console.log("SOAP Success Response:", data.response);
         toast({ title: "Sucesso", description: "Recebimento de NF processado com sucesso." });
         onOpenChange(false);
      } else {
         console.error("SOAP Error Response:", data);
         throw new Error("Erro no retorno do SOAP: " + (data.response || "").slice(0, 100));
      }

    } catch (error) {
       console.error("Erro no recebimento XML", error);
       toast({ title: "Erro", description: error instanceof Error ? error.message : "Falha ao processar recebimento.", variant: "destructive" });
    }
  };

  const handleFinish = () => {
    // Check if there are unmapped PO items
    const mappedPoIndices = new Set(mappings.map(m => m.poIndex));
    const unmappedPoItems = poLines.filter((_, idx) => !mappedPoIndices.has(idx));

    if (unmappedPoItems.length > 0) {
      setShowPartialAlert(true);
    } else {
      processFinish();
    }
  };

  const confirmPartialFinish = () => {
    setShowPartialAlert(false);
    processFinish();
  };

  return (
    <>
      <DialogContent className="max-w-[95vw] w-full max-h-[95vh] flex flex-col sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle>Recebimento de NF via XML - Passo {step}</DialogTitle>
          <DialogDescription>
            {step === 1 ? "Selecione a Ordem de Compra para vincular." : "Vincule os itens da NF com os itens da Ordem de Compra."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {step === 1 && (
            <div className="flex-1 overflow-auto border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Sel</TableHead>
                    <TableHead>Número</TableHead>
                    <TableHead>Data Emissão</TableHead>
                    <TableHead>Valor Bruto</TableHead>
                    <TableHead>Filial</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingPo ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
                  ) : poList.length > 0 ? (
                    poList.map((po) => (
                      <TableRow key={po.IDMOV} className="cursor-pointer" onClick={() => setSelectedPo(po)}>
                        <TableCell>
                          <div className={cn("h-4 w-4 rounded-full border border-primary flex items-center justify-center", selectedPo?.IDMOV === po.IDMOV ? "bg-primary" : "")}>
                            {selectedPo?.IDMOV === po.IDMOV && <Check className="h-3 w-3 text-white" />}
                          </div>
                        </TableCell>
                        <TableCell>{po.NUMEROMOV}</TableCell>
                        <TableCell>{formatarData(po.DATAEMISSAO)}</TableCell>
                        <TableCell>{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(po.VALORBRUTO)}</TableCell>
                        <TableCell>{po.CODFILIAL}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={5} className="text-center">Nenhuma ordem de compra encontrada.</TableCell></TableRow>
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

          {/* Mapped Items Summary (Optional or just rely on visual cues) */}
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
            <Button variant="outline" onClick={() => setStep(1)}>
              Voltar
            </Button>
          )}
          {step === 1 && (
            <Button onClick={handleNextStep} disabled={!selectedPo}>
              Avançar
            </Button>
          )}
          {step === 2 && (
            <Button 
              onClick={handleFinish}
              disabled={mappings.length !== xmlLines.length}
              title={mappings.length !== xmlLines.length ? "Vincule todos os itens do XML para finalizar" : ""}
            >
              Finalizar
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

const PurchaseOrderDialog = ({ codcfo }: { codcfo: string }) => {
  const [items, setItems] = useState<PurchaseOrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchOrders = async () => {
      if (!codcfo) return;
      
      setLoading(true);
      try {
        const endpoint = await EndpointService.getDefaultEndpoint();
        const token = AuthService.getStoredToken();

        if (!token) {
          toast({
            title: "Erro de autenticação",
            description: "Você precisa estar logado para acessar esta página.",
            variant: "destructive",
          });
          return;
        }

        const path = `/api/framework/v1/consultaSQLServer/RealizaConsulta/SIT.PORTALRM.009/1/T?parameters=CODCFO=${codcfo}`;
        const fullUrl = `/api/proxy?endpoint=${encodeURIComponent(endpoint)}&path=${encodeURIComponent(path)}&token=${encodeURIComponent(token.access_token)}`;

        const response = await fetch(fullUrl);
        if (!response.ok) {
          throw new Error("Falha ao buscar ordens de compra");
        }

        const data = await response.json();
        // Filter by STATUS = "A" as requested
        const filteredItems = Array.isArray(data) 
          ? data.filter((item: any) => item.STATUS === "A") 
          : [];
          
        setItems(filteredItems);
      } catch (error) {
        console.error("Error fetching purchase orders", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar as ordens de compra.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [codcfo, toast]);

  return (
    <div className="rounded-md border max-h-[300px] overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Coligada</TableHead>
            <TableHead>ID Mov</TableHead>
            <TableHead>Filial</TableHead>
            <TableHead>Número</TableHead>
            <TableHead>Tipo Mov</TableHead>
            <TableHead>Emissão</TableHead>
            <TableHead>Valor Bruto</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
             <TableRow>
              <TableCell colSpan={7} className="text-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                <span className="sr-only">Carregando...</span>
              </TableCell>
            </TableRow>
          ) : items.length > 0 ? (
            items.map((item, idx) => (
              <TableRow key={idx}>
                <TableCell>{item.CODCOLIGADA}</TableCell>
                <TableCell>{item.IDMOV}</TableCell>
                <TableCell>{item.CODFILIAL}</TableCell>
                <TableCell>{item.NUMEROMOV}</TableCell>
                <TableCell>{item.CODTMV}</TableCell>
                <TableCell>{formatarData(item.DATAEMISSAO)}</TableCell>
                <TableCell>
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(item.VALORBRUTO)}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="text-center">
                Nenhuma ordem de compra encontrada com Status "A".
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

const formatarData = (dataString: string) => {
  if (!dataString) return "";
  try {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
  } catch (error) {
    return dataString;
  }
};

const NfeItemsDialog = ({ xmlContent }: { xmlContent: string }) => {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    if (!xmlContent) return;
    const items = parseNfeItems(xmlContent);
    setItems(items);
  }, [xmlContent]);

  return (
    <div className="rounded-md border max-h-[300px] overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Produto</TableHead>
            <TableHead>Qtd</TableHead>
            <TableHead>Und</TableHead>
            <TableHead>Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length > 0 ? (
            items.map((item, idx) => (
              <TableRow key={idx}>
                <TableCell>{item.xProd}</TableCell>
                <TableCell>{item.qCom}</TableCell>
                <TableCell>{item.uCom}</TableCell>
                <TableCell>{item.vProd}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="text-center">
                Nenhum item encontrado no XML.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

const XmlDetails = ({ data }: { data: XmlItem }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground">ID</h4>
          <p className="text-sm font-semibold">{data.ID}</p>
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground">Chave de Acesso</h4>
          <p className="text-sm font-semibold break-all">{data.CHAVEACESSO}</p>
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground">Número</h4>
          <p className="text-sm font-semibold">{data.NUMERO}</p>
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
          <p className="text-sm font-semibold">{data.STATUS === "V" ? "Validado" : data.STATUS}</p>
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground">Emissão</h4>
          <p className="text-sm font-semibold">{formatarData(data.DATAEMISSAO)}</p>
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground">Autorização</h4>
          <p className="text-sm font-semibold">{formatarData(data.DATAAUTORIZACAO)}</p>
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground">Fornecedor</h4>
          <p className="text-sm font-semibold">{data.CODCFO}</p>
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground">Filial</h4>
          <p className="text-sm font-semibold">{data.CODFILIAL}</p>
        </div>
      </div>
      
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground">XML</h4>
        <div className="bg-muted p-4 rounded-md overflow-x-auto">
          <pre className="text-xs">{data.XML}</pre>
        </div>
      </div>
    </div>
  );
};

const formatXml = (xml: string) => {
  if (!xml) return "";
  let formatted = '';
  const reg = /(>)(<)(\/*)/g;
  xml = xml.replace(reg, '$1\r\n$2$3');
  let pad = 0;
  xml.split('\r\n').forEach(function(node) {
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
  return (
    <div className="rounded-md border bg-muted p-4 overflow-auto max-h-[600px]">
      <pre className="text-xs font-mono whitespace-pre-wrap break-all">{formattedXml}</pre>
    </div>
  );
};

const ReceiveXmlWizardDialogWrapper = ({ row }: { row: XmlItem }) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700" title="Receber NF pelo XML">
          <Play className="h-4 w-4" />
          <span className="sr-only">Receber NF</span>
        </Button>
      </DialogTrigger>
      <ReceiveXmlWizard xmlItem={row} open={open} onOpenChange={setOpen} />
    </Dialog>
  );
};

export const columns: ColumnDef<XmlItem>[] = [
  {
    id: "select",
    header: ({ table }) => null, 
    cell: ({ row, table }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => {
          if (value) {
            table.toggleAllRowsSelected(false); 
            row.toggleSelected(true); 
          } else {
            row.toggleSelected(false);
          }
        }}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "ID",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          ID
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "NUMERO",
    header: "Número",
  },
  {
    accessorKey: "CODCFO",
    header: "Fornecedor",
  },
  {
    accessorKey: "DATAEMISSAO",
    header: "Emissão",
    cell: ({ row }) => formatarData(row.getValue("DATAEMISSAO")),
  },
  {
    accessorKey: "STATUS",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("STATUS") as string;
      return (
        <Badge variant="outline">{status === "V" ? "Validado" : status}</Badge>
      );
    },
  },
  {
    accessorKey: "IDMOV",
    header: "ID Movimento",
    cell: ({ row }) => {
      const idmov = row.getValue("IDMOV");
      return idmov ? (
        <Badge className="bg-green-600 hover:bg-green-700">NF Recebida: {String(idmov)}</Badge>
      ) : (
        <span className="text-muted-foreground italic text-xs">NF não Recebida</span>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-2">
          <ReceiveXmlWizardDialogWrapper row={row.original} />
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" title="Visualizar Ordens de Compra">
                <ShoppingCart className="h-4 w-4" />
                <span className="sr-only">Ordens de Compra</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[90vw] w-full max-h-[90vh] flex flex-col sm:max-w-4xl">
              <DialogHeader>
                <DialogTitle>Ordens de Compra - Fornecedor {row.original.CODCFO}</DialogTitle>
                <DialogDescription>
                  Ordens de compra pendentes para este fornecedor.
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto">
                  <PurchaseOrderDialog codcfo={row.original.CODCFO} />
              </div>
            </DialogContent>
          </Dialog>

           <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" title="Visualizar Itens">
                <List className="h-4 w-4" />
                <span className="sr-only">Itens</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[90vw] w-full max-h-[90vh] flex flex-col sm:max-w-4xl">
              <DialogHeader>
                <DialogTitle>Itens da Nota Fiscal</DialogTitle>
                <DialogDescription>
                  Produtos e serviços listados no XML.
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto">
                  <NfeItemsDialog xmlContent={row.original.XML} />
              </div>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" title="Visualizar XML">
                <FileCode className="h-4 w-4" />
                <span className="sr-only">XML</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[90vw] w-full max-h-[90vh] flex flex-col sm:max-w-4xl">
              <DialogHeader>
                <DialogTitle>Conteúdo do XML</DialogTitle>
                <DialogDescription>
                  Visualização formatada do arquivo XML.
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto">
                  <XmlContentDialog xmlContent={row.original.XML} />
              </div>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" title="Visualizar Detalhes">
                <Eye className="h-4 w-4" />
                <span className="sr-only">Detalhes</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[90vw] w-full max-h-[90vh] flex flex-col sm:max-w-4xl">
              <DialogHeader>
                <DialogTitle>Detalhes da Importação XML</DialogTitle>
                <DialogDescription>
                  Informações detalhadas do arquivo importado.
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto">
                  <XmlDetails data={row.original} />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      );
    },
  },
];

export default function ImportacaoXmlPage() {
  const [items, setItems] = useState<XmlItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const endpoint = await EndpointService.getDefaultEndpoint();
      const token = AuthService.getStoredToken();

      if (!token) {
        toast({
          title: "Erro de autenticação",
          description: "Você precisa estar logado para acessar esta página.",
          variant: "destructive",
        });
        return;
      }

      const path = "/api/framework/v1/consultaSQLServer/RealizaConsulta/SIT.PORTALRM.008/1/T";
      const fullUrl = `/api/proxy?endpoint=${encodeURIComponent(endpoint)}&path=${encodeURIComponent(path)}&token=${encodeURIComponent(token.access_token)}`;

      const response = await fetch(fullUrl);
      if (!response.ok) {
        throw new Error("Falha ao buscar dados");
      }

      const data = await response.json();
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setItems(data);
      } else if (data && typeof data === 'object') {
        // Sometimes APIs return a single object or wrapped response
        setItems([data]); 
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados de importação XML.",
        variant: "destructive",
      });
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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">XML NFe</h1>
          <p className="text-muted-foreground">
            Visualize e gerencie as importações de arquivos XML.
          </p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm" className="h-8 gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <Card className="border-none bg-black/40 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-white">Importação de Arquivo XML</CardTitle>
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
