import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Trash2, ChevronDown, ChevronUp, Copy, Check, RefreshCw } from "lucide-react";
import { LogService, LogEntry } from "@/lib/log-service";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";

export default function ConciliationLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const { toast } = useToast();
  
  const loadLogs = () => {
    setLogs(LogService.getLogs());
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleClearLogs = () => {
    LogService.clearLogs();
    setLogs([]);
    toast({
      title: "Logs limpos",
      description: "Todos os logs foram removidos com sucesso.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Logs de Conciliação</h2>
          <p className="text-muted-foreground">
            Visualize os detalhes técnicos das operações de conciliação bancária.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadLogs}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
          <Button variant="destructive" onClick={handleClearLogs}>
            <Trash2 className="mr-2 h-4 w-4" />
            Limpar Logs
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-200px)] rounded-md border p-4">
        {logs.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            Nenhum log registrado.
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <LogItem key={log.id} log={log} />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

function LogItem({ log }: { log: LogEntry }) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className={log.type === 'error' ? 'border-red-200 bg-red-50 dark:bg-red-900/10' : ''}>
      <CardHeader className="p-4">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant={log.type === 'error' ? 'destructive' : log.type === 'success' ? 'default' : 'secondary'}>
                {log.type.toUpperCase()}
              </Badge>
              <span className="font-semibold">{log.title}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {new Date(log.timestamp).toLocaleString()}
            </p>
          </div>
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
        </div>
        {log.details && (
          <p className="text-sm mt-2 text-foreground/80 break-words">
            {log.details}
          </p>
        )}
      </CardHeader>
      
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleContent>
          <CardContent className="p-4 pt-0 space-y-4">
            {log.request && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-semibold">Request</h4>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6" 
                    onClick={() => copyToClipboard(log.request || '')}
                  >
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
                <pre className="bg-muted p-2 rounded-md text-xs overflow-x-auto max-h-60">
                  {log.request}
                </pre>
              </div>
            )}
            
            {log.response && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-semibold">Response</h4>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6" 
                    onClick={() => copyToClipboard(log.response || '')}
                  >
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
                <pre className="bg-muted p-2 rounded-md text-xs overflow-x-auto max-h-60">
                  {log.response}
                </pre>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
