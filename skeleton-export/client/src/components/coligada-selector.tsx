import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AuthService } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Building2, Loader2 } from "lucide-react";
import { getTenant } from "@/lib/tenant";

interface Coligada {
  CODCOLIGADA: number;
  NOMEFANTASIA: string;
}

interface ColigadaSelectorProps {
  value?: string;
  onChange?: (value: string) => void;
}

export function ColigadaSelector({ value, onChange }: ColigadaSelectorProps = {}) {
  const [coligadas, setColigadas] = useState<Coligada[]>([]);
  const [internalValue, setInternalValue] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const isControlled = value !== undefined;
  const selectedColigada = isControlled ? value : internalValue;

  useEffect(() => {
    if (isControlled) return;
    try {
      const saved = localStorage.getItem("selected_coligada");
      if (saved) {
        setInternalValue(saved);
      }
    } catch (error) {
      console.error("Erro ao recuperar coligada selecionada:", error);
    }
  }, [isControlled]);

  useEffect(() => {
    const fetchColigadas = async () => {
      setLoading(true);
      try {
        const token = AuthService.getStoredToken();

        if (!token || !token.environmentId) return;

        const path = "/api/framework/v1/consultaSQLServer/RealizaConsulta/SIT.PORTALRM.003/1/T";
        const fullUrl = `/api/proxy?environmentId=${encodeURIComponent(token.environmentId)}&path=${encodeURIComponent(path)}&token=${encodeURIComponent(token.access_token)}`;

        const response = await fetch(fullUrl, {
          headers: {
            ...(getTenant() ? { 'X-Tenant': getTenant()! } : {})
          }
        });
        if (!response.ok) throw new Error("Falha ao buscar coligadas");

        const data = await response.json();
        let items: Coligada[] = [];

        if (Array.isArray(data)) {
          items = data;
        } else if (data && Array.isArray(data.data)) {
          items = data.data;
        } else if (data && typeof data === 'object') {
          // Fallback para quando retorna um único objeto que pode ser a coligada
          if (data.CODCOLIGADA) {
             items = [data as Coligada];
          }
        }

        const filtered = items.filter((item: any) => 
          item.CODCOLIGADA !== undefined && 
          item.CODCOLIGADA !== null && 
          Number(item.CODCOLIGADA) !== 0
        );

        setColigadas(filtered);
        
        if (filtered.length > 0 && !selectedColigada) {
            const firstValue = String(filtered[0].CODCOLIGADA);
            if (!isControlled) {
                setInternalValue(firstValue);
                try {
                    localStorage.setItem("selected_coligada", firstValue);
                } catch {}
            }
            onChange?.(firstValue);
        }

      } catch (error) {
        console.error("Erro ao carregar coligadas:", error);
        toast({
            title: "Erro",
            description: "Não foi possível carregar as coligadas.",
            variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchColigadas();
  }, []); // Executa apenas na montagem

  const handleChange = (newValue: string) => {
    if (!isControlled) {
      setInternalValue(newValue);
      try {
        localStorage.setItem("selected_coligada", newValue);
      } catch (error) {
        console.error("Erro ao salvar coligada selecionada:", error);
      }
    }
    onChange?.(newValue);
  };

  return (
    <div className="w-[200px] md:w-[280px]">
      <Select value={selectedColigada} onValueChange={handleChange} disabled={loading}>
        <SelectTrigger className="h-9 bg-background">
          <div className="flex items-center gap-2 truncate">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <Building2 className="h-4 w-4 text-muted-foreground" />
            )}
            <SelectValue placeholder={loading ? "Carregando..." : "Selecione a Coligada"} />
          </div>
        </SelectTrigger>
        <SelectContent>
          {coligadas.length === 0 && !loading ? (
            <div className="p-2 text-sm text-muted-foreground text-center">
              Nenhuma coligada encontrada
            </div>
          ) : (
            coligadas.map((coligada) => (
              <SelectItem key={coligada.CODCOLIGADA} value={String(coligada.CODCOLIGADA)}>
                <div className="flex items-center gap-2 w-full">
                  <span className="font-mono font-medium text-xs bg-muted px-1.5 py-0.5 rounded">
                    {coligada.CODCOLIGADA}
                  </span>
                  <span className="truncate">{coligada.NOMEFANTASIA}</span>
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
