import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, AlertCircle, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface Funcionario {
  CHAPA: string;
  CODSITUACAO: string;
  SALARIO: number;
  DATAADMISSAO: string;
  NOME: string;
  EMAIL: string;
  NOME_SECAO: string;
  CPF: string;
  JORNADA_MENSAL: number;
  NOMEFILIAL: string;
  NOMEDOCARGO: string;
  DTNASCIMENTO: string;
  NOMEDEPARTAMENTO: string;
}

// Funções de formatação auxiliares
const formatarData = (dataString: string) => {
  if (!dataString) return "";
  try {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
  } catch (error) {
    return dataString;
  }
};

const formatarMoeda = (valor: number) => {
  return valor?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || "";
};

const obterStatus = (codSituacao: string) => {
  const situacoes: Record<string, { label: string, variant: "default" | "outline" | "secondary" | "destructive", icon: any }> = {
    "A": { label: "Ativo", variant: "default", icon: CheckCircle2 },
    "D": { label: "Demitido", variant: "destructive", icon: XCircle },
    "F": { label: "Férias", variant: "secondary", icon: Clock },
    "L": { label: "Licença", variant: "outline", icon: AlertCircle },
  };

  return situacoes[codSituacao] || { label: codSituacao, variant: "outline", icon: AlertCircle };
};

export const columns: ColumnDef<Funcionario>[] = [
  {
    accessorKey: "CHAPA",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Chapa
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "NOME",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Nome
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "NOMEDOCARGO",
    header: "Cargo",
  },
  {
    accessorKey: "NOMEDEPARTAMENTO",
    header: "Departamento",
  },
  {
    accessorKey: "NOMEFILIAL",
    header: "Filial",
  },
  {
    accessorKey: "DATAADMISSAO",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Admissão
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => formatarData(row.getValue("DATAADMISSAO")),
  },
  {
    accessorKey: "SALARIO",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Salário
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("SALARIO"));
      return <div className="font-medium">{formatarMoeda(amount)}</div>;
    },
  },
  {
    accessorKey: "CODSITUACAO",
    header: "Status",
    cell: ({ row }) => {
      const status = obterStatus(row.getValue("CODSITUACAO"));
      const Icon = status.icon;
      
      return (
        <div className="flex items-center gap-2">
          <Badge variant={status.variant} className="flex gap-1 items-center">
            <Icon className="h-3 w-3" />
            {status.label}
          </Badge>
        </div>
      );
    },
  },
];
