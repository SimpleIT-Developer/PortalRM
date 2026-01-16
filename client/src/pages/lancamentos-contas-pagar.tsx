import { LancamentosFinanceiros } from "@/components/financeiro/lancamentos-financeiros";

export default function LancamentosContasPagar() {
  return (
    <LancamentosFinanceiros
      title="Contas a Pagar"
      description="Gerencie os lançamentos financeiros."
      endpoint="SIT.PORTALRM.018"
      defaultPagRec={2}
    />
  );
}
