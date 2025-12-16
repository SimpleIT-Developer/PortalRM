import { ColumnDef } from "@tanstack/react-table";
import { Branch } from "@/lib/branches";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";

// Helper function for CNPJ formatting
const formatCNPJ = (cnpj: string | undefined) => {
  if (!cnpj) return '-';
  const numbers = cnpj.replace(/\D/g, '');
  if (numbers.length !== 14) return cnpj;
  return numbers.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
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
  }
];
