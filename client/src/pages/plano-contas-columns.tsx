import { ColumnDef } from "@tanstack/react-table";
import { AccountingAccount } from "@/lib/accounting-plan";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const columns: ColumnDef<AccountingAccount>[] = [
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
