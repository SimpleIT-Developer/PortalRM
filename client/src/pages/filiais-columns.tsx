import { ColumnDef } from "@tanstack/react-table";
import { Branch } from "@/lib/branches";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

// Helper function for CNPJ formatting
const formatCNPJ = (cnpj: string | undefined) => {
  if (!cnpj) return '-';
  const numbers = cnpj.replace(/\D/g, '');
  if (numbers.length !== 14) return cnpj;
  return numbers.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
};

const BranchDetails = ({ data }: { data: Branch }) => {
  return (
    <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground">ID Interno</h4>
          <p className="text-sm font-semibold">{data.BranchInternalId || "-"}</p>
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground">Coligada</h4>
          <p className="text-sm font-semibold">{data.CompanyCode}</p>
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground">Código</h4>
          <p className="text-sm font-semibold">{data.Code}</p>
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground">CNPJ</h4>
          <p className="text-sm font-semibold">{formatCNPJ(data.CGC)}</p>
        </div>
        <div className="col-span-2 space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground">Nome</h4>
          <p className="text-sm font-semibold">{data.Description}</p>
        </div>
        <div className="col-span-2 space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground">Nome Fantasia</h4>
          <p className="text-sm font-semibold">{data.Title || "-"}</p>
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground">Inscrição Estadual</h4>
          <p className="text-sm font-semibold">{data.StateRegistration || "-"}</p>
        </div>
         <div className="space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground">Telefone</h4>
          <p className="text-sm font-semibold">{data.Phone || "-"}</p>
        </div>
        <div className="col-span-2 space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground">Endereço</h4>
          <p className="text-sm font-semibold">
            {data.Street} {data.Complement ? `, ${data.Complement}` : ""}
          </p>
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground">Bairro</h4>
          <p className="text-sm font-semibold">{data.Neighborhood || "-"}</p>
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground">CEP</h4>
          <p className="text-sm font-semibold">{data.ZipCode || "-"}</p>
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground">Cidade</h4>
          <p className="text-sm font-semibold">{data.City || "-"}</p>
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground">UF</h4>
          <p className="text-sm font-semibold">{data.State || "-"}</p>
        </div>
      </div>
  );
};

export const columns: ColumnDef<Branch>[] = [
  {
    accessorKey: "CompanyCode",
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
  },
  {
    accessorKey: "Code",
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
  },
  {
    accessorKey: "Description",
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
  },
  {
    accessorKey: "Title",
    header: "Nome Fantasia",
    cell: ({ row }) => {
      return row.getValue("Title") || '-';
    }
  },
  {
    accessorKey: "CGC",
    header: "CNPJ",
    cell: ({ row }) => {
      return formatCNPJ(row.getValue("CGC"));
    }
  },
  {
    accessorKey: "State",
    header: "UF",
    cell: ({ row }) => {
      return row.getValue("State") || '-';
    }
  },
  {
    accessorKey: "City",
    header: "Cidade",
    cell: ({ row }) => {
      return row.getValue("City") || '-';
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
              <DialogTitle>Detalhes da Filial</DialogTitle>
              <DialogDescription>
                Informações completas do registro.
              </DialogDescription>
            </DialogHeader>
            <BranchDetails data={row.original} />
          </DialogContent>
        </Dialog>
      );
    },
  },
];
