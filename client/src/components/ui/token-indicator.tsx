import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AuthService, type StoredToken } from "@/lib/auth";
import { RefreshCw, Clock, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TokenIndicatorProps {
  token: StoredToken;
  onTokenRefresh?: (newToken: StoredToken) => void;
}

export function TokenIndicator({ token, onTokenRefresh }: TokenIndicatorProps) {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isExpiringSoon, setIsExpiringSoon] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const updateTimeLeft = () => {
      if (!token.expires_at) {
        setTimeLeft("--");
        return;
      }

      const now = Date.now();
      const expiresAt = new Date(token.expires_at).getTime();
      const diff = expiresAt - now;

      if (diff <= 0) {
        setTimeLeft("Expirado");
        setIsExpiringSoon(true);
        return;
      }

      // Marcar como expirando em breve se restam menos de 10 minutos
      setIsExpiringSoon(diff < 10 * 60 * 1000);

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`);
      } else if (minutes > 0) {
        setTimeLeft(`${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${seconds}s`);
      }
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [token.expires_at]);

  const handleRefresh = async () => {
    try {
      console.log("TokenIndicator: Iniciando renovação de token...");
      const newToken = await AuthService.renewTokenWithToast(setIsRefreshing);
      
      if (newToken) {
        console.log("TokenIndicator: Token renovado com sucesso");
        // Notifica o componente pai sobre a atualização
        onTokenRefresh?.(newToken);
        
        // Recarrega a página para garantir que todos os componentes usem o token atualizado
        console.log("TokenIndicator: Recarregando página...");
        window.location.reload();
      } else {
        console.warn("TokenIndicator: Falha ao renovar token");
      }
    } catch (error) {
      console.error("TokenIndicator: Erro ao renovar token:", error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao renovar o token. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const getBadgeVariant = () => {
    if (timeLeft === "Expirado") return "destructive";
    if (isExpiringSoon) return "secondary";
    return "outline";
  };

  const getIcon = () => {
    if (timeLeft === "Expirado" || isExpiringSoon) {
      return <AlertTriangle className="h-3 w-3" />;
    }
    return <Clock className="h-3 w-3" />;
  };

  return (
    <div className="flex items-center space-x-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={getBadgeVariant()} className="text-xs px-2 py-1 cursor-help">
            {getIcon()}
            <span className="ml-1">{timeLeft}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Tempo restante do token</p>
          {token.expires_at && (
            <p className="text-xs text-muted-foreground">
              Expira em: {new Date(token.expires_at).toLocaleString()}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
      
      {/* Só mostrar o botão de renovar se o token não estiver expirado */}
      {timeLeft !== "Expirado" && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-6 w-6 p-0"
            >
              <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Renovar token</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}