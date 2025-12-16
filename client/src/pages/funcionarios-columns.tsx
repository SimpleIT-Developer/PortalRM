import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, AlertCircle, CheckCircle2, XCircle, Clock, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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

const FuncionarioDetails = ({ data }: { data: Funcionario }) => {
  const status = obterStatus(data.CODSITUACAO);
  const StatusIcon = status.icon;

  return (
    <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground">Chapa</h4>
          <p className="text-sm font-semibold">{data.CHAPA}</p>
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground">CPF</h4>
          <p className="text-sm font-semibold">{data.CPF}</p>
        </div>
        <div className="col-span-2 space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground">Nome</h4>
          <p className="text-sm font-semibold">{data.NOME}</p>
        </div>
        <div className="col-span-2 space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground">E-mail</h4>
          <p className="text-sm font-semibold">{data.EMAIL || "-"}</p>
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground">Cargo</h4>
          <p className="text-sm font-semibold">{data.NOMEDOCARGO}</p>
        </div>
         <div className="space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground">Salário</h4>
          <p className="text-sm font-semibold">{formatarMoeda(data.SALARIO)}</p>
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground">Departamento</h4>
          <p className="text-sm font-semibold">{data.NOMEDEPARTAMENTO}</p>
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground">Seção</h4>
          <p className="text-sm font-semibold">{data.NOME_SECAO}</p>
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground">Filial</h4>
          <p className="text-sm font-semibold">{data.NOMEFILIAL}</p>
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground">Situação</h4>
          <Badge variant={status.variant as any} className="flex w-fit items-center gap-1">
            <StatusIcon className="h-3 w-3" />
            {status.label}
          </Badge>
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground">Data Admissão</h4>
          <p className="text-sm font-semibold">{formatarData(data.DATAADMISSAO)}</p>
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground">Data Nascimento</h4>
          <p className="text-sm font-semibold">{formatarData(data.DTNASCIMENTO)}</p>
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground">Jornada Mensal</h4>
          <p className="text-sm font-semibold">{data.JORNADA_MENSAL}h</p>
        </div>
      </div>
  );
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
              <DialogTitle>Detalhes do Funcionário</DialogTitle>
              <DialogDescription>
                Informações completas do registro.
              </DialogDescription>
            </DialogHeader>
            <FuncionarioDetails data={row.original} />
          </DialogContent>
        </Dialog>
      );
    },
  },
];
