import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface LogItem {
  sentence: string;
  status: 'ok' | 'error';
  message?: string;
}

interface LogData {
  timestamp: string;
  items: LogItem[];
}

export default function LoginLogPage() {
  const [logData, setLogData] = useState<LogData | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('startup_check_log');
      if (saved) {
        setLogData(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Erro ao carregar log", e);
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-medium text-foreground">Log de Verificação de Login</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Consulte as sentenças SQL verificadas no último login
        </p>
      </div>

      {!logData ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            Nenhum log de verificação encontrado.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className="mr-2 h-5 w-5 text-primary" />
                  Resumo da Verificação
                </div>
                <Badge variant="outline">
                  {format(new Date(logData.timestamp), "dd 'de' MMMM 'às' HH:mm:ss", { locale: ptBR })}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-muted rounded-lg">
                      <div className="text-sm text-muted-foreground">Total Verificado</div>
                      <div className="text-2xl font-bold text-foreground">{logData.items.length}</div>
                  </div>
                  <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                      <div className="text-sm text-green-600 dark:text-green-400">Sucesso</div>
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {logData.items.filter(i => i.status === 'ok').length}
                      </div>
                  </div>
                  <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                      <div className="text-sm text-red-600 dark:text-red-400">Erros</div>
                      <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                          {logData.items.filter(i => i.status === 'error').length}
                      </div>
                  </div>
               </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">Detalhes por Sentença</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sentença</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Mensagem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logData.items.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-mono text-sm">
                          {item.sentence}
                      </TableCell>
                      <TableCell>
                        {item.status === 'ok' ? (
                          <div className="flex items-center text-green-600 dark:text-green-400">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            <span>OK</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-red-600 dark:text-red-400">
                            <AlertCircle className="h-4 w-4 mr-2" />
                            <span>Erro</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.message || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
