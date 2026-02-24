import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User, Lock, ArrowRight } from "lucide-react";
import { AnimatedLogo } from "@/components/simpledfe/animated-logo";
import { AuthService } from "@/lib/auth";
import { getTenant } from "@/lib/tenant";

export default function AdminLoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/tenant/login", {
          method: "POST",
          headers: { 
              "Content-Type": "application/json",
              ...(getTenant() ? { 'X-Tenant': getTenant()! } : {})
          },
          body: JSON.stringify({ email: username, password })
      });

      if (!response.ok) {
          throw new Error("Credenciais inválidas");
      }

      const data = await response.json();
      
      // Store user session
      localStorage.setItem("portal_user", JSON.stringify(data));

      toast({
        title: "Login realizado",
        description: "Bem-vindo ao Portal RM.",
      });
      setLocation("/tenant-settings");
    } catch (error) {
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
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-yellow-500/10 rounded-full blur-[120px] mix-blend-screen animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-yellow-600/5 rounded-full blur-[150px] mix-blend-screen pointer-events-none"></div>

      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="flex flex-col items-center space-y-2">
          <div className="p-3 bg-yellow-500/10 rounded-2xl border border-yellow-500/20 mb-4">
            <AnimatedLogo className="h-10 w-10 text-yellow-500" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Portal RM <span className="text-yellow-500">Admin</span></h1>
          <p className="text-gray-400">Entre com suas credenciais de administrador.</p>
        </div>

        <div className="bg-[#121214] border border-white/5 rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Usuário</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input 
                  placeholder="Seu usuário" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-9 bg-[#1c1c1f] border-gray-800 focus:border-yellow-500 focus:ring-yellow-500/20 transition-all h-11" 
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input 
                  type="password" 
                  placeholder="******" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 bg-[#1c1c1f] border-gray-800 focus:border-yellow-500 focus:ring-yellow-500/20 transition-all h-11" 
                />
              </div>
            </div>

            <Button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold h-11 text-base shadow-lg shadow-yellow-500/20" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Entrar no Sistema"}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/5 text-center">
            <p className="text-sm text-gray-400 mb-3">Não tem uma conta?</p>
            <Button 
              variant="outline" 
              className="w-full border-gray-700 text-gray-300 hover:bg-white/5 hover:text-white hover:border-gray-500"
              onClick={() => setLocation("/register")}
            >
              Criar Conta <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
