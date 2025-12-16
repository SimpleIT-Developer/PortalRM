import { ColumnDef } from "@tanstack/react-table";
import { AccountingAccount } from "@/lib/accounting-plan";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, CheckCircle2, XCircle, ChevronRight, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const columns: ColumnDef<AccountingAccount>[] = [
  {
    accessorKey: "code",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Conta
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
    accessorKey: "companyId",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Coligada
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <div className="pl-4">{row.getValue("companyId")}</div>,
  },
  {
    accessorKey: "reduced",
    header: "Reduzida",
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
    cell: ({ row }) => {
      const isAnalytic = row.original.analytics === 1;
      return (
        <span className={isAnalytic ? "" : "font-bold"}>
          {row.getValue("description")}
        </span>
      );
    }
  },
  {
    accessorKey: "analytics",
    header: "Tipo",
    cell: ({ row }) => {
      const isAnalytic = row.getValue("analytics") === 1;
      return (
        <Badge variant={isAnalytic ? "default" : "secondary"}>
          {isAnalytic ? "Analítica" : "Sintética"}
        </Badge>
      );
    }
  },
  {
    accessorKey: "inactive",
    header: "Status",
    cell: ({ row }) => {
      const isInactive = row.getValue("inactive") === 1;
      return (
        <div className="flex items-center gap-2">
          {isInactive ? (
            <>
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-muted-foreground">Inativa</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Ativa</span>
            </>
          )}
        </div>
      );
    }
  }
];
