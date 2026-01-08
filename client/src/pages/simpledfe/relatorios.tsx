import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
// import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/ui/date-input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  FileBarChart, 
  Download, 
  Calendar, 

  Building2, 
  Receipt, 
  FileCheck, 
  TrendingUp,
  TrendingDown,
  Filter,
  RefreshCw,
  DollarSign,
  FileText,
  Printer
} from "lucide-react";
import { addDays, format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

// Função para formatar data local sem conversão de timezone
const formatDateLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function RelatoriosPage() {
  const [selectedReport, setSelectedReport] = useState("");
  const [dataInicial, setDataInicial] = useState("");
  const [dataFinal, setDataFinal] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("all");
  const [isGenerating, setIsGenerating] = useState(false);

  // Buscar empresas para o filtro
  const { data: companiesData } = useQuery({
    queryKey: ["/api/dashboard/cnpj-ativos"],
  });

  // Buscar estatísticas dos relatórios
  const { data: statsData } = useQuery({
    queryKey: ["/api/relatorios/stats"],
  });

  const companies = Array.isArray(companiesData) ? companiesData : [];
  const stats = statsData || {
    nfeEsteMes: 0,
    nfseEsteMes: 0,
    empresasAtivas: 0,
    crescimento: 0,
    crescimentoPositivo: true
  };

  const reportTypes = [
    {
      id: "nfe-summary",
      title: "Resumo de NFe",
      description: "Relatório consolidado de notas fiscais eletrônicas recebidas",
      icon: Receipt,
      color: "text-blue-500",
    },
    {
      id: "nfse-summary", 
      title: "Resumo de NFSe",
      description: "Relatório consolidado de notas fiscais de serviços recebidas",
      icon: FileCheck,
      color: "text-green-500",
    },
    {
      id: "nfse-tributos",
      title: "Relatórios de Tributos NFSe",
      description: "Análise detalhada de tributos e impostos das NFSe recebidas",
      icon: DollarSign,
      color: "text-red-500",
    },
    {
      id: "companies-activity",
      title: "Atividade por Empresa",
      description: "Análise de documentos recebidos por empresa",
      icon: Building2,
      color: "text-purple-500",
    },
    {
      id: "monthly-trends",
      title: "Tendências Mensais",
      description: "Análise de tendências de recebimento de documentos",
      icon: TrendingUp,
      color: "text-orange-500",
    },
    {
      id: "nfe-export-xml",
      title: "Exportação XML NFe",
      description: "Download em lote dos XMLs de NFe por período e empresa",
      icon: FileText,
      color: "text-purple-500",
    },
    {
      id: "nfe-export-danfe",
      title: "Exportação DANFE NFe",
      description: "Download em lote dos DANFEs de NFe por período e empresa",
      icon: Printer,
      color: "text-indigo-500",
    },
    {
      id: "nfse-export-xml",
      title: "Exportação XML NFSe",
      description: "Download em lote dos XMLs de NFSe por período e empresa",
      icon: FileText,
      color: "text-cyan-500",
    },
    {
      id: "nfse-export-danfse",
      title: "Exportação DANFSe NFSe",
      description: "Download em lote das DANFSe por período e empresa",
      icon: Printer,
      color: "text-teal-500",
    },
  ];

  const handleGenerateExcel = async () => {
    if (!selectedReport) {
      return;
    }

    setIsGenerating(true);
    
    try {
      let apiUrl = '';
      let filename = '';
      
      if (selectedReport === 'nfe-summary') {
        apiUrl = '/api/relatorios/nfe-resumo-excel';
        filename = `relatorio-nfe-${dataInicial}-${dataFinal}.xlsx`;
      } else if (selectedReport === 'nfse-summary') {
        apiUrl = '/api/relatorios/nfse-resumo-excel';
        filename = `relatorio-nfse-${dataInicial}-${dataFinal}.xlsx`;
      } else {
        throw new Error('Tipo de relatório não suporta Excel');
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          dataInicial: dataInicial,
          dataFinal: dataFinal,
          empresa: selectedCompany
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao gerar relatório Excel');
      }

      // Download do arquivo Excel
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Erro ao gerar Excel:', error);
      alert('Erro ao gerar relatório Excel. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedReport) {
      return;
    }

    setIsGenerating(true);
    
    try {
      if (selectedReport === 'nfe-summary') {
        // Gerar relatório de NFe
        const response = await fetch('/api/relatorios/nfe-resumo', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          },
          body: JSON.stringify({
            dataInicial: dataInicial,
            dataFinal: dataFinal,
            empresa: selectedCompany
          })
        });

        if (!response.ok) {
          throw new Error('Erro ao gerar relatório');
        }

        const data = await response.json();
        
        if (data.success && data.pdf) {
          // Converter base64 para blob
          const binaryString = window.atob(data.pdf);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: 'application/pdf' });
          
          // Abrir PDF em nova aba
          const url = window.URL.createObjectURL(blob);
          window.open(url, '_blank');
          
          // Cleanup
          setTimeout(() => window.URL.revokeObjectURL(url), 100);
        } else {
          throw new Error('Formato de resposta inválido');
        }
      } else if (selectedReport === 'nfse-summary') {
        // Gerar relatório de NFSe
        const response = await fetch('/api/relatorios/nfse-resumo', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          },
          body: JSON.stringify({
            dataInicial: dataInicial,
            dataFinal: dataFinal,
            empresa: selectedCompany
          })
        });

        if (!response.ok) {
          throw new Error('Erro ao gerar relatório');
        }

        const data = await response.json();
        
        if (data.success && data.pdf) {
          // Converter base64 para blob
          const binaryString = window.atob(data.pdf);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: 'application/pdf' });
          
          // Abrir PDF em nova aba
          const url = window.URL.createObjectURL(blob);
          window.open(url, '_blank');
          
          // Cleanup
          setTimeout(() => window.URL.revokeObjectURL(url), 100);
        } else {
          throw new Error('Formato de resposta inválido');
        }
      } else if (selectedReport === 'nfse-tributos') {
        // Gerar relatório de tributos NFSe
        const response = await fetch('/api/relatorios/nfse-tributos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          },
          body: JSON.stringify({
            dataInicial: dataInicial,
            dataFinal: dataFinal,
            empresa: selectedCompany
          })
        });

        if (!response.ok) {
          throw new Error('Erro ao gerar relatório');
        }

        const data = await response.json();
        
        if (data.success && data.pdf) {
          // Converter base64 para blob
          const binaryString = window.atob(data.pdf);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: 'application/pdf' });
          
          // Abrir PDF em nova aba
          const url = window.URL.createObjectURL(blob);
          window.open(url, '_blank');
          
          // Cleanup
          setTimeout(() => window.URL.revokeObjectURL(url), 100);
        } else {
          throw new Error('Formato de resposta inválido');
        }
      } else if (selectedReport === 'nfe-export-xml') {
        // Exportação XML NFe
        const response = await fetch('/api/relatorios/nfe-export-xml', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            dataInicial: dataInicial,
            dataFinal: dataFinal,
            empresa: selectedCompany
          })
        });

        if (!response.ok) {
          throw new Error('Erro ao exportar XMLs');
        }

        // Criar blob para download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'xml_nfe.zip';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

      } else if (selectedReport === 'nfe-export-danfe') {
        // Exportação DANFE NFe
        const response = await fetch('/api/relatorios/nfe-export-danfe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            dataInicial: dataInicial,
            dataFinal: dataFinal,
            empresa: selectedCompany
          })
        });

        if (!response.ok) {
          throw new Error('Erro ao exportar DANFEs');
        }

        // Criar blob para download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'danfe_nfe.zip';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

      } else if (selectedReport === 'nfse-export-xml') {
        // Exportação XML NFSe
        const response = await fetch('/api/relatorios/nfse-export-xml', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            dataInicial: dataInicial,
            dataFinal: dataFinal,
            empresa: selectedCompany
          })
        });

        if (!response.ok) {
          throw new Error('Erro ao exportar XMLs NFSe');
        }

        // Criar blob para download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'xml_nfse.zip';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

      } else if (selectedReport === 'nfse-export-danfse') {
        // Exportação DANFSe NFSe
        const response = await fetch('/api/relatorios/nfse-export-danfse', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            dataInicial: dataInicial,
            dataFinal: dataFinal,
            empresa: selectedCompany
          })
        });

        if (!response.ok) {
          throw new Error('Erro ao exportar DANFSe NFSe');
        }

        // Criar blob para download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'danfse_nfse.zip';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

      } else {
        // Outros tipos de relatório (simulação)
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log("Gerando relatório:", {
          type: selectedReport,
          dataInicial,
          dataFinal,
          company: selectedCompany,
        });
      }
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      alert('Erro ao gerar relatório. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };



  return (
    <div className="space-y-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Relatórios</h2>
            <p className="text-gray-400">
              Gere relatórios detalhados sobre documentos fiscais
            </p>
          </div>
          <Badge variant="secondary" className="text-primary">
            {reportTypes.length} tipos disponíveis
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tipos de Relatórios */}
          <div className="lg:col-span-2">
            <Card className="glassmorphism border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <FileBarChart className="w-5 h-5" />
                  <span>Tipos de Relatórios</span>
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Selecione o tipo de relatório que deseja gerar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reportTypes.map((report) => {
                    const IconComponent = report.icon;
                    return (
                      <div
                        key={report.id}
                        className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:scale-105 ${
                          selectedReport === report.id
                            ? "border-primary bg-primary/10"
                            : "border-white/20 bg-white/5 hover:bg-white/10"
                        }`}
                        onClick={() => setSelectedReport(report.id)}
                      >
                        <div className="flex items-start space-x-3">
                          <IconComponent className={`w-6 h-6 ${report.color} mt-1`} />
                          <div className="flex-1">
                            <h3 className="text-white font-medium mb-1">
                              {report.title}
                            </h3>
                            <p className="text-gray-400 text-sm">
                              {report.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtros e Configurações */}
          <div className="space-y-6">
            <Card className="glassmorphism border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Filter className="w-5 h-5" />
                  <span>Filtros</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Período */}
                <div>
                  <Label className="text-white mb-2 block">Período</Label>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-gray-300 text-sm mb-1 block">Data Inicial</Label>
                      <DateInput
                        placeholder="Data Inicial"
                        value={dataInicial}
                        onChange={setDataInicial}
                      />
                    </div>
                    
                    <div>
                      <Label className="text-gray-300 text-sm mb-1 block">Data Final</Label>
                      <DateInput
                        placeholder="Data Final"
                        value={dataFinal}
                        onChange={setDataFinal}
                      />
                    </div>
                  </div>
                </div>

                {/* Empresa */}
                <div>
                  <Label className="text-white mb-2 block">Empresa</Label>
                  <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="Selecionar empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as empresas</SelectItem>
                      {companies.map((company: any) => (
                        <SelectItem key={company.cnpj} value={company.cnpj}>
                          {company.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Ações */}
            <Card className="glassmorphism border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Gerar Relatório</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={handleGenerateReport}
                  disabled={!selectedReport || isGenerating}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      {selectedReport === 'nfe-export-xml' || selectedReport === 'nfe-export-danfe' || 
                       selectedReport === 'nfse-export-xml' || selectedReport === 'nfse-export-danfse'
                        ? 'Gerar Arquivo'
                        : 'Gerar PDF'
                      }
                    </>
                  )}
                </Button>

                {/* Botão Excel para relatórios NFe e NFSe */}
                {(selectedReport === 'nfe-summary' || selectedReport === 'nfse-summary') && (
                  <Button
                    onClick={handleGenerateExcel}
                    disabled={!selectedReport || isGenerating}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <FileBarChart className="w-4 h-4 mr-2" />
                        Gerar Excel
                      </>
                    )}
                  </Button>
                )}
                
                <p className="text-xs text-gray-400 text-center">
                  O relatório será baixado automaticamente
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Estatísticas Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="glassmorphism border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Receipt className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-gray-400 text-sm">NFe este mês</p>
                  <p className="text-white text-xl font-bold">{stats.nfeEsteMes}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glassmorphism border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <FileCheck className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-gray-400 text-sm">NFSe este mês</p>
                  <p className="text-white text-xl font-bold">{stats.nfseEsteMes}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glassmorphism border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Building2 className="w-8 h-8 text-purple-500" />
                <div>
                  <p className="text-gray-400 text-sm">Empresas ativas</p>
                  <p className="text-white text-xl font-bold">{stats.empresasAtivas}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glassmorphism border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                {stats.crescimentoPositivo ? (
                  <TrendingUp className="w-8 h-8 text-green-500" />
                ) : (
                  <TrendingDown className="w-8 h-8 text-red-500" />
                )}
                <div>
                  <p className="text-gray-400 text-sm">
                    {stats.crescimentoPositivo ? 'Crescimento' : 'Baixa'}
                  </p>
                  <p className={`text-xl font-bold ${stats.crescimentoPositivo ? 'text-green-400' : 'text-red-400'}`}>
                    {stats.crescimentoPositivo ? '+' : ''}{stats.crescimento}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
