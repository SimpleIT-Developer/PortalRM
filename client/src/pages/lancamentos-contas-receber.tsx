import { LancamentosFinanceiros } from "@/components/financeiro/lancamentos-financeiros";

export default function LancamentosContasReceber() {
  return (
    <LancamentosFinanceiros
      title="Contas a Receber"
      description="Gerencie os lançamentos financeiros a receber."
      endpoint="SIT.PORTALRM.019"
      defaultPagRec={1}
    />
  );
}
