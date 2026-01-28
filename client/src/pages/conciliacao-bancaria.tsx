import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Upload, Search, ArrowRightLeft, Link as LinkIcon, Plus, FileUp, RefreshCw, AlertCircle } from "lucide-react";
import { parseOfx, OfxTransaction } from "@/lib/ofx-parser";
import { AuthService } from "@/lib/auth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getTenant } from "@/lib/tenant";
import { ColigadaSelector } from "@/components/coligada-selector";

interface ContaCaixa {
  CODCXA: string;
  DESCRICAO: string;
  CODCOLIGADA: number;
}

interface ErpTransaction {
  IDXCX?: number;
  IDMOV: number;
  NUMERODOCUMENTO: string;
  DATA?: string;
  VALOR?: number;
  TIPO?: number;
  RECONCILIADO?: number;
  DATAEMISSAO?: string;
  DATAVENCIMENTO?: string;
  VALORORIGINAL?: number;
  HISTORICO: string;
  PAGREC?: number; // 1 - Pagar (Saída), 2 - Receber (Entrada) - Ajustar conforme retorno real
  COMPENSADO?: string;
  CODCXA: string;
}

export default function ConciliacaoBancaria() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  // Filtros
  const [coligada, setColigada] = useState<number>(1);
  const [contaCaixa, setContaCaixa] = useState<string>("");
  const [dataInicial, setDataInicial] = useState<string>("");
  const [dataFinal, setDataFinal] = useState<string>("");
  const [contasDisponiveis, setContasDisponiveis] = useState<ContaCaixa[]>([]);
  
  // Dados
  const [ofxTransactions, setOfxTransactions] = useState<OfxTransaction[]>([]);
  const [erpTransactions, setErpTransactions] = useState<ErpTransaction[]>([]);
  const [ofxBalance, setOfxBalance] = useState<number | null>(null);
  
  // Seleção
  const [selectedOfx, setSelectedOfx] = useState<string[]>([]);
  const [selectedErp, setSelectedErp] = useState<number[]>([]);
  const [matches, setMatches] = useState<Record<string, number[]>>({});

  // Carregar Contas Caixas
  useEffect(() => {
    const fetchContas = async () => {
      if (!coligada || isNaN(coligada)) {
          console.warn("Coligada inválida para busca de contas caixa:", coligada);
          return;
      }

      console.log(`Buscando contas caixa para coligada: ${coligada}`);
      
      try {
        const token = AuthService.getStoredToken();
        if (!token || !token.environmentId) {
            console.error("Token ou EnvironmentId ausentes");
            return;
        }
        
        const dataPath = `/api/framework/v1/consultaSQLServer/RealizaConsulta/SIT.PORTALRM.017/${coligada}/T`;
        console.log("URL Consulta Contas:", dataPath);
        
        const response = await fetch(
            `/api/proxy?environmentId=${encodeURIComponent(token.environmentId)}&path=${encodeURIComponent(dataPath)}&token=${encodeURIComponent(token.access_token)}`,
            {
                headers: {
                    ...(getTenant() ? { 'X-Tenant': getTenant()! } : {})
                }
            }
        );
        
        if (response.ok) {
            const json = await response.json();
            console.log("Contas Caixa retornadas:", json);
            
            let items: ContaCaixa[] = [];
            if (Array.isArray(json)) {
                items = json;
            } else if (json && Array.isArray(json.data)) {
                items = json.data;
            }
            
            setContasDisponiveis(items);
            
            // Se tiver apenas uma conta, seleciona automaticamente (opcional, mas útil)
            /*
            if (items.length === 1 && !contaCaixa) {
                setContaCaixa(items[0].CODCXA);
            }
            */
        } else {
            console.error("Erro na resposta da API de contas caixa:", response.status, response.statusText);
            const text = await response.text();
            console.error("Detalhes do erro:", text);
        }
      } catch (error) {
        console.error("Erro ao carregar contas caixa", error);
        toast({
            title: "Erro",
            description: "Falha ao carregar contas caixa. Verifique o console.",
            variant: "destructive"
        });
      }
    };
    
    fetchContas();
  }, [coligada]);

  // Upload OFX
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = parseOfx(content);
        setOfxTransactions(data.transactions);
        setOfxBalance(data.balance);
        
        // Sugerir datas com base no OFX
        if (data.transactions.length > 0) {
            const dates = data.transactions.map(t => t.date.getTime());
            const minDate = new Date(Math.min(...dates));
            const maxDate = new Date(Math.max(...dates));
            
            const minDateStr = format(minDate, 'yyyy-MM-dd');
            const maxDateStr = format(maxDate, 'yyyy-MM-dd');
            
            setDataInicial(minDateStr);
            setDataFinal(maxDateStr);

            toast({
                title: "Arquivo processado",
                description: `${data.transactions.length} transações. Período: ${format(minDate, 'dd/MM/yyyy')} a ${format(maxDate, 'dd/MM/yyyy')}`,
            });
        } else {
            toast({
                title: "Arquivo processado",
                description: `${data.transactions.length} transações encontradas.`,
            });
        }
      } catch (error) {
        toast({
            title: "Erro ao ler arquivo",
            description: "Formato inválido ou corrompido.",
            variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
  };

  // Buscar ERP
  const handleSearchErp = async () => {
    if (!contaCaixa || !dataInicial || !dataFinal) {
        toast({
            title: "Campos obrigatórios",
            description: "Selecione Conta Caixa e Período.",
            variant: "destructive"
        });
        return;
    }

    setLoading(true);
    try {
        const token = AuthService.getStoredToken();
        if (!token || !token.environmentId) {
             toast({ title: "Erro", description: "Ambiente não configurado", variant: "destructive" });
             return;
        }

        const dataInicialErp = toErpDate(dataInicial);
        const dataFinalErp = toErpDate(dataFinal);
        const params = `CODCOLIGADA=${coligada};DATA_INICIAL=${dataInicialErp};DATA_FINAL=${dataFinalErp};CODCXA=${contaCaixa}`;
        const dataPath = `/api/framework/v1/consultaSQLServer/RealizaConsulta/SIT.PORTALRM.023/${coligada}/T?parameters=${params}`;
        
        const response = await fetch(
            `/api/proxy?environmentId=${encodeURIComponent(token.environmentId)}&path=${encodeURIComponent(dataPath)}&token=${encodeURIComponent(token.access_token)}`,
            {
                headers: {
                    ...(getTenant() ? { 'X-Tenant': getTenant()! } : {})
                }
            }
        );
        
        if (response.ok) {
            const json = await response.json();
            const loadedErp = Array.isArray(json) ? json : [];
            setErpTransactions(loadedErp);

            // Auto-vincular registros já conciliados (RECONCILIADO = 1)
            const newMatches: Record<string, number[]> = {};
            const usedOfxIds = new Set<string>();

            loadedErp.forEach((erpItem, erpIndex) => {
                if (erpItem.RECONCILIADO === 1) {
                    const erpValor = getErpValor(erpItem);
                    // Procura match no OFX pelo valor
                    const ofxMatch = ofxTransactions.find(ofx => {
                        if (usedOfxIds.has(ofx.id)) return false;
                        const diff = Math.abs(Math.abs(ofx.amount) - Math.abs(erpValor));
                        return diff < 0.01;
                    });

                    if (ofxMatch) {
                        if (!newMatches[ofxMatch.id]) {
                            newMatches[ofxMatch.id] = [];
                        }
                        newMatches[ofxMatch.id].push(erpIndex);
                        usedOfxIds.add(ofxMatch.id);
                    }
                }
            });

            if (Object.keys(newMatches).length > 0) {
                setMatches(prev => ({ ...prev, ...newMatches }));
                toast({
                    title: "Auto-vinculação",
                    description: `${Object.keys(newMatches).length} registros já conciliados foram vinculados automaticamente.`
                });
            }

            if (!Array.isArray(json) || json.length === 0) {
                toast({ title: "Aviso", description: "Nenhum lançamento encontrado no ERP para este período." });
            }
        } else {
            const errorText = await response.text().catch(() => "");
            console.error("Erro ao buscar dados do ERP", response.status, errorText);
            throw new Error("Erro na requisição");
        }
    } catch (error) {
        console.error(error);
        toast({
            title: "Erro",
            description: "Falha ao buscar dados do ERP.",
            variant: "destructive"
        });
        setErpTransactions([]);
    } finally {
        setLoading(false);
    }
  };

  const handleConciliate = () => {
    if (selectedOfx.length !== 1 || selectedErp.length === 0) {
      toast({
        title: "Seleção inválida",
        description: "Selecione 1 item do OFX e 1 ou mais itens do ERP.",
        variant: "destructive",
      });
      return;
    }

    const ofxId = selectedOfx[0];
    const ofxItem = ofxTransactions.find((t) => t.id === ofxId);

    if (!ofxItem) {
      toast({
        title: "Erro",
        description: "Não foi possível localizar o lançamento OFX selecionado.",
        variant: "destructive",
      });
      return;
    }

    const ofxValor = ofxItem.amount;
    const erpValores = selectedErp.map((index) => {
      const item = erpTransactions[index];
      return item ? getErpValor(item) : 0;
    });
    const somaErp = erpValores.reduce((acc, v) => acc + v, 0);

    const diff = Math.abs(somaErp - ofxValor);
    if (diff > 0.009) {
      toast({
        title: "Valores não conferem",
        description: `Valor OFX: ${formatMoney(ofxValor)} | Soma ERP: ${formatMoney(somaErp)}`,
        variant: "destructive",
      });
      return;
    }

    setMatches((prev) => {
      const atuais = prev[ofxId] || [];
      return { ...prev, [ofxId]: [...atuais, ...selectedErp] };
    });
    setSelectedOfx([]);
    setSelectedErp([]);

    toast({
      title: "Conciliado",
      description: "Lançamentos vinculados com sucesso.",
    });
  };

  const handleFinishConciliation = async () => {
    // Identificar itens vinculados (matches) que ainda não estão RECONCILIADO=1 no ERP
    const itemsToUpdate: ErpTransaction[] = [];
    const processedIndices = new Set<number>();

    Object.values(matches).forEach(indices => {
        indices.forEach(idx => {
            if (processedIndices.has(idx)) return;
            processedIndices.add(idx);
            
            const item = erpTransactions[idx];
            // Se ainda não está reconciliado no ERP (ou queremos forçar a atualização)
            if (item && item.RECONCILIADO !== 1) {
                itemsToUpdate.push(item);
            }
        });
    });

    if (itemsToUpdate.length === 0) {
        toast({
            title: "Nada a processar",
            description: "Todos os itens vinculados já estão conciliados no ERP.",
        });
        return;
    }

    setLoading(true);
    let successCount = 0;
    let errorCount = 0;

    try {
        const token = AuthService.getStoredToken();
        if (!token || !token.environmentId) throw new Error("Não autenticado ou ambiente não selecionado");
        const username = token.username || "mestre";
        const soapPath = "/wsDataServer/IwsDataServer";
        const proxyUrl = `/api/proxy-soap?environmentId=${encodeURIComponent(token.environmentId)}&path=${encodeURIComponent(soapPath)}&token=${encodeURIComponent(token.access_token)}`;

        for (const item of itemsToUpdate) {
            try {
                // Formatar dados para o XML
                const valor = getErpValor(item).toFixed(4).replace(".", ",");
                
                // Data formatada para YYYY-MM-DDTHH:mm:ss
                // Se vier do ERP como 2026-01-12T00:00:00, usamos direto. Se não, tentamos formatar.
                let dataXml = item.DATA || "";
                if (!dataXml.includes("T")) {
                     // Fallback simples se vier incompleta
                     dataXml = `${dataXml}T00:00:00`;
                } else {
                     // Cortar timezone se houver
                     dataXml = dataXml.split("+")[0].split("Z")[0];
                }

                const xmlBody = `
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tot="http://www.totvs.com/"> 
    <soapenv:Header/> 
    <soapenv:Body> 
       <tot:SaveRecord> 
          <tot:DataServerName>FinXCXData</tot:DataServerName> 
          <tot:XML><![CDATA[<FinXCX> 
   <FXCX> 
     <CODCOLIGADA>${coligada}</CODCOLIGADA> 
     <IDXCX>${item.IDXCX}</IDXCX> 
     <NUMERODOCUMENTO>${escapeXml(item.NUMERODOCUMENTO || "")}</NUMERODOCUMENTO> 
     <TIPO>${item.TIPO || 0}</TIPO> 
     <COMPENSADO>1</COMPENSADO> 
     <RECONCILIADO>1</RECONCILIADO> 
     <STATUSEXPORTACAO>0</STATUSEXPORTACAO> 
     <HISTORICO>${escapeXml(item.HISTORICO || "")}</HISTORICO> 
     <CODCOLCXA>${coligada}</CODCOLCXA> 
     <CODCXA>${contaCaixa}</CODCXA> 
     <CODFILIAL>1</CODFILIAL> 
     <VALOR>${valor}</VALOR> 
     <VALORCONTABIL>${valor}</VALORCONTABIL> 
     <VALOREMREAIS>${valor}</VALOREMREAIS> 
     <DATA>${dataXml}</DATA> 
     <DATACOMPENSACAO>${dataXml}</DATACOMPENSACAO> 
     <CONTABIL>0</CONTABIL> 
     <ECHEQUE>0</ECHEQUE> 
     <PREDATADO>0</PREDATADO> 
     <CHEQUEIMPRESSO>0</CHEQUEIMPRESSO> 
     <TIPOCUSTODIA>0</TIPOCUSTODIA> 
     <ESTORNADO>0</ESTORNADO> 
     <LIBERACAOAUTORIZADA>0</LIBERACAOAUTORIZADA> 
     <USUARIOCRIACAO>${username}</USUARIOCRIACAO> 
     <STATUSORCAMENTO>0</STATUSORCAMENTO> 
     <MODELOCONTABILIZACAO>0</MODELOCONTABILIZACAO> 
     <STATUSAVP>0</STATUSAVP> 
     <STATUSESTORNO>0</STATUSESTORNO> 
   </FXCX> 
 </FinXCX>]]></tot:XML> 
          <tot:Contexto>CODCOLIGADA=${coligada};CODUSUARIO='${username}';CODSISTEMA=F</tot:Contexto> 
       </tot:SaveRecord> 
    </soapenv:Body> 
</soapenv:Envelope>`;

                const response = await fetch(proxyUrl, {
                    method: "POST",
                    headers: { 
                        "Content-Type": "application/json",
                        ...(getTenant() ? { 'X-Tenant': getTenant()! } : {})
                    },
                    body: JSON.stringify({
                        xml: xmlBody,
                        action: "http://www.totvs.com/IwsDataServer/SaveRecord"
                    })
                });

                const responseText = await response.text();
                if (responseText.includes("SaveRecordResult") && !responseText.includes("<faultstring>")) {
                    successCount++;
                } else {
                    console.error("Erro ao atualizar item", item.IDXCX, responseText);
                    errorCount++;
                }
            } catch (err) {
                console.error("Erro na requisição SOAP para item", item.IDXCX, err);
                errorCount++;
            }
        }

        toast({
            title: "Processamento concluído",
            description: `${successCount} atualizados com sucesso. ${errorCount} erros.`,
            variant: errorCount > 0 ? "destructive" : "default"
        });

        // Recarregar a grid para refletir as alterações
        handleSearchErp();

    } catch (error) {
        toast({
            title: "Erro Geral",
            description: "Falha ao processar conciliação.",
            variant: "destructive"
        });
    } finally {
        setLoading(false);
    }
  };

  const isConciliated = (ofxId: string) => {
    const itens = matches[ofxId];
    return Array.isArray(itens) && itens.length > 0;
  };

  const isErpIndexLinked = (index: number) => {
    return Object.values(matches).some((lista) => lista.includes(index));
  };

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
  };

  const formatErpDate = (raw: string) => {
    if (!raw) return "-";
    const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const [, year, month, day] = match;
      return `${day}/${month}/${year}`;
    }
    const parsed = new Date(raw);
    if (isNaN(parsed.getTime())) {
      return raw;
    }
    return parsed.toLocaleDateString("pt-BR");
  };

  const toErpDate = (value: string) => {
    if (!value) return "";
    const parts = value.split("-");
    if (parts.length !== 3) return value;
    const [year, month, day] = parts;
    return `${month}/${day}/${year}`;
  };

  const getErpValor = (t: ErpTransaction) => {
    if (typeof t.VALOR === "number") return t.VALOR;
    if (typeof t.VALORORIGINAL === "number") return t.VALORORIGINAL;
    return 0;
  };

  const getTipoDescricao = (tipo?: number) => {
    switch (tipo) {
      case 0:
        return "Nada";
      case 1:
        return "Saque";
      case 2:
        return "Depósito";
      case 3:
        return "Saque Transferência";
      case 4:
        return "Depósito Transferência";
      case 5:
        return "Depósito na Baixa";
      case 6:
        return "Saque na Baixa";
      case 7:
        return "Saque do Cheque";
      case 8:
        return "Depósito Cancel. de Baixa";
      case 9:
        return "Saque Cancelamento de Baixa";
      case 10:
        return "Depósito Cancel. de Cheque";
      case 11:
        return "Saque CPMF";
      case 12:
        return "Recebimento via Cheque";
      case 13:
        return "Saque Cancel. Dep. Cheque";
      case 14:
        return "Depósito Cancel. CPMF";
      case 15:
        return "Desconto em Aberto";
      case 16:
        return "Desconto Efetivado";
      case 17:
        return "Devolução de Desconto";
      default:
        return tipo !== undefined && tipo !== null ? String(tipo) : "-";
    }
  };

  const getConciliadoLabel = (value?: number) => {
    if (value === 1) return "Sim";
    if (value === 0) return "Não";
    return "-";
  };

  const getOfxDocumento = (t: OfxTransaction) => {
    return t.id;
  };

  const escapeXml = (unsafe: string) => {
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
  };

  const handleIncludeInErp = async () => {
    if (selectedOfx.length !== 1) {
        toast({
            title: "Seleção inválida",
            description: "Selecione apenas 1 lançamento do OFX para incluir.",
            variant: "destructive"
        });
        return;
    }

    if (!coligada || !contaCaixa) {
        toast({
            title: "Dados incompletos",
            description: "Selecione a Coligada e a Conta Caixa.",
            variant: "destructive"
        });
        return;
    }

    const ofxId = selectedOfx[0];
    const ofxItem = ofxTransactions.find(t => t.id === ofxId);

    if (!ofxItem) return;

    setLoading(true);
    try {
        const token = AuthService.getStoredToken();
        if (!token || !token.environmentId) {
            throw new Error("Usuário não autenticado ou ambiente não selecionado");
        }

        const username = token.username || "mestre";
        
        // Formatar valores
        const valorNumber = Math.abs(ofxItem.amount);
        const valor = valorNumber.toFixed(4).replace(".", ",");
        const year = ofxItem.date.getFullYear();
        const month = String(ofxItem.date.getMonth() + 1).padStart(2, "0");
        const day = String(ofxItem.date.getDate()).padStart(2, "0");
        const data = `${year}-${month}-${day}T00:00:00`;
        const tipo = ofxItem.amount >= 0 ? 2 : 1;
        
        // NUMERODOCUMENTO deve ter sempre 10 caracteres, pegando da direita para a esquerda
        const rawDoc = ofxItem.id ?? "";
        const numDocumento = escapeXml(rawDoc.slice(-10));
        const historico = escapeXml(ofxItem.description); 

        const xmlBody = `
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tot="http://www.totvs.com/"> 
    <soapenv:Header/> 
    <soapenv:Body> 
       <tot:SaveRecord> 
          <tot:DataServerName>FinXCXData</tot:DataServerName> 
          <tot:XML><![CDATA[<FinXCX> 
   <FXCX> 
     <CODCOLIGADA>${coligada}</CODCOLIGADA> 
     <IDXCX>-1</IDXCX> 
     <NUMERODOCUMENTO>${numDocumento}</NUMERODOCUMENTO> 
     <TIPO>${tipo}</TIPO> 
     <COMPENSADO>1</COMPENSADO> 
     <RECONCILIADO>1</RECONCILIADO> 
     <STATUSEXPORTACAO>0</STATUSEXPORTACAO> 
     <HISTORICO>${historico}</HISTORICO> 
     <CODCOLCXA>${coligada}</CODCOLCXA> 
     <CODCXA>${contaCaixa}</CODCXA> 
     <CODFILIAL>1</CODFILIAL> 
     <VALOR>${valor}</VALOR> 
     <VALORCONTABIL>${valor}</VALORCONTABIL> 
     <VALOREMREAIS>${valor}</VALOREMREAIS> 
     <DATA>${data}</DATA> 
     <DATACOMPENSACAO>${data}</DATACOMPENSACAO> 
     <CONTABIL>0</CONTABIL> 
     <ECHEQUE>0</ECHEQUE> 
     <PREDATADO>0</PREDATADO> 
     <CHEQUEIMPRESSO>0</CHEQUEIMPRESSO> 
     <TIPOCUSTODIA>0</TIPOCUSTODIA> 
     <ESTORNADO>0</ESTORNADO> 
     <LIBERACAOAUTORIZADA>0</LIBERACAOAUTORIZADA> 
     <USUARIOCRIACAO>${username}</USUARIOCRIACAO> 
     <STATUSORCAMENTO>0</STATUSORCAMENTO> 
     <MODELOCONTABILIZACAO>0</MODELOCONTABILIZACAO> 
     <STATUSAVP>0</STATUSAVP> 
     <STATUSESTORNO>0</STATUSESTORNO> 
   </FXCX> 
 </FinXCX>]]></tot:XML> 
          <tot:Contexto>CODCOLIGADA=${coligada};CODUSUARIO='${username}';CODSISTEMA=F</tot:Contexto> 
       </tot:SaveRecord> 
    </soapenv:Body> 
 </soapenv:Envelope>`;

        const soapPath = "/wsDataServer/IwsDataServer";
        const proxyUrl = `/api/proxy-soap?endpoint=${encodeURIComponent(endpoint)}&path=${encodeURIComponent(soapPath)}&token=${encodeURIComponent(token.access_token)}`;

        const response = await fetch(proxyUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                xml: xmlBody,
                action: "http://www.totvs.com/IwsDataServer/SaveRecord"
            })
        });

        const responseText = await response.text();

        if (!response.ok) {
            throw new Error(`Erro na requisição: ${response.status} - ${responseText}`);
        }

        if (responseText.includes("SaveRecordResult") && !responseText.includes("<faultstring>")) {
            toast({
                title: "Sucesso",
                description: "Lançamento incluído no ERP com sucesso!",
            });

            try {
                const dataInicialErp = toErpDate(dataInicial);
                const dataFinalErp = toErpDate(dataFinal);
                const params = `CODCOLIGADA=${coligada};DATA_INICIAL=${dataInicialErp};DATA_FINAL=${dataFinalErp};CODCXA=${contaCaixa}`;
                const dataPath = `/api/framework/v1/consultaSQLServer/RealizaConsulta/SIT.PORTALRM.023/${coligada}/T?parameters=${params}`;

                const erpResponse = await fetch(
                    `/api/proxy?endpoint=${encodeURIComponent(endpoint)}&path=${encodeURIComponent(dataPath)}&token=${encodeURIComponent(token.access_token)}`
                );

                if (erpResponse.ok) {
                    const json = await erpResponse.json();
                    const lista: ErpTransaction[] = Array.isArray(json) ? json : [];
                    setErpTransactions(lista);

                    const novoIndex = lista.findIndex((t) => {
                        const docErp = (t.NUMERODOCUMENTO ?? "").toString();
                        const docErpLast10 = docErp.slice(-10);
                        const docOfxLast10 = numDocumento.slice(-10);
                        const sameDoc = docErpLast10 === docOfxLast10;

                        const valorErp = getErpValor(t);
                        const sameValor = Math.abs(Math.abs(valorErp) - valorNumber) < 0.01;

                        return sameDoc && sameValor;
                    });

                    if (novoIndex >= 0) {
                        setMatches((prev) => {
                            const atuais = prev[ofxId] || [];
                            if (atuais.includes(novoIndex)) return prev;
                            return { ...prev, [ofxId]: [...atuais, novoIndex] };
                        });
                    }
                }
            } catch (reloadError) {
                console.error("Erro ao recarregar ERP após inclusão:", reloadError);
            }

            setSelectedOfx([]);
            setSelectedErp([]);
        } else {
            console.error("Erro SOAP:", responseText);
            
            // Tentar extrair a mensagem de erro do XML
            let errorMessage = "Erro ao salvar registro no RM.";
            const faultStringMatch = responseText.match(/<faultstring>(.*?)<\/faultstring>/s);
            if (faultStringMatch && faultStringMatch[1]) {
                errorMessage = faultStringMatch[1].trim();
            }

            toast({
                title: "Erro ao Salvar",
                description: errorMessage,
                variant: "destructive"
            });
        }

    } catch (error: any) {
        console.error("Erro ao incluir no ERP:", error);
        toast({
            title: "Erro",
            description: error.message || "Falha ao incluir lançamento no ERP.",
            variant: "destructive"
        });
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col p-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header e Filtros */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
             <div className="flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold">Conciliação Bancária</h1>
             </div>
             <div className="flex items-center gap-2">
                {Object.keys(matches).length > 0 && (
                     <Button 
                         onClick={handleFinishConciliation} 
                         disabled={loading}
                         className="bg-green-600 hover:bg-green-700 text-white animate-in fade-in"
                     >
                         <CheckCircle className="mr-2 h-4 w-4" />
                         Concluir Conciliação
                     </Button>
                )}
                <label htmlFor="ofx-upload">
                    <Button variant="outline" className="cursor-pointer" asChild>
                        <span>
                            <Upload className="mr-2 h-4 w-4" />
                            Importar OFX
                        </span>
                    </Button>
                </label>
                <input 
                    id="ofx-upload" 
                    type="file" 
                    accept=".ofx,.OFX" 
                    className="hidden" 
                    onChange={handleFileUpload}
                />
             </div>
        </div>

        <Card>
            <CardContent className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="space-y-2">
                    <Label>Coligada</Label>
                    <ColigadaSelector 
                        value={coligada.toString()} 
                        onChange={(val) => setColigada(parseInt(val))} 
                    />
                </div>
                <div className="space-y-2">
                    <Label>Conta Caixa</Label>
                    <Select value={contaCaixa} onValueChange={setContaCaixa}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione a conta..." />
                        </SelectTrigger>
                        <SelectContent>
                            {contasDisponiveis.map(conta => (
                                <SelectItem key={conta.CODCXA} value={conta.CODCXA}>
                                    {conta.CODCXA} - {conta.DESCRICAO}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Período</Label>
                    <div className="flex gap-2">
                        <Input 
                            type="date" 
                            value={dataInicial} 
                            onChange={(e) => setDataInicial(e.target.value)} 
                        />
                        <Input 
                            type="date" 
                            value={dataFinal} 
                            onChange={(e) => setDataFinal(e.target.value)} 
                        />
                    </div>
                </div>
                <Button onClick={handleSearchErp} disabled={loading}>
                    {loading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                    Buscar Lançamentos
                </Button>
            </CardContent>
        </Card>
      </div>

      {/* Área de Conciliação */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-hidden">
        
        {/* Lado Esquerdo: Extrato OFX */}
        <Card className="flex flex-col overflow-hidden border-blue-500/20 shadow-sm">
            <CardHeader className="bg-muted/30 pb-3">
                <div className="flex justify-between items-center">
                    <div className="space-y-1">
                        <CardTitle className="text-base flex items-center gap-2">
                            <FileUp className="h-4 w-4 text-blue-500" />
                            Extrato Bancário (OFX)
                        </CardTitle>
                        <CardDescription>
                            {ofxTransactions.length} lançamentos importados
                        </CardDescription>
                    </div>
                    {ofxBalance !== null && (
                        <div className="text-right">
                            <div className="text-xs text-muted-foreground">Saldo Final</div>
                            <div className={cn("font-bold", ofxBalance < 0 ? "text-red-500" : "text-green-500")}>
                                {formatMoney(ofxBalance)}
                            </div>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-auto">
                {ofxTransactions.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8">
                        <Upload className="h-12 w-12 mb-4 opacity-20" />
                        <p>Importe um arquivo OFX para visualizar</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader className="sticky top-0 bg-background z-10">
                            <TableRow>
                                <TableHead className="w-[50px]"></TableHead>
                                <TableHead>Data</TableHead>
                                <TableHead>Documento</TableHead>
                                <TableHead>Descrição</TableHead>
                                <TableHead className="text-right">Valor</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {ofxTransactions.map((t) => {
                                const isLinked = isConciliated(t.id);
                                const isSelected = selectedOfx.includes(t.id);
                                return (
                                    <TableRow 
                                        key={t.id} 
                                        className={cn(
                                            "cursor-pointer transition-colors",
                                            isLinked ? "bg-green-500/10 hover:bg-green-500/20" : "",
                                            isSelected ? "bg-blue-500/10 hover:bg-blue-500/20" : ""
                                        )}
                                        onClick={() => {
                                            if (isLinked) return;
                                            setSelectedOfx(prev => 
                                                prev.includes(t.id) ? [] : [t.id]
                                            );
                                        }}
                                    >
                                        <TableCell>
                                            <Checkbox 
                                                checked={isSelected || isLinked} 
                                                disabled={isLinked}
                                                onCheckedChange={() => {
                                                    if (isLinked) return;
                                                    setSelectedOfx(prev => 
                                                        prev.includes(t.id) ? [] : [t.id]
                                                    );
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>{format(t.date, 'dd/MM/yyyy')}</TableCell>
                                        <TableCell className="max-w-[120px] truncate" title={getOfxDocumento(t)}>
                                          {getOfxDocumento(t)}
                                        </TableCell>
                                        <TableCell className="max-w-[200px] truncate" title={t.description}>{t.description}</TableCell>
                                        <TableCell className={cn("text-right font-medium", t.amount < 0 ? "text-red-500" : "text-green-500")}>
                                            {formatMoney(t.amount)}
                                        </TableCell>
                                        <TableCell className="flex items-center gap-2">
                                            {isLinked && <LinkIcon className="h-4 w-4 text-green-500" />}
                                            {!isLinked && !isSelected && <div className="w-4 h-4" />}
                                            {isLinked && (
                                              <Button 
                                                size="xs" 
                                                variant="outline" 
                                                className="h-6 px-2 text-xs"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setMatches((prev) => {
                                                    const novo = { ...prev };
                                                    delete novo[t.id];
                                                    return novo;
                                                  });
                                                }}
                                              >
                                                Desfazer
                                              </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>

        {/* Lado Direito: Sistema ERP */}
        <Card className="flex flex-col overflow-hidden border-orange-500/20 shadow-sm">
            <CardHeader className="bg-muted/30 pb-3">
                 <div className="flex justify-between items-center">
                    <div className="space-y-1">
                        <CardTitle className="text-base flex items-center gap-2">
                            <RefreshCw className="h-4 w-4 text-orange-500" />
                            Sistema ERP
                        </CardTitle>
                        <CardDescription>
                            {erpTransactions.length} lançamentos encontrados
                        </CardDescription>
                    </div>
                    {/* Botão de ação flutuante ou contextual poderia vir aqui */}
                    {(selectedOfx.length > 0 && selectedErp.length > 0) && (
                        <Button size="sm" onClick={handleConciliate} className="bg-green-600 hover:bg-green-700 text-white animate-in zoom-in duration-300">
                            <LinkIcon className="mr-2 h-4 w-4" />
                            Conciliar Selecionados
                        </Button>
                    )}
                    {(selectedOfx.length > 0 && selectedErp.length === 0) && (
                        <Button 
                            size="sm" 
                            variant="outline" 
                            className="border-orange-500 text-orange-500 hover:bg-orange-500/10"
                            onClick={handleIncludeInErp}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Incluir no ERP
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-auto">
                {erpTransactions.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8">
                        <AlertCircle className="h-12 w-12 mb-4 opacity-20" />
                        <p>Realize a busca para visualizar os lançamentos</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader className="sticky top-0 bg-background z-10">
                            <TableRow>
                                <TableHead className="w-[50px]"></TableHead>
                                <TableHead>ID</TableHead>
                                <TableHead>Data</TableHead>
                                <TableHead>Documento</TableHead>
                                <TableHead>Histórico</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Conciliado</TableHead>
                                <TableHead className="text-right">Valor</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {erpTransactions.map((t, index) => {
                                const isLinked = isErpIndexLinked(index);
                                const isSelected = selectedErp.includes(index);
                                
                                return (
                                    <TableRow 
                                        key={index}
                                        className={cn(
                                            "cursor-pointer transition-colors",
                                            isLinked ? "bg-green-500/10 hover:bg-green-500/20" : "",
                                            isSelected ? "bg-orange-500/10 hover:bg-orange-500/20" : ""
                                        )}
                                        onClick={() => {
                                            if (isLinked) return;
                                            setSelectedErp(prev =>
                                                prev.includes(index)
                                                    ? prev.filter(id => id !== index)
                                                    : [...prev, index]
                                            );
                                        }}
                                    >
                                        <TableCell>
                                            <Checkbox 
                                                checked={isSelected || isLinked}
                                                disabled={isLinked}
                                                onCheckedChange={() => {
                                                    if (isLinked) return;
                                                    setSelectedErp(prev =>
                                                        prev.includes(index)
                                                            ? prev.filter(id => id !== index)
                                                            : [...prev, index]
                                                    );
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>{t.IDXCX}</TableCell>
                                        <TableCell>{formatErpDate(t.DATA || t.DATAEMISSAO || "")}</TableCell>
                                        <TableCell>{t.NUMERODOCUMENTO}</TableCell>
                                        <TableCell className="max-w-[150px] truncate" title={t.HISTORICO}>{t.HISTORICO}</TableCell>
                                        <TableCell>{getTipoDescricao(t.TIPO)}</TableCell>
                                        <TableCell>{getConciliadoLabel(t.RECONCILIADO)}</TableCell>
                                        <TableCell className={cn("text-right font-medium", getErpValor(t) < 0 ? "text-red-500" : "text-green-500")}>
                                            {formatMoney(getErpValor(t))}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
      </div>

    </div>
  );
}
