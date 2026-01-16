import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AuthService } from "@/lib/auth";
import { EndpointService } from "@/lib/endpoint";
import { useToast } from "@/hooks/use-toast";
import { Building2, Loader2 } from "lucide-react";

interface Coligada {
  CODCOLIGADA: number;
  NOMEFANTASIA: string;
}

export function ColigadaSelector() {
  const [coligadas, setColigadas] = useState<Coligada[]>([]);
  const [selectedColigada, setSelectedColigada] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const saved = localStorage.getItem("selected_coligada");
      if (saved) {
        setSelectedColigada(saved);
      }
    } catch (error) {
      console.error("Erro ao recuperar coligada selecionada:", error);
    }
  }, []);

  useEffect(() => {
    const fetchColigadas = async () => {
      setLoading(true);
      try {
        const endpoint = await EndpointService.getDefaultEndpoint();
        const token = AuthService.getStoredToken();

        if (!token) return;

        const path = "/api/framework/v1/consultaSQLServer/RealizaConsulta/SIT.PORTALRM.003/1/T";
        const fullUrl = `/api/proxy?endpoint=${encodeURIComponent(endpoint)}&path=${encodeURIComponent(path)}&token=${encodeURIComponent(token.access_token)}`;

        const response = await fetch(fullUrl);
        if (!response.ok) throw new Error("Falha ao buscar coligadas");

        const data = await response.json();
        let items: Coligada[] = [];

        if (Array.isArray(data)) {
          items = data;
        } else if (data && typeof data === 'object') {
          items = [data as Coligada];
        }

        const filtered = items.filter((item: any) => 
          item.CODCOLIGADA !== undefined && 
          item.CODCOLIGADA !== null && 
          Number(item.CODCOLIGADA) !== 0
        );

        setColigadas(filtered);
        
        if (filtered.length > 0 && !selectedColigada) {
          setSelectedColigada(String(filtered[0].CODCOLIGADA));
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

  const handleChange = (value: string) => {
    setSelectedColigada(value);
    try {
      localStorage.setItem("selected_coligada", value);
    } catch (error) {
      console.error("Erro ao salvar coligada selecionada:", error);
    }
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
