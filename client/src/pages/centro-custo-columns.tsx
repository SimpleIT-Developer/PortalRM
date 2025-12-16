import { ColumnDef } from "@tanstack/react-table";
import { CostCenter } from "@/lib/cost-center";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ChevronRight, ChevronDown, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const formatDate = (dateString: string) => {
  if (!dateString) return "-";
  try {
    return format(new Date(dateString), "dd/MM/yyyy HH:mm:ss", { locale: ptBR });
  } catch {
    return dateString;
  }
};

const CostCenterDetails = ({ data }: { data: CostCenter }) => {
  return (
    <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground">ID</h4>
          <p className="text-sm font-semibold">{data.id}</p>
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground">Código</h4>
          <p className="text-sm font-semibold">{data.code}</p>
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground">Nome</h4>
          <p className="text-sm font-semibold">{data.name}</p>
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground">Código Reduzido</h4>
          <p className="text-sm font-semibold">{data.shortCode || "-"}</p>
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground">Empresa (ID)</h4>
          <p className="text-sm font-semibold">{data.companyId}</p>
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground">Classificação</h4>
          <p className="text-sm font-semibold">{data.classification || "-"}</p>
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground">Situação</h4>
          <Badge variant={data.registerSituation === "T" || data.registerSituation === "A" ? "default" : "destructive"}>
            {data.registerSituation === "T" || data.registerSituation === "A" ? "Ativo" : "Inativo"}
          </Badge>
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground">Permite Lançamento</h4>
          <Badge variant={data.allowEntry === "T" ? "outline" : "secondary"}>
             {data.allowEntry === "T" ? "Sim" : "Não"}
          </Badge>
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground">SPED</h4>
          <p className="text-sm font-semibold">{data.SPED || "-"}</p>
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground">Data de Criação</h4>
          <p className="text-sm font-semibold">{formatDate(data.createDate)}</p>
        </div>
        <div className="col-span-2 space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground">Última Modificação</h4>
          <p className="text-sm font-semibold">{formatDate(data.recordModifiedOn)}</p>
        </div>
      </div>
  );
};

export const columns: ColumnDef<CostCenter>[] = [
  {
    accessorKey: "code",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Código
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      return (
        <div 
          className="flex items-center pl-2" 
          style={{ paddingLeft: `${row.depth * 20}px` }}
        >
          {row.getCanExpand() ? (
            <button
              onClick={row.getToggleExpandedHandler()}
              className="mr-2 cursor-pointer p-1 hover:bg-muted rounded-sm"
            >
              {row.getIsExpanded() ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          ) : (
            <span className="w-6 mr-2" /> // Espaçador para alinhamento
          )}
          <span className="font-medium">{row.getValue("code")}</span>
        </div>
      );
    }
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Nome
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <div className="pl-4">{row.getValue("name")}</div>,
  },
  {
    accessorKey: "shortCode",
    header: "Reduzido",
    cell: ({ row }) => <div className="pl-4">{row.getValue("shortCode")}</div>,
  },
  {
    accessorKey: "registerSituation",
    header: "Situação",
    cell: ({ row }) => {
      const situation = row.getValue("registerSituation") as string;
      const isActive = situation === "A" || situation === "T"; 
      return (
        <Badge variant={isActive ? "default" : "destructive"}>
          {isActive ? "Ativo" : "Inativo"}
        </Badge>
      );
    }
  },
  {
    accessorKey: "allowEntry",
    header: "Permite Lançamento",
    cell: ({ row }) => {
      const allow = row.getValue("allowEntry") as string;
      return (
        <div className="pl-4">
            {allow === "T" ? "Sim" : "Não"}
        </div>
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
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Detalhes do Centro de Custo</DialogTitle>
              <DialogDescription>
                Informações completas do registro.
              </DialogDescription>
            </DialogHeader>
            <CostCenterDetails data={row.original} />
          </DialogContent>
        </Dialog>
      );
    },
  },
];
