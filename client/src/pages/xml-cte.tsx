import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Clock, 
  Download, 
  RefreshCw, 
  Eye, 
  Printer, 
  ArrowUpDown,
  Loader2
} from "lucide-react";
import { format } from "date-fns";

export interface CteDocument {
  id: number;
  status?: string;
  numero?: string;
  empresa?: string;
  fornecedor?: string;
  data_emissao?: string;
  valor?: number;
  integrado?: boolean;
  [key: string]: any;
}

export default function XmlCtePage() {
  const [data, setData] = useState<CteDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/cte');
      if (response.ok) {
        const result = await response.json();
        if (Array.isArray(result)) {
            setData(result);
        } else {
            console.error("Data format invalid:", result);
            setError("Formato de dados inválido recebido do servidor.");
        }
      } else {
        const errorText = await response.text();
        console.error("Failed to fetch CTe data:", response.status, errorText);
        setError(`Erro ao buscar dados: ${response.status} - ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error fetching CTe data:", error);
      setError("Erro de conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    try {
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch {
      return dateString;
    }
  };

  const columns: ColumnDef<CteDocument>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-[2px]"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-[2px]"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "status_icon",
      header: ({ column }) => (
        <Button variant="ghost" className="p-0 hover:bg-transparent" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Status <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const isCancelled = row.original.is_cancelled || (row.original.eventos_desc_evento && row.original.eventos_desc_evento.toLowerCase().includes("cancelamento"));
        
        if (isCancelled) {
             return (
                 <div className="flex justify-center" title="Cancelada">
                     <XCircle className="h-5 w-5 text-red-500" />
                 </div>
             );
        }

        const isIntegrated = row.original.cte_status_integracao === "S" || row.original.cte_status_integracao === 1 || row.original.integrado;
        
        if (isIntegrated) {
             return (
                 <div className="flex justify-center" title="Integrado">
                     <CheckCircle className="h-5 w-5 text-green-500" />
                 </div>
             );
        }

        return (
          <div className="flex justify-center" title="Pendente">
            <Clock className="h-5 w-5 text-yellow-500" />
          </div>
        );
      },
    },
    {
      accessorKey: "numero",
      header: "Número",
      cell: ({ row }) => <div className="font-medium">{row.getValue("numero") || row.original.cte_num || row.original.cte_numero || row.original.numero || "N/A"}</div>,
    },
    {
      accessorKey: "empresa",
      header: "Tomador (Empresa)",
      cell: ({ row }) => <div>{row.getValue("empresa") || row.original.cte_tom_raz_social || row.original.cte_tomador_nome || row.original.company_name || "N/A"}</div>,
    },
    {
      accessorKey: "fornecedor",
      header: "Transportadora",
      cell: ({ row }) => <div>{row.getValue("fornecedor") || row.original.cte_emit_raz_social || row.original.cte_emitente_nome || row.original.supplier_name || "N/A"}</div>,
    },
    {
      accessorKey: "data_emissao",
      header: "Data",
      cell: ({ row }) => {
        const dateVal = row.original.cte_emissao || row.getValue("data_emissao") || row.original.cte_data_emissao || row.original.cte_date_emi || row.original.issue_date;
        return <div>{formatDate(dateVal as string)}</div>;
      },
    },
    {
      accessorKey: "valor",
      header: "Valor",
      cell: ({ row }) => {
        const val = row.getValue("valor") || row.original.cte_valor_total || row.original.cte_valor || row.original.amount || 0;
        return <div>{formatCurrency(Number(val))}</div>;
      },
    },
    {
      accessorKey: "status_text",
      header: "Status",
      cell: ({ row }) => {
        // Check for cancellation
        if (row.original.is_cancelled || (row.original.eventos_desc_evento && row.original.eventos_desc_evento.toLowerCase().includes("cancelamento"))) {
          return (
            <Badge variant="destructive" className="bg-red-500 hover:bg-red-600">
              Cancelada
            </Badge>
          );
        }

        // Regra 1: Integrado
        const statusIntegracao = row.original.cte_status_integracao;
        if (statusIntegracao === 1 || statusIntegracao === '1' || statusIntegracao === 'S') {
          return (
            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
              Integrado
            </Badge>
          );
        }

        // Regra 2: Fornecedor não cadastrado
        // Tenta campos comuns de código de fornecedor/emitente
        const codCfo = row.original.cte_cod_cfo || row.original.cte_cod_emitente || row.original.cod_cfo;
        if (codCfo === null || codCfo === undefined || codCfo === '') {
          return (
            <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100">
              Fornecedor não cadastrado
            </Badge>
          );
        }

        return (
          <Badge 
            variant="outline" 
            className="bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100"
          >
            Pendente
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10">
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-green-400 hover:text-green-300 hover:bg-green-400/10">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10">
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-purple-400 hover:text-purple-300 hover:bg-purple-400/10">
              <Printer className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-white">Lista de CTe Recebidos</h1>
        </div>
        <Button variant="outline" onClick={fetchData} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Atualizar
        </Button>
      </div>
      
      <Card className="border-none bg-black/40 backdrop-blur-xl">
        <CardContent className="p-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-md mb-4">
              {error}
            </div>
          )}
          <DataTable 
            columns={columns} 
            data={data} 
            searchKey="empresa" 
            searchPlaceholder="Filtrar..."
            className="[&_th]:bg-transparent [&_th]:text-gray-400 [&_th]:font-medium [&_td]:text-gray-300 [&_tr]:border-white/5 [&_tr:hover]:bg-white/5"
          />
          {data.length === 0 && !loading && (
             <div className="text-center text-muted-foreground mt-4 text-sm">
                Nenhum dado encontrado. Verifique se a tabela 'cte' contém registros.
             </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
