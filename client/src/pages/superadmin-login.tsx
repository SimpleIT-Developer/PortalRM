import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Lock, UserCog } from "lucide-react";
import { AnimatedLogo } from "@/components/simpledfe/animated-logo";

export default function SuperAdminLoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/superadmin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error("Credenciais inválidas");
      }

      toast({ title: "Acesso liberado", description: "Bem-vindo ao Superadmin." });
      setLocation("/superadmin/tenants");
    } catch (err) {
      toast({
        title: "Erro no login",
        description: "Verifique suas credenciais.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col font-sans selection:bg-yellow-500/30">
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-yellow-600/10 rounded-full blur-[120px] mix-blend-screen animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[150px] mix-blend-screen"></div>
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
      </header>

      <main className="flex-1 container mx-auto px-6 flex items-center justify-center py-20 relative z-10">
        <div className="w-full max-w-md border border-white/10 bg-white/[0.03] backdrop-blur rounded-2xl p-8 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
              <UserCog className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Superadmin</h1>
              <p className="text-sm text-gray-400">Gerencie tenants e contratos.</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-gray-300">E-mail</label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="seu@email.com"
                className="bg-black/30 border-white/10 text-white"
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-300">Senha</label>
              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="••••••••"
                className="bg-black/30 border-white/10 text-white"
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Autenticando...
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Entrar
                </>
              )}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}

