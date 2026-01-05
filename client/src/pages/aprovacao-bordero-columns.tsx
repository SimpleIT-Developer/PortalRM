import { useState, useEffect } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowUpDown, Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AuthService } from "@/lib/auth";
import { EndpointService } from "@/lib/endpoint";

export interface BorderoItem {
  CODCOLIGADA: number;
  CODCOLCXA: number;
  CODCXA: string;
  IDBORDERO: number;
  DESCRICAO: string;
  CODFILIAL: number;
  CODUSUARIO: string;
  DATA: string;
  VALIDADE: string;
  STATUSREMESSA: number;
  DATABASECOMUL: number;
  RECCREATEDBY: string;
  RECCREATEDON: string;
  RECMODIFIEDON: string;
  IDCONVENIO: number;
  CODCOLCONVENIO: number;
  [key: string]: any;
}

const formatarData = (dataString: string) => {
  if (!dataString) return "";
  try {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
  } catch (error) {
    return dataString;
  }
};

const getStatusLabel = (status: number) => {
  if (status === 0) return "Pendente";
  return status;
};

const formatCurrency = (value: number) => {
  if (value === undefined || value === null) return "";
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const BorderoDetails = ({ data }: { data: BorderoItem }) => {
  const [lancamentos, setLancamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchLancamentos = async () => {
      setLoading(true);
      try {
        const endpoint = await EndpointService.getDefaultEndpoint();
        const token = AuthService.getStoredToken();

        if (!token) return;

        const path = `/api/framework/v1/consultaSQLServer/RealizaConsulta/SIT.PORTALRM.007/1/T?parameters=IDBORDERO=${data.IDBORDERO}`;
        const fullUrl = `/api/proxy?endpoint=${encodeURIComponent(endpoint)}&path=${encodeURIComponent(path)}&token=${encodeURIComponent(token.access_token)}`;

        const response = await fetch(fullUrl);
        if (response.ok) {
           const result = await response.json();
           setLancamentos(Array.isArray(result) ? result : []);
        }
      } catch (error) {
        console.error("Erro ao buscar lançamentos:", error);
      } finally {
        setLoading(false);
      }
    };

    if (data.IDBORDERO) {
        fetchLancamentos();
    }
  }, [data.IDBORDERO]);

  const desiredColumns = [
    { key: "CODCOLIGADA", label: "Coligada" },
    { key: "IDLAN", label: "ID Lançamento" },
    { key: "NUMERODOCUMENTO", label: "Núm. Documento" },
    { key: "VALORORIGINAL", label: "Valor Original" },
    { key: "DATAVENCIMENTO", label: "Vencimento" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground">ID Borderô</h4>
          <p className="text-sm font-semibold">{data.IDBORDERO}</p>
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground">Coligada</h4>
          <p className="text-sm font-semibold">{data.CODCOLIGADA}</p>
        </div>
        <div className="col-span-2 space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground">Descrição</h4>
          <p className="text-sm font-semibold">{data.DESCRICAO}</p>
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground">Conta Caixa</h4>
          <p className="text-sm font-semibold">{data.CODCXA}</p>
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground">Filial</h4>
          <p className="text-sm font-semibold">{data.CODFILIAL}</p>
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground">Data</h4>
          <p className="text-sm font-semibold">{formatarData(data.DATA)}</p>
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground">Validade</h4>
          <p className="text-sm font-semibold">{formatarData(data.VALIDADE)}</p>
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground">Usuário</h4>
          <p className="text-sm font-semibold">{data.CODUSUARIO}</p>
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground">Status Remessa</h4>
          <Badge variant={data.STATUSREMESSA === 0 ? "secondary" : "outline"}>
            {getStatusLabel(data.STATUSREMESSA)}
          </Badge>
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground">Convênio</h4>
          <p className="text-sm font-semibold">{data.IDCONVENIO}</p>
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground">Criado Por</h4>
          <p className="text-sm font-semibold">{data.RECCREATEDBY}</p>
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground">Data Criação</h4>
          <p className="text-sm font-semibold">{formatarData(data.RECCREATEDON)}</p>
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground">Data Modificação</h4>
          <p className="text-sm font-semibold">{formatarData(data.RECMODIFIEDON)}</p>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="font-medium leading-none">Lançamentos do Borderô</h4>
        {loading ? (
           <div className="flex justify-center p-4">
             <Loader2 className="h-6 w-6 animate-spin" />
           </div>
        ) : (
           <div className="rounded-md border max-h-[200px] overflow-auto overflow-x-auto">
             <Table>
               <TableHeader>
                 <TableRow>
                   {desiredColumns.map(col => <TableHead key={col.key} className="whitespace-nowrap">{col.label}</TableHead>)}
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {lancamentos.length > 0 ? (
                   lancamentos.map((lanc, index) => (
                     <TableRow key={index}>
                       {desiredColumns.map(col => {
                         let value = lanc[col.key];
                         if (col.key === 'VALORORIGINAL') value = formatCurrency(value);
                         if (col.key === 'DATAVENCIMENTO') value = formatarData(value);
                         
                         return (
                           <TableCell key={`${index}-${col.key}`} className="whitespace-nowrap">
                             {value}
                           </TableCell>
                         );
                       })}
                     </TableRow>
                   ))
                 ) : (
                   <TableRow>
                      <TableCell colSpan={desiredColumns.length} className="text-center">
                        Nenhum lançamento encontrado.
                      </TableCell>
                   </TableRow>
                 )}
               </TableBody>
             </Table>
           </div>
        )}
      </div>
    </div>
  );
};

export const columns: ColumnDef<BorderoItem>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "IDBORDERO",
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
    accessorKey: "DESCRICAO",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Descrição
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "CODCXA",
    header: "Conta Caixa",
  },
  {
    accessorKey: "DATA",
    header: "Data",
    cell: ({ row }) => formatarData(row.getValue("DATA")),
  },
  {
    accessorKey: "VALIDADE",
    header: "Validade",
    cell: ({ row }) => formatarData(row.getValue("VALIDADE")),
  },
  {
    accessorKey: "STATUSREMESSA",
    header: "Status",
    cell: ({ row }) => {
        const status = row.getValue("STATUSREMESSA") as number;
        return (
          <Badge variant={status === 0 ? "secondary" : "outline"}>
            {getStatusLabel(status)}
          </Badge>
        );
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Eye className="h-4 w-4" />
              <span className="sr-only">Visualizar</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[90vw] w-full max-h-[90vh] flex flex-col sm:max-w-4xl">
            <DialogHeader>
              <DialogTitle>Detalhes do Borderô</DialogTitle>
              <DialogDescription>
                Informações completas do registro e lançamentos vinculados.
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto">
                <BorderoDetails data={row.original} />
            </div>
          </DialogContent>
        </Dialog>
      );
    },
  },
];
