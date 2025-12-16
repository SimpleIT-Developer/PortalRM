import { ColumnDef } from "@tanstack/react-table";
import { BudgetaryNature } from "@/lib/budgetary-nature";
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

const BudgetaryNatureDetails = ({ data }: { data: BudgetaryNature }) => {
  return (
    <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground">ID Interno</h4>
          <p className="text-sm font-semibold">{data.internalId}</p>
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground">Coligada</h4>
          <p className="text-sm font-semibold">{data.companyId}</p>
        </div>
        <div className="col-span-2 space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground">Código</h4>
          <p className="text-sm font-semibold">{data.code}</p>
        </div>
        <div className="col-span-2 space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground">Descrição</h4>
          <p className="text-sm font-semibold">{data.description}</p>
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground">Natureza</h4>
          <p className="text-sm font-semibold">{data.nature}</p>
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground">Tipo de Natureza</h4>
          <p className="text-sm font-semibold">{data.natureType}</p>
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
          <Badge variant={data.inactive ? "destructive" : "default"}>
             {data.inactive ? "Inativo" : "Ativo"}
          </Badge>
        </div>
         <div className="space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground">Permite Transferência</h4>
          <p className="text-sm font-semibold">{data.dontAllowTransfer ? "Não" : "Sim"}</p>
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground">Data de Criação</h4>
          <p className="text-sm font-semibold">{formatDate(data.recCreatedOn)}</p>
        </div>
        <div className="col-span-2 space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground">Última Modificação</h4>
          <p className="text-sm font-semibold">{formatDate(data.recModifiedOn)}</p>
        </div>
      </div>
  );
};

export const columns: ColumnDef<BudgetaryNature>[] = [
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
    accessorKey: "description",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Descrição
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <div className="pl-4">{row.getValue("description")}</div>,
  },
  {
    accessorKey: "nature",
    header: "Natureza",
    cell: ({ row }) => <div className="pl-4">{row.getValue("nature")}</div>,
  },
  {
    accessorKey: "natureType",
    header: "Tipo",
    cell: ({ row }) => <div className="pl-4">{row.getValue("natureType")}</div>,
  },
  {
    accessorKey: "inactive",
    header: "Status",
    cell: ({ row }) => {
      const isInactive = row.getValue("inactive");
      return (
        <Badge variant={isInactive ? "destructive" : "default"}>
          {isInactive ? "Inativo" : "Ativo"}
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
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Detalhes da Natureza Orçamentária</DialogTitle>
              <DialogDescription>
                Informações completas do registro.
              </DialogDescription>
            </DialogHeader>
            <BudgetaryNatureDetails data={row.original} />
          </DialogContent>
        </Dialog>
      );
    },
  },
];
