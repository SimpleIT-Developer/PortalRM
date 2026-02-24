// ERP Configuration Settings
// This file contains all ERP-related configurations for easy maintenance

export const ERP_CONFIG = {
  // SOAP Service Configuration
  SOAP_ENDPOINT: "https://legiaoda142256.rm.cloudtotvs.com.br:8051/wsDataServer/IwsDataServer",
  
  // Authentication Settings
  AUTH: {
    USERNAME: "mfavoreto",
    PASSWORD: "@n@R@quel110987"
  },
  
  // ReceitaWS API for CNPJ lookup
  RECEITA_WS_API: "https://www.receitaws.com.br/v1/cnpj",
  
  // Default values for SOAP request
  DEFAULTS: {
    CODCOLIGADA: "1",
    PAGREC: "2", // 2 for suppliers
    ATIVO: "1",
    LIMITECREDITO: "0",
    VALOROP1: "0",
    VALOROP2: "0", 
    VALOROP3: "0",
    PATRIMONIO: "0",
    NUMFUNCIONARIOS: "0",
    PAIS: "BRASIL",
    CONTRIBUINTE: "0",
    CFOIMOB: "0",
    VALFRETE: "0",
    TPTOMADOR: "0",
    CONTRIBUINTEISS: "0",
    NUMDEPENDENTES: "0",
    USUARIOALTERACAO: "MARILDA",
    ORGAOPUBLICO: "0",
    VROUTRASDEDUCOESIRRF: "0",
    CODRECEITA: "0000",
    RAMOATIV: "4",
    OPTANTEPELOSIMPLES: "1",
    TIPORUA: "1",
    TIPOBAIRRO: "14",
    REGIMEISS: "N",
    RETENCAOISS: "0",
    USUARIOCRIACAO: "srvtotvsautboffice",
    PORTE: "3",
    TIPOOPCOMBUSTIVEL: "3",
    IDPAIS: "1",
    NACIONALIDADE: "0",
    CALCULAAVP: "0",
    RECCREATEDBY: "srvtotvsautboffice",
    RECMODIFIEDBY: "srvtotvsautboffice",
    TIPORENDIMENTO: "000",
    FORMATRIBUTACAO: "00",
    SITUACAONIF: "0",
    ISTOTVSMESSAGE: "0",
    INOVAR_AUTO: "0",
    APLICFORMULA: "F",
    CODCFOCOLINTEGRACAO: "0",
    DIGVERIFICDEBAUTOMATICO: "1",
    ENTIDADEEXECUTORAPAA: "0",
    APOSENTADOOUPENSIONISTA: "0",
    SOCIOCOOPERADO: "0",
    NAOUSARCALCSIMPIRPF: "NUNCA"
  }
};