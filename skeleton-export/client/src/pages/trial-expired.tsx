import { Button } from "@/components/ui/button";
import { AnimatedLogo } from "@/components/simpledfe/animated-logo";
import { getTenant } from "@/lib/tenant";
import { AlertTriangle, HelpCircle, ArrowLeft } from "lucide-react";

export default function TrialExpiredPage() {
  const tenantKey = getTenant();

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col font-sans selection:bg-yellow-500/30">
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-yellow-600/10 rounded-full blur-[120px] mix-blend-screen animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-red-500/5 rounded-full blur-[150px] mix-blend-screen"></div>
      </div>

      <header className="container mx-auto px-6 py-6 flex justify-between items-center relative z-10 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
            <AnimatedLogo className="h-8 w-8 text-yellow-500" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            Portal <span className="text-yellow-500">RM</span>
          </span>
        </div>
        <div className="flex gap-4">
          <Button
            variant="ghost"
            className="text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            onClick={() => (window.location.href = "https://portalrm.simpleit.app.br")}
          >
            Ir para Home Principal
          </Button>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-6 flex flex-col items-center justify-center py-20 relative z-10 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-sm font-medium mb-8">
          <AlertTriangle className="h-4 w-4" />
          <span>Período de avaliação expirado</span>
        </div>

        <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6 max-w-4xl mx-auto">
          Seu acesso está temporariamente <span className="text-yellow-500">indisponível</span>
        </h1>

        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          O período de avaliação deste tenant expirou.
          {tenantKey ? (
            <>
              {" "}
              Tenant: <span className="text-gray-200 font-mono">{tenantKey}</span>.
            </>
          ) : null}
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center w-full max-w-lg mx-auto">
          <Button
            size="lg"
            className="bg-yellow-500 hover:bg-yellow-400 text-black text-lg font-bold px-10 h-14 shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:shadow-[0_0_30px_rgba(234,179,8,0.5)] transition-all transform hover:-translate-y-1"
            onClick={() => (window.location.href = "https://portalrm.simpleit.app.br")}
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Voltar
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="border-gray-700 text-gray-300 hover:bg-white/5 hover:text-white hover:border-gray-500 text-lg px-8 h-14"
            onClick={() => (window.location.href = "mailto:suporte@simpleit.app.br")}
          >
            <HelpCircle className="mr-2 h-5 w-5" />
            Falar com Suporte
          </Button>
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/5 py-8 bg-[#09090b]/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} Portal RM - SimpleIT. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}

