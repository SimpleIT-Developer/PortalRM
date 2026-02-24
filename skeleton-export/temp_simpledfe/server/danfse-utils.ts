import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { parseStringPromise } from 'xml2js';

interface NFSeData {
  numeroNfse: string;
  dataEmissao: string;
  prestador: {
    razaoSocial: string;
    nomeFantasia?: string;
    endereco: string;
    cidade: string;
    uf: string;
    cep: string;
    cnpj: string;
    inscricaoMunicipal: string;
    email?: string;
    telefone?: string;
  };
  tomador: {
    razaoSocial: string;
    endereco?: string;
    cidade?: string;
    uf?: string;
    cep?: string;
    cnpjCpf?: string;
    inscricaoEstadual?: string;
    email?: string;
    telefone?: string;
  };
  servico: {
    discriminacao: string;
    valorServico: number;
    aliquotaIss: number;
    valorIss: number;
    baseCalculo: number;
    itemListaServico: string;
    codigoTributacaoMunicipio?: string;
  };
  tributos: {
    inss: number;
    ir: number;
    csll: number;
    cofins: number;
    pis: number;
    valorLiquido: number;
  };
  codigoVerificacao?: string;
  municipio: string;
}

async function parseNFSeXML(xmlContent: string): Promise<NFSeData> {
  try {
    // Limpar e validar o XML
    let cleanXml = xmlContent.trim();
    
    // Verificar se o conteúdo está codificado em base64
    if (!cleanXml.startsWith('<')) {
      try {
        // Tentar decodificar se estiver em base64
        cleanXml = Buffer.from(cleanXml, 'base64').toString('utf-8');
        console.log('XML decodificado de base64');
      } catch (e) {
        console.log('Não foi possível decodificar base64, tentando como texto puro');
      }
    }
    
    // Remover caracteres de controle e BOM
    cleanXml = cleanXml.replace(/^\uFEFF/, ''); // Remove BOM
    cleanXml = cleanXml.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''); // Remove caracteres de controle
    
    // Verificar se ainda não é XML válido
    if (!cleanXml.includes('<')) {
      throw new Error('Conteúdo não parece ser XML válido');
    }
    
    console.log('XML limpo, primeiros 200 caracteres:', cleanXml.substring(0, 200));
    
    const parsed = await parseStringPromise(cleanXml, { explicitArray: false });
    
    // Navegação pela estrutura XML da NFSe (pode variar por município)
    let nfse = parsed;
    
    // Tenta diferentes estruturas de XML comuns
    if (parsed.CompNfse) {
      nfse = parsed.CompNfse.Nfse || parsed.CompNfse;
    } else if (parsed.ConsultarNfseResposta) {
      nfse = parsed.ConsultarNfseResposta.ListaNfse?.CompNfse?.Nfse || parsed.ConsultarNfseResposta;
    } else if (parsed.GerarNfseResposta) {
      nfse = parsed.GerarNfseResposta.ListaNfse?.CompNfse?.Nfse || parsed.GerarNfseResposta;
    }

    const infNfse = nfse.InfNfse || nfse;
    const identificacao = infNfse.IdentificacaoNfse || infNfse.Numero || {};
    const prestadorServico = infNfse.PrestadorServico || infNfse.Prestador || {};
    const tomadorServico = infNfse.TomadorServico || infNfse.Tomador || {};
    const servico = infNfse.Servico || infNfse.DeclaracaoServico || {};
    const valores = servico.Valores || servico;

    return {
      numeroNfse: identificacao.Numero || identificacao.NumeroNfse || '0',
      dataEmissao: infNfse.DataEmissao || new Date().toISOString().split('T')[0],
      prestador: {
        razaoSocial: prestadorServico.RazaoSocial || prestadorServico.Nome || 'PRESTADOR NÃO INFORMADO',
        nomeFantasia: prestadorServico.NomeFantasia,
        endereco: `${prestadorServico.Endereco?.Endereco || ''}, ${prestadorServico.Endereco?.Numero || ''} - ${prestadorServico.Endereco?.Bairro || ''}`,
        cidade: prestadorServico.Endereco?.Cidade || '',
        uf: prestadorServico.Endereco?.Uf || '',
        cep: prestadorServico.Endereco?.Cep || '',
        cnpj: prestadorServico.CpfCnpj?.Cnpj || prestadorServico.Cnpj || '',
        inscricaoMunicipal: prestadorServico.InscricaoMunicipal || '',
        email: prestadorServico.Contato?.Email,
        telefone: prestadorServico.Contato?.Telefone
      },
      tomador: {
        razaoSocial: tomadorServico.RazaoSocial || tomadorServico.Nome || 'TOMADOR NÃO INFORMADO',
        endereco: tomadorServico.Endereco ? `${tomadorServico.Endereco.Endereco || ''}, ${tomadorServico.Endereco.Numero || ''} - ${tomadorServico.Endereco.Bairro || ''}` : '',
        cidade: tomadorServico.Endereco?.Cidade || '',
        uf: tomadorServico.Endereco?.Uf || '',
        cep: tomadorServico.Endereco?.Cep || '',
        cnpjCpf: tomadorServico.CpfCnpj?.Cnpj || tomadorServico.CpfCnpj?.Cpf || tomadorServico.Cnpj || tomadorServico.Cpf || '',
        inscricaoEstadual: tomadorServico.InscricaoEstadual,
        email: tomadorServico.Contato?.Email,
        telefone: tomadorServico.Contato?.Telefone
      },
      servico: {
        discriminacao: servico.Discriminacao || 'SERVIÇO NÃO DISCRIMINADO',
        valorServico: parseFloat(valores.ValorServicos || valores.ValorTotal || '0'),
        aliquotaIss: parseFloat(valores.Aliquota || '0'),
        valorIss: parseFloat(valores.ValorIss || '0'),
        baseCalculo: parseFloat(valores.BaseCalculo || valores.ValorServicos || '0'),
        itemListaServico: servico.ItemListaServico || valores.ItemListaServico || '',
        codigoTributacaoMunicipio: servico.CodigoTributacaoMunicipio
      },
      tributos: {
        inss: parseFloat(valores.ValorInss || '0'),
        ir: parseFloat(valores.ValorIr || '0'),
        csll: parseFloat(valores.ValorCsll || '0'),
        cofins: parseFloat(valores.ValorCofins || '0'),
        pis: parseFloat(valores.ValorPis || '0'),
        valorLiquido: parseFloat(valores.ValorLiquidoNfse || valores.ValorLiquido || valores.ValorServicos || '0')
      },
      codigoVerificacao: infNfse.CodigoVerificacao,
      municipio: prestadorServico.Endereco?.Cidade || 'Município não informado'
    };
  } catch (error) {
    console.error('Erro ao fazer parse do XML NFSe:', error);
    throw new Error('Erro ao processar XML da NFSe');
  }
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { 
    style: 'currency', 
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatCNPJCPF(doc: string): string {
  if (!doc) return '';
  
  const numbers = doc.replace(/\D/g, '');
  
  if (numbers.length === 11) {
    // CPF
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  } else if (numbers.length === 14) {
    // CNPJ
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  
  return doc;
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
  } catch {
    return dateStr;
  }
}

export async function generateDANFSE(xmlContent: string): Promise<{ success: boolean, pdfPath?: string, error?: string }> {
  try {
    console.log('Gerando DANFSe para XML de tamanho:', xmlContent.length);
    
    const nfseData = await parseNFSeXML(xmlContent);
    
    const tempDir = os.tmpdir();
    const pdfPath = path.join(tempDir, `danfse_${Date.now()}.pdf`);
    
    const doc = new PDFDocument({ 
      size: 'A4',
      margins: { top: 20, bottom: 20, left: 20, right: 20 }
    });
    
    doc.pipe(fs.createWriteStream(pdfPath));
    
    // Borda externa
    doc.rect(30, 30, 535, 782).stroke();
    
    // Seção superior com logo e título
    let currentY = 40;
    
    // Logo placeholder (lado esquerdo)
    doc.rect(40, currentY, 60, 60).stroke();
    doc.fontSize(8).text('LOGO', 65, currentY + 25, { align: 'center' });
    
    // Título central
    doc.fontSize(16).fillColor('#000000')
       .text('NOTA FISCAL DE SERVIÇOS ELETRÔNICA - NFSe', 110, currentY + 5, { width: 300, align: 'center' });
    
    doc.fontSize(12)
       .text(`Prefeitura Municipal de ${nfseData.municipio}`, 110, currentY + 25, { width: 300, align: 'center' });
    
    doc.fontSize(10)
       .text('SECRETARIA MUNICIPAL DE FAZENDA E FINANÇAS', 110, currentY + 42, { width: 300, align: 'center' });
    
    // QR Code placeholder (lado direito)
    doc.rect(480, currentY, 75, 60).stroke();
    doc.fontSize(8).text('QR CODE', 507, currentY + 25, { align: 'center' });
    
    // Código de verificação abaixo do QR Code
    doc.fontSize(8).text(`Código de Verificação para Autenticação: ${nfseData.codigoVerificacao || 'sem15ol890s01ca805z61'}`, 420, currentY + 65, { width: 135, align: 'center' });
    
    currentY = 120;
    
    // Tabela de informações do cabeçalho
    const headerTableY = currentY;
    
    // Primeira linha do cabeçalho
    doc.rect(40, headerTableY, 525, 15).stroke();
    const col1Width = 125, col2Width = 125, col3Width = 125, col4Width = 50, col5Width = 50, col6Width = 45;
    let headerColX = 40;
    
    // Divisões verticais da primeira linha
    doc.moveTo(headerColX + col1Width, headerTableY).lineTo(headerColX + col1Width, headerTableY + 15).stroke();
    headerColX += col1Width;
    doc.moveTo(headerColX + col2Width, headerTableY).lineTo(headerColX + col2Width, headerTableY + 15).stroke();
    headerColX += col2Width;
    doc.moveTo(headerColX + col3Width, headerTableY).lineTo(headerColX + col3Width, headerTableY + 15).stroke();
    headerColX += col3Width;
    doc.moveTo(headerColX + col4Width, headerTableY).lineTo(headerColX + col4Width, headerTableY + 15).stroke();
    headerColX += col4Width;
    doc.moveTo(headerColX + col5Width, headerTableY).lineTo(headerColX + col5Width, headerTableY + 15).stroke();
    
    // Cabeçalhos da primeira linha
    doc.fontSize(7).fillColor('#000000');
    doc.text('Data de Emissão', 45, headerTableY + 2);
    doc.text('Exigibilidade do ISS', 170, headerTableY + 2);
    doc.text('Regime Tributário', 295, headerTableY + 2);
    doc.text('Número RPS', 425, headerTableY + 2);
    doc.text('Série', 475, headerTableY + 2);
    doc.text('Nº da Nota Fiscal', 500, headerTableY + 2);
    
    // Valores da primeira linha
    doc.fontSize(8);
    doc.text(formatDate(nfseData.dataEmissao), 45, headerTableY + 8);
    doc.text('Exigível no Município', 170, headerTableY + 8);
    doc.text('Tributação Normal', 295, headerTableY + 8);
    doc.text('PAGEAD', 425, headerTableY + 8);
    doc.text('', 475, headerTableY + 8);
    doc.text(nfseData.numeroNfse, 500, headerTableY + 8);
    
    // Segunda linha do cabeçalho
    currentY = headerTableY + 15;
    doc.rect(40, currentY, 525, 15).stroke();
    
    // Divisões da segunda linha
    doc.moveTo(40 + 175, currentY).lineTo(40 + 175, currentY + 15).stroke();
    doc.moveTo(40 + 350, currentY).lineTo(40 + 350, currentY + 15).stroke();
    
    doc.fontSize(7);
    doc.text('Tipo de Recolhimento', 45, currentY + 2);
    doc.text('Local de Prestação', 220, currentY + 2);
    
    doc.fontSize(8);
    doc.text('Simples Nacional', 45, currentY + 8);
    doc.text('Não Retido', 125, currentY + 8);
    doc.text('Não Optante', 220, currentY + 8);
    doc.text('No Município', 295, currentY + 8);
    
    currentY += 15;
    
    // PRESTADOR
    doc.rect(40, currentY, 525, 15).fill('#e6e6e6').stroke();
    doc.fontSize(10).fillColor('#000000').text('PRESTADOR', 45, currentY + 4);
    
    currentY += 15;
    doc.rect(40, currentY, 525, 60).stroke();
    
    doc.fontSize(9).fillColor('#000000');
    doc.text(`Razão Social: ${nfseData.prestador.razaoSocial}`, 45, currentY + 5);
    doc.fontSize(8);
    doc.text(`Nome Fantasia:`, 45, currentY + 18);
    doc.text(`Endereço: ${nfseData.prestador.endereco}`, 45, currentY + 28);
    doc.text(`Cidade: ${nfseData.prestador.cidade} - ${nfseData.prestador.uf} - CEP: ${nfseData.prestador.cep}`, 45, currentY + 38);
    doc.text(`E-mail: ${nfseData.prestador.email || 'email@email.com'} - Fone: ${nfseData.prestador.telefone || ''} - Celular: - Site:`, 45, currentY + 48);
    doc.text(`Inscrição Estadual: - Inscrição Municipal: ${nfseData.prestador.inscricaoMunicipal} - CPF/CNPJ: ${formatCNPJCPF(nfseData.prestador.cnpj)}`, 45, currentY + 58);
    
    currentY += 75;
    
    // TOMADOR
    doc.rect(40, currentY, 525, 15).fill('#e6e6e6').stroke();
    doc.fontSize(10).fillColor('#000000').text('TOMADOR', 45, currentY + 4);
    
    currentY += 15;
    doc.rect(40, currentY, 525, 45).stroke();
    
    doc.fontSize(9);
    doc.text(`Razão Social: ${nfseData.tomador.razaoSocial}`, 45, currentY + 5);
    doc.fontSize(8);
    doc.text(`Endereço: ${nfseData.tomador.endereco || ''} - CEP: ${nfseData.tomador.cep || ''}`, 45, currentY + 18);
    doc.text(`E-mail: ${nfseData.tomador.email || ''} - Fone: ${nfseData.tomador.telefone || ''} - Celular:`, 45, currentY + 28);
    doc.text(`Inscrição Estadual: ${nfseData.tomador.inscricaoEstadual || ''} - CPF/CNPJ: ${formatCNPJCPF(nfseData.tomador.cnpjCpf || '')}`, 45, currentY + 38);
    
    currentY += 60;
    
    // SERVIÇO
    doc.rect(40, currentY, 525, 15).fill('#e6e6e6').stroke();
    doc.fontSize(10).fillColor('#000000').text('SERVIÇO', 45, currentY + 4);
    
    currentY += 15;
    doc.rect(40, currentY, 525, 60).stroke();
    
    doc.fontSize(8).text(`${nfseData.servico.itemListaServico} - ${nfseData.servico.discriminacao}`, 45, currentY + 10, {
      width: 515,
      align: 'left'
    });
    
    currentY += 75;
    
    // DISCRIMINAÇÃO DOS SERVIÇOS
    doc.rect(40, currentY, 525, 15).fill('#e6e6e6').stroke();
    doc.fontSize(10).fillColor('#000000').text('DISCRIMINAÇÃO DOS SERVIÇOS', 45, currentY + 4);
    
    currentY += 15;
    doc.rect(40, currentY, 525, 120).stroke();
    doc.fontSize(8).text('DIGITE AQUI A DISCRIMINAÇÃO DOS SERVIÇOS DA NOTA FISCAL', 45, currentY + 10);
    
    currentY += 135;
    
    // Tabela de valores
    const tableY = currentY;
    const colWidths = [85, 85, 85, 85, 85, 85];
    const colX = [50, 135, 220, 305, 390, 475];
    
    // Cabeçalho da tabela
    doc.rect(50, tableY, 510, 20).stroke();
    const headers = ['VALOR SERVIÇO (R$)', 'DEDUÇÕES (R$)', 'DESC. INCOD. (R$)', 'BASE DE CÁLCULO (R$)', 'ALÍQUOTA (%)', 'ISS (R$)'];
    
    doc.fontSize(8).fillColor(primaryColor);
    headers.forEach((header, i) => {
      doc.text(header, colX[i] + 5, tableY + 6, { width: colWidths[i] - 10, align: 'center' });
    });
    
    // Valores da tabela
    doc.rect(50, tableY + 20, 510, 20).stroke();
    const values = [
      formatCurrency(nfseData.servico.valorServico),
      '0,00',
      '0,00',
      formatCurrency(nfseData.servico.baseCalculo),
      nfseData.servico.aliquotaIss.toFixed(2),
      formatCurrency(nfseData.servico.valorIss)
    ];
    
    values.forEach((value, i) => {
      doc.text(value, colX[i] + 5, tableY + 26, { width: colWidths[i] - 10, align: 'center' });
    });
    
    currentY = tableY + 50;
    
    // Segunda linha de tabelas
    const table2Headers = ['INSS (R$)', 'IR (R$)', 'CSLL (R$)', 'COFINS (R$)', 'PIS (R$)', 'DESCONTOS DIVERSOS (R$)', 'VALOR LÍQUIDO (R$)'];
    const table2ColWidths = [73, 73, 73, 73, 73, 73, 73];
    const table2ColX = [50, 123, 196, 269, 342, 415, 488];
    
    // Cabeçalho
    doc.rect(50, currentY, 510, 15).fill('#f0f0f0').stroke();
    doc.fontSize(8).text('DEMONSTRATIVO DOS TRIBUTOS FEDERAIS', 60, currentY + 4);
    
    currentY += 15;
    doc.rect(50, currentY, 510, 20).stroke();
    
    table2Headers.slice(0, 6).forEach((header, i) => {
      doc.text(header, table2ColX[i] + 2, currentY + 6, { width: table2ColWidths[i] - 4, align: 'center' });
    });
    
    // Valores
    doc.rect(50, currentY + 20, 510, 20).stroke();
    const table2Values = [
      formatCurrency(nfseData.tributos.inss),
      formatCurrency(nfseData.tributos.ir),
      formatCurrency(nfseData.tributos.csll),
      formatCurrency(nfseData.tributos.cofins),
      formatCurrency(nfseData.tributos.pis),
      '0,00'
    ];
    
    table2Values.forEach((value, i) => {
      doc.text(value, table2ColX[i] + 2, currentY + 26, { width: table2ColWidths[i] - 4, align: 'center' });
    });
    
    // Valor Líquido (separado)
    doc.rect(488, currentY, 72, 40).stroke();
    doc.text('VALOR LÍQUIDO (R$)', 490, currentY + 6, { width: 68, align: 'center' });
    doc.fontSize(10).text(formatCurrency(nfseData.tributos.valorLiquido), 490, currentY + 26, { width: 68, align: 'center' });
    
    currentY += 50;
    
    // OUTRAS INFORMAÇÕES
    doc.rect(50, currentY, 510, 15).fill('#f0f0f0').stroke();
    doc.fontSize(10).fillColor(primaryColor).text('OUTRAS INFORMAÇÕES', 60, currentY + 4);
    
    currentY += 15;
    doc.rect(50, currentY, 510, 30).stroke();
    doc.fontSize(8).text('Valor Líquido = Valor Serviço - INSS - IR - CSLL - COFINS - PIS - Descontos Diversos - ISS Retido - Desconto Incondicional', 60, currentY + 10);
    
    currentY += 40;
    
    // Footer
    doc.fontSize(8).text(`Consulte a autenticidade deste documento acessando o site https://www.pmvc.ba.gov.br`, 50, currentY + 10, { align: 'center' });
    
    if (nfseData.codigoVerificacao) {
      doc.text(`Código de Verificação: ${nfseData.codigoVerificacao}`, 50, currentY + 25, { align: 'center' });
    }
    
    doc.end();
    
    // Aguarda a conclusão da escrita do arquivo
    await new Promise((resolve, reject) => {
      doc.on('end', resolve);
      doc.on('error', reject);
    });
    
    console.log('DANFSe gerado com sucesso:', pdfPath);
    
    const stats = fs.statSync(pdfPath);
    console.log('Tamanho do arquivo PDF:', stats.size, 'bytes');
    
    return {
      success: true,
      pdfPath: pdfPath
    };
    
  } catch (error) {
    console.error('Erro ao gerar DANFSe:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao gerar DANFSe'
    };
  }
}